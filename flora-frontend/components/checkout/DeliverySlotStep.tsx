"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Clock, AlertCircle, Loader2, Info, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

import { apiClient } from '@/lib/api/client';
import { Seller, SellerWorkingHours } from '@/lib/types/seller';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';

interface DeliverySlot {
  id: string;
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
  max_orders: number;
  booked_orders: number;
  price_modifier: string;
  is_blocked: boolean;
}

interface DeliverySlotStepProps {
  sellerId: string;
  selectedDate?: string;
  selectedSlotId?: string;
  specialInstructions?: string;
  giftMessage?: string;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slotId: string) => void;
  onSetInstructions: (val: string) => void;
  onSetGiftMessage: (val: string) => void;
  onNext: () => void;
}

export function DeliverySlotStep({
  sellerId,
  selectedDate,
  selectedSlotId,
  specialInstructions,
  giftMessage,
  onSelectDate,
  onSelectSlot,
  onSetInstructions,
  onSetGiftMessage,
  onNext
}: DeliverySlotStepProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfDay(new Date()));

  const { data: seller } = useQuery({
    queryKey: ['seller', sellerId],
    queryFn: async () => {
      const response = await apiClient.get(`/sellers/${sellerId}`);
      return response.data as Seller & { working_hours: SellerWorkingHours[] };
    },
    enabled: !!sellerId
  });

  const { data: slots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['delivery-slots', sellerId, selectedDate],
    queryFn: async () => {
      const response = await apiClient.get(`/delivery/slots?seller_id=${sellerId}&date=${selectedDate}`);
      return response.data as DeliverySlot[];
    },
    enabled: !!sellerId && !!selectedDate
  });

  const dates = Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));
  
  const formatTime = (time: string) => time.split(':').slice(0, 2).join(':');

  const isClosed = (date: Date) => {
    const dayOfWeek = date.getDay();
    const hours = seller?.working_hours?.find(h => h.day_of_week === dayOfWeek);
    return hours?.is_closed ?? false;
  };

  const dayHours = selectedDate 
    ? seller?.working_hours?.find(h => h.day_of_week === new Date(selectedDate).getDay())
    : null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Date Picker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xl font-display font-bold text-bark flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-rose" />
            Pick Delivery Date
          </label>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
          {dates.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const closed = isClosed(date);
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                disabled={closed}
                onClick={() => onSelectDate(dateStr)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[80px] h-24 rounded-3xl border-2 transition-all p-2 shrink-0",
                  isSelected 
                    ? "border-rose bg-rose/5 ring-4 ring-rose/10" 
                    : closed 
                      ? "border-mist/50 bg-mist/20 opacity-40 cursor-not-allowed" 
                      : "border-mist-dark/10 bg-white hover:border-rose/30"
                )}
              >
                <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", isSelected ? "text-rose" : "text-bark/40")}>
                  {format(date, 'EEE')}
                </span>
                <span className={cn("text-xl font-display font-bold", isSelected ? "text-rose" : "text-bark")}>
                  {format(date, 'd')}
                </span>
                <span className={cn("text-[10px] font-medium mt-1", isSelected ? "text-rose/60" : "text-bark/30")}>
                  {format(date, 'MMM')}
                </span>
              </button>
            );
          })}
        </div>
        {dayHours && !dayHours.is_closed && (
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 ml-1">
            <Info className="w-3.5 h-3.5" />
            Seller open: {formatTime(dayHours.open_time!)} – {formatTime(dayHours.close_time!)}
          </p>
        )}
      </div>

      {/* Slots Grid */}
      <div className="space-y-4">
        <label className="text-xl font-display font-bold text-bark flex items-center gap-2">
          <Clock className="w-5 h-5 text-rose" />
          Select Delivery Slot
        </label>

        {!selectedDate ? (
          <div className="p-12 text-center bg-mist/30 rounded-[2.5rem] border-2 border-dashed border-mist-dark/10">
            <p className="text-muted-foreground font-medium">Please select a delivery date first</p>
          </div>
        ) : isLoadingSlots ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-mist/30 rounded-2xl animate-pulse" />)}
          </div>
        ) : slots?.length === 0 ? (
          <div className="p-10 bg-rose/5 rounded-[2rem] border border-rose/10 flex flex-col items-center text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose" />
            <div className="space-y-1">
              <p className="font-bold text-bark">No slots available</p>
              <p className="text-sm text-muted-foreground">All slots for this day are fully booked. Please pick another date.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {slots?.filter(s => !s.is_blocked).map((slot) => {
              const isFull = slot.booked_orders >= slot.max_orders;
              const isSelected = selectedSlotId === slot.id;
              const modifier = parseFloat(slot.price_modifier);

              return (
                <button
                  key={slot.id}
                  disabled={isFull}
                  onClick={() => onSelectSlot(slot.id)}
                  className={cn(
                    "relative flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all text-left",
                    isSelected 
                      ? "border-rose bg-rose/5 ring-4 ring-rose/10" 
                      : isFull 
                        ? "border-mist/50 bg-mist/20 opacity-50 cursor-not-allowed" 
                        : "border-mist-dark/10 bg-white hover:border-rose/30"
                  )}
                >
                  <div className="space-y-1">
                    <span className={cn("text-base font-bold block", isSelected ? "text-rose" : "text-bark")}>
                      {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                    </span>
                    <span className={cn("text-[10px] font-medium uppercase tracking-widest", isSelected ? "text-rose/50" : "text-bark/30")}>
                      {isFull ? 'Fully Booked' : `${slot.max_orders - slot.booked_orders} left`}
                    </span>
                  </div>
                  {modifier > 0 && (
                    <div className="flex items-center gap-1 bg-rose/10 text-rose px-2.5 py-1 rounded-full animate-in fade-in zoom-in">
                      <Sparkles className="w-3 h-4" />
                      <span className="text-[10px] font-black">+{formatPrice(modifier)}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-lg font-bold text-bark ml-1">Special Instructions</label>
          <textarea 
            value={specialInstructions}
            onChange={(e) => onSetInstructions(e.target.value)}
            placeholder="e.g. Leave at the gate, call upon arrival..."
            className="w-full h-32 p-4 bg-white border-2 border-mist-dark/10 rounded-3xl focus:border-rose focus:ring-4 focus:ring-rose/10 transition-all outline-none text-bark placeholder:text-bark/20"
          />
        </div>
        <div className="space-y-3">
          <label className="text-lg font-bold text-bark ml-1">Greeting Card Message</label>
          <textarea 
            value={giftMessage}
            onChange={(e) => onSetGiftMessage(e.target.value)}
            placeholder="Write a warm message for the recipient..."
            className="w-full h-32 p-4 bg-white border-2 border-mist-dark/10 rounded-3xl focus:border-rose focus:ring-4 focus:ring-rose/10 transition-all outline-none text-bark placeholder:text-bark/20"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={onNext} 
          disabled={!selectedDate || !selectedSlotId}
          className="h-16 px-12 rounded-2xl bg-bark text-white font-bold text-lg shadow-xl shadow-bark/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}
