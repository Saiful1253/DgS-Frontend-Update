"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X, PhoneCall } from "lucide-react";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSiteConfig } from "@/context/SiteConfigContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

// English-only source strings. Bangla is produced at runtime by <AutoTranslate>.
const navLinks: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Certifications", href: "/certificates" },
  { label: "Blogs", href: "/blogs" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const siteConfig = useSiteConfig();
  const [shrink, setShrink] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      setShrink(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all backdrop-blur-xl border-b border-slate-200/80 bg-white/95
      ${shrink ? "h-14 shadow-xl" : "h-16 xl:h-20 shadow-md"}`}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-wider transition-colors hover:text-primary"
          >
            {siteConfig.company_logo ? (
              <Image
                src={siteConfig.company_logo}
                alt={siteConfig.company_name || "MilanoVA Technologies"}
                width={120}
                height={40}
                style={{ height: "auto" }}
                className={`object-contain transition-all duration-300 w-auto ${
                  shrink ? "max-h-10" : "max-h-12 xl:max-h-14"
                }`}
              />
            ) : (
              <span className="font-extrabold tracking-tight text-slate-900">
                {siteConfig.company_name || "MilanoVA"}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-8">
            {navLinks.map((l) => {
              const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                    active
                      ? "text-primary border-b-2 border-primary pb-1"
                      : "text-slate-700 hover:text-primary"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Actions CTA */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <Link href="/contact">
              <Button className="h-9 px-4 text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary-hover text-white rounded-lg shadow-md cursor-pointer flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5" />
                Get In Touch
              </Button>
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="xl:hidden p-2 text-slate-700 hover:text-primary"
              aria-label="Toggle Navigation"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 top-16 z-40 bg-white/95 backdrop-blur-2xl xl:hidden p-6 flex flex-col justify-between border-b border-slate-200 shadow-xl">
          <div className="space-y-4">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block text-lg font-bold text-slate-800 hover:text-primary uppercase tracking-wider"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-200 space-y-3">
            <LanguageSwitcher fullWidth />
            <Link href="/contact" onClick={() => setOpen(false)}>
              <Button className="w-full h-11 text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary-hover text-white rounded-xl flex items-center justify-center gap-2">
                <PhoneCall className="w-4 h-4" />
                Contact Solutions Team
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
