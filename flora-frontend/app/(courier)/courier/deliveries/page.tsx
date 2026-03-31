"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, MapPin, Navigation, 
  CheckCircle2, XCircle, Clock,
  ArrowRight, Phone, MessageSquare,
  ShieldCheck, Loader2, AlertCircle,
  History, PlaneTakeoff, Truck,
  Settings, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';

import { courierApi } from '@/lib/api/courier';
import { Delivery } from '@/lib/types/courier';
import { DeliveryStatus } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocationTelemetry } from '@/lib/hooks/useLocationTelemetry';

export default function CourierDeliveriesPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'failed'>('active');
  const { isSharing, lastUpdate, error: telemetryError, toggleSharing } = useLocationTelemetry();

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['courier-deliveries', activeTab],
    queryFn: async () => {
      let statusParam = '';
      if (activeTab === 'completed') statusParam = DeliveryStatus.DELIVERED;
      else if (activeTab === 'failed') statusParam = DeliveryStatus.FAILED;
      else statusParam = 'pending,assigned,picked_up,en_route';

      const { data } = await courierApi.getDeliveries(statusParam);
      return data as Delivery[];
    }
  });

  const getStatusIcon = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.ASSIGNED: return <Package className="w-5 h-5" />;
      case DeliveryStatus.PICKED_UP: return <Truck className="w-5 h-5" />;
      case DeliveryStatus.EN_ROUTE: return <PlaneTakeoff className="w-5 h-5" />;
      case DeliveryStatus.DELIVERED: return <CheckCircle2 className="w-5 h-5" />;
      case DeliveryStatus.FAILED: return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const tabs = [
    { id: 'active', label: 'Active', count: deliveries?.length || 0 },
    { id: 'completed', label: 'Completed', count: 0 }, // Stub counts
    { id: 'failed', label: 'Failed', count: 0 },
  ];

  return (
    <div className="min-h-screen bg-mist/20 pb-32">
      {/* Header & Telemetry Status */}
      <header className="bg-white border-b border-mist-dark/10 sticky top-0 z-30 shadow-soft p-6 space-y-4">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-2xl font-display font-bold text-bark italic">Fulfillment Hub</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 flex items-center gap-1.5">
                 {isSharing ? (
                   <>
                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                     Live Telemetry On
                   </>
                 ) : (
                   <>
                     <span className="w-1.5 h-1.5 bg-rose rounded-full" />
                     Tracking Disabled
                   </>
                 )}
              </p>
           </div>
           
           <button 
             onClick={toggleSharing}
             className={cn(
               "p-4 rounded-2xl border-2 transition-all",
               isSharing ? "bg-green-50 border-green-100 text-green-600" : "bg-mist border-mist-dark/10 text-bark/40"
             )}
           >
              {isSharing ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
           </button>
        </div>

        {isSharing && lastUpdate && (
          <div className="flex items-center justify-between px-4 py-2 bg-mist rounded-xl text-[9px] font-bold text-bark/40 italic">
             <span>Last Ping: {format(lastUpdate, 'HH:mm:ss')}</span>
             {telemetryError && <span className="text-rose flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Sync Issue</span>}
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="px-6 pt-8">
         <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-mist-dark/5">
            {['active', 'completed', 'failed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab 
                    ? "bg-bark text-white shadow-lg shadow-bark/20" 
                    : "text-bark/40 hover:text-bark"
                )}
              >
                {tab}
              </button>
            ))}
         </div>
      </div>

      {/* Deliveries List */}
      <main className="px-6 pt-8 space-y-6">
         <AnimatePresence mode="wait">
            {isLoading ? (
               <div className="py-24 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-rose/30 mx-auto" />
               </div>
            ) : deliveries && deliveries.length > 0 ? (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-6"
               >
                  {deliveries.map((delivery) => (
                    <Link key={delivery.id} href={`/courier/deliveries/${delivery.id}`}>
                       <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-mist-dark/5 active:scale-[0.98] transition-all relative overflow-hidden group">
                          {/* Status Indicator */}
                          <div className={cn(
                            "absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full -mr-12 -mt-12 transition-colors",
                            delivery.status === DeliveryStatus.EN_ROUTE ? "bg-amber-500" : "bg-green-500"
                          )} />
                          
                          <div className="space-y-6 relative z-10">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className={cn(
                                     "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                     delivery.status === DeliveryStatus.EN_ROUTE ? "bg-amber-100 text-amber-600" : "bg-mist text-bark/20"
                                   )}>
                                      {getStatusIcon(delivery.status)}
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-bark/30">Order Reference</p>
                                      <h3 className="font-display font-bold text-bark text-lg">#{delivery.order_id.slice(0, 8).toUpperCase()}</h3>
                                   </div>
                                </div>
                                <Badge className="bg-mist text-bark/40 border-none font-bold italic h-8 px-4 rounded-xl">
                                   {delivery.status}
                                </Badge>
                             </div>

                             <div className="space-y-4 pt-2">
                                <div className="flex items-start gap-3">
                                   <Navigation className="w-4 h-4 text-rose shrink-0 mt-1" />
                                   <p className="text-sm font-bold text-bark italic leading-relaxed line-clamp-2">
                                      {delivery.dropoff_address}
                                   </p>
                                </div>
                             </div>

                             <div className="pt-6 border-t border-mist-dark/5 flex items-center justify-between text-bark/30">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                   <Clock className="w-3.5 h-3.5" /> Est: 14:00 – 16:00
                                </div>
                                <div className="flex items-center gap-1.5 text-rose font-bold text-xs group-hover:gap-2 transition-all">
                                   Manage <ArrowRight className="w-4 h-4" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </Link>
                  ))}
               </motion.div>
            ) : (
               <div className="py-24 text-center space-y-6">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-bark/10 mx-auto shadow-inner">
                     <Package className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                     <h4 className="text-2xl font-display font-bold text-bark italic">No Deliveries</h4>
                     <p className="text-bark/30 text-xs max-w-[200px] mx-auto font-medium">Your triage queue is currently empty. New assignments will appear here.</p>
                  </div>
               </div>
            )}
         </AnimatePresence>
      </main>

      {/* Mobile persistent footer logic/styling would go here or in layout */}
    </div>
  );
}
