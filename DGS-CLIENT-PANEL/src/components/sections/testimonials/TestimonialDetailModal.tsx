import React from "react";
import { Star, X, ZoomIn, Building, ShieldCheck } from "lucide-react";
import type { Testimonial } from "@/types/testimonial";

interface TestimonialDetailModalProps {
  testimonial: Testimonial;
  onClose: () => void;
  onZoomImage: (imageUrl: string) => void;
}

export default function TestimonialDetailModal({
  testimonial,
  onClose,
  onZoomImage,
}: TestimonialDetailModalProps) {
  const imageUrl = testimonial.image_url || testimonial.avatar_url;
  const displayName = testimonial.customer_name || testimonial.author_name || "Valued Client";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 md:p-8 relative shadow-2xl space-y-6 transform scale-100 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
          aria-label="Close details"
        >
          <X size={20} />
        </button>

        {/* Header info */}
        <div className="flex items-start justify-between gap-4 pr-8">
          <div className="space-y-1">
            <span className="text-slate-900 font-bold text-lg md:text-xl block leading-tight">
              {displayName}
            </span>
            {(testimonial.author_role || testimonial.author_company) && (
              <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Building size={13} className="text-primary shrink-0" />
                <span>
                  {testimonial.author_role}
                  {testimonial.author_role && testimonial.author_company && " • "}
                  {testimonial.author_company}
                </span>
              </span>
            )}
            <div className="flex items-center gap-1.5 pt-0.5">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                Verified Client Project
              </span>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-medium shrink-0 pt-1">
            {new Date(testimonial.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={18}
              className={`${
                i < testimonial.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-200"
              }`}
            />
          ))}
          <span className="text-xs font-bold text-slate-600 ml-2">
            {testimonial.rating}.0 / 5.0
          </span>
        </div>

        {/* Detailed Content */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          <p className="text-slate-700 text-sm md:text-base font-normal leading-relaxed break-words italic">
            &ldquo;{testimonial.content}&rdquo;
          </p>
        </div>

        {/* Attached Image inside Modal */}
        {imageUrl && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Attached Project Document or Inspection Photo
            </span>
            <div
              onClick={() => onZoomImage(imageUrl)}
              className="relative max-h-56 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-50"
            >
              <img
                src={imageUrl}
                alt="Client testimonial verification"
                className="w-full h-full object-cover max-h-56 group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-4 py-2 bg-black/75 rounded-xl flex items-center gap-2 text-white text-xs font-bold backdrop-blur-xs">
                  <ZoomIn size={14} />
                  <span>Zoom Image</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
