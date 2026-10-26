"use client";

import * as React from "react";
import type { Testimonial } from "@/types/testimonial";
import { Button } from "@/components/ui/button";
import {
  Check,
  Ban,
  Star,
  StarOff,
  FileText,
  Camera,
  X,
  Quote,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Rating } from "@smastrom/react-rating";
import EditTestimonialModal from "./edit-testimonial-modal";
import DeleteTestimonialDialog from "./delete-testimonial-dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface TestimonialCardProps {
  testimonial: Testimonial;
  activeTab: "all" | "featured";
  onStatusToggle: (id: number, newStatus: "approved" | "rejected") => Promise<void>;
  onFeaturedToggle: (id: number, currentVal: boolean) => Promise<void>;
  onRefresh: () => void;
}

export function TestimonialCard({
  testimonial,
  activeTab,
  onStatusToggle,
  onFeaturedToggle,
  onRefresh,
}: TestimonialCardProps) {
  const imageUrl = testimonial.image_url || testimonial.avatar_url;

  return (
    <div className="border border-slate-200 rounded-2xl p-5 hover:bg-slate-50/50 hover:border-slate-300 transition-all shadow-xs bg-white flex flex-col md:flex-row md:items-start justify-between gap-6">
      <div className="space-y-4 flex-1">
        {/* Top Details Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                {testimonial.author_name || testimonial.customer_name || "Valued Client"}
              </span>
              {(testimonial.author_role || testimonial.author_company) && (
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  • {testimonial.author_role}
                  {testimonial.author_company && (
                    <span className="text-slate-600 font-semibold">
                      @{testimonial.author_company}
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Rating Stars and Date */}
            <div className="flex items-center gap-2">
              <Rating style={{ maxWidth: 80 }} value={testimonial.rating} readOnly />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {new Date(testimonial.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Badges: Status, Type, Source, Featured */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status badge */}
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                testimonial.status === "approved" &&
                  "bg-emerald-50 text-emerald-700 border-emerald-200",
                testimonial.status === "pending" &&
                  "bg-amber-50 text-amber-700 border-amber-200",
                testimonial.status === "rejected" &&
                  "bg-red-50 text-red-700 border-red-200"
              )}
            >
              {testimonial.status}
            </span>

            {/* Type badge */}
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1",
                testimonial.type === "text"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-purple-50 text-purple-700 border-purple-200"
              )}
            >
              {testimonial.type === "text" ? (
                <FileText className="h-3 w-3" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
              {testimonial.type}
            </span>

            {/* Source */}
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
              {testimonial.source || "admin"}
            </span>

            {/* Featured Badge */}
            {testimonial.is_featured && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Content & Photo side by side */}
        <div className="flex flex-col sm:flex-row gap-4 items-start w-full">
          {imageUrl && (
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="relative w-full sm:w-36 aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-50 group hover:border-slate-400 transition-colors shrink-0 text-left cursor-zoom-in"
                  aria-label="View full size review image"
                >
                  <Image
                    src={imageUrl}
                    alt="Customer feedback image"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </button>
              </DialogTrigger>
              <DialogContent
                showCloseButton={false}
                className="bg-transparent border-none shadow-none p-0 overflow-visible max-w-4xl w-auto flex items-center justify-center"
              >
                <DialogTitle className="sr-only">Review Photo</DialogTitle>
                <div className="relative max-h-[85vh] max-w-[90vw] overflow-visible">
                  <DialogClose className="absolute -top-3 -right-3 z-50 bg-slate-900 hover:bg-slate-800 text-white rounded-full p-1.5 shadow-lg border border-slate-700">
                    <X className="h-4 w-4" />
                  </DialogClose>
                  <img
                    src={imageUrl}
                    alt="Review full size"
                    className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="flex-1 space-y-2">
            <div className="relative pl-6 text-sm text-slate-700 leading-relaxed italic bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <Quote className="w-4 h-4 text-primary/40 absolute left-2 top-3" />
              &ldquo;{testimonial.content}&rdquo;
            </div>
            {testimonial.author_company && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Verified Client: {testimonial.author_company}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Column */}
      <div className="flex flex-col sm:flex-row md:flex-col justify-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-36">
        {/* Approve / Reject buttons */}
        {activeTab === "all" && (
          <div className="flex items-center gap-1.5 w-full">
            {testimonial.status !== "approved" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusToggle(testimonial.id, "approved")}
                className="flex-1 h-8 px-2 text-[11px] font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 gap-1"
                title="Approve Testimonial"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
              </Button>
            )}
            {testimonial.status !== "rejected" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusToggle(testimonial.id, "rejected")}
                className="flex-1 h-8 px-2 text-[11px] font-bold border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 gap-1"
                title="Reject Testimonial"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Reject</span>
              </Button>
            )}
          </div>
        )}

        {/* Feature / Unfeature Button */}
        <Button
          size="sm"
          variant="outline"
          disabled={!testimonial.is_featured && testimonial.status === "rejected"}
          onClick={() => {
            if (!testimonial.is_featured && testimonial.status === "rejected") return;
            onFeaturedToggle(testimonial.id, testimonial.is_featured);
          }}
          className={cn(
            "h-8 px-2.5 text-xs font-semibold gap-1.5 border-slate-200 w-full",
            testimonial.is_featured
              ? "text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
              : testimonial.status === "rejected"
              ? "text-slate-400 bg-slate-50 cursor-not-allowed opacity-60"
              : "text-slate-600 hover:bg-slate-100"
          )}
          title={testimonial.status === "rejected" ? "Rejected testimonials cannot be featured" : undefined}
        >
          {testimonial.is_featured ? (
            <>
              <StarOff className="w-3.5 h-3.5" />
              <span>Unfeature</span>
            </>
          ) : (
            <>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>Feature</span>
            </>
          )}
        </Button>

        {/* Edit and Delete Modals */}
        <div className="flex items-center gap-1.5 w-full">
          <EditTestimonialModal
            testimonial={testimonial}
            onUpdated={onRefresh}
            trigger={
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 px-2 text-xs font-semibold border-slate-200 hover:bg-slate-100"
              >
                Edit
              </Button>
            }
          />
          <DeleteTestimonialDialog
            testimonial={testimonial}
            onDeleted={onRefresh}
            trigger={
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 px-2 text-xs font-semibold border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200"
              >
                Delete
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
