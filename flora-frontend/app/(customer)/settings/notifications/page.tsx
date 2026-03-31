"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Mail, MessageSquare, Smartphone, 
  CheckCircle2, Loader2, Sparkles, ArrowLeft,
  ChevronRight, Circle, Trash2, Settings,
  Volume2, ShieldCheck, Heart, ShoppingBag
} from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api/client';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationPreference {
  channel: 'sms' | 'email' | 'push' | 'marketing';
  is_enabled: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    isLoading: isInboxLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<'inbox' | 'preferences'>('inbox');

  const { data: preferences = [], isLoading: isPrefsLoading, refetch: refetchPrefs } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications/preferences');
      // If empty, provide default structure as per P4 fix note
      if (!data || data.length === 0) {
        return [
          { channel: 'sms', is_enabled: true },
          { channel: 'email', is_enabled: true },
          { channel: 'push', is_enabled: true },
          { channel: 'marketing', is_enabled: false },
        ] as NotificationPreference[];
      }
      return data as NotificationPreference[];
    }
  });

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ channel, is_enabled }: NotificationPreference) => {
      return apiClient.put('/notifications/preferences', { channel, is_enabled });
    },
    onMutate: async (newPref) => {
      await queryClient.cancelQueries({ queryKey: ['notification-preferences'] });
      const previous = queryClient.getQueryData(['notification-preferences']);
      queryClient.setQueryData(['notification-preferences'], (old: any) => 
        old?.map((p: any) => p.channel === newPref.channel ? newPref : p)
      );
      return { previous };
    },
    onError: (err, newPref, context) => {
      queryClient.setQueryData(['notification-preferences'], context?.previous);
      toast.error(`Failed to update ${newPref.channel} preference`);
    },
    onSuccess: () => {
      toast.success('Preference updated');
      refetchPrefs();
    }
  });

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    // Contextual navigation
    if (notification.context_id) {
       if (notification.type.includes('order')) router.push(`/orders/${notification.context_id}`);
       else if (notification.type.includes('product')) router.push(`/products/${notification.context_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <div className="container mx-auto px-6 max-w-4xl pt-12 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/dashboard')} 
                className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
              >
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-1">
                 <div className="flex items-center gap-2 text-rose mb-1">
                    <Bell className="w-4 h-4 animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Stay Updated</span>
                 </div>
                 <h1 className="text-3xl font-display font-bold text-bark">Notifications</h1>
              </div>
           </div>
           
           <div className="flex p-1.5 bg-white/50 backdrop-blur-md rounded-2xl shadow-inner border border-mist-dark/10 min-w-[300px]">
              {[
                { id: 'inbox', label: `Inbox (${unreadCount})`, icon: <Bell className="w-4 h-4" /> },
                { id: 'preferences', label: 'Preferences', icon: <Settings className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all",
                    activeTab === tab.id 
                      ? "bg-white text-bark shadow-sm ring-1 ring-mist-dark/10" 
                      : "text-bark/40 hover:text-rose hover:bg-rose/5"
                  )}
                >
                   {tab.icon} {tab.label}
                </button>
              ))}
           </div>
        </header>

        <AnimatePresence mode="wait">
           {activeTab === 'inbox' ? (
              <motion.section 
                key="inbox"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                 <div className="flex items-center justify-between mb-4 px-2">
                    <p className="text-xs font-black uppercase tracking-widest text-bark/30">
                       Recent Activity
                    </p>
                    <button 
                      onClick={() => markAllAsRead()}
                      className="text-[10px] font-black uppercase tracking-widest text-rose hover:underline flex items-center gap-1.5"
                    >
                       <CheckCircle2 className="w-3.5 h-3.5" /> Mark all as read
                    </button>
                 </div>

                 <div className="space-y-4">
                    {notifications.length > 0 ? (
                       notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={cn(
                              "group p-6 rounded-[2.5rem] border transition-all cursor-pointer flex gap-5 items-start relative overflow-hidden",
                              notification.is_read 
                                ? "bg-white/40 border-mist-dark/10 text-bark/50" 
                                : "bg-white border-rose/30 shadow-soft ring-2 ring-rose/5"
                            )}
                          >
                             {!notification.is_read && (
                                <div className="absolute top-0 right-0 p-4">
                                   <Circle className="w-2.5 h-2.5 fill-rose text-rose animate-pulse" />
                                </div>
                             )}
                             <div className={cn(
                                "p-4 rounded-2xl shrink-0 transition-all",
                                notification.is_read ? "bg-mist/50 text-bark/20" : "bg-rose/10 text-rose group-hover:bg-rose group-hover:text-white"
                             )}>
                                {notification.type.includes('order') ? <ShoppingBag className="w-6 h-6" /> : 
                                 notification.type.includes('promo') ? <Sparkles className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                             </div>
                             <div className="flex-1 space-y-1">
                                <h4 className={cn("text-lg font-bold tracking-tight", !notification.is_read ? "text-bark" : "text-bark/60")}>
                                   {notification.title}
                                </h4>
                                <p className="text-sm leading-relaxed max-w-2xl">{notification.message}</p>
                                <p className="text-[10px] font-black uppercase tracking-tighter text-bark/30 pt-2 flex items-center gap-2">
                                   {new Date(notification.created_at).toLocaleDateString()} • {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   {notification.is_read && <span className="flex items-center gap-1 text-green-600/50"><CheckCircle2 className="w-3 h-3" /> Seen</span>}
                                </p>
                             </div>
                             <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-rose" />
                          </div>
                       ))
                    ) : (
                       <div className="py-24 text-center space-y-4 opacity-50 bg-white/20 border-2 border-dashed border-mist-dark/10 rounded-[4rem]">
                          <Bell className="w-16 h-16 mx-auto text-bark/10" />
                          <p className="font-bold text-bark">Your inbox is clear</p>
                          <p className="text-sm max-w-xs mx-auto">We'll let you know when something important happens with your orders or account.</p>
                       </div>
                    )}
                 </div>
              </motion.section>
           ) : (
              <motion.section 
                key="preferences"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                 <div className="bg-white rounded-[3rem] p-10 shadow-soft border border-mist-dark/10 space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 blur-3xl rounded-full -mr-24 -mt-24" />
                    
                    <div className="space-y-2 relative z-10">
                       <h3 className="text-2xl font-display font-bold text-bark">Notification Channels</h3>
                       <p className="text-sm text-muted-foreground max-w-md">Customize how and where you want to receive updates from Flora.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 relative z-10">
                       {[
                         { id: 'email', label: 'Email Notifications', desc: 'Order summaries and important receipts', icon: <Mail className="w-5 h-5" /> },
                         { id: 'sms', label: 'SMS Updates', desc: 'Real-time delivery progress on your mobile', icon: <MessageSquare className="w-5 h-5" /> },
                         { id: 'push', label: 'Web Push', desc: 'Live alerts in your browser dashboard', icon: <Smartphone className="w-5 h-5" /> },
                         { id: 'marketing', label: 'Marketing & Style', desc: 'New collections and exclusive boutique offers', icon: <Sparkles className="w-5 h-5 text-rose" /> },
                       ].map((channel) => (
                          <div key={channel.id} className="flex items-center justify-between p-6 bg-mist/20 rounded-[2rem] border border-transparent hover:border-mist-dark/20 transition-all group">
                             <div className="flex items-center gap-5">
                                <div className="p-4 bg-white rounded-2xl shadow-sm text-bark/40 group-hover:text-rose transition-colors">
                                   {channel.icon}
                                </div>
                                <div className="space-y-0.5">
                                   <p className="font-bold text-bark">{channel.label}</p>
                                   <p className="text-[11px] font-medium text-muted-foreground">{channel.desc}</p>
                                </div>
                             </div>
                             
                             <button
                               onClick={() => {
                                 const current = preferences.find(p => p.channel === channel.id);
                                 updatePreferenceMutation.mutate({ 
                                   channel: channel.id as any, 
                                   is_enabled: !current?.is_enabled 
                                 });
                               }}
                               className={cn(
                                 "w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner",
                                 preferences.find(p => p.channel === channel.id)?.is_enabled 
                                   ? "bg-rose" : "bg-bark/10"
                               )}
                             >
                                <div className={cn(
                                  "absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300",
                                  preferences.find(p => p.channel === channel.id)?.is_enabled 
                                    ? "left-7" : "left-1"
                                )} />
                             </button>
                          </div>
                       ))}
                    </div>

                    <div className="pt-8 border-t border-mist-dark/10 flex items-center gap-4 text-bark/30 px-2">
                       <ShieldCheck className="w-5 h-5 text-green-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Your privacy is shielded. We never sell your data.</span>
                    </div>
                 </div>

                 {/* Extra Card */}
                 <div className="bg-bark text-white rounded-[3rem] p-10 shadow-premium relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose/20 blur-2xl rounded-full -mr-16 -mt-16" />
                    <div className="relative z-10 flex gap-6 items-start">
                       <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                          <Volume2 className="w-6 h-6 text-rose" />
                       </div>
                       <div className="space-y-2">
                          <h4 className="text-xl font-display font-bold">Quiet Hours</h4>
                          <p className="text-white/60 text-sm font-medium">
                             Regardless of your settings, we avoid sending marketing SMS between 22:00 and 08:00 local time.
                          </p>
                       </div>
                    </div>
                 </div>
              </motion.section>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Global query client for the mutator
import { QueryClient } from '@tanstack/react-query';
const queryClient = new QueryClient();
