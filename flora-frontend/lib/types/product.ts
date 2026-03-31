import { AddonType } from './api';

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  name: string;
  description: string;
  base_price: string; // Stored as decimal string in DB
  compare_at_price?: string;
  slug: string;
  is_active: boolean;
  is_featured: boolean;
  shelf_life_hours?: number;
  preparation_time_minutes?: number;
  created_at: string;
  images: ProductImage[];
  variants: ProductVariant[];
  addons: ProductAddon[];
  inventory: Inventory;
  seller?: any; // To be populated with Seller info when included
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_modifier: string;
  sku?: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductAddon {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  price: string;
  addon_type: AddonType;
  max_quantity: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Category {
  id: string;
  parent_id?: string;
  slug: string;
  name: string;
  description?: string;
  icon_url?: string;
  is_active: boolean;
  sort_order: number;
  children?: Category[]; // Populated for nested tree
}

export interface Inventory {
  product_id: string;
  variant_id?: string;
  quantity_total: number;
  quantity_reserved: number;
  low_stock_threshold: number;
  updated_at: string;
}
