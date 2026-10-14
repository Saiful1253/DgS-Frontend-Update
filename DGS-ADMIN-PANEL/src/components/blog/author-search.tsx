"use client";

import React, { useState, useRef, useEffect } from "react";
import { BlogAuthor } from "@/types/blog";
import { Plus, Search, X, UserRound, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const PAGE_SIZE = 10;

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

interface AuthorSearchProps {
  authors: BlogAuthor[];
  selected?: BlogAuthor | null;
  multiple?: boolean;
  checkedNames?: string[];
  primaryAuthorName?: string;
  onSelect: (a: BlogAuthor) => void;
  onClear?: () => void;
  placeholder?: string;
  emptyText?: string;
  inputRef?: React.RefObject<HTMLDivElement | null>;
}

export function AuthorAvatar({
  author,
  size = 38,
}: {
  author: { name: string; avatar_url?: string | null };
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const [lastUrl, setLastUrl] = useState(author.avatar_url);
  if (lastUrl !== author.avatar_url) {
    setLastUrl(author.avatar_url);
    setImgError(false);
  }

  return (
    <div
      className="rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 relative"
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.32)) }}
    >
      {author.avatar_url && !imgError ? (
        <Image
          src={author.avatar_url}
          alt={author.name}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initialsOf(author.name) || <UserRound className="w-4 h-4" />}</span>
      )}
    </div>
  );
}

export default function AuthorSearch({
  authors,
  selected,
  multiple = false,
  checkedNames = [],
  primaryAuthorName,
  onSelect,
  onClear,
  placeholder,
  emptyText,
  inputRef,
}: AuthorSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleType = (value: string) => {
    setQuery(value);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length > 0) {
      debounceRef.current = setTimeout(() => setIsOpen(true), 300);
    } else {
      setIsOpen(false);
    }
  };

  const trimmed = query.trim().toLowerCase();

  // Exclude primary author and already added co-authors from suggestion dropdown
  const excludedSet = new Set<string>();
  if (multiple) {
    if (primaryAuthorName) excludedSet.add(primaryAuthorName.trim().toLowerCase());
    checkedNames.forEach((n) => excludedSet.add(n.trim().toLowerCase()));
  } else if (selected?.name) {
    excludedSet.add(selected.name.trim().toLowerCase());
  }

  const filtered = authors
    .filter((a) => !excludedSet.has((a.name || "").trim().toLowerCase()))
    .filter((a) => {
      if (!trimmed) return true;
      return (
        (a.name || "").toLowerCase().includes(trimmed) ||
        (a.designation || "").toLowerCase().includes(trimmed) ||
        (a.bio || "").toLowerCase().includes(trimmed)
      );
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const clampedPage = Math.min(page, totalPages - 1);
  const pageAuthors = clampedPage !== page ? filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE) : visible;

  const pick = (a: BlogAuthor) => {
    onSelect(a);
    setQuery("");
    setIsOpen(false);
    setPage(0);
  };

  const clearAll = () => {
    onClear?.();
    setQuery("");
    setPage(0);
  };

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        if (inputRef) inputRef.current = el;
      }}
      className="relative space-y-2"
    >
      <Popover open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setPage(0); }}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition shadow-2xs cursor-text">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => handleType(e.target.value)}
              placeholder={placeholder || "Type author name to search..."}
              className="flex-1 text-xs outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuery("");
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
          className="z-[60] w-[var(--radix-popover-trigger-width)] p-0 max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {filtered.length > 0 ? (
            pageAuthors.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => pick(a)}
                className="w-full flex items-start justify-between gap-3 p-2.5 rounded-lg text-left hover:bg-sky-50/70 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <AuthorAvatar author={a} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{a.name}</span>
                      {a.designation && (
                        <span className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {a.designation}
                        </span>
                      )}
                      {Number(a.posts_count) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          <BookOpen className="w-2.5 h-2.5 text-slate-400" />
                          {a.posts_count} {a.posts_count === 1 ? "post" : "posts"}
                        </span>
                      )}
                    </div>
                    {a.bio && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                        {a.bio}
                      </p>
                    )}
                  </div>
                </div>

                <span className="shrink-0 self-center pl-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-sky-50 border border-primary/20 px-2.5 py-1 rounded-md">
                  <Plus className="w-3.5 h-3.5" /> Add
                </span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              {emptyText || `No authors found matching "${query.trim()}".`}
            </div>
          )}
          {totalPages > 1 && (
            <div className="sticky bottom-0 flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-200 bg-white/95 backdrop-blur">
              <span className="text-[11px] text-slate-500">
                Page {clampedPage + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={clampedPage <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="h-6 px-1.5 border-slate-200 shadow-none text-slate-500 disabled:opacity-40"
                  title="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={clampedPage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="h-6 px-1.5 border-slate-200 shadow-none text-slate-500 disabled:opacity-40"
                  title="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected single card (Primary author) */}
      {selected && !multiple && (
        <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5 shadow-2xs">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <AuthorAvatar author={selected} size={42} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900">{selected.name}</span>
                {selected.designation && (
                  <span className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {selected.designation}
                  </span>
                )}
                {Number(selected.posts_count) > 0 && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                    <BookOpen className="w-2.5 h-2.5 text-slate-400" />
                    {selected.posts_count} {selected.posts_count === 1 ? "post" : "posts"}
                  </span>
                )}
              </div>
              {selected.bio ? (
                <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-snug">
                  {selected.bio}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 italic mt-0.5">No biography provided</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={clearAll}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition shrink-0"
            title="Remove or change primary author"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}