"use client";

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Flower2, Phone, Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';
import { decodeJwtPayload } from '@/lib/utils/jwt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/shared/FormError';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Please enter your phone or email'),
  password: z.string().min(1, 'Please enter your password'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';
  const setTokens = useAuthStore((state) => state.setTokens);

  const [loginType, setLoginType] = useState<'phone' | 'email'>('phone');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      return await apiClient.post('/auth/login', {
        [loginType === 'phone' ? 'phone' : 'email']: data.identifier,
        password: data.password,
      });
    },
    onSuccess: (response) => {
      const { access_token, refresh_token } = response.data;
      setTokens(access_token, refresh_token);
      
      const payload = decodeJwtPayload(access_token);
      const role = payload?.role || 'customer';

      toast.success('Welcome back to Flora! 🌸');

      if (redirectPath) {
        router.push(redirectPath);
      } else {
        const homeMap: Record<string, string> = {
          customer: '/dashboard',
          seller: '/seller/dashboard',
          admin: '/admin/dashboard',
          courier: '/courier/deliveries',
        };
        router.push(homeMap[role as string] || '/dashboard');
      }
    },
    onError: (error: any) => {
      toast.apiError(error, 'Invalid credentials. Please try again.');
    }
  });

  const onSubmit = (data: LoginForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl opacity-50" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center space-y-6 mb-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <Flower2 className="text-rose w-12 h-12" />
            <span className="font-display text-2xl font-bold text-bark tracking-tight">Flora</span>
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold text-bark">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your account to continue.</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-premium border border-mist-dark/20 sm:animate-in sm:fade-in sm:slide-in-from-bottom-4 sm:duration-700">
          <div className="bg-mist/30 p-1.5 rounded-2xl flex items-center mb-8">
            <button
              onClick={() => setLoginType('phone')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                loginType === 'phone' ? "bg-white text-bark shadow-soft" : "text-muted-foreground hover:text-bark"
              )}
            >
              <Phone className="w-4 h-4" /> Phone
            </button>
            <button
              onClick={() => setLoginType('email')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                loginType === 'email' ? "bg-white text-bark shadow-soft" : "text-muted-foreground hover:text-bark"
              )}
            >
              <Mail className="w-4 h-4" /> Email
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-bark/60 ml-1">
                {loginType === 'phone' ? 'Phone Number' : 'Email Address'}
              </label>
              <div className="relative">
                {loginType === 'phone' ? (
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                ) : (
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                )}
                <Input 
                  {...register('identifier')}
                  placeholder={loginType === 'phone' ? '+993...' : 'your@email.com'}
                  className="pl-14 h-14 bg-mist/30 border-none focus:ring-2 focus:ring-rose/30 transition-all rounded-2xl"
                />
              </div>
              <FormError message={errors.identifier?.message} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold uppercase tracking-widest text-bark/60">Password</label>
                <Link href="/reset-password" className="text-xs font-bold text-rose hover:underline transition-all">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  {...register('password')}
                  type="password"
                  placeholder="********"
                  className="pl-14 h-14 bg-mist/30 border-none focus:ring-2 focus:ring-rose/30 transition-all rounded-2xl"
                />
              </div>
              <FormError message={errors.password?.message} />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-rose text-white font-bold text-lg shadow-lg"
              loading={mutation.isPending}
            >
              Sign In <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-mist/50 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="text-rose font-bold hover:underline transition-all">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center font-display text-xl animate-pulse text-bark">Preparing login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
