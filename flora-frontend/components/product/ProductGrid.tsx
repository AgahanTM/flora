"use client";

import { AlertCircle, FileQuestion } from 'lucide-react';
import { Product } from '@/lib/types/product';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCardSkeleton } from '@/components/shared/Skeletons';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  isError?: boolean;
  onClearFilters?: () => void;
  skeletonCount?: number;
}

export function ProductGrid({ 
  products, 
  isLoading, 
  isError, 
  onClearFilters,
  skeletonCount = 12 
}: ProductGridProps) {
  
  if (isError) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 bg-rose/10 text-rose rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-2xl text-bark mb-3">
          Failed to load products
        </h3>
        <p className="text-bark/70 mb-8 max-w-sm">
          We encountered an error while fetching our collection. Please try again in a moment.
        </p>
        <Button onClick={() => window.location.reload()} className="h-12 px-8 rounded-full">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(skeletonCount)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState 
        icon={SearchX}
        title="No blooms found"
        description="We couldn't find any arrangements matching your delicate search criteria. Try broadening your gaze."
        actionLabel="Reset Filters"
        onAction={onClearFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product, index) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          priorityImage={index < 4} // Load first 4 images with priority
        />
      ))}
    </div>
  );
}
