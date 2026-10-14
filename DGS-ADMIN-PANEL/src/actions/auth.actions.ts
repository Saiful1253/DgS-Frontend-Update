/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { parse } from "cookie";
import { deleteCookie, getCookie, setCookie } from "@/lib/tokenHandlers";
import { publicFetch } from "@/lib/public-fetch";
import { serverFetch } from "@/lib/server-fetch";
import { BACKEND_TIMEOUT_MS, extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import { backendUrl } from "@/lib/backend-url";
import { fail, failWithStatus, ok, type ActionResult } from "./action-result";

/**
 * Auth actions — the transport layer for the module.
 *
 * Every request leaves from here: the service (`services/auth/auth.service.ts`
 * and `services/auth/auth.refresh.service.ts`) holds no I/O and only forwards to
 * these exports.
 *
 * There is no extra gate because every call is self-service — own profile,
 * own password, own session.
 *
 * `loginAction` and the three reset actions exist as actions because a
 * `"use client"` component cannot reach transport directly; it imports the
 * service, which forwards here and the call arrives as an RPC on the server.
 */

/** Upstream response pieces the login route handler needs to mint its cookies. */
export interface LoginPayload {
  setCookie: string[];
  body: any;
  status: number;
}

/**
 * 401/403 is an expired session, not an outage.
 *
 * The status travels with the failure so a reader can offer "sign in again"
 * instead of a retry that will never succeed.
 */
const unauthorizedMessage = (what: string) =>
  `Your session is no longer authorized to read ${what}. Sign in again.`;

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getProfileAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.get("/auth/profile");
    if (!res.ok) {
      return failWithStatus(
        res.status === 401 || res.status === 403
          ? unauthorizedMessage("your profile")
          : await extractApiErrorMessage(res, "Failed to fetch profile"),
        res.status
      );
    }
    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to fetch profile", json?.statusCode);
    }
    return ok("", json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to fetch profile");
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * Exchange credentials for a session.
 *
 * Returns the upstream `Set-Cookie` headers verbatim rather than the tokens
 * themselves, so the route handler stays the only place that decides cookie
 * attributes (`httpOnly`, `secure`, `sameSite`) and nothing token-shaped reaches
 * a client component.
 */
export async function loginAction(payload: unknown): Promise<ActionResult> {
  try {
    const res = await publicFetch.post("/auth/login", { body: JSON.stringify(payload) });

    const contentType = res.headers.get("content-type") || "";
    let body: any = null;
    if (contentType.includes("application/json")) {
      body = await res.json().catch(() => null);
    } else {
      const text = await res.text();
      console.error("Backend returned non-JSON login response:", res.status, text.slice(0, 300));
      return failWithStatus(`Backend server error (${res.status}).`, res.status);
    }

    if (!res.ok) {
      return failWithStatus(
        body?.message || "Credential does not match or user does not exist",
        res.status
      );
    }

    let setCookie: string[] = [];
    if (typeof (res.headers as any).getSetCookie === "function") {
      setCookie = (res.headers as any).getSetCookie();
    }
    const rawHeader = res.headers.get("set-cookie");
    if ((!setCookie || setCookie.length === 0) && rawHeader) setCookie = [rawHeader];

    return ok("", { setCookie, body, status: res.status } satisfies LoginPayload);
  } catch (e: unknown) {
    console.error("loginAction error:", e);
    return fail(e instanceof Error ? e.message : "Login failed");
  }
}

export async function logoutAction(): Promise<ActionResult> {
  try {
    const res = await serverFetch.post("/auth/logout");
    if (!res.ok) {
      // A backend that cannot be reached must not keep the session alive locally,
      // so the cookies are cleared either way and the failure is only reported.
      return failWithStatus("Logout failed", res.status);
    }
    return ok("Logged out successfully", await parseApiResponse(res));
  } catch (error) {
    console.error("Logout backend call failed", error);
    return fail("Logout failed");
  } finally {
    await deleteCookie("accessToken");
    await deleteCookie("refreshToken");
  }
}

export async function requestResetAction(payload: { identifier: string }): Promise<ActionResult> {
  return resetStepAction("/auth/reset-password-request", payload, "Reset OTP sent", "Failed to send reset OTP");
}

export async function verifyResetAction(payload: {
  identifier: string;
  otp: string;
}): Promise<ActionResult> {
  return resetStepAction("/auth/reset-password-verify", payload, "OTP verified", "Failed to verify OTP");
}

export async function submitResetAction(payload: {
  identifier: string;
  otp: string;
  password: string;
}): Promise<ActionResult> {
  return resetStepAction(
    "/auth/reset-password-submit",
    payload,
    "Password updated",
    "Failed to update password"
  );
}

async function resetStepAction(
  endpoint: string,
  payload: unknown,
  successMessage: string,
  fallback: string
): Promise<ActionResult> {
  try {
    const res = await publicFetch.post(endpoint, { body: JSON.stringify(payload) });
    if (!res.ok) {
      return failWithStatus(await extractApiErrorMessage(res, fallback), res.status);
    }
    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || fallback, json?.statusCode);
    }
    return ok(successMessage, json?.data ?? json);
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : fallback);
  }
}

