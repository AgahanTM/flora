"use client";

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Star, 
  Truck, 
  Clock, 
  ShieldCheck, 
  Store, 
  ArrowRight, 
  Minus, 
  Plus, 
  ShoppingBag,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { Product, ProductVariant, ProductAddon } from '@/lib/types/product';
import { Review, SellerRatings } from '@/lib/types/review';
import { trackEvent } from '@/lib/api/analytics';
import { formatPrice, formatWorkingHours, formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { VariantSelector } from '@/components/product/VariantSelector';
import { AddonSelector } from '@/components/product/AddonSelector';
import { PersonalizationForm } from '@/components/product/PersonalizationForm';
import { ProductCard } from '@/components/product/ProductCard';
import { AddonType } from '@/lib/types/api';
import IssueReportModal from '@/components/shared/IssueReportModal';

interface ProductClientPageProps {
  initialProduct?: Product;
}

export function ProductClientPage({ initialProduct }: ProductClientPageProps) {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [personalizationData, setPersonalizationData] = useState<any>(null);
  const [cardMessage, setCardMessage] = useState('');
  const [cardFont, setCardFont] = useState('Standard');
  const [showReportModal, setShowReportModal] = useState(false);

  // Fetch Product with staleTime: 5 min
  const { data: product, isLoading: isProductLoading, isError: isProductError } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/${id}`);
      return data;
    },
    initialData: initialProduct,
    staleTime: 5 * 60 * 1000,
  });

  // Analytics on load
  useEffect(() => {
    if (product) {
      trackEvent('product_view', { 
        product_id: product.id,
        category_id: product.category_id,
        seller_id: product.seller_id
      });
    }
  }, [product]);

  // Fetch Reviews - staleTime: 5 min
  const { data: reviewsData } = useQuery<{ data: Review[], ratings?: SellerRatings }>({
    queryKey: ['product-reviews', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/${id}/reviews`);
      return data;
    },
    enabled: !!product,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Related Products - staleTime: 5 min
  const { data: relatedProducts } = useQuery<Product[]>({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products?category_id=${product?.category_id}&limit=4`);
      return data.data;
    },
    enabled: !!product,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select first variant if available
  useEffect(() => {
    if (product?.variants?.length && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product, selectedVariant]);

  // Price Calculation
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    let total = Number(product.base_price);
    if (selectedVariant) total += Number(selectedVariant.price_modifier);
    
    selectedAddonIds.forEach(addonId => {
      const addon = product.addons.find(a => a.id === addonId);
      if (addon) total += Number(addon.price);
    });

    return total * quantity;
  }, [product, selectedVariant, selectedAddonIds, quantity]);

  // Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const body = {
        product_id: product?.id,
        variant_id: selectedVariant?.id,
        quantity,
        addon_ids: selectedAddonIds,
        personalization: personalizationData,
        card_metadata: cardMessage ? { message: cardMessage, font: cardFont } : undefined
      };
      return apiClient.post('/cart/items', body);
    },
    onSuccess: () => {
      toast.success("Added to cart 🌸");
      trackEvent('add_to_cart', { product_id: product?.id, quantity });
    },
    onError: (error: any) => {
      toast.apiError(error, "Failed to add to cart. Please try again.");
    }
  });

  const toggleAddon = (addon: ProductAddon) => {
    setSelectedAddonIds(prev => 
      prev.includes(addon.id) 
        ? prev.filter(id => id !== addon.id) 
        : [...prev, addon.id]
    );
  };

  const hasPersonalizationSelected = useMemo(() => {
    return selectedAddonIds.some(id => {
      const addon = product?.addons.find(a => a.id === id);
      return addon?.addon_type === AddonType.PERSONALIZATION;
    });
  }, [selectedAddonIds, product]);

  if (isProductLoading && !initialProduct) return <div className="container mx-auto px-4 py-32"><Skeleton className="h-96 w-full" /></div>;
  if ((isProductError || !product) && !isProductLoading) return <div className="text-center py-40">Product not found.</div>;

  if (!product) return null;

  const stockRemaining = product.inventory 
    ? (product.inventory.quantity_total - product.inventory.quantity_reserved) 
    : 0;

  return (
    <div className="bg-cream min-h-screen">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-32">
        
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-bark transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-bark transition-colors">Flowers & Gifts</Link>
          <span className="mx-2">/</span>
          <span className="text-bark font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Media */}
          <div className="lg:col-span-7 -mx-4 lg:mx-0">
            <ProductImageGallery images={product.images} />
            
            {/* Reviews Section (Desktop) */}
            <div className="hidden lg:block mt-24 space-y-12">
              <Separator />
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-3xl text-bark">Customer Reviews</h3>
                {reviewsData?.ratings && (
                  <div className="flex items-center gap-2">
                    <div className="flex text-rose">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("w-5 h-5 fill-current", i >= Math.round(Number(reviewsData.ratings?.average_rating || 0)) ? "opacity-30" : "")} />
                      ))}
                    </div>
                    <span className="font-bold text-lg">{reviewsData.ratings.average_rating}</span>
                    <span className="text-muted-foreground">({reviewsData.ratings.total_reviews} reviews)</span>
                  </div>
                )}
              </div>
              
              <div className="grid gap-8">
                {reviewsData?.data?.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-border">
                    <MessageSquare className="w-12 h-12 text-mist-dark mx-auto mb-4 opacity-50" />
                    <p className="text-bark/60 italic">No reviews yet. Be the first to share your experience!</p>
                  </div>
                ) : (
                  reviewsData?.data.map((review) => (
                    <div key={review.id} className="bg-white p-6 rounded-3xl shadow-sm border border-mist-dark/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-mist overflow-hidden relative">
                            {review.customer?.avatar_url && <Image src={review.customer.avatar_url} alt="Avatar" fill className="object-cover" />}
                          </div>
                          <div>
                            <p className="font-semibold text-bark text-sm">{review.customer?.full_name || "Customer"}</p>
                            <p className="text-[10px] text-muted-foreground">{formatDate(review.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex text-rose">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("w-3.5 h-3.5 fill-current", i >= review.rating ? "opacity-30" : "")} />
                          ))}
                        </div>
                      </div>
                      <p className="text-bark/80 text-sm leading-relaxed mb-4">{review.comment}</p>
                      {review.response && (
                        <div className="mt-4 p-4 bg-mist/30 rounded-2xl border-l-4 border-rose">
                          <p className="text-[10px] font-bold text-rose uppercase mb-1">Seller Response</p>
                          <p className="text-sm italic text-bark/70">"{review.response.response}"</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-rose/10 text-rose border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {product.is_featured ? 'Featured Collection' : 'Premium Selection'}
                </Badge>
                {stockRemaining <= 5 && stockRemaining > 0 && (
                   <span className="text-rose font-bold text-[10px] animate-pulse">ONLY {stockRemaining} LEFT!</span>
                )}
              </div>
              
              <h1 className="font-display font-bold text-4xl text-bark leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center justify-between">
                <Link href={`/sellers/${product.seller?.slug}`} className="flex items-center gap-2 group">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-rose/5 transition-colors">
                    <Store className="w-4 h-4 text-rose" />
                  </div>
                  <span className="text-sm font-medium text-bark group-hover:text-rose transition-colors">
                    Sold by <span className="underline underline-offset-4">{product.seller?.shop_name}</span>
                  </span>
                </Link>
                <div className="flex items-center gap-1.5 text-sm bg-white px-3 py-1.5 rounded-full shadow-sm border border-border">
                  <Star className="w-3.5 h-3.5 fill-rose text-rose" />
                  <span className="font-bold text-bark">4.8</span>
                </div>
              </div>

              <div className="flex justify-end">
                 <button 
                  onClick={() => setShowReportModal(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-bark/20 hover:text-rose transition-colors flex items-center gap-1.5"
                 >
                    <AlertTriangle className="w-3 h-3" /> Report a Concern
                 </button>
              </div>
            </div>

            <Separator className="bg-mist-dark/20" />

            <div className="space-y-2">
              <div className="flex items-end gap-3">
                <span className="text-4xl font-display font-bold text-rose-dark leading-none">
                  {formatPrice(totalPrice / quantity)}
                </span>
                {product.compare_at_price && (
                  <span className="text-lg text-muted-foreground line-through decoration-rose/40">
                    {formatPrice(Number(product.compare_at_price))}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                VAT included. Free Ashgabat delivery on orders above 200 TMT.
              </p>
            </div>

            {/* Selectors */}
            <VariantSelector 
              variants={product.variants} 
              selectedVariantId={selectedVariant?.id}
              onVariantSelect={setSelectedVariant}
            />

            <AddonSelector 
              addons={product.addons} 
              selectedAddonIds={selectedAddonIds}
              onToggleAddon={toggleAddon}
            />

            {/* Personalization Form Injection */}
            {hasPersonalizationSelected && (
              <PersonalizationForm onDataChange={setPersonalizationData} />
            )}

            {/* Greeting Card Message */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-bark uppercase tracking-wider">Greeting Card Message</h4>
              <textarea 
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value.substring(0, 200))}
                className="w-full bg-white border-2 border-mist-dark/20 rounded-2xl p-4 text-sm focus:border-rose focus:ring-0 transition-all resize-none h-24"
                placeholder="Include a heartfelt message... (Optional)"
              />
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex gap-2">
                  {['Standard', 'Cursive', 'Classic'].map(font => (
                    <button 
                      key={font} 
                      onClick={() => setCardFont(font)}
                      className={cn("px-2 py-1 rounded transition-colors", cardFont === font ? "bg-rose text-white" : "bg-mist hover:bg-mist-dark/20")}
                    >
                      {font}
                    </button>
                  ))}
                </div>
                <span className={cn(cardMessage.length >= 200 ? "text-rose font-bold" : "text-muted-foreground")}>
                  {cardMessage.length}/200
                </span>
              </div>
            </div>

            {/* Seller Delivery Info */}
            <div className="bg-white rounded-3xl p-6 border border-mist-dark/30 space-y-4 shadow-soft">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-rose mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-bark">Delivery Schedule</p>
                  <p className="text-xs text-muted-foreground">
                    Seller delivers {formatWorkingHours(product.seller?.working_hours)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-rose mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-bark">Shipment Info</p>
                  <p className="text-xs text-muted-foreground">
                    Estimated arrival: Today between 16:00 – 21:00 (In Ashgabat)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-rose mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-bark">Freshness Guaranteed</p>
                  <p className="text-xs text-muted-foreground">
                    Shelf life: {product.shelf_life_hours || 48} hours in water.
                  </p>
                </div>
              </div>
            </div>

            {/* Sticky/Actions Row */}
            <div className="pt-4 flex flex-col gap-4 sticky bottom-0 lg:relative lg:bottom-0 bg-white/95 lg:bg-transparent backdrop-blur-xl border-t border-mist-dark/10 lg:border-none p-4 -mx-4 lg:p-0 lg:mx-0 z-40 lg:shadow-none shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-2xl border-2 border-mist-dark/30 h-14 p-1 shadow-sm">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-full flex items-center justify-center hover:bg-mist rounded-xl transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-bark">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(stockRemaining, q + 1))}
                    className="w-10 h-full flex items-center justify-center hover:bg-mist rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <Button 
                  onClick={() => addToCartMutation.mutate()}
                  disabled={addToCartMutation.isPending || stockRemaining === 0}
                  className="flex-1 h-14 rounded-2xl bg-rose hover:bg-rose-dark text-white font-bold text-lg shadow-lg group transition-all transform active:scale-95"
                >
                  {addToCartMutation.isPending ? 'Processing...' : (
                    <>
                      <ShoppingBag className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                      Add to Cart — {formatPrice(totalPrice)}
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-32 space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-4xl text-bark">You May Also Like</h2>
              <Link href="/products" className="text-rose font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                Browse Shop <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>

      <IssueReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        productId={product.id}
      />
    </div>
  );
}
