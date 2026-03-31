"use client";

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { ProductImage } from '@/lib/types/product';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  images: ProductImage[];
}

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  };

  if (!sortedImages.length) {
    return (
      <div className="aspect-square bg-mist rounded-3xl flex items-center justify-center">
        <span className="text-muted-foreground italic">No images available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-white shadow-soft group">
        <AnimatePresence mode="wait">
          <motion.div
            key={sortedImages[activeIndex].id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <Image
              src={sortedImages[activeIndex].image_url}
              alt="Product Image"
              fill
              className={cn(
                "object-cover transition-transform duration-700",
                isZoomed ? "scale-110" : "scale-100"
              )}
              priority
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-bark opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-bark opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div className="absolute top-4 right-4 bg-white/50 backdrop-blur-sm p-2 rounded-full text-bark/60">
           <Maximize2 className="w-4 h-4" />
        </div>
      </div>

      {/* Thumbnails Strip */}
      {sortedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {sortedImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all",
                activeIndex === i ? "border-rose shadow-soft scale-105" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img.image_url}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
