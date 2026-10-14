 
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
import { deletePortfolioCategory } from "@/services/portfolio/portfolio.service";
import { PortfolioCategory } from "@/types/portfolio";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: PortfolioCategory | null;
  onSuccess?: () => void;
}

export default function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!category?.id || deleting) return;
    setDeleting(true);

    try {
      const res = await deletePortfolioCategory(category.id);
      if (res.success) {
        toast.success(res.message || "Category deleted successfully");
        onOpenChange(false);
        onSuccess?.();
        router.refresh();
      } else {
        toast.error(res.message || "Failed to delete category");
      }
    } catch {
      toast.error("An error occurred while deleting category");
    } finally {
      setDeleting(false);
    }
  };

  if (!category) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">Delete Portfolio Category</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Are you sure you want to delete category <span className="font-bold text-slate-900">&quot;{category.name}&quot;</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
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
