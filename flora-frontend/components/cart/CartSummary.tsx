"use client";

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Tag, X, ArrowRight, Loader2, Info } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import Link from 'next/link';

import { formatPrice } from '@/lib/utils/format';
import { apiClient } from '@/lib/api/client';
import { trackEvent } from '@/lib/api/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string;
  onUpdate: () => void;
}

export function CartSummary({ subtotal, discount, total, promoCode, onUpdate }: CartSummaryProps) {
  const [code, setCode] = useState('');
  
  // Preview / Validate mutation
  const validateMutation = useMutation({
    mutationFn: async (promoCode: string) => {
      const response = await apiClient.get(`/promotions/validate?code=${promoCode}`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Code valid: ${data.description || 'Discount applied'} 🌸`);
      applyMutation.mutate({ 
        promoCode: code, 
        discountType: data.discount_type, 
        discountValue: data.discount_value 
      });
    },
    onError: (error: any) => {
      toast.apiError(error, 'Invalid promo code.');
    }
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async ({ promoCode, discountType, discountValue }: { promoCode: string, discountType?: string, discountValue?: number }) => {
      return await apiClient.post('/cart/promo', { code: promoCode });
    },
    onSuccess: (_, variables) => {
      trackEvent('coupon_applied', { 
        code: variables.promoCode,
        discount_type: variables.discountType,
        discount_value: variables.discountValue
      });
      onUpdate();
      setCode('');
    },
    onError: (error: any) => {
      toast.apiError(error, 'Failed to apply code.');
    }
  });

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.delete('/cart/promo');
    },
    onSuccess: () => {
      toast.success('Promo code removed 🌸');
      onUpdate();
    },
  });

  const deliveryFee = 0; // TBD at checkout per plan

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-mist-dark/10 sticky top-24">
        <h2 className="text-2xl font-display font-bold text-bark mb-6">Order Summary</h2>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between text-bark/60 font-medium">
            <span>Subtotal</span>
            <span className="text-bark">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-bark/60 font-medium">
            <span className="flex items-center gap-1.5">
              Delivery
              <Info className="w-3.5 h-3.5 opacity-40" />
            </span>
            <span className="text-bark italic text-sm">Calculated at checkout</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600 font-bold bg-green-50/50 p-2 rounded-xl -mx-2">
              <span>Discount</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="h-px bg-mist-dark/10 my-6" />
          <div className="flex justify-between items-end">
            <span className="text-lg font-bold text-bark">Total</span>
            <span className="text-3xl font-display font-bold text-rose">{formatPrice(total)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-bark/40 ml-1">Promo Code</label>
          
          {promoCode ? (
            <div className="flex items-center justify-between p-4 bg-rose/5 border border-rose/20 rounded-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-rose" />
                <span className="font-bold text-rose uppercase tracking-wider">{promoCode}</span>
              </div>
              <button 
                onClick={() => removeMutation.mutate()}
                className="p-1 hover:bg-rose/10 rounded-full transition-colors"
                disabled={removeMutation.isPending}
              >
                <X className="w-5 h-5 text-rose" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Enter code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="pl-14 h-14 bg-mist/30 border-none focus:ring-2 focus:ring-rose/30 transition-all rounded-2xl"
              />
              <button
                onClick={() => validateMutation.mutate(code)}
                disabled={!code || validateMutation.isPending}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-rose font-bold text-sm px-4 py-2 hover:bg-rose/5 rounded-xl disabled:opacity-50 transition-all"
              >
                {validateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </button>
            </div>
          )}
        </div>

        <Button 
          asChild
          className="w-full h-16 rounded-2xl bg-bark text-white font-bold text-lg shadow-xl mt-8 cursor-pointer hover:bg-bark/90 transition-all"
        >
          <Link href="/checkout">
            Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </Button>

        <div className="mt-6 text-center">
          <Link href="/products" className="text-sm text-muted-foreground hover:text-rose font-medium transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
