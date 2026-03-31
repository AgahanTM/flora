"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Store, ShieldCheck, 
  MapPin, Clock, Landmark, FileText,
  Mail, Phone, ExternalLink, CheckCircle2,
  XCircle, Ban, Loader2, Calendar,
  TrendingUp, ShoppingBag, DollarSign,
  AlertCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { apiClient } from '@/lib/api/client';
import { Seller, SellerDocument, SellerBankDetails, SellerWorkingHours } from '@/lib/types/seller';
import { SellerStatus } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

export default function AdminSellerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<SellerStatus | null>(null);
  const [actionReason, setActionReason] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-seller-detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/sellers/${id}`);
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string, reason?: string }) => {
      const endpoint = status === SellerStatus.APPROVED ? 'approve' : status === SellerStatus.REJECTED ? 'reject' : 'suspend';
      return apiClient.put(`/admin/sellers/${id}/${endpoint}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-detail', id] });
      setIsActionModalOpen(false);
      setActionReason('');
      toast.success('Seller status updated');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist/10 text-rose">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  const seller = profile.seller as Seller;
  const docs = profile.documents as SellerDocument[];
  const bank = profile.bank_details as SellerBankDetails;
  const hours = profile.working_hours as SellerWorkingHours[];
  const stats = profile.stats;

  const handleAction = (type: SellerStatus) => {
    if (type === SellerStatus.APPROVED) {
      updateStatusMutation.mutate({ status: SellerStatus.APPROVED });
    } else {
      setActionType(type);
      setIsActionModalOpen(true);
    }
  };

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 pb-24 space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/admin/sellers')} 
            className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[9px]">
               <ShieldCheck className="w-4 h-4" />
               KYC Verification Portal
            </div>
            <h1 className="text-3xl font-display font-bold text-bark italic">{seller.shop_name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
           {seller.status === SellerStatus.PENDING && (
             <>
               <Button 
                 onClick={() => handleAction(SellerStatus.APPROVED)}
                 className="h-14 px-8 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold gap-3 shadow-xl shadow-green-500/10"
               >
                  <CheckCircle2 className="w-5 h-5" /> Approve
               </Button>
               <Button 
                 onClick={() => handleAction(SellerStatus.REJECTED)}
                 className="h-14 px-8 rounded-2xl bg-rose hover:bg-rose-600 text-white font-bold gap-3 shadow-xl shadow-rose/10"
               >
                  <XCircle className="w-5 h-5" /> Reject
               </Button>
             </>
           )}
           {seller.status === SellerStatus.APPROVED && (
             <Button 
               onClick={() => handleAction(SellerStatus.SUSPENDED)}
               className="h-14 px-8 rounded-2xl bg-bark hover:bg-rose text-white font-bold gap-3 shadow-xl shadow-bark/10"
             >
                <Ban className="w-5 h-5" /> Suspend Boutique
             </Button>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Sidebar Stats & Info */}
         <div className="space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-mist-dark/10 shadow-premium space-y-8">
               <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto rounded-[2.5rem] bg-mist flex items-center justify-center overflow-hidden border-2 border-mist-dark/5 p-2 bg-white shadow-soft relative">
                     {seller.logo_url ? <Image src={seller.logo_url} alt={seller.shop_name} fill className="object-cover rounded-3xl" /> : <Store className="w-12 h-12 text-bark/20" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-bark italic">{seller.shop_name}</h3>
                    <p className="text-xs text-rose font-black uppercase tracking-widest">@{seller.slug}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-mist/30 rounded-3xl space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Rating</p>
                     <div className="flex items-center gap-1.5 text-bark font-bold">
                        <TrendingUp className="w-4 h-4 text-rose" /> {stats?.rating_avg || '0.0'}
                     </div>
                  </div>
                  <div className="p-5 bg-mist/30 rounded-3xl space-y-1 text-right">
                     <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Orders</p>
                     <div className="flex items-center justify-end gap-1.5 text-bark font-bold">
                        {stats?.total_orders || 0} <ShoppingBag className="w-4 h-4 text-bark/30" />
                     </div>
                  </div>
                  <div className="col-span-2 p-5 bg-rose/5 rounded-3xl space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-rose/40">Total Revenue</p>
                     <div className="flex items-center gap-1.5 text-rose font-bold text-lg">
                        <DollarSign className="w-5 h-5" /> {formatPrice(parseFloat(stats?.total_revenue || '0'))}
                     </div>
                  </div>
               </div>

               <div className="space-y-4 pt-6 border-t border-mist-dark/5">
                  <div className="flex items-center gap-4 text-sm text-bark/60">
                     <Calendar className="w-4 h-4 shrink-0 text-bark/20" />
                     Joined {format(new Date(seller.created_at), 'MMMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-bark/60">
                     <Clock className="w-4 h-4 shrink-0 text-bark/20" />
                     Working Hours: {hours?.filter(h => !h.is_closed).length || 0} days active
                  </div>
                  <div className="flex items-center gap-4 text-sm text-bark/60 group cursor-pointer hover:text-rose transition-colors">
                     <Mail className="w-4 h-4 shrink-0 text-bark/20 group-hover:text-rose" />
                     Send Inquiry (P4)
                  </div>
               </div>
            </div>

            <div className="bg-bark rounded-[3rem] p-10 text-white shadow-xl shadow-bark/20 space-y-6">
               <h3 className="font-display font-bold italic text-white/50">Banking Intelligence</h3>
               {bank ? (
                 <div className="space-y-6">
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Bank Name</p>
                       <p className="font-bold text-lg">{bank.bank_name}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Account Number</p>
                       <p className="font-mono tracking-wider">{bank.account_number}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Account Holder</p>
                       <p className="font-bold">{bank.account_holder_name}</p>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit",
                      bank.is_verified ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                      {bank.is_verified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {bank.is_verified ? 'Bank Verified' : 'Awaiting Proof'}
                    </div>
                 </div>
               ) : (
                 <p className="text-white/20 italic italic text-center py-10">No bank details provided</p>
               )}
            </div>
         </div>

         {/* Main Content Area */}
         <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
               <h3 className="text-xl font-display font-bold text-bark italic flex items-center gap-3">
                  <Store className="w-6 h-6 text-rose" />
                  Boutique Bio
               </h3>
               <div className="bg-white rounded-[2.5rem] p-10 border border-mist-dark/10 shadow-soft leading-relaxed text-bark/70">
                  {seller.description || 'No description provided by curator.'}
               </div>
            </section>

            <section className="space-y-6">
               <h3 className="text-xl font-display font-bold text-bark italic flex items-center gap-3">
                  <FileText className="w-6 h-6 text-rose" />
                  Credential Proofs
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {docs?.map((doc) => (
                    <div key={doc.id} className="bg-white rounded-[2.5rem] p-8 border border-mist-dark/10 shadow-soft group hover:shadow-premium transition-all">
                       <div className="flex items-center justify-between mb-8">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black uppercase tracking-widest text-bark/30">Document Type</p>
                             <p className="font-bold text-bark">{doc.document_type.replace(/_/g, ' ').toUpperCase()}</p>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                            doc.status === 'approved' ? "bg-green-100 text-green-600" :
                            doc.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose"
                          )}>
                             {doc.status}
                          </span>
                       </div>
                       
                       <div className="relative aspect-video rounded-3xl bg-mist flex items-center justify-center overflow-hidden border border-mist-dark/5 group-hover:border-rose/20 transition-all">
                          {doc.file_url ? (
                            <>
                              <Image src={doc.file_url} alt={doc.document_type} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                              <a 
                                href={doc.file_url} 
                                target="_blank" 
                                className="absolute inset-0 bg-bark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-sm backdrop-blur-sm"
                              >
                                 <ExternalLink className="w-5 h-5" /> View Full Source
                              </a>
                            </>
                          ) : (
                            <FileText className="w-8 h-8 text-bark/10" />
                          )}
                       </div>
                    </div>
                  ))}
               </div>
               {!docs?.length && (
                  <div className="py-24 text-center bg-mist/10 rounded-[3rem] border-2 border-dashed border-mist-dark/10 space-y-4">
                     <ShieldCheck className="w-16 h-16 mx-auto text-bark/10" />
                     <p className="font-display font-medium text-bark/40">No documents uploaded for review.</p>
                  </div>
               )}
            </section>
         </div>
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {isActionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl space-y-8"
             >
                <div className="space-y-2 text-center">
                   <h3 className="text-3xl font-display font-bold text-bark italic">Confirm {actionType?.charAt(0).toUpperCase()}{actionType?.slice(1)}</h3>
                   <p className="text-sm text-bark/60">Provide justification for this decision. This will be transmitted to the curator immediately.</p>
                </div>

                <div className="relative group">
                  <AlertCircle className="absolute left-5 top-5 w-5 h-5 text-bark/20 group-focus-within:text-rose transition-colors" />
                  <textarea 
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Describe relevant issues..."
                    className="w-full h-40 p-5 pl-14 rounded-[2.5rem] border border-mist-dark/10 focus:border-rose/30 transition-all text-sm font-medium resize-none bg-mist/5"
                  />
                </div>

                <div className="flex gap-4">
                   <Button 
                     variant="ghost" 
                     className="flex-1 h-14 rounded-2xl font-bold"
                     onClick={() => { setIsActionModalOpen(false); setActionReason(''); }}
                   >
                     Retreat
                   </Button>
                   <Button 
                     className={cn(
                       "flex-1 h-14 rounded-2xl text-white font-bold shadow-xl transition-all",
                       actionType === SellerStatus.REJECTED ? "bg-rose shadow-rose/20" : "bg-bark shadow-bark/20"
                     )}
                     disabled={!actionReason || updateStatusMutation.isPending}
                     onClick={() => updateStatusMutation.mutate({ status: actionType!, reason: actionReason })}
                   >
                      {updateStatusMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : `Finalize ${actionType}`}
                   </Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
