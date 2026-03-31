import { OrderStatus, PaymentMethod, PaymentStatus } from './api';
import { Address } from './auth';

export interface Order {
  id: string;
  customer_id: string;
  seller_id: string;
  delivery_address_id: string;
  promotion_id?: string;
  status: OrderStatus;
  total_amount: string; // decimal string
  discount_amount: string; // decimal string
  delivery_fee: string; // decimal string
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  delivery_date?: string; // YYYY-MM-DD
  delivery_slot_id?: string;
  recipient_name?: string;
  recipient_phone?: string;
  gift_message?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  
  // Relations that will be populated in GET /orders/:id
  items?: OrderItem[];
  messages?: OrderMessage[];
  status_history?: OrderStatusHistory[];
  address?: Address;
  slot?: any; // DeliverySlot type
  promotion?: any; // Promotion type
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  product_snapshot: any; // JSONB full product snapshot at time of purchase
  addons: any[]; // Parsed from JSON string in DB
}

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  sent_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note?: string;
  changed_by?: string;
  created_at: string;
}
