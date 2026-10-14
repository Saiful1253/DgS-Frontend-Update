 
"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ServiceGroup } from "@/types/service";
import { deleteServiceGroup } from "@/services/service/service.service";

interface DeleteGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ServiceGroup | null;
  onDeleted?: () => void;
}

export default function DeleteGroupDialog({
  open,
  onOpenChange,
  group,
  onDeleted,
}: DeleteGroupDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!group?.id || deleting) return;
    setDeleting(true);
    const loadingId = toast.loading("Deleting service group...");
    try {
      const res = await deleteServiceGroup(group.id);

      if (res.success) {
        toast.success(res.message || "Group removed successfully", { id: loadingId });
        onDeleted?.();
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to remove group", { id: loadingId });
      }
    } catch {
      toast.error("An error occurred while removing group", { id: loadingId });
    } finally {
      setDeleting(false);
    }
  };

  if (!group) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-slate-200 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            Delete Service Group
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Are you sure you want to delete service group <span className="font-bold text-slate-900">&quot;{group.name}&quot;</span>? This will unassign any services under this group.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={deleting} className="border-slate-200">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? "Deleting..." : "Confirm Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
