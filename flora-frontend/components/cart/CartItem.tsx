"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/lib/utils/toast';

import { CartItem as CartItemType } from '@/lib/types/cart';
import { formatPrice } from '@/lib/utils/format';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface CartItemProps {
  item: CartItemType;
  onUpdate: () => void;
}

export function CartItem({ item, onUpdate }: CartItemProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const debouncedQuantity = useDebounce(quantity, 500);
  const isFirstRender = useRef(true);

  const product = item.product;
  const variant = product?.variants.find(v => v.id === item.variant_id);
  const primaryImage = product?.images.find(img => img.is_primary) || product?.images[0];

  const basePrice = parseFloat(product?.base_price || '0');
  const variantPriceModifier = parseFloat(variant?.price_modifier || '0');
  const unitPrice = basePrice + variantPriceModifier;
  const lineTotal = unitPrice * quantity;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debouncedQuantity === item.quantity) return;

    const syncQuantity = async () => {
      setIsUpdating(true);
      try {
        // Primary: PUT /cart/items
        await apiClient.put(`/cart/items/${item.id}`, { quantity: debouncedQuantity });
        onUpdate();
      } catch (error: any) {
        // Fallback: DELETE + POST (P4 fix)
        if (error.response?.status === 404 || error.response?.status === 405) {
          try {
            await apiClient.delete(`/cart/items/${item.id}`);
            await apiClient.post('/cart/items', {
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: debouncedQuantity
            });
            onUpdate();
          } catch (fallbackError) {
            toast.error('Failed to update quantity.');
            setQuantity(item.quantity); // Revert
          }
        } else {
          toast.error('Failed to update quantity.');
          setQuantity(item.quantity); // Revert
        }
      } finally {
        setIsUpdating(false);
      }
    };

    syncQuantity();
  }, [debouncedQuantity, item.id, item.product_id, item.variant_id, item.quantity, onUpdate]);

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await apiClient.delete(`/cart/items/${item.id}`);
      toast.success('Item removed from cart');
      onUpdate();
    } catch (error) {
      toast.error('Failed to remove item.');
      setIsUpdating(false);
    }
  };

  if (!product) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white rounded-3xl shadow-soft border border-mist-dark/10 group animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Link href={`/products/${product.id}`} className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-2xl overflow-hidden bg-mist/30 ring-1 ring-mist-dark/10 group-hover:ring-rose/30 transition-all">
        <Image 
          src={primaryImage?.image_url || '/placeholder-product.png'} 
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </Link>

      <div className="flex-1 space-y-2 text-center sm:text-left">
        <div className="space-y-1">
          <Link href={`/products/${product.id}`} className="text-lg font-bold text-bark hover:text-rose transition-colors line-clamp-1">
            {product.name}
          </Link>
          {variant && (
            <p className="text-sm text-muted-foreground font-medium">
              Variant: <span className="text-bark">{variant.name}</span>
            </p>
          )}
        </div>
        <p className="text-sm font-bold text-bark">
          {formatPrice(unitPrice)} <span className="text-xs font-normal text-muted-foreground ml-1">per unit</span>
        </p>
      </div>

      <div className="flex flex-col items-center sm:items-end gap-4">
        <div className="flex items-center bg-mist/50 rounded-2xl p-1 border border-mist-dark/10">
          <button 
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || isUpdating}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-bark hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <div className="w-12 text-center font-bold text-bark">
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-rose" /> : quantity}
          </div>

          <button 
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            disabled={isUpdating}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-bark hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-lg font-display font-bold text-bark">
            {formatPrice(lineTotal)}
          </p>
          <button 
            onClick={handleRemove}
            disabled={isUpdating}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
