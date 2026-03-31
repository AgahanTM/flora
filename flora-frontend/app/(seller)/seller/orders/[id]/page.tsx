"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, ShoppingBag, Package, 
  Truck, CheckCircle2, Clock, 
  MapPin, User, Phone, 
  MessageSquare, AlertCircle, Sparkles,
  ChevronRight, Calendar, Loader2
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

import { apiClient } from '@/lib/api/client';
import { Order, OrderItem } from '@/lib/types/order';
import { OrderStatus } from '@/lib/types/api';
import { Textarea } from '@/components/ui/textarea';
import { parseJsonArray } from '@/lib/utils/jsonFields';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';

export default function SellerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ['seller-order', orderId],
    queryFn: async () => {
      const res = await apiClient.get(`/orders/${orderId}`);
      return res.data as Order;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: OrderStatus) => {
      return apiClient.put(`/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
    }
  });

  if (isLoading) {
     return (
        <div className="min-h-screen bg-cream/30 flex items-center justify-center p-6">
           <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-rose animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-bark/30 animate-pulse italic">Retrieving floral details...</p>
           </div>
        </div>
     );
  }

  if (!order) {
     return (
        <div className="min-h-screen bg-cream/30 flex items-center justify-center p-6 text-center">
           <div className="space-y-4">
              <p className="text-xl font-display font-bold text-bark italic">Order not found</p>
              <Button onClick={() => router.push('/seller/orders')} variant="ghost" className="text-rose font-bold">
                 Return to Hub
              </Button>
           </div>
        </div>
     );
  }

  const getStepStatus = (step: OrderStatus) => {
    const statuses = [
      OrderStatus.PENDING, 
      OrderStatus.CONFIRMED, 
      OrderStatus.PREPARING, 
      OrderStatus.OUT_FOR_DELIVERY, 
      OrderStatus.DELIVERED
    ];
    const currentIndex = statuses.indexOf(order.status);
    const stepIndex = statuses.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <div className="container mx-auto px-6 max-w-6xl pt-12 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/seller/orders')} 
                className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
              >
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-1">
                 <div className="flex items-center gap-2 text-rose mb-1">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Fulfillment Operations</span>
                 </div>
                 <h1 className="text-3xl font-display font-bold text-bark italic">Order Detail</h1>
              </div>
           </div>

           <div className="flex items-center gap-4">
              {order.status === OrderStatus.PENDING && (
                 <Button 
                   onClick={() => updateStatusMutation.mutate(OrderStatus.CONFIRMED)}
                   className="h-14 rounded-2xl bg-bark hover:bg-rose text-white px-10 font-bold shadow-xl shadow-bark/20"
                 >
                    Accept & Confirm
                 </Button>
              )}
              {order.status === OrderStatus.CONFIRMED && (
                 <Button 
                   onClick={() => updateStatusMutation.mutate(OrderStatus.PREPARING)}
                   className="h-14 rounded-2xl bg-bark hover:bg-rose text-white px-10 font-bold shadow-xl shadow-bark/20"
                 >
                    Start Preparing
                 </Button>
              )}
              {order.status === OrderStatus.PREPARING && (
                 <Button 
                   onClick={() => updateStatusMutation.mutate(OrderStatus.OUT_FOR_DELIVERY)}
                   className="h-14 rounded-2xl bg-bark hover:bg-rose text-white px-10 font-bold shadow-xl shadow-bark/20"
                 >
                    Dispatch Courier
                 </Button>
              )}
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           {/* Left Column: Order Items & Personalization */}
           <div className="lg:col-span-2 space-y-8">
              <section className="bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-premium overflow-hidden">
                 <div className="bg-mist/30 px-8 py-5 border-b border-mist-dark/5 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-bark/40">Floral Arrangements</h3>
                    <Badge className="bg-white/50">{order.items?.length || 0} Items</Badge>
                 </div>
                 <div className="divide-y divide-mist-dark/5">
                    {order.items?.map((item: OrderItem) => {
                       const snapshot = item.product_snapshot;
                       return (
                          <div key={item.id} className="p-8 group hover:bg-rose/5 transition-colors">
                             <div className="flex gap-6">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-premium bg-mist shrink-0 border border-mist-dark/10 relative">
                                   {snapshot?.images?.[0] ? <Image src={snapshot.images[0].url} alt={snapshot?.name || 'Product'} fill className="object-cover group-hover:scale-110 transition-transform duration-700" /> : <Package className="w-8 h-8 text-bark/10" />}
                                </div>
                                <div className="flex-1 space-y-2">
                                   <div className="flex justify-between">
                                      <h4 className="font-bold text-xl text-bark">{snapshot?.name || 'Legacy Arrangement'}</h4>
                                      <p className="font-bold text-rose">{formatPrice(parseFloat(item.total_price))}</p>
                                   </div>
                                   <p className="text-sm text-muted-foreground italic line-clamp-2">{snapshot?.description}</p>
                             <div className="flex items-center gap-4 pt-2">
                                      <Badge className="bg-bark/5 border-bark/10 text-bark/60">Qty: {item.quantity}</Badge>
                                      {parseJsonArray(item.addons).length > 0 && (
                                         <Badge className="bg-rose/5 border-rose/10 text-rose">+ {parseJsonArray(item.addons).length} Enhancements</Badge>
                                      )}
                                   </div>
                                </div>
                             </div>
                             
                             {/* Personalization Section if applicable */}
                             {(item as any).personalization_job && (
                                <div className="mt-6 p-4 bg-mist/20 rounded-2xl border border-mist-dark/10 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <Sparkles className="w-4 h-4 text-rose" />
                                      <span className="text-xs font-bold text-bark">Custom Personalization Applied:</span>
                                      <span className="text-xs text-muted-foreground italic">"{(item as any).personalization_job.custom_text || 'Premium Style'}"</span>
                                   </div>
                                   <Badge className={cn("rounded-lg capitalize", 
                                     (item as any).personalization_job.status === 'completed' ? "bg-green-100 text-green-600 border-green-200" : "bg-amber-100 text-amber-600 border-amber-200")}>
                                      {(item as any).personalization_job.status}
                                   </Badge>
                                </div>
                             )}
                          </div>
                       );
                    })}
                 </div>
              </section>

              {/* Order Timeline */}
              <section className="bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-premium p-8">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-bark/30 mb-8 px-2">Journey Timeline</h3>
                 <div className="relative space-y-8 pl-8">
                    <div className="absolute left-[3.5px] top-2 bottom-2 w-[1px] bg-mist-dark/10" />
                    
                    {[
                       { status: OrderStatus.PENDING, label: 'Order Confirmed' },
                       { status: OrderStatus.PREPARING, label: 'Bloom Preparation' },
                       { status: OrderStatus.OUT_FOR_DELIVERY, label: 'Courier En Route' },
                       { status: OrderStatus.DELIVERED, label: 'Handcrafted Joy Delivered' }
                    ].map((step, idx) => {
                       const state = getStepStatus(step.status);
                       return (
                          <div key={idx} className="relative flex items-center gap-6 group">
                             <div className={cn(
                               "absolute left-[-32px] w-2 h-2 rounded-full z-10 transition-all",
                               state === 'completed' ? "bg-rose scale-150" : 
                               state === 'current' ? "bg-rose animate-ping" : "bg-mist-dark/20"
                             )} />
                             <div className={cn(
                               "p-3 rounded-xl transition-all",
                               state === 'completed' ? "bg-rose/10 text-rose" : 
                               state === 'current' ? "bg-rose text-white shadow-lg shadow-rose/20" : "bg-mist text-bark/20"
                             )}>
                                {idx === 0 ? <CheckCircle2 className="w-5 h-5" /> : 
                                 idx === 1 ? <Clock className="w-5 h-5" /> :
                                 idx === 2 ? <Truck className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                             </div>
                             <div>
                                <p className={cn("text-sm font-bold", state === 'upcoming' ? "text-bark/30" : "text-bark")}>{step.label}</p>
                                {state === 'completed' && <p className="text-[10px] font-medium text-muted-foreground uppercase">Verified</p>}
                                {state === 'current' && <p className="text-[10px] font-black text-rose uppercase tracking-widest italic animate-pulse">In Progress</p>}
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </section>
           </div>

           {/* Right Column: Customer & Delivery Details */}
           <div className="space-y-8">
              <section className="bg-white rounded-[3rem] border border-mist-dark/10 shadow-premium p-8 space-y-8">
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-mist-dark/5 pb-6">
                       <div className="w-12 h-12 rounded-2xl bg-rose/10 flex items-center justify-center text-rose">
                          <User className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 leading-none mb-1">Customer</p>
                          <p className="font-bold text-bark italic uppercase">{order.recipient_name || 'Valued Recipient'}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-bark/30 shrink-0 mt-1" />
                          <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Delivery Address</p>
                             <p className="text-sm font-medium text-bark leading-relaxed">
                                {order.address?.street}, {order.address?.building} <br />
                                {order.address?.district}, {order.address?.city}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-bark/30" />
                          <p className="text-sm font-medium text-bark">{order.recipient_phone || 'Private Number'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-mist p-6 rounded-3xl border border-mist-dark/5 space-y-4">
                    <div className="flex items-center gap-2 text-bark/40">
                       <MessageSquare className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Special Instruction</span>
                    </div>
                    <p className="text-sm text-bark font-medium italic leading-relaxed">
                       "{order.special_instructions || 'Please handle with delicate care for this special occasion.'}"
                    </p>
                 </div>

                 {order.gift_message && (
                    <div className="p-6 bg-rose/5 border border-rose/10 rounded-3xl space-y-4">
                       <div className="flex items-center gap-2 text-rose">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Gift Note</span>
                       </div>
                       <p className="text-sm text-rose font-bold italic leading-relaxed">
                          "{order.gift_message}"
                       </p>
                    </div>
                 )}
              </section>

              <section className="bg-bark text-white rounded-[3rem] p-8 space-y-6 shadow-2xl">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Financial Settlement</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium">
                       <span className="text-white/60">Order Total</span>
                       <span>{formatPrice(parseFloat(order.total_amount))}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                       <span className="text-white/60">Platform Fee</span>
                       <span className="text-rose">- {formatPrice(parseFloat(order.total_amount) * 0.15)}</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold">Estimated Payout</span>
                       <span className="text-2xl font-display font-bold italic text-white">{formatPrice(parseFloat(order.total_amount) * 0.85)}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl">
                    <AlertCircle className="w-5 h-5 text-white/30" />
                    <p className="text-[10px] text-white/40 font-medium">Payouts are processed 24 hours after delivery confirmation.</p>
                 </div>
              </section>
           </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded-lg border", className)}>
      {children}
    </span>
  );
}
