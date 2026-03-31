"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { Category } from '@/lib/types/product';
import { Button } from '@/components/ui/button';
import { Occasion } from '@/lib/types/occasion';

interface ProductFiltersProps {
  onMobileClose?: () => void;
  // We can track total results here to show in mobile sheet header if needed
}

export function ProductFilters({ onMobileClose }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const currentCategory = searchParams.get('category') || '';
  const currentOccasion = searchParams.get('occasion') || '';
  const currentMinPrice = searchParams.get('price_min') || '';
  const currentMaxPrice = searchParams.get('price_max') || '';

  // Local state for price inputs to prevent constant URL updating while typing
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
  const [expandedCategories, setExpandedCategories] = useState(true);

  // Sync local price state if URL changes externally
  useEffect(() => {
    setMinPrice(currentMinPrice);
    setMaxPrice(currentMaxPrice);
  }, [currentMinPrice, currentMaxPrice]);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/categories');
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 60 * 60 * 1000,
  });

  // Fetch occasions for the filter
  const { data: occasions } = useQuery<Occasion[]>({
    queryKey: ['occasions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/occasions');
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 60 * 60 * 1000,
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('occasion');
    params.delete('price_min');
    params.delete('price_max');
    // keep 'q' and 'sort' if applicable
    router.push(`?${params.toString()}`, { scroll: false });
    if (onMobileClose) onMobileClose();
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('price_min', minPrice);
    else params.delete('price_min');
    
    if (maxPrice) params.set('price_max', maxPrice);
    else params.delete('price_max');
    
    router.push(`?${params.toString()}`, { scroll: false });
    if (onMobileClose) onMobileClose();
  };

  const activeFiltersCount = [currentCategory, currentOccasion, currentMinPrice, currentMaxPrice].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      
      {/* Header / Clear All */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h3 className="font-semibold text-bark flex items-center gap-2 text-lg">
          <SlidersHorizontal className="w-5 h-5" /> Filters
          {activeFiltersCount > 0 && (
            <span className="bg-rose text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <button 
            onClick={clearAll}
            className="text-sm text-rose font-medium hover:text-rose-dark transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="pb-6 border-b border-border">
        <button 
          onClick={() => setExpandedCategories(!expandedCategories)}
          className="flex items-center justify-between w-full font-medium text-bark mb-4"
        >
          Categories
          <ChevronDown className={`w-5 h-5 transition-transform ${expandedCategories ? 'rotate-180' : ''}`} />
        </button>
        
        {expandedCategories && (
          <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="category" 
                className="w-4 h-4 text-rose accent-rose focus:ring-rose/20 cursor-pointer" 
                checked={!currentCategory}
                onChange={() => updateParam('category', '')}
              />
              <span className={`text-sm group-hover:text-rose transition-colors ${!currentCategory ? 'text-rose font-medium' : 'text-bark/80'}`}>
                All Flowers & Gifts
              </span>
            </label>
            {categories?.map((cat) => (
              <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="category" 
                  className="w-4 h-4 text-rose accent-rose focus:ring-rose/20 cursor-pointer" 
                  checked={currentCategory === cat.slug}
                  onChange={() => updateParam('category', cat.slug)}
                />
                <span className={`text-sm group-hover:text-rose transition-colors ${currentCategory === cat.slug ? 'text-rose font-medium' : 'text-bark/80'}`}>
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Occasions */}
      <div className="pb-6 border-b border-border">
        <h4 className="font-medium text-bark mb-4">Occasion</h4>
        <select 
          value={currentOccasion}
          onChange={(e) => updateParam('occasion', e.target.value)}
          className="w-full bg-mist/50 border-none rounded-xl h-12 px-4 text-sm text-bark focus:ring-2 focus:ring-rose/20 cursor-pointer appearance-none outline-none"
        >
          <option value="">Any Occasion</option>
          {occasions?.map((occ) => (
            <option key={occ.id} value={occ.slug}>{occ.name}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="pb-6">
        <h4 className="font-medium text-bark mb-4">Price Range (TMT)</h4>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₼</span>
            <input 
              type="number" 
              placeholder="Min" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full bg-mist/50 border-none rounded-xl h-11 pl-7 pr-3 text-sm text-bark focus:ring-2 focus:ring-rose/20 outline-none"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₼</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-mist/50 border-none rounded-xl h-11 pl-7 pr-3 text-sm text-bark focus:ring-2 focus:ring-rose/20 outline-none"
            />
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={applyPriceFilter}
          className="w-full h-11 border-border text-bark hover:bg-mist transition-colors rounded-xl"
        >
          Apply Price
        </Button>
      </div>

    </div>
  );
}
