import { Product } from './product';

export interface Cart {
  id: string;
  user_id: string;
  session_id?: string;
  created_at: string;
  updated_at: string;
  items: CartItem[];
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  added_at: string;
  
  // Populated relation
  product?: Product;
}
