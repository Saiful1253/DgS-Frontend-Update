import { cache } from "react";
import {
  createBrandAction,
  deleteBrandAction,
  getBrandsOptionsAction,
  updateBrandAction,
  uploadBrandLogoAction,
} from "@/actions/brand.actions";
import type { Brand } from "@/types/product/brand";
import type { BrandCreateInput, BrandUpdateInput } from "@/zod/brand.validation";

/**
 * Brand service — the domain layer for the module.
 *
 * House chain: `page / component → service → action → HTTP`. The service holds no
 * transport: every request is a `"use server"` action, so a client component may
 * import this module and its calls arrive as an RPC on the server, where the
 * validation and the revalidation live.
 *
 * The `get*Result` reader is for the `/products` page, which renders the brand
 * select and the brand table from one read. A failed read must not render as an
 * empty brand list.
 *
 * There is no dedicated `brands.*` code: the routes are gated with the seeded
 * `products.saas.*` codes, and an unseeded string is pruned from RBAC by the seed
 * helper, which would 403 for every role.
 */

export type { Brand } from "@/types/product/brand";

export type BrandReadResult =
  | { ok: true; data: Brand[] }
  | { ok: false; message: string };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getBrandsResult = cache(async (): Promise<BrandReadResult> => {
  const res = await getBrandsOptionsAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to load brands" };
  return { ok: true, data: Array.isArray(res.data) ? (res.data as Brand[]) : [] };
});

// ── Reads and writes for client components ───────────────────────────────────

export const listBrandsOptions = () => getBrandsOptionsAction();

export const createBrand = (input: BrandCreateInput) => createBrandAction(input);

export const updateBrand = (id: string | number, input: BrandUpdateInput) =>
  updateBrandAction(id, input);

export const deleteBrand = (id: string | number) => deleteBrandAction(id);

export const uploadBrandLogo = (formData: FormData, id?: string | number) =>
  id ? uploadBrandLogoAction(id, formData) : uploadBrandLogoAction(formData);
