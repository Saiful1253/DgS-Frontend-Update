"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";

export default function SplashScreen() {
  const siteConfig = useSiteConfig();
  const [showSplash, setShowSplash] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasLoaded = sessionStorage.getItem("hasLoadedSplash");
    if (hasLoaded) {
      return;
    }

    // Show splash on first visit (after initial paint)
    setTimeout(() => {
      setShowSplash(true);
    }, 0);

    // Start fade out after 400ms, then unmount 250ms later
    const fadeTimeout = setTimeout(() => {
      setIsFading(true);
      const unmountTimeout = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("hasLoadedSplash", "true");
      }, 250);
      return () => clearTimeout(unmountTimeout);
    }, 400);

    return () => clearTimeout(fadeTimeout);
  }, []);

  if (!showSplash) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-white select-none transition-opacity duration-300 ${isFading ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
    >
      {/* CSS Keyframes for custom progress bar animation */}
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {/* Decorative ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative flex flex-col items-center space-y-6 text-center z-10">
        {/* Glowing Logo Icon */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900 border border-white/5 shadow-2xl shadow-amber-500/10">
          {/* Animated pulsing outer ring */}
          <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping opacity-75" />

          <Flame className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>

        {/* Brand Name */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-[0.25em] text-white uppercase sm:text-4xl drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
            {siteConfig.company_name || "Electronics Store"}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-500/80">
            {siteConfig.company_short_description || "Genuine Electronics & Appliances"}
          </p>
        </div>

        {/* Minimal Premium Loader Bar */}
        <div className="w-36 h-[2px] bg-white/10 rounded-full overflow-hidden mt-2 relative">
          <div
            className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
            style={{
              animation: "progress 2s infinite ease-in-out",
              width: "50%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
