"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, Filter, ArrowDownUp, Search } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { Product } from '@/lib/types/product';
import { trackEvent } from '@/lib/api/analytics';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters } from '@/components/product/ProductFilters';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const occasion = searchParams.get('occasion') || '';
  const priceMin = searchParams.get('price_min') || '';
  const priceMax = searchParams.get('price_max') || '';
  const sort = searchParams.get('sort') || 'newest';

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Fetch products (Always hit the search endpoint)
  const { data: fetchedProducts, isLoading, isError } = useQuery<Product[]>({
    queryKey: ['products', 'search', { q }],
    queryFn: async () => {
      if (!q) return []; // Don't fetch if no query
      const { data } = await apiClient.get('/products/search', { params: { q } });
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 60 * 1000,
    enabled: !!q // Only run query if q exists
  });

  // Client-side filtering & sorting
  const processedProducts = useMemo(() => {
    if (!fetchedProducts) return [];
    
    let result = [...fetchedProducts];

    if (category) {
      result = result.filter(p => p.category_id === category || p.slug.includes(category));
    }

    if (occasion) {
      result = result.filter(p => p.description.toLowerCase().includes(occasion) || p.slug.includes(occasion));
    }

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
  }, [fetchedProducts, category, occasion, priceMin, priceMax, sort]);

  // Track search performance after results are processed
  useEffect(() => {
    if (q && !isLoading && fetchedProducts) {
      trackEvent('search_performed', { 
        query: q, 
        results_count: processedProducts.length 
      });
    }
  }, [q, isLoading, !!fetchedProducts, processedProducts.length]);

  const updateSort = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('occasion');
    params.delete('price_min');
    params.delete('price_max');
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  // If no search query was even submitted initially
  if (!q && !isLoading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center pt-20 pb-32">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-soft mb-8 text-mist-dark border border-mist">
          <Search className="w-10 h-10" />
        </div>
        <h1 className="font-display font-bold text-4xl text-bark mb-4">Search Flora</h1>
        <p className="text-bark/70 text-lg mb-8">Enter a search term in the navigation bar to find the perfect gift.</p>
        <Link href="/products" className="px-8 py-3 bg-rose text-white rounded-full font-medium shadow-md hover:bg-rose-dark transition-colors">
          Browse all products instead
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      
      {/* Search Header */}
      <div className="bg-mist/30 border-b border-border pt-24 pb-12 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-floral-texture opacity-30 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
          
          <nav className="flex items-center text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-bark transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-bark font-medium">Search</span>
          </nav>

          <h1 className="font-display font-bold text-4xl md:text-5xl text-bark mb-4">
            Results for: <span className="text-rose font-accent italic font-normal px-2">"{q}"</span>
          </h1>
          <p className="text-bark/70 text-lg">
            {!isLoading && fetchedProducts && processedProducts.length === 0 
              ? 'No products matched your search. Try different keywords.'
              : !isLoading 
                ? `Found ${processedProducts.length} items matching your search.`
                : 'Searching our collections...'}
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
              <SheetContent side="left" className="w-[300px] sm:w-[350px] p-6 bg-cream border-r-border overflow-y-auto">
                <ProductFilters onMobileClose={() => setIsMobileFiltersOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="hidden md:block text-sm text-muted-foreground">
            {processedProducts.length} results
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <label className="hidden sm:block text-sm text-bark font-medium">Sort by:</label>
            <div className="relative">
              <select 
                value={sort}
                onChange={(e) => updateSort(e.target.value)}
                className="pl-4 pr-10 py-2.5 bg-white border border-border rounded-full text-sm font-medium text-bark appearance-none shadow-sm cursor-pointer hover:border-mist-dark outline-none focus:ring-2 focus:ring-rose/20 transition-all"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Relevant</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <ArrowDownUp className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Content Layout */}
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream pt-24 pb-12 text-center flex flex-col items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full mb-8" />
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-96" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
