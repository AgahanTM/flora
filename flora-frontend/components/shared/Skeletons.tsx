"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 group">
      <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
      <div className="p-2 space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-2/3 opacity-60" />
        <div className="pt-2">
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-soft border border-mist-dark/10 h-48 flex flex-col">
      <div className="bg-mist/20 px-8 py-4 flex items-center justify-between border-b border-mist-dark/5">
        <div className="flex items-center gap-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="p-8 flex items-center gap-8 flex-1">
        <Skeleton className="w-24 h-24 rounded-3xl shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-14 w-40 rounded-2xl hidden md:block" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-6 max-w-3xl pt-12 space-y-12">
      <header className="flex items-center justify-between">
        <Skeleton className="w-11 h-11 rounded-2xl" />
        <Skeleton className="h-8 w-48" />
        <div className="w-11" />
      </header>
      <div className="bg-white rounded-[3rem] p-10 shadow-soft border border-mist-dark/10 space-y-10">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-32 h-32 rounded-[2.5rem]" />
          <div className="space-y-2 flex flex-col items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20 ml-2" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-mist-dark/10 flex justify-end">
          <Skeleton className="h-14 w-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-mist-dark/5">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </td>
      <td className="px-8 py-6"><Skeleton className="h-6 w-24 rounded-full" /></td>
      <td className="px-8 py-6"><Skeleton className="h-4 w-24" /></td>
      <td className="px-8 py-6"><Skeleton className="h-4 w-28" /></td>
      <td className="px-8 py-6 text-right"><Skeleton className="h-10 w-10 rounded-xl ml-auto" /></td>
    </tr>
  );
}

export function BannerSkeleton() {
  return (
    <div className="w-full h-[80vh] bg-mist/20 relative overflow-hidden flex flex-col items-center justify-center space-y-6">
       <Skeleton className="h-16 w-3/4 max-w-2xl rounded-xl" />
       <Skeleton className="h-6 w-1/2 max-w-md rounded-lg" />
       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-2.5 h-2.5 rounded-full" />
          ))}
       </div>
    </div>
  );
}
