"use client";

import React from "react";
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
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, X } from "lucide-react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  busy: boolean;
  onSaveDraft: () => void | Promise<void>;
  onDiscard: () => void;
}

export default function UnsavedChangesDialog({
  open,
  onOpenChange,
  mode,
  busy,
  onSaveDraft,
  onDiscard,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialogContent className="rounded-2xl border-slate-200 shadow-2xl max-w-md z-[100]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">
            {mode === "create" ? "Save as draft?" : "Unsaved changes"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 text-sm leading-relaxed">
            {mode === "create" ? (
              <>
                Closing now will discard the fields you have filled in. You can save what&apos;s entered so far as a{" "}
                <span className="font-bold text-slate-800">draft</span> instead — draft saves make every field optional.
              </>
            ) : (
              <>
                You have unsaved edits. Save them as a{" "}
                <span className="font-bold text-slate-800">draft</span> (sets this blog post&apos;s status to draft), or discard the changes. If you close now without saving, your edits will be lost.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:justify-between">
              <AlertDialogCancel disabled={busy} onClick={() => onOpenChange(false)}>
                Keep Editing
              </AlertDialogCancel>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDiscard}
                  disabled={busy}
                  className="h-9 px-4 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Discard &amp; Close
                </Button>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    onSaveDraft();
                  }}
                  disabled={busy}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving draft...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5 mr-1.5" />
                      Save as Draft
                    </>
                  )}
                </AlertDialogAction>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
  );
}