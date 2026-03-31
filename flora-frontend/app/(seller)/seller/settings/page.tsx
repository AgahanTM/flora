"use client";

import { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, ShieldCheck, Landmark, Clock, 
  MapPin, Calendar, Camera, Upload, 
  CheckCircle2, AlertCircle, Plus, 
  Trash2, Copy, Save, Loader2,
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

import { apiClient } from '@/lib/api/client';
import { 
  Seller, SellerDocument, SellerBankDetails, 
  SellerWorkingHours, DeliveryZone, TimeSlot 
} from '@/lib/types/seller';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

const TABS = [
  { id: 'profile', label: 'Shop Profile', icon: <User className="w-4 h-4" /> },
  { id: 'kyc', label: 'Documents', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'bank', label: 'Bank Details', icon: <Landmark className="w-4 h-4" /> },
  { id: 'hours', label: 'Working Hours', icon: <Clock className="w-4 h-4" /> },
  { id: 'zones', label: 'Delivery Zones', icon: <MapPin className="w-4 h-4" /> },
  { id: 'slots', label: 'Time Slots', icon: <Calendar className="w-4 h-4" /> },
];

function SellerSettingsContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['seller-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/profile');
      return data;
    }
  });

  const setActiveTab = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id);
    router.push(`/seller/settings?${params.toString()}`);
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-12 h-12 text-rose animate-spin" />
      </div>
    );
  }

  const seller = profile?.seller as Seller;

  return (
    <div className="container mx-auto px-6 max-w-6xl pt-12 space-y-12">
      <header className="flex items-center gap-6">
        <button 
          onClick={() => router.push('/seller/dashboard')} 
          className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Business Configuration</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-bark italic">Boutique Settings</h1>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Tabs / Mobile Horizontal Scroll */}
        <aside className="lg:w-64 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 gap-2 -mx-6 px-6 lg:mx-0 lg:px-0 scrollbar-hide snap-x">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-none lg:w-full flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold transition-all snap-start",
                activeTab === tab.id 
                  ? "bg-rose text-white shadow-lg shadow-rose/20" 
                  : "bg-white text-bark/40 hover:text-rose shadow-sm border border-mist-dark/5"
              )}
            >
              <div className={cn(
                "p-1.5 lg:p-2 rounded-lg lg:rounded-xl transition-colors",
                activeTab === tab.id ? "bg-white/20" : "bg-mist/30"
              )}>
                {tab.icon}
              </div>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Tab Content */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[2.5rem] border border-mist-dark/10 shadow-premium p-8 lg:p-12"
            >
              {activeTab === 'profile' && <ProfileTab seller={seller} />}
              {activeTab === 'kyc' && <KycTab sellerId={seller.id} />}
              {activeTab === 'bank' && <BankTab sellerId={seller.id} currentBank={profile.bank_details} />}
              {activeTab === 'hours' && <HoursTab sellerId={seller.id} currentHours={profile.working_hours} />}
              {activeTab === 'zones' && <ZonesTab sellerId={seller.id} currentZones={profile.delivery_zones} />}
              {activeTab === 'slots' && <SlotsTab sellerId={seller.id} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ProfileTab({ seller }: { seller: Seller }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    shop_name: seller.shop_name,
    description: seller.description || '',
    logo_url: seller.logo_url || '',
    cover_url: seller.cover_url || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/seller/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      toast.success('Profile updated successfully');
    }
  });

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-bark italic">Shop Identity</h2>
        <p className="text-sm text-bark/60">Manage how your boutique appears to customers across the platform.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Shop Name</label>
          <Input 
            value={formData.shop_name} 
            onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
            placeholder="e.g. Flora Luxe Bloom"
            className="h-14 rounded-2xl border-mist-dark/10 focus:border-rose/30"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Logo URL</label>
              <div className="relative group">
                 <Input 
                   value={formData.logo_url} 
                   onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                   placeholder="https://..."
                   className="h-14 rounded-2xl border-mist-dark/10 focus:border-rose/30 pl-14"
                 />
                 <Camera className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-bark/20 group-focus-within:text-rose transition-colors" />
              </div>
           </div>
           
           <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Cover URL</label>
              <div className="relative group">
                 <Input 
                   value={formData.cover_url} 
                   onChange={(e) => setFormData({...formData, cover_url: e.target.value})}
                   placeholder="https://..."
                   className="h-14 rounded-2xl border-mist-dark/10 focus:border-rose/30 pl-14"
                 />
                 <Upload className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-bark/20 group-focus-within:text-rose transition-colors" />
              </div>
           </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Boutique Description</label>
          <Textarea 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Tell your customers about your unique floral style..."
            className="min-h-[160px] rounded-2xl border-mist-dark/10 focus:border-rose/30 p-5"
          />
        </div>

        <div className="pt-6 border-t border-mist-dark/5 flex justify-end">
           <Button 
             onClick={() => updateMutation.mutate(formData)}
             disabled={updateMutation.isPending}
             className="bg-bark hover:bg-rose text-white h-14 px-10 rounded-2xl font-bold gap-3 shadow-xl shadow-bark/10"
           >
              {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
           </Button>
        </div>
      </div>
    </div>
  );
}

