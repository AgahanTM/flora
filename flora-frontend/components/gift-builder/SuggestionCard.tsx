"use client";

import { OccasionSuggestion } from '@/lib/types/occasion';
import { useGiftBuilderStore } from '@/lib/store/giftBuilderStore';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { Sparkles, PackageCheck } from 'lucide-react';

interface SuggestionCardProps {
  suggestion: OccasionSuggestion;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const { selectSuggestion, selectedSuggestion, budget } = useGiftBuilderStore();
  const isSelected = selectedSuggestion?.id === suggestion.id;

  const min = Number(suggestion.min_budget || 0);
  const max = Number(suggestion.max_budget || 9999);
  const isOutOfRange = budget < min || budget > max;

  // We don't have a specific image in the suggestion type, but let's assume a fallback or 
  // maybe the first product image if we were fetching it. For now, a styled placeholder.
  
  return (
    <button
      onClick={() => selectSuggestion(suggestion)}
      disabled={isOutOfRange}
      className={cn(
        "relative flex flex-col items-start text-left bg-white rounded-3xl p-6 border-2 transition-all overflow-hidden",
        isSelected 
          ? "border-rose shadow-soft bg-rose/5 ring-1 ring-rose" 
          : isOutOfRange 
            ? "border-mist opacity-40 grayscale cursor-not-allowed"
            : "border-mist-dark/20 hover:border-rose/50 shadow-sm"
      )}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 bg-rose text-white p-1 rounded-full">
          <PackageCheck className="w-4 h-4" />
        </div>
      )}

      {suggestion.personalization_type_id && (
        <div className="absolute top-4 left-4">
          <span className="bg-mist-dark/20 text-bark px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-tight flex items-center gap-1">
            <Sparkles className="w-2 h-2" /> Personalizable
          </span>
        </div>
      )}

      <div className="w-full aspect-video rounded-2xl bg-mist flex items-center justify-center mb-6">
         {/* Placeholder for Package illustration */}
         <div className="text-3xl">🎁</div>
      </div>

      <div className="space-y-2 w-full">
        <h3 className="font-display font-bold text-xl text-bark">{suggestion.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {suggestion.description || "A curated selection perfect for this occasion."}
        </p>
        
        <div className="pt-4 flex items-center justify-between border-t border-mist/50">
          <div className="text-sm font-bold text-rose">
            Approx. {suggestion.min_budget} - {suggestion.max_budget} TMT
          </div>
          {isOutOfRange && (
            <span className="text-[10px] text-rose-dark font-medium italic">Adjust budget</span>
          )}
        </div>
      </div>
    </button>
  );
}
