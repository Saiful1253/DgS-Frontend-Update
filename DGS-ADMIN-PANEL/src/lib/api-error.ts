/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Shared HTTP-response reader for the server-action layer.
 *
 * Fourteen services each carried a byte-identical private `parseResponse` that
 * stamped `statusCode` into the parsed body so `fromServiceResponse` could tell
 * a failure from a success. The convention worked but lived in fourteen places,
 * and two services (`dashboard`, `auth`) never adopted it — they returned bare
 * `res.json()`, so a 502 from the reverse proxy surfaced to the operator as a
 * raw JSON parse error.
 *
 * Both concerns now live here: read the body, and mark it as a failure when the
 * transport says so.
 */

/** Milliseconds before a backend call is abandoned. */
export const BACKEND_TIMEOUT_MS = 10_000;

/**
 * Read a backend response as JSON and normalise its failure signalling.
 *
 * Never throws. A non-JSON body (proxy HTML error page, empty 204) becomes `{}`
 * carrying the real `statusCode`, so the caller still sees a failure rather than
 * a silent success.
 */
export async function parseApiResponse(res: Response): Promise<any> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok && !json.statusCode) {
    json.statusCode = res.status;
  }
  return json;
}

/**
 * Human-readable message from a backend error body, for `fail(...)`.
 *
 * Handles the shapes NestJS actually emits: `{ message }` as a string, as an
 * array of validation errors, or as a nested object.
 */
export async function extractApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  let body: any;
  try {
    body = await res.clone().json();
  } catch {
    return fallback;
  }
  return messageFromBody(body, fallback);
}

/** Message extraction from an already-parsed body. */
export function messageFromBody(body: any, fallback: string): string {
  if (!body || !body.message) return fallback;
  const message = body.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    return (
      message
        .map((m: any) => (typeof m === "string" ? m : m?.message || JSON.stringify(m)))
        .join(", ") || fallback
    );
  }
  if (typeof message === "object") {
    return message.message || JSON.stringify(message) || fallback;
  }
  return fallback;
}
