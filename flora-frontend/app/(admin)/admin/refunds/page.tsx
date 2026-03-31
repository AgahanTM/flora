"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RotateCcw, CheckCircle2, XCircle,
  Loader2, DollarSign, Calendar,
  User, ShoppingBag, AlertCircle,
  FileText, Clock, ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';
import { formatPrice } from '@/lib/utils/format';

interface Refund {
  id: string;
  payment_id: string;
  order_id: string;
  amount: string;
  reason?: string;
  status: string;
  requested_by: string;
  processed_by?: string;
  created_at: string;
  completed_at?: string;
  // Relations the backend may populate
  order?: { id: string; total_price: string; customer_id: string };
  requester?: { id: string; full_name: string; email: string };
}

const TABS = [
  { value: 'pending', label: 'Pending', color: 'text-amber-600 bg-amber-50' },
  { value: 'approved', label: 'Approved', color: 'text-green-600 bg-green-50' },
  { value: 'rejected', label: 'Rejected', color: 'text-rose bg-rose/10' },
  { value: 'completed', label: 'Completed', color: 'text-bark/40 bg-mist' },
];

export default function AdminRefundsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [processingNote, setProcessingNote] = useState('');

  const { data: refunds, isLoading } = useQuery({
    queryKey: ['admin-refunds', activeTab],
    queryFn: async () => {
      const { data } = await adminApi.getRefunds(activeTab);
      return data as Refund[];
    }
  });

  const processMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string, approve: boolean }) =>
      adminApi.processRefund(id, approve),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      setSelectedRefund(null);
      setProcessingNote('');
      toast.success('Refund processed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to process refund');
    }
  });

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <RotateCcw className="w-4 h-4" />
            Financial Operations
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">Refund Control</h1>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-mist/30 rounded-2xl">
          {TABS.map((tab) => (
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

      {/* Refunds Table */}
      <div className="bg-white rounded-[3rem] border border-mist-dark/10 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-bark/30 border-b border-mist-dark/5">
                <th className="px-8 py-6">Refund Details</th>
                <th className="px-8 py-6">Order Reference</th>
                <th className="px-8 py-6">Requester</th>
                <th className="px-8 py-6">Amount</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-dark/5">
              {isLoading ? (
                <tr><td colSpan={5} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30 mx-auto" /></td></tr>
              ) : refunds && refunds.length > 0 ? (
                refunds.map((refund) => (
                  <tr key={refund.id} className="group hover:bg-cream/20 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          activeTab === 'pending' ? "bg-amber-100 text-amber-600" :
                          activeTab === 'approved' ? "bg-green-100 text-green-600" :
                          activeTab === 'rejected' ? "bg-rose/10 text-rose" : "bg-mist text-bark/20"
                        )}>
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div className="max-w-xs">
                          <p className="font-bold text-bark text-sm">Refund #{refund.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-[10px] font-medium text-bark/40 line-clamp-1 italic">
                            {refund.reason || 'No reason specified'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-bark/30" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-bark">
                          #{refund.order_id.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-bark/60 group-hover:text-rose transition-colors">
                        <User className="w-4 h-4" />
                        <span className="text-xs font-bold">{refund.requester?.full_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-lg font-display font-bold text-rose italic">
                        {formatPrice(parseFloat(refund.amount))}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-bark/20 mr-2 italic">
                          {format(new Date(refund.created_at), 'MMM dd')}
                        </span>
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedRefund(refund)}
                          className="h-10 px-4 rounded-xl font-bold bg-mist/30 hover:bg-rose hover:text-white group-hover:bg-white"
                        >
                          {activeTab === 'pending' ? 'Process' : 'Details'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="py-24 text-center font-display text-bark/20 italic">No refund requests in this category</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process / Details Modal */}
      <AnimatePresence>
        {selectedRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Left: Refund Info */}
              <div className="w-full md:w-72 bg-mist/10 p-10 space-y-8 border-r border-mist-dark/5">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Refund Status</p>
                  <div className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center",
                    TABS.find(t => t.value === selectedRefund.status)?.color
                  )}>
                    {selectedRefund.status}
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-mist-dark/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Financial Data</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-bark/60">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(selectedRefund.created_at), 'MMM dd, HH:mm')}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-bark/60 font-bold">
                      <DollarSign className="w-3.5 h-3.5 text-rose" />
                      {formatPrice(parseFloat(selectedRefund.amount))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-bark/60">
                      <User className="w-3.5 h-3.5" />
                      {selectedRefund.requester?.full_name || 'Unknown'}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2"
                  onClick={() => window.open(`/admin/orders/${selectedRefund.order_id}`, '_blank')}
                >
                  <FileText className="w-3.5 h-3.5" /> View Order
                </Button>
              </div>

              {/* Right: Actions */}
              <div className="flex-1 p-10 space-y-8 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-display font-bold text-bark italic">Refund Processing</h4>
                  <button onClick={() => setSelectedRefund(null)} className="p-2 hover:bg-mist rounded-xl transition-colors">
                    <XCircle className="w-6 h-6 text-bark/20" />
                  </button>
                </div>

                {/* Reason */}
                <div className="p-8 bg-mist/20 rounded-[2rem] border border-mist-dark/5 space-y-4">
                  <div className="flex items-center gap-2 text-rose font-black uppercase tracking-widest text-[9px]">
                    <Sparkles className="w-3.5 h-3.5" /> Refund Reason
                  </div>
                  <p className="text-sm font-medium text-bark italic leading-relaxed">
                    "{selectedRefund.reason || 'No specific reason provided by the requester.'}"
                  </p>
                </div>

                {/* Actions for pending refunds */}
                {selectedRefund.status === 'pending' && (
                  <div className="space-y-4 pt-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-2">Administrative Decision</p>

                    <Textarea
                      placeholder="Optional processing note..."
                      className="min-h-[100px] rounded-2xl border-mist p-5 text-sm"
                      value={processingNote}
                      onChange={(e) => setProcessingNote(e.target.value)}
                    />

                    <div className="flex gap-4">
                      <Button
                        onClick={() => processMutation.mutate({ id: selectedRefund.id, approve: true })}
                        disabled={processMutation.isPending}
                        className="flex-1 h-14 rounded-2xl bg-green-600 text-white font-bold gap-3 shadow-xl shadow-green-600/20"
                      >
                        {processMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        Approve Refund
                      </Button>
                      <Button
                        onClick={() => processMutation.mutate({ id: selectedRefund.id, approve: false })}
                        disabled={processMutation.isPending}
                        className="flex-1 h-14 rounded-2xl bg-bark text-white font-bold gap-3 shadow-xl shadow-bark/20"
                      >
                        {processMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {/* Info for non-pending refunds */}
                {selectedRefund.status !== 'pending' && (
                  <div className="p-8 bg-rose/5 rounded-[2rem] border border-rose/10 space-y-2">
                    <div className="flex items-center gap-2 text-rose font-black uppercase tracking-widest text-[9px]">
                      <Clock className="w-3.5 h-3.5" /> Resolution Record
                    </div>
                    <p className="text-sm font-bold text-bark italic">
                      This refund has been {selectedRefund.status}.
                      {selectedRefund.completed_at && ` Finalized on ${format(new Date(selectedRefund.completed_at), 'MMM dd, yyyy')}.`}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
