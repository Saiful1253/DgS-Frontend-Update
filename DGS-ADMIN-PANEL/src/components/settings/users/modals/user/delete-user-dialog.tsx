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
import { Trash2 } from "lucide-react";
import { deleteAdminUser } from "@/services/admin/user.service";

interface Props {
  userId: string | number;
  userName?: string;
  disabled?: boolean;
}

export default function DeleteUserDialog({ userId, userName, disabled = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    toast.loading("Deleting user account...");
    try {
      const res = await deleteAdminUser(userId);

      toast.dismiss();
      if (!res.success) {
        toast.error(res.message || "Failed to delete user");
        return;
      }

      toast.success(res.message || "User account deleted");
      setOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          disabled={disabled}
        >
          <Trash2 size={14} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="uppercase font-bold tracking-tight text-red-600">Delete user account?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            This will permanently delete the account for <span className="font-bold text-gray-900">{userName}</span>.
            The user will lose all access to the system immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={submitting}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
            className="ml-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {submitting ? "Deleting..." : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
