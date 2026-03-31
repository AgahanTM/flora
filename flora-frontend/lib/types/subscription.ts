import { SubscriptionStatus, SubscriptionFrequency } from './api';
import { Address } from './auth';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  frequency: SubscriptionFrequency;
  discount_percentage: string; // decimal string
  is_active: boolean;
  sort_order: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  seller_id: string;
  plan_id: string;
  delivery_address_id: string;
  status: SubscriptionStatus;
  start_date: string;
  next_delivery_date: string;
  paused_until?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;

  // Relations
  plan?: SubscriptionPlan;
  address?: Address;
}

export interface SubscriptionDelivery {
  id: string;
  subscription_id: string;
  order_id?: string;
  scheduled_date: string;
  status: 'pending' | 'converted' | 'skipped' | 'failed';
  created_at: string;
}
