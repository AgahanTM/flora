"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { HeroBanner } from './HeroBanner';
import { BannerSkeleton } from '@/components/shared/Skeletons';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  position: string;
  sort_order: number;
}

export function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch banners
  const { data: banners, isLoading, isError } = useQuery<Banner[]>({
    queryKey: ['banners', 'home_top'],
    queryFn: async () => {
      const { data } = await apiClient.get('/banners?position=home_top');
      // Sort by sort_order
      return Array.isArray(data.data) 
        ? data.data.sort((a: Banner, b: Banner) => a.sort_order - b.sort_order) 
        : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const nextSlide = useCallback(() => {
    if (!banners || banners.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners]);

  const prevSlide = useCallback(() => {
    if (!banners || banners.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (!banners || banners.length <= 1 || isHovered) return;
    
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);
    
    return () => clearInterval(timer);
  }, [banners, isHovered, nextSlide]);

  if (isLoading) {
    return <BannerSkeleton />;
  }

  // Fallback to static hero if no banners or error
  if (isError || !banners || banners.length === 0) {
    return <HeroBanner />;
  }

  // If only 1 banner, just show it without carousel controls
  if (banners.length === 1) {
    const banner = banners[0];
    const Content = (
      <div className="relative w-full h-[80vh] overflow-hidden group">
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bark/80 via-bark/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-4">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="text-lg md:text-xl text-white/90 max-w-2xl">{banner.subtitle}</p>
          )}
        </div>
      </div>
    );

    return banner.link_url ? (
      <Link href={banner.link_url} className="block w-full">{Content}</Link>
    ) : Content;
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const currentBanner = banners[currentIndex];

  const SlideContent = (
    <>
      <Image
        src={currentBanner.image_url}
        alt={currentBanner.title}
        fill
        priority
        className="object-cover"
      />
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-bark/80 via-bark/20 to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 p-10 md:p-24 flex flex-col items-center md:items-start text-center md:text-left z-10">
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4 drop-shadow-lg"
        >
          {currentBanner.title}
        </motion.h2>
        
        {currentBanner.subtitle && (
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-2xl text-white/90 max-w-2xl drop-shadow-md"
          >
            {currentBanner.subtitle}
          </motion.p>
        )}
      </div>
    </>
  );

  return (
    <div 
      className="relative w-full h-[80vh] overflow-hidden bg-mist/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0 w-full h-full"
        >
          {currentBanner.link_url ? (
            <Link href={currentBanner.link_url} className="block w-full h-full relative group">
              {SlideContent}
            </Link>
          ) : (
            <div className="w-full h-full relative">
              {SlideContent}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
        <button
          onClick={(e) => { e.preventDefault(); prevSlide(); }}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all pointer-events-auto opacity-0 md:opacity-100 md:group-hover:opacity-100"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); nextSlide(); }}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all pointer-events-auto opacity-0 md:opacity-100 md:group-hover:opacity-100"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex 
                ? 'w-8 h-2.5 bg-rose' 
                : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
            }`}
             aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
