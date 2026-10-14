import React from "react";
import {
  getServiceGroupsResult,
  getServicePillarsResult,
  getServiceStatsResult,
} from "@/services/service/service.service";
import ServicePillarsManager from "@/components/services/service-pillars-manager";
import LoadErrorPanel from "@/components/common/load-error-panel";

export const revalidate = 0;

export const metadata = {
  title: "Service Pillars | Milanova Technologies",
  description: "View and configure dynamic service pillars.",
};

export default async function ServicePillarsPage() {

  const [pillarsResult, statsResult, groupsResult] = await Promise.all([
    getServicePillarsResult(),
    getServiceStatsResult(),
    getServiceGroupsResult(),
  ]);

  if (!pillarsResult.ok) return <LoadErrorPanel message={pillarsResult.message} />;
  if (!statsResult.ok) return <LoadErrorPanel message={statsResult.message} />;
  if (!groupsResult.ok) return <LoadErrorPanel message={groupsResult.message} />;

  return (
    <ServicePillarsManager
      pillars={pillarsResult.data}
      stats={statsResult.data}
      groups={groupsResult.data}
    />
  );
}
