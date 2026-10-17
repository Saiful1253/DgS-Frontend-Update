"use client";

import { useMemo, useState, useSyncExternalStore, useRef, useEffect, useCallback } from "react";
import { ExternalLink, ArrowRight, ChevronDown, ShieldCheck, Users, Headphones, Phone, Wrench, Flame, Zap, Mail, MessageCircle } from "lucide-react";
import { Button } from "../../ui/button";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/context/SiteConfigContext";
import type { Swiper as SwiperType } from "swiper";
import type { HeroSection, HeroMedia } from "@/types/hero";

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
}: {
  videoId: string;
  isActive: boolean;
  loop: boolean;
  onEnded: () => void;
  headline?: string;
  slideIndex?: number;
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
        sizes="100vw"
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
            width: "max(100vw, calc(100vh * 16 / 9))",
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





function renderBadge(text?: string | null) {
  const badge = text?.trim();
  if (!badge) return null;

  if (badge.includes("•")) {
    const parts = badge.split("•");
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 border border-white/15 shadow-sm backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-[#ff5722] shadow-[0_0_8px_#ff5722]" />
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-100">
          {parts[0].trim()}
        </span>
        <span className="text-white/40">•</span>
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#00e676]">
          {parts.slice(1).join("•").trim()}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 border border-white/15 shadow-sm backdrop-blur-md">
      <span className="w-2 h-2 rounded-full bg-[#ff5722] shadow-[0_0_8px_#ff5722]" />
      <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-100">
        {badge}
      </span>
    </div>
  );
}

function renderStyledHeadline(headline: string, highlight?: string | null) {
  if (!headline) return null;
  const targetHighlight = highlight?.trim() || (headline.includes("Gas & Pipeline") ? "Gas & Pipeline" : null);

  if (targetHighlight && headline.includes(targetHighlight)) {
    const parts = headline.split(targetHighlight);
    return (
      <>
        {parts[0]}
        <span className="text-[#ff5722] drop-shadow-sm">{targetHighlight}</span>
        {parts.slice(1).join(targetHighlight)}
      </>
    );
  }
  return headline;
}

function renderStyledSubHeadline(text: string) {
  if (!text) return null;
  if (text.includes("Digital Gas Service")) {
    const parts = text.split("Digital Gas Service");
    return (
      <>
        {parts[0]}
        <strong className="text-[#ff5722] font-bold">Digital Gas Service</strong>
        {parts[1]}
      </>
    );
  }
  return text;
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
      const digits = trimmedLink.replace(/[^\d+]/g, "").replace(/^\+/, "");
      href = `https://wa.me/${digits || "8801778277178"}`;
    }
    return {
      href,
      isExternal: true,
      icon: (
        <svg className="w-4 h-4 fill-current text-[#25D366] shrink-0" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
        </svg>
      ),
    };
  }

  // Phone number detection
  const isTelLink = lowerLink.startsWith("tel:");
  const isPhoneLink = /^(\+?[\d\s-]{7,18})$/.test(trimmedLink);
  const isPhoneLabel = /^(\+?[\d\s-]{7,18})$/.test(trimmedLabel);

  if (isTelLink || isPhoneLink || (isPhoneLabel && (!trimmedLink || trimmedLink === "#" || !lowerLink.startsWith("http")))) {
    const rawNumber = isTelLink ? trimmedLink.replace("tel:", "") : (isPhoneLink ? trimmedLink : trimmedLabel);
    const digits = rawNumber.replace(/[^\d+]/g, "");
    return {
      href: `tel:${digits}`,
      isExternal: false,
      icon: <Phone className="w-4 h-4 text-[#ff5722] shrink-0" />,
    };
  }

  // Email
  if (lowerLink.startsWith("mailto:") || (lowerLink.includes("@") && !lowerLink.includes("/"))) {
    return {
      href: lowerLink.startsWith("mailto:") ? trimmedLink : `mailto:${trimmedLink}`,
      isExternal: false,
      icon: <Mail className="w-4 h-4 text-sky-400 shrink-0" />,
    };
  }

  // Regular page link or external URL
  return {
    href: trimmedLink || "#",
    isExternal: trimmedLink.startsWith("http"),
    icon: isPrimary ? <Wrench className="w-4 h-4 shrink-0" /> : <ArrowRight className="w-4 h-4 text-[#ff5722] shrink-0" />,
  };
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

  const headline = activeHero?.headline || "Safe & Reliable Gas & Pipeline Engineering Solutions";
  const highlightText = activeHero?.highlight_text;
  const badgeText = activeHero?.badge_text;
  const subHeadline = activeHero?.sub_headline || "";
  const primaryCtaLabel = activeHero?.primary_cta_label || "Explore Services";
  const primaryCtaLink = activeHero?.primary_cta_link || "#services";
  const secondaryCtaLabel = activeHero?.secondary_cta_label;
  const secondaryCtaLink = activeHero?.secondary_cta_link;

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
    if (slides.some((s) => s.type === "youtube")) {
      loadYouTubeApi();
    }
  }, [slides]);

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
      className="relative w-full min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden select-none bg-gradient-to-br from-[#012543] via-[#023b65] to-[#011c33] text-white py-20 lg:py-28 [&_.swiper-pagination]:!bottom-6 [&_.swiper-pagination]:!text-center [&_.swiper-pagination]:!w-full"
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
              allowTouchMove={false}
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

          {/* Scrim Overlay — Rich black gradient overlay for crisp text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/55 z-10 pointer-events-auto" />
        </div>
      )}

      {/* ── HERO CONTENT OVERLAY ──────────────────────────────────── */}
      <div className="relative z-20 w-full container mx-auto px-6 sm:px-10 lg:px-16 py-12">
        <div className="max-w-3xl space-y-6 text-left flex flex-col items-start justify-center">
          {/* Top Badge */}
          {renderBadge(badgeText)}

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.12] tracking-tight font-sans drop-shadow-md">
            {renderStyledHeadline(headline, highlightText)}
          </h1>

          {/* Sub-headline / Intro Description */}
          {subHeadline && (
            <p className="text-slate-200/95 text-sm sm:text-base leading-relaxed max-w-2xl font-normal font-sans drop-shadow-sm">
              {renderStyledSubHeadline(subHeadline)}
            </p>
          )}

          {/* 3 Static Feature Badges — 100% Frontend Design */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl pt-2">
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-black/65 border border-white/10 backdrop-blur-md shadow-sm transition-transform duration-300 hover:translate-y-[-2px]">
              <div className="p-2 rounded-lg bg-[#ff5722]/15 text-[#ff5722] flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">100% Safety Standard</h4>
                <p className="text-[10px] text-slate-300">NFPA 58 & BNBC Compliant</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-black/65 border border-white/10 backdrop-blur-md shadow-sm transition-transform duration-300 hover:translate-y-[-2px]">
              <div className="p-2 rounded-lg bg-[#00e676]/15 text-[#00e676] flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">Certified Engineers</h4>
                <p className="text-[10px] text-slate-300">Mechanical & Pipeline</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-black/65 border border-white/10 backdrop-blur-md shadow-sm transition-transform duration-300 hover:translate-y-[-2px]">
              <div className="p-2 rounded-lg bg-sky-400/15 text-sky-400 flex-shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">24/7 Rapid Emergency</h4>
                <p className="text-[10px] text-slate-300">Quick Response Unit</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-row items-center gap-4 pt-3 flex-wrap">
            {primaryCtaLabel && (() => {
              const cta = resolveCtaAction(primaryCtaLabel, primaryCtaLink, true);
              return (
                <a
                  href={cta.href}
                  target={cta.isExternal ? "_blank" : undefined}
                  rel={cta.isExternal ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#ff5722] hover:bg-[#e64a19] text-white transition-all duration-300 text-xs sm:text-sm font-bold tracking-wide gap-2 border-none shadow-xl shadow-orange-500/20 cursor-pointer"
                >
                  {cta.icon}
                  <span>{primaryCtaLabel}</span>
                </a>
              );
            })()}

            {secondaryCtaLabel && (() => {
              const cta = resolveCtaAction(secondaryCtaLabel, secondaryCtaLink, false);
              return (
                <a
                  href={cta.href}
                  target={cta.isExternal ? "_blank" : undefined}
                  rel={cta.isExternal ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-white hover:bg-slate-100 text-slate-900 transition-all duration-300 text-xs sm:text-sm font-bold tracking-wide gap-2 shadow-xl cursor-pointer border-none"
                >
                  {cta.icon}
                  <span>{secondaryCtaLabel}</span>
                </a>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── BOTTOM RIGHT SCROLL INDICATOR ───────────────────────── */}
      <div
        className="absolute bottom-6 right-8 z-30 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest pointer-events-none text-white/70"
      >
        <ChevronDown size={14} className="animate-bounce" />
        <span>Scroll For More</span>
      </div>
    </section>
  );
}