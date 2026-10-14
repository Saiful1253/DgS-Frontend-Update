"use client";

import React from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  url: string;
  title: string;
  className?: string;
  variant?: "icon" | "button";
}

export function ShareButton({ url, title, className, variant = "icon" }: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title,
      url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  if (variant === "button") {
    return (
      <button
        onClick={handleShare}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-accent-light",
          className
        )}
      >
        <Share2 className="size-4" />
        <span>Share</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-brand-accent-light hover:text-black",
        className
      )}
      aria-label="Share"
      title="Share"
    >
      <Share2 className="size-4" />
    </button>
  );
}
