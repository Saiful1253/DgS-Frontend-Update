/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

// Helper to parse Set-Cookie header strings returned from backend
function parseCookieString(str: string): Record<string, string> {
  const obj: Record<string, string> = {};
  const pairs = str.split(";");
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].trim();
    if (!pair) continue;
    const index = pair.indexOf("=");
    if (index === -1) continue;
    const key = pair.substring(0, index).trim();
    const val = pair.substring(index + 1).trim();
    obj[key] = val;
  }
  return obj;
}

// Helper to parse JWT payload locally without verification key
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Check if token is expired or expires in the next 10 seconds
function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= (payload.exp * 1000 - 10000);
}

// Helper to call backend /client/auth/refresh and get new tokens
async function refreshTokens(refreshToken: string) {
  const backendUrl = getBackendUrl();

  try {
    const response = await fetch(`${backendUrl}/client/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: `clientRefreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    await response.json();
    const setCookieHeaders = typeof (response.headers as any).getSetCookie === "function"
      ? (response.headers as any).getSetCookie()
      : [];
    let accessTokenValue = "";
    let refreshTokenValue = "";
    let accessTokenMaxAge = 60 * 60; // default 1 hour
    let refreshTokenMaxAge = 60 * 60 * 24 * 7; // default 7 days

    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookieStr: string) => {
        const parsed = parseCookieString(cookieStr);
        if (parsed["clientAccessToken"]) {
          accessTokenValue = parsed["clientAccessToken"];
          if (parsed["Max-Age"]) accessTokenMaxAge = parseInt(parsed["Max-Age"]);
        }
        if (parsed["clientRefreshToken"]) {
          refreshTokenValue = parsed["clientRefreshToken"];
          if (parsed["Max-Age"]) refreshTokenMaxAge = parseInt(parsed["Max-Age"]);
        }
      });
    }

    if (!accessTokenValue) return null;

    return {
      accessToken: accessTokenValue,
      refreshToken: refreshTokenValue || refreshToken,
      accessTokenMaxAge,
      refreshTokenMaxAge,
    };
  } catch (error) {
    console.error("Failed to refresh tokens in proxy middleware:", error);
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("clientAccessToken")?.value;
  const refreshToken = request.cookies.get("clientRefreshToken")?.value;

  // 0. Google OAuth callback — set cookies and redirect home
  if (pathname === "/auth/google-callback") {
    const accessToken  = request.nextUrl.searchParams.get("accessToken");
    const refreshToken = request.nextUrl.searchParams.get("refreshToken");

    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(new URL("/login?error=google_auth_failed", request.url));
    }

    const isSecureCallback = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    const res = NextResponse.redirect(new URL("/", request.url));

    res.cookies.set("clientAccessToken", accessToken, {
      httpOnly: true,
      secure: isSecureCallback,
      maxAge: 60 * 60,
      path: "/",
      sameSite: "lax",
    });
    res.cookies.set("clientRefreshToken", refreshToken, {
      httpOnly: true,
      secure: isSecureCallback,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });
    res.cookies.set("clientLoggedIn", "true", {
      httpOnly: false,
      secure: isSecureCallback,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });

    return res;
  }

  // 1. Skip checks for static assets and API routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isSecure = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const hasValidAccessToken = accessToken && !isTokenExpired(accessToken);

  const isPostOrAction = request.method === "POST" || request.headers.has("next-action");

  // 2. If we have refreshToken but no valid accessToken, try to refresh first
  if (!hasValidAccessToken && refreshToken) {
    const newTokens = await refreshTokens(refreshToken);
    if (newTokens) {
      if (isPostOrAction) {
        const res = NextResponse.next();
        res.headers.set("x-middleware-cache", "no-cache");
        res.cookies.set("clientAccessToken", newTokens.accessToken, {
          secure: isSecure,
          httpOnly: true,
          maxAge: newTokens.accessTokenMaxAge,
          path: "/",
          sameSite: "lax",
        });
        res.cookies.set("clientRefreshToken", newTokens.refreshToken, {
          secure: isSecure,
          httpOnly: true,
          maxAge: newTokens.refreshTokenMaxAge,
          path: "/",
          sameSite: "lax",
        });
        return res;
      } else {
        const targetUrl = (pathname === "/login" || pathname === "/register") ? "/" : pathname;
        const res = NextResponse.redirect(new URL(targetUrl, request.url));
        res.headers.set("x-middleware-cache", "no-cache");
        res.cookies.set("clientAccessToken", newTokens.accessToken, {
          secure: isSecure,
          httpOnly: true,
          maxAge: newTokens.accessTokenMaxAge,
          path: "/",
          sameSite: "lax",
        });
        res.cookies.set("clientRefreshToken", newTokens.refreshToken, {
          secure: isSecure,
          httpOnly: true,
          maxAge: newTokens.refreshTokenMaxAge,
          path: "/",
          sameSite: "lax",
        });
        return res;
      }
    } else {
      // Refresh failed: clear cookies
      if (isPostOrAction) {
        const res = NextResponse.next();
        res.headers.set("x-middleware-cache", "no-cache");
        res.cookies.delete("clientAccessToken");
        res.cookies.delete("clientRefreshToken");
        return res;
      } else {
        const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
        const res = isAuthRoute
          ? NextResponse.next()
          : NextResponse.redirect(new URL("/login", request.url));
        res.headers.set("x-middleware-cache", "no-cache");
        res.cookies.delete("clientAccessToken");
        res.cookies.delete("clientRefreshToken");
        return res;
      }
    }
  }

  // 3. If authenticated (has valid accessToken)
  if (hasValidAccessToken) {
    if ((pathname === "/login" || pathname === "/register") && !isPostOrAction) {
      const res = NextResponse.redirect(new URL("/", request.url));
      res.headers.set("x-middleware-cache", "no-cache");
      return res;
    }
    return NextResponse.next();
  }

  // 4. If not authenticated and trying to access protected route, redirect to /login
  const isProtectedRoute = pathname.startsWith("/client/orders");
  if (isProtectedRoute && !hasValidAccessToken && !isPostOrAction) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.headers.set("x-middleware-cache", "no-cache");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)",
  ],
};
