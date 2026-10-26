/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import {
  fail,
  failWithStatus,
  ok,
  type ActionResult,
} from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import {
  buildWhyChooseUsApiQueryString,
  type WhyChooseUsQueryParams,
} from "@/lib/query/why-choose-us-query";
import { whyChooseUsSchema } from "@/zod/why-choose-us.validation";
import type { WhyChooseUsStats, WhyChooseUsMetricsInput } from "@/types/why-choose-us";

function revalidateWhyChooseUs() {
  revalidatePath("/services/why-coose-us");
  revalidatePath("/services/why-choose-us");
  revalidatePath("/services");
  revalidatePath("/");
}

const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to access ${what}. Sign in again.`;

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getWhyChooseUsAction(
  query: WhyChooseUsQueryParams = {}
): Promise<ActionResult> {
  try {
    const qs = buildWhyChooseUsApiQueryString(query);
    const res = await serverFetch.get(`/services/why-choose-us?${qs}`);
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("Why Choose Us items")
          : await extractApiErrorMessage(res, "Failed to fetch items"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch items", json?.statusCode);
    }
    const raw = json?.data ?? json;
    return ok("Items loaded", raw);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch items");
  }
}

export async function getWhyChooseUsStatsAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/services/why-choose-us/stats");
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("Why Choose Us stats")
          : await extractApiErrorMessage(res, "Failed to fetch stats"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    const data = json?.data ?? json;
    return ok("Stats loaded", data);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch stats");
  }
}

export async function listPublicWhyChooseUsAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/services/why-choose-us/public");
    if (!res.ok) {
      return fail(await extractApiErrorMessage(res, "Failed to fetch public items"));
    }
    const json = await parseApiResponse(res);
    return ok("Public items loaded", json?.data ?? json);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch public items");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function saveWhyChooseUsAction(raw: unknown): Promise<ActionResult> {
  const parsed = whyChooseUsSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return fail(firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Validation failed");
  }

  const { id, ...payload } = parsed.data;

  try {
    const isUpdate = typeof id === "number" && id > 0;
    const url = isUpdate ? `/services/why-choose-us/${id}` : "/services/why-choose-us";
    const res = isUpdate
      ? await serverFetch.put(url, { body: JSON.stringify(payload) })
      : await serverFetch.post(url, { body: JSON.stringify(payload) });

    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, isUpdate ? "Failed to update item" : "Failed to create item"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    revalidateWhyChooseUs();
    return ok(isUpdate ? "Item updated successfully" : "Item created successfully", json?.data ?? json);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to save item");
  }
}

export async function toggleWhyChooseUsStatusAction(
  id: number,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const res = await serverFetch.patch(`/services/why-choose-us/${id}/toggle-status`, {
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to toggle status"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    revalidateWhyChooseUs();
    return ok(`Item ${isActive ? "activated" : "deactivated"} successfully`, json?.data ?? json);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to toggle status");
  }
}

export async function deleteWhyChooseUsAction(id: number): Promise<ActionResult> {
  try {
    const res = await serverFetch.delete(`/services/why-choose-us/${id}`);
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to delete item"),
        res.status
      );
    }

    revalidateWhyChooseUs();
    return ok("Item deleted successfully");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete item");
  }
}

export async function uploadWhyChooseUsImageAction(formData: FormData): Promise<ActionResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return fail("No file provided");
    }

    const allowed = ["image/svg+xml", "image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      return fail("Image must be a PNG, JPEG, WebP, or SVG");
    }

    if (file.size > 5 * 1024 * 1024) {
      return fail("Image size must not exceed 5MB");
    }

    if (!formData.has("folder")) {
      formData.append("folder", "why-choose-us");
    }

    const res = await serverFetch.post("/upload/image", {
      body: formData,
    });

    const json = await parseApiResponse(res);
    if (!res.ok || json?.success === false) {
      return failWithStatus(json?.message || "Failed to upload image", json?.statusCode ?? res.status);
    }

    const imageUrl = json?.data?.url ?? json?.url;
    if (!imageUrl) return fail("Image URL not returned from server");
    return ok("Image uploaded successfully", { url: imageUrl });
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload image");
  }
}

export async function getWhyChooseUsMetricsAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/services/why-choose-us/metrics");
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to fetch metrics"),
        res.status
      );
    }
    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch metrics", json?.statusCode);
    }
    const raw = json?.data ?? json;
    return ok("Metrics loaded", raw);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch metrics");
  }
}

export async function saveWhyChooseUsMetricsAction(
  dto: WhyChooseUsMetricsInput
): Promise<ActionResult> {
  try {
    const res = await serverFetch.put("/services/why-choose-us/metrics", {
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("Why Choose Us metrics")
          : await extractApiErrorMessage(res, "Failed to save metrics"),
        res.status
      );
    }
    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to save metrics", json?.statusCode);
    }
    revalidateWhyChooseUs();
    return ok("Metrics updated successfully", json?.data ?? json);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to save metrics");
  }
}
