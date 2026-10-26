"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Testimonial } from "@/types/testimonial";
import { deleteTestimonialAction } from "@/actions/testimonial.actions";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Loader2, Star } from "lucide-react";

interface Props {
  testimonial: Testimonial;
  onDeleted?: () => void;
  trigger?: React.ReactNode;
}

export default function DeleteTestimonialDialog({ testimonial, onDeleted, trigger }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    const loadingToast = toast.loading("Deleting testimonial...");

    try {
      const res = await deleteTestimonialAction(testimonial.id);
      toast.dismiss(loadingToast);

      if (!res.success) {
        toast.error(res.message || "Failed to delete testimonial");
        return;
      }

      toast.success("Testimonial deleted successfully");
      onDeleted?.();
      setIsOpen(false);
    } catch (e: unknown) {
      toast.dismiss(loadingToast);
      toast.error(e instanceof Error ? e.message : "Failed to delete testimonial");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-2xl border border-slate-200">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600 shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold text-slate-900">
                Delete Client Testimonial
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-500 pt-0.5">
                This action cannot be undone and will permanently remove this review from the public storefront and database.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Testimonial Summary Card */}
        <div className="my-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              {testimonial.author_name || "Valued Client"}
            </span>
            <div className="flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>

          {(testimonial.author_role || testimonial.author_company) && (
            <p className="text-[11px] text-slate-500 font-medium">
              {[testimonial.author_role, testimonial.author_company].filter(Boolean).join(" @ ")}
            </p>
          )}

          {testimonial.content && (
            <p className="text-xs text-slate-600 italic line-clamp-2 pt-0.5 border-t border-slate-200/60">
              &ldquo;{testimonial.content}&rdquo;
            </p>
          )}
        </div>

        <AlertDialogFooter className="mt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
          <AlertDialogCancel
            disabled={deleting}
            className="text-xs font-semibold h-9 px-4 rounded-lg border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-bold h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs gap-1.5 cursor-pointer"
          >
            {deleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                <span>Delete Testimonial</span>
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
