"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, Landmark, History, 
  CheckCircle2, XCircle, AlertCircle, 
  Search, Filter, ExternalLink, 
  Clock, Package, User, ArrowUpRight,
  ShieldCheck, Loader2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

import { apiClient } from '@/lib/api/client';
import { adminApi } from '@/lib/api/admin';
import { BankTransferProof, Refund } from '@/lib/types/payment';
import { Order } from '@/lib/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'proofs' | 'refunds'>('proofs');
  const [rejectingProofId, setRejectingProofId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [fallbackMode, setFallbackMode] = useState(false);

  const { data: proofs, isLoading: isProofsLoading, error: proofsError } = useQuery({
    queryKey: ['admin-bank-proofs'],
    queryFn: async () => {
      try {
        const { data } = await adminApi.getBankProofs();
        setFallbackMode(false);
        return data as BankTransferProof[];
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Rule #17 Fallback
          setFallbackMode(true);
          const { data } = await apiClient.get('/admin/orders?payment=bank_transfer&status=pending');
          // Map orders to a compatible proof shape for display
          return (data as Order[]).map(o => ({
            id: `fallback-${o.id}`,
            payment_id: o.id, // using order id as lookup
            image_url: '', 
            status: 'pending',
            uploaded_at: o.created_at,
            _isFallback: true,
            _order: o
          })) as any[];
        }
        throw err;
      }
    }
  });

  const { data: refunds, isLoading: isRefundsLoading } = useQuery({
    queryKey: ['admin-refunds'],
    queryFn: async () => {
      const { data } = await adminApi.getRefunds();
      return data as Refund[];
    }
  });

  const proofActionMutation = useMutation({
    mutationFn: ({ id, approve, reason }: { id: string, approve: boolean, reason?: string }) => 
      approve ? adminApi.approveBankProof(id) : adminApi.rejectBankProof(id, reason || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bank-proofs'] });
      setRejectingProofId(null);
      setRejectReason('');
      toast.success('Payment proof processed');
    }
  });

  const refundActionMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string, approve: boolean }) => 
      adminApi.processRefund(id, approve),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      toast.success('Refund processed successfully');
    }
  });

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <Landmark className="w-4 h-4" />
            Financial Settlement
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">Treasury Control</h1>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-mist/30 rounded-2xl">
           <button
             onClick={() => setActiveTab('proofs')}
             className={cn(
               "px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
               activeTab === 'proofs' ? "bg-white text-rose shadow-sm" : "text-bark/40 hover:text-bark"
             )}
           >
             Bank Proofs
           </button>
           <button
             onClick={() => setActiveTab('refunds')}
             className={cn(
               "px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
               activeTab === 'refunds' ? "bg-white text-rose shadow-sm" : "text-bark/40 hover:text-bark"
             )}
           >
             Refund Logs
           </button>
        </div>
      </header>

      {/* Fallback Warning */}
      {activeTab === 'proofs' && fallbackMode && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-amber-50 rounded-[2.5rem] border-2 border-dashed border-amber-200 flex flex-col md:flex-row items-center gap-6"
        >
           <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl shrink-0">
             <AlertCircle className="w-6 h-6" />
           </div>
           <div className="space-y-1">
              <p className="font-bold text-amber-900">Legacy Fallback Protocol Active (Rule #17)</p>
              <p className="text-xs text-amber-700 font-medium">Bank proof listing endpoint is currently unreachable. Showing all pending bank transfer orders for manual verification instead.</p>
           </div>
           <div className="flex-1" />
           <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-200/50 px-4 py-2 rounded-xl">Diagnostics Mode</p>
        </motion.div>
      )}

      {/* Content Area */}
      <div className="bg-white rounded-[3rem] border border-mist-dark/10 shadow-premium overflow-hidden">
         {activeTab === 'proofs' ? (
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-mist/10 text-[10px] font-black uppercase tracking-widest text-bark/30">
                       <th className="px-8 py-6">Payment Reference</th>
                       <th className="px-8 py-6">Evidence</th>
                       <th className="px-8 py-6">Date</th>
                       <th className="px-8 py-6 text-right">Settlement</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-mist-dark/5">
                    {isProofsLoading ? (
                      <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30 mx-auto" /></td></tr>
                    ) : proofs && proofs.length > 0 ? (
                      proofs.map((proof) => (
                        <tr key={proof.id} className="group hover:bg-cream/20 transition-colors">
                           <td className="px-8 py-6">
                              <div className="space-y-1">
                                 <p className="font-mono text-xs font-bold text-bark">#{proof.payment_id.slice(0, 8).toUpperCase()}</p>
                                 <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-rose" />
                                    <span className="text-[10px] text-bark/40 font-medium italic">Protocol: Bank Transfer</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              {proof._isFallback ? (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600 italic">
                                   <Info className="w-3.5 h-3.5" /> No Digital Proof
                                </div>
                              ) : (
                                <a href={proof.image_url} target="_blank" className="relative w-16 h-10 block rounded-lg bg-mist overflow-hidden border border-mist-dark/10 group-hover:border-rose/30 transition-all">
                                   <Image src={proof.image_url} alt="Payment Proof" fill className="object-cover" />
                                   <div className="absolute inset-0 bg-bark/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ExternalLink className="w-3 h-3 text-white" />
                                   </div>
                                </a>
                              )}
                           </td>
                           <td className="px-8 py-6 text-xs text-bark/60 font-medium">
                              {format(new Date(proof.uploaded_at), 'MMM dd, HH:mm')}
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center justify-end gap-2">
                                 <Button 
                                   size="sm" 
                                   onClick={() => proofActionMutation.mutate({ id: proof.id, approve: true })}
                                   className="h-10 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold gap-2"
                                 >
                                    <CheckCircle2 className="w-4 h-4" /> Approve
                                 </Button>
                                 <Button 
                                   size="sm" 
                                   onClick={() => setRejectingProofId(proof.id)}
                                   className="h-10 px-4 rounded-xl bg-rose hover:bg-bark text-white font-bold gap-2"
                                 >
                                    <XCircle className="w-4 h-4" /> Reject
                                 </Button>
                              </div>
                           </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="py-24 text-center font-display text-bark/20 italic">No pending payment verifications</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
         ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-mist/10 text-[10px] font-black uppercase tracking-widest text-bark/30">
                       <th className="px-8 py-6">Transaction</th>
                       <th className="px-8 py-6">Reasoning</th>
                       <th className="px-8 py-6">Value</th>
                       <th className="px-8 py-6 text-right">Settlement</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-mist-dark/5">
                    {isRefundsLoading ? (
                      <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30 mx-auto" /></td></tr>
                    ) : refunds && refunds.length > 0 ? (
                      refunds.map((refund) => (
                        <tr key={refund.id} className="group hover:bg-cream/20 transition-colors">
                           <td className="px-8 py-6">
                              <div className="space-y-1">
                                 <p className="font-mono text-xs font-bold text-bark uppercase">REF-{refund.id.slice(0, 6)}</p>
                                 <p className="text-[10px] text-bark/40 font-medium">OID: #{refund.payment_id.slice(0, 8)}</p>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-xs font-medium text-bark/70 italic">&ldquo;{refund.reason || 'General Return'}&rdquo;</p>
                           </td>
                           <td className="px-8 py-6 font-bold text-rose">
                              {formatPrice(parseFloat(refund.amount))}
                           </td>
                           <td className="px-8 py-6 text-right space-x-2">
                              {refund.status === 'pending' ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => refundActionMutation.mutate({ id: refund.id, approve: true })}
                                    className="h-9 px-4 rounded-xl bg-bark text-white font-bold text-[10px] uppercase tracking-widest"
                                  >
                                     Release
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => refundActionMutation.mutate({ id: refund.id, approve: false })}
                                    className="h-9 px-4 rounded-xl text-rose font-bold text-[10px] uppercase tracking-widest hover:bg-rose/5"
                                  >
                                     Deny
                                  </Button>
                                </>
                              ) : (
                                <span className="text-[10px] font-black uppercase tracking-widest text-bark/30 px-3 py-1 bg-mist/30 rounded-full">
                                   {refund.status}
                                </span>
                              )}
                           </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="py-24 text-center font-display text-bark/20 italic">No refund requests in the queue</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
         )}
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectingProofId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl space-y-8"
             >
                <div className="space-y-2 text-center">
                   <h3 className="text-3xl font-display font-bold text-bark italic">Deny Evidence</h3>
                   <p className="text-sm text-bark/60">Provide a reason for rejecting this payment proof.</p>
                </div>

                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Transaction receipt is illegible / Amount discrepancy..."
                  className="w-full h-40 p-5 rounded-[2rem] border border-mist-dark/10 focus:border-rose/30 transition-all text-sm font-medium resize-none bg-mist/5"
                />

                <div className="flex gap-4">
                   <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setRejectingProofId(null)}>Cancel</Button>
                   <Button 
                     className="flex-1 h-14 rounded-2xl bg-rose text-white font-bold"
                     disabled={!rejectReason || proofActionMutation.isPending}
                     onClick={() => proofActionMutation.mutate({ id: rejectingProofId, approve: false, reason: rejectReason })}
                   >
                      Confirm Rejection
                   </Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
