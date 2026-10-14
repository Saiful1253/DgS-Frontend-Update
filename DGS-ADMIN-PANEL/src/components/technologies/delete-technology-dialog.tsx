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
import type { Technology } from "@/types/technology";
import { deleteTechnology } from "@/services/technology/technology.service";

interface Props {
  technology: Technology;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string | number) => void;
}

export default function DeleteTechnologyDialog({
  technology,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    const loadingId = toast.loading(`Deleting ${technology.name}...`);
    try {
      const res = await deleteTechnology(technology.id);
      if (!res.success) {
        toast.error(res.message || "Failed to delete technology", { id: loadingId });
        return;
      }
      toast.success(`${technology.name} deleted successfully`, { id: loadingId });
      onDeleted(technology.id);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred", {
        id: loadingId,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-slate-200 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            Delete Technology
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Are you sure you want to remove{" "}
            <span className="font-bold text-slate-900">&quot;{technology.name}&quot;</span> (
            <span className="text-[#00668a] font-medium">{technology.category}</span>)? This will
            permanently remove it from the database and public catalogue.
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
