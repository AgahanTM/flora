"use client";

import { LucideIcon, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = ShoppingBag,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700", className)}>
      <div className="w-24 h-24 bg-rose/10 text-rose rounded-[2.5rem] flex items-center justify-center mb-8 shadow-soft">
        <Icon className="w-12 h-12" />
      </div>
      <h3 className="text-3xl font-display font-bold text-bark mb-4 italic">
        {title}
      </h3>
      <p className="text-bark/60 max-w-sm mb-10 leading-relaxed font-medium">
        {description}
      </p>
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Button asChild className="h-14 rounded-2xl px-10 bg-bark text-white font-bold shadow-xl shadow-bark/20 hover:bg-rose transition-all">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : (
          <Button onClick={onAction} className="h-14 rounded-2xl px-10 bg-bark text-white font-bold shadow-xl shadow-bark/20 hover:bg-rose transition-all">
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
