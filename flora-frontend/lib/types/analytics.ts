export interface AnalyticsEvent {
  event_type: 'product_view' | 'search_performed' | 'add_to_cart' | 'gift_builder_started' | 'gift_builder_completed' | 'gift_builder_converted_to_order' | 'order_placed' | 'coupon_applied';
  data?: any; // E.g., { product_id: '123' }, { query: 'roses' }
  session_id: string; // From localStorage or cookie
  user_id?: string; // If logged in
  created_at: string;
}

export interface DailyStats {
  date: string;
  total_orders: number;
  revenue: string;
  new_customers: number;
  avg_order_value: string;
  top_products: string | any[]; // JSONB from DB
  top_sellers: string | any[]; // JSONB from DB
}
