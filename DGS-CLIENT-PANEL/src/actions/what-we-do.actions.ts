"use server";

import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { publicFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import type { WhatWeDoItem } from "@/types/what-we-do";

export async function getPublicWhatWeDoAction(): Promise<ActionResult> {
  try {
    const response = await publicFetch.get("/what-we-do/public", {
      cache: "no-store",
    });
    if (!response.ok) {
      return failWithStatus(
        await extractApiErrorMessage(response, "Failed to load challenges and solutions"),
        response.status,
      );
    }

    const json = await parseApiResponse(response);
    if (json?.success === false) {
      return failWithStatus(
        json.message || "Failed to load challenges and solutions",
        json.statusCode,
      );
    }

    const data = json?.data ?? json;
    if (!Array.isArray(data)) {
      return fail("The challenges and solutions response was invalid.");
    }

    return ok("Challenges and solutions loaded", data as WhatWeDoItem[]);
  } catch (error: unknown) {
    return fail(
      error instanceof Error
        ? error.message
        : "Failed to load challenges and solutions",
    );
  }
}
