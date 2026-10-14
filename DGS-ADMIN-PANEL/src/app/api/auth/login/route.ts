/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { loginAction } from "@/actions/auth.actions";
import type { LoginPayload } from "@/services/auth/auth.service";
import { parse, serialize } from "cookie";

/**
 * Keys whose values must never reach a log sink, in any casing.
 *
 * This route handles credentials, so any future logging call that accidentally
 * passes the request body is scrubbed before it is written. The previous
 * implementation appended the whole payload to `tmp/api_error.log` on every
 * login attempt, persisting plaintext passwords to an unrotated file on disk.
 */
const REDACTED_KEYS = new Set([
  "password",
  "newpassword",
  "currentpassword",
  "confirmpassword",
  "passwordreset",
  "token",
  "accesstoken",
  "refreshtoken",
  "verificationno",
  "otp",
]);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        REDACTED_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redact(val),
      ])
    );
  }
  return value;
}

/** Errors go to the platform log sink, which is rotated and access-controlled. */
const logApiError = (message: string, detail?: unknown) => {
  const safeDetail =
    detail === undefined ? "" : ` ${JSON.stringify(redact(detail))}`;
  console.error(`[auth/login] ${message}${safeDetail}`);
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const actionResult = await loginAction(payload);

    if (!actionResult.success) {
      return NextResponse.json(
        { success: false, message: actionResult.message || "Login failed" },
        { status: actionResult.message?.includes("Backend server error") ? 502 : 400 }
      );
    }

    const { setCookie: setCookieHeaders, body: result } = actionResult.data as LoginPayload;

    let accessTokenObject: any = null;
    let refreshTokenObject: any = null;

    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookie: string) => {
        const parsedCookie = parse(cookie);
        if (parsedCookie["accessToken"]) accessTokenObject = parsedCookie;
        if (parsedCookie["refreshToken"]) refreshTokenObject = parsedCookie;
      });
    }

    const tokenData = result?.data || result || {};
    const accessTokenVal = accessTokenObject?.accessToken || tokenData.accessToken || tokenData.access_token;
    const refreshTokenVal = refreshTokenObject?.refreshToken || tokenData.refreshToken || tokenData.refresh_token;

    if (!accessTokenVal || !refreshTokenVal) {
      return NextResponse.json(
        { success: false, message: result?.message || "Tokens not found in response" },
        { status: 400 }
      );
    }

    const isProd = process.env.NODE_ENV === "production";
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const isSecure = forwardedProto === "https" || isProd;

    const response = NextResponse.json({ success: true, message: "Login successful" });

    const parseMaxAge = (val: any, fallback: number) => {
      const parsed = parseInt(val, 10);
      return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
    };

    response.headers.append(
      "Set-Cookie",
      serialize("accessToken", accessTokenVal, {
        secure: isSecure,
        httpOnly: true,
        maxAge: parseMaxAge(accessTokenObject?.["Max-Age"], 60 * 60),
        path: "/",
        sameSite: "lax",
      })
    );

    response.headers.append(
      "Set-Cookie",
      serialize("refreshToken", refreshTokenVal, {
        secure: isSecure,
        httpOnly: true,
        maxAge: parseMaxAge(refreshTokenObject?.["Max-Age"], 60 * 60 * 24 * 90),
        path: "/",
        sameSite: "lax",
      })
    );

    return response;
  } catch (error: any) {
    logApiError("unhandled error", { message: error?.message });
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
