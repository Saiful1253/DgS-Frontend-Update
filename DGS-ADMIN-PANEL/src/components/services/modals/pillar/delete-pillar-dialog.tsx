 
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
import { ServicePillarEntity } from "@/types/service";
import { deleteServicePillar } from "@/services/service/service.service";

interface DeletePillarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillar: ServicePillarEntity | null;
  onDeleted?: () => void;
}

export default function DeletePillarDialog({
  open,
  onOpenChange,
  pillar,
  onDeleted,
}: DeletePillarDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!pillar?.id || deleting) return;
    setDeleting(true);
    const loadingId = toast.loading("Deleting service pillar...");
    try {
      const res = await deleteServicePillar(pillar.id);

      if (res.success) {
        toast.success(res.message || "Pillar removed successfully", { id: loadingId });
        onDeleted?.();
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to remove pillar", { id: loadingId });
      }
    } catch {
      toast.error("An error occurred while removing pillar", { id: loadingId });
    } finally {
      setDeleting(false);
    }
  };

  if (!pillar) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-slate-200 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            Delete Service Pillar
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Are you sure you want to delete pillar <span className="font-bold text-slate-900">&quot;{pillar.display_label || pillar.name}&quot;</span>? This will detach or affect any nested groups and services.
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
