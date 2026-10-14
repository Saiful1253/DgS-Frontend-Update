"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // premium easeOutExpon
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.3,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    // Animate loop
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Clean up
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      delete (window as unknown as { lenis?: Lenis }).lenis;
    };
  }, []);

  // Scroll on route change or handle initial hashes
  useEffect(() => {
    const timer = setTimeout(() => {
      const hash = window.location.hash;
      if (hash) {
        const targetId = hash.substring(1);
        const element = document.getElementById(targetId);
        if (element) {
          if (lenisRef.current) {
            lenisRef.current.scrollTo(element, { duration: 1.2 });
          } else {
            element.scrollIntoView({ behavior: "smooth" });
          }
          return;
        }
      }

      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Intercept all local hash link clicks to guarantee scrolling on repeated clicks
  useEffect(() => {
    const handleHashClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const hashMatch = href.match(/^(?:#|\/#)(.+)$/);
      if (!hashMatch) return;

      const targetId = hashMatch[1];

      if (pathname === "/") {
        const element = document.getElementById(targetId);
        if (element) {
          e.preventDefault();
          window.history.pushState(null, "", `#${targetId}`);
          if (lenisRef.current) {
            lenisRef.current.scrollTo(element, { duration: 1.2 });
          } else {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    };

    document.addEventListener("click", handleHashClick, { capture: true });
    return () => document.removeEventListener("click", handleHashClick, { capture: true });
  }, [pathname]);

  return null;
}
