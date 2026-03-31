import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Occasion, OccasionSuggestion } from '../types/occasion';

interface GiftBuilderState {
  step: number;
  selectedOccasion: Occasion | null;
  budget: number;
  selectedSuggestion: OccasionSuggestion | null;
  recipientName: string;
  personalMessage: string;
  selectedProductIds: string[];
  selectedAddonIds: string[];
  lastUpdated: number;

  // Actions
  setStep: (step: number) => void;
  setOccasion: (occasion: Occasion) => void;
  setBudget: (budget: number) => void;
  selectSuggestion: (suggestion: OccasionSuggestion) => void;
  setPersonalization: (name: string, message: string) => void;
  setProductsAndAddons: (productIds: string[], addonIds: string[]) => void;
  reset: () => void;
}

const STORAGE_KEY = 'flora-gift-builder-storage';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useGiftBuilderStore = create<GiftBuilderState>()(
  persist(
    (set) => ({
      step: 1,
      selectedOccasion: null,
      budget: 300,
      selectedSuggestion: null,
      recipientName: '',
      personalMessage: '',
      selectedProductIds: [],
      selectedAddonIds: [],
      lastUpdated: Date.now(),

      setStep: (step) => set({ step, lastUpdated: Date.now() }),
      
      setOccasion: (occasion) => set({ 
        selectedOccasion: occasion, 
        step: 2, 
        lastUpdated: Date.now() 
      }),

      setBudget: (budget) => set({ 
        budget, 
        lastUpdated: Date.now() 
      }),

      selectSuggestion: (suggestion) => set({ 
        selectedSuggestion: suggestion, 
        personalMessage: suggestion.suggested_message || '',
        step: 4,
        lastUpdated: Date.now() 
      }),

      setPersonalization: (name, message) => set({ 
        recipientName: name, 
        personalMessage: message, 
        lastUpdated: Date.now() 
      }),

      setProductsAndAddons: (productIds, addonIds) => set({
        selectedProductIds: productIds,
        selectedAddonIds: addonIds,
        lastUpdated: Date.now()
      }),

      reset: () => set({
        step: 1,
        selectedOccasion: null,
        budget: 300,
        selectedSuggestion: null,
        recipientName: '',
        personalMessage: '',
        selectedProductIds: [],
        selectedAddonIds: [],
        lastUpdated: Date.now()
      }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const now = Date.now();
          if (now - state.lastUpdated > EXPIRY_MS) {
            state.reset();
          }
        }
      },
    }
  )
);
