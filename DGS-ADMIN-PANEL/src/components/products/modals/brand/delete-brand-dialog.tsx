"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteBrand } from "@/services/brand.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  brandId: string | number;
  brandName: string;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export default function DeleteBrandDialog({
  brandId,
  brandName,
  trigger,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (submitting) return;
    setSubmitting(true);
    const loadingToast = toast.loading("Deleting brand...");
    try {
      const res = await deleteBrand(brandId);
      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success("Brand deleted successfully");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to delete brand");
      }
    } catch (e: unknown) {
      toast.dismiss(loadingToast);
      toast.error(e instanceof Error ? e.message : "Failed to delete brand");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={disabled ? false : isOpen} onOpenChange={disabled ? undefined : setIsOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {trigger ?? <Button variant="destructive" size="sm" disabled={disabled}>Delete</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Brand</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the brand <strong className="text-foreground">{brandName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline" disabled={submitting}>Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? "Deleting..." : "Delete Brand"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
