import { SellerStatus } from './api';

export interface Seller {
  id: string;
  user_id: string;
  shop_name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  status: SellerStatus;
  commission_rate: string;
  created_at: string;
}

export interface SellerDocument {
  id: string;
  seller_id: string;
  document_type: 'id_card' | 'business_license' | 'tax_certificate';
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
}

export interface SellerBankDetails {
  id: string;
  seller_id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_verified: boolean;
}

export interface SellerWorkingHours {
  id: string;
  seller_id: string;
  day_of_week: number; // 0=Sun, 6=Sat
  open_time?: string;  // "HH:MM:SS"
  close_time?: string; // "HH:MM:SS"
  is_closed: boolean;
}

export interface SellerDeliveryZone {
  seller_id: string;
  zone_id: string;
}

export interface SellerStats {
  rating_avg: string;
  rating_count: number;
  verification_status: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface TimeSlot {
  id: string;
  seller_id: string;
  slot_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  max_orders: number;
  booked_orders: number;
  price_modifier: string; // decimal string
  is_active: boolean;
  created_at: string;
}
export interface PublicSellerProfile extends Seller {
  working_hours?: SellerWorkingHours[];
  delivery_zones?: DeliveryZone[];
  seller_ratings?: {
    average_rating: string;
    total_reviews: number;
    rating_breakdown: Record<number, number>;
  };
}
