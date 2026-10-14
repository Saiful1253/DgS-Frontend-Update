/* eslint-disable @typescript-eslint/no-explicit-any */
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  deleteBlogCategory,
  deleteBlogAuthor,
} from "@/services/blog/blog.service";

interface Props {
  kind: "category" | "author";
  item: any;
  onDeleted?: () => void | Promise<void>;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export default function DeleteTaxonomyDialog({
  kind,
  item,
  onDeleted,
  trigger,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCategory = kind === "category";
  const label = isCategory ? "Category" : "Author";

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    const loadingId = toast.loading(`Deleting ${label.toLowerCase()}...`);
    try {
      const res = isCategory
        ? await deleteBlogCategory(item.id)
        : await deleteBlogAuthor(item.id);

      if (res.success) {
        toast.success(res.message || `${label} deleted`, { id: loadingId });
        await onDeleted?.();
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to delete", { id: loadingId });
      }
    } catch {
      toast.error("An error occurred while deleting", { id: loadingId });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(v) => !disabled && setIsOpen(v)}>
      <AlertDialogTrigger asChild>
        {trigger && React.isValidElement(trigger) ? React.cloneElement(trigger as any, { disabled }) : trigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-slate-200 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">Delete {label}</AlertDialogTitle>
          <AlertDialogDescription className="text-black">
            Are you sure you want to delete <span className="font-bold">&quot;{item?.name}&quot;</span>? This will permanently remove this {isCategory ? "category" : "contributor profile"} {isCategory ? "from the taxonomy" : "and unlink it from any credited articles"}.
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
            className="bg-red-500 hover:bg-red-600"
          >
            {deleting ? "Deleting..." : "Confirm Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
