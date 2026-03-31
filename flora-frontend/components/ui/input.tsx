import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
}

function Input({ className, type, error, ...props }: InputProps) {
  return (
    <div className="space-y-1 w-full">
      <InputPrimitive
        type={type}
        data-slot="input"
        aria-invalid={!!error}
        className={cn(
          "h-12 w-full min-w-0 rounded-xl border border-border bg-white px-4 py-2 text-base transition-colors outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/50 md:text-sm",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium text-destructive ml-1">{error}</p>}
    </div>
  )
}

export { Input }
