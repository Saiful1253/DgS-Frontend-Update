import React from "react";
import { Star, Eye, Building } from "lucide-react";
import type { Testimonial } from "@/types/testimonial";

interface TestimonialCardProps {
  testimonial: Testimonial;
  onClick: () => void;
}

export default function TestimonialCard({ testimonial, onClick }: TestimonialCardProps) {
  const imageUrl = testimonial.image_url || testimonial.avatar_url;
  const displayName = testimonial.customer_name || testimonial.author_name || "Valued Client";

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-[300px] md:w-[360px] bg-white border border-slate-200/90 rounded-2xl p-6 hover:border-primary/60 hover:shadow-[0_12px_40px_rgba(0,102,138,0.08)] transition-all duration-300 cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Rating Stars */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={15}
              className={`${
                i < testimonial.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Testimonial Quote */}
        <p className="text-slate-700 text-sm font-medium leading-relaxed mb-5 line-clamp-3">
          &ldquo;{testimonial.content}&rdquo;
        </p>
      </div>

      {/* Reviewer Meta */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
        <div className="flex flex-col pr-2">
          <span className="text-slate-900 text-xs font-bold leading-tight">
            {displayName}
          </span>
          {testimonial.author_company ? (
            <span className="text-[10px] text-primary font-semibold flex items-center gap-1 mt-0.5">
              <Building size={10} className="shrink-0" />
              <span className="truncate max-w-[190px]">{testimonial.author_company}</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              Verified Client
            </span>
          )}
        </div>

        {imageUrl && (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 group-hover:border-primary/40 transition-colors shrink-0">
            <img
              src={imageUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye size={14} className="text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
