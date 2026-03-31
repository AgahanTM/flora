"use client";

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { Occasion } from '@/lib/types/occasion';
import { useGiftBuilderStore } from '@/lib/store/giftBuilderStore';
import { trackEvent } from '@/lib/api/analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function OccasionPicker() {
  const { setOccasion, step } = useGiftBuilderStore();

  const { data: occasions, isLoading } = useQuery<Occasion[]>({
    queryKey: ['occasions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/occasions');
      return data;
    },
  });

  // Track start once
  useEffect(() => {
    if (step === 1) {
      trackEvent('gift_builder_started', { timestamp: Date.now() });
    }
  }, [step]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-bark">What's the occasion?</h2>
        <p className="text-muted-foreground">Every moment deserves a bloom. Pick one to get started.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {occasions?.filter(o => o.is_active).map((occasion, i) => (
          <motion.button
            key={occasion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setOccasion(occasion)}
            className="group relative aspect-square bg-white rounded-3xl p-6 border border-mist-dark/20 shadow-soft hover:shadow-hover hover:border-rose/30 transition-all flex flex-col items-center justify-center text-center gap-4 overflow-hidden"
          >
            {/* Background floating floral accent */}
            <div className="absolute -right-4 -bottom-4 w-20 h-20 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all">
              <Sparkles className="w-full h-full text-rose" />
            </div>

            <div className="relative w-16 h-16 rounded-full bg-mist/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              {occasion.icon_url ? (
                <Image src={occasion.icon_url} alt={occasion.name} width={40} height={40} className="object-contain" />
              ) : (
                <Sparkles className="w-8 h-8 text-rose/50" />
              )}
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-bark group-hover:text-rose transition-colors">{occasion.name}</h3>
              <p className="text-[10px] text-muted-foreground line-clamp-2">{occasion.description || 'Special gifts for special days'}</p>
            </div>

            <div className="absolute bottom-4 right-4 translate-x-12 group-hover:translate-x-0 transition-transform text-rose">
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
