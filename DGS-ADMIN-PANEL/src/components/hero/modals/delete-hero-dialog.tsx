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
import { HeroSection } from "@/types/hero";
import { deleteHero } from "@/services/hero/hero.service";

interface Props {
  hero: HeroSection;
  onDeleted?: () => void | Promise<void>;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export default function DeleteHeroDialog({
  hero,
  onDeleted,
  trigger,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    const loadingId = toast.loading("Deleting hero section...");
    try {
      const res = await deleteHero(hero.id);

      if (res.success) {
        toast.success(res.message || "Hero section deleted", { id: loadingId });
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
          <AlertDialogTitle className="text-xl font-bold">Delete Hero Section</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Are you sure you want to delete <span className="font-bold text-slate-900">&quot;{hero.headline || "Untitled"}&quot;</span>? This will permanently remove all associated media assets and homepage content.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={deleting} className="border-slate-200">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {deleting ? "Deleting Assets..." : "Confirm Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
