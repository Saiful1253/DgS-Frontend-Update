import type { ZodError, ZodTypeAny } from "zod";

/**
 * Client-side form gating shared by every admin modal.
 *
 * The server actions already validate with Zod, but they run *after* the request
 * is made. That produced three defects at once: a submit that looked broken when
 * it was actually a validation rejection, a toast with no field context, and — for
 * any form holding an upload — the file written to Cloudinary before anyone
 * noticed a required field was empty.
 *
 * Reusing the action's own schema here is the point: the rules cannot drift,
 * because there is only one definition of them.
 */

export type FieldErrors = Record<string, string>;

/** `{ field: firstMessage }`, the shape the modals keep in `errors` state. */
export function toFieldErrors(error: ZodError): FieldErrors {
  const flat: FieldErrors = {};
  const { fieldErrors } = error.flatten();
  Object.entries(fieldErrors ?? {}).forEach(([key, messages]) => {
    const list = Array.isArray(messages) ? messages : [messages];
    if (list.length && list[0]) flat[key] = String(list[0]);
  });
  return flat;
}

/** Map an action's `errors` payload, which is `string[]` per field. */
export function fromActionErrors(errors: unknown): FieldErrors {
  if (!errors || typeof errors !== "object") return {};
  const flat: FieldErrors = {};
  Object.entries(errors as Record<string, unknown>).forEach(([key, value]) => {
    flat[key] = Array.isArray(value) ? String(value[0]) : String(value);
  });
  return flat;
}

export function firstError(errors: FieldErrors): string | undefined {
  return Object.values(errors)[0];
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Run a schema over a draft and hand back everything a submit handler needs.
 *
 * Returns `ok: false` with the field errors already populated so the caller can
 * bail out before any side effect. `draft` is returned because the same object
 * must be sent to the action — re-deriving it risks validating one shape and
 * persisting another.
 */
export interface DraftResult<T> {
  ok: boolean;
  fieldErrors: FieldErrors;
  /** Present only when `ok` — the parsed value the action should receive. */
  draft: T;
}

export function validateDraft<T>(schema: ZodTypeAny, draft: T): DraftResult<T> {
  const parsed = schema.safeParse(draft);
  if (parsed.success) {
    return { ok: true, fieldErrors: {}, draft: parsed.data as T };
  }
  return { ok: false, fieldErrors: toFieldErrors(parsed.error), draft };
}

/** Live gate for a submit button. Cheap, and the same schema is re-checked on submit. */
export function isDraftValid<T>(schema: ZodTypeAny, draft: T): boolean {
  return schema.safeParse(draft).success;
}

/**
 * Drop a field's error as soon as the admin edits it — a stale red message under
 * a field they have now filled in is worse than no message at all.
 */
export function clearFieldError(
  errors: FieldErrors,
  field: string,
): FieldErrors {
  if (!errors[field]) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}
