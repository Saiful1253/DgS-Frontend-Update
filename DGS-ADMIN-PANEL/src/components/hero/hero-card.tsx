/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import { HeroSection, HeroImageOps } from "@/types/hero";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, ExternalLink, ArrowRight } from "lucide-react";
import EditHeroModal from "./modals/edit-hero-modal";
import DeleteHeroDialog from "./modals/delete-hero-dialog";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeroCardProps {
  hero: HeroSection;
  hasManageAccess: boolean;
  onUpdate: (id: string | number, data: any, ops: HeroImageOps) => Promise<boolean>;
  onDeleted?: () => void | Promise<void>;
  cardHeight?: number;
  onMeasureHeight?: (id: string | number, height: number) => void;
}

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,12})/);
  return m ? m[1] : null;
};

// ─── YouTube SDK Loader ───────────────────────────────────────────────────
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).YT && (window as any).YT.Player) {
    return Promise.resolve();
  }
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const existing = document.getElementById("yt-iframe-api");
      if (existing) {
        // If script element exists, wait for API
        const check = setInterval(() => {
          if ((window as any).YT && (window as any).YT.Player) {
            clearInterval(check);
            resolve();
          }
        }, 50);
        return;
      }
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      (window as any).onYouTubeIframeAPIReady = () => resolve();
      document.head.appendChild(tag);
    });
  }
  return ytApiPromise;
}

// ─── YouTube iframe sub-component ─────────────────────────────────────────
function YouTubeSlide({
  videoId,
  isActive,
  loop,
  onEnded,
}: {
  videoId: string;
  isActive: boolean;
  loop: boolean;
  onEnded: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isMountedRef = useRef(false);
  const hasTriggeredRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const posterUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  useEffect(() => {
    isMountedRef.current = true;

    if (!isActive) {
      setIsLoaded(false);
      hasTriggeredRef.current = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { }
        playerRef.current = null;
      }
      return () => { isMountedRef.current = false; };
    }

    hasTriggeredRef.current = false;
    let loadTimer: NodeJS.Timeout | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    loadYouTubeApi().then(() => {
      if (!isMountedRef.current || !containerRef.current) return;

      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { }
        playerRef.current = null;
      }

      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          showinfo: 0,
          autohide: 1,
          // DO NOT set `playlist` parameter — playlist mode renders |◀ || ▶| overlay controls!
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (evt: any) => {
            if (!isMountedRef.current) return;
            try {
              evt.target.mute();
              evt.target.setPlaybackQuality("hd1080");
              evt.target.playVideo();
            } catch { }
          },
          onStateChange: (evt: any) => {
            if (!isMountedRef.current) return;

            if (evt.data === 1) {
              // PLAYING -> delay 1000ms then reveal clean video
              try { evt.target.setPlaybackQuality("hd1080"); } catch { }
              if (loadTimer) clearTimeout(loadTimer);
              loadTimer = setTimeout(() => {
                if (isMountedRef.current) {
                  setIsLoaded(true);
                }
              }, 1000);

              // Monitor playback time to loop or advance slide BEFORE video end-screen
              if (pollInterval) clearInterval(pollInterval);
              pollInterval = setInterval(() => {
                if (!playerRef.current || !isMountedRef.current) return;
                try {
                  const curr = playerRef.current.getCurrentTime();
                  const dur = playerRef.current.getDuration();
                  if (dur > 0 && curr >= dur - 0.4) {
                    if (loop) {
                      playerRef.current.seekTo(0, true);
                    } else if (!hasTriggeredRef.current) {
                      hasTriggeredRef.current = true;
                      clearInterval(pollInterval!);
                      onEnded();
                    }
                  }
                } catch { }
              }, 100);
            } else {
              // NOT PLAYING (paused, buffering, ended, unstarted) -> INSTANTLY HIDE IFRAME
              if (loadTimer) clearTimeout(loadTimer);
              setIsLoaded(false);

              if (evt.data === 2 || evt.data === -1 || evt.data === 5) {
                try { evt.target.playVideo(); } catch { }
              } else if (evt.data === 0) {
                if (loop) {
                  try { evt.target.seekTo(0, true); evt.target.playVideo(); } catch { }
                } else if (!hasTriggeredRef.current) {
                  hasTriggeredRef.current = true;
                  onEnded();
                }
              }
            }
          },
        },
      });
    });

    return () => {
      isMountedRef.current = false;
      if (loadTimer) clearTimeout(loadTimer);
      if (pollInterval) clearInterval(pollInterval);
      setIsLoaded(false);
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { }
        playerRef.current = null;
      }
    };
  }, [isActive, videoId, loop, onEnded]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none pointer-events-none">
      {/* High-res poster backdrop */}
      <Image
        src={posterUrl}
        alt="Video poster"
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
        priority={isActive}
      />

      {/* Embedded player via youtube-nocookie.com */}
      {isActive && (
        <div
          className={cn(
            "absolute pointer-events-none transition-opacity duration-500",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "max(100%, calc(220px * 16 / 9))",
            aspectRatio: "16 / 9",
          }}
        >
          <div ref={containerRef} className="w-full h-full" />
        </div>
      )}
    </div>
  );
}



