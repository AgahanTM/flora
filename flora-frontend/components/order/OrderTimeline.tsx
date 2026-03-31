"use client";

import { OrderStatusHistory } from '@/lib/types/order';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderTimelineProps {
  history: OrderStatusHistory[];
}

export function OrderTimeline({ history }: OrderTimelineProps) {
  // Sort history by date descending
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-mist-dark/10">
      {sortedHistory.map((item, idx) => (
        <div key={item.id} className="relative flex items-start group">
          {/* Timeline Dot */}
          <div className={cn(
            "absolute left-0 mt-1.5 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white shadow-md transition-all",
            idx === 0 ? "bg-rose ring-4 ring-rose/10 z-10" : "bg-mist group-hover:bg-mist-dark/20"
          )}>
            <div className={cn(
              "h-2 w-2 rounded-full",
              idx === 0 ? "bg-white animate-pulse" : "bg-bark/20"
            )} />
          </div>

          <div className="ml-16 pt-1 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={item.status} />
                {item.changed_by && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-bark/20">
                    By {item.changed_by}
                  </span>
                )}
              </div>
              <time className="text-[11px] font-black text-bark/30 whitespace-nowrap uppercase tracking-tighter">
                {format(new Date(item.created_at), 'MMM d, h:mm a')}
              </time>
            </div>
            
            {item.note && (
              <p className="text-sm text-muted-foreground bg-mist/30 p-4 rounded-2xl italic border border-mist-dark/5">
                "{item.note}"
              </p>
            )}
          </div>
        </div>
      ))}

      {sortedHistory.length === 0 && (
         <div className="flex items-center gap-4 py-8 opacity-30">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-bark/20 flex items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-bark/20" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">Awaiting status updates...</p>
         </div>
      )}
    </div>
  );
}
