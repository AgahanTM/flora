"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, User, LogOut, Navigation, Package } from 'lucide-react';
import { useState } from 'react';

import { PageTransition } from '@/components/layout/PageTransition';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-mist/50 font-sans">
      
      {/* Mobile-first Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose/20 flex items-center justify-center text-rose-dark font-bold relative">
              {user?.phone?.charAt(0) || 'D'}
              {/* Online indicator dot */}
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-mist-dark'}`} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-bark text-sm leading-tight max-w-[120px] truncate">
                {user?.phone || 'Courier Mode'}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Ashgabat
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsOnline(!isOnline)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-mist-dark text-bark/70'
              }`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
            <button 
              onClick={logout}
              className="p-2 text-muted-foreground hover:bg-mist rounded-full"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-lg mx-auto p-4 pb-20">
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex items-center justify-around h-16 px-4 z-40 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.05)] lg:max-w-lg lg:mx-auto lg:rounded-t-3xl border-x">
        <Link
          href="/courier/deliveries"
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            pathname === '/courier/deliveries' ? 'text-rose' : 'text-muted-foreground hover:text-bark'
          }`}
        >
          <Package className={`w-6 h-6 ${pathname === '/courier/deliveries' ? 'fill-rose/20' : ''}`} />
          <span className="text-[10px] font-medium leading-none">Deliveries</span>
        </Link>
        <Link
          href="/courier/map"
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            pathname.includes('/map') ? 'text-rose' : 'text-muted-foreground hover:text-bark'
          }`}
        >
          <div className="w-12 h-12 -mt-6 bg-bark rounded-full flex items-center justify-center shadow-lg border-4 border-mist/50 text-white hover:bg-rose hover:border-white transition-all">
            <Navigation className="w-5 h-5 fill-current" />
          </div>
          <span className="text-[10px] font-medium leading-none text-bark mt-1">Map</span>
        </Link>
        <Link
          href="/courier/profile"
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            pathname.includes('/profile') ? 'text-rose' : 'text-muted-foreground hover:text-bark'
          }`}
        >
          <User className={`w-6 h-6 ${pathname.includes('/profile') ? 'fill-rose/20' : ''}`} />
          <span className="text-[10px] font-medium leading-none">Profile</span>
        </Link>
      </nav>

    </div>
  );
}
