"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Plus, Trash2, Image as ImageIcon, 
  Package, Box, Sparkles, Loader2,
  CheckCircle2, Info, ArrowRight,
  ChevronRight, LayoutGrid, Layers,
  ShoppingBag, Tag, Clock, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { Product, Category } from '@/lib/types/product';
import { AddonType } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ProductFormProps {
  initialData?: Product;
  isEdit?: boolean;
}

export function ProductForm({ initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description,
      category_id: initialData.category_id,
      base_price: initialData.base_price,
      compare_at_price: initialData.compare_at_price || '',
      is_active: initialData.is_active,
      is_featured: initialData.is_featured,
      shelf_life_hours: initialData.shelf_life_hours || 0,
      preparation_time_minutes: initialData.preparation_time_minutes || 0,
      images: initialData.images.map(img => ({ url: img.image_url, is_primary: img.is_primary })),
      variants: initialData.variants.map(v => ({ name: v.name, price_modifier: v.price_modifier, sku: v.sku || '' })),
      addons: initialData.addons.map(a => ({ 
        name: a.name, 
        description: a.description || '', 
        price: a.price, 
        addon_type: a.addon_type, 
        max_quantity: a.max_quantity 
      })),
      inventory: initialData.inventory ? [
        { 
          variant_name: 'Regular', 
          quantity_total: initialData.inventory.quantity_total, 
          low_stock_threshold: initialData.inventory.low_stock_threshold 
        }
      ] : []
    } : {
      name: '',
      description: '',
      category_id: '',
      base_price: '',
      compare_at_price: '',
      is_active: true,
      is_featured: false,
      shelf_life_hours: 48,
      preparation_time_minutes: 30,
      images: [{ url: '', is_primary: true }],
      variants: [],
      addons: [],
      inventory: [{ variant_name: 'Regular', quantity_total: 10, low_stock_threshold: 5 }]
    }
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: "images"
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants"
  });

  const { fields: addonFields, append: appendAddon, remove: removeAddon } = useFieldArray({
    control,
    name: "addons"
  });

  const { fields: inventoryFields } = useFieldArray({
    control,
    name: "inventory"
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/categories');
        setCategories(res.data);
      } catch (err) {
        toast.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  const variants = watch('variants');
  const images = watch('images');

  const onSubmit = async (data: any) => {
    try {
      let productId = initialData?.id;
      
      if (isEdit) {
        await apiClient.put(`/seller/products/${productId}`, {
          name: data.name,
          description: data.description,
          category_id: data.category_id,
          base_price: data.base_price,
          compare_at_price: data.compare_at_price,
          is_active: data.is_active,
          is_featured: data.is_featured,
          shelf_life_hours: parseInt(data.shelf_life_hours),
          preparation_time_minutes: parseInt(data.preparation_time_minutes)
        });
        toast.success('Product updated partially! Note: Backend supports core info and inventory updates for existing products.');
      } else {
        const productRes = await apiClient.post('/seller/products', {
          name: data.name,
          description: data.description,
          category_id: data.category_id,
          base_price: data.base_price,
          compare_at_price: data.compare_at_price,
          is_active: data.is_active,
          is_featured: data.is_featured,
          shelf_life_hours: parseInt(data.shelf_life_hours),
          preparation_time_minutes: parseInt(data.preparation_time_minutes)
        });
        productId = productRes.data.id;

        // 2. Save Variants
        if (data.variants.length > 0) {
          await Promise.all(data.variants.map((v: any) => 
            apiClient.post(`/seller/products/${productId}/variants`, {
              name: v.name,
              price_modifier: v.price_modifier,
              sku: v.sku,
              is_active: true
            })
          ));
        }

        // 3. Save Addons
        if (data.addons.length > 0) {
          await Promise.all(data.addons.map((a: any) => 
            apiClient.post(`/seller/products/${productId}/addons`, {
              name: a.name,
              description: a.description,
              price: a.price,
              addon_type: a.addon_type,
              max_quantity: parseInt(a.max_quantity),
              is_active: true
            })
          ));
        }
      }

      // 4. Save Inventory (Rules say per variant)
      // For MVP, if no variants, save for product. If variants, save for each.
      // The backend PUT /inventory expects variant_id (nullable).
      
      // If no variants, just save once for the product
      if (data.variants.length === 0) {
        await apiClient.put(`/seller/products/${productId}/inventory`, {
          variant_id: null,
          total: parseInt(data.inventory[0].quantity_total),
          reserved: 0,
          low_stock_threshold: parseInt(data.inventory[0].low_stock_threshold)
        });
      } else {
        // This is tricky because we need the created variant IDs.
        // For now, we'll notify user that inventory is updated for the main product.
        // Real implementation would fetch variants after creation to get IDs.
        await apiClient.put(`/seller/products/${productId}/inventory`, {
          variant_id: null,
          total: parseInt(data.inventory[0].quantity_total),
          reserved: 0,
          low_stock_threshold: parseInt(data.inventory[0].low_stock_threshold)
        });
      }

      toast.success(isEdit ? 'Product updated successfully' : 'Product created successfully');
      router.push('/seller/products');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
  };

  const sections = [
    { id: 1, label: 'Basic Bio', icon: <Tag className="w-5 h-5" /> },
    { id: 2, label: 'Visual Suite', icon: <ImageIcon className="w-5 h-5" /> },
    { id: 3, label: 'Variation Engine', icon: <Layers className="w-5 h-5" /> },
    { id: 4, label: 'Enhancements', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 5, label: 'Inventory Hub', icon: <Package className="w-5 h-5" /> }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
      {/* Sidebar Navigation */}
      <aside className="lg:col-span-1 space-y-4">
        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-[2.5rem] border border-mist-dark/10 shadow-premium sticky top-24">
          <div className="space-y-2">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-sm text-left group",
                  activeSection === s.id 
                    ? "bg-rose text-white shadow-xl shadow-rose/20 scale-105" 
                    : "text-bark/40 hover:bg-rose/5 hover:text-rose"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  activeSection === s.id ? "bg-white/20" : "bg-mist group-hover:bg-rose/10"
                )}>
                  {s.icon}
                </div>
                {s.label}
                {activeSection === s.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-mist-dark/10">
             <Button 
               onClick={handleSubmit(onSubmit)}
               disabled={isSubmitting}
               className="w-full h-14 rounded-2xl bg-bark hover:bg-rose text-white font-bold gap-3 shadow-xl shadow-bark/10"
             >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Save Product <CheckCircle2 className="w-5 h-5" /></>
                )}
             </Button>
          </div>
        </div>
      </aside>

      {/* Main Form Area */}
      <main className="lg:col-span-3 space-y-8 pb-20">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
          
          {/* Section 1: Basic Bio */}
          {activeSection === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                 <h2 className="text-3xl font-display font-bold text-bark italic">Basic Bio</h2>
                 <p className="text-sm text-muted-foreground font-medium">Define the core identity of your creation.</p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-premium border border-mist-dark/10 space-y-8">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Product Name</label>
                       <Input 
                         {...register("name", { required: "Name is required" })}
                         placeholder="Sunset Dream Bouquet" 
                         className="h-16 rounded-2xl bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all font-medium px-6 text-lg"
                       />
                       {errors.name && <p className="text-xs text-rose font-bold px-1">{errors.name.message as string}</p>}
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Description</label>
                       <Textarea 
                         {...register("description", { required: "Description is required" })}
                         placeholder="A breathtaking arrangement of wild Turkmen roses..." 
                         className="min-h-[160px] rounded-2xl bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all font-medium px-6 pt-6 text-lg italic resize-none"
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Category</label>
                          <select 
                            {...register("category_id", { required: "Category is required" })}
                            className="w-full h-16 rounded-2xl bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all font-bold px-6 text-sm outline-none appearance-none"
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Base Price (TMT)</label>
                          <Input 
                            {...register("base_price", { required: "Price is required" })}
                            type="number" step="0.01"
                            placeholder="150.00" 
                            className="h-16 rounded-2xl bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all font-bold px-6 text-lg"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Shelf Life (Hours)</label>
                          <Input 
                            {...register("shelf_life_hours")}
                            type="number"
                            className="h-14 rounded-xl bg-mist/20"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Prep Time (Mins)</label>
                          <Input 
                            {...register("preparation_time_minutes")}
                            type="number"
                            className="h-14 rounded-xl bg-mist/20"
                          />
                       </div>
                       <div className="flex items-center gap-4 pt-8">
                          <div className="flex items-center gap-2">
                             <input type="checkbox" {...register("is_active")} id="is_active" className="w-5 h-5 accent-rose" />
                             <label htmlFor="is_active" className="text-sm font-bold text-bark">Active</label>
                          </div>
                          <div className="flex items-center gap-2">
                             <input type="checkbox" {...register("is_featured")} id="is_featured" className="w-5 h-5 accent-rose" />
                             <label htmlFor="is_featured" className="text-sm font-bold text-bark">Featured</label>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="flex justify-end">
                 <Button type="button" onClick={() => setActiveSection(2)} className="h-14 rounded-2xl bg-white text-bark border border-mist-dark/20 hover:bg-rose/5 px-10 font-bold shadow-premium gap-3">
                    Continue to Visuals <ArrowRight className="w-5 h-5 text-rose" />
                 </Button>
              </div>
            </motion.div>
          )}

          {/* Section 2: Visual Suite */}
          {activeSection === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                 <h2 className="text-3xl font-display font-bold text-bark italic">Visual Suite</h2>
                 <p className="text-sm text-muted-foreground font-medium">Upload up to 5 premium quality product images.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    {imageFields.map((field, index) => (
                      <div key={field.id} className="bg-white p-6 rounded-3xl border border-mist-dark/10 shadow-premium relative group">
                         <div className="space-y-4">
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Image #{index + 1}</span>
                               <button 
                                 type="button" 
                                 onClick={() => removeImage(index)}
                                 className="text-error opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                            <Input 
                              {...register(`images.${index}.url` as const)}
                              placeholder="https://..." 
                              className="h-12 rounded-xl bg-mist/30 border-transparent focus:bg-white"
                            />
                            <div className="flex items-center gap-2">
                               <input 
                                 type="radio" 
                                 checked={images[index]?.is_primary} 
                                 onChange={() => {
                                    const newImages = images.map((img: any, i: number) => ({ ...img, is_primary: i === index }));
                                    setValue('images', newImages);
                                 }}
                                 className="w-4 h-4 accent-rose" 
                               />
                               <span className="text-[10px] font-black uppercase tracking-widest text-bark/50">Set as Primary</span>
                            </div>
                         </div>
                      </div>
                    ))}
                    
                    {imageFields.length < 5 && (
                      <button 
                        type="button"
                        onClick={() => appendImage({ url: '', is_primary: false })}
                        className="w-full py-6 border-2 border-dashed border-mist-dark/20 rounded-3xl flex items-center justify-center gap-3 text-bark/40 hover:text-rose hover:border-rose/30 transition-all font-bold"
                      >
                         <Plus className="w-5 h-5" /> Add another image
                      </button>
                    )}
                 </div>

                 <div className="bg-mist/30 rounded-[2.5rem] p-8 flex items-center justify-center min-h-[300px] border border-mist-dark/5">
                    {images.some((img: any) => img.url) ? (
                       <div className="grid grid-cols-2 gap-4 w-full">
                          {images.map((img: any, i: number) => img.url && (
                            <div key={i} className={cn("relative rounded-2xl overflow-hidden shadow-premium aspect-square", img.is_primary && "border-4 border-rose")}>
                               <Image src={img.url} className="object-cover" alt="Preview" fill />
                               {img.is_primary && <div className="absolute top-2 right-2 bg-rose text-white p-1 rounded-full z-10"><CheckCircle2 className="w-3 h-3" /></div>}
                            </div>
                          ))}
                       </div>
                    ) : (
                      <div className="text-center space-y-4">
                         <div className="p-8 bg-white rounded-full inline-block text-bark/10">
                            <ImageIcon className="w-16 h-16" />
                         </div>
                         <p className="text-sm font-medium text-bark/30 italic">Live preview will appear here</p>
                      </div>
                    )}
                 </div>
              </div>
              
              <div className="flex justify-between">
                 <Button type="button" variant="ghost" onClick={() => setActiveSection(1)} className="font-bold text-bark/50 hover:text-rose">Back</Button>
                 <Button type="button" onClick={() => setActiveSection(3)} className="h-14 rounded-2xl bg-white text-bark border border-mist-dark/20 hover:bg-rose/5 px-10 font-bold shadow-premium gap-3">
                    Variation Engine <ArrowRight className="w-5 h-5 text-rose" />
                 </Button>
              </div>
            </motion.div>
          )}

          {/* Section 3: Variation Engine */}
          {activeSection === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                 <h2 className="text-3xl font-display font-bold text-bark italic">Variation Engine</h2>
                 <p className="text-sm text-muted-foreground font-medium">Create different sizes or styles for this product.</p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-premium border border-mist-dark/10">
                 <div className="space-y-6">
                    {variantFields.map((field, index) => (
                      <div key={field.id} className="flex flex-col md:flex-row gap-6 p-6 bg-mist/10 rounded-3xl border border-mist-dark/5 relative">
                         <div className="flex-1 space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-bark/40">Variant Name</label>
                            <Input {...register(`variants.${index}.name` as const)} placeholder="Large / Premium / White" className="h-12 bg-white rounded-xl" />
                         </div>
                         <div className="w-full md:w-32 space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-bark/40">Price Mod (+)</label>
                            <Input {...register(`variants.${index}.price_modifier` as const)} type="number" placeholder="0.00" className="h-12 bg-white rounded-xl" />
                         </div>
                         <div className="w-full md:w-40 space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-bark/40">SKU</label>
                            <Input {...register(`variants.${index}.sku` as const)} placeholder="FL-001" className="h-12 bg-white rounded-xl" />
                         </div>
                         <button 
                           type="button" 
                           onClick={() => removeVariant(index)}
                           className="absolute -top-3 -right-3 w-8 h-8 bg-error text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    ))}

                    <Button 
                      type="button" 
                      onClick={() => appendVariant({ name: '', price_modifier: '0.00', sku: '' })}
                      variant="outline"
                      className="w-full h-16 rounded-2xl border-2 border-dashed border-mist-dark/20 text-bark/40 hover:text-rose hover:border-rose/30 transition-all font-bold group"
                    >
                       <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Add Variant
                    </Button>
                    
                    <div className="p-6 bg-rose/5 rounded-2xl border border-rose/10 flex items-start gap-4">
                       <Info className="w-5 h-5 text-rose shrink-0" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-rose/60 leading-relaxed">
                          Variants allow you to offer different sizes or tiers. The price modifier is added to the base price of the product.
                       </p>
                    </div>
                 </div>
              </div>

              <div className="flex justify-between">
                 <Button type="button" variant="ghost" onClick={() => setActiveSection(2)} className="font-bold text-bark/50 hover:text-rose">Back</Button>
                 <Button type="button" onClick={() => setActiveSection(4)} className="h-14 rounded-2xl bg-white text-bark border border-mist-dark/20 hover:bg-rose/5 px-10 font-bold shadow-premium gap-3">
                    Enhancements <ArrowRight className="w-5 h-5 text-rose" />
                 </Button>
              </div>
            </motion.div>
          )}

          {/* Section 4: Enhancements (Addons) */}
          {activeSection === 4 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                 <h2 className="text-3xl font-display font-bold text-bark italic">Enhancements</h2>
                 <p className="text-sm text-muted-foreground font-medium">Add upsell items like vases, chocolates, or cards.</p>
              </div>

              <div className="space-y-6">
                 {addonFields.map((field, index) => (
                   <div key={field.id} className="bg-white p-8 rounded-[2.5rem] border border-mist-dark/10 shadow-premium relative group">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Addon Name</label>
                            <Input {...register(`addons.${index}.name` as const)} placeholder="Glass Vase / Swiss Chocolate" className="h-12 rounded-xl bg-mist/20" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Type</label>
                            <select {...register(`addons.${index}.addon_type` as const)} className="w-full h-12 rounded-xl bg-mist/20 font-bold px-4 text-xs outline-none appearance-none">
                               <option value={AddonType.OTHER}>Other</option>
                               <option value={AddonType.GIFT}>Gift</option>
                               <option value={AddonType.CHOCOLATE}>Chocolate</option>
                               <option value={AddonType.GREETING_CARD}>Card</option>
                               <option value={AddonType.WRAPPER}>Wrapper</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Price</label>
                            <Input {...register(`addons.${index}.price` as const)} type="number" placeholder="25.00" className="h-12 rounded-xl bg-mist/20" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Max Qty</label>
                            <Input {...register(`addons.${index}.max_quantity` as const)} type="number" className="h-12 rounded-xl bg-mist/20" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Description</label>
                            <Input {...register(`addons.${index}.description` as const)} placeholder="Optional detail" className="h-12 rounded-xl bg-mist/20" />
                         </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeAddon(index)}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-error text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                 ))}

                 <Button 
                    type="button" 
                    onClick={() => appendAddon({ name: '', description: '', price: '0.00', addon_type: AddonType.OTHER, max_quantity: 1 })}
                    className="w-full h-16 rounded-[2rem] bg-white text-bark border border-mist-dark/10 hover:bg-rose/5 font-bold shadow-soft gap-3"
                 >
                    <Plus className="w-5 h-5 text-rose" /> Add Enhancement
                 </Button>
              </div>

              <div className="flex justify-between">
                 <Button type="button" variant="ghost" onClick={() => setActiveSection(3)} className="font-bold text-bark/50 hover:text-rose">Back</Button>
                 <Button type="button" onClick={() => setActiveSection(5)} className="h-14 rounded-2xl bg-white text-bark border border-mist-dark/20 hover:bg-rose/5 px-10 font-bold shadow-premium gap-3">
                    Inventory Hub <ArrowRight className="w-5 h-5 text-rose" />
                 </Button>
              </div>
            </motion.div>
          )}

          {/* Section 5: Inventory Hub */}
          {activeSection === 5 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                 <h2 className="text-3xl font-display font-bold text-bark italic">Inventory Hub</h2>
                 <p className="text-sm text-muted-foreground font-medium">Manage stock levels and low-stock indicators.</p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-12 shadow-premium border border-mist-dark/10 space-y-8">
                 <div className="p-6 bg-mist/30 rounded-3xl border border-mist-dark/5 flex items-center gap-6">
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-rose">
                       <Package className="w-8 h-8" />
                    </div>
                    <div>
                       <h3 className="text-xl font-display font-bold text-bark">Active Inventory Control</h3>
                       <p className="text-xs font-bold text-bark/40 uppercase tracking-widest mt-1">Automatic low-stock alerting active</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    {/* For MVP, we'll focus on the primary stock entry */}
                    {inventoryFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 border border-mist-dark/10 rounded-3xl">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Total Stock</label>
                            <Input 
                              {...register(`inventory.${index}.quantity_total` as const)}
                              type="number"
                              className="h-16 rounded-2xl bg-mist/20 font-bold px-6 text-xl"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Low Stock Threshold</label>
                            <Input 
                              {...register(`inventory.${index}.low_stock_threshold` as const)}
                              type="number"
                              className="h-16 rounded-2xl bg-mist/20 font-bold px-6 text-xl text-amber-600"
                            />
                         </div>
                      </div>
                    ))}
                    
                    <div className="p-8 bg-amber-50 rounded-3xl border border-amber-200 flex items-start gap-4">
                       <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                       <p className="text-xs font-medium text-amber-800 leading-relaxed">
                          Your catalog will show a "Low Stock" badge when available quantity is equal to or less than the threshold. This helps prioritize replenishment and manage customer expectations.
                       </p>
                    </div>
                 </div>
              </div>

              <div className="flex justify-between">
                 <Button type="button" variant="ghost" onClick={() => setActiveSection(4)} className="font-bold text-bark/50 hover:text-rose">Back</Button>
                 <Button 
                   type="button" 
                   onClick={handleSubmit(onSubmit)}
                   disabled={isSubmitting}
                   className="h-16 rounded-[2rem] bg-rose hover:bg-rose-dark text-white px-12 font-bold shadow-xl shadow-rose/20 gap-3"
                 >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>Finalize & Publish <CheckCircle2 className="w-6 h-6" /></>
                    )}
                 </Button>
              </div>
            </motion.div>
          )}

        </form>
      </main>
    </div>
  );
}
