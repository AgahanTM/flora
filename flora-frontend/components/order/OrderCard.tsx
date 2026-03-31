"use client";

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Clock, ArrowRight, Package, 
  Trash2, AlertCircle, CheckCircle2, 
  ChevronRight, Calendar, CreditCard, Ban
} from 'lucide-react';
import Link from 'next/link';
import { format, differenceInSeconds, parseISO } from 'date-fns';
import { toast } from '@/lib/utils/toast';

import { Order, OrderItem } from '@/lib/types/order';
import { OrderStatus, PaymentStatus } from '@/lib/types/api';
import { OrderStatusBadge } from './OrderStatusBadge';
import { formatPrice } from '@/lib/utils/format';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface OrderCardProps {
  order: Order;
  onStatusUpdate?: () => void;
}

export const OrderCard = memo(function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Cancellation logic: Pending and < 30 min old
  const canCancel = order.status === OrderStatus.PENDING;
  const createdAt = parseISO(order.created_at);
  const limit = 30 * 60; // 30 minutes in seconds

  useEffect(() => {
    if (!canCancel) return;

    const timer = setInterval(() => {
      const secondsPassed = differenceInSeconds(new Date(), createdAt);
      const remaining = limit - secondsPassed;
      
      if (remaining <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [canCancel, createdAt]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    setIsCancelling(true);
    try {
      await apiClient.put(`/orders/${order.id}/status`, { status: OrderStatus.CANCELLED });
      toast.success('Order cancelled successfully');
      onStatusUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  // Get product data from snapshot
  const firstItem = order.items?.[0];
  const snapshot = firstItem?.product_snapshot;
  const productName = snapshot?.name || 'Flora Selection';
  const productImage = snapshot?.images?.[0]?.url || '/images/placeholder-product.jpg';
  const otherItemsCount = (order.items?.length || 0) - 1;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] overflow-hidden shadow-soft border border-mist-dark/10 group hover:shadow-premium transition-all duration-500 relative"
    >
      {/* Top Header info */}
      <div className="bg-mist/30 px-8 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-mist-dark/5">
         <div className="flex items-center gap-6">
            <div className="space-y-0.5">
               <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Order Info</span>
               <p className="font-bold text-sm text-bark">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="w-px h-8 bg-bark/10 hidden sm:block" />
            <div className="space-y-0.5">
               <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Placed Date</span>
               <p className="font-bold text-sm text-bark">{format(createdAt, 'MMM d, yyyy')}</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <span className={cn(
              "text-[10px] font-black uppercase px-3 py-1 rounded-full border shadow-sm",
              order.payment_status === PaymentStatus.COMPLETED ? "bg-green-50 text-green-600 border-green-200" :
              order.payment_status === PaymentStatus.FAILED ? "bg-rose-50 text-rose-600 border-rose-200" :
              "bg-amber-50 text-amber-600 border-amber-200"
            )}>
              {order.payment_status}
            </span>
            <OrderStatusBadge status={order.status} />
         </div>
      </div>

      <div className="p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
         {/* Product image from snapshot */}
         <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-sm border border-mist-dark/10 bg-mist relative">
               <Image src={productImage} alt={productName} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            {otherItemsCount > 0 && (
               <div className="absolute -bottom-2 -right-2 bg-bark text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg border-2 border-white shadow-xl">
                  +{otherItemsCount} more
               </div>
            )}
         </div>

         <div className="flex-1 min-w-0 space-y-2">
            <h4 className="text-xl font-display font-bold text-bark truncate">{productName}</h4>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
               <div className="flex items-center gap-1.5 capitalize">
                  <CreditCard className="w-4 h-4 text-bark/20" />
                  {order.payment_method.replace('_', ' ')}
               </div>
               <div className="w-1 h-1 bg-bark/10 rounded-full" />
               <div className="text-bark font-bold text-lg">
                  {formatPrice(parseFloat(order.total_amount))}
               </div>
            </div>
         </div>

         <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-mist-dark/5">
            <AnimatePresence>
               {timeLeft !== null && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center p-4 bg-rose/5 rounded-[1.5rem] border border-rose/10 group/cancel min-w-[140px]"
                  >
                     <span className="text-[9px] font-black uppercase tracking-widest text-rose/50 mb-1">Time to Cancel</span>
                     <div className="flex items-center gap-2 text-rose font-display font-bold text-lg leading-none">
                        <Clock className="w-4 h-4" />
                        {formatTime(timeLeft)}
                     </div>
                     <button 
                       onClick={handleCancel}
                       disabled={isCancelling}
                       className="mt-3 text-[10px] font-black uppercase text-rose hover:underline disabled:opacity-50"
                     >
                        {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                     </button>
                  </motion.div>
               )}
            </AnimatePresence>

            <Link href={`/orders/${order.id}`} className="block w-full">
               <Button className="w-full h-14 rounded-2xl bg-bark hover:bg-rose text-white font-bold gap-3 group/btn px-8 shadow-xl shadow-bark/10 hover:shadow-rose/20 transition-all">
                  Order Details
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
               </Button>
            </Link>
         </div>
      </div>
    </motion.div>
  );
});
