"use client";

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { apiClient } from '@/lib/api/client';
import { Product } from '@/lib/types/product';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCardSkeleton } from '@/components/shared/Skeletons';

export function FeaturedProducts() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data } = await apiClient.get('/products/featured');
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return (
    <section className="py-16 md:py-24 bg-mist/30">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 md:mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display font-bold text-3xl md:text-5xl text-bark mb-4">
              Our <span className="text-rose font-accent italic font-normal pr-2">Favourites</span>
            </h2>
            <p className="text-bark/70 text-lg">
              Hand-picked selections of our most stunning and popular arrangements.
            </p>
          </div>
          <Link 
            href="/products?featured=true" 
            className="text-bark font-medium hover:text-rose transition-colors border-b-2 border-transparent hover:border-rose pb-1 shrink-0"
          >
            View all featured
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="flex overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 hide-scrollbar snap-x snap-mandatory">
            {products.slice(0, 8).map((product) => (
              <div key={product.id} className="min-w-[260px] md:min-w-0 snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No featured products available at this time.
          </div>
        )}
      </div>
    </section>
  );
}
