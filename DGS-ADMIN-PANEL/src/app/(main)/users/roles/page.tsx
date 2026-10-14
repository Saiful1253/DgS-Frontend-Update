import React from "react";
import { getRolesPageResult, type Role } from "@/services/admin/role.service";
import RolesList from "@/components/settings/users/roles-list";
import SettingsHeader from "@/components/settings/users/settings-header";
import AddRoleModal from "@/components/settings/users/modals/role/create-role-modal";
import LoadErrorPanel from "@/components/common/load-error-panel";
import { parseDashboardSearchParams } from "@/lib/query/dashboard-query";

export const revalidate = 0; // Dynamic server component

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SettingsRolesPage({ searchParams }: PageProps) {
  const raw = searchParams ? await searchParams : {};
  const { limit, page } = parseDashboardSearchParams(raw as Record<string, string | string[] | undefined>);

  const rolesResult = await getRolesPageResult(page, limit);

  if (!rolesResult.ok) return <LoadErrorPanel subject="roles" message={rolesResult.message} />;

  const roles: Role[] = rolesResult.data.data;
  const total = rolesResult.data.total;

  return (
    <div className="space-y-6 w-full">
      <SettingsHeader
        module="MODULE 1: USER & ROLE CONTROL"
        title="Access Roles"
        purpose="Defines the named access tiers assigned to admin users."
        stats={[
          { label: "Total Roles", value: total, subtitle: "Access tiers defined" },
          {
            label: "Active Roles",
            value: roles.filter((r) => r.status === "active").length,
            subtitle: "On current page",
            tone: "emerald",
          },
        ]}
        action={<AddRoleModal />}
      />
      <RolesList roles={roles} total={total} page={page} limit={limit} />
    </div>
  );
}
