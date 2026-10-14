import { getNewAccessToken } from "@/services/auth/auth.refresh.service";
import { getCookie } from "./tokenHandlers";
import { getBackendUrl } from "./backend-url";
import { BACKEND_TIMEOUT_MS } from "./api-error";

/**
 * Authenticated transport.
 *
 * Every admin call goes through here. The bearer token is read from the httpOnly
 * cookie and re-attached per request, and a token that is close to expiry is
 * rotated first — the page render and the subsequent server action therefore
 * never race on a stale access token.
 */
const serverFetchHelper = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  try {
    const { headers, ...restOptions } = options;
    const requestHeaders = new Headers(headers);

    let accessToken = await getCookie("accessToken");

    if (endpoint !== "/auth/refresh") {
      const res = await getNewAccessToken().catch(() => ({ tokenRefreshed: false, accessToken: null }));
      if (res.tokenRefreshed && res.accessToken) {
        accessToken = res.accessToken;
      }
    }

    if (accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
      requestHeaders.set("Cookie", `accessToken=${accessToken}`);
    }

    // Multipart bodies must keep the boundary the runtime generates, so the
    // Content-Type is only inferred for string/Buffer bodies. Callers no longer
    // need to set it by hand.
    if (
      !requestHeaders.has("Content-Type") &&
      restOptions.body &&
      typeof restOptions.body === "string"
    ) {
      requestHeaders.set("Content-Type", "application/json");
    }

    // A hung backend would otherwise hold the request open until the platform
    // timeout. Callers may still pass their own `signal`, which wins.
    const signal = restOptions.signal ?? AbortSignal.timeout(BACKEND_TIMEOUT_MS);

    const response = await fetch(`${getBackendUrl()}${endpoint}`, {
      cache: "no-store",
      ...restOptions,
      headers: requestHeaders,
      signal,
    });

    return response;
  } catch (error) {
    if ((error as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    // An aborted call is a timeout, not a crash — report it as an unavailable
    // backend so the action layer renders a retryable failure.
    console.error(`serverFetch error for ${endpoint}:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Backend API unavailable",
        statusCode: 503,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const serverFetch = {
  get: (endpoint: string, options: RequestInit = {}) =>
    serverFetchHelper(endpoint, { ...options, method: "GET" }),

  post: (endpoint: string, options: RequestInit = {}) =>
    serverFetchHelper(endpoint, { ...options, method: "POST" }),

  put: (endpoint: string, options: RequestInit = {}) =>
    serverFetchHelper(endpoint, { ...options, method: "PUT" }),

  patch: (endpoint: string, options: RequestInit = {}) =>
    serverFetchHelper(endpoint, { ...options, method: "PATCH" }),

  delete: (endpoint: string, options: RequestInit = {}) =>
    serverFetchHelper(endpoint, { ...options, method: "DELETE" }),
};
