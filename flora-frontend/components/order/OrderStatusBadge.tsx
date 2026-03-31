"use client";

import { OrderStatus } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, Package, Truck, Check, XCircle } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const statusConfig: Record<OrderStatus, { label: string; icon: any; classes: string }> = {
    [OrderStatus.PENDING]: {
      label: 'Pending',
      icon: <Clock className="w-3.5 h-3.5" />,
      classes: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    [OrderStatus.CONFIRMED]: {
      label: 'Confirmed',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      classes: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    [OrderStatus.PREPARING]: {
      label: 'Preparing',
      icon: <Package className="w-3.5 h-3.5" />,
      classes: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    [OrderStatus.READY_FOR_PICKUP]: {
      label: 'Ready for Pickup',
      icon: <Package className="w-3.5 h-3.5" />,
      classes: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    [OrderStatus.OUT_FOR_DELIVERY]: {
      label: 'Out for Delivery',
      icon: <Truck className="w-3.5 h-3.5" />,
      classes: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    [OrderStatus.DELIVERED]: {
      label: 'Delivered',
      icon: <Check className="w-3.5 h-3.5" />,
      classes: 'bg-green-50 text-green-600 border-green-200',
    },
    [OrderStatus.CANCELLED]: {
      label: 'Cancelled',
      icon: <XCircle className="w-3.5 h-3.5" />,
      classes: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  };

  const config = statusConfig[status] || statusConfig[OrderStatus.PENDING];

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all shadow-sm",
      config.classes,
      className
    )}>
      {config.icon}
      {config.label}
    </div>
  );
}
