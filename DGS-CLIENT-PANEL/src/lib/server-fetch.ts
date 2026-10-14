/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { getBackendUrl } from "@/lib/backend-url";
import { BACKEND_TIMEOUT_MS } from "@/lib/api-error";

const BACKEND_API_URL = getBackendUrl();

type NextFetchOptions = {
    next?: {
        revalidate?: number;
        tags?: string[];
    };
};

import { getCookie } from "./tokenHandlers";

const publicFetchHelper = async (
    endpoint: string,
    options: (RequestInit & NextFetchOptions) = {}
): Promise<Response> => {
    try {
        const { headers, ...restOptions } = options;
        const requestHeaders = new Headers(headers);

        if (!requestHeaders.has("Content-Type") && restOptions.body && !(restOptions.body instanceof FormData)) {
            requestHeaders.set("Content-Type", "application/json");
        }

        const signal = restOptions.signal ?? AbortSignal.timeout(BACKEND_TIMEOUT_MS);

        const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
            headers: requestHeaders,
            ...restOptions,
            signal,
        });

        return response;
    } catch (error: any) {
        console.error(`publicFetch error for ${endpoint}:`, error);
        return new Response(
            JSON.stringify({ success: false, message: `Backend API network error: ${error?.message || 'Connection failed'}` }),
            {
                status: 503,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
};

const privateFetchHelper = async (
    endpoint: string,
    options: (RequestInit & NextFetchOptions) = {}
): Promise<Response> => {
    try {
        const { headers, ...restOptions } = options;
        const requestHeaders = new Headers(headers);

        const clientAccessToken = await getCookie("clientAccessToken");
        if (clientAccessToken) {
            requestHeaders.set("Authorization", `Bearer ${clientAccessToken}`);
        }

        if (!requestHeaders.has("Content-Type") && restOptions.body && !(restOptions.body instanceof FormData)) {
            requestHeaders.set("Content-Type", "application/json");
        }

        const signal = restOptions.signal ?? AbortSignal.timeout(BACKEND_TIMEOUT_MS);

        const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
            headers: requestHeaders,
            ...restOptions,
            signal,
        });

        return response;
    } catch (error: any) {
        if (error?.digest === "DYNAMIC_SERVER_USAGE") {
            throw error;
        }
        console.error(`privateFetch error for ${endpoint}:`, error);
        return new Response(
            JSON.stringify({ success: false, message: "Backend API unavailable" }),
            {
                status: 503,
                headers: { "Content-Type": "application/json" },
            }
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

export const privateFetch = {
    get: async (endpoint: string, options: (RequestInit & NextFetchOptions) = {}): Promise<Response> =>
        privateFetchHelper(endpoint, { ...options, method: "GET" }),

    post: async (endpoint: string, options: (RequestInit & NextFetchOptions) = {}): Promise<Response> =>
        privateFetchHelper(endpoint, { ...options, method: "POST" }),

    put: async (endpoint: string, options: (RequestInit & NextFetchOptions) = {}): Promise<Response> =>
        privateFetchHelper(endpoint, { ...options, method: "PUT" }),

    patch: async (endpoint: string, options: (RequestInit & NextFetchOptions) = {}): Promise<Response> =>
        privateFetchHelper(endpoint, { ...options, method: "PATCH" }),

    delete: async (endpoint: string, options: (RequestInit & NextFetchOptions) = {}): Promise<Response> =>
        privateFetchHelper(endpoint, { ...options, method: "DELETE" }),
};
