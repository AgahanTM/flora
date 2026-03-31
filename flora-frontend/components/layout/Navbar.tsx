"use client";

import { useState, memo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Heart, 
  Bell, 
  ShoppingBag, 
  Menu, 
  X, 
  User as UserIcon,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { toast } from '@/lib/utils/toast';

import { useAuth } from '@/lib/hooks/useAuth';
import { useUiStore } from '@/lib/store/uiStore';
import { apiClient } from '@/lib/api/client';
import { Cart } from '@/lib/types/cart';
import { Button } from '@/components/ui/button';
const SearchOverlay = dynamic(() => import('./SearchOverlay').then(mod => mod.SearchOverlay), { ssr: false });
const CartDrawer = dynamic(() => import('./CartDrawer').then(mod => mod.CartDrawer), { ssr: false });
// Future: implement Avatar dropdown properly with shadcn
// import { DropdownMenu, ... } from '@/components/ui/dropdown-menu';

const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'Gift Builder', href: '/gift-builder' },
  { name: 'Occasions', href: '/occasions' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isSeller, isAdmin, isCourier, logout } = useAuth();
  const { unreadNotificationCount } = useUiStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Fetch Cart count if authenticated (or session-based)
  const { data: cart } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get('/cart');
      return data;
    },
    // We fetch cart eagerly for the badge count, even if drawer is closed
    staleTime: 60 * 1000, 
  });

  const cartItemsCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  // Ideally we would fetch wishlist count here too, but stubbing for now
  const wishlistCount = 0; 

  // Determine dashboard link based on role
  const getDashboardLink = () => {
    if (isAdmin) return '/admin';
    if (isSeller) return '/seller/dashboard';
    if (isCourier) return '/courier/deliveries';
    return '/dashboard'; // Customer
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-border transition-all">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Left: Mobile Menu Toggle */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-bark hover:text-rose transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Center: Logo */}
            <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
              <Link href="/" className="flex items-center gap-2 group">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-rose group-hover:text-rose-dark transition-colors" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C12 22 17 18 17 12C17 6 12 2 12 2C12 2 7 6 7 12C7 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15C9 15 9 18 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15C15 15 15 18 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-display font-bold text-3xl tracking-tight text-bark pt-1">Flora</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-rose relative py-2 ${
                    pathname === link.href ? 'text-rose' : 'text-bark'
                  }`}
                >
                  {link.name}
                  {pathname === link.href && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose rounded-full"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Right: Icons & Auth */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-bark hover:text-rose transition-colors rounded-full hover:bg-mist/50"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link href="/wishlist" className="flex p-2 text-bark hover:text-rose transition-colors rounded-full hover:bg-mist/50 relative">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm scale-90 sm:scale-100">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <Link href="/dashboard/notifications" className="p-2 text-bark hover:text-rose transition-colors rounded-full hover:bg-mist/50 relative">
                <Bell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm scale-90 sm:scale-100">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </Link>

              {/* Cart Drawer Toggle */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-bark hover:text-rose transition-colors rounded-full hover:bg-mist/50 relative"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-bark text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm scale-90 sm:scale-100">
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </span>
                )}
              </button>

              <div className="w-px h-6 bg-border mx-2 hidden lg:block" />

              {/* Auth Actions Desktop */}
              <div className="hidden lg:flex items-center gap-3">
                {isAuthenticated ? (
                  <div className="relative">
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-mist/50 border border-transparent hover:border-border transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-rose/20 text-rose-dark flex items-center justify-center font-medium shadow-soft">
                        {user?.phone?.charAt(0) || <UserIcon className="w-4 h-4"/>}
                      </div>
                      <span className="text-sm font-medium max-w-[100px] truncate">{user?.phone || 'Account'}</span>
                    </button>
                    
                    {/* Simple native dropdown fallback until shadcn DropdownMenu is added */}
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-border z-50 overflow-hidden text-sm"
                          >
                            <Link 
                              href={getDashboardLink()} 
                              className="flex items-center gap-2 px-4 py-3 hover:bg-mist/50 text-bark transition-colors w-full text-left"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </Link>
                            <div className="h-px bg-border w-full" />
                            <button 
                              onClick={() => {
                                logout();
                                toast.success('See you soon! 🌸');
                                setIsUserMenuOpen(false);
                              }}
                              className="flex items-center gap-2 px-4 py-3 hover:bg-destructive/10 text-destructive transition-colors w-full text-left"
                            >
                              <LogOut className="w-4 h-4" /> Log out
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" className="font-medium text-bark border-0">Log in</Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="primary">Sign up</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Full-screen overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-50 bg-cream lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-display font-bold text-2xl tracking-tight text-bark">Flora Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-bark hover:text-rose transition-colors rounded-full hover:bg-mist/50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
              <div className="flex flex-col gap-4 text-xl font-display">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-bark hover:text-rose py-2 border-b border-mist/50"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              
              <div className="mt-auto flex gap-4 pt-8">
                {isAuthenticated ? (
                  <div className="w-full flex flex-col gap-3">
                    <Link href={getDashboardLink()}>
                      <Button className="w-full justify-start gap-2" size="lg" onClick={() => setIsMobileMenuOpen(false)}>
                        <LayoutDashboard className="w-5 h-5"/> My Dashboard
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full justify-start gap-2 text-destructive border-border" size="lg" onClick={() => {
                        logout();
                        toast.success('See you soon! 🌸');
                        setIsMobileMenuOpen(false);
                      }}>
                      <LogOut className="w-5 h-5"/> Logout
                    </Button>
                  </div>
                ) : (
                  <div className="w-full flex flex-col gap-3">
                    <Link href="/login" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full" size="lg">Log in</Button>
                    </Link>
                    <Link href="/register" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="primary" className="w-full" size="lg">Sign up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals integrated into layout scope via Navbar */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
