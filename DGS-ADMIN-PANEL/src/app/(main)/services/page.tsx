import React from "react";
import {
  getServicesResult,
  getServiceCategoriesResult,
  getServiceStatsResult,
} from "@/services/service/service.service";
import { parseServiceSearchParams, hasActiveServiceFilters } from "@/lib/query/service-query";
import ServicesManager from "@/components/services/services-manager";
import LoadErrorPanel from "@/components/common/load-error-panel";

export const revalidate = 0;

export const metadata = {
  title: "Services Management | DGS",
  description: "Manage engineering service items, active statuses, categories, and technical attributes.",
};

const PAGE_SIZE_OPTIONS = [21, 45, 66];

export default async function ServicesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseServiceSearchParams((await searchParams) ?? {});

  const [servicesResult, statsResult, categoriesResult] = await Promise.all([
    getServicesResult(query),
    getServiceStatsResult(),
    getServiceCategoriesResult(),
  ]);

  if (!servicesResult.ok) return <LoadErrorPanel message={servicesResult.message} />;
  if (!statsResult.ok) return <LoadErrorPanel message={statsResult.message} />;
  if (!categoriesResult.ok) return <LoadErrorPanel message={categoriesResult.message} />;

  return (
    <ServicesManager
      initialServices={servicesResult.data}
      categories={categoriesResult.data}
      initialStats={statsResult.data}
      query={query}
      filtersActive={hasActiveServiceFilters(query)}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );
}
