"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Package, 
  Heart, 
  Settings, 
  Calendar, 
  Repeat,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/layout/PageTransition';
import { useAuth } from '@/lib/hooks/useAuth';

const CUSTOMER_LINKS = [
  { name: 'My Orders', href: '/dashboard/orders', icon: Package },
  { name: 'Wishlist', href: '/wishlist', icon: Heart },
  { name: 'Occasions', href: '/dashboard/occasions', icon: Calendar },
  { name: 'Subscriptions', href: '/subscriptions', icon: Repeat },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Navbar />

      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row px-0 md:px-8 py-0 md:py-8 gap-8 relative pb-24 md:pb-8">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white rounded-2xl shadow-card border border-border overflow-hidden h-fit sticky top-28">
          <div className="p-6 bg-mist border-b border-border flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-rose/20 text-rose-dark flex items-center justify-center text-2xl font-medium shadow-soft mb-3 border border-white">
              {user?.phone?.charAt(0) || 'C'}
            </div>
            <h2 className="font-display font-semibold text-lg text-bark truncate w-full">
              {user?.phone || 'Customer User'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Valued Member</p>
          </div>
          
          <nav className="p-4 flex flex-col gap-1">
            {CUSTOMER_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href) || 
                              (link.name === 'My Orders' && pathname === '/dashboard');
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                    isActive 
                      ? 'bg-rose text-white shadow-soft' 
                      : 'text-bark hover:bg-mist/80'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 w-full relative">
          <PageTransition>
            <div className="md:bg-white md:p-8 md:rounded-2xl md:shadow-card md:border md:border-border min-h-[600px]">
              {children}
            </div>
          </PageTransition>
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex items-center justify-around h-16 px-2 z-40 pb-safe">
          {CUSTOMER_LINKS.slice(0, 4).map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href) || 
                            (link.name === 'My Orders' && pathname === '/dashboard');
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                  isActive ? 'text-rose' : 'text-muted-foreground hover:text-bark'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'fill-rose/20' : ''}`} />
                  {/* Subtle active dot */}
                  {isActive && (
                    <motion.div 
                      layoutId="mobile-tab-indicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose rounded-full"
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none">{link.name}</span>
              </Link>
            );
          })}
          
          <Link
            href="/dashboard/settings"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              pathname.includes('/settings') ? 'text-rose' : 'text-muted-foreground hover:text-bark'
            }`}
          >
            <Settings className={`w-6 h-6 ${pathname.includes('/settings') ? 'fill-rose/20' : ''}`} />
            <span className="text-[10px] font-medium leading-none">Settings</span>
          </Link>
        </nav>
        
      </div>

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
