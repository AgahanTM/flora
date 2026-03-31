"use client";

import { motion, Variants } from 'framer-motion';
import { MousePointerClick, Sparkles, Truck } from 'lucide-react';

const STEPS = [
  {
    title: 'Choose Your Gift',
    description: 'Browse our curated collection of fresh flowers, or build a custom gift box tailored to your recipient.',
    icon: MousePointerClick,
  },
  {
    title: 'Personalize It',
    description: 'Add laser-engraved messages, custom ribbons, or 3D-printed names to make it truly one-of-a-kind.',
    icon: Sparkles,
  },
  {
    title: 'We Deliver',
    description: 'Our dedicated couriers ensure your gift arrives in pristine condition, with same-day tracking available.',
    icon: Truck,
  },
];

export function HowItWorks() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <section className="py-20 bg-cream relative overflow-hidden">
      {/* Decorative floral pattern background */}
      <div className="absolute inset-0 bg-floral-texture opacity-30 pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display font-bold text-3xl md:text-5xl text-bark mb-4">
            How Flora <span className="text-rose font-accent italic font-normal pr-2">Works</span>
          </h2>
          <p className="text-bark/70 text-lg">
            Creating unforgettable moments is as simple as three steps.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
        >
          {/* Connecting line for Desktop */}
          <div className="hidden md:block absolute top-[40px] left-[16%] right-[16%] h-0.5 bg-border -z-10">
            <div className="absolute inset-0 bg-rose/30 w-full animate-pulse"></div>
          </div>

          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className="flex flex-col items-center text-center relative"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-soft border-4 border-cream mb-6 relative z-10">
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-mist-dark flex items-center justify-center text-sm font-bold text-bark border-2 border-white">
                    {index + 1}
                  </div>
                  <Icon className="w-8 h-8 text-rose" />
                </div>
                
                <h3 className="font-display font-semibold text-xl text-bark mb-3">{step.title}</h3>
                <p className="text-bark/70 leading-relaxed max-w-xs">{step.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
