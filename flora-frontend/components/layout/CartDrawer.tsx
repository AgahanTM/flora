"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, X, Minus, Plus, Trash2, ArrowRight, Loader2, Info } from 'lucide-react';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { Cart, CartItem } from '@/lib/types/cart';
import { formatPrice } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch Cart
  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get('/cart');
      return data;
    },
    // Only fetch when drawer is open
    enabled: isOpen,
  });

  // Calculate totals locally since the API model doesn't return it directly in the type we defined, 
  // or we can calculate it from items
  const subtotal = cart?.items?.reduce((acc, item) => {
    // We assume item.product.base_price exists if populated
    const price = Number(item.product?.base_price || 0);
    return acc + (price * item.quantity);
  }, 0) || 0;

  // Update Quantity Mutation
  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      // Depending on API, it might be PUT /cart/items/:id or PUT /cart/items
      const { data } = await apiClient.put(`/cart/items/${itemId}`, { quantity });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error('Failed to update quantity');
    }
  });

  // Remove Item Mutation
  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.delete(`/cart/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart');
    },
    onError: () => {
      toast.error('Failed to remove item');
    }
  });

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const handleViewCart = () => {
    onClose();
    router.push('/cart');
  };

  const handleBrowseProducts = () => {
    onClose();
    router.push('/products');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l border-mist">
        <SheetHeader className="p-6 border-b border-border bg-cream">
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-rose" /> 
            Your Cart
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-rose" />
          </div>
        ) : !cart?.items?.length ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-mist rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-mist-dark text-opacity-50" />
            </div>
            <h3 className="font-display text-2xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-8 max-w-xs">
              Looks like you haven't added any beautiful blooms or gifts yet.
            </p>
            <Button onClick={handleBrowseProducts} className="w-full">
              Explore Our Collection
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto w-full p-6 space-y-6">
              {cart.items.map((item) => {
                const product = item.product;
                if (!product) return null; // Defensive check
                
                const primaryImage = product.images?.find(i => i.is_primary)?.image_url 
                                    || product.images?.[0]?.image_url;

                return (
                  <div key={item.id} className="flex gap-4 items-start">
                    <div className="w-24 h-24 relative rounded-lg overflow-hidden bg-mist shrink-0 border border-border">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col h-full py-1">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-medium text-bark leading-tight">{product.name}</h4>
                          {/* Future: display variant/addons info if present */}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatPrice(Number(product.base_price))} each
                          </p>
                        </div>
                        <button 
                          onClick={() => removeItem.mutate(item.id)}
                          disabled={removeItem.isPending}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          aria-label="Remove item"
                        >
                          {removeItem.isPending && removeItem.variables === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-4">
                        <div className="flex items-center gap-1 bg-mist rounded-full border border-border p-0.5">
                          <button
                            onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                            disabled={item.quantity <= 1 || updateQuantity.isPending}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white text-bark disabled:opacity-50 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                            disabled={updateQuantity.isPending}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white text-bark disabled:opacity-50 transition-colors"
                          >
                            {updateQuantity.isPending && updateQuantity.variables?.itemId === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="font-semibold text-bark">
                          {formatPrice(Number(product.base_price) * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 bg-cream border-t border-border mt-auto">
              <div className="flex justify-between items-center mb-6 font-display text-xl">
                <span className="font-medium text-bark">Subtotal</span>
                <span className="font-bold text-rose-dark">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4 text-center">
                Shipping and taxes calculated at checkout.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleCheckout} className="w-full h-14 text-base" size="lg">
                  Checkout Now
                </Button>
                <Button onClick={handleViewCart} variant="outline" className="w-full bg-white h-12">
                  View Full Cart
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
