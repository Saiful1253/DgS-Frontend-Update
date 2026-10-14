/* eslint-disable @typescript-eslint/no-explicit-any */
export type ActionResult<
  TErrors extends Record<string, string | undefined> = Record<string, never>,
> = {
  success: boolean;
  message?: string;
  errors?: TErrors;
  data?: any;
  /**
   * Pagination envelope for list reads. Kept beside `data` rather than nested
   * inside it so a reader can reach the page/total without knowing which
   * resource shape the endpoint happens to use.
   */
  meta?: any;
  /**
   * Upstream HTTP status for a failure, so callers can tell an expired session
   * (401/403) from a backend outage (5xx) without parsing the message text.
   * Previously this was smuggled inside `data`, which no reader could rely on.
   */
  statusCode?: number;
};

export function formatErrorMessage(e: unknown, fallback: string = "An error occurred"): string {
  if (!e) return fallback;

  if (typeof e === "string") {
    const trimmed = e.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const msgs = parsed.map((p: any) => {
            if (typeof p === "string") return p;
            const pathStr = Array.isArray(p.path) && p.path.length > 0 ? ` (${p.path.join(".")})` : "";
            return (p.message || p.error || JSON.stringify(p)) + pathStr;
          });
          return msgs.join(", ");
        }
        if (typeof parsed === "object" && parsed !== null) {
          return parsed.message || parsed.error || e;
        }
      } catch {
        // ignore parse error
      }
    }
    return e;
  }

  if (e instanceof Error) {
    const msg = e.message.trim();
    if (msg.startsWith("[") || msg.startsWith("{")) {
      try {
        const parsed = JSON.parse(msg);
        if (Array.isArray(parsed)) {
          const msgs = parsed.map((p: any) => {
            if (typeof p === "string") return p;
            const pathStr = Array.isArray(p.path) && p.path.length > 0 ? ` (${p.path.join(".")})` : "";
            return (p.message || p.error || JSON.stringify(p)) + pathStr;
          });
          return msgs.join(", ");
        }
        if (typeof parsed === "object" && parsed !== null) {
          return parsed.message || parsed.error || msg;
        }
      } catch {
        // ignore parse error
      }
    }
    return msg;
  }

  if (typeof e === "object" && e !== null) {
    return (e as any).message || (e as any).error || JSON.stringify(e);
  }

  return String(e);
}

export function ok<
  TErrors extends Record<string, string | undefined> = Record<string, never>,
>(message?: string, data?: any): ActionResult<TErrors> {
  return { success: true, message, data } as ActionResult<TErrors>;
}

/**
 * A failure carrying per-field validation errors.
 *
 * Deliberately has no `statusCode` parameter. An earlier signature took
 * `(message, errors, statusCode)`, and every call that passed `undefined` for
 * `errors` made TypeScript infer `TErrors` as its constraint rather than the
 * `Record<string, never>` default — so the result stopped being assignable to a
 * bare `ActionResult` and every such call site needed an explicit type argument.
 * Failures that carry an HTTP status use `failWithStatus` instead, which keeps
 * the two concerns separate and the inference predictable.
 */
export function fail<
  TErrors extends Record<string, string | undefined> = Record<string, never>,
>(message: unknown, errors?: TErrors): ActionResult<TErrors> {
  return { success: false, message: formatErrorMessage(message), errors };
}

/**
 * A failure that carries an upstream HTTP status but no field errors.
 *
 * The status lets callers tell an expired session (401/403) from a backend
 * outage (5xx) without parsing the message text. Previously it was smuggled
 * inside `data`, which no reader could rely on.
 */
export function failWithStatus(
  message: unknown,
  statusCode?: number
): ActionResult<Record<string, never>> {
  return { success: false, message: formatErrorMessage(message), statusCode };
}

export function fromServiceResponse<
  TErrors extends Record<string, string | undefined> = Record<string, never>,
>(res: unknown, fallbackMessage: string): ActionResult<TErrors> {
  if (typeof res !== "object" || res == null) return ok<TErrors>();

  const statusCode = (res as any).statusCode;
  const success = (res as any).success;

  const isError = success === false || (typeof statusCode === 'number' && statusCode >= 400);

  if (isError) {
    // 1. Try to get message from backend response
    let rawMessage = (res as any).message || (res as any).error || fallbackMessage;

    // 2. Handle cases where the backend returns a JSON string inside a string
    if (typeof rawMessage === 'string') {
      const trimmed = rawMessage.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            rawMessage = parsed.map((p: any) => p.message || p.error || (typeof p === 'string' ? p : JSON.stringify(p))).join(", ");
          } else if (typeof parsed === 'object' && parsed !== null) {
            rawMessage = parsed.message || parsed.error || rawMessage;
          }
        } catch {
          // ignore parse error
        }
      }
    }

    // 3. Handle cases where it's a nested object (NestJS style)
    if (typeof rawMessage === 'object' && rawMessage !== null) {
      rawMessage = (rawMessage as any).message || (rawMessage as any).error || JSON.stringify(rawMessage);
    }

    // 4. Handle arrays (Validation errors)
    if (Array.isArray(rawMessage)) {
      rawMessage = rawMessage.map((m: any) => (typeof m === 'string' ? m : m.message || JSON.stringify(m))).join(", ");
    }

    const errors = (res as any).errors as TErrors;
    return fail(formatErrorMessage(rawMessage, fallbackMessage), errors);
  }

  // Smart data extraction: use .data if present, otherwise use the whole object if it looks like a resource
  let data = (res as any)?.data;
  if (data === undefined) {
    // If it has resource-like properties (id, name, email, etc.) and isn't just a wrapper
    const hasDataProps = (res as any).id || (res as any).uuid || (res as any).username;
    if (hasDataProps) {
      data = res;
    }
  }

  const msg = (res as any)?.message;
  return ok<TErrors>(typeof msg === 'string' ? msg : undefined, data);
}
