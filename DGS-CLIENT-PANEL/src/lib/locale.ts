/**
 * Locale primitives shared by the client (LanguageProvider, LanguageSwitcher).
 *
 * Kept as a plain module so it can be imported from anywhere without pulling
 * React (or the server) into the graph.
 */

export type Locale = "en" | "bn";

/** Cookie the language switcher writes to remember the visitor's choice. */
export const LOCALE_COOKIE = "dgs_locale";

export const DEFAULT_LOCALE: Locale = "en";

/** Narrow an arbitrary cookie value to a supported locale. */
export function resolveLocale(value: string | null | undefined): Locale {
  return value === "bn" ? "bn" : DEFAULT_LOCALE;
}

/** Read the persisted locale from the browser cookie (client only). */
export function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  if (!match) return null;
  return resolveLocale(decodeURIComponent(match[1]));
}

/** Persist the locale choice for one year. */
export function writeLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${oneYear}; samesite=lax`;
}
