"use client";

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flower2, ShieldCheck, RefreshCcw, ArrowLeft } from 'lucide-react';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { useCountdown } from '@/lib/hooks/useCountdown';
import Link from 'next/link';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get('identifier') || searchParams.get('phone') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { formatTime, isExpired, reset } = useCountdown(300); // 5 minutes

  useEffect(() => {
    if (!identifier) {
      toast.error('Identity missing. Please register again.');
      router.push('/register');
    }
  }, [identifier, router]);

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiClient.post('/auth/verify-otp', { phone: identifier, code });
    },
    onSuccess: () => {
      toast.success('Account verified! You can now log in. 🌸');
      router.push('/login');
    },
    onError: (error: any) => {
      toast.apiError(error, 'Invalid OTP. Please try again.');
    }
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post('/auth/resend-otp', { phone: identifier });
    },
    onSuccess: () => {
      toast.success('New OTP sent to your phone. 🌸');
      reset();
    },
    onError: (error: any) => {
      toast.apiError(error, 'Failed to resend OTP.');
    }
  });

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d*$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length === 6) {
      verifyMutation.mutate(code);
    } else {
      toast.error('Please enter all 6 digits.');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
       {/* Decorative */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center space-y-6 mb-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <Flower2 className="text-rose w-10 h-10" />
            <span className="font-display text-2xl font-bold text-bark tracking-tight">Flora</span>
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold text-bark">Verify Identity</h1>
            <p className="text-muted-foreground">We sent a 6-digit code to <span className="text-bark font-bold">{identifier}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-premium border border-mist-dark/20 animate-in zoom-in-95 duration-500">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-full aspect-square text-center text-2xl font-bold bg-mist/30 border-2 border-transparent focus:border-rose/30 focus:bg-white rounded-2xl outline-none transition-all text-bark"
                />
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Code expires in:</span>
                <span className="text-sm font-bold text-rose font-mono">{formatTime()}</span>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-rose text-white font-bold text-lg shadow-lg"
                loading={verifyMutation.isPending}
                disabled={otp.join('').length < 6}
              >
                Verify & Continue <ShieldCheck className="ml-2 w-5 h-5" />
              </Button>

              {isExpired ? (
                <button
                  type="button"
                  onClick={() => resendMutation.mutate()}
                  disabled={resendMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 text-rose font-bold text-sm hover:underline py-2"
                >
                  <RefreshCcw className={`w-4 h-4 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
                  Resend Code
                </button>
              ) : (
                <p className="text-center text-xs text-muted-foreground italic">
                  Didn't receive a code? Wait for the timer.
                </p>
              )}
            </div>
          </form>

          <div className="mt-8 text-center">
            <Link href="/register" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-bark transition-colors">
              <ArrowLeft className="w-4 h-4" /> Edit phone number
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center font-display text-xl animate-pulse">Loading identity check...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
