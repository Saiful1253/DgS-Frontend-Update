"use client";

import React, { useState } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BLOG_STATUSES } from "@/zod/blog.validation";
import { cn } from "@/lib/utils";

export const STATUS_BADGE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  internal_review: "bg-sky-mist text-primary border-primary/25",
  scheduled: "bg-violet-100 text-violet-700 border-violet-200",
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  archived: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export const STATUS_DOT: Record<string, string> = {
  draft: "bg-slate-400",
  internal_review: "bg-primary",
  scheduled: "bg-violet-500",
  published: "bg-emerald-500",
  archived: "bg-zinc-500",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  internal_review: "Internal Review",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

interface BlogStatusMenuProps {
  status: string;
  disabled?: boolean;
  onSelect: (status: string, publishAt?: string) => Promise<boolean> | boolean | void;
  className?: string;
  triggerClassName?: string;
  labelClassName?: string;
  align?: "start" | "center" | "end";
}

export default function BlogStatusMenu({
  status,
  disabled = false,
  onSelect,
  triggerClassName,
  labelClassName,
  align = "end",
}: BlogStatusMenuProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [publishAt, setPublishAt] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (s: string, at?: string) => {
    setBusy(true);
    try {
      await onSelect(s, at);
    } finally {
      setBusy(false);
    }
  };

  const choose = (s: string) => {
    if (s === status) return;
    if (s === "scheduled") {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setPublishAt(tomorrow);
      setScheduleOpen(true);
      return;
    }
    run(s);
  };

  const confirmSchedule = async () => {
    if (!publishAt) return;
    const dateStr = publishAt.includes("T") ? publishAt : `${publishAt}T23:59:00`;
    const at = new Date(dateStr);
    if (isNaN(at.getTime())) {
      setPublishAt("");
      return;
    }
    setScheduleOpen(false);
    await run("scheduled", at.toISOString());
  };

  const badge = STATUS_BADGE[status] || STATUS_BADGE.draft;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
              disabled ? "cursor-default" : "cursor-pointer hover:shadow-sm",
              badge,
              triggerClassName,
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title={disabled ? undefined : "Change status"}
          >
            <span className={cn(labelClassName)}>{STATUS_LABELS[status] || status}</span>
            {!disabled && <ChevronDown className="w-3 h-3" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="z-[70] min-w-[180px]" onWheel={(e) => e.stopPropagation()}>
          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Change status
          </DropdownMenuLabel>
          {BLOG_STATUSES.map((s) => (
            <DropdownMenuItem
              key={s}
              disabled={disabled || s === status}
              onSelect={() => choose(s)}
              className="gap-2 text-xs font-semibold cursor-pointer"
            >
              <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[s] || STATUS_DOT.draft)} />
              {STATUS_LABELS[s] || s}
              {s === "scheduled" && <CalendarClock className="w-3.5 h-3.5 ml-auto text-slate-400" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-violet-500" /> Schedule Publish
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <label className="text-xs font-bold text-slate-700">
              Publish Target Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={publishAt ? publishAt.slice(0, 10) : ""}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setPublishAt(e.target.value)}
              autoFocus
              className="h-10 text-sm bg-white cursor-pointer"
            />
            <p className="text-[10px] font-medium text-slate-400">
              The article is auto-published nightly at 11:59 PM on this selected date.
            </p>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              onClick={confirmSchedule}
              disabled={busy || !publishAt}
              className="bg-primary text-white hover:bg-primary/90 font-semibold"
            >
              {busy ? "Saving..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}