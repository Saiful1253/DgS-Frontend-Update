/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { NotificationTemplate } from '@/types/notifications/notification';
import { getNotificationTemplates } from '@/services/notification/notification.service';
import CategorySection from './CategorySection';
import { Bell, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNotificationTemplates();
      if (res.success && Array.isArray(res.data)) {
        setTemplates(res.data);
        setError(null);
      } else {
        // A failed read must not present as "no templates configured" — the
        // operator would read it as a wiped catalogue rather than an outage.
        setTemplates([]);
        setError(res.message || 'Failed to load notification templates.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    const cat = new URLSearchParams(window.location.search).get('category');
    if (cat) setSelectedCategory(cat);
  }, []);

  const handleTemplateUpdated = (updated: NotificationTemplate) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  // Group templates by category
  const categoriesOrder = ['otp'];
  const grouped: Record<string, NotificationTemplate[]> = {};



  (Array.isArray(templates) ? templates : []).forEach((t) => {
    const cat = t.event?.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  });

  // fixed order first, then any dynamically-seeded categories not in the list
  const dynamicCats = Object.keys(grouped).filter((c) => !categoriesOrder.includes(c));
  const allCategoriesOrdered = [...categoriesOrder, ...dynamicCats];

  const activeCategories = allCategoriesOrdered.filter(
    (cat) => grouped[cat] && grouped[cat].length > 0
  );

  const displayedCategories =
    selectedCategory === 'all'
      ? activeCategories
      : activeCategories.filter((c) => c === selectedCategory);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-mist text-primary border border-primary/20">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Bulk SMS & Notification Templates
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Customize the exact SMS text sent to clients and leads for inquiry confirmations, quotes, meeting reminders, and alerts. All variables inside <code className="text-primary font-mono text-[11px]">{"{placeholders}"}</code> are dynamically replaced.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTemplates}
          disabled={loading}
          className="h-9 gap-2 self-start sm:self-auto border-primary text-primary hover:bg-sky-mist"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${selectedCategory === 'all'
            ? 'bg-primary text-white border-primary shadow-xs'
            : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'
            }`}
        >
          All Categories ({templates.length})
        </button>

        {activeCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border capitalize transition-all ${selectedCategory === cat
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'
              }`}
          >
            {cat} ({grouped[cat]?.length || 0})
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800/40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Categories Sections */}
      {!loading && displayedCategories.length > 0 && (
        <div className="space-y-8">
          {displayedCategories.map((cat) => (
            <CategorySection
              key={cat}
              category={cat}
              templates={grouped[cat]}
              onUpdated={handleTemplateUpdated}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && displayedCategories.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No Templates Available</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            There are currently no notification templates found for this category. System default templates will be used for sending SMS.
          </p>
        </div>
      )}
    </div>
  );
}
