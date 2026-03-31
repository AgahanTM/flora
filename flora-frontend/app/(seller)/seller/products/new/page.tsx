"use client";

import { Box, ArrowLeft, Sparkles, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ProductForm } from '@/components/seller/ProductForm';

export default function NewProductPage() {
  const router = useRouter();

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
                 <h1 className="text-3xl font-display font-bold text-bark italic">Create New Masterpiece</h1>
              </div>
           </div>

           <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-mist-dark/10 shadow-premium">
              <div className="w-10 h-10 rounded-full bg-bark/5 flex items-center justify-center text-bark/20">
                 <Plus className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 leading-none mb-1">Status</p>
                 <p className="text-sm font-bold text-rose">New Draft</p>
              </div>
           </div>
        </header>

        <ProductForm />
      </div>
    </div>
  );
}
