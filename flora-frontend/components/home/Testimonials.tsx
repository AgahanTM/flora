"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import Image from 'next/image';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Aygul Meredova',
    location: 'Ashgabat',
    role: 'Verified Customer',
    content: 'The 3D printed name tag on the bouquet was the most beautiful touch ever! My mother was moved to tears. The delivery was right on time and the roses lasted over two weeks.',
    rating: 5,
    avatar: 'A'
  },
  {
    id: 2,
    name: 'Merdan Hojayev',
    location: 'Turkmenbashi',
    role: 'Regular Buyer',
    content: 'I use the subscription service for my office and the arrangements are always fresh, creative, and stunning. Flora has completely elevated our entryway.',
    rating: 5,
    avatar: 'M'
  },
  {
    id: 3,
    name: 'Leyla Atayeva',
    location: 'Ashgabat',
    role: 'Verified Customer',
    content: 'The gift builder saved me on Valentine\'s Day. Mixing premium chocolates with a custom floral box made it feel incredibly thoughtful. Best service in town by far.',
    rating: 5,
    avatar: 'L'
  }
];

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  const prev = () => setActiveIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));

  return (
    <section className="py-24 bg-cream border-t border-mist-dark relative overflow-hidden">
      {/* Texture overlay */}
      <div className="absolute inset-0 bg-floral-texture opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl md:text-5xl text-bark mb-4">
            Words of <span className="text-rose font-accent italic font-normal pr-2">Love</span>
          </h2>
          <p className="text-bark/70 text-lg">
            See what our community says about their Flora experience.
          </p>
        </div>

        {/* Desktop Grid Layout */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, index) => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="bg-white p-8 rounded-3xl shadow-soft border border-mist-dark/50 relative group"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-mist-dark group-hover:text-rose/20 transition-colors" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'fill-rose text-rose' : 'text-mist-dark'}`} />
                ))}
              </div>
              
              <p className="text-bark/80 leading-relaxed mb-8 relative z-10 font-medium italic min-h-[120px]">
                "{t.content}"
              </p>
              
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 bg-rose/10 rounded-full flex items-center justify-center text-rose-dark font-display font-bold text-xl shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="font-medium text-bark leading-tight">{t.name}</h4>
                  <p className="text-xs text-muted-foreground">{t.role} • {t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Carousel Layout */}
        <div className="md:hidden relative px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-8 rounded-3xl shadow-card border border-mist-dark/50 relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-rose/10" />
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < TESTIMONIALS[activeIndex].rating ? 'fill-rose text-rose' : 'text-mist-dark'}`} />
                ))}
              </div>
              <p className="text-bark/80 leading-relaxed mb-8 italic min-h-[140px]">
                "{TESTIMONIALS[activeIndex].content}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose/10 rounded-full flex items-center justify-center text-rose-dark font-display font-bold text-xl shrink-0">
                  {TESTIMONIALS[activeIndex].avatar}
                </div>
                <div>
                  <h4 className="font-medium text-bark leading-tight">{TESTIMONIALS[activeIndex].name}</h4>
                  <p className="text-xs text-muted-foreground">{TESTIMONIALS[activeIndex].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={prev} className="w-10 h-10 rounded-full bg-mist text-bark flex items-center justify-center hover:bg-rose hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === activeIndex ? 'bg-rose' : 'bg-mist-dark'}`} />
              ))}
            </div>
            <button onClick={next} className="w-10 h-10 rounded-full bg-mist text-bark flex items-center justify-center hover:bg-rose hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
