"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Star, MapPin, Clock, Store, 
  ChevronRight, ArrowRight, Filter,
  LayoutGrid, List, MessageSquare,
  ShieldCheck, Phone, Mail, Instagram,
  Loader2, AlertCircle, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';

import { publicApi } from '@/lib/api/public';
import { PublicSellerProfile } from '@/lib/types/seller';
import { Product } from '@/lib/types/product';
import { Review } from '@/lib/types/review';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';

interface PublicSellerStorefrontProps {
  initialSeller: PublicSellerProfile;
}

export default function PublicSellerStorefront({ initialSeller }: PublicSellerStorefrontProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch Products
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['seller-products', initialSeller.id, activeCategory, page],
    queryFn: async () => {
      const params: any = { page, limit: 12 };
      if (activeCategory !== 'all') params.category_id = activeCategory;
      const { data } = await publicApi.getSellerProducts(initialSeller.id, params);
      return data;
    }
  });

  // Fetch Categories for Filter (Stub: in real app, might come from initialSeller or separate call)
  const categories = [
    { id: 'all', name: 'All Products' },
    ...(initialSeller as any).categories || [] 
  ];

  // Helper: Format Working Hours
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return timeStr.split(':').slice(0, 2).join(':');
  };

  const currentDay = new Date().getDay(); // 0-6
  const getDayName = (day: number) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
  };

  const isOpenNow = () => {
    const today = initialSeller.working_hours?.find(h => h.day_of_week === currentDay);
    if (!today || today.is_closed) return false;
    
    const now = format(new Date(), 'HH:mm:ss');
    return now >= (today.open_time || '') && now <= (today.close_time || '');
  };

  return (
    <div className="bg-cream/30 min-h-screen">
      {/* Hero Section */}
      <section className="relative">
        <div className="h-[40vh] md:h-[50vh] w-full relative overflow-hidden">
          <Image 
            src={initialSeller.cover_url || '/placeholder-cover.jpg'} 
            alt="Cover" 
            fill
            priority
            className="object-cover grayscale-[20%] brightness-75 transition-all duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bark/80 via-bark/20 to-transparent" />
        </div>

        <div className="container mx-auto px-6 max-w-7xl relative -mt-32 md:-mt-40 z-10 pb-12">
           <div className="flex flex-col md:flex-row items-end gap-8">
              {/* Logo */}
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] bg-white p-4 shadow-premium relative">
                 <div className="w-full h-full rounded-[2rem] overflow-hidden bg-mist relative border border-mist-dark/10">
                    <Image 
                      src={initialSeller.logo_url || '/placeholder-logo.png'} 
                      alt="Logo" 
                      fill
                      className="object-cover"
                    />
                 </div>
                 {isOpenNow() && (
                   <span className="absolute bottom-4 right-4 w-6 h-6 bg-green-500 border-4 border-white rounded-full animate-pulse shadow-sm" title="Open Now" />
                 )}
              </div>

              {/* Branding Info */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                 <div className="space-y-1">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                       <h1 className="text-4xl md:text-6xl font-display font-bold text-white italic drop-shadow-lg">
                          {initialSeller.shop_name}
                       </h1>
                       {initialSeller.status === 'approved' && (
                         <div className="p-1 px-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Verified Shop</span>
                         </div>
                       )}
                    </div>
                    <p className="text-white/60 max-w-2xl font-medium line-clamp-2 md:line-clamp-none">
                       {initialSeller.description}
                    </p>
                 </div>

                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white">
                       <Star className="w-5 h-5 fill-rose text-rose" />
                       <span className="font-display font-bold text-xl">{initialSeller.seller_ratings?.average_rating || '5.0'}</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/40">({initialSeller.seller_ratings?.total_reviews || 0} reviews)</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <button className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-rose hover:border-rose transition-all">
                          <Instagram className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="container mx-auto px-6 max-w-7xl pt-12 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         {/* Left Side: Logistics & About */}
         <div className="lg:col-span-4 space-y-8">
            
            {/* Working Hours Card */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-mist-dark/10 space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-display font-bold text-bark flex items-center gap-3 italic">
                     <Clock className="w-6 h-6 text-rose" />
                     Availability
                  </h3>
                  {isOpenNow() ? (
                    <Badge className="bg-green-100 text-green-600 border-none font-bold italic">Open Now</Badge>
                  ) : (
                    <Badge className="bg-mist text-bark/40 border-none font-bold italic">Closed</Badge>
                  )}
               </div>

               <div className="space-y-4">
                  {initialSeller.working_hours?.sort((a,b) => a.day_of_week - b.day_of_week).map((hour) => {
                    const isToday = hour.day_of_week === currentDay;
                    return (
                      <div 
                        key={hour.id || hour.day_of_week} 
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl transition-all",
                          isToday ? "bg-rose/5 border border-rose/10" : "bg-mist/20"
                        )}
                      >
                         <span className={cn(
                           "text-[11px] font-black uppercase tracking-widest",
                           isToday ? "text-rose" : "text-bark/60"
                         )}>
                            {getDayName(hour.day_of_week)}
                         </span>
                         <span className="text-sm font-bold text-bark">
                            {hour.is_closed ? 'Closed' : `${formatTime(hour.open_time)} – ${formatTime(hour.close_time)}`}
                         </span>
                      </div>
                    );
                  })}
               </div>
            </div>

            {/* Delivery Zones */}
            <div className="bg-bark text-white rounded-[2.5rem] p-10 shadow-premium space-y-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-rose/20 blur-3xl rounded-full -mr-16 -mt-16" />
               
               <h3 className="text-xl font-display font-bold flex items-center gap-3 relative z-10 italic">
                  <MapPin className="w-6 h-6 text-rose" />
                  Service Areas
               </h3>
               
               <div className="grid grid-cols-2 gap-3 relative z-10">
                  {initialSeller.delivery_zones?.map((zone) => (
                    <div key={zone.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-white/10 transition-colors">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Region</p>
                       <p className="text-sm font-bold truncate">{zone.name}</p>
                    </div>
                  ))}
               </div>
            </div>

         </div>

         {/* Right Side: Catalog */}
         <div className="lg:col-span-8 space-y-12">
            
            {/* Filter Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 pr-8 rounded-3xl shadow-soft border border-mist-dark/10">
               <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide px-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                      "rounded-xl h-12 px-6 font-bold transition-all",
                      activeCategory === 'all' ? "bg-bark text-white" : "border-2 border-mist text-bark/40"
                    )}
                  >
                     All Collections
                  </Button>
                  {categories.filter(c => c.id !== 'all').map((cat) => (
                    <Button 
                      key={cat.id} 
                      variant="ghost"
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "rounded-xl h-12 px-6 font-bold transition-all",
                        activeCategory === cat.id ? "bg-bark text-white" : "border-2 border-mist text-bark/40 whitespace-nowrap"
                      )}
                    >
                       {cat.name}
                    </Button>
                  ))}
               </div>

               <div className="flex items-center gap-4 ml-2 md:ml-0">
                  <div className="h-10 w-[1px] bg-mist-dark/10 hidden md:block" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-bark/30 whitespace-nowrap">
                     {productsData?.total || 0} Products Found
                  </span>
               </div>
            </div>

            {/* Products Grid */}
            <AnimatePresence mode="wait">
              {isProductsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 py-12">
                   {[...Array(6)].map((_, i) => (
                     <div key={i} className="aspect-[3/4] rounded-3xl bg-mist animate-pulse" />
                   ))}
                </div>
              ) : productsData?.data?.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-8"
                >
                   {productsData.data.map((product: Product) => (
                     <ProductCard key={product.id} product={product} />
                   ))}
                </motion.div>
              ) : (
                <div className="py-24 text-center space-y-6">
                   <div className="w-24 h-24 bg-mist rounded-full flex items-center justify-center text-bark/20 mx-auto">
                      <ShoppingBag className="w-10 h-10" />
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-2xl font-display font-bold text-bark italic">No Products Available</h4>
                      <p className="text-bark/40 text-sm max-w-xs mx-auto">This seller hasn't added any products to this collection yet.</p>
                   </div>
                </div>
              )}
            </AnimatePresence>

            {/* Pagination Controls */}
            {productsData?.total_pages > 1 && (
               <div className="flex items-center justify-center gap-4 pt-12">
                  <Button 
                    variant="outline" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-14 rounded-2xl border-2 border-mist text-bark font-bold gap-2 px-8"
                  >
                     Previous
                  </Button>
                  <span className="font-display font-bold text-xl text-bark mx-4 italic">
                    {page} <span className="text-bark/20 italic font-black text-sm uppercase px-1">of</span> {productsData.total_pages}
                  </span>
                  <Button 
                    variant="outline"
                    onClick={() => setPage(p => Math.min(productsData.total_pages, p + 1))}
                    disabled={page === productsData.total_pages}
                    className="h-14 rounded-2xl border-2 border-mist text-bark font-bold gap-2 px-8"
                  >
                     Next <ChevronRight className="w-5 h-5" />
                  </Button>
               </div>
            )}

            {/* Seller Reviews Aggregation Section */}
            <section className="pt-24 space-y-12">
               <Separator className="bg-mist-dark/20" />
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-1">
                     <h3 className="text-3xl font-display font-bold text-bark italic">Customer Chronicles</h3>
                     <p className="text-sm text-bark/40 font-medium italic">Hear from the Flora community about their experiences.</p>
                  </div>
                  <div className="flex items-center gap-4 p-6 bg-white rounded-3xl border border-mist-dark/10 shadow-soft">
                     <div className="text-center space-y-1 pr-6 border-r border-mist-dark/10">
                        <p className="text-4xl font-display font-bold text-rose">{initialSeller.seller_ratings?.average_rating || '5.0'}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Average Score</p>
                     </div>
                     <div className="space-y-1.5 min-w-[120px]">
                        {[5, 4, 3, 2, 1].map((star) => (
                           <div key={star} className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-bark/40 w-3">{star}</span>
                              <div className="flex-1 h-1.5 bg-mist rounded-full overflow-hidden">
                                 <div className="h-full bg-rose" style={{ width: `${initialSeller.seller_ratings?.rating_breakdown?.[star] || 20}%` }} />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </section>
         </div>
      </div>
    </div>
  );
}
