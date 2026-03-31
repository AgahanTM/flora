"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, Search, Filter, 
  Plus, ChevronRight, Store, 
  Trash2, Edit3, CheckCircle2, 
  XCircle, Image as ImageIcon,
  FolderTree, Gift, Sparkles,
  Loader2, Star, ExternalLink,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

import { apiClient } from '@/lib/api/client';
import { adminApi } from '@/lib/api/admin';
import { Product, Category } from '@/lib/types/product';
import { Occasion } from '@/lib/types/occasion';
import { PersonalizationType, PersonalizationTemplate } from '@/lib/types/personalization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

type TabType = 'all_products' | 'categories' | 'occasions' | 'personalization';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('all_products');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data Fetching
  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await apiClient.get('/products');
      return data as Product[];
    }
  });

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await adminApi.getCategories();
      return data as Category[];
    }
  });

  const { data: occasions, isLoading: isOccasionsLoading } = useQuery({
    queryKey: ['admin-occasions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/occasions');
      return data as Occasion[];
    }
  });

  const { data: pTypes, isLoading: isPTypesLoading } = useQuery({
    queryKey: ['admin-personalization-types'],
    queryFn: async () => {
      const { data } = await apiClient.get('/personalization/types');
      return data as PersonalizationType[];
    }
  });

  // Mutations
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string, featured: boolean }) => 
      adminApi.toggleProductFeatured(id, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product curation updated');
    }
  });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <Package className="w-4 h-4" />
            Stock & Content Control
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">Global Inventory</h1>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-mist/30 rounded-2xl">
           {(['all_products', 'categories', 'occasions', 'personalization'] as TabType[]).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === tab ? "bg-white text-rose shadow-sm" : "text-bark/40 hover:text-bark"
               )}
             >
               {tab.replace('_', ' ')}
             </button>
           ))}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="bg-white rounded-[3rem] border border-mist-dark/10 shadow-premium overflow-hidden">
         {activeTab === 'all_products' && (
           <div className="space-y-8">
              <div className="p-8 border-b border-mist-dark/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-mist/5">
                 <div className="relative flex-1 md:w-96 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bark/20 group-focus-within:text-rose" />
                    <Input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search product name or ID..."
                      className="h-12 pl-14 rounded-xl border-mist-dark/10 bg-white shadow-sm"
                    />
                 </div>
                 <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 italic">Direct Vendor Curate Mode</p>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="text-[10px] font-black uppercase tracking-widest text-bark/30 border-b border-mist-dark/5">
                          <th className="px-8 py-6">Identity</th>
                          <th className="px-8 py-6">Pricing</th>
                          <th className="px-8 py-6">Vendor</th>
                          <th className="px-8 py-6">Featured</th>
                          <th className="px-8 py-6 text-right">Preview</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-mist-dark/5">
                       {isProductsLoading ? (
                         <tr><td colSpan={5} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30 mx-auto" /></td></tr>
                       ) : filteredProducts?.map((product) => (
                         <tr key={product.id} className="group hover:bg-cream/20 transition-colors">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-mist flex items-center justify-center overflow-hidden border border-mist-dark/5 relative">
                                     {product.images?.[0] ? <Image src={product.images[0].image_url} alt={product.name} fill className="object-cover" /> : <Package className="w-6 h-6 text-bark/20" />}
                                  </div>
                                  <div>
                                     <p className="font-bold text-bark group-hover:text-rose transition-colors">{product.name}</p>
                                     <p className="text-[10px] font-medium text-bark/40 italic">SLUG: {product.slug}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6 font-bold text-rose">
                               {formatPrice(parseFloat(product.base_price))}
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2">
                                  <Store className="w-3.5 h-3.5 text-bark/30" />
                                  <span className="text-xs font-medium text-bark/60">Boutique ID: {product.seller_id.slice(0, 8)}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <button 
                                 onClick={() => toggleFeaturedMutation.mutate({ id: product.id, featured: !product.is_featured })}
                                 className={cn(
                                   "p-2.5 rounded-xl transition-all shadow-sm",
                                   product.is_featured ? "bg-amber-100 text-amber-600 ring-2 ring-amber-500/20" : "bg-mist/30 text-bark/20 hover:text-rose hover:bg-rose/5"
                                 )}
                               >
                                  <Star className={cn("w-5 h-5", product.is_featured && "fill-amber-600")} />
                               </button>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <Link 
                                 href={`/products/${product.id}`}
                                 className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-mist/30 text-bark hover:bg-rose hover:text-white transition-all shadow-sm"
                               >
                                  <ExternalLink className="w-5 h-5" />
                               </Link>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
         )}

         {activeTab === 'categories' && (
           <div className="p-12 space-y-12">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-display font-bold text-bark italic flex items-center gap-3">
                       <FolderTree className="w-8 h-8 text-rose" /> 
                       Taxonomy Architecture
                    </h3>
                    <p className="text-xs text-bark/50 font-medium">Manage the hierarchical navigation tree for shoppers.</p>
                 </div>
                 <Button className="h-14 px-8 rounded-2xl bg-rose text-white font-bold gap-3 shadow-xl shadow-rose/20">
                    <Plus className="w-5 h-5" /> New Root Category
                 </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {isCategoriesLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose/30 py-12" /> : categories?.filter(c => !c.parent_id).map((cat) => (
                   <CategoryCard key={cat.id} category={cat} allCategories={categories} />
                 ))}
              </div>
           </div>
         )}

         {activeTab === 'occasions' && (
           <div className="p-12 space-y-12">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-display font-bold text-bark italic flex items-center gap-3">
                       <Gift className="w-8 h-8 text-rose" /> 
                       Gifting Occasions
                    </h3>
                    <p className="text-xs text-bark/50 font-medium">Curate the seasonal and emotional triggers for gifting.</p>
                 </div>
                 <Button className="h-14 px-8 rounded-2xl bg-bark text-white font-bold gap-3 shadow-xl shadow-bark/10">
                    <Plus className="w-5 h-5" /> Add Occasion
                 </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {isOccasionsLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : occasions?.map((occ) => (
                   <div key={occ.id} className="p-8 bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-soft group hover:shadow-premium transition-all">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-mist flex items-center justify-center mb-6 group-hover:bg-rose/10 transition-colors relative">
                         {occ.icon_url ? <Image src={occ.icon_url} alt={occ.name} fill className="p-4" /> : <Gift className="w-8 h-8 text-bark/20 group-hover:text-rose transition-colors" />}
                      </div>
                      <h4 className="font-bold text-bark mb-1 group-hover:text-rose transition-colors">{occ.name}</h4>
                      <p className="text-[10px] font-black uppercase text-rose/40 tracking-widest leading-loose">SLUG: {occ.slug}</p>
                      <div className="mt-6 pt-6 border-t border-mist-dark/5 flex justify-end gap-2">
                         <button className="p-2 text-bark/20 hover:text-rose transition-colors"><Edit3 className="w-4 h-4" /></button>
                         <button className="p-2 text-bark/20 hover:text-rose transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         )}

         {activeTab === 'personalization' && (
           <div className="p-12 space-y-12">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-display font-bold text-bark italic flex items-center gap-3">
                       <Sparkles className="w-8 h-8 text-rose" /> 
                       Production Templates
                    </h3>
                    <p className="text-xs text-bark/50 font-medium">Manage visual templates for customizable products.</p>
                 </div>
                 <Button className="h-14 px-8 rounded-2xl bg-rose text-white font-bold gap-3 shadow-xl shadow-rose/20">
                    <Plus className="w-5 h-5" /> Create Template
                 </Button>
              </div>

              <div className="space-y-12">
                 {isPTypesLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : pTypes?.map((type) => (
                   <div key={type.id} className="space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="bg-bark text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-bark/20">
                            {type.name}
                         </div>
                         <div className="h-1 border-t border-mist-dark/10 flex-1 ml-2" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         {/* We assume templates are pre-loaded or fetched per type in a real app, here we iterate hypothetical templates */}
                         <div className="p-8 bg-mist/10 rounded-[2.5rem] border-2 border-dashed border-mist-dark/10 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:bg-mist/20 transition-all">
                            <Plus className="w-8 h-8 text-bark/20 group-hover:text-rose transition-colors" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 group-hover:text-bark transition-colors">Add to {type.name}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         )}
      </div>
    </div>
  );
}

function CategoryCard({ category, allCategories }: { category: Category, allCategories: Category[] }) {
  const children = allCategories.filter(c => c.parent_id === category.id);
  
  return (
    <div className="space-y-4">
       <div className="p-8 bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-soft group hover:shadow-premium transition-all">
          <div className="flex items-center justify-between mb-6">
             <div className="w-12 h-12 rounded-2xl bg-mist flex items-center justify-center text-bark/20 relative overflow-hidden">
                {category.icon_url ? <Image src={category.icon_url} alt={category.name} fill className="p-3" /> : <FolderTree className="w-6 h-6" />}
             </div>
             <div className="flex items-center gap-1">
                <button className="p-2 text-bark/20 hover:text-rose transition-colors"><Edit3 className="w-4 h-4" /></button>
                <button className="p-2 text-bark/20 hover:text-rose transition-colors"><Plus className="w-4 h-4" /></button>
             </div>
          </div>
          <h4 className="font-bold text-bark mb-1">{category.name}</h4>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose/40 leading-loose">SLUG: {category.slug}</p>
          <div className="mt-6 flex items-center gap-2">
             <span className="text-[10px] font-black tracking-widest text-bark/30 uppercase">{children.length} Branches</span>
          </div>
       </div>
       
       {children.length > 0 && (
         <div className="pl-6 border-l-2 border-mist-dark/5 space-y-4">
            {children.map(child => (
              <div key={child.id} className="p-5 bg-mist/5 rounded-2xl border border-mist-dark/5 flex items-center justify-between hover:bg-white hover:shadow-soft transition-all group">
                 <div className="flex items-center gap-3">
                    <ChevronRight className="w-3.5 h-3.5 text-rose/40 group-hover:translate-x-1 transition-transform" />
                    <span className="text-sm font-bold text-bark">{child.name}</span>
                 </div>
                 <button className="p-1.5 text-bark/10 hover:text-rose opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
         </div>
       )}
    </div>
  );
}
