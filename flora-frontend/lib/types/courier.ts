import { DeliveryStatus } from './api';

export interface Courier {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate?: string;
  is_active: boolean;
  current_lat?: number;
  current_lng?: number;
  last_location_update?: string;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  courier_id?: string;
  status: DeliveryStatus;
  pickup_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_address: string;
  dropoff_lat?: number;
  dropoff_lng?: number;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  delivery_proof_url?: string;
  notes?: string;
}
