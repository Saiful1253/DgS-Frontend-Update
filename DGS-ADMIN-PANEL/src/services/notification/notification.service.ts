import {
  getNotificationTemplatesAction,
  resetNotificationTemplateAction,
  updateNotificationTemplateAction,
} from "@/actions/notification/notification.action";
import type { UpdateTemplatePayload } from "@/types/notifications/notification";

/**
 * Notification service — the domain layer for the module.
 *
 * House chain: `page / component → service → action → HTTP`. The service holds no
 * transport: the templates panel is entirely client-driven, so there is no page
 * reader and these one-liners are the whole surface. A client component can
 * import them because each call becomes an RPC on the server, where the
 * validation and the revalidation live.
 *
 * The `fetch*` functions that used to live here were deleted: the transport moved
 * into the actions, and `fetchNotificationTemplate` — a read of one template by
 * id — had no caller at all.
 */

export const getNotificationTemplates = () => getNotificationTemplatesAction();

export const updateNotificationTemplate = (id: number, payload: UpdateTemplatePayload) =>
  updateNotificationTemplateAction(id, payload);

export const resetNotificationTemplate = (id: number) => resetNotificationTemplateAction(id);
