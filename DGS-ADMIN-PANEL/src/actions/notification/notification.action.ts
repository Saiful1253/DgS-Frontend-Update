 
"use server";

import { revalidatePath } from "next/cache";
import {
  fail,
  failWithStatus,
  fromServiceResponse,
  ok,
  type ActionResult,
} from "@/actions/action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import type { UpdateTemplatePayload } from "@/types/notifications/notification";

/**
 * Notification actions — the transport boundary for the module.
 *
 * House chain: `page / component → service → action → HTTP`. These functions used
 * to be the thin gate over the service, which is the direction that cannot work
 * for a client component: the service performed I/O, so importing it from
 * `"use client"` was impossible. The service now forwards here.
 *
 * The exports carry the `Action` suffix used across the action layer; the service
 * forwarders drop it. That is also what resolves the old collision, where the
 * action and the transport shared the name `updateNotificationTemplate` and the
 * import in `notification.action.ts` had to alias.
 */

/** 401/403 is an expired session, not an outage — the panel tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

/** A template write changes the SMS body every lead order and quote receives. */
function revalidateNotificationSurfaces() {
  revalidatePath("/settings/notifications");
  revalidatePath("/settings/notifications", "page");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getNotificationTemplatesAction(): Promise<ActionResult> {
  try {

    const res = await serverFetch.get("/notifications/templates");
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("notification templates")
          : await extractApiErrorMessage(res, "Failed to fetch notification templates"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(
        json?.message || "Failed to fetch notification templates",
        json?.statusCode
      );
    }
    const payload = json?.data ?? json;
    return ok("Notification templates loaded", Array.isArray(payload) ? payload : []);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch notification templates");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function updateNotificationTemplateAction(
  id: number,
  payload: UpdateTemplatePayload
): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch(`/notifications/templates/${id}`, {
      body: JSON.stringify(payload),
    });
    const result = fromServiceResponse(
      await parseApiResponse(res),
      "Failed to update notification template"
    );
    if (!result.success) return result;

    revalidateNotificationSurfaces();
    return { ...result, message: result.message || "Notification template updated" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update notification template");
  }
}

export async function resetNotificationTemplateAction(id: number): Promise<ActionResult> {
  try {

    const res = await serverFetch.post(`/notifications/templates/${id}/reset`);
    const result = fromServiceResponse(
      await parseApiResponse(res),
      "Failed to reset notification template"
    );
    if (!result.success) return result;

    revalidateNotificationSurfaces();
    return { ...result, message: result.message || "Notification template reset" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to reset notification template");
  }
}
