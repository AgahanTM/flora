"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Calendar, Heart, Gift, 
  ArrowRight, Loader2, Sparkles, 
  ArrowLeft, Bell, BellRing, Trash2,
  Clock, PartyPopper, Cake, Star, SearchX,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { apiClient } from '@/lib/api/client';
import { SavedOccasion, Occasion } from '@/lib/types/occasion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function OccasionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [occasionId, setOccasionId] = useState('');
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [date, setDate] = useState('');
  const [reminderDays, setReminderDays] = useState('3');

  const { data: occasions = [] } = useQuery({
    queryKey: ['occasions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/occasions');
      return data as Occasion[];
    }
  });

  const { data: savedOccasions = [], isLoading, refetch } = useQuery({
    queryKey: ['saved-occasions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/saved-occasions');
      return data as SavedOccasion[];
    }
  });

  const addOccasionMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/saved-occasions', {
        occasion_id: occasionId,
        title: title || occasions.find(o => o.id === occasionId)?.name,
        recipient_name: recipientName,
        date: date,
        reminders_enabled: true,
        days_before_reminder: parseInt(reminderDays)
      });
    },
    onSuccess: () => {
      toast.success('Occasion added to your calendar!');
      setIsModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add occasion');
    }
  });

  const deleteOccasionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/saved-occasions/${id}`);
    },
    onSuccess: () => {
      toast.success('Occasion removed');
      refetch();
    }
  });

  const resetForm = () => {
    setOccasionId('');
    setTitle('');
    setRecipientName('');
    setDate('');
    setReminderDays('3');
  };

  const calculateDaysAway = (occDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = parseISO(occDate);
    target.setHours(0, 0, 0, 0);
    
    // If passed this year, show for next year (Simplified logic for recurring)
    // Actually for MVP, we just show raw diff if it's in the future
    return differenceInDays(target, today);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-cream/30">
        <Loader2 className="w-12 h-12 text-rose animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <div className="container mx-auto px-6 max-w-5xl pt-12 space-y-12">
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
                    <Heart className="w-4 h-4 fill-rose" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Personal Calendar</span>
                 </div>
                 <h1 className="text-3xl font-display font-bold text-bark">Saved Occasions</h1>
              </div>
           </div>
           
           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger render={
                 <Button className="h-14 rounded-2xl bg-rose hover:bg-rose/90 text-white px-8 font-bold gap-3 shadow-xl shadow-rose/20 group">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    Add Occasion
                 </Button>
              } />
              <DialogContent className="max-w-md rounded-[2.5rem] p-10 gap-8">
                 <DialogHeader className="gap-2 text-left">
                    <div className="flex items-center gap-3 text-rose mb-1">
                       <PartyPopper className="w-5 h-5" />
                       <span className="text-[10px] font-black uppercase tracking-widest">New Celebration</span>
                    </div>
                    <DialogTitle className="text-3xl font-display font-bold text-bark italic">Capture the Moment</DialogTitle>
                    <DialogDescription className="font-medium text-bark/50">Save a special date and we'll remind you to send love.</DialogDescription>
                 </DialogHeader>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1 flex items-center gap-2">
                          <Star className="w-3.5 h-3.5" /> Select Occasion
                       </label>
                       <Select onValueChange={setOccasionId} value={occasionId}>
                          <SelectTrigger className="h-14 rounded-2xl bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all font-medium">
                             <SelectValue placeholder="What are we celebrating?" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-mist-dark/10 shadow-premium">
                             {occasions.map(occ => (
                                <SelectItem key={occ.id} value={occ.id} className="rounded-xl focus:bg-rose/5 focus:text-rose py-3">
                                   {occ.name}
                                </SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1 flex items-center gap-2">
                          <Gift className="w-3.5 h-3.5" /> For Whom? (Recipient Name)
                       </label>
                       <Input 
                         placeholder="e.g. Grandma, Mom, Best Friend" 
                         value={recipientName}
                         onChange={(e) => setRecipientName(e.target.value)}
                         className="h-14 rounded-2xl bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all font-medium"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1 flex items-center gap-2">
                             <Calendar className="w-3.5 h-3.5" /> Event Date
                          </label>
                          <input 
                            type="date"
                            value={date}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full h-14 rounded-2xl bg-mist/30 px-4 text-sm border-transparent focus:bg-white focus:border-rose/30 transition-all font-medium outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1 flex items-center gap-2">
                             <BellRing className="w-3.5 h-3.5" /> Remind Before
                          </label>
                          <Select onValueChange={setReminderDays} value={reminderDays}>
                             <SelectTrigger className="h-14 rounded-2xl bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all font-medium">
                                <SelectValue placeholder="Days" />
                             </SelectTrigger>
                             <SelectContent className="rounded-2xl shrink-0">
                                <SelectItem value="1" className="rounded-xl">1 Day</SelectItem>
                                <SelectItem value="3" className="rounded-xl">3 Days</SelectItem>
                                <SelectItem value="7" className="rounded-xl">1 Week</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                    </div>
                 </div>

                 <DialogFooter>
                    <Button 
                      onClick={() => addOccasionMutation.mutate()}
                      disabled={!occasionId || !recipientName || !date || addOccasionMutation.isPending}
                      className="w-full h-14 rounded-2xl bg-rose hover:bg-rose/90 text-white font-bold text-lg shadow-xl shadow-rose/20"
                    >
                       {addOccasionMutation.isPending ? 'Saving...' : 'Save Occasion'}
                    </Button>
                 </DialogFooter>
              </DialogContent>
           </Dialog>
        </header>

        {savedOccasions.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                 {savedOccasions.map((occ) => {
                    const daysAway = calculateDaysAway(occ.date);
                    const isUrgent = daysAway >= 0 && daysAway < 7;
                    const occasionData = occasions.find(o => o.id === occ.occasion_id);
                    
                    return (
                       <motion.div 
                         key={occ.id}
                         layout
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         className="group bg-white rounded-[2.5rem] p-8 shadow-soft border border-mist-dark/10 hover:shadow-premium hover:border-mist-dark transition-all duration-500 relative overflow-hidden"
                       >
                          {/* Top Badge */}
                          <div className="flex justify-between items-start mb-6">
                             <div className="p-4 bg-mist/50 rounded-2xl text-bark group-hover:bg-rose group-hover:text-white transition-all duration-500">
                                {occ.title.toLowerCase().includes('birthday') ? <Cake className="w-6 h-6" /> : <PartyPopper className="w-6 h-6" />}
                             </div>
                             <button 
                               onClick={() => { if(confirm('Delete this occasion?')) deleteOccasionMutation.mutate(occ.id); }}
                               className="p-2 text-bark/10 hover:text-rose transition-colors"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>

                          <div className="space-y-4">
                             <div>
                                <h3 className="text-2xl font-display font-bold text-bark truncate">{occ.recipient_name}</h3>
                                <p className="text-xs font-black uppercase tracking-widest text-bark/30">{occ.title}</p>
                             </div>

                             <div className="flex items-center gap-6 py-2">
                                <div className="space-y-0.5">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Target Date</p>
                                   <p className="font-bold text-sm text-bark">{format(parseISO(occ.date), 'MMMM do')}</p>
                                </div>
                                <div className="w-px h-8 bg-bark/10" />
                                <div className="space-y-0.5">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Countdown</p>
                                   <p className={cn(
                                     "font-bold text-sm flex items-center gap-1.5",
                                     isUrgent ? "text-rose" : daysAway < 0 ? "text-bark/20" : "text-bark"
                                   )}>
                                      <Clock className="w-3.5 h-3.5" />
                                      {daysAway < 0 ? 'Passed' : daysAway === 0 ? 'Today!' : `${daysAway} days away`}
                                   </p>
                                </div>
                             </div>

                             <div className="pt-4 flex flex-col gap-3">
                                <Link href={`/gift-builder?occasion=${occasionData?.slug || 'flowers'}`}>
                                   <Button className="w-full h-12 rounded-xl bg-bark hover:bg-rose text-white font-bold gap-3 group/btn shadow-lg shadow-bark/5">
                                      Shop for {occ.recipient_name?.split(' ')[0] || 'Special One'}
                                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                   </Button>
                                </Link>
                             </div>
                          </div>
                          
                          {/* Urgent Glow */}
                          {isUrgent && (
                             <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-rose/0 via-rose to-rose/0 animate-pulse" />
                          )}
                       </motion.div>
                    );
                 })}
              </AnimatePresence>
           </div>
        ) : (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="flex flex-col items-center justify-center py-32 space-y-8 bg-white/50 border-2 border-dashed border-mist-dark/20 rounded-[4rem] text-center"
           >
              <div className="p-10 bg-white rounded-full shadow-premium text-bark/5 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-bark/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <Calendar className="w-24 h-24 transition-transform group-hover:scale-110 duration-700" />
              </div>
              <div className="space-y-2">
                 <h2 className="text-3xl font-display font-bold text-bark">Your calendar is <span className="text-rose">waiting...</span></h2>
                 <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
                    Never miss a birthday or anniversary again. Add your important dates and we'll help you prepare the perfect gift.
                 </p>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="h-16 rounded-[2rem] bg-bark hover:bg-rose text-white px-12 font-bold shadow-2xl shadow-bark/20 text-lg gap-3"
              >
                 Add Your First Occasion <Plus className="w-5 h-5" />
              </Button>
           </motion.div>
        )}

        {/* Calendar Insight */}
        <div className="bg-white rounded-[3rem] p-12 shadow-soft border border-mist-dark/10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-mist/50 blur-[100px] rounded-full -mr-32 -mt-32" />
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="p-6 bg-rose/5 rounded-[2.5rem] shrink-0">
                 <Bell className="w-12 h-12 text-rose" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-2xl font-display font-bold text-bark italic">Smart Reminders</h3>
                 <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed">
                    We'll send you an SMS and Email notification according to your preference for each occasion. This gives you enough time to browse the boutique and choose a delivery slot before they fill up.
                 </p>
                 <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Free Service</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Unsubscribe Anytime</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
