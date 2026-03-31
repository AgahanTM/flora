"use client";

import { useQuery } from '@tanstack/react-query';
import { 
  Store, Package, ShoppingBag, Star, 
  TrendingUp, AlertTriangle, CheckCircle2, 
  Clock, XCircle, ShieldAlert, ArrowRight,
  Plus, Settings, LayoutDashboard, Loader2,
  DollarSign, BarChart3, Users, Filter, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { apiClient } from '@/lib/api/client';
import { Seller } from '@/lib/types/seller';
import { SellerStatus } from '@/lib/types/api';
import { Order } from '@/lib/types/order';
import { Product } from '@/lib/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function SellerDashboardPage() {
  const router = useRouter();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['seller-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/profile');
      return data;
    }
  });

  const { data: recentOrders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['seller-orders-recent'],
    enabled: profile?.seller?.status === 'approved',
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/orders', { params: { limit: 5 } });
      return data as Order[];
    }
  });

  const { data: lowStockProducts = [], isLoading: isStockLoading } = useQuery({
    queryKey: ['seller-products-low-stock'],
    enabled: profile?.seller?.status === 'approved',
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/products/low-stock');
      return data as Product[];
    }
  });

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist/10">
        <Loader2 className="w-12 h-12 text-rose animate-spin" />
      </div>
    );
  }

  const seller = profile?.seller as Seller;
  const status = seller?.status || 'pending';

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose mb-1">
                 <Store className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Vendor Command Center</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-bark">
                 {status === 'approved' ? `Welcome back, ${seller.shop_name}` : 'Seller Dashboard'}
              </h1>
           </div>
           
           {status === 'approved' && (
              <div className="flex items-center gap-3">
                 <Link href="/seller/products/new">
                    <Button className="bg-bark hover:bg-rose text-white rounded-2xl h-14 px-8 font-bold gap-3 shadow-xl shadow-bark/10">
                       <Plus className="w-5 h-5" /> Add Product
                    </Button>
                 </Link>
                 <Link href="/seller/settings">
                    <Button variant="outline" className="bg-white border-mist-dark/10 text-bark rounded-2xl h-14 w-14 p-0">
                       <Settings className="w-5 h-5" />
                    </Button>
                 </Link>
              </div>
           )}
        </header>

        {/* Status-Based Dashboards */}
        {status === 'pending' && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white rounded-[3rem] p-12 shadow-premium border border-mist-dark/10 text-center space-y-8 relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                 <Clock className="w-64 h-64 text-bark rotate-12" />
              </div>
              <div className="p-10 bg-rose/5 rounded-full inline-block text-rose relative">
                 <Clock className="w-16 h-16 animate-pulse" />
              </div>
              <div className="max-w-2xl mx-auto space-y-4">
                 <h2 className="text-3xl font-display font-bold text-bark italic leading-tight">Your boutique is <span className="text-rose">under review.</span></h2>
                 <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    Our curators are currently verifying your shop details and documents. This typically takes 24-48 hours. We'll send you an update as soon as your status changes.
                 </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 max-w-4xl mx-auto">
                 {[
                    { label: 'Application Received', status: 'completed', icon: <CheckCircle2 className="w-5 h-5" /> },
                    { label: 'Document Verification', status: 'pending', icon: <Loader2 className="w-5 h-5 animate-spin" /> },
                    { label: 'Final Approval', status: 'pending', icon: <Star className="w-5 h-5" /> }
                 ].map((step, i) => (
                    <div key={i} className={cn(
                       "p-6 rounded-3xl border flex flex-col items-center gap-4 transition-all",
                       step.status === 'completed' ? "bg-green-50 border-green-200 text-green-600" : "bg-mist/30 border-transparent text-bark/20"
                    )}>
                       {step.icon}
                       <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                    </div>
                 ))}
              </div>
           </motion.div>
        )}

        {status === 'approved' && (
           <div className="space-y-12">
              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {[
                    { label: 'Total Revenue', value: '0 TMT', icon: <DollarSign className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
                    { label: 'Active Orders', value: '0', icon: <ShoppingBag className="w-6 h-6" />, color: 'bg-rose-50 text-rose' },
                    { label: 'Total Products', value: '0', icon: <Package className="w-6 h-6" />, color: 'bg-bark/5 text-bark/40' },
                    { label: 'Shop Rating', value: profile?.stats?.rating_avg || '5.0', icon: <Star className="w-6 h-6" />, color: 'bg-amber-50 text-amber-500' }
                 ].map((kpi, i) => (
                    <Card key={i} className="rounded-[2.5rem] border-transparent shadow-premium overflow-hidden group hover:-translate-y-1 transition-all">
                       <CardHeader className="p-8 pb-4">
                          <div className={cn("p-4 rounded-2xl inline-block mb-2 group-hover:scale-110 transition-transform", kpi.color)}>
                             {kpi.icon}
                          </div>
                          <CardTitle className="text-3xl font-display font-bold text-bark">{kpi.value}</CardTitle>
                          <CardDescription className="text-[10px] font-black uppercase tracking-widest">{kpi.label}</CardDescription>
                       </CardHeader>
                    </Card>
                 ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                 {/* Recent Orders Flow */}
                 <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-xl font-display font-bold text-bark italic">Incoming Desires</h3>
                       <Link href="/seller/orders" className="text-[10px] font-black uppercase tracking-widest text-rose hover:underline">View All Orders</Link>
                    </div>
                    <div className="space-y-4">
                       {recentOrders.length > 0 ? (
                          recentOrders.map((order) => (
                             <div key={order.id} className="p-6 bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-soft hover:shadow-premium transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-6">
                                   <div className="p-4 bg-mist/50 rounded-2xl text-bark/20 group-hover:bg-rose/10 group-hover:text-rose transition-all">
                                      <ShoppingBag className="w-6 h-6" />
                                   </div>
                                   <div>
                                      <p className="font-bold text-bark">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                                      <p className="text-xs text-muted-foreground font-medium">{order.total_amount} TMT • {new Date(order.created_at).toLocaleDateString()}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-4">
                                   <span className="px-3 py-1 bg-rose/5 text-rose text-[10px] font-black uppercase tracking-widest rounded-full">{order.status}</span>
                                   <ChevronRight className="w-5 h-5 text-bark/20 group-hover:translate-x-1 transition-all" />
                                </div>
                             </div>
                          ))
                       ) : (
                          <div className="py-24 text-center space-y-4 bg-white/40 border-2 border-dashed border-mist-dark/10 rounded-[3.5rem] opacity-30">
                             <LayoutDashboard className="w-16 h-16 mx-auto" />
                             <p className="font-bold text-bark">No incoming orders yet.</p>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Inventory & Stock Alerts */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-xl font-display font-bold text-bark italic">Inventory Pulse</h3>
                    </div>
                    <div className="bg-bark text-white rounded-[3rem] p-10 shadow-premium space-y-8 relative overflow-hidden min-h-[400px]">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-rose/20 blur-3xl rounded-full -mr-16 -mt-16" />
                       
                       <div className="space-y-6 relative z-10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                             <AlertTriangle className="w-4 h-4 text-rose" /> Stock Alerts
                          </p>
                          {lowStockProducts.length > 0 ? (
                             <div className="space-y-4">
                                {lowStockProducts.map((p) => (
                                   <div key={p.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                                      <div className="truncate max-w-[140px]">
                                         <p className="text-sm font-bold text-white group-hover:text-rose transition-colors">{p.name}</p>
                                         <p className="text-[10px] font-black uppercase text-white/30">Low Inventory</p>
                                      </div>
                                      <Button size="sm" variant="ghost" className="text-rose hover:text-rose hover:bg-rose/10 h-8 rounded-lg text-[9px] font-black uppercase px-2">Fix Stock</Button>
                                   </div>
                                ))}
                             </div>
                          ) : (
                             <div className="py-12 text-center space-y-3 opacity-30">
                                <Package className="w-10 h-10 mx-auto" />
                                <p className="text-xs font-bold">All stock is optimal.</p>
                             </div>
                          )}
                       </div>

                       <div className="pt-8 border-t border-white/5 space-y-4 relative z-10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Quick Operations</p>
                          <div className="grid grid-cols-2 gap-4">
                             <Link href="/seller/products" className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-2xl hover:bg-rose transition-all group">
                                <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Products</span>
                             </Link>
                             <Link href="/seller/reviews" className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-2xl hover:bg-rose transition-all group">
                                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Reviews</span>
                             </Link>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {(status === 'rejected' || status === 'suspended') && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-[3rem] p-12 shadow-premium border-2 border-rose/30 relative overflow-hidden text-center space-y-8"
           >
              <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                 <ShieldAlert className="w-64 h-64 text-rose rotate-12" />
              </div>
              <div className="p-10 bg-rose/10 rounded-full inline-block text-rose relative">
                 <ShieldAlert className="w-16 h-16" />
              </div>
              <div className="max-w-2xl mx-auto space-y-4 relative z-10">
                 <h2 className="text-3xl font-display font-bold text-bark italic leading-tight">
                    Account <span className="text-rose">{status === 'suspended' ? 'Suspended' : 'Rejected'}</span>
                 </h2>
                 <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    {status === 'suspended' 
                       ? "Your seller account has been temporarily suspended due to a policy violation or maintenance. Please contact vendor-support@flora.com to resolve this issue."
                       : "Your application was not approved for our curator list at this time. You can review our quality standards and re-apply in 30 days."}
                 </p>
              </div>
              <div className="pt-8 relative z-10">
                 <Button 
                   onClick={() => window.location.href = 'mailto:vendor-support@flora.com'}
                   className="h-16 rounded-2xl bg-rose text-white font-bold px-12 shadow-xl shadow-rose/20 text-lg gap-3"
                 >
                    Contact Seller Support
                 </Button>
              </div>
           </motion.div>
        )}
      </div>
    </div>
  );
}
