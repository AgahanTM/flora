"use client";

import { ProductVariant } from '@/lib/types/product';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId?: string;
  onVariantSelect: (variant: ProductVariant) => void;
  // In a real app, we'd check inventory per variant here
}

export function VariantSelector({ 
  variants, 
  selectedVariantId, 
  onVariantSelect 
}: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-bark uppercase tracking-wider">Select Size / Option</h4>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isActive = selectedVariantId === variant.id;
          const modifier = Number(variant.price_modifier);

          return (
            <button
              key={variant.id}
              onClick={() => onVariantSelect(variant)}
              className={cn(
                "px-5 py-3 rounded-xl border-2 transition-all text-sm font-medium",
                isActive 
                  ? "border-rose bg-rose/5 text-rose-dark ring-2 ring-rose/10" 
                  : "border-mist-dark/30 text-bark hover:border-rose/50 hover:bg-mist/30"
              )}
            >
              <div className="flex flex-col items-center">
                <span>{variant.name}</span>
                {modifier !== 0 && (
                  <span className="text-[10px] mt-1 opacity-70">
                    {modifier > 0 ? '+' : ''}{formatPrice(modifier)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
