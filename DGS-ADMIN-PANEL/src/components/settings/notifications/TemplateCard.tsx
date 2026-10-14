'use client';

import React, { useState, useRef } from 'react';
import { NotificationTemplate } from '@/types/notifications/notification';
import { updateNotificationTemplate, resetNotificationTemplate } from '@/services/notification/notification.service';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RotateCcw, Save, MessageSquare, Info, Sparkles } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CATEGORY_VARIABLES: Record<string, string[]> = {
  otp: ['otp', 'shopName'],
};

interface TemplateCardProps {
  template: NotificationTemplate;
  onUpdated: (updated: NotificationTemplate) => void;
}

export default function TemplateCard({ template, onUpdated }: TemplateCardProps) {
  const [body, setBody] = useState(template?.body_template || '');
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (template) {
      setBody(template.body_template || '');
      setIsActive(template.is_active ?? true);
    }
  }, [template]);

  const category = template.event?.category || 'otp';
  const isOtpCategory = category === 'otp';
  const availableVars = CATEGORY_VARIABLES[category] || CATEGORY_VARIABLES.otp;
  const isChanged = body !== template.body_template;

  const insertVariable = (varName: string) => {
    const placeholder = `{${varName}}`;
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => prev + ' ' + placeholder);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = body.substring(0, start) + placeholder + body.substring(end);
    setBody(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateNotificationTemplate(template.id, {
        body_template: body,
        is_active: isActive,
      });

      if (res.success && res.data) {
        toast.success(`Template updated for ${template.event?.event_code || 'event'}`);
        onUpdated(res.data);
      } else {
        toast.error(res.message || 'Failed to update template');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setIsActive(checked);
    try {
      const res = await updateNotificationTemplate(template.id, { is_active: checked });
      if (res.success && res.data) {
        toast.success(`Notification ${checked ? 'enabled' : 'disabled'}`);
        onUpdated(res.data);
      } else {
        setIsActive(!checked);
        toast.error(res.message || 'Failed to update status');
      }
    } catch (err) {
      setIsActive(!checked);
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const confirmReset = async () => {
    setShowResetConfirm(false);
    setIsResetting(true);
    try {
      const res = await resetNotificationTemplate(template.id);
      if (res.success && res.data) {
        setBody(res.data.body_template);
        setIsActive(res.data.is_active);
        toast.success('Template reset to system default');
        onUpdated(res.data);
      } else {
        toast.error(res.message || 'Failed to reset template');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred while resetting');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={`p-5 rounded-xl border transition-all duration-200 ${
      isActive 
        ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm' 
        : 'bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200/60 dark:border-zinc-800/60 opacity-80'
    }`}>
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-slate-900">
              {template.event?.event_code}
            </h3>
          </div>
          {template.event?.description && (
            <p className="text-xs text-slate-500 mt-0.5">
              {template.event.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isOtpCategory
              ? 'bg-sky-mist text-primary border border-primary/20'
              : isActive 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {isOtpCategory ? 'Always Active' : isActive ? 'Active' : 'Disabled'}
          </span>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={isOtpCategory}
            aria-label="Toggle SMS Template"
          />
          {isOtpCategory && (
            <span className="text-[10px] text-primary font-medium">Required for auth</span>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="space-y-3">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          disabled={!isOtpCategory && !isActive}
          className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed transition"
          placeholder="Enter SMS template..."
        />

        {/* Dynamic Variable Pills */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Click to insert dynamic placeholder:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableVars.map((v) => (
              <button
                key={v}
                type="button"
                disabled={!isOtpCategory && !isActive}
                onClick={() => insertVariable(v)}
                className="text-[11px] font-mono px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-400 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {`{${v}}`}
              </button>
            ))}
          </div>
        </div>

        {/* Character Count & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <Info className="w-3.5 h-3.5" />
            <span>Length: {body.length} chars (approx {Math.ceil(body.length / 160) || 1} SMS unit)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              disabled={isResetting || (!isOtpCategory && !isActive)}
              className="h-8 text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || (!isOtpCategory && !isActive) || !isChanged}
              className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary-hover text-white shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation AlertDialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="rounded-2xl border-slate-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Reset SMS Template</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Are you sure you want to reset <span className="font-bold text-emerald-600">&quot;{template.event?.event_code}&quot;</span> to default? This will restore the original SMS template text.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmReset();
              }}
              disabled={isResetting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              {isResetting ? 'Resetting...' : 'Confirm Reset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
