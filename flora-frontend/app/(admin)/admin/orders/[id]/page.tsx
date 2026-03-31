"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, ShoppingBag, Truck, 
  User, MapPin, Calendar, Clock,
  CheckCircle2, AlertCircle, History,
  DollarSign, Package, ExternalLink,
  ChevronRight, ArrowUpRight, Ban,
  FileText, Loader2, Store
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { apiClient } from '@/lib/api/client';
import { adminApi } from '@/lib/api/admin';
import { Order, OrderItem, OrderStatusHistory } from '@/lib/types/order';
import { OrderStatus, PaymentStatus } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';
import { parseJsonArray } from '@/lib/utils/jsonFields';

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [overrideNote, setOverrideNote] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order-detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/${id}`);
      return data as Order;
    }
  });

  const overrideMutation = useMutation({
    mutationFn: ({ status, note }: { status: OrderStatus, note: string }) => 
      adminApi.updateOrderStatus(id as string, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      setIsOverrideModalOpen(false);
      setOverrideNote('');
      toast.success('Order status overridden');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist/10 text-rose">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 pb-24 space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/admin/orders')} 
            className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[9px]">
               <Package className="w-4 h-4" />
               Global Order Oversight
            </div>
            <h1 className="text-3xl font-display font-bold text-bark italic">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          </div>
        </div>

        <Button 
          onClick={() => {
            setOverrideStatus(order.status);
            setIsOverrideModalOpen(true);
          }}
          className="h-14 px-8 rounded-2xl bg-bark hover:bg-rose text-white font-bold gap-3 shadow-xl shadow-bark/10"
        >
           <History className="w-5 h-5" /> Status Override
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Main Order Content */}
         <div className="lg:col-span-2 space-y-10">
            {/* Fulfillment Section */}
            <section className="bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-premium overflow-hidden">
               <div className="p-8 border-b border-mist-dark/5 flex items-center justify-between">
                  <h3 className="text-xl font-display font-bold text-bark italic">Boutique Package</h3>
                  <div className="flex items-center gap-2">
                     <span className={cn(
                       "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                       order.status === OrderStatus.DELIVERED ? "bg-green-100 text-green-600" :
                       order.status === OrderStatus.CANCELLED ? "bg-rose-100 text-rose" : "bg-amber-100 text-amber-600"
                     )}>
                        {order.status}
                     </span>
                  </div>
               </div>

               <div className="p-8 space-y-6">
                  {order.items?.map((item: OrderItem) => {
                    const snapshot = item.product_snapshot || {};
                    const addons = parseJsonArray(item.addons);
                    return (
                      <div key={item.id} className="flex gap-6 group">
                         <div className="w-24 h-24 rounded-2xl bg-mist overflow-hidden border border-mist-dark/5 shrink-0 relative">
                            {snapshot.images?.[0] ? (
                               <Image src={snapshot.images[0]} alt={snapshot.title || 'Product'} fill className="object-cover group-hover:scale-110 transition-transform" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-bark/10"><Package className="w-8 h-8" /></div>
                            )}
                         </div>
                         <div className="flex-1 space-y-1">
                            <p className="font-bold text-bark group-hover:text-rose transition-colors">{snapshot.title || 'Archived Product'}</p>
                            <p className="text-xs text-bark/40 font-medium">Qty: {item.quantity} × {formatPrice(parseFloat(item.unit_price))}</p>
                            {addons.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                 {addons.map((a: any, i: number) => (
                                   <span key={i} className="text-[8px] font-black uppercase tracking-widest bg-mist/30 text-bark/60 px-2 py-0.5 rounded-full">
                                      + {a.name}
                                   </span>
                                 ))}
                              </div>
                            )}
                         </div>
                         <p className="font-bold text-bark self-center whitespace-nowrap">{formatPrice(parseFloat(item.total_price))}</p>
                      </div>
                    );
                  })}
               </div>

               <div className="bg-mist/10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <Store className="w-5 h-5 text-rose" />
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Contracted Seller</p>
                           <p className="text-sm font-bold text-bark hover:underline cursor-pointer">Boutique ID: {order.seller_id.slice(0, 8)}</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Settlement Code</p>
                        <p className="text-xs font-mono font-bold text-bark/60 uppercase">AUTH-{order.id.split('-')[0]}</p>
                     </div>
                  </div>
               </div>
            </section>

            {/* Timeline */}
            <section className="space-y-6">
               <h3 className="text-xl font-display font-bold text-bark italic flex items-center gap-3">
                  <History className="w-6 h-6 text-rose" />
                  Custody Chain
               </h3>
               <div className="bg-white rounded-[2.5rem] p-10 border border-mist-dark/10 shadow-soft space-y-8">
                  {order.status_history?.map((h: OrderStatusHistory, i: number) => (
                    <div key={h.id} className="relative flex gap-6">
                       {i < (order.status_history?.length || 0) - 1 && (
                         <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-mist-dark/10" />
                       )}
                       <div className={cn(
                         "w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10",
                         i === 0 ? "bg-rose text-white shadow-lg shadow-rose/30" : "bg-mist text-bark/30"
                       )}>
                          {i === 0 ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3 h-3" />}
                       </div>
                       <div className="space-y-1">
                          <p className="font-bold text-bark text-sm uppercase tracking-widest">{h.status}</p>
                          <p className="text-xs text-bark/40">{format(new Date(h.created_at), 'MMMM dd, yyyy · HH:mm')}</p>
                          {h.note && (
                            <div className="mt-2 p-3 bg-mist/20 rounded-xl border border-mist-dark/5 text-[11px] text-bark/70 font-medium italic">
                               &ldquo;{h.note}&rdquo;
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </section>
         </div>

         {/* Sidebar Intel */}
         <div className="space-y-8">
            {/* Customer & Delivery */}
            <div className="bg-white rounded-[3rem] p-10 border border-mist-dark/10 shadow-premium space-y-8">
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-mist flex items-center justify-center text-bark/20">
                        <User className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Recipient Info</p>
                        <p className="font-bold text-bark">{order.recipient_name || 'Anonymous'}</p>
                        <p className="text-xs text-bark/60 font-medium">{order.recipient_phone}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-mist flex items-center justify-center text-bark/20">
                        <MapPin className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Destination Protocol</p>
                        <p className="font-bold text-bark text-xs leading-tight">
                           {order.address?.street}, {order.address?.building}<br/>
                           {order.address?.district}, {order.address?.city}
                        </p>
                     </div>
                  </div>

                  <div className="p-5 bg-mist/20 rounded-[2rem] border border-mist-dark/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 mb-2">Delivery Window</p>
                     <div className="flex items-center gap-3 text-bark">
                        <Calendar className="w-4 h-4 text-rose" />
                        <span className="text-sm font-bold">{order.delivery_date ? format(new Date(order.delivery_date), 'EEE, MMM dd') : 'ASAP'}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-bark rounded-[3rem] p-10 text-white shadow-xl shadow-bark/20">
               <h3 className="font-display font-bold italic text-white/50 mb-8">Financial Ledger</h3>
               <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                     <span className="text-white/40">Subtotal</span>
                     <span className="font-medium">{formatPrice(parseFloat(order.total_amount) - parseFloat(order.delivery_fee))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-white/40">Logistics Fee</span>
                     <span className="font-medium">+{formatPrice(parseFloat(order.delivery_fee))}</span>
                  </div>
                  {parseFloat(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm text-green-400">
                       <span className="opacity-60">Promotion applied</span>
                       <span className="font-medium">-{formatPrice(parseFloat(order.discount_amount))}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Grand Total</span>
                     <span className="text-2xl font-display font-bold text-white">{formatPrice(parseFloat(order.total_amount))}</span>
                  </div>
                  <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-rose" />
                        <div>
                           <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Protocol</p>
                           <p className="text-xs font-bold uppercase tracking-widest">{order.payment_method.replace('_', ' ')}</p>
                        </div>
                     </div>
                     <span className={cn(
                       "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                       order.payment_status === PaymentStatus.COMPLETED ? "bg-green-500/20 text-green-400" : "bg-rose-500/20 text-rose"
                     )}>
                        {order.payment_status}
                     </span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Override Modal */}
      <AnimatePresence>
        {isOverrideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl space-y-8"
             >
                <div className="space-y-2 text-center">
                   <h3 className="text-3xl font-display font-bold text-bark italic">Status Override</h3>
                   <p className="text-sm text-bark/60">Manually adjust the fulfillment state</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">New Terminal Status</label>
                      <select 
                        value={overrideStatus}
                        onChange={(e) => setOverrideStatus(e.target.value as OrderStatus)}
                        className="w-full h-14 px-5 rounded-2xl border border-mist-dark/10 bg-mist/5 font-bold text-bark"
                      >
                         {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                      </select>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Audit Note (Required)</label>
                      <textarea 
                        value={overrideNote}
                        onChange={(e) => setOverrideNote(e.target.value)}
                        placeholder="Explain the reason for manual intervention..."
                        className="w-full h-32 p-5 rounded-[2rem] border border-mist-dark/10 focus:border-rose/30 transition-all text-sm font-medium resize-none bg-mist/5"
                      />
                   </div>
                </div>

                <div className="flex gap-4">
                   <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsOverrideModalOpen(false)}>Cancel</Button>
                   <Button 
                     className="flex-1 h-14 rounded-2xl bg-rose text-white font-bold"
                     disabled={!overrideNote || overrideMutation.isPending}
                     onClick={() => overrideMutation.mutate({ status: overrideStatus, note: overrideNote })}
                   >
                      {overrideMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Override'}
                   </Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
