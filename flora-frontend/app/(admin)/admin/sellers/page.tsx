"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Search, Filter, ShieldCheck, 
  CheckCircle2, XCircle, AlertTriangle, 
  MoreVertical, ExternalLink, Mail, 
  Phone, Calendar, FileText, Loader2,
  ChevronRight, Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

import { apiClient } from '@/lib/api/client';
import { Seller } from '@/lib/types/seller';
import { SellerStatus } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableRowSkeleton } from '@/components/shared/Skeletons';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

const STATUS_TABS = [
  { id: 'all', label: 'All Curators' },
  { id: SellerStatus.PENDING, label: 'Pending Review' },
  { id: SellerStatus.APPROVED, label: 'Approved' },
  { id: SellerStatus.SUSPENDED, label: 'Suspended' },
  { id: SellerStatus.REJECTED, label: 'Rejected' },
];

export default function SellerManagementPage() {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingSeller, setRejectingSeller] = useState<string | null>(null);
  const [suspendingSeller, setSuspendingSeller] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');

  const { data: sellers, isLoading } = useQuery({
    queryKey: ['admin-sellers', activeStatus],
    queryFn: async () => {
      const url = activeStatus === 'all' ? '/admin/sellers' : `/admin/sellers?status=${activeStatus}`;
      const { data } = await apiClient.get(url);
      return data as Seller[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string, status: string, reason?: string }) => {
      const endpoint = status === SellerStatus.APPROVED ? 'approve' : status === SellerStatus.REJECTED ? 'reject' : 'suspend';
      return apiClient.put(`/admin/sellers/${id}/${endpoint}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      setRejectingSeller(null);
      setSuspendingSeller(null);
      setActionReason('');
      toast.success('Curator status updated 🌸');
    },
    onError: (error: any) => {
      toast.apiError(error, 'Failed to update curator status');
    }
  });

  const filteredSellers = sellers?.filter(s => 
    s.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <ShieldCheck className="w-4 h-4" />
            Vendor Ecosystem
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">Boutique Management</h1>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-80 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bark/20 group-focus-within:text-rose transition-colors" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shop name or slug..."
                className="h-14 pl-14 rounded-2xl border-mist-dark/10 bg-white shadow-sm focus:ring-rose/20"
              />
           </div>
        </div>
      </header>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-mist/30 rounded-2xl w-fit">
         {STATUS_TABS.map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveStatus(tab.id)}
             className={cn(
               "px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
               activeStatus === tab.id 
                 ? "bg-white text-rose shadow-sm" 
                 : "text-bark/40 hover:text-bark"
             )}
           >
             {tab.label}
           </button>
         ))}
      </div>

      {/* Seller Table */}
      <div className="bg-white rounded-[3rem] border border-mist-dark/10 shadow-premium overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-mist/10 text-[10px] font-black uppercase tracking-widest text-bark/30">
                     <th className="px-8 py-6">Shop Identity</th>
                     <th className="px-8 py-6">Status</th>
                     <th className="px-8 py-6">Application Date</th>
                     <th className="px-8 py-6">Documents</th>
                     <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-mist-dark/5">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRowSkeleton key={i} />
                    ))
                  ) : filteredSellers && filteredSellers.length > 0 ? (
                    filteredSellers.map((seller) => (
                      <tr key={seller.id} className="group hover:bg-cream/20 transition-colors">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-mist flex items-center justify-center overflow-hidden border border-mist-dark/5 relative">
                                  {seller.logo_url ? <Image src={seller.logo_url} alt={seller.shop_name} fill className="object-cover" /> : <Store className="w-6 h-6 text-bark/20" />}
                               </div>
                               <div>
                                  <p className="font-bold text-bark group-hover:text-rose transition-colors">{seller.shop_name}</p>
                                  <p className="text-[10px] font-medium text-bark/40 italic">@{seller.slug}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5",
                              seller.status === SellerStatus.APPROVED ? "bg-green-100 text-green-600" :
                              seller.status === SellerStatus.PENDING ? "bg-amber-100 text-amber-600" :
                              seller.status === SellerStatus.SUSPENDED ? "bg-rose-100 text-rose" : "bg-bark/10 text-bark/40"
                            )}>
                               <div className={cn(
                                 "w-1 h-1 rounded-full",
                                 seller.status === SellerStatus.APPROVED ? "bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.5)]" :
                                 seller.status === SellerStatus.PENDING ? "bg-amber-600" : "bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.5)]"
                               )} />
                               {seller.status}
                            </span>
                         </td>
                         <td className="px-8 py-6 text-xs text-bark/60 font-medium">
                            {format(new Date(seller.created_at), 'MMM dd, yyyy')}
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-bark/40">
                               <FileText className="w-3.5 h-3.5" />
                               {(seller as any).documents_count || 0} Verify Proofs
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                               {seller.status === SellerStatus.PENDING && (
                                 <>
                                   <Button 
                                     size="sm" 
                                     onClick={() => updateStatusMutation.mutate({ id: seller.id, status: SellerStatus.APPROVED })}
                                     className="h-10 w-10 p-0 rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                                     title="Approve"
                                   >
                                      <CheckCircle2 className="w-5 h-5" />
                                   </Button>
                                   <Button 
                                     size="sm" 
                                     onClick={() => setRejectingSeller(seller.id)}
                                     className="h-10 w-10 p-0 rounded-xl bg-rose hover:bg-bark text-white shadow-lg shadow-rose/20"
                                     title="Reject"
                                   >
                                      <XCircle className="w-5 h-5" />
                                   </Button>
                                 </>
                               )}
                               {seller.status === SellerStatus.APPROVED && (
                                 <Button 
                                   size="sm" 
                                   onClick={() => setSuspendingSeller(seller.id)}
                                   className="h-10 w-10 p-0 rounded-xl bg-bark hover:bg-rose text-white shadow-lg shadow-bark/20"
                                   title="Suspend"
                                 >
                                    <Ban className="w-5 h-5" />
                                 </Button>
                               )}
                               <Link 
                                 href={`/admin/sellers/${seller.id}`}
                                 className="h-10 w-10 flex items-center justify-center rounded-xl bg-mist/30 text-bark hover:bg-rose hover:text-white transition-all shadow-sm"
                                 title="View Details"
                               >
                                  <ChevronRight className="w-5 h-5" />
                               </Link>
                            </div>
                         </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12">
                        <EmptyState 
                          icon={Users}
                          title="No curators found"
                          description="We couldn't find any boutiques matching your current filter or search criteria."
                          actionLabel="Clear Search"
                          onAction={() => setSearchQuery('')}
                        />
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Reject/Suspend Modals */}
      <AnimatePresence>
        {(rejectingSeller || suspendingSeller) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="bg-white w-full h-full sm:h-auto sm:max-w-lg p-6 sm:p-10 sm:rounded-[2.5rem] shadow-2xl space-y-8 overflow-y-auto"
             >
                <div className="space-y-2">
                   <h3 className="text-2xl font-display font-bold text-bark italic">Provide a Reason</h3>
                   <p className="text-sm text-bark/60">Explain the decision to the seller. This will be visible in their dashboard.</p>
                </div>

                <textarea 
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Document image is blurry / Prohibited products listed..."
                  className="w-full h-40 p-5 rounded-[2rem] border border-mist-dark/10 focus:border-rose/30 transition-all text-sm font-medium resize-none bg-mist/5"
                />

                <div className="flex gap-4">
                   <Button 
                     variant="ghost" 
                     className="flex-1 h-14 rounded-2xl font-bold"
                     onClick={() => { setRejectingSeller(null); setSuspendingSeller(null); setActionReason(''); }}
                   >
                     Cancel
                   </Button>
                   <Button 
                     className="flex-1 h-14 rounded-2xl bg-rose text-white font-bold shadow-xl shadow-rose/20"
                     disabled={!actionReason || updateStatusMutation.isPending}
                     onClick={() => {
                       const id = rejectingSeller || suspendingSeller || '';
                       const status = rejectingSeller ? SellerStatus.REJECTED : SellerStatus.SUSPENDED;
                       updateStatusMutation.mutate({ id, status, reason: actionReason });
                     }}
                   >
                      {updateStatusMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Action'}
                   </Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Store(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  );
}
