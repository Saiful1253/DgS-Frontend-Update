/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { parse, serialize } from "cookie";
import { publicFetch } from "@/lib/server-fetch";
import { loginSchema } from "@/zod/auth.validation";

function getErrorMessage(errorBody: any, fallback: string): string {
  if (!errorBody || !errorBody.message) return fallback;
  if (typeof errorBody.message === "string") return errorBody.message;
  if (Array.isArray(errorBody.message)) return errorBody.message.join(", ");
  if (typeof errorBody.message === "object") {
    return errorBody.message.message || JSON.stringify(errorBody.message);
  }
  return String(errorBody.message);
}

function getSetCookieHeaders(res: Response): string[] {
  if (typeof (res.headers as any).getSetCookie === "function") {
    return (res.headers as any).getSetCookie();
  }
  const rawHeader = res.headers.get("set-cookie");
  return rawHeader ? [rawHeader] : [];
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // `loginSchema` lived in src/zod/ with no importer, so this route forwarded
    // whatever JSON it was handed straight to the backend. Validating here turns
    // a round trip into an instant, field-level rejection.
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
      const { fieldErrors } = parsed.error.flatten();
      const errors: Record<string, string> = {};
      Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
        const list = Array.isArray(messages) ? messages : [messages];
        if (list.length && list[0]) errors[field] = String(list[0]);
      });
      return NextResponse.json(
        {
          success: false,
          message: Object.values(errors)[0] || "Invalid credentials",
          errors,
        },
        { status: 400 }
      );
    }

    const res = await publicFetch.post("/client/auth/login", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const contentType = res.headers.get("content-type") || "";
    let result: any = null;
    if (contentType.includes("application/json")) {
      try {
        result = await res.json();
      } catch {
        result = null;
      }
    }

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: getErrorMessage(result, "Login failed") },
        { status: res.status || 400 }
      );
    }

    const setCookieHeaders = getSetCookieHeaders(res);
    let accessTokenObject: any = null;
    let refreshTokenObject: any = null;

    setCookieHeaders.forEach((cookie: string) => {
      const parsedCookie = parse(cookie);
      if (parsedCookie["clientAccessToken"]) accessTokenObject = parsedCookie;
      if (parsedCookie["clientRefreshToken"]) refreshTokenObject = parsedCookie;
    });

    const tokenData = result?.data || result || {};
    const accessTokenVal =
      accessTokenObject?.clientAccessToken ||
      tokenData.clientAccessToken ||
      tokenData.accessToken;
    const refreshTokenVal =
      refreshTokenObject?.clientRefreshToken ||
      tokenData.clientRefreshToken ||
      tokenData.refreshToken;

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
      serialize("clientAccessToken", accessTokenVal, {
        secure: isSecure,
        httpOnly: true,
        maxAge: parseMaxAge(accessTokenObject?.["Max-Age"], 60 * 60),
        path: "/",
        sameSite: "lax",
      })
    );

    response.headers.append(
      "Set-Cookie",
      serialize("clientRefreshToken", refreshTokenVal, {
        secure: isSecure,
        httpOnly: true,
        maxAge: parseMaxAge(refreshTokenObject?.["Max-Age"], 60 * 60 * 24 * 7),
        path: "/",
        sameSite: "lax",
      })
    );

    response.headers.append(
      "Set-Cookie",
      serialize("clientLoggedIn", "true", {
        secure: isSecure,
        httpOnly: false,
        maxAge: parseMaxAge(refreshTokenObject?.["Max-Age"], 60 * 60 * 24 * 7),
        path: "/",
        sameSite: "lax",
      })
    );

    return response;
  } catch (error: any) {
    console.error("Client login API route error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Login failed" },
      { status: 500 }
    );
  }
}