// ─── Main Hero Card ───────────────────────────────────────────────────────
export default function HeroCard({ hero, hasManageAccess, onUpdate, onDeleted, cardHeight, onMeasureHeight }: HeroCardProps) {
  const swiperRef = useRef<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const sortedMedia = [...(hero.media || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((m) => m.is_active);

  const mediaCount = sortedMedia.length;
  const currentIsVideo = mediaCount > 0 && sortedMedia[activeIdx]?.media_type === "youtube";

  // Manage swiper autoplay: pause for video slides, run for image slides
  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    if (currentIsVideo) swiper.autoplay?.stop();
    else swiper.autoplay?.start();
  }, [currentIsVideo]);

  // Measure content height to auto-adjust card height dynamically
  useEffect(() => {
    if (!contentRef.current) return;
    const measure = () => {
      if (!contentRef.current) return;
      const contentHeight = contentRef.current.scrollHeight;
      // 64px padding buffer accounts for vertical margins and the bottom asset badge
      const neededHeight = Math.max(230, contentHeight + 64);
      onMeasureHeight?.(hero.id, neededHeight);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [hero, onMeasureHeight]);

  useEffect(() => {
    swiperRef.current?.update();
  }, [cardHeight]);

  const handleVideoEnded = useCallback(() => {
    swiperRef.current?.slideNext();
  }, []);

  const handleSlideChange = useCallback((swiper: any) => {
    const idx = swiper.realIndex ?? swiper.activeIndex;
    setActiveIdx(idx);
    const isVid = sortedMedia[idx]?.media_type === "youtube";
    if (isVid) swiper.autoplay?.stop();
    else swiper.autoplay?.start();
  }, [sortedMedia]);

  const handleStatusChange = async (
    e: React.MouseEvent,
    newStatus: "active" | "inactive" | "draft"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (newStatus === hero.status) return;
    await onUpdate(hero.id, { status: newStatus }, {
      imagesToDelete: [], imagesToReplace: [], imagesToAdd: [], videosToAdd: [], newOrder: [],
    });
  };

  return (
    <div
      className="group relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 bg-zinc-950"
      style={{ height: cardHeight ? `${cardHeight}px` : "240px", minHeight: "230px" }}
    >
      {/* ── LAYER 0: Full-bleed media background ─────────────────────── */}
      <div className="absolute inset-0 z-0">
        {sortedMedia.length === 0 ? (
          /* No media: cerulean gradient fallback */
          <div className="absolute inset-0 bg-gradient-to-br from-[#002b3d] via-[#005f73] to-[#0a9396]" />
        ) : (
          <Swiper
            modules={[EffectFade, Autoplay]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            loop={mediaCount > 1}
            speed={1200}
            slidesPerView={1}
            allowTouchMove={false}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              const firstIsVideo = sortedMedia[0]?.media_type === "youtube";
              if (firstIsVideo) swiper.autoplay?.stop();
              else swiper.autoplay?.start();
            }}
            onSlideChange={handleSlideChange}
            onRealIndexChange={handleSlideChange}
            className="h-full w-full"
          >
            {sortedMedia.map((media, i) => {
              const ytId = media.media_type === "youtube" ? getYouTubeId(media.media_url) : null;
              return (
                <SwiperSlide key={`${media.id ?? i}`} className="h-full w-full relative overflow-hidden">
                  {media.media_type === "youtube" && ytId ? (
                    <div className="absolute inset-0 overflow-hidden">
                      <YouTubeSlide
                        videoId={ytId}
                        isActive={i === activeIdx}
                        loop={mediaCount === 1}
                        onEnded={handleVideoEnded}
                      />
                    </div>
                  ) : (
                    <Image
                      src={media.media_url}
                      alt={hero.headline || "Hero"}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={i === 0}
                    />
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </div>

      {/* ── LAYER 1: Dark Gradient Scrim — ensures text readability ─── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* ── LAYER 2: Text content — left-aligned with responsive max-width ── */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div
          ref={contentRef}
          className="flex flex-col justify-center px-4 sm:px-7 py-4 sm:py-5 space-y-2 w-full pt-12 sm:pt-5 sm:max-w-[calc(100%-260px)]"
        >
          {/* 1st Element: Main headline — bold white text */}
          <h3
            className="font-black text-white leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] break-words"
            style={{ fontSize: "clamp(0.95rem, 2.2vw, 1.55rem)" }}
          >
            {hero.headline || "Untitled Hero"}
          </h3>

          {/* 2nd Element: Sub-headline / Intro Text — cerulean uppercase */}
          {hero.sub_headline && (
            <p
              className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7dd3fc] leading-snug break-words drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] line-clamp-3 sm:line-clamp-none"
              title={hero.sub_headline}
            >
              {hero.sub_headline}
            </p>
          )}

          {/* 3rd Element: CTA Buttons — solid primary + dark translucent outline */}
          {(hero.primary_cta_label || hero.secondary_cta_label) && (
            <div className="flex items-center gap-1.5 sm:gap-2 pt-1 flex-wrap">
              {hero.primary_cta_label && (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 h-6 sm:h-7 px-2.5 sm:px-3.5 rounded-md bg-[#00668a] hover:bg-[#004c69] text-white text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest shadow-md cursor-default transition-all">
                  {hero.primary_cta_label}
                  <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </span>
              )}
              {hero.secondary_cta_label && (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 h-6 sm:h-7 px-2.5 sm:px-3.5 rounded-md bg-[#121d24]/90 border border-white/20 text-white text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-sm cursor-default transition-all">
                  {hero.secondary_cta_label}
                  <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── LAYER 3: Admin Controls — top-right ──────────────────────── */}
      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-30 flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end max-w-[calc(100%-1rem)]">
        {/* Status pills */}
        <div
          className="flex items-center gap-0.5 bg-[#121c23]/95 backdrop-blur-md p-0.5 sm:p-1 rounded-full border border-white/15 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {(["draft", "inactive", "active"] as const).map((s) => (
            <button
              key={s}
              onClick={(e) => handleStatusChange(e, s)}
              disabled={!hasManageAccess}
              title={s === "active" ? "Active (exclusive)" : s.charAt(0).toUpperCase() + s.slice(1)}
              className={cn(
                "px-1.5 sm:px-2.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-extrabold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                hero.status === s
                  ? s === "active"
                    ? "bg-[#10b981] text-white shadow-sm"
                    : s === "inactive"
                      ? "bg-[#ff9800] text-white shadow-sm"
                      : "bg-slate-500 text-white shadow-sm"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              {s === "active" ? "Active" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Edit / Delete buttons */}
        <div className="bg-[#121c23]/90 backdrop-blur-md p-1 rounded-xl border border-white/15 flex gap-0.5 shadow-lg">
          <EditHeroModal
            hero={hero}
            onSave={(data, ops) => onUpdate(hero.id, data, ops)}
            disabled={!hasManageAccess}
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-green-400 hover:bg-white/10 rounded-lg">
                <Pencil size={12} />
              </Button>
            }
          />
          <DeleteHeroDialog
            hero={hero}
            onDeleted={onDeleted}
            disabled={!hasManageAccess}
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-red-400 hover:bg-white/10 rounded-lg">
                <Trash2 size={12} />
              </Button>
            }
          />
        </div>
      </div>

      {/* ── Asset count bottom-left ───────────────────────────────────── */}
      {mediaCount > 0 && (
        <div className="absolute bottom-3 left-3.5 z-30 bg-[#121c23]/80 backdrop-blur-sm px-2.5 py-1 rounded text-white/70 text-[8px] font-extrabold uppercase tracking-widest border border-white/10">
          {mediaCount} {mediaCount === 1 ? "Asset" : "Assets"}
        </div>
      )}
    </div>
  );
}
