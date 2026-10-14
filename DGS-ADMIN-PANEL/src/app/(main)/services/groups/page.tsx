import React from "react";
import {
  getServiceGroupsResult,
  getServicePillarsResult,
  getServicesResult,
} from "@/services/service/service.service";
import ServiceGroupsManager from "@/components/services/service-groups-manager";
import LoadErrorPanel from "@/components/common/load-error-panel";

export const revalidate = 0;

export const metadata = {
  title: "Service Groups | Milanova Technologies",
  description: "Manage numbered service capability groups across pillars.",
};

export default async function ServiceGroupsPage() {

  const hasManageAccess = true;

  const [groupsResult, servicesResult, pillarsResult] = await Promise.all([
    getServiceGroupsResult(),
    getServicesResult({ limit: 100 }),
    getServicePillarsResult(),
  ]);

  if (!groupsResult.ok) return <LoadErrorPanel message={groupsResult.message} />;
  if (!servicesResult.ok) return <LoadErrorPanel message={servicesResult.message} />;
  if (!pillarsResult.ok) return <LoadErrorPanel message={pillarsResult.message} />;

  return (
    <ServiceGroupsManager
      groups={groupsResult.data}
      services={servicesResult.data.data}
      pillars={pillarsResult.data}
      canManage={hasManageAccess}
    />
  );
}
