/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
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
import { Service } from "@/types/service";
import { deleteService } from "@/services/service/service.service";

interface Props {
  service: Service | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDeleted?: () => void | Promise<void>;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export default function DeleteServiceDialog({
  service,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onDeleted,
  trigger,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setIsOpen = (val: boolean) => {
    if (setControlledOpen) setControlledOpen(val);
    if (!isControlled) setInternalOpen(val);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !service) return null;

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    const loadingId = toast.loading("Removing service...");
    try {
      const res = await deleteService(service.id);

      if (res.success) {
        toast.success(res.message || "Service removed from public site", { id: loadingId });
        await onDeleted?.();
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to remove service", { id: loadingId });
      }
    } catch {
      toast.error("An error occurred while removing service", { id: loadingId });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(v) => !disabled && setIsOpen(v)}>
      {trigger && (
        <AlertDialogTrigger asChild>
          {React.isValidElement(trigger) ? React.cloneElement(trigger as any, { disabled }) : trigger}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent className="rounded-2xl border-slate-200 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            Remove Service
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Are you sure you want to remove <span className="font-bold text-slate-900">&quot;{service.name}&quot;</span>? This service will be removed from the public website and marked soft-deleted.
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
            {deleting ? "Removing..." : "Confirm Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
