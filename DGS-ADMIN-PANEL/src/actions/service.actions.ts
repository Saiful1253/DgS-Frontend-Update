/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import {
  fail,
  failWithStatus,
  fromServiceResponse,
  ok,
  type ActionResult,
} from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import { buildServiceApiQueryString, type ServiceQueryParams } from "@/lib/query/service-query";
import { serviceSchema, serviceGroupSchema, servicePillarSchema } from "@/zod/service.validation";
import type { ServiceStats } from "@/types/service";

/** A service write changes the services list, the group/pillar pages and the nav badge. */
function revalidateServices() {
  revalidatePath("/services");
  revalidatePath("/services/groups");
  revalidatePath("/services/pillars");
  revalidatePath("/");
  revalidatePath("/leads");
}

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

/** Groups and pillars may arrive bare or wrapped in a `{ data: … }` envelope. */
const unwrapArray = (json: any): any[] => {
  const wrapped = json?.data ?? json;
  if (Array.isArray(wrapped)) return wrapped;
  return Array.isArray(wrapped?.data) ? wrapped.data : [];
};

// ── Reads ────────────────────────────────────────────────────────────────────
//
// Read failures carry the upstream status so the service layer can hand the page
// a `ReadResult` instead of an empty catalogue. Swallowing the status here would
// make a 401 indistinguishable from a 500, and the page could not tell the user
// to sign in again.

export async function getServicesAction(query: ServiceQueryParams = {}): Promise<ActionResult> {
  try {
    const qs = buildServiceApiQueryString(query);
    const res = await serverFetch.get(`/services?${qs}`);
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("services")
          : await extractApiErrorMessage(res, "Failed to fetch services"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch services", json?.statusCode);
    }
    return ok("Services loaded", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch services");
  }
}

export async function getServiceGroupsAction(pillar?: string): Promise<ActionResult> {
  try {
    const qs = pillar && pillar !== "all" ? `?pillar=${encodeURIComponent(pillar)}` : "";
    const res = await serverFetch.get(`/services/groups${qs}`);
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("service groups")
          : await extractApiErrorMessage(res, "Failed to fetch service groups"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch service groups", json?.statusCode);
    }
    return ok("Service groups loaded", unwrapArray(json));
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch service groups");
  }
}

export async function getServicePillarsAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/services/pillars");
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("service pillars")
          : await extractApiErrorMessage(res, "Failed to fetch service pillars"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch service pillars", json?.statusCode);
    }
    return ok("Service pillars loaded", unwrapArray(json));
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch service pillars");
  }
}

export async function getServiceStatsAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/services/stats");
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("service statistics")
          : await extractApiErrorMessage(res, "Failed to fetch service stats"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch service stats", json?.statusCode);
    }
    return ok("Service stats loaded", (json?.data ?? json) as ServiceStats);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch service stats");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * Options for a service picker in another module (the blog editor's
 * "related services" field). The transport lives here because the `/services`
 * routes belong to this module, not to the consumer.
 */
export async function listPublicServicesAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/services/public");
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("services")
          : await extractApiErrorMessage(res, "Failed to fetch services"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch services", json?.statusCode);
    }
    const services = Array.isArray(json) ? json : ((json?.data ?? json)?.services ?? []);
    return ok(
      "Services loaded",
      (Array.isArray(services) ? services : [])
        .filter((s: any) => !s.is_deleted && s.is_active !== false)
        .map((s: any) => ({
          id: Number(s.id),
          name: String(s.name ?? ""),
          slug: String(s.slug ?? ""),
        }))
    );
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch services");
  }
}

export async function uploadServiceIconAction(formData: FormData): Promise<ActionResult> {
  try {

    const res = await serverFetch.post("/upload/image", { body: formData as any });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to upload service icon");
    if (!result.success) return result;

    // A new icon URL is served on the public catalogue, so the cached surfaces
    // have to drop. Without this the admin saw the new icon immediately while
    // visitors kept the old one until the cache expired on its own.
    revalidateServices();
    return result;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload service icon");
  }
}

