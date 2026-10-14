/**
 * Single source of truth for the backend origin.
 *
 * Previously each call site resolved this independently and the fallbacks
 * disagreed: server-fetch.ts and proxy.ts used `http://localhost:3001/api/v1`
 * while sitemap.ts used `http://localhost:5000` (no /api/v1 prefix, wrong port).
 * A missing or misnamed env var therefore produced silently broken fetches in
 * one subsystem only. Every caller now derives the URL from this module.
 *
 * Includes the `/api/v1` prefix. Callers append their own path segment.
 */
const DEFAULT_BACKEND_URL = "http://localhost:3001/api/v1";

function normalize(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return DEFAULT_BACKEND_URL;
  // Strip trailing slashes so callers can safely append `/segment`.
  return value.replace(/\/+$/, "");
}

/** Absolute backend base URL including the `/api/v1` prefix. */
export function getBackendUrl(): string {
  return normalize(process.env.NEXT_PUBLIC_BACKEND_URL);
}

/** Absolute backend URL for a given path segment, e.g. `/client/auth/refresh`. */
export function backendUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendUrl()}${suffix}`;
}
