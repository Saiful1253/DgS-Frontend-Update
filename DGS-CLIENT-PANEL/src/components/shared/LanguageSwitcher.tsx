"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা" },
] as const;

/**
 * Navbar language dropdown. Selecting Bangla flips the site to auto-translated
 * Bangla (see `<AutoTranslate>`); the choice is persisted in a cookie.
 */
export default function LanguageSwitcher({
  className,
  fullWidth = false,
}: {
  className?: string;
  fullWidth?: boolean;
}) {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = OPTIONS.find((option) => option.value === locale) ?? OPTIONS[0];

  return (
    <div ref={containerRef} className={cn("relative", fullWidth && "w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-lg border border-white/20 text-slate-200 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer",
          fullWidth && "w-full h-11 justify-center",
        )}
      >
        <Globe className="w-4 h-4" />
        <span>{current.label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className={cn(
            "absolute z-50 mt-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl",
            fullWidth ? "left-0 right-0" : "right-0 min-w-[10rem]",
          )}
        >
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={locale === option.value}
              onClick={() => {
                setLocale(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-white/5 cursor-pointer",
                locale === option.value ? "text-white" : "text-slate-300",
              )}
            >
              <span>{option.label}</span>
              {locale === option.value && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
