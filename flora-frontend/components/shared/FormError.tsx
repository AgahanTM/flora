import { cn } from "@/lib/utils";

interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <p className={cn("text-[10px] font-bold text-rose uppercase tracking-widest mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-300", className)}>
      {message}
    </p>
  );
}
