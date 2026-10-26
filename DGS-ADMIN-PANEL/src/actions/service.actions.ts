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
import { serviceSchema, serviceCategorySchema } from "@/zod/service.validation";
import type { ServiceStats } from "@/types/service";

/** A service write changes the services list, public pages and the nav badge. */
function revalidateServices() {
  revalidatePath("/services");
  revalidatePath("/");
  revalidatePath("/leads");
}

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

/** Categories may arrive bare or wrapped in a `{ data: … }` envelope. */
const unwrapArray = (json: any): any[] => {
  const wrapped = json?.data ?? json;
  if (Array.isArray(wrapped)) return wrapped;
  return Array.isArray(wrapped?.data) ? wrapped.data : [];
};

// ── Reads ────────────────────────────────────────────────────────────────────

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
    const raw = json?.data ?? json;
    if (raw && Array.isArray(raw.data)) {
      raw.data = raw.data.map((s: any) => ({
        ...s,
        category: s.category || s.pillar,
        categoryEntity: s.categoryEntity || s.pillarEntity,
      }));
    }
    return ok("Services loaded", raw);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch services");
  }
}

export async function getServiceCategoriesAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/services/categories");
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("service categories")
          : await extractApiErrorMessage(res, "Failed to fetch service categories"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch service categories", json?.statusCode);
    }
    return ok("Service categories loaded", unwrapArray(json));
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch service categories");
  }
}

export const getServicePillarsAction = getServiceCategoriesAction;

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
      services.map((s: any) => {
        const name = s.name || "";
        const slug = s.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const pillar = s.pillar || s.pillarEntity?.name || "General";
        return {
          id: s.id,
          name,
          slug,
          pillar,
          icon_url: s.icon_url ?? null,
          value: name,
          label: `${pillar} — ${name}`,
        };
      })
    );
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch services");
  }
}

export async function uploadServiceIconAction(formData: FormData): Promise<ActionResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return fail("No file provided");
    }

    const allowed = ["image/svg+xml", "image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      return fail("Icon must be an SVG, PNG, JPEG, or WebP image");
    }

    if (file.size > 5 * 1024 * 1024) {
      return fail("Icon size must not exceed 5MB");
    }

    if (!formData.has("folder")) {
      formData.append("folder", "services");
    }

    const res = await serverFetch.post("/upload/image", {
      body: formData,
    });

    const json = await parseApiResponse(res);
    if (!res.ok || json?.success === false) {
      return failWithStatus(json?.message || "Failed to upload service icon", json?.statusCode ?? res.status);
    }

    const iconUrl = json?.data?.url ?? json?.url;
    if (!iconUrl) return fail("Icon URL not returned from server");
    return ok("Service icon uploaded successfully", { url: iconUrl });
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload service icon");
  }
}

export async function saveServiceCategoryAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = serviceCategorySchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || "Validation failed";
      return { success: false, message: firstError, errors: fieldErrors as any };
    }

    const { id, ...rest } = parsed.data as { id?: number; [key: string]: any };
    const res = id
      ? await serverFetch.patch(`/services/categories/${id}`, { body: JSON.stringify(rest) })
      : await serverFetch.post("/services/categories", { body: JSON.stringify(rest) });

    const result = fromServiceResponse(await parseApiResponse(res), "Failed to save service category");
    if (!result.success) return result;

    revalidateServices();
    return { ...result, message: id ? "Category updated successfully" : "Category created successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to save service category");
  }
}

export const saveServicePillarAction = saveServiceCategoryAction;

export async function deleteServiceCategoryAction(id: number): Promise<ActionResult> {
  try {
    const res = await serverFetch.delete(`/services/categories/${id}`);
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to delete service category");
    if (!result.success) return result;

    revalidateServices();
    return ok("Service category deleted successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete service category");
  }
}

export const deleteServicePillarAction = deleteServiceCategoryAction;

export async function saveServiceAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || "Validation failed";
      return { success: false, message: firstError, errors: fieldErrors as any };
    }

    const { id, ...rest } = parsed.data as { id?: number; [key: string]: any };
    if (rest.category && !rest.pillar) {
      rest.pillar = rest.category;
    }
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

export async function toggleServiceFlagshipAction(id: number, isFlagship: boolean): Promise<ActionResult> {
  try {
    const res = await serverFetch.patch(`/services/${id}`, {
      body: JSON.stringify({ is_flagship: isFlagship }),
    });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to toggle featured status");
    if (!result.success) return result;

    revalidateServices();
    return ok(isFlagship ? "Service featured as flagship" : "Service removed from featured", result.data);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to toggle featured status");
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

export async function reorderServiceCategoriesAction(
  order: { id: number; display_order: number }[]
): Promise<ActionResult> {
  try {
    const res = await serverFetch.patch("/services/categories/reorder", { body: JSON.stringify({ order }) });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to reorder service categories");
    if (!result.success) return result;

    revalidateServices();
    return ok("Service categories reordered successfully");
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to reorder service categories");
  }
}

export const reorderServicePillarsAction = reorderServiceCategoriesAction;
