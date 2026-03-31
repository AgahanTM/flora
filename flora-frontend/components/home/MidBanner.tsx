"use client";

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

export function MidBanner() {
  const { data: banner, isLoading } = useQuery({
    queryKey: ['banners', 'home_mid'],
    queryFn: async () => {
      const { data } = await apiClient.get('/banners?position=home_mid');
      // If none exist, we return null
      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) return null;
      // Just take the first one
      return data.data[0];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="w-full h-[400px] bg-mist animate-pulse rounded-3xl" />
        </div>
      </section>
    );
  }

  // If we have an active banner, render it
  if (banner) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <Link href={banner.link_url || '/products'} className="relative block w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden group shadow-soft">
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <h2 className="font-display font-bold text-3xl md:text-5xl text-white mb-4 drop-shadow-md">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-white/90 text-lg md:text-xl max-w-2xl drop-shadow-md mb-8">
                  {banner.subtitle}
                </p>
              )}
              {banner.link_url && (
                <span className="inline-flex items-center gap-2 bg-white text-bark font-medium px-6 py-3 rounded-xl hover:bg-rose hover:text-white transition-colors">
                  Shop Now <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </div>
          </Link>
        </div>
      </section>
    );
  }

  // Fallback: Seasonal Section
  return (
    <section className="py-16 bg-white shrink-0">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="relative w-full rounded-3xl overflow-hidden bg-rose-dark/5 border border-rose/20 flex flex-col md:flex-row items-center">
          
          <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center items-start z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-rose-dark text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
              Seasonal Special
            </div>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-bark mb-4 leading-tight">
              Spring <span className="text-rose font-accent font-normal italic pr-2">Awakening</span>
            </h2>
            <p className="text-bark/70 text-lg mb-8 max-w-md">
              Embrace the new season with vibrant tulips, fragrant peonies, and joyful arrangements crafted by our local artisans.
            </p>
            <Link href="/products?category=spring">
              <Button size="lg" className="h-14 px-8 text-lg group">
                Shop Spring Collection 
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          
          <div className="w-full md:w-1/2 relative h-[300px] md:h-full min-h-[400px] bg-mist">
            {/* Soft decorative blur */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-dark/5 to-transparent z-10" />
            <div className="w-full h-full flex items-center justify-center bg-floral-texture opacity-50">
               {/* Note: since we are falling back, we might just put a placeholder illustration or keep it textured */}
               <span className="text-mist-dark font-display text-3xl italic">Flora</span>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
