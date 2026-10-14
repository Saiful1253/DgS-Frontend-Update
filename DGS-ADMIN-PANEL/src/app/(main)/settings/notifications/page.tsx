import React from 'react';
import NotificationTemplatesPage from '@/components/settings/notifications/NotificationTemplatesPage';

export const metadata = {
  title: 'Notification Templates | Settings',
  description: 'Manage and customize bulk SMS notification templates for order lifecycle events.',
};

export default function NotificationsSettingsPage() {
  return <NotificationTemplatesPage />;
}
