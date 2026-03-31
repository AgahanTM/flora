"use client";

import { useQuery } from '@tanstack/react-query';
import { Banknote, CreditCard, Building, Info, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

import { apiClient } from '@/lib/api/client';
import { Seller, SellerBankDetails } from '@/lib/types/seller';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import { PaymentMethod } from '@/lib/types/api';

interface PaymentStepProps {
  sellerId: string;
  totalAmount: number;
  selectedMethod?: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  onNext: () => void;
}

export function PaymentStep({
  sellerId,
  totalAmount,
  selectedMethod,
  onSelectMethod,
  onNext
}: PaymentStepProps) {
  const { data: seller, isLoading: isLoadingSeller } = useQuery({
    queryKey: ['seller-bank', sellerId],
    queryFn: async () => {
      const response = await apiClient.get(`/sellers/${sellerId}`);
      // API returns bank_details in the profile response for authenticated users
      return response.data as Seller & { bank_details?: SellerBankDetails };
    },
    enabled: !!sellerId && selectedMethod === PaymentMethod.BANK_TRANSFER
  });

  const paymentMethods = [
    {
      id: PaymentMethod.CASH,
      title: 'Cash on Delivery',
      description: 'Pay when your flowers arrive',
      icon: <Banknote className="w-6 h-6" />,
    },
    {
      id: PaymentMethod.BANK_TRANSFER,
      title: 'Bank Transfer',
      description: 'Direct transfer to seller bank account',
      icon: <Building className="w-6 h-6" />,
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={cn(
                "relative flex items-center gap-6 p-8 rounded-[2.5rem] border-2 text-left transition-all group overflow-hidden",
                isSelected 
                  ? "border-rose bg-rose/5 ring-4 ring-rose/10" 
                  : "border-mist-dark/10 bg-white hover:border-rose/30 hover:bg-mist/10"
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl shrink-0 transition-all",
                isSelected ? "bg-rose text-white scale-110 shadow-lg" : "bg-mist text-bark/40 group-hover:bg-rose/10 group-hover:text-rose"
              )}>
                {method.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <span className={cn("text-xl font-bold block mb-1", isSelected ? "text-rose" : "text-bark")}>
                  {method.title}
                </span>
                <p className="text-sm text-muted-foreground mr-6">
                  {method.description}
                </p>
              </div>

              {isSelected && (
                <div className="absolute top-4 right-4 w-7 h-7 bg-rose rounded-full flex items-center justify-center animate-in zoom-in shadow-sm">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedMethod === PaymentMethod.BANK_TRANSFER && (
        <div className="bg-white rounded-[2.5rem] p-10 shadow-premium border border-mist-dark/10 space-y-8 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 text-rose">
            <div className="p-3 bg-rose/10 rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-2xl font-display font-bold text-bark leading-tight">Bank Transfer Details</h4>
              <p className="text-sm text-muted-foreground font-medium">Please transfer the exact amount to confirm your order.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-mist/30 p-6 rounded-3xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-bark/40">Amount to Send</span>
              <p className="text-2xl font-display font-bold text-rose">{formatPrice(totalAmount)}</p>
            </div>
            <div className="md:col-span-2 bg-mist/30 p-6 rounded-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-bark/40">Bank Name</span>
                {isLoadingSeller ? <div className="h-6 w-32 bg-mist-dark/10 animate-pulse rounded" /> : (
                  <p className="font-bold text-bark">{seller?.bank_details?.bank_name || 'HalkBank Turkmenistan'}</p>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-bark/40">Account Name</span>
                {isLoadingSeller ? <div className="h-6 w-32 bg-mist-dark/10 animate-pulse rounded" /> : (
                  <p className="font-bold text-bark uppercase tracking-tight">{seller?.bank_details?.account_holder_name || seller?.shop_name || 'Seller Shop Name'}</p>
                )}
              </div>
              <div className="sm:col-span-2 space-y-1 pt-2 border-t border-mist-dark/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-bark/40">Account Number</span>
                {isLoadingSeller ? <div className="h-6 w-48 bg-mist-dark/10 animate-pulse rounded" /> : (
                  <p className="font-display text-2xl font-bold tracking-[0.2em] text-bark select-all">{seller?.bank_details?.account_number || '2320 0000 0000 0000'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 bg-bark/5 rounded-2xl flex items-start gap-4 border border-bark/10">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Info className="w-5 h-5 text-bark/60" />
            </div>
            <div className="text-sm leading-relaxed text-muted-foreground font-medium">
              <p className="text-bark font-bold mb-1">Important Instructions:</p>
              1. Transfer the exact total shown above within <span className="text-rose font-bold">24 hours</span>.
              <br />
              2. Save your digital receipt or take a photo of the slip.
              <br />
              3. You'll need to upload the proof of payment on the order status page after placing the order.
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button 
          onClick={onNext} 
          disabled={!selectedMethod}
          className="h-16 px-12 rounded-2xl bg-bark text-white font-bold text-lg shadow-xl shadow-bark/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          Review Your Order
        </Button>
      </div>
    </div>
  );
}
