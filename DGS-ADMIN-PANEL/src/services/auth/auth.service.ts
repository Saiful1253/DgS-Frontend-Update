/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import {
  getProfileAction,
  loginAction,
  logoutAction,
  requestResetAction,
  submitResetAction,
  verifyResetAction,
} from "@/actions/auth.actions";
import type { ActionResult } from "@/actions/action-result";

/**
 * Auth service — the domain layer for the module.
 *
 * House chain: `page / component → service → action`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * cookie handling lives.
 *
 * No access gate is involved anywhere in this module — every call is
 * self-service (own profile, own password, own session).
 */

export type { LoginPayload } from "@/actions/auth.actions";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

// ── Reads ────────────────────────────────────────────────────────────────────

const toResult = <T,>(res: ActionResult, fallback: string): ReadResult<T> =>
  res.success ? { ok: true, data: res.data as T } : { ok: false, message: res.message || fallback };

export const getProfileResult = cache(async (): Promise<ReadResult<any>> => {
  return toResult<any>(await getProfileAction(), "Failed to fetch profile");
});

/**
 * Never-throw profile read for the app shell.
 *
 * Every page's profile pre-check goes through this one. A
 * shell must not fail, so an unreachable backend resolves to `null` — treated
 * as "no profile" — instead of throwing out of the layout.
 * `cache()` collapses the fifteen pages that read it into one request per render.
 */
export const fetchProfile = cache(async (): Promise<any> => {
  const result = await getProfileResult();
  return result.ok ? result.data : null;
});

/**
 * The raw action result, for a client consumer that has to tell an expired
 * session from a transient failure rather than simply failing.
 */
export const loadProfile = (): Promise<ActionResult> => getProfileAction();

// ── Writes ───────────────────────────────────────────────────────────────────

export const login = (payload: unknown) => loginAction(payload);

export const logout = () => logoutAction();

export const requestReset = (payload: { identifier: string }) => requestResetAction(payload);

export const verifyReset = (payload: { identifier: string; otp: string }) => verifyResetAction(payload);

export const submitReset = (payload: { identifier: string; otp: string; password: string }) =>
  submitResetAction(payload);
