"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Truck, Plus, Search, MapPin, 
  Map as MapIcon, ShieldCheck, 
  Phone, Smartphone, Navigation,
  Loader2, BadgeCheck, XCircle, 
  AlertCircle, ChevronRight,
  Globe, DollarSign, FileJson
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { adminApi } from '@/lib/api/admin';
import { Courier } from '@/lib/types/courier';
import { DeliveryZone } from '@/lib/types/admin_system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

export default function AdminCouriersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'fleet' | 'zones'>('fleet');
  const [isAddCourierOpen, setIsAddCourierOpen] = useState(false);
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);

  const { data: couriers, isLoading: isFleetLoading } = useQuery({
    queryKey: ['admin-couriers'],
    queryFn: async () => {
      const { data } = await adminApi.getCouriers();
      return data as Courier[];
    }
  });

  const { data: zones, isLoading: isZonesLoading } = useQuery({
    queryKey: ['admin-delivery-zones'],
    queryFn: async () => {
      const { data } = await adminApi.getDeliveryZones();
      return data as DeliveryZone[];
    }
  });

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-12 space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
            <Navigation className="w-4 h-4" />
            Last-Mile Operations
          </div>
          <h1 className="text-4xl font-display font-bold text-bark italic">Logistics Hub</h1>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-mist/30 rounded-2xl">
           <button
             onClick={() => setActiveTab('fleet')}
             className={cn(
               "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'fleet' ? "bg-white text-rose shadow-sm" : "text-bark/40 hover:text-bark"
             )}
           >
             Active Fleet
           </button>
           <button
             onClick={() => setActiveTab('zones')}
             className={cn(
               "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'zones' ? "bg-white text-rose shadow-sm" : "text-bark/40 hover:text-bark"
             )}
           >
             Delivery Zones
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="bg-white rounded-[3rem] border border-mist-dark/10 shadow-premium overflow-hidden">
         {activeTab === 'fleet' ? (
           <div className="space-y-8">
              <div className="p-8 border-b border-mist-dark/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-mist/5">
                 <div className="flex items-center gap-6">
                    <div className="bg-bark text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg shadow-bark/10">
                       <Truck className="w-5 h-5" />
                       <span className="text-sm font-bold">{couriers?.length || 0} Registered Units</span>
                    </div>
                 </div>
                 <Button 
                   onClick={() => setIsAddCourierOpen(true)}
                   className="h-14 px-8 rounded-2xl bg-rose text-white font-bold gap-3 shadow-xl shadow-rose/20"
                 >
                    <Plus className="w-5 h-5" /> Onboard Courier
                 </Button>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="text-[10px] font-black uppercase tracking-widest text-bark/30 border-b border-mist-dark/5">
                          <th className="px-8 py-6">Operator</th>
                          <th className="px-8 py-6">Asset Info</th>
                          <th className="px-8 py-6">Contact</th>
                          <th className="px-8 py-6">Telemetry</th>
                          <th className="px-8 py-6 text-right">Visibility</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-mist-dark/5">
                       {isFleetLoading ? (
                         <tr><td colSpan={5} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30 mx-auto" /></td></tr>
                       ) : couriers && couriers.length > 0 ? (
                         couriers.map((courier) => (
                           <tr key={courier.id} className="group hover:bg-cream/20 transition-colors">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-mist flex items-center justify-center text-bark/20 group-hover:bg-rose/10 group-hover:text-rose transition-all">
                                       <BadgeCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                       <p className="font-bold text-bark">{courier.full_name}</p>
                                       <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 italic">ID: {courier.id.slice(0, 8)}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                       <Smartphone className="w-3.5 h-3.5 text-bark/30" />
                                       <span className="text-xs font-bold text-bark uppercase tracking-widest">{courier.vehicle_type}</span>
                                    </div>
                                    <p className="text-[10px] font-medium text-bark/40 italic">{courier.vehicle_plate || 'Unregistered Plate'}</p>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-2 text-bark hover:text-rose transition-colors cursor-pointer">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm font-medium">{courier.phone}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full animate-pulse",
                                      courier.is_active ? "bg-green-500" : "bg-rose-500"
                                    )} />
                                    <span className="text-xs font-medium text-bark/60">
                                       {courier.last_location_update ? 'Signal Optimized' : 'Offline'}
                                    </span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <span className={cn(
                                   "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                   courier.is_active ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose"
                                 )}>
                                    {courier.is_active ? 'Online' : 'Resting'}
                                 </span>
                              </td>
                           </tr>
                         ))
                       ) : (
                         <tr><td colSpan={5} className="py-24 text-center font-display text-bark/20 italic">No fleet units found in this sector</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
         ) : (
           <div className="space-y-8">
              <div className="p-8 border-b border-mist-dark/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-mist/5">
                 <div className="flex items-center gap-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 italic">Geographic Boundary Dispatch</p>
                 </div>
                 <Button 
                   onClick={() => setIsAddZoneOpen(true)}
                   className="h-14 px-8 rounded-2xl bg-bark text-white font-bold gap-3 shadow-xl shadow-bark/20"
                 >
                    <Plus className="w-5 h-5" /> Define Zone
                 </Button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {isZonesLoading ? (
                   <div className="col-span-full py-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30 mx-auto" /></div>
                 ) : zones && zones.length > 0 ? (
                   zones.map((zone) => (
                     <motion.div 
                       key={zone.id}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="bg-white rounded-[2.5rem] p-8 border border-mist-dark/10 shadow-soft group hover:shadow-premium transition-all"
                     >
                        <div className="flex items-center justify-between mb-8">
                           <div className="w-14 h-14 rounded-2xl bg-mist flex items-center justify-center text-bark/20 group-hover:bg-rose/10 group-hover:text-rose transition-all">
                              <MapIcon className="w-8 h-8" />
                           </div>
                           <span className={cn(
                             "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                             zone.is_active ? "bg-green-500 text-white" : "bg-rose text-white"
                           )}>
                              {zone.is_active ? 'Active' : 'Closed'}
                           </span>
                        </div>
                        <h4 className="text-xl font-display font-bold text-bark italic mb-2 group-hover:text-rose transition-colors">{zone.name}</h4>
                        <div className="flex items-center gap-2 mb-8">
                           <DollarSign className="w-3.5 h-3.5 text-bark/30" />
                           <span className="text-xs font-bold text-bark/60 uppercase tracking-widest">Base Logistics: {formatPrice(parseFloat(zone.base_fee))}</span>
                        </div>
                        <div className="p-4 bg-mist/30 rounded-2xl border border-mist-dark/5 flex items-center justify-between group-hover:bg-white transition-all">
                           <div className="flex items-center gap-3">
                              <FileJson className="w-4 h-4 text-bark/20" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-bark/40">GeoJSON Definition</span>
                           </div>
                           <ChevronRight className="w-4 h-4 text-bark/10 group-hover:translate-x-1 transition-transform" />
                        </div>
                     </motion.div>
                   ))
                 ) : (
                   <div className="col-span-full py-24 text-center font-display text-bark/20 italic">No geographic boundaries defined for this platform</div>
                 )}
              </div>
           </div>
         )}
      </div>

      {/* Modals placeholders */}
      <AnimatePresence>
        {isAddCourierOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="bg-white w-full h-full sm:h-auto sm:max-w-lg p-6 sm:p-10 sm:rounded-[2.5rem] shadow-2xl space-y-8 overflow-y-auto"
             >
                <div className="space-y-2 text-center">
                   <h3 className="text-3xl font-display font-bold text-bark italic">Fleet Induction</h3>
                   <p className="text-sm text-bark/60">Register a new courier for last-mile fulfillment.</p>
                </div>
                <div className="space-y-6">
                   <Input placeholder="Full Legal Name" className="h-14 rounded-2xl" />
                   <Input placeholder="Mobile Terminal Protocol (Phone)" className="h-14 rounded-2xl" />
                   <div className="grid grid-cols-2 gap-4">
                      <select className="h-14 px-5 rounded-2xl border border-mist-dark/10 bg-mist/5 font-bold text-bark focus:ring-2 ring-rose/20 outline-none">
                         <option>Motorcycle</option>
                         <option>Bicycle</option>
                         <option>Car</option>
                      </select>
                      <Input placeholder="Vehicle Plate" className="h-14 rounded-2xl" />
                   </div>
                </div>
                <div className="flex gap-4">
                   <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsAddCourierOpen(false)}>Halt</Button>
                   <Button className="flex-1 h-14 rounded-2xl bg-rose text-white font-bold">Finalize Onboarding</Button>
                </div>
             </motion.div>
          </div>
        )}

        {isAddZoneOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="bg-white w-full h-full sm:h-auto sm:max-w-2xl p-6 sm:p-10 sm:rounded-[2.5rem] shadow-2xl space-y-8 overflow-y-auto"
             >
                <div className="space-y-2 text-center">
                   <h3 className="text-3xl font-display font-bold text-bark italic">Boundary Definition</h3>
                   <p className="text-sm text-bark/60">Map a new geographic operational zone.</p>
                </div>
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <Input placeholder="Zone Designation (e.g. Ashgabat North)" className="h-14 rounded-2xl" />
                      <Input placeholder="Base Logistics Fee (TMT)" className="h-14 rounded-2xl" />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1 flex items-center gap-2">
                         <FileJson className="w-3.5 h-3.5" /> GeoJSON Polygon Protocol
                      </label>
                      <textarea 
                        className="w-full h-48 p-5 rounded-[2.5rem] border border-mist-dark/10 bg-mist/5 font-mono text-xs focus:ring-2 ring-rose/20 outline-none resize-none"
                        placeholder='{"type": "Polygon", "coordinates": [...]}'
                      />
                   </div>
                </div>
                <div className="flex gap-4">
                   <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsAddZoneOpen(false)}>Discard</Button>
                   <Button className="flex-1 h-14 rounded-2xl bg-bark text-white font-bold">Activate Boundary</Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
