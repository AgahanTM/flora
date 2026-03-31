"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { trackEvent } from '@/lib/api/analytics';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { formatPrice } from '@/lib/utils/format';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AutocompleteResult {
  id: string;
  name: string;
  price: string;
  image_url: string;
  category: string;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setQuery('');
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch autocomplete results
  const { data: results, isFetching } = useQuery<{ data: AutocompleteResult[] }>({
    queryKey: ['autocomplete', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return { data: [] };
      const res = await apiClient.get(`/products/autocomplete?q=${encodeURIComponent(debouncedQuery)}`);
      return res.data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      trackEvent('search_performed', { query: query.trim() });
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleResultClick = (id: string, name: string) => {
    trackEvent('search_performed', { query: name, selected_product_id: id });
    router.push(`/products/${id}`);
    onClose();
  };

  const hits = results?.data?.slice(0, 8) || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-bark/95 backdrop-blur-sm"
        >
          {/* Header area with close button */}
          <div className="flex justify-end p-6">
            <button
              onClick={onClose}
              className="text-mist hover:text-white transition-colors rounded-full p-2 hover:bg-white/10"
              aria-label="Close search"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          {/* Search Input Area */}
          <div className="flex-1 w-full max-w-4xl mx-auto px-6 pt-10 flex flex-col items-center">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for flowers, gifts, occasions..."
                className="w-full bg-transparent border-b-2 border-mist/30 text-white placeholder:text-mist/50 text-3xl md:text-5xl font-display py-4 focus:outline-none focus:border-rose transition-colors"
              />
              <button
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-mist hover:text-white transition-colors"
              >
                {isFetching ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Search className="w-8 h-8" />
                )}
              </button>
            </form>

            {/* Results Area */}
            {query.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-10"
              >
                {hits.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {hits.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleResultClick(product.id, product.name)}
                        className="flex flex-col text-left group bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors border border-transparent hover:border-white/10"
                      >
                        <div className="w-full aspect-square relative rounded-lg overflow-hidden bg-mist/10 mb-3">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-mist/30">
                              <Search className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-mist/70 uppercase tracking-widest mb-1">{product.category}</div>
                        <h3 className="font-medium text-white text-lg truncate w-full">{product.name}</h3>
                        <div className="text-rose font-medium mt-1">{formatPrice(Number(product.price))}</div>
                      </button>
                    ))}
                  </div>
                ) : !isFetching ? (
                  <div className="text-center text-mist/60 mt-20">
                    <p className="text-2xl font-display mb-2">No results found for "{query}"</p>
                    <p>Try searching for roses, chocolates, or birthday gifts.</p>
                  </div>
                ) : null}
                
                {hits.length > 0 && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={handleSearchSubmit}
                      className="flex items-center gap-2 text-white hover:text-rose transition-colors font-medium border-b border-transparent hover:border-rose pb-1"
                    >
                      View all results <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Suggestions when empty */}
            {query.length < 2 && (
              <div className="w-full mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-70">
                <div className="flex flex-col gap-3">
                  <h4 className="text-mist uppercase tracking-widest text-xs font-semibold">Popular Occasions</h4>
                  <button onClick={() => setQuery('Birthday')} className="text-left text-white hover:text-rose transition-colors text-lg">Birthday</button>
                  <button onClick={() => setQuery('Anniversary')} className="text-left text-white hover:text-rose transition-colors text-lg">Anniversary</button>
                  <button onClick={() => setQuery('Sympathy')} className="text-left text-white hover:text-rose transition-colors text-lg">Sympathy</button>
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="text-mist uppercase tracking-widest text-xs font-semibold">Trending</h4>
                  <button onClick={() => setQuery('Red Roses')} className="text-left text-white hover:text-rose transition-colors text-lg">Red Roses</button>
                  <button onClick={() => setQuery('Peonies')} className="text-left text-white hover:text-rose transition-colors text-lg">Peonies</button>
                  <button onClick={() => setQuery('Gift Baskets')} className="text-left text-white hover:text-rose transition-colors text-lg">Gift Baskets</button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
