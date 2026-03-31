import { PersonalizationStatus } from './api';

export interface PersonalizationType {
  id: string;
  name: string;
  description?: string;
  base_price: string;
  available_materials?: string; // JSON String -> parse to string[]
  available_colors?: string; // JSON String -> parse to string[]
  requires_file: boolean;
  max_text_length?: number;
  estimated_days: number;
  is_active: boolean;
  created_at: string;
}

export interface PersonalizationTemplate {
  id: string;
  type_id: string;
  name: string;
  preview_image_url?: string;
  description?: string;
  example_text?: string;
  is_active: boolean;
  sort_order: number;
}

export interface PersonalizationJob {
  id: string;
  order_item_id: string;
  type_id: string;
  template_id?: string;
  custom_text?: string;
  material?: string;
  color?: string;
  file_url?: string;
  status: PersonalizationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}
