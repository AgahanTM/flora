"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShoppingBag, Search, Filter, 
  Calendar, CheckCircle2, Clock, 
  AlertCircle, ChevronRight, MoreVertical,
  ExternalLink, ArrowUpRight, Ban,
  FileText, History, Loader2,
  Package, DollarSign, User, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';

import { apiClient } from '@/lib/api/client';
import { adminApi } from '@/lib/api/admin';
import { Order } from '@/lib/types/order';
import { OrderStatus } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [overrideNote, setOverrideNote] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', activeStatus],
    queryFn: async () => {
      const url = activeStatus === 'all' ? '/admin/orders' : `/admin/orders?status=${activeStatus}`;
      const { data } = await apiClient.get(url);
      return data as Order[];
    }
  });

  const overrideMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string, status: OrderStatus, note: string }) => 
      adminApi.updateOrderStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setIsOverrideModalOpen(false);
      setSelectedOrder(null);
      setOverrideNote('');
      toast.success('Order status overridden successfully');
    }
  });

  const filteredOrders = orders?.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => o.status === OrderStatus.PENDING).length || 0,
    processing: orders?.filter(o => [OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(o.status)).length || 0,
    delivered: orders?.filter(o => o.status === OrderStatus.DELIVERED).length || 0,
  };

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <Package className="w-4 h-4" />
            Full Inventory History
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">Global Order Registry</h1>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-80 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bark/20 group-focus-within:text-rose transition-colors" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Order ID or Recipient..."
                className="h-14 pl-14 rounded-2xl border-mist-dark/10 shadow-sm"
              />
           </div>
           <Button variant="outline" className="h-14 w-14 p-0 rounded-2xl border-mist-dark/10 group">
              <Filter className="w-5 h-5 text-bark/40 group-hover:text-rose transition-colors" />
           </Button>
        </div>
      </header>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Platform Volume', value: stats.total, color: 'bark' },
           { label: 'Awaiting Action', value: stats.pending, color: 'amber' },
           { label: 'Active Fulfillment', value: stats.processing, color: 'rose' },
           { label: 'Delivered Luxury', value: stats.delivered, color: 'green' }
         ].map((s, i) => (
           <div key={i} className="bg-white p-6 rounded-[2rem] border border-mist-dark/10 shadow-soft">
              <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 mb-1">{s.label}</p>
              <p className={cn("text-2xl font-display font-bold", `text-${s.color}`)}>{s.value}</p>
           </div>
         ))}
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-mist/30 rounded-2xl w-fit">
         {['all', ...Object.values(OrderStatus)].map((status) => (
           <button
             key={status}
             onClick={() => setActiveStatus(status)}
             className={cn(
               "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeStatus === status 
                 ? "bg-white text-rose shadow-sm" 
                 : "text-bark/40 hover:text-bark"
             )}
           >
             {status}
           </button>
         ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[3rem] border border-mist-dark/10 shadow-premium overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-mist/10 text-[10px] font-black uppercase tracking-widest text-bark/30">
                     <th className="px-8 py-6">Order Intelligence</th>
                     <th className="px-8 py-6">Consignee</th>
                     <th className="px-8 py-6">Financials</th>
                     <th className="px-8 py-6">Fulfillment</th>
                     <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-mist-dark/5">
                  {isLoading ? (
                    <tr><td colSpan={5} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30 mx-auto" /></td></tr>
                  ) : filteredOrders && filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="group hover:bg-cream/20 transition-colors">
                         <td className="px-8 py-6">
                            <div className="space-y-1">
                               <p className="font-mono text-xs font-bold text-bark group-hover:text-rose transition-colors">#{order.id.slice(0, 8).toUpperCase()}</p>
                               <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                                    order.status === OrderStatus.DELIVERED ? "bg-green-100 text-green-600" :
                                    order.status === OrderStatus.CANCELLED ? "bg-rose-100 text-rose" : "bg-amber-100 text-amber-600"
                                  )}>
                                     {order.status}
                                  </span>
                                  <span className="text-[10px] text-bark/40 italic font-medium">
                                     {format(new Date(order.created_at), 'MM/dd HH:mm')}
                                  </span>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-mist flex items-center justify-center">
                                  <User className="w-4 h-4 text-bark/20" />
                               </div>
                               <div>
                                  <p className="text-xs font-bold text-bark">{order.recipient_name || 'Anonymous'}</p>
                                  <p className="text-[10px] font-medium text-bark/40">{order.recipient_phone || 'No phone'}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="space-y-0.5">
                               <p className="text-sm font-bold text-bark">{formatPrice(parseFloat(order.total_amount))}</p>
                               <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-bark/30">
                                  <DollarSign className="w-3 h-3" /> {order.payment_method.replace('_', ' ')}
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-mist/30 flex items-center justify-center text-rose">
                                  <Truck className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Destination</p>
                                  <p className="text-xs font-bold text-bark truncate max-w-[140px]">{order.address?.district || 'Central District'}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                               <Button 
                                 size="sm" 
                                 onClick={() => {
                                   setSelectedOrder(order);
                                   setOverrideStatus(order.status);
                                   setIsOverrideModalOpen(true);
                                 }}
                                 className="h-10 w-10 p-0 rounded-xl bg-bark hover:bg-rose text-white shadow-lg shadow-bark/10"
                                 title="Override Status"
                               >
                                  <History className="w-5 h-5" />
                               </Button>
                               <Link 
                                 href={`/admin/orders/${order.id}`}
                                 className="h-10 w-10 flex items-center justify-center rounded-xl bg-mist/30 text-bark hover:bg-rose hover:text-white transition-all shadow-sm"
                               >
                                  <ArrowUpRight className="w-5 h-5" />
                               </Link>
                            </div>
                         </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="py-24 text-center font-display text-bark/20 italic">No orders archived in this sector</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Override Modal */}
      <AnimatePresence>
        {isOverrideModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="bg-white w-full h-full sm:h-auto sm:max-w-lg p-6 sm:p-10 sm:rounded-[2.5rem] shadow-2xl space-y-8 overflow-y-auto"
             >
                <div className="space-y-2 text-center">
                   <h3 className="text-3xl font-display font-bold text-bark italic">Status Override</h3>
                   <p className="text-sm text-bark/60">Manually adjust the fulfillment state for Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">New Terminal Status</label>
                      <select 
                        value={overrideStatus}
                        onChange={(e) => setOverrideStatus(e.target.value as OrderStatus)}
                        className="w-full h-14 px-5 rounded-2xl border border-mist-dark/10 bg-mist/5 font-bold text-bark focus:ring-rose/20"
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
                   <Button 
                     variant="ghost" 
                     className="flex-1 h-14 rounded-2xl font-bold"
                     onClick={() => { setIsOverrideModalOpen(false); setSelectedOrder(null); }}
                   >
                     Cancel
                   </Button>
                   <Button 
                     className="flex-1 h-14 rounded-2xl bg-rose text-white font-bold shadow-xl shadow-rose/20"
                     disabled={!overrideNote || overrideMutation.isPending}
                     onClick={() => overrideMutation.mutate({ id: selectedOrder.id, status: overrideStatus, note: overrideNote })}
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
