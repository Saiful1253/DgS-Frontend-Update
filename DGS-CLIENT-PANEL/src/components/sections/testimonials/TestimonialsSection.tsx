"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Award } from "lucide-react";
import type { Testimonial } from "@/types/testimonial";
import { getFeaturedTestimonialsAction } from "@/actions/testimonial.actions";
import TestimonialCard from "./TestimonialCard";
import TestimonialDetailModal from "./TestimonialDetailModal";
import LightboxModal from "./LightboxModal";
import { cn } from "@/lib/utils";

interface TestimonialsSectionProps {
  initialTestimonials?: Testimonial[];
}

export default function TestimonialsSection({
  initialTestimonials = [],
}: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [loading, setLoading] = useState(initialTestimonials.length === 0);
  const [activeTestimonial, setActiveTestimonial] = useState<Testimonial | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);
  const targetScrollPosRef = useRef(0);

  const loadTestimonials = async () => {
    try {
      const res = await getFeaturedTestimonialsAction();
      if (res.success && Array.isArray(res.data)) {
        setTestimonials(res.data);
      }
    } catch (err) {
      console.error("Failed to load featured testimonials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTestimonials.length === 0) {
      loadTestimonials();
    } else {
      setLoading(false);
    }
  }, []);

  // Marquee auto-scroll loop with smooth lerp damping
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || loading || testimonials.length <= 1) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    scrollPosRef.current = scrollContainer.scrollLeft;
    targetScrollPosRef.current = scrollContainer.scrollLeft;

    const step = (time: number) => {
      if (scrollContainer) {
        const delta = (time - lastTime) / 1000;

        // Pause scrolling if modal is open or container is hovered
        if (!isHovered && !activeTestimonial) {
          const speed = 25; // Speed in pixels per second
          targetScrollPosRef.current += speed * delta;
        }

        // Interpolate current scroll position towards the target (lerp)
        const diff = targetScrollPosRef.current - scrollPosRef.current;
        scrollPosRef.current += diff * 0.1; // damping speed

        // Loop boundaries reset
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        if (targetScrollPosRef.current >= maxScroll - 1) {
          targetScrollPosRef.current = 0;
          scrollPosRef.current = 0;
        } else if (targetScrollPosRef.current < 0) {
          targetScrollPosRef.current = 0;
          scrollPosRef.current = 0;
        }

        scrollContainer.style.scrollBehavior = "auto";
        scrollContainer.scrollLeft = Math.round(scrollPosRef.current);
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovered, activeTestimonial, loading, testimonials]);

  // Button scroll handlers
  const scrollPrev = () => {
    if (!scrollRef.current) return;
    targetScrollPosRef.current -= 380;
  };

  const scrollNext = () => {
    if (!scrollRef.current) return;
    targetScrollPosRef.current += 380;
  };

  const isSingle = testimonials.length === 1;
  const repeatedTestimonials =
    testimonials.length === 0
      ? []
      : isSingle
      ? testimonials
      : testimonials.length < 5
      ? [...testimonials, ...testimonials, ...testimonials]
      : [...testimonials, ...testimonials];

  return (
    <section
      id="testimonials"
      className="py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-slate-200/60 relative overflow-hidden"
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 mb-14 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-mist/60 text-primary border border-primary/20 text-xs uppercase tracking-widest font-bold mb-4">
          <Award size={14} />
          <span>Client Social Proof</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Trusted by Industry Leaders
        </h2>
        <p className="text-slate-600 text-sm md:text-base font-medium max-w-2xl mx-auto">
          From high-rise residential towers and commercial hotel kitchens to national industrial food plants, explore feedback from clients who trust DGS for safety and engineering excellence.
        </p>
      </div>

      {/* Marquee Carousel Strip */}
      {loading ? (
        <div className="w-full bg-slate-100/50 border-y border-slate-200/60 py-8 select-none mb-20 relative">
          <div className="flex gap-6 overflow-x-auto scrollbar-none py-2 px-8 md:px-24 select-none">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-[300px] md:w-[360px] bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-[190px] animate-pulse"
              >
                <div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 bg-slate-200 rounded-full"
                      />
                    ))}
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-5/6 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <div className="h-3 bg-slate-200 rounded w-28" />
                    <div className="h-2.5 bg-slate-100 rounded w-20" />
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : testimonials.length > 0 ? (
        <div className="w-full bg-slate-100/40 border-y border-slate-200/60 py-8 select-none mb-20 relative">
          {/* Edge Fades (only when looping) */}
          {!isSingle && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
            </>
          )}

          {/* Marquee Drag/Auto-Scroll Container */}
          <div
            ref={scrollRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "flex gap-6 py-2 px-8 md:px-24 select-none",
              isSingle
                ? "justify-center overflow-x-auto"
                : "overflow-x-hidden scrollbar-none"
            )}
          >
            {repeatedTestimonials.map((item, idx) => (
              <TestimonialCard
                key={`${item.id}-${idx}`}
                testimonial={item}
                onClick={() => setActiveTestimonial(item)}
              />
            ))}
          </div>

          {/* Navigation Prev/Next Controls (only when multiple items) */}
          {!isSingle && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={scrollPrev}
                className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-primary transition-all active:scale-95 shadow-sm cursor-pointer"
                aria-label="Previous testimonials"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-primary transition-all active:scale-95 shadow-sm cursor-pointer"
                aria-label="Next testimonials"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Modal Level 1: Review details */}
      {activeTestimonial && (
        <TestimonialDetailModal
          testimonial={activeTestimonial}
          onClose={() => setActiveTestimonial(null)}
          onZoomImage={(imgUrl) => setLightboxImage(imgUrl)}
        />
      )}

      {/* Modal Level 2: Full photo lightbox */}
      {lightboxImage && (
        <LightboxModal
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </section>
  );
}
