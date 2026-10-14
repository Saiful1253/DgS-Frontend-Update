/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shared HTTP-response reader for the server-action layer.
 *
 * Both concerns live here: read the body, and mark it as a failure when the
 * transport says so. `parseApiResponse` stamps `statusCode` into the parsed body
 * so `fromServiceResponse` can tell a failure from a success without every
 * action re-deriving it.
 */

/**
 * Milliseconds before a backend call is abandoned.
 *
 * Without this a hung backend holds the request open until the platform timeout.
 * Callers may still pass their own `signal`, which wins.
 */
export const BACKEND_TIMEOUT_MS = 10_000;

/**
 * Read a backend response as JSON and normalise its failure signalling.
 *
 * Never throws. A non-JSON body (proxy HTML error page, empty 204) becomes `{}`
 * carrying the real `statusCode`, so the caller still sees a failure rather than
 * a silent success.
 *
 * Consumes the body. Use `extractApiErrorMessage` alongside it - that one
 * clones first, so the two can be called in either order.
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
 * array of validation errors, or as a nested object. Reads a clone, so it is
 * safe to call after `parseApiResponse` has drained the original body.
 */
export async function extractApiErrorMessage(
  res: Response,
  fallback: string
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
  if (!body) return fallback;
  if (!body.message) return body.error || fallback;

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