"use client";

import { useMemo, useState, useSyncExternalStore, useRef, useEffect, useCallback } from "react";
import { ExternalLink, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "../../ui/button";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import Image from "next/image";
import { useSiteConfig } from "@/context/SiteConfigContext";
import type { Swiper as SwiperType } from "swiper";
import type { HeroSection, HeroMedia } from "@/types/cms/cms";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

interface HeroProps {
  activeHero: HeroSection | null;
}

const emptySubscribe = () => () => { };

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,12})/);
  return m ? m[1] : null;
};

// ─── YouTube SDK types ────────────────────────────────────────────────────
type YTPlayer = {
  destroy: () => void;
  mute: () => void;
  playVideo: () => void;
  setPlaybackQuality: (quality: string) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
};
type YTPlayerEvent = { target: YTPlayer; data: number };
type YTNamespace = { Player: new (el: HTMLElement, opts: unknown) => YTPlayer };
type WindowWithYT = Window & {
  YT?: YTNamespace;
  onYouTubeIframeAPIReady?: () => void;
};

// ─── YouTube SDK Loader ───────────────────────────────────────────────────
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as WindowWithYT).YT?.Player) {
    return Promise.resolve();
  }
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const existing = document.getElementById("yt-iframe-api");
      if (existing) {
        const check = setInterval(() => {
          if ((window as WindowWithYT).YT?.Player) {
            clearInterval(check);
            resolve();
          }
        }, 50);
        return;
      }
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      (window as WindowWithYT).onYouTubeIframeAPIReady = () => resolve();
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
  headline,
  slideIndex,
}: {
  videoId: string;
  isActive: boolean;
  loop: boolean;
  onEnded: () => void;
  headline: string;
  slideIndex: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const isMountedRef = useRef(false);
  const hasTriggeredRef = useRef(false);
  const isLoadedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [prevVideoId, setPrevVideoId] = useState(videoId);

  if (!isActive && isLoaded) {
    setIsLoaded(false);
  }
  if (prevVideoId !== videoId) {
    setPrevVideoId(videoId);
    if (isLoaded) setIsLoaded(false);
  }

  const posterUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  useEffect(() => {
    isMountedRef.current = true;

    if (!isActive) {
      isLoadedRef.current = false;
      hasTriggeredRef.current = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { }
        playerRef.current = null;
      }
      return () => { isMountedRef.current = false; };
    }

    hasTriggeredRef.current = false;
    isLoadedRef.current = false;
    let loadTimer: NodeJS.Timeout | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    loadYouTubeApi().then(() => {
      if (!isMountedRef.current || !containerRef.current) return;

      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { }
        playerRef.current = null;
      }

      playerRef.current = new (window as WindowWithYT).YT!.Player(containerRef.current, {
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
          ...(loop ? { loop: 1, playlist: videoId } : {}),
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (evt: YTPlayerEvent) => {
            if (!isMountedRef.current) return;
            try {
              evt.target.mute();
              evt.target.setPlaybackQuality("hd1080");
              evt.target.playVideo();
            } catch { }
          },
          onStateChange: (evt: YTPlayerEvent) => {
            if (!isMountedRef.current) return;

            if (evt.data === 1) {
              try { evt.target.setPlaybackQuality("hd1080"); } catch { }
              if (loadTimer) clearTimeout(loadTimer);
              loadTimer = setTimeout(() => {
                if (isMountedRef.current) setIsLoaded(true);
              }, 8000);

              if (pollInterval) clearInterval(pollInterval);
              pollInterval = setInterval(() => {
                if (!playerRef.current || !isMountedRef.current) return;
                try {
                  const curr = playerRef.current.getCurrentTime();
                  const dur = playerRef.current.getDuration();

                  if (!isLoadedRef.current && dur > 0 && curr >= 3.5) {
                    isLoadedRef.current = true;
                    setIsLoaded(true);
                  }

                  if (!loop && dur > 0 && curr >= dur - 0.4 && !hasTriggeredRef.current) {
                    hasTriggeredRef.current = true;
                    clearInterval(pollInterval!);
                    onEnded();
                  }
                } catch { }
              }, 100);
            } else {
              if (loadTimer) clearTimeout(loadTimer);
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
        },
      });
    });

    return () => {
      isMountedRef.current = false;
      if (loadTimer) clearTimeout(loadTimer);
      if (pollInterval) clearInterval(pollInterval);
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
      {isActive && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "max(100vw, calc(100vh * 16 / 9))",
            aspectRatio: "16 / 9",
          }}
        >
          <div ref={containerRef} className="w-full h-full" />
        </div>
      )}

      {isActive && (
        <div
          className={`absolute pointer-events-none transition-opacity duration-500 ${isLoaded ? "opacity-0" : "opacity-100"
            }`}
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "max(100vw, calc(100vh * 16 / 9))",
            aspectRatio: "16 / 9",
          }}
        >
          <Image
            src={posterUrl}
            alt={`${headline} video poster ${slideIndex + 1}`}
            fill
            sizes="100vw"
            priority={isActive}
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
}

