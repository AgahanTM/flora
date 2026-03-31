"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Flower2, Phone, Mail, User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from '@/lib/utils/toast';

import { apiClient } from '@/lib/api/client';
import { FormError } from '@/components/shared/FormError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { UserRole } from '@/lib/types/api';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+993\d{8}$/, 'Phone must be in +993XXXXXXXX format (12 digits)'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['customer', 'seller'] as const),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'customer',
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      return await apiClient.post('/auth/register', data);
    },
    onSuccess: (_, variables) => {
      toast.success('Account created! Please verify your phone number. 🌸');
      router.push(`/verify-otp?identifier=${encodeURIComponent(variables.phone)}`);
    },
    onError: (error: any) => {
      toast.apiError(error, 'Registration failed. Please try again.');
    }
  });

  const onSubmit = (data: RegisterForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-rose/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center space-y-6 mb-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-soft flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <Flower2 className="text-rose w-7 h-7" />
            </div>
            <span className="font-display text-2xl font-bold text-bark tracking-tight">Flora</span>
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold text-bark">Create an Account</h1>
            <p className="text-muted-foreground">Join our community of flower lovers & creators.</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-premium border border-mist-dark/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-bark/60 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  {...register('full_name')}
                  placeholder="John Doe"
                  className="pl-14 h-14 bg-mist/30 border-none focus:ring-2 focus:ring-rose/30 transition-all rounded-2xl"
                />
              </div>
              <FormError message={errors.full_name?.message} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-bark/60 ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  {...register('phone')}
                  placeholder="+99361234567"
                  className="pl-14 h-14 bg-mist/30 border-none focus:ring-2 focus:ring-rose/30 transition-all rounded-2xl"
                />
              </div>
              <FormError message={errors.phone?.message} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-bark/60 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  {...register('password')}
                  type="password"
                  placeholder="Min. 8 characters"
                  className="pl-14 h-14 bg-mist/30 border-none focus:ring-2 focus:ring-rose/30 transition-all rounded-2xl"
                />
              </div>
              <FormError message={errors.password?.message} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-bark/60 ml-1">I want to</label>
              <div className="relative">
                <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Select onValueChange={(v) => setValue('role', v as 'customer' | 'seller')}>
                  <SelectTrigger className="pl-14 h-14 bg-mist/30 border-none focus:ring-2 focus:ring-rose/30 transition-all rounded-2xl">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Shop for Flowers</SelectItem>
                    <SelectItem value="seller">Sell my Blooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FormError message={errors.role?.message} />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-rose text-white font-bold text-lg shadow-lg hover:bg-rose-dark transition-all scale-100 hover:scale-[1.02] active:scale-95 mt-4"
              loading={mutation.isPending}
            >
              Sign Up <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-rose font-bold hover:underline transition-all">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
