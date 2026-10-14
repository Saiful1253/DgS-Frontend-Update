export interface NotificationChannel {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationEvent {
  id: number;
  event_code: string;
  description: string | null;
  category: 'order' | 'cancel' | 'return' | 'delivery' | 'payment' | 'otp';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: number;
  event_id: number;
  event: NotificationEvent;
  channel_id: number;
  channel: NotificationChannel;
  language: string;
  title: string | null;
  body_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateTemplatePayload {
  body_template?: string;
  is_active?: boolean;
  title?: string;
}
