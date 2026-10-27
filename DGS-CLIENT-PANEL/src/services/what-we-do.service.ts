import { cache } from "react";
import { getPublicWhatWeDoAction } from "@/actions/what-we-do.actions";
import type { WhatWeDoItem } from "@/types/what-we-do";

export type WhatWeDoReadResult =
  | { ok: true; data: WhatWeDoItem[] }
  | { ok: false; message: string };

export const getPublicWhatWeDoResult = cache(
  async (): Promise<WhatWeDoReadResult> => {
    const result = await getPublicWhatWeDoAction();
    if (!result.success) {
      return {
        ok: false,
        message: result.message || "Failed to load challenges and solutions",
      };
    }

    return {
      ok: true,
      data: Array.isArray(result.data) ? (result.data as WhatWeDoItem[]) : [],
    };
  },
);
