"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import type { Category } from "@/types/product/product.category";
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
import { deleteCategory } from "@/services/category/category.service";

interface Props {
  category: Category;
  onDeleted?: () => void | Promise<void>;
  trigger?: React.ReactNode;
}

export default function DeleteCategoryDialog({
  category,
  onDeleted,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    toast.loading("Deleting category...");
    try {
      const json = await deleteCategory(category.id);

      toast.dismiss();
      if (!json.success) {
        toast.error(json?.message || "Failed to delete category");
        return;
      }

      toast.success(json?.message || "Category deleted");
      await onDeleted?.();
      setOpen(false);
    } catch (e: unknown) {
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : "Failed to delete category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete category?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2" asChild>
            <div className="space-y-2">
              <p>
                This will soft-delete <span className="font-semibold text-slate-800">{category.name}</span>.
              </p>
              <p className="text-red-500 font-medium text-xs bg-red-50 border border-red-150 p-2.5 rounded-lg">
                ⚠️ Warning: Deleting a parent category will recursively delete all of its sub-categories and their child categories.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            {submitting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

