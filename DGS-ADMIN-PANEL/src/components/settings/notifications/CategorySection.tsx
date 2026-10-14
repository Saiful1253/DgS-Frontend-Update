'use client';

import React from 'react';
import { NotificationTemplate } from '@/types/notifications/notification';
import TemplateCard from './TemplateCard';
import { KeyRound, Bell } from 'lucide-react';

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
  otp: {
    label: 'Authentication & OTP Verification',
    icon: <KeyRound className="w-5 h-5 text-primary" />,
    desc: 'SMS and email template used for password reset OTP verification code delivery.',
  },
};

interface CategorySectionProps {
  category: string;
  templates: NotificationTemplate[];
  onUpdated: (updated: NotificationTemplate) => void;
}

export default function CategorySection({ category, templates, onUpdated }: CategorySectionProps) {
  const meta = CATEGORY_META[category] || {
    label: category.toUpperCase(),
    icon: <Bell className="w-5 h-5 text-primary" />,
    desc: 'Notification templates for this category.',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        {meta.icon}
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {meta.label}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {meta.desc}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {templates.map((tpl) => (
          <TemplateCard key={tpl.id} template={tpl} onUpdated={onUpdated} />
        ))}
      </div>
    </div>
  );
}
