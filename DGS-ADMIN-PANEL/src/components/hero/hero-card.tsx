/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import { HeroSection, HeroImageOps } from "@/types/hero";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, ExternalLink, ArrowRight, Phone, Mail } from "lucide-react";
import EditHeroModal from "./modals/edit-hero-modal";
import DeleteHeroDialog from "./modals/delete-hero-dialog";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeroCardProps {
  hero: HeroSection;
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
  const isLoadedRef = useRef(false);
  const prevCurrRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isActive && isLoaded) {
    setIsLoaded(false);
  }

  const posterUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  useEffect(() => {
    isMountedRef.current = true;

    if (!isActive) {
      hasTriggeredRef.current = false;
      isLoadedRef.current = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { }
        playerRef.current = null;
      }
      return () => { isMountedRef.current = false; };
    }

    hasTriggeredRef.current = false;
    isLoadedRef.current = false;
    prevCurrRef.current = 0;
    let loadTimer: NodeJS.Timeout | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let remaskTimer: NodeJS.Timeout | null = null;

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
          cc_load_policy: 0,
          // `cc_load_policy` only means "follow the viewer's own prefs" — a
          // logged-in viewer with captions ON still gets subtitles. Pointing
          // the caption language at a code that does not exist means no track
          // can ever be selected, so no subtitle text is drawn.
          cc_lang_pref: "invalid",
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
              // PLAYING -> hold the poster over the player until YouTube's own
              // chrome (play/pause button, title/caption bar) has faded away.
              try { evt.target.setPlaybackQuality("hd1080"); } catch { }
              // Belt-and-braces: drop the captions modules outright, so a
              // viewer's saved subtitle preference can never draw text.
              try {
                evt.target.unloadModule("captions");
                evt.target.unloadModule("cc");
              } catch { }
              if (loadTimer) clearTimeout(loadTimer);
              loadTimer = setTimeout(() => {
                if (isMountedRef.current) {
                  setIsLoaded(true);
                }
              }, 8000);

              // Monitor playback time to loop or advance slide BEFORE video end-screen
              if (pollInterval) clearInterval(pollInterval);
              pollInterval = setInterval(() => {
                if (!playerRef.current || !isMountedRef.current) return;
                try {
                  const curr = playerRef.current.getCurrentTime();
                  const dur = playerRef.current.getDuration();

                  // Reveal the real video only once the player chrome is gone
                  if (!isLoadedRef.current && dur > 0 && curr >= 3.5) {
                    isLoadedRef.current = true;
                    setIsLoaded(true);
                  }

                  // Loop restart / backward seek -> re-mask, otherwise YouTube
                  // flashes its replay (play/pause) icon over the hero.
                  if (isLoadedRef.current && curr + 0.5 < prevCurrRef.current) {
                    isLoadedRef.current = false;
                    setIsLoaded(false);
                    if (remaskTimer) clearTimeout(remaskTimer);
                    remaskTimer = setTimeout(() => {
                      if (isMountedRef.current) {
                        isLoadedRef.current = true;
                        setIsLoaded(true);
                      }
                    }, 1500);
                  }
                  prevCurrRef.current = curr;

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
              // NOT PLAYING (paused, buffering, ended, unstarted) -> COVER WITH POSTER
              if (loadTimer) clearTimeout(loadTimer);
              if (remaskTimer) clearTimeout(remaskTimer);
              isLoadedRef.current = false;
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
          onApiChange: () => {
            // Fired once the player loads/unloads its modules — the reliable
            // moment to strip captions for good.
            if (!playerRef.current || !isMountedRef.current) return;
            try {
              playerRef.current.unloadModule("captions");
              playerRef.current.unloadModule("cc");
            } catch { }
          },
        },
      });
    });

    return () => {
      isMountedRef.current = false;
      if (loadTimer) clearTimeout(loadTimer);
      if (pollInterval) clearInterval(pollInterval);
      if (remaskTimer) clearTimeout(remaskTimer);
      isLoadedRef.current = false;
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
        className={cn(
          "object-cover z-20 transition-opacity duration-500",
          isLoaded ? "opacity-0" : "opacity-100"
        )}
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
            transform: "translate(-50%, -50%) scale(1.35)",
            width: "max(100%, calc(220px * 16 / 9))",
            aspectRatio: "16 / 9",
          }}
        >
          <div ref={containerRef} className="w-full h-full pointer-events-none [&_iframe]:pointer-events-none" />
        </div>
      )}

      {/* Hover shield — never let the cursor reach the iframe, so YouTube
          chrome (play/pause, title/caption bar) can never appear. */}
      <div className="absolute inset-0 z-10 pointer-events-auto" aria-hidden="true" />
    </div>
  );
}



