"use client";

import { Check } from 'lucide-react';
import { ProductAddon } from '@/lib/types/product';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { AddonType } from '@/lib/types/api';

interface AddonSelectorProps {
  addons: ProductAddon[];
  selectedAddonIds: string[];
  onToggleAddon: (addon: ProductAddon) => void;
}

export function AddonSelector({ 
  addons, 
  selectedAddonIds, 
  onToggleAddon 
}: AddonSelectorProps) {
  if (!addons || addons.length === 0) return null;

  // Group by type
  const groupedAddons: Record<string, ProductAddon[]> = addons.reduce((acc, addon) => {
    const type = addon.addon_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(addon);
    return acc;
  }, {} as Record<string, ProductAddon[]>);

  const typeLabels: Record<string, string> = {
    [AddonType.GIFT]: "Enhance Your Gift",
    [AddonType.GREETING_CARD]: "Add a Card",
    [AddonType.PERSONALIZATION]: "Personalization Services",
    [AddonType.CHOCOLATE]: "Sweet Additions",
    [AddonType.BALLOON]: "Balloons & Party",
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedAddons).map(([type, items]) => (
        <div key={type} className="space-y-4">
          <h4 className="text-sm font-semibold text-bark uppercase tracking-wider">
            {typeLabels[type] || type}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((addon) => {
              const isSelected = selectedAddonIds.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  onClick={() => onToggleAddon(addon)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                    isSelected 
                      ? "border-rose bg-rose/5 ring-1 ring-rose shadow-soft" 
                      : "border-mist-dark/20 bg-white hover:border-rose/30"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors",
                    isSelected ? "bg-rose border-rose text-white" : "border-mist-dark/30 bg-white"
                  )}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-bark truncate">{addon.name}</p>
                    <p className="text-xs text-muted-foreground">+{formatPrice(Number(addon.price))}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
