import "server-only";

import { getBackendUrl } from "./backend-url";
import { BACKEND_TIMEOUT_MS } from "./api-error";

type NextFetchOptions = {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

/**
 * Unauthenticated transport.
 *
 * Used for login, registration and password reset — the three calls that happen
 * before a token exists. `DYNAMIC_SERVER_USAGE` is re-thrown so Next.js can
 * still switch a route to dynamic rendering; swallowing it turns a legitimate
 * bail-out into a phantom 503.
 */
const publicFetchHelper = async (
  endpoint: string,
  options: (RequestInit & NextFetchOptions) = {}
): Promise<Response> => {
  try {
    const { headers, ...restOptions } = options;
    const requestHeaders = new Headers(headers);

    if (
      !requestHeaders.has("Content-Type") &&
      restOptions.body &&
      typeof restOptions.body === "string"
    ) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const signal = restOptions.signal ?? AbortSignal.timeout(BACKEND_TIMEOUT_MS);

    const response = await fetch(`${getBackendUrl()}${endpoint}`, {
      ...restOptions,
      headers: requestHeaders,
      signal,
    });

    return response;
  } catch (error) {
    if ((error as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    console.error(`publicFetch error for ${endpoint}:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Backend API network error: ${(error as { message?: string })?.message || "Connection failed"}`,
        statusCode: 503,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const publicFetch = {
  get: async (endpoint: string, options: (RequestInit & NextFetchOptions) = {}): Promise<Response> =>
    publicFetchHelper(endpoint, { ...options, method: "GET" }),

  post: async (endpoint: string, options: (RequestInit & NextFetchOptions) = {}): Promise<Response> =>
    publicFetchHelper(endpoint, { ...options, method: "POST" }),

  put: async (endpoint: string, options: (RequestInit & NextFetchOptions) = {}): Promise<Response> =>
    publicFetchHelper(endpoint, { ...options, method: "PUT" }),

  patch: async (endpoint: string, options: (RequestInit & NextFetchOptions) = {}): Promise<Response> =>
    publicFetchHelper(endpoint, { ...options, method: "PATCH" }),

  delete: async (endpoint: string, options: (RequestInit & NextFetchOptions) = {}): Promise<Response> =>
    publicFetchHelper(endpoint, { ...options, method: "DELETE" }),
};
