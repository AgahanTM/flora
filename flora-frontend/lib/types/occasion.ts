export interface Occasion {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  is_active: boolean;
}

export interface OccasionSuggestion {
  id: string;
  occasion_id: string;
  title: string;
  description?: string;
  min_budget?: string;
  max_budget?: string;
  target_audience?: string;
  product_ids: string; // JSON String -> parse to string[]
  addon_ids: string; // JSON String -> parse to string[]
  personalization_type_id?: string;
  suggested_message?: string;
  sort_order: number;
}

export interface SavedOccasion {
  id: string;
  user_id: string;
  occasion_id: string;
  title: string;
  date: string;
  recipient_name?: string;
  reminders_enabled: boolean;
  days_before_reminder: number;
  created_at: string;
}
