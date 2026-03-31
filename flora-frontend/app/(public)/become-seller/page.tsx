"use client";

import { useEffect, useState, Suspense } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Plus, Store, Sparkles, TrendingUp, 
  ShieldCheck, Globe, Rocket, ArrowRight,
  CheckCircle2, Loader2, Info
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';

function BecomeSellerContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?next=/become-seller`);
    }
  }, [isAuthenticated, router]);

  const applyMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/seller/apply', {
        shop_name: shopName,
        description: description
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Your application has been received!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    }
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream/30 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-premium text-center space-y-8"
        >
           <div className="p-8 bg-green-50 rounded-full inline-block text-green-500 relative overflow-hidden group">
              <CheckCircle2 className="w-16 h-16 relative z-10" />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-green-500/20 group-hover:h-full transition-all duration-700" />
           </div>
           <div className="space-y-4">
              <h1 className="text-3xl font-display font-bold text-bark italic">Application Submitted!</h1>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                 Thank you for choosing Flora! Our team is currently reviewing your shop details. We'll notify you via email and notification once your status changes.
              </p>
           </div>
           <Button 
             onClick={() => router.push('/dashboard')}
             className="w-full h-16 rounded-2xl bg-bark hover:bg-rose text-white font-bold text-lg shadow-xl shadow-bark/10"
           >
              Return to Dashboard
           </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] bg-bark overflow-hidden flex items-center justify-center px-6">
         <div className="absolute inset-0 opacity-20 flex flex-wrap gap-12 p-12 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
               <Sparkles key={i} className="w-24 h-24 text-white" />
            ))}
         </div>
         <div className="absolute top-0 right-0 w-[50%] h-full bg-rose/10 skew-x-12 -mr-32" />
         
         <div className="relative z-10 text-center max-w-4xl space-y-8">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/20"
            >
               <Rocket className="w-4 h-4 text-rose animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white">Join the Bloom Economy</span>
            </motion.div>
            <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="text-5xl md:text-7xl font-display font-bold text-white leading-[1.1]"
            >
               Turn your <span className="text-rose italic">floral passion</span> into a luxury business.
            </motion.h1>
            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="text-white/60 text-lg md:text-xl font-medium max-w-2xl mx-auto"
            >
               Reach thousands of customers and scale your boutique with Flora's world-class logistics and premium audience.
            </motion.p>
         </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 container mx-auto px-6 max-w-6xl">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
               { 
                  icon: <Globe className="w-8 h-8" />, 
                  title: 'Global Reach', 
                  desc: 'List your products where buyers look first. From local bouquets to nationwide gift delivery.'
               },
               { 
                  icon: <TrendingUp className="w-8 h-8" />, 
                  title: 'Smart Analytics', 
                  desc: 'Understand your sales patterns and trends with our integrated vendor performance tools.'
               },
               { 
                  icon: <ShieldCheck className="w-8 h-8" />, 
                  title: 'Secure Payments', 
                  desc: 'Get paid weekly and securely. Our robust escrow system ensures you and your buyers are protected.'
               }
            ].map((benefit, i) => (
               <div key={i} className="space-y-6 group">
                  <div className="p-6 bg-cream rounded-3xl text-bark group-hover:bg-rose group-hover:text-white transition-all duration-500 shadow-soft">
                     {benefit.icon}
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-2xl font-display font-bold text-bark italic">{benefit.title}</h3>
                     <p className="text-muted-foreground font-medium leading-relaxed">{benefit.desc}</p>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* Application Form */}
      <section className="py-24 bg-mist/30">
         <div className="container mx-auto px-6 max-w-4xl">
            <div className="bg-white rounded-[3.5rem] p-12 md:p-16 shadow-premium border border-mist-dark/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-16 opacity-5">
                  <Store className="w-64 h-64 text-bark" />
               </div>

               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-16">
                  <div className="lg:col-span-2 space-y-6">
                     <div className="flex items-center gap-3 text-rose mb-2">
                        <Store className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Boutique Setup</span>
                     </div>
                     <h2 className="text-4xl font-display font-bold text-bark italic leading-tight">Apply to be a <span className="text-rose">Certified Seller.</span></h2>
                     <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        Complete this initial form to start your application. A Flora representative will be in touch to verify your documents.
                     </p>

                     <div className="pt-8 space-y-4">
                        <div className="flex items-center gap-3 text-xs font-bold text-bark/60">
                           <CheckCircle2 className="w-4 h-4 text-green-500" /> Professional Dashboard
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-bark/60">
                           <CheckCircle2 className="w-4 h-4 text-green-500" /> Local Logistics Support
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-bark/60">
                           <CheckCircle2 className="w-4 h-4 text-green-500" /> Promotional Features
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-3 space-y-8">
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Shop Name</label>
                           <Input 
                             placeholder="The Petal Boutique" 
                             value={shopName}
                             onChange={(e: any) => setShopName(e.target.value)}
                             className="h-16 rounded-2xl bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all font-medium px-6 text-lg"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 px-1">Shop Description</label>
                           <Textarea 
                             placeholder="Tell us about your floral style, experience, and why you'd like to join Flora..." 
                             value={description}
                             onChange={(e: any) => setDescription(e.target.value)}
                             className="min-h-[160px] rounded-2xl bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all font-medium px-6 pt-6 text-lg italic resize-none"
                           />
                        </div>
                     </div>

                     <div className="flex items-start gap-4 p-5 bg-rose/5 rounded-2xl border border-rose/10">
                        <Info className="w-5 h-5 text-rose shrink-0" />
                        <p className="text-[10px] font-bold text-rose/70 leading-relaxed">
                           By submitting, you agree to Flora's Seller Terms of Service. Your data will be processed according to our Privacy Policy.
                        </p>
                     </div>

                     <Button 
                       onClick={() => applyMutation.mutate()}
                       disabled={!shopName || !description || applyMutation.isPending}
                       className="w-full h-16 rounded-[2rem] bg-bark hover:bg-rose text-white font-bold text-lg shadow-xl shadow-bark/10 transition-all group gap-3"
                     >
                        {applyMutation.isPending ? (
                           <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                           <>Submit Application <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /></>
                        )}
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}

export default function BecomeSellerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6 bg-cream/30">
        <Loader2 className="w-12 h-12 text-rose animate-spin" />
      </div>
    }>
      <BecomeSellerContent />
    </Suspense>
  );
}
