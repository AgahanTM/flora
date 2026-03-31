export interface DeliveryZone {
  id: string;
  name: string;
  polygon: any; // GeoJSON
  is_active: boolean;
  base_fee: string;
  created_at: string;
}

export interface SellerStats {
  seller_id: string;
  shop_name: string;
  total_orders: number;
  revenue: string;
  avg_rating: number;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  ip_address?: string;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}