function KycTab({ sellerId }: { sellerId: string }) {
  const queryClient = useQueryClient();
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');

  const { data: documents } = useQuery({
    queryKey: ['seller-documents'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/profile');
      return data.documents as SellerDocument[];
    }
  });

  const uploadMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/seller/documents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      setActiveForm(null);
      setFileUrl('');
      toast.success('Document submitted for review');
    }
  });

  const docTypes = [
    { type: 'id_card', label: 'ID Card / Passport' },
    { type: 'business_license', label: 'Business License' },
    { type: 'tax_certificate', label: 'Tax Certificate' },
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-bark italic">Legal Verification</h2>
        <p className="text-sm text-bark/60">Maintain your boutique's verified status by uploading the required documents.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {docTypes.map((dt) => {
          const doc = documents?.find(d => d.document_type === dt.type);
          return (
            <div key={dt.type} className="bg-mist/30 rounded-[2rem] p-6 border border-transparent hover:border-rose/20 transition-all flex flex-col justify-between items-center text-center gap-6">
              <div className="space-y-4">
                 <div className={cn(
                   "w-12 h-12 rounded-full flex items-center justify-center mx-auto",
                   doc?.status === 'approved' ? "bg-green-100 text-green-600" :
                   doc?.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-bark/10 text-bark/40"
                 )}>
                    {doc?.status === 'approved' ? <CheckCircle2 className="w-6 h-6" /> : 
                     doc?.status === 'pending' ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                 </div>
                 <h4 className="font-bold text-bark text-sm">{dt.label}</h4>
                 {doc && (
                   <span className={cn(
                     "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                     doc.status === 'approved' ? "bg-green-500/10 text-green-600" :
                     doc.status === 'pending' ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose"
                   )}>
                     {doc.status}
                   </span>
                 )}
              </div>

              {!doc || doc.status === 'rejected' ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setActiveForm(dt.type)}
                  className="rounded-xl border-mist-dark/20 text-xs font-bold w-full"
                >
                  {doc ? 'Re-upload' : 'Upload Now'}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  disabled
                  className="rounded-xl bg-white/50 text-[9px] font-black uppercase tracking-widest w-full"
                >
                  Verified
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 border-2 border-dashed border-rose/30 rounded-[2.5rem] bg-rose/5 space-y-6"
          >
            <div className="flex items-center justify-between">
               <h3 className="font-bold text-bark italic">Upload {docTypes.find(d => d.type === activeForm)?.label}</h3>
               <button onClick={() => setActiveForm(null)} className="text-bark/40 hover:text-rose transition-colors">
                  <Trash2 className="w-5 h-5" />
               </button>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">File URL</label>
               <div className="flex gap-4">
                  <Input 
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-14 rounded-2xl border-mist-dark/10 bg-white"
                  />
                  <Button 
                    onClick={() => uploadMutation.mutate({ document_type: activeForm, file_url: fileUrl })}
                    disabled={!fileUrl || uploadMutation.isPending}
                    className="h-14 px-8 rounded-2xl bg-rose text-white font-bold"
                  >
                     Submit
                  </Button>
               </div>
               <p className="text-[10px] text-bark/40 italic">Please provide a direct link to the clear image or PDF of your document.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// STUBS for remaining tabs to be implemented in next step
function BankTab({ sellerId, currentBank }: { sellerId: string, currentBank?: SellerBankDetails }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    bank_name: currentBank?.bank_name || '',
    account_number: currentBank?.account_number || '',
    account_holder_name: currentBank?.account_holder_name || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/seller/bank-details', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      toast.success('Bank details updated successfully');
    }
  });

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-bark italic">Payout Configuration</h2>
        <p className="text-sm text-bark/60">Manage where your earnings are transferred. Ensure all details match your official bank records.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Bank Name</label>
          <Input 
            value={formData.bank_name} 
            onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
            placeholder="e.g. Rysgal Bank"
            className="h-14 rounded-2xl border-mist-dark/10 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Account Number</label>
              <Input 
                value={formData.account_number} 
                onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                placeholder="2320..."
                className="h-14 rounded-2xl border-mist-dark/10 shadow-sm"
              />
           </div>
           
           <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-bark/40 ml-1">Account Holder Name</label>
              <Input 
                value={formData.account_holder_name} 
                onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})}
                placeholder="Identical to bank documentation"
                className="h-14 rounded-2xl border-mist-dark/10 shadow-sm"
              />
           </div>
        </div>

        <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200/50 flex gap-4">
           <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
           <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
             Withdrawals are processed every Monday for the previous week's cleared orders. Changing bank details mid-week may delay your payout by one cycle.
           </p>
        </div>

        <div className="pt-6 border-t border-mist-dark/5 flex justify-end">
           <Button 
             onClick={() => updateMutation.mutate(formData)}
             disabled={updateMutation.isPending}
             className="bg-bark hover:bg-rose text-white h-14 px-10 rounded-2xl font-bold gap-3 shadow-xl shadow-bark/10"
           >
              {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Update Account
           </Button>
        </div>
      </div>
    </div>
  );
}

