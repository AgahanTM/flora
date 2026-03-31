"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-mist-dark/5">
      <div className="w-24 h-24 bg-bark text-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h2 className="text-4xl font-display font-bold text-bark mb-4 italic uppercase tracking-tighter">
        System <span className="text-rose">Interruption</span>
      </h2>
      <p className="text-bark/60 max-w-lg mb-12 leading-relaxed font-bold uppercase text-[10px] tracking-widest">
        CRITICAL ERROR ENCOUNTERED IN THE ADMINISTRATIVE LAYER. SYSTEM INTEGRITY PRESERVED. PLEASE RE-AUTHENTICATE OR RETRY THE ACTION.
      </p>
      <div className="flex gap-6">
        <Button
          onClick={() => reset()}
          className="h-16 rounded-[2rem] px-12 bg-bark text-white font-black uppercase tracking-widest text-xs gap-3 shadow-2xl shadow-bark/40 hover:bg-rose transition-all"
        >
          <RefreshCcw className="size-5" />
          Restore Session
        </Button>
      </div>
    </div>
  );
}
