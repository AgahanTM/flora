export interface Promotion {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: string;
  min_order_amount?: string;
  max_discount_amount?: string;
  starts_at: string;
  ends_at: string;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  seller_id?: string; // If scoped to a seller
  created_at: string;
}

export interface PromotionCreateInput {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  starts_at: string;
  ends_at: string;
  usage_limit?: number;
  is_active: boolean;
  seller_id?: string;
}
