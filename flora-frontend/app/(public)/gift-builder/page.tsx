"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Gift, Heart, Send, CheckCircle2 } from 'lucide-react';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { OccasionSuggestion } from '@/lib/types/occasion';
import { useGiftBuilderStore } from '@/lib/store/giftBuilderStore';
import { trackEvent } from '@/lib/api/analytics';
import { formatPrice } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { OccasionPicker } from '@/components/gift-builder/OccasionPicker';
import { BudgetSlider } from '@/components/gift-builder/BudgetSlider';
import { SuggestionCard } from '@/components/gift-builder/SuggestionCard';
import { PersonalizationForm } from '@/components/product/PersonalizationForm';

function GiftBuilderContent() {
  const router = useRouter();
  const { 
    step, setStep, 
    selectedOccasion, budget, 
    selectedSuggestion, reset,
    recipientName, personalMessage, setPersonalization,
  } = useGiftBuilderStore();

  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for hydration to avoid mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch Suggestions
  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery<OccasionSuggestion[]>({
    queryKey: ['suggestions', selectedOccasion?.id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/occasions/suggestions?occasionId=${selectedOccasion?.id}`);
      return data;
    },
    enabled: !!selectedOccasion,
  });

  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return [];
    return suggestions.filter(s => {
      const min = Number(s.min_budget || 0);
      const max = Number(s.max_budget || 9999);
      return budget >= min && budget <= max;
    });
  }, [suggestions, budget]);

  // Track Step 1 entry
  useEffect(() => {
    if (isHydrated && step === 1) {
      trackEvent('gift_builder_started', { occasion_id: selectedOccasion?.id });
    }
  }, [isHydrated, step === 1, selectedOccasion?.id]);

  // Bulk Add to Cart Mutation
  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSuggestion) return;
      
      const productIds = JSON.parse(selectedSuggestion.product_ids || '[]');
      const addonIds = JSON.parse(selectedSuggestion.addon_ids || '[]');
      
      const promises = productIds.map((pId: string) => 
        apiClient.post('/cart/items', {
          product_id: pId,
          quantity: 1,
          addon_ids: addonIds,
          personalization_metadata: selectedSuggestion.personalization_type_id ? {
            recipient_name: recipientName,
            message: personalMessage,
          } : undefined
        })
      );

      return Promise.all(promises);
    },
    onSuccess: () => {
      trackEvent('gift_builder_converted_to_order', { 
        suggestion_id: selectedSuggestion?.id,
        occasion: selectedOccasion?.name,
        budget: budget
      });
      toast.success("Gift package added to your cart!");
      reset();
      router.push('/cart');
    },
    onError: () => {
      toast.error("Failed to add package to cart. Please try again.");
    }
  });

  if (!isHydrated) return null;

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(Math.max(1, step - 1));

  return (
    <div className="min-h-screen bg-cream pt-24 pb-32 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        
        {/* Progress Header */}
        <div className="mb-12 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-bark/60">
            <span>Step {step} of {totalSteps}: {
              step === 1 ? 'Occasion' : 
              step === 2 ? 'Budget' : 
              step === 3 ? 'Package' : 
              step === 4 ? 'Personalize' : 'Confirm'
            }</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-mist border border-mist-dark/20" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="min-h-[500px]"
          >
            {/* Step 1: Occasion */}
            {step === 1 && <OccasionPicker />}

            {/* Step 2: Budget */}
            {step === 2 && <BudgetSlider />}

            {/* Step 3: Choose Package */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="text-center space-y-4 mb-8">
                  <h2 className="font-display font-bold text-3xl md:text-4xl text-bark">Curated for {selectedOccasion?.name}</h2>
                  <p className="text-muted-foreground">Tailored to your budget of {formatPrice(budget)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSuggestions.map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                  {filteredSuggestions.length === 0 && !isLoadingSuggestions && (
                    <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-mist-dark/30 text-center space-y-4">
                      <div className="text-4xl">🔎</div>
                      <p className="text-bark font-medium">No packages found for this exact budget.</p>
                      <Button variant="ghost" onClick={() => setStep(2)} className="text-rose">Try a different budget</Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-mist/50">
                  <Button variant="ghost" onClick={handleBack} className="rounded-full px-8">Back</Button>
                  <Button 
                    disabled={!selectedSuggestion} 
                    onClick={handleNext}
                    className="rounded-full px-12 bg-rose"
                  >
                    Personalize <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Personalize */}
            {step === 4 && (
              <div className="max-w-2xl mx-auto space-y-8">
                 <div className="text-center space-y-4 mb-8">
                  <h2 className="font-display font-bold text-3xl md:text-4xl text-bark">Make it Personal</h2>
                  <p className="text-muted-foreground">Add those finishing touches that show you care.</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-mist-dark/20 space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-bold uppercase tracking-widest text-bark/60">Recipient Name</label>
                    <input 
                      type="text"
                      value={recipientName}
                      onChange={(e) => setPersonalization(e.target.value, personalMessage)}
                      placeholder="Who is this for?"
                      className="w-full h-14 bg-mist/30 border-2 border-transparent focus:border-rose/30 rounded-2xl px-6 text-bark outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold uppercase tracking-widest text-bark/60">Greeting Message</label>
                    <textarea 
                      value={personalMessage}
                      onChange={(e) => setPersonalization(recipientName, e.target.value)}
                      placeholder="Add a heartfelt note..."
                      className="w-full h-32 bg-mist/30 border-2 border-transparent focus:border-rose/30 rounded-2xl p-6 text-bark outline-none transition-all resize-none"
                    />
                  </div>

                  {selectedSuggestion?.personalization_type_id && (
                    <div className="pt-4">
                      <PersonalizationForm onDataChange={() => {}} />
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <Button variant="ghost" onClick={handleBack} className="rounded-full px-8">Back</Button>
                  <Button 
                    disabled={!recipientName}
                    onClick={handleNext}
                    className="rounded-full px-12 bg-rose"
                  >
                    Review Package <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Summary */}
            {step === 5 && (
              <div className="max-w-xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-rose/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-10 h-10 text-rose" />
                  </div>
                  <h2 className="font-display font-bold text-4xl text-bark">Confirm Your Gift</h2>
                  <p className="text-muted-foreground">Ready to send some love to {recipientName}?</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-mist-dark/20 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Gift className="w-32 h-32 text-rose" />
                  </div>
                  
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-rose tracking-[0.2em] mb-1">{selectedOccasion?.name}</p>
                        <h3 className="text-2xl font-display font-bold text-bark">{selectedSuggestion?.title}</h3>
                      </div>
                      <div className="text-2xl font-bold text-rose">{formatPrice(budget)}</div>
                    </div>

                    <Separator className="bg-mist-dark/20" />

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Send className="w-4 h-4 text-mist-dark" />
                        <span className="text-sm font-medium text-bark">To: {recipientName}</span>
                      </div>
                      <div className="bg-mist/30 p-4 rounded-2xl italic text-sm text-bark/80 leading-relaxed">
                        "{personalMessage}"
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Same-day delivery available</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Button 
                    onClick={() => convertMutation.mutate()}
                    loading={convertMutation.isPending}
                    className="h-16 rounded-full bg-rose text-white font-bold text-xl shadow-lg hover:bg-rose-dark transition-all scale-100 hover:scale-[1.02] active:scale-95"
                  >
                    Add Package to Cart
                  </Button>
                  <Button variant="ghost" onClick={handleBack} className="text-muted-foreground">Go back and edit</Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function GiftBuilderPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-32 text-center animate-pulse">Loading Gift Builder...</div>}>
      <GiftBuilderContent />
    </Suspense>
  );
}
