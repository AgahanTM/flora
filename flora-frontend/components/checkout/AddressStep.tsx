"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Plus, Check, AlertCircle, Loader2, Home, Landmark, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

import { apiClient } from '@/lib/api/client';
import { Address } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isPointInPolygon } from '@/lib/utils/geo';

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  street: z.string().min(1, 'Street is required'),
  building: z.string().min(1, 'Building is required'),
  apartment: z.string().optional(),
  lat: z.preprocess((val) => (val === "" || val === undefined ? undefined : Number(val)), z.number().optional()),
  lng: z.preprocess((val) => (val === "" || val === undefined ? undefined : Number(val)), z.number().optional()),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressStepProps {
  selectedAddressId?: string;
  onSelect: (addressId: string) => void;
  onNext: () => void;
}

export function AddressStep({ selectedAddressId, onSelect, onNext }: AddressStepProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: dataAddresses = [], isLoading: isLoadingAddresses, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await apiClient.get('/addresses');
      return response.data as Address[];
    },
  });

  const { data: zones } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/delivery/zones');
      return response.data as { id: string; name: string; polygon: string }[];
    },
  });

  const addresses = dataAddresses;

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema) as any,
    defaultValues: { city: 'Ashgabat' }
  });

  const onAddAddress = async (data: AddressFormData) => {
    try {
      const response = await apiClient.post('/addresses', { ...data, is_default: false });
      onSelect(response.data.id);
      setShowAddForm(false);
      reset();
      // @ts-ignore
      refetchAddresses();
    } catch (error) {
      console.error('Failed to add address', error);
    }
  };

  const checkZone = (address: Address) => {
    if (!address.lat || !address.lng || !zones || zones.length === 0) return true;
    
    return zones.some(zone => {
      try {
        const polygon = JSON.parse(zone.polygon); // Expected format: [[lat, lng], [lat, lng], ...]
        return isPointInPolygon([address.lat!, address.lng!], polygon);
      } catch (e) {
        return false;
      }
    });
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const isOutsideZone = selectedAddress ? !checkZone(selectedAddress) : false;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((address) => {
          const inZone = checkZone(address);
          return (
            <button
              key={address.id}
              onClick={() => onSelect(address.id)}
              className={cn(
                "relative flex items-start gap-4 p-6 rounded-[2rem] border-2 text-left transition-all group",
                selectedAddressId === address.id 
                  ? "border-rose bg-rose/5 ring-4 ring-rose/10" 
                  : "border-mist-dark/10 bg-white hover:border-rose/30 hover:bg-mist/20"
              )}
            >
              <div className={cn(
                "p-3 rounded-2xl shrink-0 transition-colors",
                selectedAddressId === address.id ? "bg-rose text-white" : "bg-mist text-bark/40 group-hover:bg-rose/10 group-hover:text-rose"
              )}>
                {address.label.toLowerCase().includes('home') ? <Home className="w-5 h-5" /> : 
                 address.label.toLowerCase().includes('office') || address.label.toLowerCase().includes('work') ? <Building2 className="w-5 h-5" /> :
                 <MapPin className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-bark truncate">{address.label}</span>
                  {selectedAddressId === address.id && (
                    <div className="w-5 h-5 bg-rose rounded-full flex items-center justify-center animate-in zoom-in">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {address.street}, {address.building}{address.apartment ? `, Apt ${address.apartment}` : ''}, {address.district}, {address.city}
                </p>
                {!inZone && (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
                    <AlertCircle className="w-3 h-3" />
                    Outside Delivery Zone
                  </div>
                )}
              </div>
            </button>
          );
        })}

        <button
          onClick={() => setShowAddForm(true)}
          className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-mist-dark/20 rounded-[2rem] hover:border-rose/40 hover:bg-rose/5 transition-all text-muted-foreground hover:text-rose group"
        >
          <div className="p-3 rounded-full bg-mist/50 group-hover:bg-rose/10 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold">Add New Address</span>
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bark/20 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-premium animate-in zoom-in-95">
            <h3 className="text-2xl font-display font-bold text-bark mb-8">New Delivery Address</h3>
            <form onSubmit={handleSubmit(onAddAddress as any)} className="space-y-4">
              <Input {...register('label')} placeholder="Label (e.g. Home, Office)" error={errors.label?.message} />
              <div className="grid grid-cols-2 gap-4">
                <Input {...register('city')} placeholder="City" error={errors.city?.message} />
                <Input {...register('district')} placeholder="District" error={errors.district?.message} />
              </div>
              <Input {...register('street')} placeholder="Street" error={errors.street?.message} />
              <div className="grid grid-cols-2 gap-4">
                <Input {...register('building')} placeholder="Building" error={errors.building?.message} />
                <Input {...register('apartment')} placeholder="Apartment (Optional)" error={errors.apartment?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input {...register('lat')} type="number" step="any" placeholder="Latitude (Optional)" error={errors.lat?.message} />
                <Input {...register('lng')} type="number" step="any" placeholder="Longitude (Optional)" error={errors.lng?.message} />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)} className="flex-1 rounded-2xl h-14">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-2xl h-14 bg-rose text-white font-bold">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isOutsideZone && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">Delivery Warning</p>
            <p className="text-amber-700">The selected address appears to be outside our standard delivery zones. Delivery may take longer or incur additional fees.</p>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button 
          onClick={onNext} 
          disabled={!selectedAddressId}
          className="h-16 px-12 rounded-2xl bg-bark text-white font-bold text-lg shadow-xl shadow-bark/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          Confirm & Continue
        </Button>
      </div>
    </div>
  );
}
