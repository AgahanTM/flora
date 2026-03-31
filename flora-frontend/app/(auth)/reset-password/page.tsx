"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flower2, Mail, Lock, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { FormError } from '@/components/shared/FormError';
import { Suspense, useState } from 'react';

import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const requestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const confirmSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type RequestForm = z.infer<typeof requestSchema>;
type ConfirmForm = z.infer<typeof confirmSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isSuccess, setIsSuccess] = useState(false);

  // Phase 1: Request Reset
  const requestForm = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
  });

  const requestMutation = useMutation({
    mutationFn: async (data: RequestForm) => {
      return await apiClient.post('/auth/request-password-reset', data);
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Reset instructions sent to your email. 🌸');
    },
    onError: (error: any) => {
      toast.apiError(error, 'Failed to request reset.');
    }
  });

  // Phase 2: Confirm Reset
  const confirmForm = useForm<ConfirmForm>({
    resolver: zodResolver(confirmSchema),
  });

  const confirmMutation = useMutation({
    mutationFn: async (data: ConfirmForm) => {
      if (!token) throw new Error('Reset token is missing.');
      return await apiClient.post('/auth/confirm-password-reset', {
        token,
        password: data.password,
      });
    },
    onSuccess: () => {
      toast.success('Password updated successfully! Please log in. 🌸');
      router.push('/login');
    },
    onError: (error: any) => {
      toast.apiError(error, 'Failed to update password.');
    }
  });

  const onRequestSubmit = (data: RequestForm) => requestMutation.mutate(data);
  const onConfirmSubmit = (data: ConfirmForm) => confirmMutation.mutate(data);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-rose/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center space-y-6 mb-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <Flower2 className="text-rose w-10 h-10" />
            <span className="font-display text-2xl font-bold text-bark tracking-tight">Flora</span>
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold text-bark">
              {token ? 'Secure Your Account' : 'Forgot Password?'}
            </h1>
            <p className="text-muted-foreground">
              {token 
                ? 'Create a new password to regain access.' 
                : isSuccess 
                  ? 'Check your inbox for the link.' 
                  : 'Enter your email and we\'ll send instructions.'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-premium border border-mist-dark/20 sm:animate-in sm:zoom-in-95 sm:duration-500">
          {token ? (
            // Form: Confirm New Password
            <form onSubmit={confirmForm.handleSubmit(onConfirmSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-bark/60 ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    {...confirmForm.register('password')}
                    type="password"
                    placeholder="Min. 8 characters"
                    className="pl-14 h-14 bg-mist/30 border-none focus:ring-2 focus:ring-rose/30 transition-all rounded-2xl"
                  />
                </div>
                <FormError message={confirmForm.formState.errors.password?.message} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-bark/60 ml-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    {...confirmForm.register('confirm_password')}
                    type="password"
                    placeholder="Repeat password"
                    className="pl-14 h-14 bg-mist/30 border-none focus:ring-2 focus:ring-rose/30 transition-all rounded-2xl"
                  />
                </div>
                <FormError message={confirmForm.formState.errors.confirm_password?.message} />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-rose text-white font-bold text-lg shadow-lg"
                loading={confirmMutation.isPending}
              >
                Update Password <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>
          ) : isSuccess ? (
            // Success State: Request Sent
            <div className="text-center space-y-8 animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-mist/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed px-4">
                We've sent a password reset link to your email address. It should arrive in a couple of minutes.
              </p>
              <Button asChild variant="ghost" className="text-rose font-bold">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          ) : (
            // Form: Request Reset
            <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-bark/60 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    {...requestForm.register('email')}
                    placeholder="your@email.com"
                    className="pl-14 h-14 bg-mist/30 border-none focus:ring-2 focus:ring-rose/30 transition-all rounded-2xl"
                  />
                </div>
                <FormError message={requestForm.formState.errors.email?.message} />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-rose text-white font-bold text-lg shadow-lg"
                loading={requestMutation.isPending}
              >
                Send Link <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <div className="text-center">
                <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-bark transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center font-display text-xl animate-pulse text-bark">Loading security portal...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
