"use client";

import { Box, Plus, Search, Filter, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { Product } from '@/lib/types/product';
import { ProductTable } from '@/components/seller/ProductTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SellerProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products'],
    queryFn: async () => {
      const response = await apiClient.get('/seller/products');
      // Response is likely an array of products
      return response.data as Product[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/seller/products/${id}`);
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete product');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      return apiClient.put(`/seller/products/${id}`, { is_active });
    },
    onSuccess: () => {
      toast.success('Product status updated');
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, is_active: !currentStatus });
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <div className="container mx-auto px-6 max-w-6xl pt-12 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/seller/dashboard')} 
                className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
              >
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-1">
                 <div className="flex items-center gap-2 text-rose mb-1">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Vendor Catalog</span>
                 </div>
                 <h1 className="text-3xl font-display font-bold text-bark italic">Manage Products</h1>
              </div>
           </div>

           <Button 
             onClick={() => router.push('/seller/products/new')}
             className="h-14 rounded-2xl bg-bark hover:bg-rose text-white px-8 font-bold shadow-xl shadow-bark/20 group gap-3"
           >
              Create New Product
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
           </Button>
        </header>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <div className="lg:col-span-2 relative">
              <Input 
                 placeholder="Search products by name..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="h-16 pl-14 pr-6 rounded-[2rem] bg-white border-mist-dark/10 shadow-premium focus:ring-rose/20 outline-none transition-all placeholder:text-bark/20 text-bark font-medium"
              />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-bark/20" />
           </div>

           <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-[2rem] border border-mist-dark/10">
              <div className="w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center text-rose">
                 <Box className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 leading-none mb-1">Total Items</p>
                 <p className="text-xl font-display font-bold text-bark">{products?.length || 0}</p>
              </div>
           </div>

           <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-[2rem] border border-mist-dark/10">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                 <Filter className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 leading-none mb-1">Active</p>
                 <p className="text-xl font-display font-bold text-bark">
                   {products?.filter(p => p.is_active).length || 0}
                 </p>
              </div>
           </div>
        </div>

        {/* Products Table */}
        <div className="min-h-[400px]">
           {isLoading ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 text-rose animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-bark/30 animate-pulse italic">Cataloging your blooms...</p>
             </div>
           ) : (
             <ProductTable 
               products={filteredProducts} 
               onDelete={handleDelete}
               onToggleStatus={handleToggleStatus}
               isLoading={isLoading}
             />
           )}
        </div>
      </div>
    </div>
  );
}
