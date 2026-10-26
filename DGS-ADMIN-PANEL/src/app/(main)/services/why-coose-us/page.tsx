import React from "react";
import type { Metadata } from "next";
import {
  getWhyChooseUsResult,
  getWhyChooseUsStatsResult,
  getWhyChooseUsMetricsResult,
  DEFAULT_WHY_CHOOSE_US_METRICS,
} from "@/services/why-choose-us/why-choose-us.service";
import {
  parseWhyChooseUsSearchParams,
  hasActiveWhyChooseUsFilters,
} from "@/lib/query/why-choose-us-query";
import WhyChooseUsManager from "@/components/services/why-choose-us/why-choose-us-manager";
import LoadErrorPanel from "@/components/common/load-error-panel";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Why Choose Digital Gas Service | Admin CMS",
  description: "Manage reasons, value propositions, and certifications for choosing DG gas services.",
};

const PAGE_SIZE_OPTIONS = [20, 40, 60];

export default async function WhyChooseUsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseWhyChooseUsSearchParams((await searchParams) ?? {});

  const [itemsResult, statsResult, metricsResult] = await Promise.all([
    getWhyChooseUsResult(query),
    getWhyChooseUsStatsResult(),
    getWhyChooseUsMetricsResult(),
  ]);

  if (!itemsResult.ok) return <LoadErrorPanel message={itemsResult.message} />;
  if (!statsResult.ok) return <LoadErrorPanel message={statsResult.message} />;

  return (
    <WhyChooseUsManager
      initialItems={itemsResult.data}
      initialStats={statsResult.data}
      initialMetrics={metricsResult.ok ? metricsResult.data : DEFAULT_WHY_CHOOSE_US_METRICS}
      query={query}
      filtersActive={hasActiveWhyChooseUsFilters(query)}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );
}
