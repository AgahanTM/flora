"use client";

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { Sparkles, ArrowRight, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroBanner() {
  // Stagger animation variants
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-cream via-rose/5 to-cream px-6 py-20">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-rose/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/3 bg-sage/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-floral-texture opacity-30 pointer-events-none" />

      {/* Floating Badge (Decorative, but could be animated too) */}
      <motion.div 
        initial={{ opacity: 0, y: -20, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="absolute top-8 left-1/2 -translate-x-1/2 md:top-24 md:left-24 md:-translate-x-0 hidden md:flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-soft border border-rose/10 text-bark font-medium text-sm z-10"
      >
        <Sparkles className="w-4 h-4 text-rose" />
        Same-day delivery in Ashgabat
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center"
      >
        {/* Mobile Badge */}
        <motion.div variants={item} className="md:hidden flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-soft border border-rose/10 text-bark font-medium text-xs mb-8">
          <Sparkles className="w-3.5 h-3.5 text-rose" />
          Same-day delivery in Ashgabat
        </motion.div>

        <motion.h1 
          variants={item}
          className="font-display font-bold text-5xl md:text-7xl lg:text-8xl text-bark leading-[1.1] mb-6 tracking-tight"
        >
          Send Love, <br />
          <span className="text-rose font-accent font-normal italic pr-4">One Bloom</span> at a Time
        </motion.h1>

        <motion.p 
          variants={item}
          className="text-lg md:text-xl text-bark/80 max-w-2xl mb-10 leading-relaxed"
        >
          Experience the finest curation of fresh, romantic flowers and personalized gifts in Turkmenistan. We bring your feelings to life.
        </motion.p>

        <motion.div 
          variants={item}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link href="/products" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg group">
              Shop Flowers
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/gift-builder" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-white/50 backdrop-blur-sm border-rose/20 text-bark hover:bg-white hover:border-rose/40">
              <Gift className="w-5 h-5 mr-2 text-rose" />
              Build a Gift
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
