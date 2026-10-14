"use client";

import React, { useMemo, useRef, useState } from "react";
import { Hash, Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PickerOption } from "./option-picker";

const CREATE = "__create__";

interface SmartTagInputProps {
  tags: string[];
  suggestions: PickerOption[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  max?: number;
  placeholder?: string;
}

const clean = (t: string) => t.trim().replace(/^#+/, "");

export default function SmartTagInput({
  tags,
  suggestions,
  onAdd,
  onRemove,
  max = 25,
  placeholder = "Type a tag and press Enter",
}: SmartTagInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selIdx, setSelIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const q = query.trim();
  const qLower = q.toLowerCase();
  const selectedSet = useMemo(
    () => new Set(tags.map((t) => t.toLowerCase())),
    [tags],
  );
  const atMax = tags.length >= max;

  const items = useMemo(() => {
    const visible = suggestions
      .filter((o) => !selectedSet.has(o.key.toLowerCase()))
      .filter((o) => {
        if (!qLower) return true;
        const label = o.label.replace(/^#+/, "").toLowerCase();
        return label.includes(qLower) || (o.hint || "").toLowerCase().includes(qLower);
      })
      .slice(0, 10);
    const exact = visible.some((o) => o.label.replace(/^#+/, "").toLowerCase() === qLower);
    const showCreate = qLower.length > 0 && !exact && !selectedSet.has(qLower) && !atMax;
    return showCreate ? [CREATE, ...visible] : visible;
  }, [suggestions, selectedSet, qLower, atMax]);

  const commit = (tag: string) => {
    if (atMax) {
      setQuery("");
      setIsOpen(false);
      return;
    }
    onAdd(tag);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const commitAt = (idx: number) => {
    const item = items[idx];
    if (!item) return;
    if (item === CREATE) commit(clean(q));
    else commit(clean((item as PickerOption).label.replace(/^#+/, "")));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (!q) return;
      if (items.length > 0 && qLower) commitAt(Math.min(selIdx, items.length - 1));
      else commit(q);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setSelIdx((p) => {
        if (items.length === 0) return 0;
        if (e.key === "ArrowDown") return (p + 1) % items.length;
        return (p - 1 + items.length) % items.length;
      });
      return;
    }
    if (e.key === "Escape") setIsOpen(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const parts = e.clipboardData.getData("text").split(/[,\n]+/).map(clean).filter(Boolean);
    if (parts.length <= 1) return;
    e.preventDefault();
    parts.forEach((t, i) => {
      if (tags.length + i < max) onAdd(t);
    });
    setQuery("");
    setIsOpen(false);
  };

  const open = () => setIsOpen(true);

  return (
    <div className="space-y-1.5">
      <Popover open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setSelIdx(0); }}>
        <PopoverTrigger asChild>
          <div
            className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 p-2 min-h-11 bg-white cursor-text shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition"
            onClick={open}
          >
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-sky-mist text-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              >
                #{t}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(t);
                  }}
                  title={`Remove tag ${t}`}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelIdx(0);
                if (e.target.value.trim()) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={open}
              placeholder={tags.length ? "" : placeholder}
              className="flex-1 min-w-36 text-xs outline-none bg-transparent placeholder:text-slate-400"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
          className="z-[60] w-[var(--radix-popover-trigger-width)] p-0 max-h-56 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {items.length === 0 ? (
            <p className="p-3 text-center text-[11px] text-slate-400">
              {atMax ? "Maximum tags reached." : qLower ? `No tags found. Type more characters.` : "No tags found."}
            </p>
          ) : (
            items.map((item, i) =>
              item === CREATE ? (
                <button
                  key={CREATE}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commitAt(i)}
                  onMouseEnter={() => setSelIdx(i)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer transition-colors",
                    selIdx === i && "bg-slate-50",
                  )}
                >
                  <span className="w-4 h-4 rounded border border-dashed border-primary/40 bg-primary/5 text-primary flex items-center justify-center shrink-0">
                    <Plus className="w-3 h-3" />
                  </span>
                  <span className="text-xs font-semibold text-primary">Create #{clean(q)}</span>
                </button>
              ) : (
                (() => {
                  const opt = item as PickerOption;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => commitAt(i)}
                      onMouseEnter={() => setSelIdx(i)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer transition-colors",
                        selIdx === i && "bg-slate-50",
                      )}
                    >
                      <span className="w-4 h-4 rounded border border-primary/40 bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Hash className="w-3 h-3" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold text-slate-800 truncate">
                          {opt.label.replace(/^#+/, "#")}
                        </span>
                        {opt.hint && (
                          <span className="block text-[10px] text-slate-400 truncate">{opt.hint}</span>
                        )}
                      </span>
                    </button>
                  );
                })()
              ),
            )
          )}
        </PopoverContent>
      </Popover>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-slate-400">
          Enter or <span className="font-mono">,</span> to add · paste comma-separated lists
        </p>
        <span className="text-[10px] font-semibold text-slate-400">
          {tags.length}/{max}
        </span>
      </div>
    </div>
  );
}