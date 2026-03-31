"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Store, 
  Package, 
  ShoppingBag, 
  Star, 
  Settings,
  Menu,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PageTransition } from '@/components/layout/PageTransition';
import { useAuth } from '@/lib/hooks/useAuth';

const SELLER_LINKS = [
  { name: 'Dashboard', href: '/seller/dashboard', icon: Store },
  { name: 'Products', href: '/seller/products', icon: Package },
  { name: 'Orders', href: '/seller/orders', icon: ShoppingBag },
  { name: 'Reviews', href: '/seller/reviews', icon: Star },
  { name: 'Settings', href: '/seller/settings', icon: Settings },
];

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mock checking approval status
  const sellerStatus = 'approved'; // 'pending', 'approved', 'rejected'

  return (
    <div className="flex min-h-screen bg-mist/30">
      
      {/* Mobile Header Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-border flex items-center px-4 justify-between z-40">
        <span className="font-display font-bold text-xl text-bark">Seller Portal</span>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-bark hover:text-rose">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar (Desktop and Mobile) */}
      <AnimatePresence>
        {(isSidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-bark/40 backdrop-blur-sm z-40"
            />
            
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-border flex flex-col z-50 overflow-y-auto lg:transform-none"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <Link href="/seller/dashboard" className="font-display font-bold text-2xl tracking-tight text-bark block">
                    Flora <span className="text-rose">Seller</span>
                  </Link>
                  
                  {/* Approval Status Badge */}
                  <div className="mt-2 flex items-center gap-1.5">
                    {sellerStatus === 'approved' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified Shop
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5" /> Pending Review
                      </span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="lg:hidden p-2 text-muted-foreground hover:bg-mist rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                  Shop Management
                </div>
                <nav className="flex flex-col gap-1">
                  {SELLER_LINKS.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname.startsWith(link.href);
                    
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                          isActive 
                            ? 'bg-rose/10 text-rose-dark' 
                            : 'text-bark/80 hover:bg-mist hover:text-bark'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-rose' : 'text-muted-foreground'}`} />
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t border-border mt-auto">
                <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-bark/80 hover:bg-mist rounded-lg transition-colors">
                  <Store className="w-5 h-5 text-muted-foreground" />
                  View Public Store
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 w-full min-w-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
      
    </div>
  );
}
