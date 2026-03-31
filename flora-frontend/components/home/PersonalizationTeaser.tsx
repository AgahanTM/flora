"use client";

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { PenTool, Box, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { apiClient } from '@/lib/api/client';
import { PersonalizationType } from '@/lib/types/personalization';
import { parseJsonArray } from '@/lib/utils/jsonFields';
import { formatPrice } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';

export function PersonalizationTeaser() {
  const { data: types, isLoading } = useQuery<PersonalizationType[]>({
    queryKey: ['personalization', 'types'],
    queryFn: async () => {
      const { data } = await apiClient.get('/personalization/types');
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  return (
    <section className="py-20 md:py-32 bg-white relative overflow-hidden">
      {/* Visual flair */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sage/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
        
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left Text Block */}
          <div className="w-full lg:w-5/12 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mist text-bark text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-rose" /> 
              Make it yours
            </div>
            
            <h2 className="font-display font-bold text-4xl md:text-5xl text-bark mb-6 leading-tight">
              Personalize <br className="hidden lg:block"/>
              <span className="text-rose font-accent font-normal italic pr-2">Every Detail</span>
            </h2>
            
            <p className="text-bark/70 text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Go beyond the bouquet. Add a permanent mark of your affection with custom laser engraving, elegant ribbons, or advanced 3D-printed nameplates.
            </p>
            
            <Link href="/gift-builder" className="inline-block">
              <Button size="lg" className="h-14 px-8 rounded-full text-lg shadow-card group">
                <Wand2 className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                Start Customizing
              </Button>
            </Link>
          </div>

          {/* Right Cards Showcase */}
          <div className="w-full lg:w-7/12">
            {!isLoading && types && types.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                
                {/* 3D Print Example Background Element - pseudo decorative */}
                <div className="absolute inset-0 bg-floral-texture opacity-20 pointer-events-none rounded-3xl" />
                
                {types.slice(0, 4).map((type, index) => {
                  const materials = parseJsonArray(type.available_materials);
                  const colors = parseJsonArray(type.available_colors);
                  
                  // Staggered layout for masonry effect
                  const marginTop = index % 2 !== 0 ? 'md:mt-12' : '';
                  
                  return (
                    <motion.div 
                      key={type.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: index * 0.15 }}
                      className={`bg-white/80 backdrop-blur-sm border border-border rounded-3xl p-6 shadow-soft hover:shadow-card hover:-translate-y-2 transition-all group ${marginTop}`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-cream flex items-center justify-center mb-6 shadow-sm border border-mist">
                        {type.name.toLowerCase().includes('laser') ? (
                          <PenTool className="w-6 h-6 text-rose" />
                        ) : type.name.toLowerCase().includes('3d') ? (
                          <Box className="w-6 h-6 text-rose" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-rose" />
                        )}
                      </div>
                      
                      <h3 className="font-display font-semibold text-xl text-bark mb-2">{type.name}</h3>
                      <p className="text-sm text-bark/60 mb-4 line-clamp-3 leading-relaxed h-[60px]">
                        {type.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-medium text-rose-dark">
                          from {formatPrice(Number(type.base_price))}
                        </span>
                        
                        <div className="flex gap-1">
                          {/* Display color pills */}
                          {(colors as string[]).slice(0, 3).map((color, i) => (
                            <span 
                              key={i} 
                              className="w-4 h-4 rounded-full border border-mist-dark shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                          {colors.length > 3 && (
                            <span className="w-4 h-4 rounded-full bg-mist-dark text-[8px] flex items-center justify-center text-white">
                              +{(colors as string[]).length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
