import { NotificationChannel } from './api';

export interface Notification {
  id: string;
  user_id: string;
  type: string; // e.g., 'order_status_update', 'new_message', 'system_alert'
  title: string;
  message: string;
  data?: any; // JSON payload for routing, e.g., { order_id: string }
  is_read: boolean;
  channel: NotificationChannel;
  created_at: string;
}

export interface NotificationPreference {
  user_id: string;
  sms_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  marketing_enabled: boolean;
  created_at: string;
  updated_at: string;
}
