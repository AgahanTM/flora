"use client";

import { 
  Edit2, Trash2, AlertTriangle, 
  CheckCircle2, XCircle, MoreVertical,
  Eye, Package, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import { Product } from '@/lib/types/product';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import Image from 'next/image';

interface ProductTableProps {
  products: Product[];
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  isLoading?: boolean;
}

export function ProductTable({ products, onDelete, onToggleStatus, isLoading }: ProductTableProps) {
  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-mist/20 animate-pulse rounded-2xl w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-white/50 border-2 border-dashed border-mist-dark/20 rounded-[3rem] text-center">
        <div className="p-8 bg-white rounded-full shadow-premium text-bark/10 mb-6">
          <Box className="w-16 h-16" />
        </div>
        <h3 className="text-2xl font-display font-bold text-bark italic mb-2">No flowers yet?</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 font-medium">
          Start your floral journey by adding your first product to the catalog.
        </p>
        <Link href="/seller/products/new">
          <Button className="h-14 rounded-2xl bg-rose hover:bg-rose-dark text-white px-10 font-bold shadow-xl shadow-rose/20">
            Create Product
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-mist-dark/10 shadow-premium">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-mist-dark/5 bg-mist/30">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-bark/40">Product</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-bark/40">Category</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-bark/40">Price</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-bark/40">Stock Status</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-bark/40">Visibility</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-bark/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-dark/5">
            <AnimatePresence mode="popLayout">
              {products.map((product) => {
                const isLowStock = product.inventory && 
                  (product.inventory.quantity_total - product.inventory.quantity_reserved) <= product.inventory.low_stock_threshold;
                
                const primaryImage = product.images.find(img => img.is_primary)?.image_url || 
                                    product.images[0]?.image_url || 
                                    '/images/placeholder-product.jpg';

                return (
                  <motion.tr 
                    key={product.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-rose/5 transition-colors duration-500"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-mist-dark/10 bg-mist/30 shrink-0 relative">
                          <Image src={primaryImage} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-bark truncate">{product.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 italic">ID: {product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-medium text-sm text-bark/70">
                      {product.category_id}
                    </td>
                    <td className="px-6 py-6 font-bold text-bark">
                      {formatPrice(parseFloat(product.base_price))}
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                           {isLowStock ? (
                             <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 gap-1 rounded-lg">
                               <AlertTriangle className="w-3 h-3" />
                               Low Stock
                             </Badge>
                           ) : (
                             <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1 rounded-lg">
                               <Package className="w-3 h-3" />
                               In Stock
                             </Badge>
                           )}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-bark/40">
                          {product.inventory?.quantity_total ?? 0} total units
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <button 
                        onClick={() => onToggleStatus(product.id, product.is_active)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-bold text-xs uppercase tracking-tight",
                          product.is_active 
                            ? "bg-rose/10 text-rose border-rose/20 hover:bg-rose/20" 
                            : "bg-mist text-bark/40 border-mist-dark/10 hover:bg-mist-dark/5"
                        )}
                      >
                         {product.is_active ? (
                           <><Eye className="w-3.5 h-3.5" /> Published</>
                         ) : (
                           <><XCircle className="w-3.5 h-3.5" /> Draft</>
                         )}
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-500">
                        <Link href={`/seller/products/${product.id}/edit`}>
                          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-bark hover:text-white transition-all shadow-premium">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          onClick={() => onDelete(product.id)}
                          variant="ghost" 
                          size="icon" 
                          className="w-10 h-10 rounded-xl hover:bg-error hover:text-white transition-all shadow-premium"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
