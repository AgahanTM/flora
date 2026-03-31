"use client";

import { useGiftBuilderStore } from '@/lib/store/giftBuilderStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';

export function BudgetSlider() {
  const { budget, setBudget, setStep } = useGiftBuilderStore();

  const presets = [
    { label: 'Budget', value: 300 },
    { label: 'Standard', value: 500 },
    { label: 'Premium', value: 800 },
    { label: 'Luxury', value: 1500 },
  ];

  return (
    <div className="space-y-12 max-w-2xl mx-auto text-center">
      <div className="space-y-4">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-bark">Set your budget</h2>
        <p className="text-muted-foreground">We'll find the best options in your range.</p>
      </div>

      <div className="space-y-8">
        <div className="text-5xl font-display font-bold text-rose">
          {formatPrice(budget)}
        </div>

        <input
          type="range"
          min="50"
          max="2000"
          step="50"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full h-3 bg-mist rounded-lg appearance-none cursor-pointer accent-rose"
        />

        <div className="flex flex-wrap justify-center gap-3">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setBudget(preset.value)}
              className={cn(
                "px-6 py-3 rounded-2xl border-2 transition-all font-medium",
                budget === preset.value
                  ? "border-rose bg-rose/5 text-rose-dark shadow-soft"
                  : "border-mist-dark/30 text-bark hover:border-rose/30"
              )}
            >
              <p className="text-xs uppercase tracking-widest mb-1 opacity-70">{preset.label}</p>
              <p className="text-lg">{preset.value} TMT</p>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-8">
        <Button 
          onClick={() => setStep(3)}
          className="w-full md:w-auto h-14 px-12 rounded-full bg-rose text-white font-bold text-lg shadow-lg hover:bg-rose-dark transition-all"
        >
          Find Suggestions
        </Button>
      </div>
    </div>
  );
}
