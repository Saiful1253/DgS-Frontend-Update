"use client";

import { Fragment, useMemo, useState, useSyncExternalStore, useRef, useEffect, useCallback } from "react";
import { ExternalLink, ChevronDown, Phone, MessageCircle } from "lucide-react";
import { Button } from "../../ui/button";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import Image from "next/image";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { useLanguage } from "@/context/LanguageContext";
import { toBanglaDigits } from "@/lib/translate";
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

// ─── Smart CTA resolution (phone / WhatsApp / regular link) ───────────────
const DEFAULT_HIGHLIGHT = "#ff5722";
const digitsOnly = (v: string) => v.replace(/[^\d+]/g, "");

function isPhone(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim();
  if (/^tel:/i.test(v)) return true;
  const cleaned = v.replace(/^(tel|call|phone|mobile)[:\s-]*/i, "").trim();
  const digits = cleaned.replace(/[^\d]/g, "");
  if (digits.length >= 6 && digits.length <= 16) {
    if (/^[+\d\s().-]+$/.test(cleaned)) {
      return true;
    }
  }
  return false;
}

function extractPhone(value?: string | null): string {
  if (!value) return "";
  const v = value.trim().replace(/^tel:/i, "");
  const cleaned = v.replace(/^(tel|call|phone|mobile)[:\s-]*/i, "").trim();
  const digits = digitsOnly(cleaned);
  if (cleaned.startsWith("+")) {
    return `+${digits.replace(/^\+/, "")}`;
  }
  return digits;
}

function isWhatsApp(value?: string | null): boolean {
  if (!value) return false;
  return /whatsapp|wa\.me/i.test(value.trim());
}

function extractWhatsApp(value?: string | null): string {
  if (!value) return "";
  const v = value.trim();
  const num = v.match(/(?:wa\.me\/|whatsapp\.com\/send\?phone=|whatsapp:\/\/send\?phone=)([\d+]+)/i)?.[1];
  if (num) return `https://wa.me/${digitsOnly(num).replace(/^\+/, "")}`;
  if (/^https?:/i.test(v)) return v;
  return `https://wa.me/${digitsOnly(v).replace(/^\+/, "")}`;
}

function resolveCta(
  link?: string | null,
  label?: string | null
): { href: string; kind: "phone" | "whatsapp" | "link"; target?: string; rel?: string; displayLabel: string } {
  const l = (link || "").trim();
  const lb = (label || "").trim();

  if (!l && !lb) {
    return { href: "#", kind: "link", displayLabel: "" };
  }

  const displayLabel = lb || l;

  if (isWhatsApp(l)) {
    return { href: extractWhatsApp(l), kind: "whatsapp", target: "_blank", rel: "noopener noreferrer", displayLabel };
  }
  if (!l && isWhatsApp(lb)) {
    return { href: extractWhatsApp(lb), kind: "whatsapp", target: "_blank", rel: "noopener noreferrer", displayLabel };
  }

  if (isPhone(l)) {
    return { href: `tel:${extractPhone(l)}`, kind: "phone", displayLabel };
  }

  if ((!l || l === "#") && isPhone(lb)) {
    return { href: `tel:${extractPhone(lb)}`, kind: "phone", displayLabel };
  }

  if (l && l !== "#") {
    if (/^mailto:/i.test(l)) {
      return { href: l, kind: "link", displayLabel };
    }
    if (l.startsWith("#") || l.startsWith("/")) {
      return { href: l, kind: "link", displayLabel };
    }
    if (/^https?:\/\//i.test(l)) {
      return { href: l, kind: "link", target: "_blank", rel: "noopener noreferrer", displayLabel };
    }
    if (/^[\w-]+\.[a-z]{2,}/i.test(l)) {
      return { href: `https://${l}`, kind: "link", target: "_blank", rel: "noopener noreferrer", displayLabel };
    }
    return { href: l, kind: "link", target: "_blank", rel: "noopener noreferrer", displayLabel };
  }

  if (isPhone(lb)) {
    return { href: `tel:${extractPhone(lb)}`, kind: "phone", displayLabel };
  }

  return { href: l || "#", kind: "link", displayLabel };
}

