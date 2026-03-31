"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Calendar, MapPin, Store, 
  ArrowRight, Loader2, CheckCircle2, 
  Pause, Play, XCircle, RefreshCw,
  Info, ShieldCheck, ArrowLeft, Plus
} from 'lucide-react';
import { format, parseISO, addMonths } from 'date-fns';
import { toast } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api/client';
import { Subscription, SubscriptionPlan } from '@/lib/types/subscription';
import { Address } from '@/lib/types/auth';
import { SubscriptionStatus, SubscriptionFrequency } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function SubscriptionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  // Form State
  const [sellerId, setSellerId] = useState('');
  const [addressId, setAddressId] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await apiClient.get('/subscriptions/plans');
      return data as SubscriptionPlan[];
    }
  });

  const { data: subscriptions = [], isLoading: isSubsLoading, refetch: refetchSubs } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/subscriptions');
      return data as Subscription[];
    }
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await apiClient.get('/addresses');
      return data as Address[];
    }
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/subscriptions', {
        plan_id: selectedPlanId,
        seller_id: sellerId,
        delivery_address_id: addressId,
        start_date: startDate
      });
    },
    onSuccess: () => {
      toast.success('Subscribed successfully!');
      setIsModalOpen(false);
      refetchSubs();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to subscribe');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return apiClient.put(`/subscriptions/${id}/${status}`);
    },
    onSuccess: (data, variables) => {
       const action = variables.status === 'pause' ? 'paused' : variables.status === 'resume' ? 'resumed' : 'cancelled';
       toast.success(`Subscription ${action} successfully`);
       refetchSubs();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update subscription');
    }
  });

  const currentSubscription = subscriptions.find(s => 
    s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.PAUSED
  );

  const cancelledSubscription = subscriptions.find(s => s.status === SubscriptionStatus.CANCELLED);

  if (isPlansLoading || isSubsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-cream/30">
        <Loader2 className="w-12 h-12 text-rose animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <div className="container mx-auto px-6 max-w-6xl pt-12 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/dashboard')} 
                className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
              >
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-1">
                 <div className="flex items-center gap-2 text-rose mb-1">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Premium Experiences</span>
                 </div>
                 <h1 className="text-3xl font-display font-bold text-bark">Flower Subscriptions</h1>
              </div>
           </div>
        </header>

        {currentSubscription ? (
           /* Active/Paused Subscription Card */
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className={cn(
               "bg-white rounded-[3rem] p-8 md:p-12 shadow-premium border-2 relative overflow-hidden",
               currentSubscription.status === SubscriptionStatus.ACTIVE ? "border-green-100" : "border-amber-100"
             )}
           >
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                 <Sparkles className="w-64 h-64 text-bark" />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-start lg:items-center">
                 <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-3">
                       <span className={cn(
                         "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                         currentSubscription.status === SubscriptionStatus.ACTIVE 
                           ? "bg-green-50 text-green-600 border-green-200" 
                           : "bg-amber-50 text-amber-600 border-amber-200"
                       )}>
                          {currentSubscription.status} Subscription
                       </span>
                       <span className="text-xs font-bold text-bark/30 uppercase tracking-widest italic font-display">
                          {currentSubscription.plan?.name} Plan
                       </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-display font-bold text-bark leading-tight">
                       Your world, <span className="text-rose">filled with blooms.</span>
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                       <div className="flex items-start gap-4">
                          <div className="p-3 bg-mist/50 rounded-2xl text-bark/40">
                             <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 mb-0.5">Next Delivery</p>
                             <p className="font-bold text-bark">{format(parseISO(currentSubscription.next_delivery_date), 'MMMM do, yyyy')}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-4">
                          <div className="p-3 bg-mist/50 rounded-2xl text-bark/40">
                             <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 mb-0.5">Delivered to</p>
                             <p className="font-bold text-bark truncate max-w-[180px]">{currentSubscription.address?.label || 'Default Address'}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[280px]">
                    {currentSubscription.status === SubscriptionStatus.ACTIVE ? (
                       <Button 
                         onClick={() => updateStatusMutation.mutate({ id: currentSubscription.id, status: 'pause' })}
                         className="h-16 rounded-[2rem] bg-white text-bark hover:bg-mist border border-mist-dark/10 font-bold gap-3 shadow-sm"
                       >
                          <Pause className="w-5 h-5" /> Pause Deliveries
                       </Button>
                    ) : (
                       <Button 
                         onClick={() => updateStatusMutation.mutate({ id: currentSubscription.id, status: 'resume' })}
                         className="h-16 rounded-[2rem] bg-rose text-white hover:bg-rose/90 font-bold gap-3 shadow-xl shadow-rose/20"
                       >
                          <Play className="w-5 h-5" /> Resume Deliveries
                       </Button>
                    )}
                    <Button 
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel your subscription?')) {
                          updateStatusMutation.mutate({ id: currentSubscription.id, status: 'cancel' });
                        }
                      }}
                      className="h-16 rounded-[2rem] bg-white text-rose/40 hover:text-rose hover:bg-rose/5 border border-mist-dark/5 font-bold gap-3"
                    >
                       <XCircle className="w-5 h-5" /> Cancel Plan
                    </Button>
                 </div>
              </div>

              <div className="mt-12 pt-10 border-t border-mist-dark/5 flex flex-wrap items-center gap-8">
                 <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">Secure Recurring Billing</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-bark/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-bark/30">No commitments, pause anytime.</span>
                 </div>
              </div>
           </motion.div>
        ) : (
           /* Plan Selection Feed */
           <div className="space-y-12">
              <div className="max-w-2xl">
                 <h2 className="text-3xl font-display font-bold text-bark mb-4">Choose your <span className="text-rose">bloom journey</span></h2>
                 <p className="text-muted-foreground font-medium">
                    Enjoy curated seasonal arrangements delivered to your door. Save up to {Math.max(...plans.map(p => parseFloat(p.discount_percentage)))}% on every delivery compared to one-time purchases.
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {plans.map((plan) => (
                    <motion.div 
                      key={plan.id}
                      whileHover={{ y: -8 }}
                      className="flex flex-col"
                    >
                       <Card className="rounded-[2.5rem] border-transparent shadow-soft hover:shadow-premium transition-all overflow-hidden flex-1 flex flex-col">
                          <CardHeader className="p-8 pb-4">
                             <div className="flex items-center justify-between mb-2">
                                <CardTitle className="text-2xl font-display font-bold text-bark italic">{plan.name}</CardTitle>
                                <div className="p-3 bg-rose/10 rounded-2xl text-rose">
                                   <Sparkles className="w-5 h-5" />
                                </div>
                             </div>
                             <CardDescription className="font-medium text-muted-foreground line-clamp-2">{plan.description || `Fresh seasonal flowers, delivered ${plan.frequency}.`}</CardDescription>
                          </CardHeader>
                          <CardContent className="px-8 pb-8 pt-4 flex-1">
                             <div className="space-y-4">
                                <div className="flex items-baseline gap-2">
                                   <span className="text-xs font-black uppercase tracking-tighter text-rose bg-rose/5 px-2 py-0.5 rounded-lg">Save {plan.discount_percentage}%</span>
                                </div>
                                <ul className="space-y-3">
                                   {[
                                     `Delivered ${plan.frequency.toLowerCase()}`,
                                     'Free delivery included',
                                     'Pause or cancel anytime',
                                     'Priority customer support'
                                   ].map((item, i) => (
                                      <li key={i} className="text-xs font-bold text-bark/60 flex items-center gap-3">
                                         <CheckCircle2 className="w-4 h-4 text-green-500" /> {item}
                                      </li>
                                   ))}
                                </ul>
                             </div>
                          </CardContent>
                          <CardFooter className="px-8 pb-8">
                             <Dialog open={isModalOpen && selectedPlanId === plan.id} onOpenChange={(open) => { setIsModalOpen(open); if(!open) setSelectedPlanId(null); }}>
                                <DialogTrigger render={
                                   <Button 
                                     onClick={() => setSelectedPlanId(plan.id)}
                                     className="w-full h-14 rounded-2xl bg-bark hover:bg-rose text-white font-bold gap-3 group shadow-xl shadow-bark/10 hover:shadow-rose/20 transition-all"
                                   >
                                      Subscribe Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                   </Button>
                                } />
                                <DialogContent className="max-w-md rounded-[2.5rem] p-10 gap-8">
                                   <DialogHeader className="gap-2 text-left">
                                      <div className="flex items-center gap-3 text-rose mb-1">
                                         <Sparkles className="w-5 h-5 animate-pulse" />
                                         <span className="text-[10px] font-black uppercase tracking-widest">Complete Journey</span>
                                      </div>
                                      <DialogTitle className="text-3xl font-display font-bold text-bark italic">Confirm Subscription</DialogTitle>
                                      <DialogDescription className="font-medium text-bark/50">Configure your "{plan.name}" delivery preferences below.</DialogDescription>
                                   </DialogHeader>

                                   <div className="space-y-6">
                                      <div className="space-y-2">
                                         <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1 flex items-center gap-2">
                                            <Store className="w-3.5 h-3.5" /> Seller Reference ID
                                         </label>
                                         <Input 
                                           placeholder="Enter seller ID (optional)" 
                                           value={sellerId}
                                           onChange={(e) => setSellerId(e.target.value)}
                                           className="h-14 rounded-2xl bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all font-medium"
                                         />
                                      </div>

                                      <div className="space-y-2">
                                         <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1 flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5" /> Select Address
                                         </label>
                                         <Select onValueChange={setAddressId} value={addressId}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all font-medium">
                                               <SelectValue placeholder="Choose delivery location" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-mist-dark/10 shadow-premium">
                                               {addresses.map(addr => (
                                                  <SelectItem key={addr.id} value={addr.id} className="rounded-xl focus:bg-rose/5 focus:text-rose py-3">
                                                     {addr.label} — {addr.city}, {addr.street}
                                                  </SelectItem>
                                               ))}
                                            </SelectContent>
                                         </Select>
                                      </div>

                                      <div className="space-y-2">
                                         <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1 flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" /> Start Date
                                         </label>
                                         <input 
                                           type="date"
                                           min={format(new Date(), 'yyyy-MM-dd')}
                                           value={startDate}
                                           onChange={(e) => setStartDate(e.target.value)}
                                           className="w-full h-14 rounded-2xl bg-mist/30 px-4 text-sm border-transparent focus:bg-white focus:border-rose/30 transition-all font-medium outline-none"
                                         />
                                      </div>
                                   </div>

                                   <DialogFooter className="sm:justify-start">
                                      <Button 
                                        onClick={() => subscribeMutation.mutate()}
                                        disabled={!addressId || !startDate || subscribeMutation.isPending}
                                        className="w-full h-14 rounded-2xl bg-rose hover:bg-rose/90 text-white font-bold text-lg shadow-xl shadow-rose/20"
                                      >
                                         {subscribeMutation.isPending ? 'Confirming...' : 'Start Subscription'}
                                      </Button>
                                   </DialogFooter>
                                </DialogContent>
                             </Dialog>
                          </CardFooter>
                       </Card>
                    </motion.div>
                 ))}
              </div>
           </div>
        )}

        {/* Cancelled State Support */}
        {cancelledSubscription && !currentSubscription && (
           <div className="bg-white/50 border-2 border-dashed border-mist-dark/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-bark/10" />
              <div className="space-y-1">
                 <p className="font-bold text-bark">Your Previous Plan was Cancelled</p>
                 <p className="text-xs text-muted-foreground font-medium">Miss those blooms? You can restart your journey anytime.</p>
              </div>
              <button 
                onClick={() => {
                   // Logic to scroll to plans if not visible
                   window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className="text-xs font-black uppercase tracking-widest text-rose hover:underline"
              >
                 Subscribe Again
              </button>
           </div>
        )}
      </div>
    </div>
  );
}
