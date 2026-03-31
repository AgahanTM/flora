"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Zap, Plus, Search, Filter, 
  Trash2, Edit3, CheckCircle2, 
  XCircle, Calendar, Users, 
  Tag, Percent, DollarSign,
  Loader2, MoreVertical, Store,
  AlertCircle, ChevronRight, Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { apiClient } from '@/lib/api/client';
import { adminApi } from '@/lib/api/admin';
import { Promotion, PromotionCreateInput } from '@/lib/types/promotion';
import { Seller } from '@/lib/types/seller';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

export default function AdminPromotionsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: async () => {
      const { data } = await adminApi.getPromotions();
      return data as Promotion[];
    }
  });

  const { data: sellers } = useQuery({
    queryKey: ['admin-sellers-all'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/sellers');
      return data as Seller[];
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string, is_active: boolean }) => 
      apiClient.put(`/admin/promotions/${id}`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      toast.success('Campaign status updated');
    }
  });

  const filteredPromos = promotions?.filter(p => 
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <Zap className="w-4 h-4" />
            Marketing Registry
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">Promotional Nexus</h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative w-full md:w-80 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bark/20 group-focus-within:text-rose transition-colors" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search promotion code..."
                className="h-14 pl-14 rounded-2xl border-mist-dark/10 bg-white shadow-sm"
              />
           </div>
           <Button 
             onClick={() => setIsCreateModalOpen(true)}
             className="h-14 px-8 rounded-2xl bg-rose text-white font-bold gap-3 shadow-xl shadow-rose/20"
           >
              <Plus className="w-5 h-5" /> Launch Campaign
           </Button>
        </div>
      </header>

      {/* Promotion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {isLoading ? (
           <div className="col-span-full py-24 text-center"><Loader2 className="w-12 h-12 animate-spin text-rose/30 mx-auto" /></div>
         ) : filteredPromos && filteredPromos.length > 0 ? (
           filteredPromos.map((promo) => (
             <motion.div 
               key={promo.id}
               layout
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-[2.5rem] p-10 border border-mist-dark/10 shadow-premium relative group overflow-hidden"
             >
                {/* Status Indicator */}
                <div className={cn(
                  "absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest",
                  promo.is_active ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose"
                )}>
                   {promo.is_active ? 'Active' : 'Paused'}
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="p-4 bg-mist/30 rounded-2xl group-hover:bg-rose/10 group-hover:text-rose transition-all">
                         {promo.discount_type === 'percentage' ? <Percent className="w-6 h-6" /> : <Tag className="w-6 h-6" />}
                      </div>
                      <div>
                         <p className="text-2xl font-display font-bold text-bark uppercase tracking-tight">{promo.code}</p>
                         <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 italic">{promo.discount_type === 'percentage' ? `${promo.discount_value}% Discount` : `${formatPrice(parseFloat(promo.discount_value))} OFF`}</p>
                      </div>
                   </div>

                   <p className="text-sm text-bark/60 font-medium leading-relaxed">
                      {promo.description || 'Global promotional credit for boutique shoppers.'}
                   </p>

                   <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black uppercase tracking-widest text-bark/30">Usage</p>
                         <p className="font-bold text-bark">{promo.usage_count} / {promo.usage_limit || '∞'}</p>
                      </div>
                      <div className="space-y-1 text-center">
                         <p className="text-[9px] font-black uppercase tracking-widest text-bark/30">Min. Exp</p>
                         <p className="font-bold text-bark">{promo.min_order_amount ? formatPrice(parseFloat(promo.min_order_amount)) : 'N/A'}</p>
                      </div>
                      <div className="space-y-1 text-right">
                         <p className="text-[9px] font-black uppercase tracking-widest text-bark/30">Expiry</p>
                         <p className="font-bold text-rose italic">{format(new Date(promo.ends_at), 'MMM dd')}</p>
                      </div>
                   </div>

                   {promo.seller_id && (
                     <div className="flex items-center gap-2 p-3 bg-mist/10 rounded-xl border border-mist-dark/5">
                        <Store className="w-3.5 h-3.5 text-bark/40" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-bark/40">Scoped To Vendor: {promo.seller_id.slice(0, 8)}</span>
                     </div>
                   )}

                   <div className="flex items-center justify-between pt-6 mt-6 border-t border-mist-dark/5">
                      <div className="flex items-center gap-2">
                         <button className="p-2.5 bg-mist/30 rounded-xl text-bark hover:bg-rose hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                         <button className="p-2.5 bg-mist/30 rounded-xl text-bark hover:bg-rose hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleStatusMutation.mutate({ id: promo.id, is_active: !promo.is_active })}
                        className={cn(
                          "h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest border-mist-dark/20",
                          promo.is_active ? "text-rose hover:bg-rose hover:text-white" : "text-green-600 hover:bg-green-600 hover:text-white"
                        )}
                      >
                         {promo.is_active ? <Ban className="w-3.5 h-3.5 mr-2" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-2" />}
                         {promo.is_active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                   </div>
                </div>
             </motion.div>
           ))
         ) : (
           <div className="col-span-full py-24 text-center font-display text-bark/20 italic">No marketing campaigns archived in this registry</div>
         )}
      </div>

      {/* Create Modal placeholder (Form logic omitted for brevity, focusing on scaffolding) */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto"
             >
                <div className="space-y-2">
                   <h3 className="text-3xl font-display font-bold text-bark italic">Launch New Campaign</h3>
                   <p className="text-sm text-bark/60">Broadcast a platform-wide or vendor-specific promotional code.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Promotion Code</label>
                      <Input placeholder="FLORA100" className="h-14 rounded-2xl" />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Discount Type</label>
                      <select className="w-full h-14 px-5 rounded-2xl border border-mist-dark/10 bg-mist/5 font-bold text-bark">
                         <option>Percentage (%)</option>
                         <option>Fixed Amount (TMT)</option>
                      </select>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Value</label>
                      <Input type="number" placeholder="10" className="h-14 rounded-2xl" />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Seller Scope (Optional)</label>
                      <select className="w-full h-14 px-5 rounded-2xl border border-mist-dark/10 bg-mist/5 font-bold text-bark">
                         <option value="">Global Platform</option>
                         {sellers?.map(s => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
                      </select>
                   </div>
                </div>

                <div className="flex gap-4 pt-6">
                   <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsCreateModalOpen(false)}>Retreat</Button>
                   <Button className="flex-1 h-14 rounded-2xl bg-rose text-white font-bold shadow-xl shadow-rose/20">Finalize Blast</Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
