"use server";

import { revalidatePath } from "next/cache";
import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { serverFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import { buildWhatWeDoApiQuery } from "@/lib/query/what-we-do-query";
import type { WhatWeDoQuery } from "@/types/what-we-do";
import { whatWeDoSchema } from "@/zod/what-we-do.validation";

const unauthorizedMessage =
  "Your session is no longer authorized to manage What We Do. Sign in again.";

function revalidateWhatWeDo() {
  revalidatePath("/services/what-we-do");
  revalidatePath("/services");
  revalidatePath("/");
}

export async function getWhatWeDoAction(
  query: WhatWeDoQuery,
): Promise<ActionResult> {
  try {
    const response = await serverFetch.get(
      `/what-we-do?${buildWhatWeDoApiQuery(query)}`,
    );
    if (!response.ok) {
      return failWithStatus(
        response.status === 401 || response.status === 403
          ? unauthorizedMessage
          : await extractApiErrorMessage(response, "Failed to load What We Do items"),
        response.status,
      );
    }

    const json = await parseApiResponse(response);
    if (json?.success === false) {
      return failWithStatus(
        json.message || "Failed to load What We Do items",
        json.statusCode,
      );
    }

    const payload = json?.data ?? json;
    if (!Array.isArray(payload?.data) || !payload?.meta) {
      return fail("The What We Do response was invalid.");
    }

    return ok("What We Do items loaded", payload);
  } catch (error: unknown) {
    return fail(
      error instanceof Error ? error.message : "Failed to load What We Do items",
    );
  }
}

export async function getWhatWeDoCategoriesAction(): Promise<ActionResult> {
  try {
    const response = await serverFetch.get("/what-we-do/categories");
    if (!response.ok) {
      return failWithStatus(
        response.status === 401 || response.status === 403
          ? unauthorizedMessage
          : await extractApiErrorMessage(response, "Failed to load categories"),
        response.status,
      );
    }

    const json = await parseApiResponse(response);
    if (json?.success === false) {
      return failWithStatus(
        json.message || "Failed to load categories",
        json.statusCode,
      );
    }

    const data = json?.data ?? json;
    if (!Array.isArray(data)) return fail("The categories response was invalid.");
    return ok("Categories loaded", data);
  } catch (error: unknown) {
    return fail(
      error instanceof Error ? error.message : "Failed to load categories",
    );
  }
}

export async function getPublicWhatWeDoAction(): Promise<ActionResult> {
  try {
    const response = await serverFetch.get("/what-we-do/public", {
      cache: "no-store",
    });
    if (!response.ok) {
      return failWithStatus(
        await extractApiErrorMessage(
          response,
          "Failed to load challenges and solutions",
        ),
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

    return ok("Challenges and solutions loaded", data);
  } catch (error: unknown) {
    return fail(
      error instanceof Error
        ? error.message
        : "Failed to load challenges and solutions",
    );
  }
}

export async function saveWhatWeDoAction(raw: unknown): Promise<ActionResult> {
  const parsed = whatWeDoSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return fail(
      firstIssue
        ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
        : "Validation failed",
    );
  }

  const { id, ...payload } = parsed.data;

  try {
    const isUpdate = typeof id === "number" && id > 0;
    const response = isUpdate
      ? await serverFetch.patch(`/what-we-do/${id}`, {
          body: JSON.stringify(payload),
        })
      : await serverFetch.post("/what-we-do/create", {
          body: JSON.stringify([payload]),
        });

    if (!response.ok) {
      return failWithStatus(
        response.status === 401 || response.status === 403
          ? unauthorizedMessage
          : await extractApiErrorMessage(response, "Failed to save What We Do item"),
        response.status,
      );
    }

    const json = await parseApiResponse(response);
    if (json?.success === false) {
      return failWithStatus(
        json.message || "Failed to save What We Do item",
        json.statusCode,
      );
    }

    revalidateWhatWeDo();
    return ok(
      json?.message || (isUpdate ? "Item updated successfully" : "Item created successfully"),
      json?.data ?? json,
    );
  } catch (error: unknown) {
    return fail(
      error instanceof Error ? error.message : "Failed to save What We Do item",
    );
  }
}

export async function deleteWhatWeDoAction(id: number): Promise<ActionResult> {
  try {
    const response = await serverFetch.delete(`/what-we-do/${id}`);
    if (!response.ok) {
      return failWithStatus(
        response.status === 401 || response.status === 403
          ? unauthorizedMessage
          : await extractApiErrorMessage(response, "Failed to delete What We Do item"),
        response.status,
      );
    }

    const json = await parseApiResponse(response);
    if (json?.success === false) {
      return failWithStatus(
        json.message || "Failed to delete What We Do item",
        json.statusCode,
      );
    }

    revalidateWhatWeDo();
    return ok(json?.message || "Item deleted successfully");
  } catch (error: unknown) {
    return fail(
      error instanceof Error ? error.message : "Failed to delete What We Do item",
    );
  }
}

export async function reorderWhatWeDoAction(
  category: string,
  offset: number,
  ids: number[],
): Promise<ActionResult> {
  if (
    !category.trim() ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    ids.length === 0 ||
    new Set(ids).size !== ids.length
  ) {
    return fail("Select a category and provide its ordered items.");
  }

  try {
    const response = await serverFetch.post("/what-we-do/reorder", {
      body: JSON.stringify({ category, offset, ids }),
    });
    if (!response.ok) {
      return failWithStatus(
        response.status === 401 || response.status === 403
          ? unauthorizedMessage
          : await extractApiErrorMessage(response, "Failed to save item order"),
        response.status,
      );
    }

    const json = await parseApiResponse(response);
    if (json?.success === false) {
      return failWithStatus(
        json.message || "Failed to save item order",
        json.statusCode,
      );
    }

    revalidateWhatWeDo();
    return ok(json?.message || "Item order saved");
  } catch (error: unknown) {
    return fail(
      error instanceof Error ? error.message : "Failed to save item order",
    );
  }
}
