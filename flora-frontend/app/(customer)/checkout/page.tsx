"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, Loader2, Lock, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

import { apiClient } from '@/lib/api/client';
import { Cart } from '@/lib/types/cart';
import { PaymentMethod } from '@/lib/types/api';
import { AddressStep } from '@/components/checkout/AddressStep';
import { DeliverySlotStep } from '@/components/checkout/DeliverySlotStep';
import { PaymentStep } from '@/components/checkout/PaymentStep';
import { OrderReviewStep } from '@/components/checkout/OrderReviewStep';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

enum CheckoutStep {
  ADDRESS = 0,
  DELIVERY = 1,
  PAYMENT = 2,
  REVIEW = 3,
}

export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.ADDRESS);
  const [selection, setSelection] = useState<{
    addressId?: string;
    date?: string;
    slotId?: string;
    paymentMethod?: PaymentMethod;
    specialInstructions?: string;
    giftMessage?: string;
  }>({});

  const { data: cartResponse, isLoading: isLoadingCart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await apiClient.get('/cart');
      return response.data as Cart & { total?: number };
    },
  });

  const cart = cartResponse;
  const items = cart?.items || [];

  // Redirect if cart is empty after loading
  useEffect(() => {
    if (!isLoadingCart && items.length === 0) {
      router.push('/cart');
    }
  }, [items, isLoadingCart, router]);

  const steps = [
    { id: CheckoutStep.ADDRESS, title: 'Delivery Address' },
    { id: CheckoutStep.DELIVERY, title: 'Schedule Delivery' },
    { id: CheckoutStep.PAYMENT, title: 'Payment Method' },
    { id: CheckoutStep.REVIEW, title: 'Final Review' },
  ];

  const updateSelection = (updates: Partial<typeof selection>) => {
    setSelection(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < CheckoutStep.REVIEW) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > CheckoutStep.ADDRESS) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  if (isLoadingCart || items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream/30">
        <Loader2 className="w-12 h-12 text-rose animate-spin mb-4" />
        <p className="text-bark font-bold text-lg">Preparing your checkout...</p>
      </div>
    );
  }

  const sellerId = items[0]?.product?.seller_id;
  const totalAmount = cart?.total || 0;

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      {/* Checkout Navbar */}
      <div className="bg-white border-b border-mist-dark/10 py-6 sticky top-0 z-30 shadow-soft backdrop-blur-md bg-white/90">
        <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
          <Link href="/cart" className="flex items-center gap-2 text-bark hover:text-rose transition-colors font-bold group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Cart</span>
          </Link>

          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-green-600" />
            <span className="text-xs font-black uppercase tracking-widest text-green-600">Secure Checkout</span>
          </div>

          <div className="hidden md:flex flex-1 items-center justify-center max-w-2xl px-12">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2 relative">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500",
                    currentStep === step.id ? "bg-rose text-white scale-110 shadow-lg" : 
                    currentStep > step.id ? "bg-green-600 text-white" : "bg-mist text-bark/30"
                  )}>
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span className={cn(
                    "absolute -bottom-6 text-[10px] font-black uppercase tracking-tighter whitespace-nowrap transition-colors duration-500",
                    currentStep === step.id ? "text-rose" : "text-bark/30"
                  )}>
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-[3px] mx-4 rounded-full transition-all duration-1000",
                    currentStep > step.id ? "bg-green-600" : "bg-mist"
                  )} />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black uppercase text-bark/30 leading-none mb-1">Total</p>
                <p className="text-lg font-display font-bold text-rose leading-none">{formatPrice(totalAmount)}</p>
             </div>
             <div className="p-3 bg-mist rounded-2xl relative">
                <ShoppingCart className="w-5 h-5 text-bark/60" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-bark text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {items.length}
                </span>
             </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl pt-16">
        <div className="mb-12 md:hidden flex justify-center">
            <div className="flex items-center gap-4">
               <span className="text-xs font-black uppercase tracking-widest text-bark/40">Step {currentStep + 1} of 4</span>
               <h2 className="text-lg font-bold text-bark">{steps[currentStep].title}</h2>
            </div>
        </div>

        <section className="bg-white/50 rounded-[3rem] p-4 sm:p-2 min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {currentStep === CheckoutStep.ADDRESS && (
                <AddressStep 
                  selectedAddressId={selection.addressId}
                  onSelect={(id) => updateSelection({ addressId: id })}
                  onNext={nextStep}
                />
              )}

              {currentStep === CheckoutStep.DELIVERY && (
                <DeliverySlotStep 
                  sellerId={sellerId || ''}
                  selectedDate={selection.date}
                  selectedSlotId={selection.slotId}
                  specialInstructions={selection.specialInstructions}
                  giftMessage={selection.giftMessage}
                  onSelectDate={(date) => updateSelection({ date })}
                  onSelectSlot={(slotId) => updateSelection({ slotId })}
                  onSetInstructions={(val) => updateSelection({ specialInstructions: val })}
                  onSetGiftMessage={(val) => updateSelection({ giftMessage: val })}
                  onNext={nextStep}
                />
              )}

              {currentStep === CheckoutStep.PAYMENT && (
                <PaymentStep 
                  sellerId={sellerId || ''}
                  totalAmount={totalAmount}
                  selectedMethod={selection.paymentMethod}
                  onSelectMethod={(method) => updateSelection({ paymentMethod: method })}
                  onNext={nextStep}
                />
              )}

              {currentStep === CheckoutStep.REVIEW && (
                <OrderReviewStep 
                  addressId={selection.addressId}
                  date={selection.date}
                  slotId={selection.slotId}
                  paymentMethod={selection.paymentMethod}
                  specialInstructions={selection.specialInstructions}
                  giftMessage={selection.giftMessage}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {currentStep > 0 && (
          <div className="mt-8 flex justify-center">
             <button 
               onClick={prevStep}
               className="text-sm font-bold text-bark/40 hover:text-rose transition-colors flex items-center gap-2 uppercase tracking-widest"
             >
                <ArrowLeft className="w-4 h-4" />
                Wait, I need to change something
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
