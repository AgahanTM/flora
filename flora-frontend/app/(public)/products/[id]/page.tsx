import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { apiClient } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductClientPage } from './ProductClientPage';
import { formatPrice } from '@/lib/utils/format';

interface ProductDetailPageProps {
  params: { id: string };
}

async function getProduct(id: string) {
  try {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<ProductDetailPageProps['params']> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  
  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const price = formatPrice(Number(product.base_price));
  
  return {
    title: `${product.name} — ${price}`,
    description: product.description?.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images?.[0]?.image_url ? [{ url: product.images[0].image_url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<ProductDetailPageProps['params']> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <Suspense fallback={
       <div className="container mx-auto px-4 py-32 space-y-12">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           <Skeleton className="lg:col-span-7 aspect-square rounded-[2rem]" />
           <div className="lg:col-span-5 space-y-8">
             <Skeleton className="h-12 w-3/4" />
             <Skeleton className="h-8 w-1/2" />
             <Skeleton className="h-32 w-full" />
             <Skeleton className="h-64 w-full" />
           </div>
         </div>
       </div>
    }>
       <ProductClientPage initialProduct={product} />
    </Suspense>
  );
}
