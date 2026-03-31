"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ImageIcon, Plus, Search, Filter, 
  Trash2, Edit3, CheckCircle2, 
  XCircle, Calendar, Layout, 
  ExternalLink, ChevronRight, 
  Clock, AlertCircle, Loader2,
  Monitor, Smartphone, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { format } from 'date-fns';

import { adminApi } from '@/lib/api/admin';
import { Banner, BannerPosition } from '@/lib/types/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

const POSITIONS: { id: BannerPosition, label: string, desc: string }[] = [
  { id: 'home_top', label: 'Home Hero', desc: 'Main promotional slider at the top of homepage' },
  { id: 'home_mid', label: 'Home Midway', desc: 'Promotional break between featured collections' },
  { id: 'category_page', label: 'Category Header', desc: 'Campaign strip on top of product listings' },
];

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data } = await adminApi.getBanners();
      return data as Banner[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setDeletingId(null);
      toast.success('Visual asset removed');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string, is_active: boolean }) => 
      adminApi.updateBanner(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Visibility toggled');
    }
  });

  const getBannersByPosition = (pos: BannerPosition) => {
    return banners?.filter(b => b.position === pos) || [];
  };

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <Layout className="w-4 h-4" />
            Visual Identity
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">Storefront Banners</h1>
        </div>

        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="h-14 px-8 rounded-2xl bg-rose text-white font-bold gap-3 shadow-xl shadow-rose/20"
        >
           <Plus className="w-5 h-5" /> Design Asset
        </Button>
      </header>

      {/* Grouped Content */}
      <div className="space-y-20">
         {POSITIONS.map((pos) => (
           <section key={pos.id} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="space-y-1">
                    <h3 className="text-xl font-display font-bold text-bark italic flex items-center gap-3">
                       <Monitor className="w-6 h-6 text-rose" /> 
                       {pos.label}
                    </h3>
                    <p className="text-xs text-bark/40 font-medium">{pos.desc}</p>
                 </div>
                 <div className="h-px border-t border-mist-dark/10 flex-1 hidden md:block mx-8" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-bark/20">
                    {getBannersByPosition(pos.id).length} Active Assets
                 </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {isLoading ? (
                   <div className="col-span-full py-12 text-center text-bark/20 italic">Scanning creative index...</div>
                 ) : getBannersByPosition(pos.id).length > 0 ? (
                   getBannersByPosition(pos.id).map((banner) => (
                     <motion.div 
                       key={banner.id}
                       layout
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="bg-white rounded-[2.5rem] p-8 border border-mist-dark/10 shadow-soft group hover:shadow-premium transition-all"
                     >
                        <div className="relative aspect-[16/6] rounded-3xl bg-mist overflow-hidden border border-mist-dark/10 mb-6">
                           <Image src={banner.image_url} alt={banner.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                           <div className="absolute top-4 right-4 flex gap-2">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl",
                                banner.is_active ? "bg-green-500 text-white" : "bg-rose text-white"
                              )}>
                                 {banner.is_active ? 'Visible' : 'Inactive'}
                              </span>
                           </div>
                           <div className="absolute inset-0 bg-bark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                              <button className="p-3 bg-white/20 rounded-2xl text-white hover:bg-white hover:text-rose transition-all"><Eye className="w-5 h-5" /></button>
                              <button className="p-3 bg-white/20 rounded-2xl text-white hover:bg-white hover:text-rose transition-all"><Edit3 className="w-5 h-5" /></button>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="font-bold text-bark group-hover:text-rose transition-colors">{banner.title}</h4>
                           <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-bark/30">
                              <div className="flex items-center gap-2">
                                 <Clock className="w-3.5 h-3.5" />
                                 {banner.starts_at ? format(new Date(banner.starts_at), 'MMM dd') : 'Permanent'} 
                                 {banner.ends_at && ` — ${format(new Date(banner.ends_at), 'MMM dd')}`}
                              </div>
                              <div className="flex items-center gap-2">
                                 <Layout className="w-3.5 h-3.5" /> Order: {banner.sort_order}
                              </div>
                           </div>

                           <div className="pt-6 mt-6 border-t border-mist-dark/5 flex items-center justify-between">
                              <button 
                                onClick={() => toggleStatusMutation.mutate({ id: banner.id, is_active: !banner.is_active })}
                                className="text-[10px] font-black uppercase tracking-widest text-bark/30 hover:text-rose transition-colors"
                              >
                                 {banner.is_active ? 'Vault Asset' : 'Deploy Live'}
                              </button>
                              <button 
                                onClick={() => setDeletingId(banner.id)}
                                className="p-2 text-bark/20 hover:text-rose transition-colors"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     </motion.div>
                   ))
                 ) : (
                   <div className="col-span-full py-16 text-center bg-mist/5 rounded-[2.5rem] border-2 border-dashed border-mist-dark/10 space-y-4">
                      <ImageIcon className="w-12 h-12 mx-auto text-bark/10" />
                      <p className="text-sm font-display font-medium text-bark/30">No creative assets deployed here yet.</p>
                      <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-rose">Launch New Creative</Button>
                   </div>
                 )}
              </div>
           </section>
         ))}
      </div>

      {/* Modals placeholders */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl space-y-8"
             >
                <div className="space-y-2">
                   <h3 className="text-3xl font-display font-bold text-bark italic">New Creative Asset</h3>
                   <p className="text-sm text-bark/60">Upload and configure a high-impact promotional banner.</p>
                </div>

                <div className="space-y-6">
                   <Input placeholder="Banner Title (Internal Ref)" className="h-14 rounded-2xl" />
                   <div className="grid grid-cols-2 gap-4">
                      <select className="h-14 px-5 rounded-2xl border border-mist-dark/10 bg-mist/5 font-bold text-bark">
                         {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                      <Input type="number" placeholder="Sort Order" className="h-14 rounded-2xl" />
                   </div>
                   <Input placeholder="Direct Image URL" className="h-14 rounded-2xl" />
                   <Input placeholder="Destination Link (Optional)" className="h-14 rounded-2xl" />
                </div>

                <div className="flex gap-4">
                   <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsCreateModalOpen(false)}>Retreat</Button>
                   <Button className="flex-1 h-14 rounded-2xl bg-rose text-white font-bold">Deploy Live</Button>
                </div>
             </motion.div>
          </div>
        )}

        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl text-center space-y-8"
             >
                <div className="w-20 h-20 bg-rose/10 text-rose rounded-full mx-auto flex items-center justify-center mb-6">
                   <AlertCircle className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-display font-bold text-bark italic">Confirm Disposal</h3>
                   <p className="text-sm text-bark/60 leading-relaxed">This visual asset will be permanently erased from the platform registry. Proceed?</p>
                </div>
                <div className="flex gap-4">
                   <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setDeletingId(null)}>Halt</Button>
                   <Button 
                    variant="danger" 
                    className="flex-1 h-12 rounded-xl bg-rose text-white font-bold"
                    onClick={() => deleteMutation.mutate(deletingId)}
                   >
                     {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Disposal'}
                   </Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
