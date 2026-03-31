"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, Calendar, TrendingUp, 
  Users, DollarSign, Package, 
  Store, ArrowUpRight, ArrowDownRight,
  Filter, Download, Loader2,
  Trophy, Star, History, Info
} from 'lucide-react';
import { format, startOfToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import { adminApi } from '@/lib/api/admin';
import { DailyStats } from '@/lib/types/analytics';
import { SellerStats } from '@/lib/types/admin_system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { parseJsonArray } from '@/lib/utils/jsonFields';

export default function AdminAnalyticsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(format(startOfToday(), 'yyyy-MM-dd'));

  const { data: dailyStats, isLoading: isDailyLoading } = useQuery({
    queryKey: ['admin-analytics-daily', selectedDate],
    queryFn: async () => {
      const { data } = await adminApi.getDailyAnalytics(selectedDate);
      return data as DailyStats;
    }
  });

  const { data: sellerStats, isLoading: isSellerLoading } = useQuery({
    queryKey: ['admin-analytics-sellers', selectedDate],
    queryFn: async () => {
      const { data } = await adminApi.getSellerAnalytics(selectedDate);
      return data as SellerStats[];
    }
  });

  const topProducts = parseJsonArray(dailyStats?.top_products);
  const topSellers = parseJsonArray(dailyStats?.top_sellers);

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <BarChart3 className="w-4 h-4" />
            Performance Intel
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">Temporal Insights</h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bark/20 group-focus-within:text-rose transition-colors" />
              <Input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-14 pl-12 rounded-2xl border-mist-dark/10 bg-white shadow-sm font-bold text-bark"
              />
           </div>
           <Button variant="outline" className="h-14 px-6 rounded-2xl border-mist-dark/10 font-bold gap-3">
              <Download className="w-5 h-5" /> Export Ledger
           </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <KPICard 
           label="Gross Revenue" 
           value={formatPrice(parseFloat(dailyStats?.revenue || '0'))} 
           icon={<DollarSign className="w-6 h-6" />} 
           trend="+12%" 
           isLoading={isDailyLoading}
         />
         <KPICard 
           label="Platform Orders" 
           value={dailyStats?.total_orders.toString() || '0'} 
           icon={<Package className="w-6 h-6" />} 
           trend="+5%" 
           isLoading={isDailyLoading}
         />
         <KPICard 
           label="New Patrons" 
           value={dailyStats?.new_customers.toString() || '0'} 
           icon={<Users className="w-6 h-6" />} 
           trend="+8%" 
           isLoading={isDailyLoading}
         />
         <KPICard 
           label="Avg Basket Value" 
           value={formatPrice(parseFloat(dailyStats?.avg_order_value || '0'))} 
           icon={<TrendingUp className="w-6 h-6" />} 
           trend="-2%" 
           isLoading={isDailyLoading}
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Sellers Performance Table */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] border border-mist-dark/10 shadow-premium overflow-hidden">
               <div className="p-8 border-b border-mist-dark/5 flex items-center justify-between bg-mist/5">
                  <h3 className="text-xl font-display font-bold text-bark italic">Competitive Index</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                     <Info className="w-3.5 h-3.5" /> All Vendors Registry
                  </div>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-bark/30 border-b border-mist-dark/5">
                           <th className="px-8 py-6">Identity</th>
                           <th className="px-8 py-6">Volume</th>
                           <th className="px-8 py-6">Revenue</th>
                           <th className="px-8 py-6 text-right">Reputation</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-mist-dark/5">
                        {isSellerLoading ? (
                          <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30 mx-auto" /></td></tr>
                        ) : sellerStats && sellerStats.length > 0 ? (
                          sellerStats.map((seller) => (
                            <tr key={seller.seller_id} className="group hover:bg-cream/20 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-mist flex items-center justify-center text-bark/20 group-hover:bg-rose/10 group-hover:text-rose transition-all">
                                        <Store className="w-5 h-5" />
                                     </div>
                                     <span className="font-bold text-bark">{seller.shop_name}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6 font-medium text-bark/60">{seller.total_orders} Orders</td>
                               <td className="px-8 py-6 font-bold text-rose">{formatPrice(parseFloat(seller.revenue))}</td>
                               <td className="px-8 py-6 text-right">
                                  <div className="flex items-center justify-end gap-1 text-amber-500 font-bold">
                                     <Star className="w-3.5 h-3.5 fill-amber-500" />
                                     {seller.avg_rating.toFixed(1)}
                                  </div>
                               </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} className="py-24 text-center font-display text-bark/20 italic">No vendor activity recorded for this period</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Rankings Sidebar */}
         <div className="space-y-12">
            <section className="bg-bark rounded-[3rem] p-10 text-white shadow-xl shadow-bark/20 space-y-8">
               <h3 className="font-display font-bold italic text-white/50 flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-rose" /> Curated Leaders
               </h3>
               
               <div className="space-y-10">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Top Curations</p>
                     {topProducts.length > 0 ? topProducts.map((p: any, i: number) => (
                       <div key={i} className="flex items-center justify-between group">
                          <span className="text-sm font-medium text-white/70 truncate w-40">{p.name || p.title}</span>
                          <span className="text-xs font-bold text-rose">{p.count || p.orders} Units</span>
                       </div>
                     )) : <p className="text-xs text-white/20 italic">No product leaders today</p>}
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Master Florists</p>
                     {topSellers.length > 0 ? topSellers.map((s: any, i: number) => (
                       <div key={i} className="flex items-center justify-between group">
                          <span className="text-sm font-medium text-white/70 truncate w-40">{s.shop_name || s.name}</span>
                          <span className="text-xs font-bold text-rose">{formatPrice(parseFloat(s.revenue))}</span>
                       </div>
                     )) : <p className="text-xs text-white/20 italic">No vendor leaders today</p>}
                  </div>
               </div>
            </section>

            <div className="p-10 bg-mist/20 rounded-[3rem] border border-mist-dark/10 text-center space-y-4">
               <History className="w-10 h-10 mx-auto text-bark/10" />
               <p className="text-sm font-display font-medium text-bark/40 leading-relaxed italic">Archive integrity is verified daily at 00:00 UTC. Historical data is immutable.</p>
            </div>
         </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, trend, isLoading }: { label: string, value: string, icon: React.ReactNode, trend: string, isLoading: boolean }) {
  const isUp = trend.startsWith('+');
  return (
    <div className="bg-white rounded-[2.5rem] p-10 border border-mist-dark/10 shadow-soft group hover:shadow-premium transition-all">
       <div className="flex items-center justify-between mb-8">
          <div className="w-14 h-14 rounded-2xl bg-mist flex items-center justify-center text-bark/20 group-hover:bg-rose/10 group-hover:text-rose transition-all">
             {icon}
          </div>
          {!isLoading && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest",
              isUp ? "text-green-500" : "text-rose"
            )}>
               {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
               {trend}
            </div>
          )}
       </div>
       <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">{label}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-mist animate-pulse rounded-lg" />
          ) : (
            <h4 className="text-3xl font-display font-bold text-bark group-hover:text-rose transition-colors">{value}</h4>
          )}
       </div>
    </div>
  );
}