// ─── Pill badge above headline ("•" splits segments; rest colorized) ──────
function BadgePill({ text, dark }: { text: string; dark: boolean }) {
  const parts = text.split("•").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  return (
    <span
      className={`inline-flex flex-wrap items-center gap-2 rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest ${dark
        ? "bg-white/10 text-white/90 border border-white/20 backdrop-blur-md"
        : "bg-[#00668a]/10 text-[#00668a] border border-[#00668a]/20"
        }`}
    >
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <span style={{ color: DEFAULT_HIGHLIGHT }}>•</span>}
          <span style={i > 0 ? { color: DEFAULT_HIGHLIGHT } : undefined}>{p}</span>
        </Fragment>
      ))}
    </span>
  );
}

// ─── Headline with optional colorized highlight phrase ────────────────────
function renderHighlighted(text: string, highlight?: string | null) {
  const h = (highlight || "").trim();
  if (!h || !text.includes(h)) return text;
  const i = text.indexOf(h);
  return (
    <>
      {text.slice(0, i)}
      <span style={{ color: DEFAULT_HIGHLIGHT }}>{h}</span>
      {text.slice(i + h.length)}
    </>
  );
}

// ─── CTA button with smart icon/behavior ──────────────────────────────────
function CtaButton({
  label,
  link,
  variant,
  dark = false,
}: {
  label: string;
  link?: string | null;
  variant: "solid" | "outline";
  dark?: boolean;
}) {
  const { href, kind, target, rel, displayLabel } = resolveCta(link, label);
  const { locale } = useLanguage();
  const Icon = kind === "phone" ? Phone : kind === "whatsapp" ? MessageCircle : ExternalLink;
  const cls =
    variant === "solid"
      ? "h-12 px-7 rounded-lg bg-[#00668a] text-white hover:bg-[#004c69] transition-all duration-300 text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 border-none shadow-xl cursor-pointer"
      : dark
      ? "h-12 px-7 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 hover:text-white transition-all duration-300 text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-xl backdrop-blur-md cursor-pointer"
      : "h-12 px-7 rounded-lg bg-transparent border border-[#00668a] text-[#00668a] hover:bg-[#00668a]/10 transition-all duration-300 text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-xl backdrop-blur-md cursor-pointer";

  const handleClick = (e: React.MouseEvent) => {
    if (!href || href === "#") {
      e.preventDefault();
      return;
    }
    if (kind === "phone") {
      window.location.href = href;
      return;
    }
    if (target === "_blank") {
      e.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.location.href = href;
  };

  const rawLabel = displayLabel || label;
  const finalDisplay = locale === "bn" ? toBanglaDigits(rawLabel) : rawLabel;

  return (
    <Button size="lg" className={cls} onClick={handleClick}>
      <span>{finalDisplay}</span>
      <Icon size={15} />
    </Button>
  );
}

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
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isActive && isLoaded) {
    setIsLoaded(false);
  }

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
          cc_load_policy: 0,
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
              if (loadTimer) clearTimeout(loadTimer);
              loadTimer = setTimeout(() => {
                if (isMountedRef.current) {
                  isLoadedRef.current = true;
                  setIsLoaded(true);
                }
                }, 8000);

              if (pollInterval) clearInterval(pollInterval);
              pollInterval = setInterval(() => {
                if (!playerRef.current || !isMountedRef.current) return;
                try {
                  const curr = playerRef.current.getCurrentTime();
                  const dur = playerRef.current.getDuration();

                  // Keep YouTube's transient startup controls covered.
                  if (!isLoadedRef.current && dur > 0 && curr >= 3.5) {
                    isLoadedRef.current = true;
                    setIsLoaded(true);
                  }

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
              if (loadTimer) clearTimeout(loadTimer);
              isLoadedRef.current = false;
              setIsLoaded(false);

              if (evt.data === 0) {
              if (loop) {
                try { evt.target.seekTo(0, true); evt.target.playVideo(); } catch { }
              } else if (!hasTriggeredRef.current) {
                hasTriggeredRef.current = true;
                onEnded();
              }
              } else if (evt.data === 2 || evt.data === -1 || evt.data === 5) {
                try { evt.target.playVideo(); } catch { }
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
          className="absolute z-0 pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) scale(1.45)",
            width: "max(100vw, calc(100vh * 16 / 9))",
            aspectRatio: "16 / 9",
          }}
        >
          <div
            ref={containerRef}
            className="w-full h-full pointer-events-none [&_iframe]:pointer-events-none"
          />
        </div>
      )}

      {/* Hover shield — the cursor can never reach the iframe */}
      <div className="absolute inset-0 z-10 pointer-events-auto" aria-hidden="true" />

      <img
        src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 z-20 w-full h-full object-cover pointer-events-none ${isLoaded ? "opacity-0" : "opacity-100"
          }`}
      />
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
  const badgeText = activeHero?.badge_text || "";
  const highlightText = activeHero?.highlight_text || "";
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
    if (first.type === "youtube") {
      // No thumbnail — the video player takes over as soon as it mounts.
      return <div className="absolute inset-0 bg-black" />;
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
            {/* 0th Element: Pill Badge (optional) */}
            {badgeText && <BadgePill text={badgeText} dark />}

            {/* 1st Element: Main Headline (Color: #00668a) */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#00668a] leading-[1.08] tracking-tight font-sans">
              {renderHighlighted(headline, highlightText)}
            </h1>

            {/* 2nd Element: Sub-headline / Intro Description */}
            {subHeadline && (
              <p className="text-[#526167] text-base sm:text-lg leading-relaxed max-w-xl font-normal font-sans">
                {subHeadline}
              </p>
            )}

            {/* 4th Element: CTA Buttons */}
            <div className="flex flex-row items-center gap-3.5 pt-3 flex-wrap">
              {(primaryCtaLabel || primaryCtaLink) && (
                <CtaButton label={primaryCtaLabel || ""} link={primaryCtaLink} variant="solid" />
              )}

              {(secondaryCtaLabel || secondaryCtaLink) && (
                <CtaButton label={secondaryCtaLabel || ""} link={secondaryCtaLink} variant="outline" dark={hasMedia} />
              )}
            </div>
          </div>
        ) : (
          /* Light theme 2-column layout matching exact mockup media_1789970002288.png */
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7 space-y-5 text-left flex flex-col items-start justify-center">
              {/* 0th Element: Pill Badge (optional) */}
              {badgeText && <BadgePill text={badgeText} dark={false} />}

              {/* 1st Element: Main Headline (Color: #00668a) */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#00668a] leading-[1.08] tracking-tight font-sans">
                {renderHighlighted(headline, highlightText)}
              </h1>

              {/* 2nd Element: Sub-headline / Intro Description */}
              {subHeadline && (
                <p className="text-[#526167] text-base sm:text-lg leading-relaxed max-w-xl font-normal font-sans">
                  {subHeadline}
                </p>
              )}

              {/* 4th Element: CTA Buttons */}
              <div className="flex flex-row items-center gap-3.5 pt-2 flex-wrap">
                {(primaryCtaLabel || primaryCtaLink) && (
                  <CtaButton label={primaryCtaLabel || ""} link={primaryCtaLink} variant="solid" />
                )}

                {(secondaryCtaLabel || secondaryCtaLink) && (
                  <CtaButton label={secondaryCtaLabel || ""} link={secondaryCtaLink} variant="outline" />
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