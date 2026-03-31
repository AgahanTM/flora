"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, Clock, Info } from 'lucide-react';
import { useState, memo } from 'react';
import { toast } from '@/lib/utils/toast';

import { Product } from '@/lib/types/product';
import { formatPrice } from '@/lib/utils/format';
import { trackEvent } from '@/lib/api/analytics';
import { apiClient } from '@/lib/api/client';
import { useQueryClient } from '@tanstack/react-query';

interface ProductCardProps {
  product: Product;
  priorityImage?: boolean; // True for above the fold
}

export const ProductCard = memo(function ProductCard({ product, priorityImage = false }: ProductCardProps) {
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false); // Stub: should integrate with a wishlist store

  // Get primary image or fallback
  const primaryImage = product.images?.find((img: any) => img.is_primary)?.image_url 
                    || product.images?.[0]?.image_url 
                    || null;

  // Calculate stock
  const availableStock = product.inventory 
    ? product.inventory.quantity_total - product.inventory.quantity_reserved 
    : 0;
  const isLowStock = availableStock > 0 && availableStock <= 5;
  const isOutOfStock = availableStock <= 0;

  const handleProductClick = () => {
    trackEvent('product_view', { product_id: product.id, product_name: product.name });
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the product page
    e.stopPropagation();
    
    if (isOutOfStock) return;
    
    try {
      setIsAdding(true);
      await apiClient.post('/cart/items', {
        product_id: product.id,
        quantity: 1
      });
      toast.success("Added to cart 🌸");
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      trackEvent('add_to_cart', { product_id: product.id, quantity: 1 });
    } catch (error: any) {
      toast.apiError(error, "Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <Link 
      href={`/products/${product.id}`}
      onClick={handleProductClick}
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-card border border-transparent hover:border-mist-dark"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full bg-mist overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            priority={priorityImage}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-mist-dark/50">
            <ShoppingBag className="w-12 h-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.is_featured && (
            <span className="bg-bark text-cream text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
              Featured
            </span>
          )}
          {isLowStock && (
            <span className="bg-rose text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
              Only {availableStock} Left
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-mist-dark text-bark/60 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-bark hover:text-rose hover:bg-white transition-all shadow-sm"
          aria-label="Toggle wishlist"
        >
          <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-rose text-rose' : ''}`} />
        </button>

        {/* Hover Reveal Add to Cart Button */}
        <div 
          className={`absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 ease-out z-20 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
        >
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="w-full h-10 bg-bark text-white font-medium text-sm rounded-xl hover:bg-rose transition-colors flex items-center justify-center shadow-lg disabled:opacity-50 disabled:hover:bg-bark"
          >
            {isAdding ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
        
        {/* Gradient shadow for hover button visibility */}
        <div className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-300 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1 gap-2">
          {/* Title clamped to 2 lines */}
          <h3 className="font-medium text-bark text-base leading-tight line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Seller Info if available */}
        {product.seller?.store_name && (
          <p className="text-xs text-muted-foreground mt-1 mb-2 truncate">
            by <span className="underline decoration-mist-dark underline-offset-2">{product.seller.store_name}</span>
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center gap-2">
          <span className="font-semibold text-rose-dark text-lg">
            {formatPrice(Number(product.base_price))}
          </span>
          {product.compare_at_price && Number(product.compare_at_price) > Number(product.base_price) && (
            <span className="text-sm text-muted-foreground line-through decoration-mist-dark/50">
              {formatPrice(Number(product.compare_at_price))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});
