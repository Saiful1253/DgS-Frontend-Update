"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteRole } from "@/services/admin/role.service";

interface Props {
  roleId: string | number;
  roleName?: string;
  disabled?: boolean;
}

export default function DeleteRoleDialog({ roleId, roleName, disabled = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    toast.loading("Deleting role...");
    try {
      const res = await deleteRole(roleId);

      toast.dismiss();
      if (!res.success) {
        toast.error(res.message || "Failed to delete role");
        return;
      }

      toast.success(res.message || "Role deleted");
      setOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : "Failed to delete role");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          disabled={disabled}
        >
          <Trash2 size={14} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="uppercase font-bold tracking-tight">Delete access role?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            This will permanently delete the role <span className="font-bold text-gray-900">{roleName}</span>.
            This action might affect all users assigned to this role.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={submitting}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
            className="ml-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {submitting ? "Deleting..." : "Delete Role"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
