"use client";

import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, TrendingDown, Users, 
  ShoppingBag, DollarSign, Activity,
  AlertCircle, CheckCircle2, Clock,
  ArrowRight, Store, Package, 
  Heart, BarChart3, ShieldCheck,
  Zap, Loader2, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

import { apiClient } from '@/lib/api/client';
import { DailyStats } from '@/lib/types/analytics';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { parseJsonArray } from '@/lib/utils/jsonFields';

export default function AdminDashboardPage() {
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin-stats-daily'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/analytics/daily?date=today');
      return data as DailyStats;
    }
  });

  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ['admin-health'],
    queryFn: async () => {
      const { data } = await apiClient.get('/health');
      return data as { status: string, version: string };
    }
  });

  const { data: pendingSellersCount = 0 } = useQuery({
    queryKey: ['admin-pending-sellers-count'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/sellers?status=pending');
      return (data as any[]).length;
    }
  });

  if (isStatsLoading || isHealthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist/10">
        <Loader2 className="w-12 h-12 text-rose animate-spin" />
      </div>
    );
  }

  const topProducts = typeof stats?.top_products === 'string' 
    ? parseJsonArray(stats.top_products) 
    : (stats?.top_products || []);

  const topSellers = typeof stats?.top_sellers === 'string' 
    ? parseJsonArray(stats.top_sellers) 
    : (stats?.top_sellers || []);

  const kpis = [
    { label: 'Total Revenue', value: formatPrice(parseFloat(stats?.revenue || '0')), icon: <DollarSign />, trend: '+12.5%', color: 'rose' },
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: <ShoppingBag />, trend: '+8.2%', color: 'bark' },
    { label: 'New Customers', value: stats?.new_customers || 0, icon: <Users />, trend: '+15.1%', color: 'green' },
    { label: 'Avg Order Value', value: formatPrice(parseFloat(stats?.avg_order_value || '0')), icon: <TrendingUp />, trend: '-2.4%', color: 'amber' },
  ];

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <Zap className="w-4 h-4" />
            Platform Oversight
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">Admin Nexus</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-mist-dark/10">
           <div className={cn(
             "px-4 py-2 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest",
             health?.status === 'ok' ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose"
           )}>
              <Activity className={cn("w-4 h-4", health?.status === 'ok' && "animate-pulse")} />
              System Status: {health?.status?.toUpperCase() || 'UNKNOWN'}
           </div>
           <div className="px-4 py-2 text-[10px] font-black text-bark/40 border-l border-mist-dark/10">
              v{health?.version || '1.0.0'}
           </div>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {kpis.map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-mist-dark/10 group hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between mb-6">
               <div className={cn(
                 "p-4 rounded-2xl transition-transform group-hover:scale-110",
                 kpi.color === 'rose' ? "bg-rose/10 text-rose" :
                 kpi.color === 'green' ? "bg-green-100 text-green-600" :
                 kpi.color === 'amber' ? "bg-amber-100 text-amber-600" : "bg-bark/10 text-bark"
               )}>
                  {kpi.icon}
               </div>
               <span className={cn(
                 "text-[10px] font-black px-2 py-1 rounded-lg",
                 kpi.trend.startsWith('+') ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose"
               )}>
                  {kpi.trend}
               </span>
            </div>
            <p className="text-3xl font-display font-bold text-bark mb-1">{kpi.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Operations */}
         <div className="space-y-6">
            <h3 className="text-xl font-display font-bold text-bark italic px-2">Operational Pulse</h3>
            <div className="grid grid-cols-1 gap-4">
               <Link href="/admin/sellers?status=pending" className="block p-6 bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-soft hover:shadow-premium hover:border-rose/20 transition-all group">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all">
                           <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="font-bold text-bark">Pending Sellers</p>
                           <p className="text-xs text-muted-foreground font-medium">{pendingSellersCount} applications to review</p>
                        </div>
                     </div>
                     <ChevronRight className="w-5 h-5 text-bark/20 group-hover:translate-x-1 transition-all" />
                  </div>
               </Link>

               <Link href="/admin/orders?payment=bank_transfer" className="block p-6 bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-soft hover:shadow-premium hover:border-rose/20 transition-all group">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                           <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="font-bold text-bark">Bank Proofs</p>
                           <p className="text-xs text-muted-foreground font-medium">Verify payment transfers</p>
                        </div>
                     </div>
                     <ChevronRight className="w-5 h-5 text-bark/20 group-hover:translate-x-1 transition-all" />
                  </div>
               </Link>

               <Link href="/admin/refunds" className="block p-6 bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-soft hover:shadow-premium hover:border-rose/20 transition-all group">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="p-4 bg-rose/10 text-rose rounded-2xl group-hover:bg-rose group-hover:text-white transition-all">
                           <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="font-bold text-bark">Open Refunds</p>
                           <p className="text-xs text-muted-foreground font-medium">Resolve customer disputes</p>
                        </div>
                     </div>
                     <ChevronRight className="w-5 h-5 text-bark/20 group-hover:translate-x-1 transition-all" />
                  </div>
               </Link>
            </div>
         </div>

         {/* Top Data Lists */}
         <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-[3rem] p-10 shadow-premium border border-mist-dark/10">
            <div className="space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-bark italic">Top Collections</h3>
                  <BarChart3 className="w-5 h-5 text-rose" />
               </div>
               <div className="space-y-6">
                  {topProducts.length > 0 ? topProducts.slice(0, 5).map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 group cursor-default">
                       <span className="text-[10px] font-black text-rose/30 w-4">0{i+1}</span>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-bark truncate group-hover:text-rose transition-colors">{p.name || 'Unknown Product'}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-bark/20">{p.quantity_sold || 0} Units Sold</p>
                       </div>
                       <div className="h-1 w-12 bg-mist rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (p.quantity_sold / (topProducts[0]?.quantity_sold || 1)) * 100)}%` }}
                            className="h-full bg-rose"
                          />
                       </div>
                    </div>
                  )) : (
                    <p className="text-xs text-bark/20 italic italic text-center py-8">No product data available for today</p>
                  )}
               </div>
            </div>

            <div className="space-y-8 md:border-l md:border-mist-dark/5 md:pl-12">
               <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-bark italic">Elite Curators</h3>
                  <Store className="w-5 h-5 text-bark" />
               </div>
               <div className="space-y-6">
                  {topSellers.length > 0 ? topSellers.slice(0, 5).map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 group">
                       <div className="w-10 h-10 rounded-full bg-mist flex items-center justify-center overflow-hidden relative">
                          {s.logo_url ? <Image src={s.logo_url} alt={s.shop_name || 'Seller'} fill className="object-cover" /> : <Store className="w-5 h-5 text-bark/20" />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-bark truncate">{s.shop_name || 'Unknown Shop'}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-rose">{formatPrice(parseFloat(s.revenue || '0'))}</p>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-bark/20">{s.order_count || 0} Orders</span>
                       </div>
                    </div>
                  )) : (
                    <p className="text-xs text-bark/20 italic text-center py-8">No seller data available for today</p>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