export async function saveServicePillarAction(input: unknown): Promise<ActionResult> {
  try {

    const parsed = servicePillarSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || "Validation failed";
      return { success: false, message: firstError, errors: fieldErrors as any };
    }

    const { id, ...rest } = parsed.data as { id?: number; [key: string]: any };
    const res = id
      ? await serverFetch.patch(`/services/pillars/${id}`, { body: JSON.stringify(rest) })
      : await serverFetch.post("/services/pillars", { body: JSON.stringify(rest) });

    const result = fromServiceResponse(await parseApiResponse(res), "Failed to save service pillar");
    if (!result.success) return result;

    revalidateServices();
    return { ...result, message: id ? "Pillar updated successfully" : "Pillar created successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to save service pillar");
  }
}

export async function deleteServicePillarAction(id: number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/services/pillars/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete service pillar");
    if (!result.success) return result;

    revalidateServices();
    return ok("Service pillar deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete service pillar");
  }
}

export async function saveServiceAction(input: unknown): Promise<ActionResult> {
  try {

    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || "Validation failed";
      return { success: false, message: firstError, errors: fieldErrors as any };
    }

    const { id, ...rest } = parsed.data as { id?: number; [key: string]: any };
    const res = id
      ? await serverFetch.patch(`/services/${id}`, { body: JSON.stringify(rest) })
      : await serverFetch.post("/services", { body: JSON.stringify(rest) });

    const result = fromServiceResponse(await parseApiResponse(res), "Failed to save service");
    if (!result.success) return result;

    revalidateServices();
    return { ...result, message: id ? "Service updated successfully" : "Service created successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to save service");
  }
}

export async function toggleServiceActiveAction(id: number, isActive: boolean): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch(`/services/${id}/status`, {
      body: JSON.stringify({ is_active: isActive }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to toggle service status");
    if (!result.success) return result;

    revalidateServices();
    return ok(`Service ${isActive ? "activated" : "deactivated"} successfully`, result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to toggle service status");
  }
}

export async function deleteServiceAction(id: number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/services/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete service");
    if (!result.success) return result;

    revalidateServices();
    return ok("Service soft-deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete service");
  }
}

export async function saveServiceGroupAction(input: unknown): Promise<ActionResult> {
  try {

    const parsed = serviceGroupSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || "Validation failed";
      return { success: false, message: firstError, errors: fieldErrors as any };
    }

    const { id, ...rest } = parsed.data as { id?: number; [key: string]: any };
    const res = id
      ? await serverFetch.patch(`/services/groups/${id}`, { body: JSON.stringify(rest) })
      : await serverFetch.post("/services/groups", { body: JSON.stringify(rest) });

    const result = fromServiceResponse(await parseApiResponse(res), "Failed to save service group");
    if (!result.success) return result;

    revalidateServices();
    return { ...result, message: id ? "Group updated successfully" : "Group created successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to save service group");
  }
}

export async function deleteServiceGroupAction(id: number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/services/groups/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete service group");
    if (!result.success) return result;

    revalidateServices();
    return ok("Service group deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete service group");
  }
}

export async function reorderServicesAction(
  order: { id: number; display_order: number }[]
): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch("/services/reorder", { body: JSON.stringify({ order }) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to reorder services");
    if (!result.success) return result;

    revalidateServices();
    return ok("Services reordered successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to reorder services");
  }
}

export async function reorderServiceGroupsAction(
  order: { id: number; display_order: number }[]
): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch("/services/groups/reorder", { body: JSON.stringify({ order }) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to reorder service groups");
    if (!result.success) return result;

    revalidateServices();
    return ok("Service groups reordered successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to reorder service groups");
  }
}

export async function reorderServicePillarsAction(
  order: { id: number; display_order: number }[]
): Promise<ActionResult> {
  try {

    const res = await serverFetch.patch("/services/pillars/reorder", { body: JSON.stringify({ order }) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to reorder service pillars");
    if (!result.success) return result;

    revalidateServices();
    return ok("Service pillars reordered successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to reorder service pillars");
  }
}
