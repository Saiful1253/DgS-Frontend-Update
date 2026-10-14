/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { fail, failWithStatus, ok, type ActionResult } from "../action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import { QueryBuilder } from "@/lib/query/base-query";
import { roleCreateSchema, roleUpdateSchema } from "@/zod/admin/role.validation";

/**
 * Role actions — the transport layer for the module.
 *
 * NOTE: the backend has no `/roles` controller, so every call here 404s. The
 * Zod schemas are in place so the module is correct the
 * moment the route exists.
 */

function revalidateRoleSurfaces() {
  revalidatePath("/users");
  revalidatePath("/users/roles");
  revalidatePath("/");
}

/** 401/403 is an expired session, not an outage — the page tells the two apart. */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

// ── Reads ────────────────────────────────────────────────────────────────────

export async function listRolesAction(page?: number, limit?: number): Promise<ActionResult> {
  try {

    const queryParams: Record<string, unknown> = {};
    if (page && limit) {
      queryParams.page = page;
      queryParams.limit = limit;
    }
    const qs = QueryBuilder.buildApiQueryString(queryParams, { includeDefaults: false });

    const res = await serverFetch.get(`/roles${qs}`);
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("roles")
          : await extractApiErrorMessage(res, "Failed to load roles"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load roles", json?.statusCode);
    }
    const payload = json?.data ?? json;
    return {
      success: true,
      message: "Roles loaded",
      data: payload,
      meta: json?.meta ?? payload?.meta ?? {
        total: Array.isArray(payload) ? payload.length : 0,
        page: page ?? 1,
        limit: limit ?? 0,
        totalPages: 1,
      },
    } as ActionResult;
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to load roles");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function createRoleAction(input: any): Promise<ActionResult> {
  try {
    const parsed = roleCreateSchema.parse(input);

    const res = await serverFetch.post("/roles", { body: JSON.stringify(parsed) });
    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to create role", json?.statusCode);
    }

    revalidateRoleSurfaces();
    return ok(json?.message || "Role created", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to create role");
  }
}

export async function updateRoleAction(id: string | number, input: any): Promise<ActionResult> {
  try {
    const parsed = roleUpdateSchema.parse(input);

    const res = await serverFetch.patch(`/roles/${id}`, { body: JSON.stringify(parsed) });
    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to update role", json?.statusCode);
    }

    revalidateRoleSurfaces();
    return ok(json?.message || "Role updated", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to update role");
  }
}

export async function deleteRoleAction(id: string | number): Promise<ActionResult> {
  try {

    const res = await serverFetch.delete(`/roles/${id}`);
    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to delete role", json?.statusCode);
    }

    revalidateRoleSurfaces();
    return ok(json?.message || "Role deleted", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to delete role");
  }
}

