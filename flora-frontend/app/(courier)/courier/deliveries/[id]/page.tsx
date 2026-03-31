"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Package, MapPin, Navigation, 
  CheckCircle2, XCircle, Clock,
  ArrowLeft, Phone, MessageSquare,
  ShieldCheck, Loader2, AlertCircle,
  History, PlaneTakeoff, Truck,
  Settings, ExternalLink, Map as MapIcon,
  User, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { courierApi } from '@/lib/api/courier';
import { Delivery } from '@/lib/types/courier';
import { DeliveryStatus } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState('');

  const { data: delivery, isLoading, refetch } = useQuery({
    queryKey: ['delivery', id],
    queryFn: async () => {
      const { data } = await courierApi.getDelivery(id as string);
      return data as Delivery;
    }
  });

  const processMutation = useMutation({
    mutationFn: ({ status, notes }: { status: DeliveryStatus, notes?: string }) => 
      courierApi.processDelivery(id as string, status, notes),
    onSuccess: () => {
      refetch();
      setShowFailureModal(false);
      setFailureReason('');
      toast.success('Status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update status. Please try again.');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mist/20 flex items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-rose animate-spin" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-mist/20 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose/30" />
        <h2 className="text-2xl font-display font-bold text-bark italic">Delivery Not Found</h2>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  const isCompleted = delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.FAILED;

  return (
    <div className="min-h-screen bg-mist/20 pb-40">
      {/* Header */}
      <div className="bg-white border-b border-mist-dark/10 py-6 sticky top-0 z-30 shadow-soft">
        <div className="container mx-auto px-6 max-w-lg flex items-center justify-between">
           <button onClick={() => router.back()} className="p-3 bg-mist rounded-2xl hover:bg-rose/10 hover:text-rose transition-all">
              <ArrowLeft className="w-5 h-5" />
           </button>
           <h1 className="text-lg font-display font-bold text-bark tracking-tight">Delivery Details</h1>
           <div className="w-11" /> {/* Spacer */}
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-lg pt-12 space-y-8">
         {/* Status Progress Badge */}
         <div className="text-center">
            <Badge className={cn(
              "px-8 py-2 rounded-full font-bold h-10 italic border-none",
              delivery.status === DeliveryStatus.PICKED_UP ? "bg-amber-100 text-amber-600" :
              delivery.status === DeliveryStatus.EN_ROUTE ? "bg-amber-500 text-white" :
              delivery.status === DeliveryStatus.DELIVERED ? "bg-green-100 text-green-600" :
              "bg-mist text-bark/40"
            )}>
               {delivery.status.replace(/_/g, ' ')}
            </Badge>
         </div>

         {/* Location Cards */}
         <div className="space-y-4">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-mist-dark/5 space-y-6">
               <div className="flex items-center gap-3 text-rose">
                  <div className="w-10 h-10 rounded-2xl bg-rose/10 flex items-center justify-center">
                     <Package className="w-5 h-5 text-rose" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-bark italic">Pickup Information</h3>
               </div>
               <div className="p-6 bg-mist/20 rounded-3xl border border-mist-dark/5 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-1">Store Location</p>
                  <p className="text-sm font-bold text-bark italic leading-relaxed">
                     {delivery.pickup_address || "Seller Warehouse Sector 4"}
                  </p>
               </div>
               <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-mist border-none shadow-sm">
                     <MapIcon className="w-3.5 h-3.5" /> Open Maps
                  </Button>
                  <Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-mist border-none shadow-sm">
                     <Phone className="w-3.5 h-3.5" /> Call Seller
                  </Button>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-mist-dark/5 space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-rose/5 blur-3xl rounded-full -mr-16 -mt-16" />
               <div className="flex items-center gap-3 text-rose relative z-10">
                  <div className="w-10 h-10 rounded-2xl bg-rose/10 flex items-center justify-center">
                     <Navigation className="w-5 h-5 text-rose" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-bark italic">Dropoff Information</h3>
               </div>
               <div className="p-6 bg-mist/20 rounded-3xl border border-mist-dark/5 space-y-1 relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-1">Recipient Address</p>
                  <p className="text-sm font-bold text-bark italic leading-relaxed">
                     {delivery.dropoff_address}
                  </p>
               </div>
               <div className="flex gap-4 relative z-10">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-mist border-none shadow-sm">
                     <MapIcon className="w-3.5 h-3.5" /> Navigate
                  </Button>
                  <Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-mist border-none shadow-sm">
                     <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </Button>
               </div>
            </div>
         </div>

         {/* Instructions */}
         <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-mist-dark/5 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-bark/30 ml-2">
               <ClipboardList className="w-3.5 h-3.5" /> Critical Instructions
            </div>
            <div className="p-6 bg-rose/5 border border-rose/10 rounded-3xl italic text-sm text-bark font-medium leading-relaxed">
               {delivery.notes ? `"${delivery.notes}"` : '"No special instructions provided by customer."'}
            </div>
         </div>
      </div>

      {/* Tactile Action Bar (Sticky) */}
      {!isCompleted && (
        <div className="fixed bottom-8 left-6 right-6 z-40">
           <div className="flex flex-col gap-4">
              {delivery.status === DeliveryStatus.ASSIGNED && (
                <Button 
                  onClick={() => processMutation.mutate({ status: DeliveryStatus.PICKED_UP })}
                  disabled={processMutation.isPending}
                  className="w-full h-18 py-8 rounded-[2rem] bg-amber-500 text-white font-display font-bold text-xl shadow-premium shadow-amber-500/20 gap-3"
                >
                   {processMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                    <><Truck className="w-6 h-6" /> I've Picked Up</>}
                </Button>
              )}

              {delivery.status === DeliveryStatus.PICKED_UP && (
                <Button 
                  onClick={() => processMutation.mutate({ status: DeliveryStatus.EN_ROUTE })}
                  disabled={processMutation.isPending}
                  className="w-full h-18 py-8 rounded-[2rem] bg-amber-500 text-white font-display font-bold text-xl shadow-premium shadow-amber-500/20 gap-3"
                >
                   {processMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                    <><PlaneTakeoff className="w-6 h-6" /> Start the Journey</>}
                </Button>
              )}

              {delivery.status === DeliveryStatus.EN_ROUTE && (
                <Button 
                  onClick={() => processMutation.mutate({ status: DeliveryStatus.DELIVERED })}
                  disabled={processMutation.isPending}
                  className="w-full h-18 py-8 rounded-[2rem] bg-green-600 text-white font-display font-bold text-xl shadow-premium shadow-green-600/20 gap-3"
                >
                   {processMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                    <><CheckCircle2 className="w-6 h-6" /> Handed to Customer</>}
                </Button>
              )}

              <Button 
                onClick={() => setShowFailureModal(true)}
                disabled={processMutation.isPending}
                variant="ghost" 
                className="w-full h-14 rounded-2xl text-rose font-bold text-sm bg-white/50 backdrop-blur-md border border-rose/10"
              >
                 Report Issue / Delivery Failed
              </Button>
           </div>
        </div>
      )}

      {/* Failure Reason Modal */}
      <AnimatePresence>
        {showFailureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-[3rem] w-full max-w-sm p-10 space-y-8 shadow-2xl"
             >
                <div className="space-y-2 text-center">
                   <div className="w-16 h-16 bg-rose/10 rounded-full flex items-center justify-center text-rose mx-auto">
                      <XCircle className="w-8 h-8" />
                   </div>
                   <h3 className="text-2xl font-display font-bold text-bark italic pt-4">Log Failure</h3>
                   <p className="text-sm text-bark/40 font-medium">Please provide a factual reason for the fulfillment failure.</p>
                </div>

                <Textarea 
                  placeholder="e.g. Recipient not available at address..."
                  className="min-h-[120px] rounded-2xl border-mist p-5 text-sm"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                />

                <div className="flex gap-4">
                   <Button variant="ghost" onClick={() => setShowFailureModal(false)} className="flex-1 h-14 rounded-xl font-bold">Cancel</Button>
                   <Button 
                     onClick={() => processMutation.mutate({ status: DeliveryStatus.FAILED, notes: failureReason })}
                     disabled={!failureReason.trim() || processMutation.isPending}
                     className="flex-1 h-14 rounded-xl bg-rose text-white font-bold shadow-lg shadow-rose/20"
                   >
                      Confirm
                   </Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
