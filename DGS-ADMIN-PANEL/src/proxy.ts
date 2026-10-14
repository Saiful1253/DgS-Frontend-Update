import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendUrl } from "@/lib/backend-url";

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

// Helper to call backend /auth/refresh and get new tokens
async function refreshTokens(refreshToken: string) {
  try {
    const response = await fetch(backendUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const result = await response.json();
    if (!result.success) return null;

    const headers = response.headers as Headers & { getSetCookie?: () => string[] };
    const setCookieHeaders = typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [];
    let accessTokenValue = "";
    let refreshTokenValue = "";
    let accessTokenMaxAge = 60 * 60; // default 1 hour
    let refreshTokenMaxAge = 60 * 60 * 24 * 90; // default 90 days

    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookieStr: string) => {
        const parsed = parseCookieString(cookieStr);
        if (parsed["accessToken"]) {
          accessTokenValue = parsed["accessToken"];
          if (parsed["Max-Age"]) accessTokenMaxAge = parseInt(parsed["Max-Age"]);
        }
        if (parsed["refreshToken"]) {
          refreshTokenValue = parsed["refreshToken"];
          if (parsed["Max-Age"]) refreshTokenMaxAge = parseInt(parsed["Max-Age"]);
        }
      });
    }

    if (!accessTokenValue) return null;

    return {
      accessToken: accessTokenValue,
      refreshToken: refreshTokenValue || refreshToken, // fallback to current if backend didn't rotate it
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

  // 1. Skip checks for static assets, API routes, and system endpoints
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const isSecure = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const hasValidAccessToken = accessToken && !isTokenExpired(accessToken);
  const isPostOrAction = request.method === "POST" || request.headers.has("next-action");

  // 2. If authenticated (has valid accessToken)
  if (hasValidAccessToken) {
    if ((pathname === "/login" || pathname === "/reset-password" || pathname === "/") && !isPostOrAction) {
      const res = NextResponse.redirect(new URL("/welcome", request.url));
      res.headers.set("x-middleware-cache", "no-cache");
      return res;
    }
    return NextResponse.next();
  }

  // 3. If we have refreshToken but no valid accessToken, try to refresh first
  if (refreshToken) {
    const newTokens = await refreshTokens(refreshToken);
    if (newTokens) {
      if (isPostOrAction) {
        const res = NextResponse.next();
        res.headers.set("x-middleware-cache", "no-cache");
        res.cookies.set("accessToken", newTokens.accessToken, {
          secure: isSecure,
          httpOnly: true,
          maxAge: newTokens.accessTokenMaxAge,
          path: "/",
          sameSite: "lax",
        });
        res.cookies.set("refreshToken", newTokens.refreshToken, {
          secure: isSecure,
          httpOnly: true,
          maxAge: newTokens.refreshTokenMaxAge,
          path: "/",
          sameSite: "lax",
        });
        return res;
      } else {
        const targetUrl = (pathname === "/" || pathname === "/login" || pathname === "/reset-password") ? "/welcome" : pathname;
        const res = NextResponse.redirect(new URL(targetUrl, request.url));
        res.headers.set("x-middleware-cache", "no-cache");
        res.cookies.set("accessToken", newTokens.accessToken, {
          secure: isSecure,
          httpOnly: true,
          maxAge: newTokens.accessTokenMaxAge,
          path: "/",
          sameSite: "lax",
        });
        res.cookies.set("refreshToken", newTokens.refreshToken, {
          secure: isSecure,
          httpOnly: true,
          maxAge: newTokens.refreshTokenMaxAge,
          path: "/",
          sameSite: "lax",
        });
        return res;
      }
    }
  }

  // 4. Unauthenticated user on public auth routes (/login, /reset-password)
  if (pathname.startsWith("/login") || pathname.startsWith("/reset-password")) {
    return NextResponse.next();
  }

  // 5. Unauthenticated user on protected routes: redirect to /login and clear stale tokens
  if (!isPostOrAction) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.headers.set("x-middleware-cache", "no-cache");
    res.cookies.delete("accessToken");
    res.cookies.delete("refreshToken");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)",
  ],
};
