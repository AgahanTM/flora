"use client";

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

import { apiClient } from '@/lib/api/client';
import { Occasion } from '@/lib/types/occasion';
import { Skeleton } from '@/components/ui/skeleton';

export function OccasionsGrid() {
  const { data: occasions, isLoading } = useQuery<Occasion[]>({
    queryKey: ['occasions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/occasions');
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <section className="py-16 md:py-24 bg-white relative">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 md:mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display font-bold text-3xl md:text-5xl text-bark mb-4">
              Shop by <span className="text-rose font-accent italic font-normal pr-2">Occasion</span>
            </h2>
            <p className="text-bark/70 text-lg">
              Find the perfect arrangement tailored for your special moments.
            </p>
          </div>
          <Link 
            href="/occasions" 
            className="text-bark font-medium hover:text-rose transition-colors border-b-2 border-transparent hover:border-rose pb-1"
          >
            View all occasions
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="w-full aspect-square rounded-2xl" />
                <Skeleton className="h-6 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : occasions && occasions.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {occasions.slice(0, 4).map((occasion) => (
              <motion.div key={occasion.id} variants={itemVariants}>
                <Link
                  href={`/gift-builder?occasion=${occasion.slug}`}
                  className="group block text-center"
                >
                  <div className="relative w-full aspect-square bg-mist rounded-2xl overflow-hidden mb-4 shadow-sm group-hover:shadow-card transition-all duration-300">
                    {occasion.icon_url ? (
                      <Image
                        src={occasion.icon_url}
                        alt={occasion.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-rose/10 text-rose font-display text-4xl">
                        {occasion.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-bark/10 group-hover:bg-transparent transition-colors duration-300" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-bark group-hover:text-rose transition-colors">
                    {occasion.name}
                  </h3>
                  {occasion.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 px-2">
                      {occasion.description}
                    </p>
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No occasions found at the moment.
          </div>
        )}
      </div>
    </section>
  );
}
