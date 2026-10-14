/**
 * Single source of truth for the backend origin.
 *
 * Three call sites previously resolved this independently and the fallbacks
 * disagreed: `server-fetch.ts` read `BACKEND_API_URL` before
 * `NEXT_PUBLIC_BACKEND_URL`, while `public-fetch.ts` and
 * `auth.refresh.service.ts` read only `NEXT_PUBLIC_BACKEND_URL`. A deployment
 * that set only one of the two therefore authenticated admin traffic against a
 * different origin than public traffic, with no error to explain it.
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
  return normalize(process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL);
}

/** Absolute backend URL for a given path segment, e.g. `/client/auth/refresh`. */
export function backendUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendUrl()}${suffix}`;
}
