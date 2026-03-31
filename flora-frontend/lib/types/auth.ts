import { UserRole } from './api';

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  date_of_birth?: string;
  preferred_language: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  city: string;
  district: string;
  street: string;
  building: string;
  apartment?: string;
  lat?: number;
  lng?: number;
  is_default: boolean;
}

export interface Session {
  access_token: string;
  refresh_token: string;
}
