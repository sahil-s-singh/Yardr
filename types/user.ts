// User-related type definitions

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  garage_sale_id: string;
  created_at: string;
}

export interface UserReminder {
  id: string;
  user_id: string;
  garage_sale_id: string;
  reminder_time: string;
  notification_sent: boolean;
  expo_push_token: string | null;
  created_at: string;
}

export interface UserSaleView {
  id: string;
  user_id: string;
  garage_sale_id: string;
  viewed_at: string;
}
