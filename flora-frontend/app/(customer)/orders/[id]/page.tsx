"use client";

import Image from 'next/image';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, MapPin, Calendar, Clock, CreditCard, 
  ChevronRight, Loader2, AlertCircle, Sparkles, 
  ReceiptText, ArrowLeft, Upload, Send, Trash2,
  HelpCircle, MessageCircle, Ban, History,
  FileText, ExternalLink, RefreshCcw
} from 'lucide-react';
import { format, differenceInSeconds, parseISO } from 'date-fns';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { Order, OrderItem } from '@/lib/types/order';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { useCountdown } from '@/lib/hooks/useCountdown';
import IssueReportModal from '@/components/shared/IssueReportModal';

function OrderDetailsContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = searchParams.get('new') === 'true';

  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data as Order;
    },
    enabled: !!id
  });

  // Cancellation countdown
  const secondsLeft = useMemo(() => {
    if (!order || order.status !== OrderStatus.PENDING) return 0;
    const createdAt = parseISO(order.created_at);
    const diff = differenceInSeconds(new Date(), createdAt);
    const remaining = 30 * 60 - diff;
    return remaining > 0 ? remaining : 0;
  }, [order]);

  const { seconds: remainingSeconds, formatTime: formatRemainingTime, isActive: canCancel } = useCountdown(secondsLeft);

  const cancelOrderMutation = useMutation({
    mutationFn: async (reason: string) => {
      return apiClient.put(`/orders/${id}/status`, { status: OrderStatus.CANCELLED, note: reason });
    },
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel order');
    }
  });

  const uploadProofMutation = useMutation({
    mutationFn: async (url: string) => {
      // Assuming GET /orders/:id returns payment info or payment_id is needed
      const paymentId = (order as any)?.payment_id || id; // Fallback to order ID if payment ID not explicit
      return apiClient.post(`/payments/${paymentId}/proof`, { image_url: url });
    },
    onSuccess: () => {
      toast.success('Payment proof uploaded successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload proof');
    }
  });

  const refundMutation = useMutation({
    mutationFn: async (data: { reason: string, amount: string }) => {
      const paymentId = (order as any)?.payment_id || id;
      return apiClient.post(`/payments/${paymentId}/refund`, data);
    },
    onSuccess: () => {
      toast.success('Refund request submitted');
      setShowRefundModal(false);
      refetch();
    }
  });

  const parseSnapshot = (item: OrderItem) => {
    if (!item.product_snapshot) return null;
    try {
      return typeof item.product_snapshot === 'string' 
        ? JSON.parse(item.product_snapshot) 
        : item.product_snapshot;
    } catch (e) {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-cream/30">
        <Loader2 className="w-12 h-12 text-rose animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream/30 space-y-4 text-center">
        <div className="p-4 bg-rose/10 rounded-full text-rose">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-display font-bold text-bark">Order Not Found</h2>
        <p className="text-muted-foreground max-w-xs">We couldn't find the order you're looking for. It might have been deleted or moved.</p>
        <Button onClick={() => router.push('/orders')} className="bg-bark text-white rounded-2xl h-14 px-8">View All Orders</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream/30 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-mist-dark/10 py-8 sticky top-0 z-30 shadow-soft">
        <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
          <button onClick={() => router.back()} className="p-3 bg-mist rounded-2xl hover:bg-rose/10 hover:text-rose transition-all group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-display font-bold text-bark tracking-tight">Order Details</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-8">
        {/* Celebration State */}
        <AnimatePresence>
          {isNew && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bark text-white rounded-[3rem] p-12 text-center relative overflow-hidden group shadow-premium mb-12"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose/20 blur-[100px] rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -ml-32 -mb-32" />
              
              <div className="relative z-10 space-y-6">
                <div className="inline-flex p-4 bg-rose/20 rounded-full text-rose animate-bounce">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h2 className="text-4xl font-display font-bold">Order Placed Successfully!</h2>
                <p className="text-white/60 max-w-lg mx-auto font-medium">
                  Thank you for choosing Flora. We've notified the seller and your beautiful blooms will be on their way soon.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                  <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                    <span className="block text-[10px] uppercase font-black tracking-widest text-white/40">Order Number</span>
                    <span className="font-bold text-lg tracking-widest">#{order.id.slice(0, 12).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Simple Confetti-like particles using Framer Motion */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * 800 - 400, 
                    y: -100, 
                    rotate: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    y: 600, 
                    rotate: 360,
                    opacity: 0
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2, 
                    repeat: Infinity,
                    delay: Math.random() * 2 
                  }}
                  className={cn(
                    "absolute w-2 h-2 rounded-sm",
                    i % 3 === 0 ? "bg-rose" : i % 3 === 1 ? "bg-amber-400" : "bg-indigo-400"
                  )}
                  style={{ top: 0, left: '50%' }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Items Card */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-mist-dark/10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-display font-bold text-bark flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-rose" />
                  Ordered Items
                </h3>
                <span className="bg-mist text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-bark/40">
                  {order.items?.length} Items
                </span>
              </div>
              
              <div className="space-y-6">
                {order.items?.map((item) => {
                  const snapshot = parseSnapshot(item);
                  return (
                    <div key={item.id} className="flex gap-6 pb-6 border-b border-mist-dark/5 last:border-0 last:pb-0">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden bg-mist shrink-0 border border-mist-dark/5 shadow-inner relative">
                        <Image 
                          src={snapshot?.images?.find((img: any) => img.is_primary)?.image_url || snapshot?.images?.[0]?.image_url || '/placeholder-product.png'} 
                          alt={snapshot?.name || 'Product'} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-bold text-bark text-lg truncate">{snapshot?.name || `Product ID: ${item.product_id}`}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          {item.quantity} × {formatPrice(parseFloat(item.unit_price))}
                        </p>
                        {item.variant_id && (
                          <span className="inline-block bg-mist/50 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg text-bark/40">
                            {snapshot?.variants?.find((v: any) => v.id === item.variant_id)?.name || 'Standard Variant'}
                          </span>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.addons.map((addon: any, idx: number) => (
                              <span key={idx} className="bg-rose/5 text-rose text-[10px] font-bold px-2 py-0.5 rounded-full">
                                + {addon.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-display font-bold text-rose">{formatPrice(parseFloat(item.total_price))}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-mist-dark/10 space-y-6">
                <div className="flex items-center gap-3 text-rose">
                  <MapPin className="w-6 h-6" />
                  <h3 className="text-xl font-display font-bold text-bark">Delivery Address</h3>
                </div>
                <div className="space-y-4">
                   <div className="p-5 bg-mist/20 rounded-3xl border border-mist-dark/5">
                      <p className="font-bold text-bark mb-1 uppercase tracking-tight">{order.address?.label}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {order.address?.street}, {order.address?.building}
                        {order.address?.apartment ? `, Apt ${order.address?.apartment}` : ''}<br />
                        {order.address?.district}, {order.address?.city}
                      </p>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-mist/20 rounded-3xl border border-mist-dark/5 space-y-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-bark/30 block">Recipient</span>
                         <p className="text-xs font-bold text-bark">{order.recipient_name || 'Manual Customer'}</p>
                      </div>
                      <div className="p-4 bg-mist/20 rounded-3xl border border-mist-dark/5 space-y-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-bark/30 block">Phone</span>
                         <p className="text-xs font-bold text-bark">{order.recipient_phone || 'N/A'}</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-mist-dark/10 space-y-6">
                <div className="flex items-center gap-3 text-rose">
                  <Calendar className="w-6 h-6" />
                  <h3 className="text-xl font-display font-bold text-bark">Schedule</h3>
                </div>
                <div className="space-y-4">
                   <div className="p-5 bg-mist/20 rounded-3xl border border-mist-dark/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-bark/30 block">Delivery Date</span>
                        <p className="font-bold text-bark">{order.delivery_date ? format(parseISO(order.delivery_date), 'MMMM d, yyyy') : 'N/A'}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-bark/10" />
                   </div>
                   <div className="p-5 bg-mist/20 rounded-3xl border border-mist-dark/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-bark/30 block">Time Slot</span>
                        <p className="font-bold text-bark">{order.slot ? `${order.slot.start_time.slice(0, 5)} - ${order.slot.end_time.slice(0, 5)}` : 'N/A'}</p>
                      </div>
                      <Clock className="w-8 h-8 text-bark/10" />
                   </div>
                </div>
              </div>
            </div>

            {/* Messages & Instructions */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-mist-dark/10">
              <h3 className="text-xl font-display font-bold text-bark mb-8 flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-rose" />
                Messages & Instructions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-2">Gift Message</label>
                  <div className="p-6 bg-rose/5 border border-rose/10 rounded-3xl italic text-sm text-bark font-medium min-h-[100px]">
                    {order.gift_message ? `"${order.gift_message}"` : 'No gift message provided.'}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-2">Courier Instructions</label>
                  <div className="p-6 bg-indigo-50/30 border border-indigo-100/50 rounded-3xl italic text-sm text-bark font-medium min-h-[100px]">
                    {order.special_instructions ? `"${order.special_instructions}"` : 'No special instructions provided.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Status History Card */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-mist-dark/10">
              <h3 className="text-xl font-display font-bold text-bark mb-8 flex items-center gap-3">
                <History className="w-6 h-6 text-rose" />
                Order Timeline
              </h3>
              <OrderTimeline history={order.status_history || []} />
            </div>

            {/* Payment Summary Card */}
            <div className="bg-bark text-white rounded-[2.5rem] p-10 shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose/20 blur-3xl rounded-full -mr-16 -mt-16" />
              <div className="relative z-10 space-y-6">
                <h3 className="text-xl font-display font-bold flex items-center gap-3">
                  <ReceiptText className="w-6 h-6 text-rose" />
                  Payment Summary
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-white/60 text-sm font-medium">
                    <span>Items Total</span>
                    <span className="text-white">{formatPrice(parseFloat(order.total_amount) - parseFloat(order.delivery_fee) + parseFloat(order.discount_amount))}</span>
                  </div>
                  <div className="flex justify-between text-white/60 text-sm font-medium">
                    <span>Delivery Fee</span>
                    <span className="text-white">{formatPrice(parseFloat(order.delivery_fee))}</span>
                  </div>
                  {parseFloat(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-green-400 text-sm font-bold">
                      <span>Discount</span>
                      <span>-{formatPrice(parseFloat(order.discount_amount))}</span>
                    </div>
                  )}
                  <div className="h-px bg-white/10 my-4" />
                  <div className="flex justify-between items-end">
                    <span className="font-bold">Total Paid</span>
                    <span className="text-3xl font-display font-bold text-rose">{formatPrice(parseFloat(order.total_amount))}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Method</span>
                      <span className="text-xs font-bold uppercase">{order.payment_method.replace('_', ' ')}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Status</span>
                      <span className={cn(
                        "text-xs font-black uppercase px-2.5 py-1 rounded-full",
                        order.payment_status === PaymentStatus.COMPLETED ? "bg-green-600/20 text-green-400" : "bg-amber-600/20 text-amber-400"
                      )}>
                        {order.payment_status}
                      </span>
                   </div>
                </div>

                {order.payment_method === PaymentMethod.BANK_TRANSFER && order.payment_status === PaymentStatus.PENDING && (
                  <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-rose">
                       <CreditCard className="w-5 h-5" />
                       <span className="font-bold text-sm">Action Required</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed font-medium">
                      Please transfer <span className="text-white font-bold">{formatPrice(parseFloat(order.total_amount))}</span> to the seller account and upload your receipt below.
                    </p>
                    <div className="space-y-3 pt-2">
                       <input 
                         type="text" 
                         placeholder="Receipt Image URL" 
                         className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-rose/50 outline-none text-white placeholder:text-white/20"
                         value={proofUrl}
                         onChange={(e) => setProofUrl(e.target.value)}
                       />
                       <Button 
                         onClick={() => uploadProofMutation.mutate(proofUrl)}
                         disabled={!proofUrl || uploadProofMutation.isPending}
                         className="w-full h-10 bg-rose text-white rounded-xl text-xs font-black uppercase"
                       >
                         {uploadProofMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload Proof'}
                       </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-mist-dark/10 space-y-4">
              <h3 className="text-lg font-display font-bold text-bark mb-4">Order Actions</h3>
              
              {canCancel && (
                <div className="space-y-3">
                   <div className="p-4 bg-rose/5 border border-rose/10 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Clock className="w-5 h-5 text-rose animate-pulse" />
                         <div>
                            <p className="text-xs font-black text-rose uppercase tracking-widest">Limited Window</p>
                            <p className="text-[10px] text-rose/60 font-bold">Expires in {formatRemainingTime()}</p>
                         </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowCancelModal(true)}
                        className="text-rose hover:bg-rose/10 h-10 px-4 rounded-xl text-xs font-black uppercase"
                      >
                        Cancel Order
                      </Button>
                   </div>
                </div>
              )}

              {order.status === OrderStatus.DELIVERED && (
                <Button 
                  onClick={() => setShowRefundModal(true)}
                  className="w-full h-14 bg-mist text-bark rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-mist-dark/10 transition-all"
                >
                  <RefreshCcw className="w-5 h-5" />
                  Request Refund
                </Button>
              )}

              <Button 
                variant="ghost"
                onClick={() => setShowReportModal(true)}
                className="w-full h-14 border-2 border-mist text-bark rounded-2xl font-bold flex items-center justify-center gap-2 hover:border-rose/20 hover:text-rose transition-all"
              >
                <HelpCircle className="w-5 h-5" />
                Report an Issue
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/20 backdrop-blur-sm animate-in fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-premium"
            >
              <div className="p-4 bg-rose/10 rounded-full text-rose w-fit mb-6">
                <Ban className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-display font-bold text-bark mb-4">Cancel Your Order?</h3>
              <p className="text-muted-foreground mb-8 font-medium">This action cannot be undone. Please let us know the reason for cancellation.</p>
              
              <textarea 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why are you cancelling this order?"
                className="w-full h-32 p-4 bg-mist/30 border-2 border-mist-dark/10 rounded-3xl mb-8 focus:border-rose focus:ring-4 focus:ring-rose/10 transition-all outline-none"
              />

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setShowCancelModal(false)} className="flex-1 h-16 rounded-2xl font-bold">No, Keep Order</Button>
                <Button 
                  onClick={() => cancelOrderMutation.mutate(cancelReason)} 
                  disabled={cancelOrderMutation.isPending || !cancelReason}
                  className="flex-1 h-16 bg-rose text-white rounded-2xl font-bold shadow-lg shadow-rose/20"
                >
                  {cancelOrderMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Yes, Cancel Order'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Refund Modal */}
      <AnimatePresence>
        {showRefundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/20 backdrop-blur-sm animate-in fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-premium"
            >
              <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 w-fit mb-6">
                <RefreshCcw className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-display font-bold text-bark mb-4">Request a Refund</h3>
              <p className="text-muted-foreground mb-8 font-medium">We're sorry the order wasn't perfect. Tell us what went wrong and how much you'd like refunded.</p>
              
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-mist/30 rounded-2xl flex items-center justify-between">
                   <span className="text-sm font-bold text-bark/40">Refund Amount</span>
                   <span className="text-xl font-display font-bold text-rose">{formatPrice(parseFloat(order.total_amount))}</span>
                </div>
                <textarea 
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Tell us about the issue..."
                  className="w-full h-32 p-4 bg-mist/30 border-2 border-mist-dark/10 rounded-3xl focus:border-rose focus:ring-4 focus:ring-rose/10 transition-all outline-none"
                />
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setShowRefundModal(false)} className="flex-1 h-16 rounded-2xl font-bold text-bark/60">Cancel</Button>
                <Button 
                  onClick={() => refundMutation.mutate({ reason: refundReason, amount: order.total_amount })} 
                  disabled={refundMutation.isPending || !refundReason}
                  className="flex-1 h-16 bg-bark text-white rounded-2xl font-bold shadow-lg shadow-bark/20"
                >
                  {refundMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Submit Request'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <IssueReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        orderId={order.id}
      />
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream/30">
        <Loader2 className="w-12 h-12 text-rose animate-spin" />
      </div>
    }>
      <OrderDetailsContent />
    </Suspense>
  );
}
