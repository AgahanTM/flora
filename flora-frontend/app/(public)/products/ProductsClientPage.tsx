"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, Filter, ArrowDownUp } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { Product } from '@/lib/types/product';
import { trackEvent } from '@/lib/api/analytics';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters } from '@/components/product/ProductFilters';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductsClientPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const occasion = searchParams.get('occasion') || '';
  const priceMin = searchParams.get('price_min') || '';
  const priceMax = searchParams.get('price_max') || '';
  const sort = searchParams.get('sort') || 'newest';

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Track search
  useEffect(() => {
    if (q) {
      const timeoutId = setTimeout(() => {
        trackEvent('search_performed', { query: q });
      }, 1000); // debounce tracking
      return () => clearTimeout(timeoutId);
    }
  }, [q]);

  // Fetch products with staleTime: 5 min
  const { data: fetchedProducts, isLoading, isError } = useQuery<Product[]>({
    queryKey: ['products', { q, category }],
    queryFn: async () => {
      let endpoint = '/products';
      let params: Record<string, string> = {};
      
      if (q) {
        endpoint = '/products/search';
        params.q = q;
      } else if (category) {
        params.category = category;
      }

      const { data } = await apiClient.get(endpoint, { params });
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Client-side filtering & sorting
  const processedProducts = useMemo(() => {
    if (!fetchedProducts) return [];
    
    let result = [...fetchedProducts];

    // Client-side category fallback
    if (q && category) {
      result = result.filter(p => p.category_id === category || p.slug.includes(category));
    }

    // Occasion Filter
    if (occasion) {
      result = result.filter(p => p.description.toLowerCase().includes(occasion) || p.slug.includes(occasion));
    }

    // Price Filter
    if (priceMin) {
      const min = Number(priceMin);
      result = result.filter(p => Number(p.base_price) >= min);
    }
    if (priceMax) {
      const max = Number(priceMax);
      result = result.filter(p => Number(p.base_price) <= max);
    }

    // Sort
    result.sort((a, b) => {
      if (sort === 'price_asc') return Number(a.base_price) - Number(b.base_price);
      if (sort === 'price_desc') return Number(b.base_price) - Number(a.base_price);
      if (sort === 'popular') {
        const stockA = (a.inventory?.quantity_total || 0) - (a.inventory?.quantity_reserved || 0);
        const stockB = (b.inventory?.quantity_total || 0) - (b.inventory?.quantity_reserved || 0);
        return stockA - stockB;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [fetchedProducts, q, category, occasion, priceMin, priceMax, sort]);

  const updateSort = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('occasion');
    params.delete('price_min');
    params.delete('price_max');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      
      {/* Page Header */}
      <div className="bg-mist/30 border-b border-border pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-bark transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-bark font-medium">Shop</span>
          </nav>

          <h1 className="font-display font-bold text-4xl md:text-5xl text-bark mb-4">
            {q ? (
              <>Search results for <span className="text-rose font-accent italic font-normal px-2">"{q}"</span></>
            ) : category ? (
              <span className="capitalize">{category.replace(/-/g, ' ')} Flora</span>
            ) : (
              <>All <span className="text-rose font-accent italic font-normal pr-2">Flowers & Gifts</span></>
            )}
          </h1>
          <p className="text-bark/70 text-lg">
            {!isLoading && fetchedProducts && processedProducts.length === 0 
              ? 'No products match your criteria.'
              : !isLoading 
                ? `Showing ${processedProducts.length} premium arrangements and gifts.`
                : 'Loading exquisite collections...'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-7xl mt-8">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8">
          
          <div className="md:hidden">
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger className="flex items-center justify-center gap-2 bg-white border border-border px-5 py-2.5 rounded-full text-bark font-medium text-sm shadow-sm hover:border-rose hover:text-rose transition-colors">
                <Filter className="w-4 h-4" />
                Filters
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] p-6 bg-cream border-t-rose/20 rounded-t-[3rem] overflow-y-auto">
                <div className="w-12 h-1.5 bg-mist-dark/20 rounded-full mx-auto mb-8" />
                <ProductFilters onMobileClose={() => setIsMobileFiltersOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="hidden md:block text-sm text-muted-foreground">
            {processedProducts.length} products found
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <label className="hidden sm:block text-sm text-bark font-medium">Sort by:</label>
            <div className="relative">
              <select 
                value={sort}
                onChange={(e) => updateSort(e.target.value)}
                className="pl-4 pr-10 py-2.5 bg-white border border-border rounded-full text-sm font-medium text-bark appearance-none shadow-sm cursor-pointer hover:border-mist-dark outline-none focus:ring-2 focus:ring-rose/20 transition-all"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="popular">Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <ArrowDownUp className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="hidden md:block w-1/4 shrink-0 sticky top-28 bg-white p-6 rounded-3xl shadow-soft border border-mist-dark/30">
            <ProductFilters />
          </div>

          <div className="w-full md:w-3/4">
            <ProductGrid 
              products={processedProducts}
              isLoading={isLoading}
              isError={isError}
              skeletonCount={8}
              onClearFilters={clearAllFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
