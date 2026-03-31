"use client";

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Heart, Calendar, ArrowRight, 
  Settings, CreditCard, Package, LogOut,
  Sparkles, TrendingUp, Clock, MapPin
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { apiClient } from '@/lib/api/client';
import { UserProfile } from '@/lib/types/auth';
import { Order } from '@/lib/types/order';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { formatPrice } from '@/lib/utils/format';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { logout } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.get('/profile');
      return response.data as UserProfile;
    }
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', { limit: 3 }],
    queryFn: async () => {
      const response = await apiClient.get('/orders?limit=3');
      return response.data as Order[];
    }
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await apiClient.get('/wishlist');
      return response.data as any[];
    }
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await apiClient.get('/subscriptions');
      return response.data as any[];
    }
  });

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: <ShoppingBag className="w-5 h-5" />, color: 'bg-rose/10 text-rose' },
    { label: 'Active Subs', value: subscriptions.filter(s => s.status === 'active').length, icon: <Calendar className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Wishlist Items', value: wishlist.length, icon: <Heart className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12">
        {/* Welcome Banner */}
        <section className="bg-bark text-white rounded-[3rem] p-12 relative overflow-hidden group shadow-premium">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose/20 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose mb-2">
              <Sparkles className="w-6 h-6 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-white/40">Customer Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold">
              Welcome back, <span className="text-rose">{profile?.full_name?.split(' ')[0] || 'Blooming Soul'}</span>
            </h1>
            <p className="text-white/60 max-w-lg font-medium">
              We've missed you! Here's a quick look at your floral journey and upcoming deliveries.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
               <Link href="/products">
                  <Button className="bg-rose hover:bg-rose/90 text-white rounded-2xl h-14 px-8 font-bold gap-2 group/btn">
                    Shop Now <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
               </Link>
               <Link href="/settings/profile">
                  <Button variant="ghost" className="bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-2xl h-14 px-8 font-bold">
                    Profile Settings
                  </Button>
               </Link>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-mist-dark/10 flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">{stat.label}</span>
                <p className="text-3xl font-display font-bold text-bark">{stat.value}</p>
              </div>
              <div className={cn("p-4 rounded-2xl", stat.color)}>
                {stat.icon}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 shadow-soft border border-mist-dark/10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-display font-bold text-bark flex items-center gap-3">
                  <Clock className="w-6 h-6 text-rose" />
                  Recent Orders
                </h3>
                <Link href="/orders" className="text-xs font-black uppercase tracking-widest text-rose hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-6">
                {orders.length > 0 ? orders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <div className="flex items-center gap-6 p-6 bg-mist/20 rounded-3xl border border-transparent hover:border-rose/20 hover:bg-rose/5 transition-all group mb-4 last:mb-0">
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose font-bold">
                        #{order.id.slice(0, 4).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-bark truncate">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-tighter">
                          {format(new Date(order.created_at), 'MMMM d, yyyy')} • {formatPrice(parseFloat(order.total_amount))}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} className="hidden sm:inline-flex" />
                      <div className="p-2 bg-white rounded-xl text-bark/20 group-hover:text-rose transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="text-center py-12 space-y-4 opacity-50">
                    <div className="p-4 bg-mist rounded-full w-fit mx-auto">
                      <ShoppingBag className="w-10 h-10 text-bark/20" />
                    </div>
                    <p className="font-bold text-bark">No orders yet</p>
                    <p className="text-sm max-w-xs mx-auto">Your blooming journey starts with your first order. Ready to send some love?</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Links */}
          <div className="space-y-8">
            <div className="bg-white rounded-[3rem] p-10 shadow-soft border border-mist-dark/10 space-y-6">
               <h3 className="text-xl font-display font-bold text-bark mb-4">Quick Links</h3>
               <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'Addresses', href: '/settings/addresses', icon: <MapPin className="w-4 h-4" /> },
                    { label: 'Payment Methods', href: '/settings/payments', icon: <CreditCard className="w-4 h-4" /> },
                    { label: 'Security', href: '/settings/security', icon: <LogOut className="w-4 h-4 rotate-180" /> },
                    { label: 'Gift Builder', href: '/gift-builder', icon: <TrendingUp className="w-4 h-4" /> },
                  ].map((link, i) => (
                    <Link key={i} href={link.href}>
                      <div className="flex items-center justify-between p-4 bg-mist/30 rounded-2xl hover:bg-rose hover:text-white transition-all group">
                         <div className="flex items-center gap-3">
                            <span className="p-2 bg-white/50 rounded-xl group-hover:bg-white/20">{link.icon}</span>
                            <span className="font-bold text-sm tracking-tight">{link.label}</span>
                         </div>
                         <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                    </Link>
                  ))}
               </div>
               
               <div className="pt-6 border-t border-mist-dark/10">
                  <Button 
                    onClick={() => logout()}
                    variant="ghost" 
                    className="w-full h-12 text-rose hover:bg-rose/10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout Account
                  </Button>
               </div>
            </div>

            {/* Support Hero */}
            <div className="bg-indigo-600 rounded-[3rem] p-10 shadow-premium relative overflow-hidden text-white group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
               <div className="relative z-10 space-y-4">
                  <div className="p-3 bg-white/10 rounded-2xl w-fit">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="text-xl font-display font-bold">Need Help?</h4>
                  <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                    Our floral experts are available 24/7 Turkmen time to help you with your order.
                  </p>
                  <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl font-bold mt-4">
                    Contact Support
                  </Button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
