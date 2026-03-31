"use client";

import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, ArrowLeft, Loader2, Sparkles, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { apiClient } from '@/lib/api/client';
import { Cart } from '@/lib/types/cart';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartPage() {
  const { data: cartResponse, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await apiClient.get('/cart');
      return response.data as Cart & { subtotal?: number; total?: number; discount_total?: number; applied_promo_code?: string };
    },
  });

  const cart = cartResponse;
  const items = cart?.items || [];
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Manual calculation fallback if API doesn't provide summary
  const subtotal = cart?.subtotal ?? items.reduce((acc, item) => {
    const base = parseFloat(item.product?.base_price || '0');
    const mod = parseFloat(item.product?.variants.find(v => v.id === item.variant_id)?.price_modifier || '0');
    return acc + (base + mod) * item.quantity;
  }, 0);

  const discount = cart?.discount_total ?? 0;
  const total = cart?.total ?? (subtotal - discount);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12 sm:py-24 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-6">
            <Skeleton className="h-48 w-full rounded-[2.5rem]" />
            <Skeleton className="h-48 w-full rounded-[2.5rem]" />
          </div>
          <div className="w-full lg:w-[400px]">
            <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      {/* Header Section */}
      <div className="bg-white border-b border-mist-dark/10 py-12 sm:py-20 mb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-4">
              <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-rose hover:underline transition-all group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Shop
              </Link>
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-bark flex items-center gap-4">
                Your Cart
                {itemCount > 0 && (
                  <span className="text-xl font-sans font-medium text-rose bg-rose/10 px-4 py-1 rounded-full">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                )}
              </h1>
            </div>
            {itemCount > 0 && (
              <div className="flex items-center gap-2 text-rose bg-rose/5 px-6 py-3 rounded-2xl border border-rose/10">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-bold">Free delivery on orders over 1000 TMT</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl">
        <AnimatePresence mode="wait">
          {items.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-24 text-center space-y-8"
            >
              <div className="relative">
                <div className="w-48 h-48 bg-mist/50 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-24 h-24 text-mist-dark/40" />
                </div>
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-rose/10 rounded-full blur-xl animate-pulse" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-bold text-bark">Your cart is empty</h2>
                <p className="text-muted-foreground">It looks like you haven't added any beautiful blooms to your cart yet.</p>
              </div>
              <Button asChild size="lg" className="rounded-2xl px-12 h-14 bg-rose shadow-lg shadow-rose/20">
                <Link href="/products">Shop Flowers Now</Link>
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="cart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col lg:flex-row gap-8 lg:gap-12"
            >
              {/* Items List */}
              <div className="flex-1 space-y-6 relative">
                {isFetching && (
                  <div className="absolute top-0 right-0 z-20">
                    <Loader2 className="w-5 h-5 text-rose animate-spin" />
                  </div>
                )}
                {items.map((item) => (
                  <CartItem key={item.id} item={item} onUpdate={refetch} />
                ))}
              </div>

              {/* Summary Sidebar */}
              <div className="w-full lg:w-[400px]">
                <CartSummary 
                  subtotal={subtotal}
                  discount={discount}
                  total={total}
                  promoCode={cart?.applied_promo_code}
                  onUpdate={refetch}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
