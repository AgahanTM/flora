"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  ShoppingBag, 
  Store, 
  Tags, 
  Truck, 
  Image as ImageIcon, 
  RotateCcw, 
  BarChart3, 
  Settings,
  LayoutDashboard,
  Star,
  Menu,
  X
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ADMIN_LINKS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Products', href: '/admin/products', icon: Tags },
  { name: 'Sellers', href: '/admin/sellers', icon: Store },
  { name: 'Couriers', href: '/admin/couriers', icon: Truck },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Promotions', href: '/admin/promotions', icon: Star },
  { name: 'Banners', href: '/admin/banners', icon: ImageIcon },
  { name: 'Refunds & Reports', href: '/admin/refunds', icon: RotateCcw },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-mist overflow-hidden relative">
      
      {/* Sidebar (Desktop & Mobile Overlay) */}
      <AnimatePresence>
        {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-bark/60 backdrop-blur-sm z-40"
            />

            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed lg:sticky top-0 left-0 h-screen w-64 bg-bark text-mist shrink-0 z-50 lg:z-0 flex flex-col"
            >
              <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0 justify-between">
                <Link href="/admin" className="font-display font-bold text-2xl tracking-tight text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-rose flex items-center justify-center">
                    <span className="text-white font-bold text-lg leading-none pt-1">F</span>
                  </span>
                  Flora Admin
                </Link>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 text-mist hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                <nav className="flex flex-col gap-1">
                  {ADMIN_LINKS.map((link) => {
                    const Icon = link.icon;
                    const isActive = link.href === '/admin' 
                      ? pathname === '/admin' 
                      : pathname.startsWith(link.href);
                    
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                          isActive 
                            ? 'bg-rose text-white shadow-soft' 
                            : 'text-mist/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-mist/50'}`} />
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              
              <div className="p-4 border-t border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-rose font-medium">
                    A
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">System Admin</span>
                    <span className="text-xs text-mist/50">admin@flora.tm</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white lg:rounded-tl-3xl shadow-[-10px_0_30px_rgba(92,61,46,0.1)]">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-border flex items-center px-4 md:px-8 shrink-0 justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-bark hover:text-rose transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-medium text-bark capitalize truncate max-w-[200px] md:max-w-none">
              {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Desktop and mobile secondary controls could go here */}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
