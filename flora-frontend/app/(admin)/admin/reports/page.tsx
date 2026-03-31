"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertTriangle, CheckCircle2, XCircle, 
  MessageSquare, Loader2, Search,
  Filter, Eye, User, Calendar,
  ArrowRight, ShieldAlert, Truck,
  PackageX, HelpCircle, History,
  FileText, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { adminApi } from '@/lib/api/admin';
import { IssueReport } from '@/lib/types/report';
import { IssueReportStatus } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<IssueReportStatus>(IssueReportStatus.OPEN);
  const [selectedReport, setSelectedReport] = useState<IssueReport | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-issue-reports', activeTab],
    queryFn: async () => {
      const { data } = await adminApi.getIssueReports(activeTab);
      return data as IssueReport[];
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string, status: string, note?: string }) => 
      adminApi.updateIssueReportStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issue-reports'] });
      setSelectedReport(null);
      setResolutionNote('');
      toast.success('Report updated successfully');
    }
  });

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'defective_product': return <ShieldAlert className="w-4 h-4" />;
      case 'late_delivery': return <Truck className="w-4 h-4" />;
      case 'wrong_item': return <PackageX className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const tabs = [
    { value: IssueReportStatus.OPEN, label: 'Open', color: 'text-rose bg-rose/10 border-rose/10' },
    { value: IssueReportStatus.INVESTIGATING, label: 'Investigating', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { value: IssueReportStatus.RESOLVED, label: 'Resolved', color: 'text-green-600 bg-green-50 border-green-100' },
    { value: IssueReportStatus.DISMISSED, label: 'Dismissed', color: 'text-bark/40 bg-mist border-mist-dark/10' },
  ];

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <AlertTriangle className="w-4 h-4" />
            Platform Integrity
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">Issue Triage</h1>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-mist/30 rounded-2xl">
           {tabs.map((tab) => (
             <button
               key={tab.value}
               onClick={() => setActiveTab(tab.value)}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === tab.value ? tab.color + " shadow-sm bg-white" : "text-bark/40 hover:text-bark"
               )}
             >
               {tab.label}
             </button>
           ))}
        </div>
      </header>

      {/* Reports Table */}
      <div className="bg-white rounded-[3rem] border border-mist-dark/10 shadow-premium overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-bark/30 border-b border-mist-dark/5">
                     <th className="px-8 py-6">Issue Details</th>
                     <th className="px-8 py-6">Target Entity</th>
                     <th className="px-8 py-6">Reporter</th>
                     <th className="px-8 py-6 text-right">Actions</th>
               </tr>
               </thead>
               <tbody className="divide-y divide-mist-dark/5">
                  {isLoading ? (
                    <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30 mx-auto" /></td></tr>
                  ) : reports && reports.length > 0 ? (
                    reports.map((report) => (
                      <tr key={report.id} className="group hover:bg-cream/20 transition-colors">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className={cn(
                                 "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                 activeTab === IssueReportStatus.OPEN ? "bg-rose/10 text-rose" : "bg-mist text-bark/20"
                               )}>
                                  {getIssueIcon(report.issue_type)}
                               </div>
                               <div className="max-w-xs">
                                  <p className="font-bold text-bark capitalize text-sm">{report.issue_type.replace(/_/g, ' ')}</p>
                                  <p className="text-[10px] font-medium text-bark/40 line-clamp-1 italic">{report.description}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-bark/30" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-bark">
                                     {report.order_id ? `Order #${report.order_id.slice(0, 8)}` : 
                                      report.product_id ? 'Product Node' : 'Review Context'}
                                  </span>
                               </div>
                               <p className="text-[10px] font-medium text-bark/40 italic lowercase">Ref: {report.id.slice(0, 8)}</p>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-bark/60 group-hover:text-rose transition-colors">
                               <User className="w-4 h-4" />
                               <span className="text-xs font-bold">{report.user?.full_name || 'Anonymous User'}</span>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <Button 
                              variant="ghost" 
                              onClick={() => setSelectedReport(report)}
                              className="h-10 px-4 rounded-xl font-bold bg-mist/30 hover:bg-rose hover:text-white group-hover:bg-white"
                            >
                               <Eye className="w-4 h-4 mr-2" /> Inspect
                            </Button>
                         </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="py-24 text-center font-display text-bark/20 italic">No reports found in this sector</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Inspect Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
             >
                {/* Left: Detail Sidebar */}
                <div className="w-full md:w-72 bg-mist/10 p-10 space-y-8 border-r border-mist-dark/5">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Case Lifecycle</p>
                      <div className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center",
                        tabs.find(t => t.value === selectedReport.status)?.color
                      )}>
                         {selectedReport.status}
                      </div>
                   </div>

                   <div className="space-y-4 pt-8 border-t border-mist-dark/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Meta Data</p>
                      <div className="space-y-3">
                         <div className="flex items-center gap-2 text-xs text-bark/60">
                            <Calendar className="w-3.5 h-3.5" /> {format(new Date(selectedReport.created_at), 'MMM dd, HH:mm')}
                         </div>
                         <div className="flex items-center gap-2 text-xs text-bark/60 font-bold">
                            <User className="w-3.5 h-3.5 text-rose" /> {selectedReport.user?.email}
                         </div>
                      </div>
                   </div>

                   {selectedReport.order_id && (
                     <Button 
                       variant="outline" 
                       className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2"
                       onClick={() => window.open(`/admin/orders/${selectedReport.order_id}`, '_blank')}
                     >
                        <ExternalLink className="w-3.5 h-3.5" /> View Order
                     </Button>
                   )}
                </div>

                {/* Right: Actions & Notes */}
                <div className="flex-1 p-10 space-y-8 overflow-y-auto">
                   <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-display font-bold text-bark italic">Investigation Hub</h4>
                      <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-mist rounded-xl transition-colors">
                         <XCircle className="w-6 h-6 text-bark/20" />
                      </button>
                   </div>

                   <div className="p-8 bg-mist/20 rounded-[2rem] border border-mist-dark/5 space-y-4">
                      <div className="flex items-center gap-2 text-rose font-black uppercase tracking-widest text-[9px]">
                         <MessageSquare className="w-3.5 h-3.5" /> Reporter's Narrative
                      </div>
                      <p className="text-sm font-medium text-bark italic leading-relaxed">"{selectedReport.description}"</p>
                   </div>

                   <div className="space-y-4 pt-8">
                      <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-2">Administrative Actions</p>
                      
                      {selectedReport.status === IssueReportStatus.OPEN && (
                        <Button 
                          onClick={() => updateMutation.mutate({ id: selectedReport.id, status: IssueReportStatus.INVESTIGATING })}
                          className="w-full h-14 rounded-2xl bg-amber-500 text-white font-bold gap-3 shadow-xl shadow-amber-500/20"
                        >
                           <ArrowRight className="w-5 h-5" /> Start Investigation
                        </Button>
                      )}

                      {(selectedReport.status === IssueReportStatus.OPEN || 
                        selectedReport.status === IssueReportStatus.INVESTIGATING) && (
                        <div className="space-y-4">
                           <Textarea 
                             placeholder="Document final resolution or dismissal rationale..."
                             className="min-h-[100px] rounded-2xl border-mist p-5 text-sm"
                             value={resolutionNote}
                             onChange={(e) => setResolutionNote(e.target.value)}
                           />
                           <div className="flex gap-4">
                              <Button 
                                onClick={() => updateMutation.mutate({ id: selectedReport.id, status: IssueReportStatus.RESOLVED, note: resolutionNote })}
                                disabled={!resolutionNote.trim()}
                                className="flex-1 h-14 rounded-2xl bg-green-600 text-white font-bold gap-3 shadow-xl shadow-green-600/20"
                              >
                                 <CheckCircle2 className="w-5 h-5" /> Resolve Case
                              </Button>
                              <Button 
                                onClick={() => updateMutation.mutate({ id: selectedReport.id, status: IssueReportStatus.DISMISSED, note: resolutionNote })}
                                disabled={!resolutionNote.trim()}
                                className="flex-1 h-14 rounded-2xl bg-bark text-white font-bold gap-3 shadow-xl shadow-bark/20"
                              >
                                 <XCircle className="w-5 h-5" /> Dismiss
                              </Button>
                           </div>
                        </div>
                      )}

                      {selectedReport.admin_note && (
                        <div className="p-8 bg-rose/5 rounded-[2rem] border border-rose/10 space-y-2">
                           <div className="flex items-center gap-2 text-rose font-black uppercase tracking-widest text-[9px]">
                              <History className="w-3.5 h-3.5" /> Resolution Proof
                           </div>
                           <p className="text-sm font-bold text-bark italic">"{selectedReport.admin_note}"</p>
                        </div>
                      )}
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
