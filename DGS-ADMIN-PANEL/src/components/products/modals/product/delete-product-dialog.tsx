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
import { deleteProduct } from "@/services/product.service";

interface Props {
  productId: string | number;
  productName?: string;
  trigger?: React.ReactNode;
  onDeleted?: () => void | Promise<void>;
  onOpenChange?: (open: boolean) => void;
}

export default function DeleteProductDialog({
  productId,
  productName,
  trigger,
  onDeleted,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    toast.loading("Deleting product...");
    try {
      const json = await deleteProduct(productId);

      toast.dismiss();
      if (!json.success) {
        toast.error(json?.message || "Failed to delete product");
        return;
      }

      toast.success(json?.message || "Product deleted");
      await onDeleted?.();
      setOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : "Failed to delete product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <span className="font-medium">{productName ?? "this product"}</span>.
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

