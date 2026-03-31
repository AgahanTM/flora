"use client";

import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, Edit3 } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { Product } from '@/lib/types/product';
import { ProductForm } from '@/components/seller/ProductForm';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { data: product, isLoading } = useQuery({
    queryKey: ['seller-product', productId],
    queryFn: async () => {
      const response = await apiClient.get(`/seller/products/${productId}`);
      // Based on rules, GET /products/:id might return the object directly
      return response.data as Product;
    }
  });

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <div className="container mx-auto px-6 max-w-6xl pt-12 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/seller/products')} 
                className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
              >
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-1">
                 <div className="flex items-center gap-2 text-rose mb-1">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Flora Creative Suite</span>
                 </div>
                 <h1 className="text-3xl font-display font-bold text-bark italic">Refine Creation</h1>
              </div>
           </div>

           <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-mist-dark/10 shadow-premium">
              <div className="w-10 h-10 rounded-full bg-bark/5 flex items-center justify-center text-bark/20">
                 <Edit3 className="w-5 h-5" />
              </div>
              <div className="min-w-[120px]">
                 <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 leading-none mb-1">Editing ID</p>
                 <p className="text-sm font-bold text-bark italic truncate">{productId.slice(0, 12)}...</p>
              </div>
           </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-4 bg-white/50 rounded-[3rem] border border-mist-dark/10">
             <Loader2 className="w-12 h-12 text-rose animate-spin" />
             <p className="text-xs font-black uppercase tracking-widest text-bark/30 animate-pulse italic">Retrieving floral details...</p>
          </div>
        ) : product ? (
          <ProductForm initialData={product} isEdit />
        ) : (
          <div className="text-center py-32 bg-white/50 rounded-[3rem] border border-mist-dark/10">
             <p className="text-xl font-display font-bold text-bark italic">Creation not found</p>
             <button 
                onClick={() => router.push('/seller/products')}
                className="mt-6 text-rose hover:underline font-bold text-sm"
              >
                Return to Catalog
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
