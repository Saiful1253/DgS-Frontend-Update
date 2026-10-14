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
import { BlogPost } from "@/types/blog";
import { deleteBlog } from "@/services/blog/blog.service";

interface Props {
  blog: BlogPost;
  onDeleted?: () => void | Promise<void>;
  trigger?: React.ReactNode;
  redirectPath?: string;
  disabled?: boolean;
}

export default function DeleteBlogDialog({
  blog,
  onDeleted,
  trigger,
  redirectPath,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    const loadingId = toast.loading("Deleting blog post...");
    try {
      const res = await deleteBlog(blog.id);

      if (res.success) {
        toast.success(res.message || "Blog post deleted", { id: loadingId });
        await onDeleted?.();
        setIsOpen(false);
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.refresh();
        }
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
          <AlertDialogTitle className="text-xl font-bold tracking-tight">Delete Blog Post</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Are you sure you want to delete <span className="font-bold text-slate-900">&quot;{blog.title}&quot;</span>? This will permanently remove the content and the featured image from Cloudinary.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={deleting} className=" border-slate-200">Cancel</AlertDialogCancel>
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
