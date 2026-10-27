import React from "react";
import type { Metadata } from "next";
import {
  getWhatWeDoCategoriesResult,
  getWhatWeDoResult,
} from "@/services/what-we-do/what-we-do.service";
import {
  parseWhatWeDoQuery,
  WHAT_WE_DO_PAGE_SIZE_OPTIONS,
} from "@/lib/query/what-we-do-query";
import WhatWeDoManager from "@/components/services/what-we-do/what-we-do-manager";
import LoadErrorPanel from "@/components/common/load-error-panel";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "What We Do | Admin CMS",
  description: "Manage the challenges and engineered solutions shown on the DGS website.",
};

export default async function WhatWeDoPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseWhatWeDoQuery((await searchParams) ?? {});
  const [itemsResult, categoriesResult] = await Promise.all([
    getWhatWeDoResult(query),
    getWhatWeDoCategoriesResult(),
  ]);
  if (!itemsResult.ok) return <LoadErrorPanel message={itemsResult.message} />;
  if (!categoriesResult.ok) {
    return <LoadErrorPanel message={categoriesResult.message} />;
  }

  return (
    <WhatWeDoManager
      initialItems={itemsResult.data}
      categories={categoriesResult.data}
      query={query}
      pageSizeOptions={WHAT_WE_DO_PAGE_SIZE_OPTIONS}
    />
  );
}
