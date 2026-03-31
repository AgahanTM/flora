"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  User, Mail, Phone, Calendar, Globe, 
  Camera, Loader2, Save, ArrowLeft,
  Sparkles, CheckCircle2
} from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { apiClient } from '@/lib/api/client';
import { UserProfile } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileSkeleton } from '@/components/shared/Skeletons';
import { FormError } from '@/components/shared/FormError';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  avatar_url: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  date_of_birth: z.string().optional(),
  preferred_language: z.enum(['tk', 'en', 'ru']),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const router = useRouter();
  
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.get('/profile');
      return response.data as UserProfile;
    }
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name,
        avatar_url: profile.avatar_url || '',
        date_of_birth: profile.date_of_birth || '',
        preferred_language: (profile.preferred_language as any) || 'tk',
      });
    }
  }, [profile, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiClient.put('/profile', data);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully 🌸');
      refetch();
    },
    onError: (error: any) => {
      toast.apiError(error, 'Failed to update profile');
    }
  });

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-cream/30 pb-24">
      <div className="container mx-auto px-6 max-w-3xl pt-12 space-y-12">
        <header className="flex items-center justify-between">
           <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-rose/10 hover:text-rose transition-all group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
           </button>
           <h1 className="text-2xl font-display font-bold text-bark">Profile Settings</h1>
           <div className="w-11" /> {/* Spacer */}
        </header>

        <section className="bg-white rounded-[3rem] p-10 shadow-soft border border-mist-dark/10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose/5 blur-3xl rounded-full -mr-16 -mt-16" />
           
           <form onSubmit={handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-10 relative z-10">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                 <div className="relative group">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-mist flex items-center justify-center overflow-hidden border-4 border-white shadow-soft group-hover:border-rose/20 transition-all relative">
                       {profile?.avatar_url ? (
                          <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
                       ) : (
                          <User className="w-12 h-12 text-bark/20" />
                       )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 p-3 bg-bark text-white rounded-2xl shadow-lg cursor-pointer hover:bg-rose transition-all">
                       <Camera className="w-4 h-4" />
                       <input 
                         type="hidden" 
                         {...register('avatar_url')} 
                       />
                    </label>
                 </div>
                 <div className="text-center">
                    <h3 className="text-lg font-bold text-bark">{profile?.full_name}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Member since Oct 2024</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-2">Full Name</label>
                    <div className="relative">
                       <Input 
                         {...register('full_name')} 
                         placeholder="Your full name"                          className="h-14 rounded-2xl pl-12 bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all"
                        />
                        <FormError message={errors.full_name?.message} />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bark/20" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-2">Date of Birth</label>
                    <div className="relative">
                       <Input 
                         {...register('date_of_birth')} 
                         type="date"
                          className="h-14 rounded-2xl pl-12 bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all"
                        />
                        <FormError message={errors.date_of_birth?.message} />
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bark/20" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-2">Avatar URL (Mock)</label>
                    <div className="relative">
                       <Input 
                         {...register('avatar_url')} 
                         placeholder="https://example.com/photo.jpg"                          className="h-14 rounded-2xl pl-12 bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all"
                        />
                        <FormError message={errors.avatar_url?.message} />
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bark/20" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-2">Preferred Language</label>
                    <div className="relative">
                       <select 
                         {...register('preferred_language')}
                         className="w-full h-14 rounded-2xl pl-12 pr-4 bg-mist/30 border-transparent focus:bg-white focus:border-rose/30 transition-all outline-none appearance-none font-bold text-sm text-bark"
                       >
                          <option value="tk">Turkmen (TK)</option>
                          <option value="en">English (EN)</option>
                          <option value="ru">Russian (RU)</option>
                       </select>
                       <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bark/20 pointer-events-none" />
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-mist-dark/10 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-bark/30">
                    <CheckCircle2 className={cn("w-5 h-5 transition-colors", isDirty ? "text-rose" : "text-green-500")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                       {isDirty ? 'Unsaved changes' : 'Profile up to date'}
                    </span>
                 </div>
                 <Button 
                   type="submit" 
                   disabled={!isDirty || updateProfileMutation.isPending}
                   className="h-14 rounded-2xl px-10 bg-bark text-white hover:bg-rose transition-all font-bold gap-2 shadow-xl shadow-bark/20"
                 >
                    {updateProfileMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                 </Button>
              </div>
           </form>
        </section>

        {/* Info Box */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] p-8 flex gap-6 items-start group">
           <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
           </div>
           <div className="space-y-2">
              <h4 className="font-bold text-bark">Did you know?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                 Keeping your profile updated helps us personalize your gift suggestions and ensures your delivery experience is seamless.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