// ─── Glossy 3D "M" Graphic matching mockup media_1789970002288.png ─────────────
function Milanova3DGraphic() {
  return (
    <div className="relative w-full max-w-[360px] sm:max-w-[440px] lg:max-w-[500px] aspect-square flex items-center justify-center pointer-events-none drop-shadow-2xl">
      <div className="absolute inset-4 rounded-full bg-[#38bdf8]/25 blur-3xl pointer-events-none" />

      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transform hover:scale-[1.02] transition-transform duration-700 relative z-10"
      >
        <defs>
          <linearGradient id="m3d-body" x1="60" y1="60" x2="440" y2="440" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8cdcfb" />
            <stop offset="25%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#007799" />
            <stop offset="100%" stopColor="#004558" />
          </linearGradient>

          <linearGradient id="m3d-left-leg" x1="100" y1="100" x2="170" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7ad5f9" />
            <stop offset="50%" stopColor="#007799" />
            <stop offset="100%" stopColor="#004558" />
          </linearGradient>

          <linearGradient id="m3d-right-leg" x1="370" y1="130" x2="440" y2="430" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="55%" stopColor="#00627c" />
            <stop offset="100%" stopColor="#003747" />
          </linearGradient>

          <linearGradient id="m3d-center-arch" x1="170" y1="110" x2="350" y2="310" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e2f5fc" />
            <stop offset="35%" stopColor="#38bdf8" />
            <stop offset="85%" stopColor="#00627c" />
          </linearGradient>

          <filter id="m3d-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="22" stdDeviation="18" floodColor="#004558" floodOpacity="0.28" />
          </filter>
        </defs>

        <g filter="url(#m3d-shadow)">
          <path
            d="M 390 140 A 55 55 0 0 1 445 195 L 445 370 A 55 55 0 0 1 335 370 L 335 240 Z"
            fill="url(#m3d-right-leg)"
          />
          <path
            d="M 110 195 C 110 130, 160 110, 220 160 L 290 220 C 330 255, 380 230, 390 180 L 390 350 A 55 55 0 0 1 280 350 L 280 270 L 210 210 C 185 190, 165 200, 165 225 L 165 370 A 55 55 0 0 1 55 370 L 55 195 A 55 55 0 0 1 110 195 Z"
            fill="url(#m3d-body)"
          />
          <path
            d="M 165 195 C 165 140, 230 130, 280 185 L 340 240 C 375 270, 445 220, 445 195 A 55 55 0 0 0 335 195 L 265 135 C 210 90, 110 120, 110 195 Z"
            fill="url(#m3d-center-arch)"
            opacity="0.95"
          />
          <path
            d="M 75 195 C 75 160, 100 135, 135 135 C 170 135, 210 160, 245 190"
            stroke="#ffffff"
            strokeWidth="11"
            strokeLinecap="round"
            opacity="0.45"
          />
        </g>
      </svg>
    </div>
  );
}