// ── Token rotation ───────────────────────────────────────────────────────────
//
// Driven by `lib/server-fetch` before every authenticated call, so it is not a
// user-facing action — but it still has to be transport, which is what this layer
// is for. The result is carried in `data` so the caller reads one shape.

export interface TokenRefreshResult {
  tokenRefreshed: boolean;
  accessToken?: string | null;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000 - 10000;
}

/**
 * Rotate an access token that is at (or past) expiry, then rewrite both cookies.
 *
 * `serverFetch` is deliberately not used here — it calls back into this action,
 * so routing the refresh through it would recurse.
 */
export async function refreshAccessTokenAction(): Promise<ActionResult> {
  const noop = (message: string) => ok(message, { tokenRefreshed: false } as TokenRefreshResult);

  try {
    const accessToken = await getCookie("accessToken");
    const refreshToken = await getCookie("refreshToken");

    if (!accessToken && !refreshToken) return noop("No session cookies");
    if (accessToken && !isTokenExpired(accessToken)) return noop("Access token still valid");
    if (!refreshToken) return noop("No refresh token");

    const response = await fetch(backendUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      return failWithStatus("Token refresh rejected", response.status);
    }

    const result = await response.json();

    let setCookieHeaders: string[] = [];
    if (typeof (response.headers as any).getSetCookie === "function") {
      setCookieHeaders = (response.headers as any).getSetCookie();
    }
    if (setCookieHeaders.length === 0 && response.headers.get("set-cookie")) {
      const rawHeader = response.headers.get("set-cookie");
      if (rawHeader) setCookieHeaders = [rawHeader];
    }

    let accessTokenObject: Record<string, any> | null = null;
    let refreshTokenObject: Record<string, any> | null = null;

    if (setCookieHeaders.length === 0) {
      return fail(result.message || "No Set-Cookie header found");
    }

    for (const cookie of setCookieHeaders) {
      const parsedCookie = parse(cookie);
      if (parsedCookie["accessToken"]) accessTokenObject = parsedCookie;
      if (parsedCookie["refreshToken"]) refreshTokenObject = parsedCookie;
    }

    if (!accessTokenObject || !refreshTokenObject) {
      return fail("Tokens not found in cookies");
    }

    if (!result.success) {
      return fail(result.message || "Token refresh failed");
    }

    try {
      const isProd = process.env.NODE_ENV === "production";
      const { headers } = await import("next/headers");
      const headersList = await headers();
      const isSecure = headersList.get("x-forwarded-proto") === "https" || isProd;

      const sameSite = (obj: Record<string, any>): "lax" | "strict" | "none" => {
        const value = obj["SameSite"]?.toLowerCase();
        return value === "lax" || value === "strict" || value === "none" ? value : "lax";
      };

      await deleteCookie("accessToken");
      await setCookie("accessToken", accessTokenObject.accessToken, {
        secure: isSecure,
        httpOnly: true,
        maxAge: parseInt(accessTokenObject["Max-Age"]) || 60 * 60,
        path: "/",
        sameSite: sameSite(accessTokenObject),
      });

      await deleteCookie("refreshToken");
      await setCookie("refreshToken", refreshTokenObject.refreshToken, {
        secure: isSecure,
        httpOnly: true,
        maxAge: parseInt(refreshTokenObject["Max-Age"]) || 60 * 60 * 24 * 90,
        path: "/",
        sameSite: sameSite(refreshTokenObject),
      });
    } catch (cookieError) {
      // A failed cookie write here would report `tokenRefreshed: true` with a
      // token the browser never receives, so every later request 401s with no
      // trace of why. Report it instead of swallowing it.
      console.error("Token refreshed but cookie write failed:", cookieError);
      return fail("Token refreshed but the session cookie could not be written");
    }

    return ok("Token refreshed successfully", {
      tokenRefreshed: true,
      accessToken: accessTokenObject.accessToken,
    } as TokenRefreshResult);
  } catch (error: any) {
    return fail(error?.message || "Something went wrong");
  }
}
