export interface Review {
  id: string;
  order_id: string;
  seller_id: string;
  customer_id: string;
  product_id?: string;
  rating: number; // 1-5
  comment?: string;
  images?: string; // JSON String -> parse to string[]
  is_visible: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  customer?: { id: string, full_name: string, avatar_url: string };
  response?: ReviewResponse;
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  seller_id: string;
  response: string;
  created_at: string;
}

export interface SellerRatings {
  average_rating: string;
  total_reviews: number;
  rating_distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}
