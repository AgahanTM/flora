import { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsClientPage } from './ProductsClientPage';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductsPageProps {
  searchParams: { q?: string; category?: string; occasion?: string };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<ProductsPageProps['searchParams']> }): Promise<Metadata> {
  const { q, category, occasion } = await searchParams;
  
  if (q) return { title: `Search results for "${q}"` };
  if (category) {
    const name = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return { 
      title: `${name} — Premium Arrangements`,
      description: `Browse our curated collection of ${name.toLowerCase()} available for same-day delivery.` 
    };
  }
  if (occasion) {
    const name = occasion.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return { title: `${name} Flowers & Gifts` };
  }

  return { 
    title: 'Explore Our Collection',
    description: 'Shop fresh flowers, premium chocolates, and personalized gifts curated for every occasion.'
  };
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-12 w-96 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            <Skeleton className="h-[600px] hidden md:block" />
            <div className="md:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ProductsClientPage />
    </Suspense>
  );
}