function HoursTab({ sellerId, currentHours }: { sellerId: string, currentHours: SellerWorkingHours[] }) {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState<Partial<SellerWorkingHours>[]>(
    [0, 1, 2, 3, 4, 5, 6].map(day => {
      const existing = currentHours?.find(h => h.day_of_week === day);
      return existing || { day_of_week: day, open_time: '09:00:00', close_time: '18:00:00', is_closed: false };
    })
  );

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/seller/working-hours', { schedules: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      toast.success('Schedules updated successfully');
    }
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const toggleDay = (dayIndex: number) => {
    setHours(prev => prev.map((h, i) => i === dayIndex ? { ...h, is_closed: !h.is_closed } : h));
  };

  const updateTime = (dayIndex: number, field: 'open_time' | 'close_time', val: string) => {
    // Append :00 to HH:MM if needed
    const timeVal = val.length === 5 ? `${val}:00` : val;
    setHours(prev => prev.map((h, i) => i === dayIndex ? { ...h, [field]: timeVal } : h));
  };

  const copyToWeekdays = () => {
    const monday = hours[1];
    setHours(prev => prev.map((h, i) => i > 1 && i < 6 ? { ...h, open_time: monday.open_time, close_time: monday.close_time, is_closed: monday.is_closed } : h));
    toast.success('Copied Monday settings to all weekdays');
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-bark italic">Operation Schedule</h2>
          <p className="text-sm text-bark/60">Define when your boutique is available for order fulfillment.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyToWeekdays}
          className="rounded-xl border-mist-dark/10 h-10 px-4 font-bold gap-2 text-bark hover:text-rose"
        >
          <Copy className="w-4 h-4" />
          Copy Mon to Fri
        </Button>
      </div>

      <div className="space-y-3">
        {hours.map((day, i) => (
          <div key={i} className={cn(
            "p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center gap-6",
            day.is_closed ? "bg-mist/10 border-transparent grayscale brightness-95" : "bg-white border-mist-dark/5 shadow-soft hover:border-rose/20"
          )}>
            <div className="w-32">
               <p className="font-bold text-bark">{dayNames[i]}</p>
               <button 
                 onClick={() => toggleDay(i)}
                 className={cn(
                   "text-[10px] font-black uppercase tracking-widest transition-colors",
                   day.is_closed ? "text-rose" : "text-bark/30 hover:text-bark"
                 )}
               >
                 {day.is_closed ? 'Closed' : 'Mark Closed'}
               </button>
            </div>

            <div className="flex-1 flex items-center gap-4">
               <div className="flex-1 space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-bark/40 ml-1">Open</label>
                  <Input 
                    type="time" 
                    disabled={day.is_closed}
                    value={day.open_time?.slice(0, 5)}
                    onChange={(e) => updateTime(i, 'open_time', e.target.value)}
                    className="h-12 rounded-xl bg-mist/30 border-transparent focus:bg-white"
                  />
               </div>
               <div className="pt-6 text-bark/20">—</div>
               <div className="flex-1 space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-bark/40 ml-1">Close</label>
                  <Input 
                    type="time" 
                    disabled={day.is_closed}
                    value={day.close_time?.slice(0, 5)}
                    onChange={(e) => updateTime(i, 'close_time', e.target.value)}
                    className="h-12 rounded-xl bg-mist/30 border-transparent focus:bg-white"
                  />
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-mist-dark/5 flex justify-end">
         <Button 
           onClick={() => updateMutation.mutate(hours)}
           disabled={updateMutation.isPending}
           className="bg-bark hover:bg-rose text-white h-14 px-10 rounded-2xl font-bold gap-3 shadow-xl shadow-bark/10"
         >
            {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Schedule
         </Button>
      </div>
    </div>
  );
}
function ZonesTab({ sellerId, currentZones }: { sellerId: string, currentZones: { id: string, name: string }[] }) {
  const queryClient = useQueryClient();
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>(currentZones?.map(z => z.id) || []);

  const { data: allZones } = useQuery({
    queryKey: ['admin-delivery-zones'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/delivery/zones');
      return data as DeliveryZone[];
    }
  });

  const updateMutation = useMutation({
    mutationFn: (zone_ids: string[]) => apiClient.put('/seller/delivery-zones', { zone_ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      toast.success('Delivery zones updated');
    }
  });

  const toggleZone = (id: string) => {
    setSelectedZoneIds(prev => 
      prev.includes(id) ? prev.filter(zid => zid !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-bark italic">Coverage Area</h2>
        <p className="text-sm text-bark/60">Select the geographic zones where your boutique provides direct delivery services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {allZones?.map((zone) => (
           <label 
             key={zone.id}
             className={cn(
               "p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center justify-between group",
               selectedZoneIds.includes(zone.id) 
                 ? "bg-rose/5 border-rose/30 shadow-md" 
                 : "bg-white border-mist-dark/10 hover:border-rose/20"
             )}
           >
              <div className="space-y-1">
                 <p className="font-bold text-bark group-hover:text-rose transition-colors">{zone.name}</p>
                 <p className="text-[10px] text-bark/40 italic">{zone.description || 'Standard delivery zone'}</p>
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={selectedZoneIds.includes(zone.id)}
                onChange={() => toggleZone(zone.id)}
              />
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                selectedZoneIds.includes(zone.id) ? "bg-rose border-rose text-white" : "border-mist-dark/20 text-transparent"
              )}>
                 <CheckCircle2 className="w-4 h-4" />
              </div>
           </label>
         ))}
      </div>

      <div className="pt-6 border-t border-mist-dark/5 flex justify-end">
         <Button 
           onClick={() => updateMutation.mutate(selectedZoneIds)}
           disabled={updateMutation.isPending}
           className="bg-bark hover:bg-rose text-white h-14 px-10 rounded-2xl font-bold gap-3 shadow-xl shadow-bark/10"
         >
            {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Coverage
         </Button>
      </div>
    </div>
  );
}

function SlotsTab({ sellerId }: { sellerId: string }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    slot_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00:00',
    end_time: '12:00:00',
    max_orders: 5,
    price_modifier: '0.00'
  });

  const { data: slots, isLoading } = useQuery({
    queryKey: ['seller-delivery-slots'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/delivery/time-slots');
      return data as TimeSlot[];
    }
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/seller/delivery/time-slots', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-delivery-slots'] });
      setIsAdding(false);
      toast.success('Time slot created');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (slotId: string) => apiClient.delete(`/seller/delivery/time-slots/${slotId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-delivery-slots'] });
      toast.success('Time slot removed');
    }
  });

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-bark italic">Delivery Availability</h2>
          <p className="text-sm text-bark/60">Configure specific bookable time slots for customers.</p>
        </div>
        {!isAdding && (
          <Button 
            onClick={() => setIsAdding(true)}
            className="bg-rose text-white h-12 rounded-xl font-bold gap-2 px-6"
          >
            <Plus className="w-5 h-5" /> Add Slot
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-8 border-2 border-rose/30 rounded-[2.5rem] bg-rose/5 space-y-8 overflow-hidden"
          >
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-bark/40">Date</label>
                   <Input 
                     type="date" 
                     value={formData.slot_date}
                     onChange={(e) => setFormData({...formData, slot_date: e.target.value})}
                     className="h-12 rounded-xl bg-white border-mist-dark/10"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-bark/40">Start Time</label>
                   <Input 
                     type="time" 
                     value={formData.start_time.slice(0, 5)}
                     onChange={(e) => setFormData({...formData, start_time: `${e.target.value}:00`})}
                     className="h-12 rounded-xl bg-white border-mist-dark/10"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-bark/40">End Time</label>
                   <Input 
                     type="time" 
                     value={formData.end_time.slice(0, 5)}
                     onChange={(e) => setFormData({...formData, end_time: `${e.target.value}:00`})}
                     className="h-12 rounded-xl bg-white border-mist-dark/10"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-bark/40">Capacity (Orders)</label>
                   <Input 
                     type="number" 
                     value={formData.max_orders}
                     onChange={(e) => setFormData({...formData, max_orders: parseInt(e.target.value)})}
                     className="h-12 rounded-xl bg-white border-mist-dark/10"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-bark/40">Price Fee (TMT)</label>
                   <Input 
                     type="text" 
                     value={formData.price_modifier}
                     onChange={(e) => setFormData({...formData, price_modifier: e.target.value})}
                     className="h-12 rounded-xl bg-white border-mist-dark/10"
                   />
                </div>
             </div>
             
             <div className="flex justify-end gap-3 pt-4 border-t border-rose/10">
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl font-bold h-12 px-6">Cancel</Button>
                <Button 
                   onClick={() => addMutation.mutate(formData)}
                   disabled={addMutation.isPending}
                   className="bg-bark text-white h-12 rounded-xl font-bold px-10 shadow-lg shadow-bark/10"
                >
                   {addMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Slot'}
                </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
         {isLoading ? (
           <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose/30" /></div>
         ) : slots && slots.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slots.map((slot) => (
                <div key={slot.id} className="p-6 bg-white rounded-[2rem] border border-mist-dark/10 shadow-soft flex items-center justify-between group">
                   <div className="flex items-center gap-6">
                      <div className="p-4 bg-mist/30 rounded-2xl text-bark/20">
                         <Calendar className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                         <div className="flex items-center gap-2">
                           <p className="font-bold text-bark">{format(new Date(slot.slot_date), 'MMM dd, yyyy')}</p>
                           {parseFloat(slot.price_modifier) > 0 && (
                             <span className="text-[9px] font-black text-rose bg-rose/5 px-2 py-0.5 rounded-full">+{slot.price_modifier} TMT</span>
                           )}
                         </div>
                         <p className="text-xs text-muted-foreground">{slot.start_time.slice(0, 5)} — {slot.end_time.slice(0, 5)}</p>
                         <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                               <span className="text-[10px] font-bold text-bark/60">{slot.booked_orders}/{slot.max_orders} Booked</span>
                            </div>
                         </div>
                      </div>
                   </div>
                   <button 
                     disabled={deleteMutation.isPending}
                     onClick={() => deleteMutation.mutate(slot.id)}
                     className="p-3 opacity-0 group-hover:opacity-100 bg-rose/5 text-rose rounded-xl hover:bg-rose hover:text-white transition-all"
                   >
                      <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              ))}
           </div>
         ) : (
           <div className="py-32 text-center bg-mist/10 rounded-[3rem] border-2 border-dashed border-mist-dark/10 space-y-4">
              <Calendar className="w-16 h-16 mx-auto text-bark/10" />
              <p className="font-display font-medium text-bark/40">No time slots configured yet.</p>
           </div>
         )}
      </div>
    </div>
  );
}

export default function SellerSettingsPage() {
  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream/30">
          <Loader2 className="w-12 h-12 text-rose animate-spin" />
        </div>
      }>
        <SellerSettingsContent />
      </Suspense>
    </div>
  );
}
