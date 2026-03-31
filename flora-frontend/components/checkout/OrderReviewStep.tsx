"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ShoppingBag, MapPin, Calendar, Clock, CreditCard, ChevronRight, Loader2, AlertCircle, Sparkles, ReceiptText } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { trackEvent } from '@/lib/api/analytics';
import { Cart } from '@/lib/types/cart';
import { Address } from '@/lib/types/auth';
import { PaymentMethod } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface OrderReviewStepProps {
  addressId?: string;
  date?: string;
  slotId?: string;
  paymentMethod?: PaymentMethod;
  specialInstructions?: string;
  giftMessage?: string;
}

export function OrderReviewStep({
  addressId,
  date,
  slotId,
  paymentMethod,
  specialInstructions,
  giftMessage
}: OrderReviewStepProps) {
  const router = useRouter();
  const [errorItems, setErrorItems] = useState<string[]>([]);

  const { data: address } = useQuery({
    queryKey: ['address', addressId],
    queryFn: async () => {
      const response = await apiClient.get('/addresses');
      return response.data.find((a: any) => a.id === addressId) as Address;
    },
    enabled: !!addressId
  });

  const { data: cartResponse } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await apiClient.get('/cart');
      return response.data as Cart & { subtotal?: number; total?: number; discount_total?: number; promotion_id?: string; delivery_fee?: number };
    },
  });

  const cart = cartResponse;
  const items = cart?.items || [];
  
  // Calculate slot price modifier if any
  const { data: slots } = useQuery({
    queryKey: ['delivery-slots', items[0]?.product?.seller_id, date],
    queryFn: async () => {
      const response = await apiClient.get(`/delivery/slots?seller_id=${items[0]?.product?.seller_id}&date=${date}`);
      return response.data as any[];
    },
    enabled: !!items[0]?.product?.seller_id && !!date
  });

  const selectedSlot = slots?.find(s => s.id === slotId);
  const slotModifier = parseFloat(selectedSlot?.price_modifier || '0');

  const subtotal = cart?.subtotal ?? 0;
  const discount = cart?.discount_total ?? 0;
  const deliveryFee = cart?.delivery_fee ?? 0;
  const finalTotal = subtotal + deliveryFee + slotModifier - discount;

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        seller_id: items[0]?.product?.seller_id,
        delivery_address_id: address?.id,
        delivery_date: date,
        delivery_slot_id: slotId,
        payment_method: paymentMethod,
        recipient_name: address?.label, // Simplification or add a field if needed
        recipient_phone: 'N/A', // Should probably capture this or use profile
        gift_message: giftMessage,
        special_instructions: specialInstructions,
        promotion_id: cart?.promotion_id
      };
      
      const response = await apiClient.post('/orders', payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Analytics
      trackEvent('order_placed', { 
        order_id: data.id, 
        total: finalTotal, 
        payment_method: paymentMethod 
      });

      toast.success('Order placed successfully! 🌸');
      router.push(`/orders/${data.id}?new=true`);
    },
    onError: (error: any) => {
      if (error.response?.data?.error === 'ErrInventoryShortage') {
        const outOfStock = error.response.data.product_ids || [];
        setErrorItems(outOfStock);
        toast.error('Some items in your cart are no longer available. 🥀');
      } else {
        toast.apiError(error, 'Failed to place order. Please try again.');
      }
    }
  });

  const SummaryItem = ({ label, value, icon, onClick }: { label: string, value: string, icon: any, onClick?: () => void }) => (
    <div className="flex items-start gap-4 p-6 bg-mist/20 rounded-3xl border border-mist-dark/10 group hover:border-rose/30 transition-all">
      <div className="p-3 bg-white rounded-2xl shadow-sm text-bark/40 group-hover:text-rose transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-bark/30 block mb-1">{label}</span>
        <p className="font-bold text-bark leading-snug">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryItem 
          label="Delivery Address" 
          value={address ? `${address.street}, ${address.building}` : 'Not selected'} 
          icon={<MapPin className="w-5 h-5" />} 
        />
        <SummaryItem 
          label="Delivery Date" 
          value={date ? format(new Date(date), 'MMMM d, yyyy') : 'Not selected'} 
          icon={<Calendar className="w-5 h-5" />} 
        />
        <SummaryItem 
          label="Time Slot" 
          value={selectedSlot ? `${selectedSlot.start_time.slice(0, 5)} - ${selectedSlot.end_time.slice(0, 5)}` : 'Not selected'} 
          icon={<Clock className="w-5 h-5" />} 
        />
        <SummaryItem 
          label="Payment Method" 
          value={paymentMethod === PaymentMethod.BANK_TRANSFER ? 'Bank Transfer' : 'Cash on Delivery'} 
          icon={<CreditCard className="w-5 h-5" />} 
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items Summary */}
        <div className="flex-1 bg-white rounded-[2.5rem] p-10 border border-mist-dark/10 shadow-soft">
          <h3 className="text-2xl font-display font-bold text-bark mb-8 flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-rose" />
            Items Review
          </h3>
          <div className="space-y-6">
            {items.map((item) => {
              const isError = errorItems.includes(item.product_id);
              return (
                <div key={item.id} className={cn(
                  "flex items-center gap-4 transition-all pb-6 border-b border-mist-dark/10 last:border-0",
                  isError ? "opacity-50 grayscale" : ""
                )}>
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-mist shrink-0 border border-mist-dark/10 relative">
                    <Image src={item.product?.images.find(i => i.is_primary)?.image_url || item.product?.images[0]?.image_url || ''} alt={item.product?.name || 'Product'} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-bark truncate">{item.product?.name}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity} × {formatPrice(parseFloat(item.product?.base_price || '0'))}</p>
                  </div>
                  {isError && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-rose bg-rose/5 px-2.5 py-1 rounded-full uppercase">
                      <AlertCircle className="w-3 h-3" />
                      Sold Out
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {(specialInstructions || giftMessage) && (
            <div className="mt-8 pt-8 border-t border-mist-dark/10 space-y-6">
              {specialInstructions && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Instructions</span>
                  <p className="text-sm text-bark italic font-medium">"{specialInstructions}"</p>
                </div>
              )}
              {giftMessage && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Gift Message</span>
                  <p className="text-sm text-rose italic font-medium">"{giftMessage}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="w-full lg:w-[400px] bg-bark text-white rounded-[2.5rem] p-10 shadow-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-rose/30 transition-all duration-700" />
          <div className="relative z-10 space-y-6">
            <h3 className="text-2xl font-display font-bold mb-8 flex items-center gap-3">
              <ReceiptText className="w-6 h-6 text-rose" />
              Final Payment
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-white/60 font-medium">
                <span>Subtotal</span>
                <span className="text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-white/60 font-medium">
                <span>Delivery</span>
                <span className="text-white">{formatPrice(deliveryFee)}</span>
              </div>
              {slotModifier > 0 && (
                <div className="flex justify-between text-rose font-bold">
                  <span>Premium Slot</span>
                  <span>+{formatPrice(slotModifier)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-green-400 font-bold">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="h-px bg-white/10 my-6" />
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold">Grand Total</span>
                <span className="text-4xl font-display font-bold text-rose">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <Button 
              onClick={() => placeOrderMutation.mutate()}
              disabled={placeOrderMutation.isPending || items.length === 0 || errorItems.length > 0}
              className="w-full h-16 rounded-2xl bg-rose hover:bg-rose/90 text-white font-black text-lg shadow-xl shadow-rose/20 mt-8 transition-all active:scale-[0.98]"
            >
              {placeOrderMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  Place Order Now <ChevronRight className="w-5 h-5" />
                </span>
              )}
            </Button>
            <p className="text-[10px] text-center text-white/40 font-medium uppercase tracking-widest mt-6">
              By placing this order you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
