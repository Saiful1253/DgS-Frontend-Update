/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import {
  createAdminUserAction,
  deleteAdminUserAction,
  listAdminUsersAction,
  updateAdminUserAction,
} from "@/actions/admin/user.actions";
import type { AdminUser } from "@/types/admin/user";

/**
 * Admin user service — the domain layer for the module.
 *
 * House chain: `page / component → service → action`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * revalidation lives.
 */

export type { AdminUser } from "@/types/admin/user";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

export type PagedResult<T> = { data: T[]; total: number };

/**
 * The backend answers with a bare array when unpaginated and `{ data, total }`
 * when `page`/`limit` are given, so both are normalised here — once — instead of
 * at every call site.
 */
const rows = (payload: any): AdminUser[] => {
  if (Array.isArray(payload)) return payload as AdminUser[];
  if (payload && Array.isArray(payload.data)) return payload.data as AdminUser[];
  return [];
};

const readPage = async (
  page: number,
  limit: number,
  search?: string
): Promise<ReadResult<PagedResult<AdminUser>>> => {
  const res = await listAdminUsersAction(page, limit, search);
  if (!res.success) return { ok: false, message: res.message || "Failed to load admin users" };
  return { ok: true, data: { data: rows(res.data), total: res.meta?.total ?? rows(res.data).length } };
};

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getAdminUsersResult = cache(readPage);

// ── Reads and writes for client components ───────────────────────────────────

export const createAdminUser = (input: any) => createAdminUserAction(input);

export const updateAdminUser = (id: string | number, input: any) => updateAdminUserAction(id, input);

export const deleteAdminUser = (id: string | number) => deleteAdminUserAction(id);
