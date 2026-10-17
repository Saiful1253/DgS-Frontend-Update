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

/** Pillar icons: pillars are a distinct resource, so they get their own folder. */
const PILLAR_FOLDER = "service-pillars";

export async function uploadServicePillarIconAction(
  formData: FormData,
  folder: string = PILLAR_FOLDER
): Promise<ActionResult> {
  try {
    if (!formData.get("file")) return fail("No file selected");

    formData.append("folder", folder);
    const res = await serverFetch.post("/upload/image", { body: formData as any });
    const result = fromServiceResponse(await parseApiResponse(res), "Failed to upload pillar icon");
    if (!result.success) return result;

    return { ...result, message: result.message || "pillar icon uploaded successfully" };
  } catch (e: unknown) {
    return fail(e instanceof Error ? e.message : "Failed to upload pillar icon");
  }
}

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
