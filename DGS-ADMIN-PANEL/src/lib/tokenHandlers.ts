"use server";

import { cookies } from "next/headers";

export type CookieOptions = {
  secure?: boolean;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none" | boolean;
  domain?: string;
};

export const setCookie = async (key: string, value: string, options?: CookieOptions) => {
    const cookieStore = await cookies();
    cookieStore.set(key, value, options as Parameters<typeof cookieStore.set>[2]);
}

export const getCookie = async (key: string) => {
    const cookieStore = await cookies();
    return cookieStore.get(key)?.value || null;
}

export const deleteCookie = async (key: string) => {
    const cookieStore = await cookies();
    cookieStore.delete(key);
}