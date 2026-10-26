import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface PickerOption {
  key: string;
  label: string;
  hint?: string;
}

interface OptionPickerProps {
  options: PickerOption[];
  selected: string[];
  onToggle: (key: string) => void;
  placeholder?: string;
  countLabel?: string;
  emptyText?: string;
  allowCreate?: boolean;
  onCreate?: (val: string) => void;
  createPrefix?: string;
  closeOnSelect?: boolean;
  pageSize?: number;
  hideChips?: boolean;
}

export default function OptionPicker({
  options,
  selected,
  onToggle,
  placeholder = "search...",
  countLabel = "selected",
  emptyText = "No matching options.",
  allowCreate = false,
  onCreate,
  createPrefix = "+ Create",
  closeOnSelect = false,
  pageSize = 8,
  hideChips = false,
}: OptionPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [page, query]);

  const trimmed = query.trim();
  const qLower = trimmed.toLowerCase();
  const exactMatch = options.some((o) => {
    const k = (o.key != null) ? String(o.key).toLowerCase() : "";
    const l = ((o.label != null) ? String(o.label).replace(/^#+/, "") : "").toLowerCase();
    const qn = qLower.replace(/^#+/, "");
    return (k && k === qn) || (l && l === qn);
  });
  const showCreateOption = allowCreate && trimmed.length > 0 && !exactMatch;

  const handleCreate = (val: string) => {
    const cleanVal = (val || "").trim().replace(/^#+/, "");
    if (!cleanVal) return;
    if (onCreate) {
      onCreate(cleanVal);
    } else {
      onToggle(cleanVal);
    }
    setQuery("");
    if (closeOnSelect) {
      setIsOpen(false);
      setPage(0);
    } else {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      if (allowCreate && trimmed) {
        e.preventDefault();
        handleCreate(trimmed);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!allowCreate) return;
    const text = e.clipboardData.getData("text");
    const parts = text.split(/[,\n]+/).map((s) => s.trim().replace(/^#+/, "")).filter(Boolean);
    if (parts.length > 1) {
      e.preventDefault();
      parts.forEach((p) => {
        if (onCreate) onCreate(p);
        else onToggle(p);
      });
      setQuery("");
      if (closeOnSelect) setIsOpen(false);
      else inputRef.current?.focus();
    }
  };

  const filtered = useMemo(() => {
    if (!qLower) return options;
    return options.filter((o) => {
      const label = (o.label != null) ? String(o.label).toLowerCase() : "";
      const hint = (o.hint != null) ? String(o.hint).toLowerCase() : "";
      const key = (o.key != null) ? String(o.key).toLowerCase() : "";
      return label.includes(qLower) || hint.includes(qLower) || key.includes(qLower);
    });
  }, [options, qLower]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages - 1);
  const visibleStart = clampedPage * pageSize;
  const pageOptions = filtered.slice(visibleStart, visibleStart + pageSize);
  const anyOnPage = filtered.length > 0;

  const pick = (key: string) => {
    onToggle(key);
    if (closeOnSelect) {
      setQuery("");
      setIsOpen(false);
      setPage(0);
    } else {
      inputRef.current?.focus();
    }
  };

  const turn = (dir: 1 | -1) => {
    setPage((prev) => Math.min(totalPages - 1, Math.max(0, prev + dir)));
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition shadow-2xs cursor-text">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
                if (!isOpen) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              className="flex-1 text-xs outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
            />
            {query && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {selected.length > 0 && (
              <span className="text-[10px] font-semibold text-slate-400 shrink-0">{selected.length} {countLabel}</span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          onWheel={(e) => e.stopPropagation()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="z-[60] w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden bg-white border-slate-200 overscroll-contain"
        >
          <div className="px-3 pt-2.5 pb-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {selected.length} {countLabel}
            </span>
            {allowCreate && (
              <span className="text-[10px] font-medium text-slate-400">Press Enter or , to add</span>
            )}
          </div>

          {showCreateOption && (
            <div className="p-1 border-b border-slate-100 bg-primary/5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleCreate(trimmed)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-primary/10 rounded-md transition-colors cursor-pointer"
              >
                <span className="w-4 h-4 rounded border border-dashed border-primary text-primary flex items-center justify-center shrink-0">
                  <Plus className="w-3 h-3" />
                </span>
                <span className="text-xs font-semibold text-primary">
                  {createPrefix} &quot;{trimmed.replace(/^#+/, "")}&quot;
                </span>
              </button>
            </div>
          )}

          <div
            ref={listRef}
            data-picker-scroll
            className="max-h-60 overflow-y-auto overscroll-contain divide-y divide-slate-100"
          >
            {!anyOnPage ? (
              <div className="p-3 text-center text-[11px] text-slate-400">{emptyText}</div>
            ) : (
              pageOptions.map((o, idx) => {
                const k = (o.key != null && String(o.key).trim() !== "") ? String(o.key) : `opt-${idx}-${o.label != null ? String(o.label).replace(/\s+/g, "-") : "item"}`;
                const on = selected.includes(k) || (o.key != null ? selected.includes(String(o.key)) : false);
                return (
                  <button
                    key={`${k}-${idx}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick((o.key != null && String(o.key).trim() !== "") ? String(o.key) : k)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      on ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
                    )}>
                      {on && <Check className="w-3 h-3" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold text-slate-800 truncate">{o.label}</span>
                      {o.hint && <span className="block text-[10px] text-slate-400 truncate">{o.hint}</span>}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-100">
            <span className="text-[10px] font-semibold text-slate-500">
              {totalPages > 1 ? `Page ${clampedPage + 1} of ${totalPages} (${filtered.length} total)` : `${filtered.length} items`}
            </span>
            <div className="flex items-center gap-1.5">
              {totalPages > 1 && (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => turn(-1)}
                    disabled={clampedPage === 0}
                    className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => turn(1)}
                    disabled={clampedPage === totalPages - 1}
                    className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 text-[10px] font-bold text-primary hover:bg-primary/10 rounded cursor-pointer ml-1"
              >
                Done
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {!hideChips && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {selected.map((key) => {
            const opt = options.find((o) => o.key === key);
            const label = opt ? opt.label : (allowCreate ? `#${key.replace(/^#+/, "")}` : key);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-full bg-primary/8 text-primary border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold"
              >
                {label}
                <button
                  type="button"
                  onClick={() => onToggle(key)}
                  className="hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                  title={`Remove ${label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
