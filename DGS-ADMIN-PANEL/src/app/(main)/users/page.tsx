import React from "react";
import { getAdminUsersResult, type AdminUser } from "@/services/admin/user.service";
import { getRolesResult } from "@/services/admin/role.service";
import UsersList from "@/components/settings/users/users-list";
import SettingsHeader from "@/components/settings/users/settings-header";
import AddUserModal from "@/components/settings/users/modals/user/create-user-modal";
import LoadErrorPanel from "@/components/common/load-error-panel";
import { parseDashboardSearchParams } from "@/lib/query/dashboard-query";

export const revalidate = 0; // Dynamic server component

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SettingsUsersPage({ searchParams }: PageProps) {
  const raw = searchParams ? await searchParams : {};
  const { limit, page } = parseDashboardSearchParams(raw as Record<string, string | string[] | undefined>);

  const [rolesResult, usersResult] = await Promise.all([
    getRolesResult(),
    getAdminUsersResult(page, limit),
  ]);

  if (!usersResult.ok) return <LoadErrorPanel subject="admin users" message={usersResult.message} />;
  if (!rolesResult.ok) return <LoadErrorPanel subject="roles" message={rolesResult.message} />;

  const roles = rolesResult.data;
  const users: AdminUser[] = usersResult.data.data;
  const total = usersResult.data.total;

  return (
    <div className="space-y-6 w-full">
      <SettingsHeader
        module="MODULE 1: USER & ROLE CONTROL"
        title="User & Role Control"
        purpose="Manages admin user accounts and the role assigned to each one."
        stats={[
          { label: "Total Admin Users", value: total, subtitle: "Registered in system" },
          {
            label: "Active Accounts",
            value: users.filter((u) => u.status === "active").length,
            subtitle: "On current page",
            tone: "emerald",
          },
          { label: "Roles Defined", value: roles.length, subtitle: "Access tiers available", tone: "primary" },
        ]}
        action={<AddUserModal roles={roles} />}
      />
      <UsersList
        users={users}
        roles={roles}
        total={total}
        page={page}
        limit={limit}
      />
    </div>
  );
}
