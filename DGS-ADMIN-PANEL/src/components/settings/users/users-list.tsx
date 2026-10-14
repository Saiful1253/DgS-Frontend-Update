"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AdminUser } from "@/types/admin/user";
import { Role } from "@/types/admin/role";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EditUserModal from "./modals/user/edit-user-modal";
import DeleteUserDialog from "./modals/user/delete-user-dialog";
import { updateAdminUser } from "@/services/admin/user.service";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { AppPagination } from "@/components/common/app-pagination";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

interface Props {
  users: AdminUser[];
  roles: Role[];
  total: number;
  page: number;
  limit: number;
}

export default function UsersList({ users, roles, total, page, limit }: Props) {
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
  const handleStatusChange = async (id: string | number, newStatus: string) => {
    toast.loading(`Updating user status...`);
    try {
      const res = await updateAdminUser(id, { status: newStatus as any });
      toast.dismiss();
      if (res.success) {
        toast.success("Status updated");
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Something went wrong");
    }
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200">
              <TableHead className="uppercase font-bold text-slate-600 text-xs py-3">User Details</TableHead>
              <TableHead className="uppercase font-bold text-slate-600 text-center text-xs py-3">Role</TableHead>
              <TableHead className="uppercase font-bold text-slate-600 text-center text-xs py-3">Status</TableHead>
              <TableHead className="uppercase font-bold text-slate-600 text-center text-xs py-3">Quick Action</TableHead>
              <TableHead className="text-right uppercase font-bold text-slate-600 text-xs py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0 transition-colors">
                  <TableCell className="py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase text-slate-800">{user.name}</span>
                      <span className="text-[10px] font-medium text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-[10px] font-bold uppercase">
                      {user.role?.name || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <Badge className={cn(
                      "text-[10px] font-bold uppercase",
                      user.status === "active"
                        ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200 shadow-none"
                        : "bg-red-100 text-red-800 hover:bg-red-200 border-red-200 shadow-none"
                    )}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <div className="flex justify-center">
                      <Select
                        value={user.status}
                        onValueChange={(v) => handleStatusChange(user.id, v)}
                      >
                        <SelectTrigger className="h-8 w-28 text-[10px] font-bold uppercase bg-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active" className="text-[10px] font-bold uppercase">Active</SelectItem>
                          <SelectItem value="inactive" className="text-[10px] font-bold uppercase text-red-600">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <EditUserModal user={user} roles={roles} />
                      <DeleteUserDialog userId={user.id} userName={user.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-xs text-muted-foreground italic font-medium uppercase tracking-tight">
                  No users found in the system
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
      itemLabel="users"
      pageSize={limit}
      onPageSizeChange={handlePageSizeChange}
    />
    </>
  );
}
