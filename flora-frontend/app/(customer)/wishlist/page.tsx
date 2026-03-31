"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, ShoppingBag, Trash2, ArrowRight, 
  Loader2, Sparkles, ShoppingCart, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api/client';
import { Product } from '@/lib/types/product';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function WishlistPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading, refetch } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await apiClient.get('/wishlist');
      return response.data as Product[];
    }
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      // Assuming DELETE /wishlist takes product_id in body for consistency with earlier patterns
      return apiClient.delete('/wishlist', { data: { product_id: productId } });
    },
    onSuccess: () => {
      toast.success('Removed from wishlist');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove from wishlist');
    }
  });

  const moveToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      // 1. Add to cart
      await apiClient.post('/cart/items', { product_id: productId, quantity: 1 });
      // 2. Remove from wishlist
      await apiClient.delete('/wishlist', { data: { product_id: productId } });
    },
    onSuccess: () => {
      toast.success('Moved to cart!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to move to cart');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-cream/30">
        <Loader2 className="w-12 h-12 text-rose animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/dashboard')} 
                className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
              >
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-1">
                 <div className="flex items-center gap-2 text-rose mb-1">
                    <Heart className="w-4 h-4 fill-rose" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Personal Collection</span>
                 </div>
                 <h1 className="text-3xl font-display font-bold text-bark">My Wishlist</h1>
              </div>
           </div>
           
           <Link href="/cart">
              <Button className="bg-white text-bark hover:bg-mist border border-mist-dark/10 rounded-2xl h-14 px-8 font-bold gap-3 shadow-premium group">
                 <ShoppingCart className="w-5 h-5 text-rose group-hover:scale-110 transition-transform" />
                 View Shopping Cart
              </Button>
           </Link>
        </header>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-1">
            <AnimatePresence mode="popLayout">
              {wishlist.map((product) => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="relative group/card"
                >
                  {/* Reuse ProductCard but overlay custom actions */}
                  <ProductCard product={product} />
                  
                  <div className="absolute top-2 right-2 flex flex-col gap-2 z-30 opacity-0 group-hover/card:opacity-100 transition-opacity">
                     <button 
                       onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromWishlistMutation.mutate(product.id); }}
                       className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-premium text-rose hover:bg-rose hover:text-white transition-all transform hover:scale-110"
                       title="Remove from Wishlist"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveToCartMutation.mutate(product.id); }}
                       className="p-3 bg-bark/90 backdrop-blur-md rounded-2xl shadow-premium text-white hover:bg-rose transition-all transform hover:scale-110"
                       title="Move to Cart"
                     >
                        <ShoppingCart className="w-4 h-4" />
                     </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 space-y-8 bg-white/50 border-2 border-dashed border-mist-dark/20 rounded-[4rem] text-center"
          >
             <div className="p-10 bg-white rounded-full shadow-premium text-rose/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-rose/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Heart className="w-24 h-24 transition-transform group-hover:scale-110 duration-700" />
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-display font-bold text-bark italic">Your wishlist is empty</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
                   Start adding some love! Browse our collection and save your favorites here for later.
                </p>
             </div>
             <Link href="/products">
                <Button className="h-16 rounded-[2rem] bg-rose hover:bg-rose/90 text-white px-12 font-bold shadow-2xl shadow-rose/20 text-lg gap-3">
                   Explore Products <ArrowRight className="w-5 h-5" />
                </Button>
             </Link>
          </motion.div>
        )}

        {/* Wishlist Insight */}
        {wishlist.length > 0 && (
           <div className="bg-bark text-white rounded-[3rem] p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose/20 blur-[100px] rounded-full -mr-32 -mt-32" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <Sparkles className="w-6 h-6 text-rose animate-pulse" />
                       <span className="text-xs font-black uppercase tracking-widest text-white/40">Wishlist Strategy</span>
                    </div>
                    <h3 className="text-3xl font-display font-bold">Ready to <span className="text-rose italic">Bloom?</span></h3>
                    <p className="text-white/60 max-w-md font-medium">
                       Items in your wishlist aren't reserved. We recommend moving them to your cart to ensure availability for your special occasion.
                    </p>
                 </div>
                 <div className="flex flex-col gap-3 min-w-[240px]">
                    <Button 
                      onClick={() => {
                        // Batch move to cart (Optional upgrade, for now just show a note)
                        toast.success('Batch move feature coming soon!');
                      }}
                      className="h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold"
                    >
                       Clear Wishlist
                    </Button>
                    <Button className="h-14 bg-rose hover:bg-rose/90 text-white rounded-2xl font-bold shadow-xl shadow-rose/20">
                       Add All to Cart
                    </Button>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
