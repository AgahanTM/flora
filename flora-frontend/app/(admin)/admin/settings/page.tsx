"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, ShieldCheck, History, 
  Search, Filter, Save, Edit3,
  RotateCcw, Info, Loader2,
  Lock, User, Globe, Server,
  Terminal, Activity, ChevronLeft,
  ChevronRight, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { adminApi } from '@/lib/api/admin';
import { SystemSetting, AdminLog } from '@/lib/types/admin_system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'system' | 'logs'>('system');
  const [page, setPage] = useState(1);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await adminApi.getSettings();
      return data as SystemSetting[];
    }
  });

  const { data: logRes, isLoading: isLogsLoading } = useQuery({
    queryKey: ['admin-logs', page],
    queryFn: async () => {
      const { data } = await adminApi.getLogs({ page, limit: 15 });
      return data as { data: AdminLog[], total: number };
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string, value: string }) => 
      adminApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setEditKey(null);
      toast.success('System configuration updated');
    }
  });

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <Server className="w-4 h-4" />
            Infrastructure & Oversight
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">System Governance</h1>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-mist/30 rounded-2xl">
           <button
             onClick={() => setActiveTab('system')}
             className={cn(
               "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'system' ? "bg-white text-rose shadow-sm" : "text-bark/40 hover:text-bark"
             )}
           >
             Platform Config
           </button>
           <button
             onClick={() => setActiveTab('logs')}
             className={cn(
               "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'logs' ? "bg-white text-rose shadow-sm" : "text-bark/40 hover:text-bark"
             )}
           >
             Audit Registry
           </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-white rounded-[3rem] border border-mist-dark/10 shadow-premium overflow-hidden">
         {activeTab === 'system' ? (
           <div className="space-y-8">
              <div className="p-8 border-b border-mist-dark/5 flex items-center justify-between bg-mist/5">
                 <div className="flex items-center gap-4">
                    <div className="bg-bark text-white p-3 rounded-xl shadow-lg shadow-bark/10">
                       <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-xl font-display font-bold text-bark italic">System Parameters</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 italic">High-Privilege Configuration Only</p>
                    </div>
                 </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {isSettingsLoading ? (
                   <div className="col-span-full py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30 mx-auto" /></div>
                 ) : settings?.map((setting) => (
                   <motion.div 
                     key={setting.key}
                     layout
                     className="bg-white rounded-[2.5rem] p-8 border border-mist-dark/10 shadow-soft group hover:shadow-premium transition-all relative overflow-hidden"
                   >
                      <div className="flex items-center justify-between mb-6">
                         <div className="w-12 h-12 rounded-2xl bg-mist flex items-center justify-center text-bark/20 group-hover:bg-rose/10 group-hover:text-rose transition-all">
                            <Settings className="w-6 h-6" />
                         </div>
                         {editKey === setting.key ? (
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => updateMutation.mutate({ key: setting.key, value: editValue })}
                                 className="p-2 bg-green-500 text-white rounded-xl shadow-lg ring-4 ring-green-100"
                               >
                                  <Save className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => setEditKey(null)}
                                 className="p-2 bg-mist text-bark/40 rounded-xl"
                               >
                                  <RotateCcw className="w-4 h-4" />
                               </button>
                            </div>
                         ) : (
                            <button 
                              onClick={() => {
                                setEditKey(setting.key);
                                setEditValue(setting.value);
                              }}
                              className="p-2.5 opacity-0 group-hover:opacity-100 bg-mist hover:bg-rose hover:text-white rounded-xl transition-all"
                            >
                               <Edit3 className="w-4 h-4" />
                            </button>
                         )}
                      </div>
                      
                      <div className="space-y-4">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 mb-1">{setting.key}</p>
                            {editKey === setting.key ? (
                               <Input 
                                 value={editValue}
                                 onChange={(e) => setEditValue(e.target.value)}
                                 className="h-10 bg-mist/5 font-bold"
                                 autoFocus
                               />
                            ) : (
                               <h4 className="text-lg font-bold text-bark group-hover:text-rose transition-colors break-all">{setting.value}</h4>
                            )}
                         </div>
                         <p className="text-[10px] font-medium text-bark/40 leading-relaxed italic line-clamp-2">{setting.description || 'Core platform baseline configuration parameter.'}</p>
                         <div className="pt-4 border-t border-mist-dark/5 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-bark/10" />
                            <span className="text-[9px] font-black tracking-widest text-bark/20 uppercase">Last Registry Sync: {format(new Date(setting.updated_at), 'MMM dd')}</span>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
         ) : (
           <div className="space-y-8">
              <div className="p-8 border-b border-mist-dark/5 flex items-center justify-between bg-mist/5">
                 <div className="flex items-center gap-4">
                    <div className="bg-bark text-white p-3 rounded-xl shadow-lg shadow-bark/10">
                       <History className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-xl font-display font-bold text-bark italic">Administrative Ledger</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 italic">Immutable Audit Trail of Platform Actions</p>
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="text-[10px] font-black uppercase tracking-widest text-bark/30 border-b border-mist-dark/5">
                          <th className="px-8 py-6">Operation</th>
                          <th className="px-8 py-6">Identity</th>
                          <th className="px-8 py-6">Evidence / Details</th>
                          <th className="px-8 py-6 text-right">Timestamp</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-mist-dark/5">
                       {isLogsLoading ? (
                         <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30 mx-auto" /></td></tr>
                       ) : logRes?.data && logRes.data.length > 0 ? (
                         logRes.data.map((log) => (
                           <tr key={log.id} className="group hover:bg-cream/20 transition-colors">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-mist flex items-center justify-center text-bark/30 group-hover:text-rose transition-colors">
                                       <Terminal className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-bark uppercase tracking-tighter">{log.action.replace(/_/g, ' ')}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-bark/30" />
                                    <span className="text-xs font-medium text-bark/60 italic lowercase">root@{log.admin_id.slice(0, 6)}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <p className="text-[10px] font-medium text-bark/40 italic truncate max-w-xs">{JSON.stringify(log.details)}</p>
                              </td>
                              <td className="px-8 py-6 text-right font-mono text-xs text-bark/30">
                                 {format(new Date(log.created_at), 'MM/dd HH:mm:ss')}
                              </td>
                           </tr>
                         ))
                       ) : (
                         <tr><td colSpan={4} className="py-24 text-center font-display text-bark/20 italic">No administrative actions logged in this block</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>

              {/* Pagination */}
              <div className="p-8 border-t border-mist-dark/5 flex items-center justify-between bg-mist/5">
                 <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Registry Block Scan: {logRes?.total || 0} Events Archived</p>
                 <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="h-10 px-4 rounded-xl font-bold"
                      disabled={page === 1}
                    >
                       <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div className="w-10 h-10 rounded-xl bg-white border border-mist-dark/10 flex items-center justify-center text-xs font-bold text-rose shadow-sm">
                       {page}
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => setPage(p => p + 1)}
                      className="h-10 px-4 rounded-xl font-bold"
                      disabled={logRes && (page * 15 >= logRes.total)}
                    >
                       Next <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                 </div>
              </div>
           </div>
         )}
      </div>

      <div className="p-10 bg-bark rounded-[3rem] text-white/50 text-center space-y-4 shadow-xl shadow-bark/20 border border-white/5">
         <Database className="w-10 h-10 mx-auto text-rose opacity-40" />
         <p className="text-sm font-display font-medium leading-relaxed italic max-w-2xl mx-auto">
           Governance settings affect platform-wide logic in real-time. Administrative logs are cryptographically sealed and archived for multi-year compliance.
         </p>
      </div>
    </div>
  );
}

