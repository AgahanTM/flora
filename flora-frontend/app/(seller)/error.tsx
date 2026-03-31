"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
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
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-soft">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-display font-bold text-bark mb-4 italic">
        Curator <span className="text-amber-600">Sync Error</span>
      </h2>
      <p className="text-bark/60 max-w-md mb-10 leading-relaxed font-medium">
        We couldn't load your boutique management tools. Please refresh or try again later.
      </p>
      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          className="h-14 rounded-2xl px-10 bg-bark text-white font-bold gap-2 shadow-xl shadow-bark/20 hover:bg-rose transition-all"
        >
          <RefreshCcw className="w-5 h-5" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
