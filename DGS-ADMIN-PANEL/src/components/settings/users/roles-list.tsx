"use client";

import React from "react";
import { Role } from "@/types/admin/role";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EditRoleModal from "./modals/role/edit-role-modal";
import DeleteRoleDialog from "./modals/role/delete-role-dialog";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { AppPagination } from "@/components/common/app-pagination";

interface Props {
  roles: Role[];
  total: number;
  page: number;
  limit: number;
}

export default function RolesList({ roles, total, page, limit }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handlePageChange = (p: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", p.toString());
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handlePageSizeChange = (size: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("limit", size.toString());
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const appliedPath = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200">
              <TableHead className="uppercase font-bold text-slate-600 text-xs py-3">Role Name</TableHead>
              <TableHead className="uppercase font-bold text-slate-600 text-xs py-3">Description</TableHead>
              <TableHead className="text-right uppercase font-bold text-slate-600 text-xs py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length > 0 ? (
              roles.map((role) => (
                <TableRow key={role.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0 transition-colors">
                  <TableCell className="py-3">
                    <span className="text-xs font-bold uppercase text-slate-800">{role.name}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed max-w-md">
                      {role.description || "No description provided"}
                    </p>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <EditRoleModal role={role} />
                      <DeleteRoleDialog roleId={role.id} roleName={role.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-xs text-muted-foreground italic font-medium uppercase tracking-tight">
                  No access roles defined in the system
                </TableCell>
              </TableRow>
            )}
</TableBody>
        </Table>
      </div>
    </div>

    <AppPagination
      page={page}
      totalPages={totalPages}
      total={total}
      appliedPath={appliedPath}
      onPageChange={handlePageChange}
      itemLabel="roles"
      pageSize={limit}
      onPageSizeChange={handlePageSizeChange}
    />
    </>
  );
}
