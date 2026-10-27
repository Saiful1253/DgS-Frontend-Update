import { cache } from "react";
import {
  deleteWhatWeDoAction,
  getWhatWeDoCategoriesAction,
  getWhatWeDoAction,
  reorderWhatWeDoAction,
  saveWhatWeDoAction,
} from "@/actions/what-we-do.actions";
import type { ActionResult } from "@/actions/action-result";
import type {
  PaginatedWhatWeDo,
  WhatWeDoQuery,
} from "@/types/what-we-do";

export type {
  PaginatedWhatWeDo,
  WhatWeDoItem,
  WhatWeDoInput,
  WhatWeDoQuery,
} from "@/types/what-we-do";
export type ReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export const getWhatWeDoResult = cache(
  async (query: WhatWeDoQuery): Promise<ReadResult<PaginatedWhatWeDo>> => {
    const result = await getWhatWeDoAction(query);
    if (!result.success) {
      return {
        ok: false,
        message: result.message || "Failed to load What We Do items",
      };
    }

    const data = result.data as PaginatedWhatWeDo | undefined;
    if (!Array.isArray(data?.data) || !data?.meta) {
      return {
        ok: false,
        message: "The What We Do response was invalid.",
      };
    }

    return { ok: true, data };
  },
);

export const getWhatWeDoCategoriesResult = cache(async (): Promise<ReadResult<string[]>> => {
  const result = await getWhatWeDoCategoriesAction();
  if (!result.success) {
    return {
      ok: false,
      message: result.message || "Failed to load What We Do categories",
    };
  }

  if (!Array.isArray(result.data)) {
    return {
      ok: false,
      message: "The What We Do categories response was invalid.",
    };
  }

  return {
    ok: true,
    data: result.data
      .map((item: { category?: unknown }) => item.category)
      .filter((value: unknown): value is string => typeof value === "string"),
  };
});

export const saveWhatWeDo = (input: unknown): Promise<ActionResult> =>
  saveWhatWeDoAction(input);

export const deleteWhatWeDo = (id: number): Promise<ActionResult> =>
  deleteWhatWeDoAction(id);

export const reorderWhatWeDo = (
  category: string,
  offset: number,
  ids: number[],
): Promise<ActionResult> => reorderWhatWeDoAction(category, offset, ids);
