/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { deleteWhyChooseUs } from "@/services/why-choose-us/why-choose-us.service";
import type { WhyChooseUs } from "@/types/why-choose-us";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WhyChooseUs | null;
  onSuccess: (deletedId: number) => void;
  activeCount: number;
  requiredActiveCount?: number;
}

export default function DeleteWhyChooseUsDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
  activeCount,
  requiredActiveCount = 3,
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteWhyChooseUs(item.id);
      if (res.success) {
        toast.success(typeof res.message === "string" ? res.message : "Item deleted successfully");
        onOpenChange(false);
        onSuccess(item.id);
      } else {
        toast.error(typeof res.message === "string" ? res.message : "Failed to delete item");
      }
    } catch (err: any) {
      toast.error(typeof err?.message === "string" ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white p-6 rounded-2xl max-w-md shadow-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold text-slate-900">
                Delete Value Proposition
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-500">
                This action will remove the item from the system.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <p className="text-xs font-bold text-slate-800">{item.title}</p>
          <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>
        </div>

        <AlertDialogFooter className="mt-4 flex items-center justify-end gap-2">
          <AlertDialogCancel
            disabled={loading}
            className="text-xs font-semibold rounded-lg"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete Item
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
