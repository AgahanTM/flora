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
      <div className="w-20 h-20 bg-rose/10 text-rose rounded-[2rem] flex items-center justify-center mb-6 shadow-soft">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-display font-bold text-bark mb-4 italic">
        Account <span className="text-rose">Error</span>
      </h2>
      <p className="text-bark/60 max-w-md mb-10 leading-relaxed font-medium">
        We had trouble loading your personal floral space. Your data is safe, but we need a moment to reconnect.
      </p>
      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          className="h-14 rounded-2xl px-10 bg-bark text-white font-bold gap-2 shadow-xl shadow-bark/20 hover:bg-rose transition-all"
        >
          <RefreshCcw className="w-5 h-5" />
          Try Again
        </Button>
        <Button
          variant="ghost"
          onClick={() => window.location.href = "/dashboard"}
          className="h-14 rounded-2xl px-10 font-bold"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