export default function Hero({ activeHero }: HeroProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const swiperRef = useRef<SwiperType | null>(null);
  const siteConfig = useSiteConfig();
  const [activeIdx, setActiveIdx] = useState(0);

  const headline = activeHero?.headline || siteConfig.company_name || "Digital Futures That Drive Impact";
  const subHeadline = activeHero?.sub_headline || "";
  const primaryCtaLabel = activeHero?.primary_cta_label || "Book a Consultation";
  const primaryCtaLink = activeHero?.primary_cta_link || "#";
  const secondaryCtaLabel = activeHero?.secondary_cta_label || "View Projects";
  const secondaryCtaLink = activeHero?.secondary_cta_link || "#";

  const slides = useMemo<{ type: "image" | "youtube"; url: string; youtubeId: string | null }[]>(() => {
    const media = activeHero?.media ?? [];
    return media
      .filter((m: HeroMedia) => m.is_active && (m.media_type === "image" || m.media_type === "youtube"))
      .sort((a: HeroMedia, b: HeroMedia) => a.sort_order - b.sort_order)
      .map((m: HeroMedia) => {
        const youtubeId = m.media_type === "youtube" ? getYouTubeId(m.media_url) : null;
        return {
          type: m.media_type as "image" | "youtube",
          url: m.media_url,
          youtubeId,
        };
      });
  }, [activeHero]);

  const mediaCount = slides.length;
  const hasMedia = mediaCount > 0;
  const currentIsVideo = hasMedia && slides[activeIdx]?.type === "youtube";

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    if (currentIsVideo) swiper.autoplay?.stop();
    else swiper.autoplay?.start();
  }, [currentIsVideo]);

  const handleVideoEnded = useCallback(() => {
    swiperRef.current?.slideNext();
  }, []);

  const handleSlideChange = useCallback(
    (swiper: SwiperType) => {
      const idx = swiper.realIndex ?? swiper.activeIndex;
      setActiveIdx(idx);
      const isVid = slides[idx]?.type === "youtube";
      if (isVid) swiper.autoplay?.stop();
      else swiper.autoplay?.start();
    },
    [slides]
  );

  const first = slides[0];

  const renderPlaceholder = () => {
    if (!hasMedia) return null;
    if (first.type === "youtube" && first.youtubeId) {
      return (
        <Image
          src={`https://img.youtube.com/vi/${first.youtubeId}/maxresdefault.jpg`}
          alt={`${headline} video poster`}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
      );
    }
    if (first.type === "image") {
      return (
        <Image
          src={first.url}
          alt={`${headline} slide 1`}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
      );
    }
    return (
      <div className="absolute inset-0 bg-zinc-900" />
    );
  };

  return (
    <section
      id="home"
      className={`relative w-full h-[75vh] sm:h-[85vh] lg:h-screen flex items-center overflow-hidden select-none ${hasMedia
          ? "bg-zinc-950 text-white"
          : "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#e3f4fb] via-[#f4fbfd] to-white text-[#00627c]"
        } [&_.swiper-pagination]:!bottom-6 [&_.swiper-pagination]:!text-center [&_.swiper-pagination]:!w-full`}
    >
      {/* ── FULL-BLEED BACKGROUND MEDIA SLIDER ────────────────────── */}
      {hasMedia && (
        <div className="absolute inset-0 z-0">
          {!mounted ? (
            renderPlaceholder()
          ) : (
            <Swiper
              modules={[EffectFade, Autoplay, Pagination]}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              loop={mediaCount > 1}
              speed={1500}
              slidesPerView={1}
              centeredSlides={true}
              allowTouchMove={true}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                const firstIsVideo = slides[0]?.type === "youtube";
                if (firstIsVideo) swiper.autoplay?.stop();
                else swiper.autoplay?.start();
              }}
              onSlideChange={handleSlideChange}
              onRealIndexChange={handleSlideChange}
              autoplay={{
                delay: 4500,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                bulletActiveClass: "!bg-white !w-8",
                bulletClass:
                  "swiper-pagination-bullet !bg-white/40 !w-2.5 !h-2.5 !rounded-full !mx-1 transition-all duration-300",
              }}
              className="h-full w-full"
            >
              {slides.map((slide, i) => (
                <SwiperSlide key={i} className="h-full w-full relative overflow-hidden">
                  {slide.type === "youtube" && slide.youtubeId ? (
                    <YouTubeSlide
                      videoId={slide.youtubeId}
                      isActive={activeIdx === i}
                      loop={mediaCount === 1}
                      onEnded={handleVideoEnded}
                      headline={headline}
                      slideIndex={i}
                    />
                  ) : slide.type === "image" ? (
                    <Image
                      src={slide.url}
                      alt={`${headline} slide ${i + 1}`}
                      fill
                      priority={i === 0}
                      fetchPriority={i === 0 ? "high" : "low"}
                      sizes="100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-900" />
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          {/* Scrim Overlay — Ensures text contrast over full-bleed media */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20 z-10 pointer-events-none" />
        </div>
      )}

      {/* ── HERO CONTENT OVERLAY ──────────────────────────────────── */}
      <div className="relative z-20 w-full container mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
        {hasMedia ? (
          /* Dark full-bleed text overlay */
          <div className="max-w-2xl space-y-4 sm:space-y-6 text-left flex flex-col items-start justify-center">
            {/* 1st Element: Main Headline (Color: #00668a) */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#00668a] leading-[1.08] tracking-tight font-sans">
              {headline}
            </h1>

            {/* 2nd Element: Sub-headline / Intro Description */}
            {subHeadline && (
              <p className="text-[#526167] text-base sm:text-lg leading-relaxed max-w-xl font-normal font-sans">
                {subHeadline}
              </p>
            )}

            {/* 4th Element: CTA Buttons */}
            <div className="flex flex-row items-center gap-3.5 pt-3 flex-wrap">
              {primaryCtaLabel && (
                <Button
                  size="lg"
                  className="h-12 px-7 rounded-lg bg-[#00668a] text-white hover:bg-[#004c69] transition-all duration-300 text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 border-none shadow-xl cursor-pointer"
                  onClick={() => (window.location.href = primaryCtaLink)}
                >
                  <span>{primaryCtaLabel}</span>
                  <ExternalLink size={15} />
                </Button>
              )}

              {secondaryCtaLabel && (
                <Button
                  size="lg"
                  className="h-12 px-7 rounded-lg bg-transparent border border-[#00668a] text-[#00668a] hover:bg-[#00668a]/10 transition-all duration-300 text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-xl backdrop-blur-md cursor-pointer"
                  onClick={() => (window.location.href = secondaryCtaLink || "#")}
                >
                  <span>{secondaryCtaLabel}</span>
                  <ArrowRight size={15} />
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Light theme 2-column layout matching exact mockup media_1789970002288.png */
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7 space-y-5 text-left flex flex-col items-start justify-center">
              {/* 1st Element: Main Headline (Color: #00668a) */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#00668a] leading-[1.08] tracking-tight font-sans">
                {headline}
              </h1>

              {/* 2nd Element: Sub-headline / Intro Description */}
              {subHeadline && (
                <p className="text-[#526167] text-base sm:text-lg leading-relaxed max-w-xl font-normal font-sans">
                  {subHeadline}
                </p>
              )}

              {/* 4th Element: CTA Buttons */}
              <div className="flex flex-row items-center gap-3.5 pt-2 flex-wrap">
                {primaryCtaLabel && (
                  <Button
                    size="lg"
                    className="h-12 px-7 rounded-lg bg-[#00668a] hover:bg-[#004c69] text-white transition-all duration-300 text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 border-none shadow-lg cursor-pointer"
                    onClick={() => (window.location.href = primaryCtaLink)}
                  >
                    <span>{primaryCtaLabel}</span>
                    <ExternalLink size={15} />
                  </Button>
                )}

                {secondaryCtaLabel && (
                  <Button
                    size="lg"
                    className="h-12 px-7 rounded-lg bg-transparent border border-[#00668a] text-[#00668a] hover:bg-[#00668a]/5 transition-all duration-300 text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    onClick={() => (window.location.href = secondaryCtaLink || "#")}
                  >
                    <span>{secondaryCtaLabel}</span>
                    <ArrowRight size={15} />
                  </Button>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
              <Milanova3DGraphic />
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM RIGHT SCROLL INDICATOR ───────────────────────── */}
      <div
        className={`absolute bottom-6 right-8 z-30 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest pointer-events-none ${hasMedia ? "text-white/70" : "text-[#00627c]/70"
          }`}
      >
        <ChevronDown size={14} className="animate-bounce" />
        <span>Scroll For More</span>
      </div>
    </section>
  );
}