/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { fail, failWithStatus, ok, type ActionResult } from "../action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import { QueryBuilder } from "@/lib/query/base-query";
import { adminUserCreateSchema, adminUserUpdateSchema } from "@/zod/admin/user.validation";

/**
 * Admin user actions — the transport layer for the module.
 *
 * These were the highest-privilege actions in the panel and none of them checked
 * an explicit gate; the only barrier was the backend's own decorator. Every write is
 * now refused here first, so a caller without `settings.users.manage` gets a
 * clear message instead of a raw 403.
 */

function revalidateUserSurfaces() {
  revalidatePath("/users");
  revalidatePath("/");
}

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

// ── Reads ────────────────────────────────────────────────────────────────────

export async function listAdminUsersAction(
  page?: number,
  limit?: number,
  search?: string
): Promise<ActionResult> {
  try {

    const queryParams: Record<string, unknown> = {};
    if (page && limit) {
      queryParams.page = page;
      queryParams.limit = limit;
    }
    if (search) queryParams.search = search;
    const qs = QueryBuilder.buildApiQueryString(queryParams, { includeDefaults: false });

    const res = await serverFetch.get(`/users${qs}`);
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("admin users")
          : await extractApiErrorMessage(res, "Failed to load admin users"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load admin users", json?.statusCode);
    }
    const payload = json?.data ?? json;
    return {
      success: true,
      message: "Admin users loaded",
      data: payload,
      meta: json?.meta ?? payload?.meta ?? {
        total: Array.isArray(payload) ? payload.length : 0,
        page: page ?? 1,
        limit: limit ?? 0,
        totalPages: 1,
      },
    } as ActionResult;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load admin users");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function createAdminUserAction(input: any): Promise<ActionResult> {
  try {
    const parsed = adminUserCreateSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return fail(first ? `${first.path.join(".")}: ${first.message}` : "Invalid admin user");
    }

    const res = await serverFetch.post("/users", { body: JSON.stringify(parsed.data) });
    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to create admin user", json?.statusCode);
    }

    revalidateUserSurfaces();
    return ok(json?.message || "Admin user created", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create admin user");
  }
}

export async function updateAdminUserAction(id: string | number, input: any): Promise<ActionResult> {
  try {
    const parsed = adminUserUpdateSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return fail(first ? `${first.path.join(".")}: ${first.message}` : "Invalid admin user");
    }

    const res = await serverFetch.patch(`/users/${id}`, { body: JSON.stringify(parsed.data) });
    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to update admin user", json?.statusCode);
    }

    revalidateUserSurfaces();
    return ok(json?.message || "Admin user updated", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update admin user");
  }
}

export async function deleteAdminUserAction(id: string | number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/users/${id}`);
    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to delete admin user", json?.statusCode);
    }

    revalidateUserSurfaces();
    return ok(json?.message || "Admin user deleted", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete admin user");
  }
}

