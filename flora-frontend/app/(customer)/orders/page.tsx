"use client";

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Search, ChevronLeft, 
  ChevronRight, ArrowLeft, Loader2, Sparkles,
  SearchX
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { apiClient } from '@/lib/api/client';
import { Order } from '@/lib/types/order';
import { OrderStatus } from '@/lib/types/api';
import { OrderCard } from '@/components/order/OrderCard';
import { OrderCardSkeleton } from '@/components/shared/Skeletons';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LIMIT = 10;

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: OrderStatus.PENDING },
  { label: 'Confirmed', value: OrderStatus.CONFIRMED },
  { label: 'Preparing', value: OrderStatus.PREPARING },
  { label: 'Out for Delivery', value: OrderStatus.OUT_FOR_DELIVERY },
  { label: 'Delivered', value: OrderStatus.DELIVERED },
  { label: 'Cancelled', value: OrderStatus.CANCELLED },
];

function OrdersListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('status') || 'all';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const offset = (currentPage - 1) * LIMIT;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', { status: currentTab, offset, limit: LIMIT }],
    queryFn: async () => {
      const statusParam = currentTab === 'all' ? '' : `&status=${currentTab}`;
      const response = await apiClient.get(`/orders?limit=${LIMIT}&offset=${offset}${statusParam}`);
      return response.data as Order[];
    }
  });

  const setTab = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'all') params.delete('status');
    else params.set('status', status);
    params.set('page', '1');
    router.push(`/orders?${params.toString()}`);
  };

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/orders?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-6 max-w-5xl pt-12 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/dashboard')} 
                className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
              >
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-1">
                 <div className="flex items-center gap-2 text-rose mb-1">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">My Account</span>
                 </div>
                 <h1 className="text-3xl font-display font-bold text-bark">Order History</h1>
              </div>
           </div>
           
           <div className="bg-white p-2 rounded-2xl shadow-sm border border-mist-dark/10 flex items-center gap-2">
              <div className="relative">
                 <input 
                   type="text" 
                   placeholder="Search ID..." 
                   className="pl-10 pr-4 py-2 bg-mist/30 rounded-xl text-sm border-transparent focus:bg-white focus:border-rose/30 transition-all outline-none"
                 />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bark/20" />
              </div>
           </div>
        </header>

        {/* Filter Tabs */}
        <section className="overflow-x-auto no-scrollbar -mx-6 px-6">
           <div className="flex items-center gap-3 min-w-max bg-white/50 p-2 rounded-[2.5rem] border border-mist-dark/10 backdrop-blur-sm shadow-inner">
              {TABS.map((tab) => (
                 <button
                   key={tab.value}
                   onClick={() => setTab(tab.value)}
                   className={cn(
                     "px-6 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all",
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

        {/* Total Count & Summary */}
        <div className="flex items-center justify-between">
           <p className="text-xs font-black uppercase tracking-widest text-bark/30">
              Showing <span className="text-bark">{data?.length || 0}</span> orders
           </p>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-bark/50">Live Status Tracking Active</span>
           </div>
        </div>

        {/* Orders List */}
        <div className="space-y-8 min-h-[400px]">
           {isLoading ? (
              <div className="space-y-6">
                 {[...Array(4)].map((_, i) => (
                    <OrderCardSkeleton key={i} />
                 ))}
              </div>
           ) : data && data.length > 0 ? (
              <div className="space-y-6">
                 {data.map((order) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onStatusUpdate={() => refetch()} 
                    />
                 ))}

                 {/* Pagination */}
                 <div className="pt-12 flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-12 w-12 rounded-2xl bg-white shadow-sm hover:text-rose disabled:opacity-30"
                    >
                       <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="text-sm font-black text-rose bg-white px-6 py-3 rounded-2xl shadow-sm border border-rose/10">
                       Page {currentPage}
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => setPage(currentPage + 1)}
                      disabled={data.length < LIMIT}
                      className="h-12 w-12 rounded-2xl bg-white shadow-sm hover:text-rose disabled:opacity-30"
                    >
                       <ChevronRight className="w-5 h-5" />
                    </Button>
                 </div>
              </div>
           ) : (
               <EmptyState 
                 icon={currentTab === 'all' ? ShoppingBag : SearchX}
                 title="No orders found"
                 description={currentTab === 'all' 
                   ? "It looks like you haven't started your floral journey yet. Let's send some love!"
                   : `You don't have any orders with status "${currentTab}" at the moment.`}
                 actionLabel="Start Shopping"
                 actionHref="/products"
               />
           )}
        </div>
      </div>
  );
}

export default function OrdersListPage() {
  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-cream/30">
          <Loader2 className="w-12 h-12 text-rose animate-spin" />
        </div>
      }>
        <OrdersListContent />
      </Suspense>
    </div>
  );
}
