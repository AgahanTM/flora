export type BannerPosition = 'home_top' | 'home_mid' | 'category_page';

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  position: BannerPosition;
  is_active: boolean;
  sort_order: number;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
}

export interface BannerCreateInput {
  title: string;
  image_url: string;
  link_url?: string;
  position: BannerPosition;
  is_active: boolean;
  sort_order: number;
  starts_at?: string;
  ends_at?: string;
}
