"use client";

import { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Search, ChevronRight, 
  ArrowLeft, Loader2, Sparkles,
  SearchX, Package, Clock, CheckCircle2,
  Truck, XCircle, AlertCircle, Calendar
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

import { apiClient } from '@/lib/api/client';
import { Order } from '@/lib/types/order';
import { OrderStatus } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';

const TABS = [
  { label: 'New', value: OrderStatus.PENDING },
  { label: 'Confirmed', value: OrderStatus.CONFIRMED },
  { label: 'Preparing', value: OrderStatus.PREPARING },
  { label: 'Out for Delivery', value: OrderStatus.OUT_FOR_DELIVERY },
  { label: 'Delivered', value: OrderStatus.DELIVERED },
  { label: 'Cancelled', value: OrderStatus.CANCELLED },
];

function SellerOrdersContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('status') || OrderStatus.PENDING;

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['seller-orders', currentTab],
    queryFn: async () => {
      const response = await apiClient.get(`/seller/orders?status=${currentTab}`);
      // Response is likely an array directly
      return response.data as Order[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: OrderStatus }) => {
      return apiClient.put(`/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
    }
  });

  const setTab = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    router.push(`/seller/orders?${params.toString()}`);
  };

  const getAction = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING:
        return { label: 'Accept Order', next: OrderStatus.CONFIRMED, icon: <CheckCircle2 className="w-4 h-4" /> };
      case OrderStatus.CONFIRMED:
        return { label: 'Start Preparing', next: OrderStatus.PREPARING, icon: <Clock className="w-4 h-4" /> };
      case OrderStatus.PREPARING:
        return { label: 'Ready for Delivery', next: OrderStatus.OUT_FOR_DELIVERY, icon: <Truck className="w-4 h-4" /> };
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-6 max-w-6xl pt-12 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/seller/dashboard')} 
                className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
              >
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-1">
                 <div className="flex items-center gap-2 text-rose mb-1">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Vendor Operations</span>
                 </div>
                 <h1 className="text-3xl font-display font-bold text-bark italic">Fullfillment Hub</h1>
              </div>
           </div>
           
           <div className="bg-white p-2 rounded-2xl shadow-sm border border-mist-dark/10 flex items-center gap-2">
              <div className="relative">
                 <input 
                   type="text" 
                   placeholder="Search Order ID..." 
                   className="pl-10 pr-4 py-2 bg-mist/30 rounded-xl text-sm border-transparent focus:bg-white focus:border-rose/30 transition-all outline-none"
                 />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bark/20" />
              </div>
           </div>
        </header>

        {/* Status Filter Tabs */}
        <section className="overflow-x-auto no-scrollbar -mx-6 px-6">
           <div className="flex items-center gap-3 min-w-max bg-white/50 p-2 rounded-[2.5rem] border border-mist-dark/10 backdrop-blur-sm shadow-inner">
              {TABS.map((tab) => (
                 <button
                   key={tab.value}
                   onClick={() => setTab(tab.value)}
                   className={cn(
                     "px-6 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all shrink-0",
                     currentTab === tab.value 
                       ? "bg-rose text-white shadow-lg shadow-rose/20" 
                       : "text-bark/40 hover:text-rose hover:bg-rose/5"
                   )}
                 >
                    {tab.label}
                 </button>
              ))}
           </div>
        </section>

        {/* Orders List */}
        <div className="space-y-6 min-h-[400px]">
           {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                 <Loader2 className="w-12 h-12 text-rose animate-spin" />
                 <p className="text-xs font-black uppercase tracking-widest text-bark/30 animate-pulse italic">Retrieving your orders...</p>
              </div>
           ) : orders && orders.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                 {orders.map((order) => {
                    const action = getAction(order.status);
                    const firstItem = order.items?.[0]?.product_snapshot;
                    const itemName = firstItem?.name || 'Handcrafted Arrangement';
                    const itemCount = (order.items?.length || 1);

                    return (
                      <motion.div 
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-premium overflow-hidden group hover:border-rose/30 transition-all duration-500"
                      >
                         <div className="flex flex-col lg:flex-row lg:items-center">
                            {/* Order Info Section */}
                            <div className="p-8 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-mist-dark/5 space-y-4">
                               <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-bark/30 italic">Order #{order.id.slice(0, 8).toUpperCase()}</span>
                                  <Badge className={cn("rounded-lg capitalize font-bold", 
                                    order.status === OrderStatus.PENDING ? "bg-amber-100 text-amber-600" :
                                    order.status === OrderStatus.CANCELLED ? "bg-rose-100 text-rose-600" : "bg-green-100 text-green-600")}>
                                     {order.status}
                                  </Badge>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-2xl bg-mist flex items-center justify-center text-bark/20 shrink-0 overflow-hidden relative">
                                     {firstItem?.images?.[0] ? <Image src={firstItem.images[0].url} alt={itemName} fill className="object-cover" /> : <ShoppingBag className="w-6 h-6" />}
                                  </div>
                                  <div className="min-w-0">
                                     <p className="font-bold text-bark truncate">{itemName}</p>
                                     <p className="text-xs text-muted-foreground">{itemCount > 1 ? `With ${itemCount - 1} more items` : 'Single Item Order'}</p>
                                  </div>
                               </div>
                            </div>

                            {/* Center Info Section */}
                            <div className="p-8 lg:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8">
                               <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-bark/40">
                                     <Calendar className="w-4 h-4" />
                                     <span className="text-[10px] font-black uppercase tracking-widest">Delivery Target</span>
                                  </div>
                                  <p className="font-bold text-sm text-bark">
                                     {order.delivery_date ? format(new Date(order.delivery_date), 'MMM dd, yyyy') : 'Asap'}
                                  </p>
                                  <p className="text-xs text-muted-foreground italic">{order.slot?.start_time ? `${order.slot.start_time} - ${order.slot.end_time}` : 'Standard Window'}</p>
                               </div>

                               <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-bark/40">
                                     <ShoppingBag className="w-4 h-4" />
                                     <span className="text-[10px] font-black uppercase tracking-widest">Net Revenue</span>
                                  </div>
                                  <p className="text-xl font-display font-bold text-rose">
                                     {formatPrice(parseFloat(order.total_amount))}
                                  </p>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-bark/20 italic">TMT Settlement Pending</p>
                               </div>
                            </div>

                            {/* Actions Section */}
                            <div className="p-8 lg:w-1/4 bg-mist/10 flex flex-col justify-center gap-3">
                               {action && (
                                 <Button 
                                    onClick={() => updateStatusMutation.mutate({ id: order.id, status: action.next })}
                                    className="w-full h-12 rounded-xl bg-bark hover:bg-rose text-white font-bold gap-2 shadow-lg shadow-bark/10 transition-all group/btn"
                                 >
                                    {action.icon}
                                    {action.label}
                                 </Button>
                               )}
                               <Link href={`/seller/orders/${order.id}`} className="w-full">
                                  <Button variant="outline" className="w-full h-12 rounded-xl border-mist-dark/20 text-bark font-bold hover:bg-white gap-2 transition-all">
                                     View Details
                                     <ChevronRight className="w-4 h-4" />
                                  </Button>
                               </Link>
                            </div>
                         </div>
                      </motion.div>
                    );
                 })}
              </div>
           ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 space-y-8 bg-white/50 border-2 border-dashed border-mist-dark/20 rounded-[3rem] text-center"
              >
                 <div className="p-8 bg-white rounded-full shadow-premium text-bark/10">
                    <Package className="w-20 h-20" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-display font-bold text-bark italic">No orders in "{TABS.find(t => t.value === currentTab)?.label}"</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium leading-relaxed">
                       When you receive new orders or update their status, they will appear here in the appropriate category.
                    </p>
                 </div>
              </motion.div>
           )}
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

export default function SellerOrdersPage() {
  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-cream/30">
          <Loader2 className="w-12 h-12 text-rose animate-spin" />
        </div>
      }>
        <SellerOrdersContent />
      </Suspense>
    </div>
  );
}
