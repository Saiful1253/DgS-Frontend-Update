/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import {
  createRoleAction,
  deleteRoleAction,
  listRolesAction,
  updateRoleAction,
} from "@/actions/admin/role.actions";
import type { Role } from "@/types/admin/role";

/**
 * Role service — the domain layer for the module.
 *
 * House chain: `page / component → service → action`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * revalidation lives.
 *
 * NOTE: the backend has no `/roles` controller, so every read here fails. That is
 * reported as data rather than as an empty table so the page can say so — a 404
 * from a missing route and a table with no rows must not look the same.
 */

export type { Role } from "@/types/admin/role";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

export type PagedResult<T> = { data: T[]; total: number };

/**
 * The backend answers with a bare array when unpaginated and `{ data, total }`
 * when `page`/`limit` are given, so both are normalised here — once — instead of
 * at every call site.
 */
const rows = (payload: any): Role[] => {
  if (Array.isArray(payload)) return payload as Role[];
  if (payload && Array.isArray(payload.data)) return payload.data as Role[];
  return [];
};

const readAll = async (): Promise<ReadResult<Role[]>> => {
  const res = await listRolesAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to load roles" };
  return { ok: true, data: rows(res.data) };
};

const readPage = async (page: number, limit: number): Promise<ReadResult<PagedResult<Role>>> => {
  const res = await listRolesAction(page, limit);
  if (!res.success) return { ok: false, message: res.message || "Failed to load roles" };
  return { ok: true, data: { data: rows(res.data), total: res.meta?.total ?? rows(res.data).length } };
};

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getRolesResult = cache(readAll);

export const getRolesPageResult = cache(readPage);

// ── Reads and writes for client components ───────────────────────────────────

export const createRole = (input: any) => createRoleAction(input);

export const updateRole = (id: string | number, input: any) => updateRoleAction(id, input);

export const deleteRole = (id: string | number) => deleteRoleAction(id);
