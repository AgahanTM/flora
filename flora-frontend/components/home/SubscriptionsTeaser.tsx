"use client";

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Check, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

import { apiClient } from '@/lib/api/client';
import { SubscriptionPlan } from '@/lib/types/subscription';
import { formatPrice } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function SubscriptionsTeaser() {
  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscriptions', 'plans'],
    queryFn: async () => {
      const { data } = await apiClient.get('/subscriptions/plans');
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 60 * 60 * 1000,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-20 md:py-32 bg-mist/30">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full mb-6 shadow-soft border border-mist-dark">
            <Calendar className="w-8 h-8 text-rose" />
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl text-bark mb-4">
            Flora <span className="text-rose font-accent italic font-normal pr-2">Subscriptions</span>
          </h2>
          <p className="text-bark/70 text-lg">
            Ensure fresh blooms arrive exactly when they should. Regular deliveries of seasonal flowers to brighten any space.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col bg-white rounded-3xl p-8 border border-border shadow-sm">
                <Skeleton className="h-6 w-1/2 mb-4" />
                <Skeleton className="h-10 w-3/4 mb-6" />
                <Skeleton className="h-24 w-full mb-8" />
                <Skeleton className="h-12 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : plans && plans.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {plans.slice(0, 3).map((plan, index) => {
              // Highlight the middle plan
              const isPopular = index === 1 || (plans.length === 1 && index === 0);
              
              return (
                <motion.div 
                  key={plan.id}
                  variants={itemVariants}
                  className={`flex flex-col bg-white rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-2 relative
                    ${isPopular 
                      ? 'border-2 border-rose shadow-xl md:-mt-4 md:mb-4' 
                      : 'border border-border shadow-card'
                    }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md z-10">
                      Most Popular
                    </div>
                  )}
                  
                  <h3 className="font-display font-semibold text-2xl text-bark mb-2">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="font-display font-bold text-4xl text-rose-dark">
                      {Number(plan.discount_percentage)}%
                    </span>
                    <span className="text-muted-foreground text-sm pb-1">off orders</span>
                  </div>
                  
                  <p className="text-bark/70 text-sm mb-8 flex-1 leading-relaxed">
                    {plan.description || 'A beautiful selection of seasonal flowers curated by our artisan florists.'}
                  </p>

                  <div className="flex flex-col gap-3 mb-8">
                    <div className="flex items-center gap-3 text-sm text-bark font-medium">
                      <div className="w-5 h-5 rounded-full bg-rose/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-rose" />
                      </div>
                      Free standard delivery
                    </div>
                    <div className="flex items-center gap-3 text-sm text-bark font-medium">
                      <div className="w-5 h-5 rounded-full bg-rose/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-rose" />
                      </div>
                      Exclusive seasonal selections
                    </div>
                    <div className="flex items-center gap-3 text-sm text-bark font-medium">
                      <div className="w-5 h-5 rounded-full bg-rose/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-rose" />
                      </div>
                      Cancel or pause anytime
                    </div>
                  </div>

                  <Link href={`/subscriptions/plans/${plan.id}`} className="mt-auto">
                    <Button 
                      variant={isPopular ? 'primary' : 'outline'} 
                      className={`w-full rounded-xl h-12 ${!isPopular && 'border-rose text-rose hover:bg-rose hover:text-white'}`}
                    >
                      Choose Plan
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center text-muted-foreground">Subscriptions coming soon!</div>
        )}

        <div className="mt-16 text-center">
          <Link href="/subscriptions" className="inline-flex text-bark hover:text-rose font-medium border-b-2 border-transparent hover:border-rose transition-colors pb-1">
            Learn more about subscriptions
          </Link>
        </div>
      </div>
    </section>
  );
}
