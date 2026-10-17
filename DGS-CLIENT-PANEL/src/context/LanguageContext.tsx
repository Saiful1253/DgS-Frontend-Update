"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_LOCALE,
  readLocaleCookie,
  writeLocaleCookie,
  type Locale,
} from "@/lib/locale";

/**
 * Client-side language state for the public site.
 *
 * Content is authored only in English (admin panel) and rendered in Bangla by
 * the `<AutoTranslate>` layer when `locale === "bn"`. This provider just holds
 * the current locale, persists it in the `dgs_locale` cookie, and keeps
 * `<html lang>` in sync so assistive tech and crawlers see the right language.
 *
 * The cookie is read on mount (not during SSR) so the layout does not have to
 * call `cookies()` — that would opt every route into dynamic rendering and
 * disable the per-route ISR the marketing pages rely on.
 */

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function LanguageProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Restore the visitor's choice on mount (client only).
  useEffect(() => {
    const stored = readLocaleCookie();
    if (stored && stored !== locale) {
      setLocaleState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeLocaleCookie(next);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
