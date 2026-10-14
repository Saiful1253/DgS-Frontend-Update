import React from "react";
import {
  getServicesResult,
  getServiceGroupsResult,
  getServicePillarsResult,
  getServiceStatsResult,
} from "@/services/service/service.service";
import { parseServiceSearchParams, hasActiveServiceFilters } from "@/lib/query/service-query";
import ServicesManager from "@/components/services/services-manager";
import LoadErrorPanel from "@/components/common/load-error-panel";

export const revalidate = 0;

export const metadata = {
  title: "Services Management | Milanova Technologies",
  description: "Manage service items, active statuses, display orders, and icon attributes.",
};

const PAGE_SIZE_OPTIONS = [21, 45, 66];

export default async function ServicesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {

  const query = parseServiceSearchParams((await searchParams) ?? {});

  const [servicesResult, groupsResult, statsResult, pillarsResult] = await Promise.all([
    getServicesResult(query),
    getServiceGroupsResult(query.pillar),
    getServiceStatsResult(),
    getServicePillarsResult(),
  ]);

  if (!servicesResult.ok) return <LoadErrorPanel message={servicesResult.message} />;
  if (!groupsResult.ok) return <LoadErrorPanel message={groupsResult.message} />;
  if (!statsResult.ok) return <LoadErrorPanel message={statsResult.message} />;
  if (!pillarsResult.ok) return <LoadErrorPanel message={pillarsResult.message} />;

  return (
    <ServicesManager
      initialServices={servicesResult.data}
      initialGroups={groupsResult.data}
      pillars={pillarsResult.data}
      initialStats={statsResult.data}
      query={query}
      filtersActive={hasActiveServiceFilters(query)}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  );
}