function resolveCtaAction(label?: string | null, link?: string | null, isPrimary = true) {
  const trimmedLink = (link || "").trim();
  const trimmedLabel = (label || "").trim();
  const lowerLink = trimmedLink.toLowerCase();
  const lowerLabel = trimmedLabel.toLowerCase();

  // WhatsApp detection
  const isWaLink = lowerLink.includes("wa.me") || lowerLink.includes("whatsapp.com") || lowerLink.startsWith("whatsapp:");
  const isWaLabel = lowerLabel.includes("whatsapp");

  if (isWaLink || isWaLabel) {
    let href = trimmedLink;
    if (!lowerLink.startsWith("http")) {
      const digits = (trimmedLink || trimmedLabel).replace(/[^\d+]/g, "").replace(/^\+/, "");
      href = `https://wa.me/${digits || "8801778277178"}`;
    }
    return {
      href,
      isExternal: true,
      icon: (
        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current text-[#25D366] shrink-0" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
        </svg>
      ),
    };
  }

  // Phone number detection
  const isTelLink = lowerLink.startsWith("tel:");
  const isPhoneLink = /^(\+?[\d\s-]{7,18})$/.test(trimmedLink);
  const isPhoneLabel = /^(\+?[\d\s-]{7,18})$/.test(trimmedLabel);

  if (isTelLink || isPhoneLink || (isPhoneLabel && !lowerLink.startsWith("http") && !lowerLink.startsWith("/"))) {
    const digits = (isTelLink ? trimmedLink.replace("tel:", "") : (isPhoneLink ? trimmedLink : trimmedLabel)).replace(/[^\d+]/g, "");
    return {
      href: `tel:${digits}`,
      isExternal: false,
      icon: <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#ff5722] shrink-0" />,
    };
  }

  // Email
  if (lowerLink.startsWith("mailto:") || (lowerLink.includes("@") && !lowerLink.includes("/"))) {
    return {
      href: lowerLink.startsWith("mailto:") ? trimmedLink : `mailto:${trimmedLink || trimmedLabel}`,
      isExternal: false,
      icon: <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-sky-400 shrink-0" />,
    };
  }

  return {
    href: trimmedLink || "#",
    isExternal: trimmedLink.startsWith("http"),
    icon: isPrimary ? <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#ff5722]" />,
  };
}

// ─── Main Hero Card ───────────────────────────────────────────────────────
export default function HeroCard({ hero, onUpdate, onDeleted, cardHeight, onMeasureHeight }: HeroCardProps) {
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
          {/* Top Badge */}
          {hero.badge_text && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#021f36]/90 border border-white/15 w-fit shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5722] shadow-[0_0_6px_#ff5722]" />
              <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-100 truncate max-w-[280px]">
                {hero.badge_text}
              </span>
            </div>
          )}

          {/* 1st Element: Main headline — bold white text with highlight */}
          <h3
            className="font-black text-white leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] break-words"
            style={{ fontSize: "clamp(0.95rem, 2.2vw, 1.55rem)" }}
          >
            {hero.highlight_text && hero.headline?.includes(hero.highlight_text) ? (
              <>
                {hero.headline.split(hero.highlight_text)[0]}
                <span className="text-[#ff5722]">{hero.highlight_text}</span>
                {hero.headline.split(hero.highlight_text).slice(1).join(hero.highlight_text)}
              </>
            ) : (
              hero.headline || "Untitled Hero"
            )}
          </h3>

          {/* 2nd Element: Sub-headline / Intro Text */}
          {hero.sub_headline && (
            <p
              className="text-[9px] sm:text-[10px] font-medium text-slate-200 leading-snug break-words drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] line-clamp-2"
              title={hero.sub_headline}
            >
              {hero.sub_headline}
            </p>
          )}


          {/* 3rd Element: CTA Buttons */}
          {(hero.primary_cta_label || hero.secondary_cta_label) && (
            <div className="flex items-center gap-1.5 sm:gap-2 pt-1 flex-wrap">
              {hero.primary_cta_label && (() => {
                const cta = resolveCtaAction(hero.primary_cta_label, hero.primary_cta_link, true);
                return (
                  <a
                    href={cta.href}
                    target={cta.isExternal ? "_blank" : undefined}
                    rel={cta.isExternal ? "noopener noreferrer" : undefined}
                    onClick={(e) => e.stopPropagation()}
                    title={cta.href}
                    className="inline-flex items-center gap-1 sm:gap-1.5 h-6 sm:h-7 px-2.5 sm:px-3.5 rounded-md bg-[#ff5722] hover:bg-[#e64a19] text-white text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest shadow-md transition-all cursor-pointer"
                  >
                    <span>{hero.primary_cta_label}</span>
                    {cta.icon}
                  </a>
                );
              })()}
              {hero.secondary_cta_label && (() => {
                const cta = resolveCtaAction(hero.secondary_cta_label, hero.secondary_cta_link, false);
                return (
                  <a
                    href={cta.href}
                    target={cta.isExternal ? "_blank" : undefined}
                    rel={cta.isExternal ? "noopener noreferrer" : undefined}
                    onClick={(e) => e.stopPropagation()}
                    title={cta.href}
                    className="inline-flex items-center gap-1 sm:gap-1.5 h-6 sm:h-7 px-2.5 sm:px-3.5 rounded-md bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest shadow-xs transition-all cursor-pointer"
                  >
                    {cta.icon}
                    <span>{hero.secondary_cta_label}</span>
                  </a>
                );
              })()}
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
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-green-400 hover:bg-white/10 rounded-lg">
                <Pencil size={12} />
              </Button>
            }
          />
          <DeleteHeroDialog
            hero={hero}
            onDeleted={onDeleted}
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
