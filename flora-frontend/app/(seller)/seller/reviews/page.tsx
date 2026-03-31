"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Star, MessageSquare, ArrowLeft, 
  Sparkles, Loader2, User, 
  Send, CheckCircle2, Image as ImageIcon,
  TrendingUp, ThumbsUp, Quote
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { Review, SellerRatings } from '@/lib/types/review';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { parseJsonArray } from '@/lib/utils/jsonFields';
import { cn } from '@/lib/utils';

export default function SellerReviewsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['seller-reviews'],
    queryFn: async () => {
      const res = await apiClient.get('/seller/reviews');
      return res.data as Review[];
    }
  });

  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['seller-ratings'],
    queryFn: async () => {
      const res = await apiClient.get('/seller/profile');
      // Profile likely contains ratings info or a separate endpoint
      return res.data.ratings as SellerRatings;
    }
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string, response: string }) => {
      return apiClient.put(`/reviews/${id}/respond`, { response });
    },
    onSuccess: () => {
      toast.success('Response submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['seller-reviews'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to submit response');
    }
  });

  const handleReply = (id: string) => {
    if (!replyText[id]?.trim()) return;
    replyMutation.mutate({ id, response: replyText[id] });
  };

  if (reviewsLoading || ratingsLoading) {
    return (
      <div className="min-h-screen bg-cream/30 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-rose animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-bark/30 animate-pulse italic">Auditing your reputation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <div className="container mx-auto px-6 max-w-6xl pt-12 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/seller/dashboard')} 
              className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose mb-1">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Vendor Insight</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-bark italic">Customer Sentiment</h1>
            </div>
          </div>
        </header>

        {/* Rating Summary Hub */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 bg-bark text-white rounded-[3rem] p-10 shadow-premium relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 blur-3xl rounded-full" />
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-3 opacity-60">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Average Rating</span>
                 </div>
                 <div className="flex items-baseline gap-4">
                    <span className="text-7xl font-display font-bold italic">{ratings?.average_rating || '5.0'}</span>
                    <div className="space-y-1">
                       <div className="flex text-rose">
                          {Array.from({ length: 5 }).map((_, i) => (
                             <Star key={i} className={cn("w-4 h-4 fill-current", i >= Math.floor(parseFloat(ratings?.average_rating || '5')) && "opacity-20")} />
                          ))}
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{ratings?.total_reviews || 0} Total Reviews</p>
                    </div>
                 </div>
                 <div className="pt-8 border-t border-white/10 space-y-4">
                    {Object.entries(ratings?.rating_distribution || {}).reverse().map(([star, count]) => (
                       <div key={star} className="flex items-center gap-4 group">
                          <span className="text-[10px] font-black w-4 opacity-40 group-hover:opacity-100 transition-opacity">{star}</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(count / (ratings?.total_reviews || 1)) * 100}%` }}
                               className="h-full bg-rose shadow-[0_0_10px_rgba(255,108,135,0.5)]" 
                             />
                          </div>
                          <span className="text-[10px] font-black w-8 text-right opacity-40">{count}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-2 bg-white/50 backdrop-blur-md rounded-[3rem] border border-mist-dark/10 p-10 flex items-center justify-center text-center">
              <div className="max-w-md space-y-6">
                 <div className="w-16 h-16 bg-rose/10 rounded-full mx-auto flex items-center justify-center text-rose">
                    <ThumbsUp className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl font-display font-bold text-bark italic">Craft with Passion</h3>
                 <p className="text-sm text-muted-foreground font-medium italic">
                    "Every response to a customer is an opportunity to showcase your artisan values. Let your words be as thoughtful as your floral arrangements."
                 </p>
              </div>
           </div>
        </section>

        {/* Reviews List */}
        <div className="space-y-8">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-bark/30 px-2 flex items-center gap-3">
              <Quote className="w-4 h-4" /> Recent Feedback
           </h3>
           
           <div className="grid grid-cols-1 gap-8">
              {reviews?.map((review) => {
                 const imageUrls = parseJsonArray<string>(review.images);
                 
                 return (
                    <motion.div 
                      key={review.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-premium overflow-hidden group"
                    >
                       <div className="flex flex-col lg:flex-row">
                          {/* Review Content */}
                          <div className="p-10 lg:w-2/3 space-y-8">
                             <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-14 h-14 rounded-2xl bg-mist flex items-center justify-center text-bark/20 border border-mist-dark/5 relative overflow-hidden">
                                      {review.customer?.avatar_url ? <Image src={review.customer.avatar_url} alt={review.customer.full_name || 'Customer'} fill className="object-cover" /> : <User className="w-6 h-6" />}
                                   </div>
                                   <div>
                                      <p className="font-bold text-bark">{review.customer?.full_name || 'Anonymous Lover'}</p>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-bark/20">{format(new Date(review.created_at), 'MMMM dd, yyyy')}</p>
                                   </div>
                                </div>
                                <div className="flex gap-1 text-amber-400">
                                   {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={cn("w-4 h-4 fill-current", i >= review.rating && "text-mist-dark/20 fill-transparent")} />
                                   ))}
                                </div>
                             </div>

                             <p className="text-lg font-medium text-bark/80 italic leading-relaxed">
                                "{review.comment || 'This customer didn\'t leave a written comment, but their rating speaks for itself.'}"
                             </p>

                             {imageUrls.length > 0 && (
                                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                                   {imageUrls.map((url, i) => (
                                      <div key={url + i} className="w-24 h-24 rounded-2xl overflow-hidden shadow-premium bg-mist shrink-0 border border-mist-dark/10 group-hover:scale-105 transition-transform duration-500 relative">
                                         <Image src={url} alt={`Review image ${i + 1}`} fill className="object-cover" />
                                      </div>
                                   ))}
                                </div>
                             )}
                          </div>

                          {/* Response Section */}
                          <div className="p-10 lg:w-1/3 bg-mist/20 border-t lg:border-t-0 lg:border-l border-mist-dark/5">
                             {review.response ? (
                                <div className="space-y-4">
                                   <div className="flex items-center gap-2 text-rose">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Your Response</span>
                                   </div>
                                   <div className="p-5 bg-white rounded-2xl border border-rose/10 shadow-soft italic text-xs font-medium text-bark/60 leading-relaxed">
                                      {review.response.response}
                                   </div>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-bark/20">Sent {format(new Date(review.response.created_at), 'MMM dd')}</p>
                                </div>
                             ) : (
                                <div className="space-y-4 h-full flex flex-col">
                                   <div className="flex items-center gap-2 text-bark/40">
                                      <MessageSquare className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Acknowledge</span>
                                   </div>
                                   <Textarea 
                                      value={replyText[review.id] || ''}
                                      onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                                      placeholder="Express your gratitude or address concerns..."
                                      className="flex-1 min-h-[120px] rounded-2xl bg-white border-transparent focus:border-rose/30 transition-all font-medium p-5 text-xs italic resize-none"
                                   />
                                   <Button 
                                      onClick={() => handleReply(review.id)}
                                      disabled={!replyText[review.id]?.trim() || replyMutation.isPending}
                                      className="w-full h-12 rounded-xl bg-bark hover:bg-rose text-white font-bold gap-3 shadow-lg shadow-bark/10 transition-all"
                                   >
                                      {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                         <>Apply Response <Send className="w-4 h-4" /></>
                                      )}
                                   </Button>
                                </div>
                             )}
                          </div>
                       </div>
                    </motion.div>
                 );
              })}
           </div>

           {(!reviews || reviews.length === 0) && (
              <div className="text-center py-32 bg-white/50 border-2 border-dashed border-mist-dark/20 rounded-[3rem]">
                 <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-bark/10 shadow-premium mb-6">
                    <Star className="w-10 h-10" />
                 </div>
                 <h3 className="text-xl font-display font-bold text-bark italic">No accolades yet</h3>
                 <p className="text-sm text-muted-foreground font-medium italic mt-2">Your flowers are beautiful, the reviews will bloom soon.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
