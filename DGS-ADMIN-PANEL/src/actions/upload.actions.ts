/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { fail, fromServiceResponse,  type ActionResult } from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { parseApiResponse } from "@/lib/api-error";

/**
 * Upload actions — the transport boundary for image uploads.
 *
 * House chain: `page / component → service → action → HTTP`.
 *
 * The generic `(formData, { folder, label })` entry point was removed: its only
 * caller was the pillar action below.
 *
 * The `folder` field is appended here rather than in the service: it is part of
 * the multipart body, and the body is transport.
 */

/** Category icons: categories get their own upload folder. */
const CATEGORY_FOLDER = "service-categories";

export async function uploadServiceCategoryIconAction(
  formData: FormData,
  folder: string = CATEGORY_FOLDER
): Promise<ActionResult> {
  try {
    if (!formData.get("file")) return fail("No file selected");

    formData.append("folder", folder);
    const res = await serverFetch.post("/upload/image", { body: formData as any });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to upload category icon");
    if (!result.success) return result;

    return { ...result, message: result.message || "Category icon uploaded successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload category icon");
  }
}

export const uploadServicePillarIconAction = uploadServiceCategoryIconAction;

export async function uploadHeroIconAction(
  formData: FormData,
  folder: string = "hero-icons"
): Promise<ActionResult> {
  try {
    if (!formData.get("file")) return fail("No file selected");
    if (!formData.has("folder")) formData.append("folder", folder);
    const res = await serverFetch.post("/upload/image", { body: formData as any });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to upload icon");
    if (!result.success) return result;
    return { ...result, message: result.message || "icon uploaded successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload icon");
  }
}

export async function uploadCertificateIconAction(
  formData: FormData,
  folder: string = "certificate-icons"
): Promise<ActionResult> {
  try {
    if (!formData.get("file")) return fail("No file selected");
    if (!formData.has("folder")) formData.append("folder", folder);
    const res = await serverFetch.post("/upload/image", { body: formData as any });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to upload certificate icon");
    if (!result.success) return result;
    return { ...result, message: result.message || "certificate icon uploaded successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload certificate icon");
  }
}
