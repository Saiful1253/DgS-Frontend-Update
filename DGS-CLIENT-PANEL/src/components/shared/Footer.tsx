"use client";

import {
  LucideInstagram,
  LucideFacebook,
  LucideTwitter,
  LucideMapPin,
  LucidePhone,
  LucideMail,
} from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Footer() {
  const config = useSiteConfig();
  const pathname = usePathname();
  const isHome = pathname === "/";

  const brandName = config.company_name || "Electronics Store";
  const tagline = config.company_short_description || "Genuine Electronics & Appliances";
  const desc = config.company_description || "Your trusted destination for genuine electronics, home appliances and gadgets — backed by warranty, EMI options and fast nationwide delivery.";
  // lean-ctx: neutralized legacy food copy
  const phone = config.company_phone || "+1 (555) 123-4567";
  const email = config.company_email || "hello@emberandoak.com";
  const address = config.company_address || "123 Artisan Lane, Austin, TX 78701";

  const facebook = config.facebook_url || "#";
  const instagram = config.instagram_url || "#";
  const twitter = config.twitter_url || "#";

  const copyright = config.copyright_year || "2026";
  const footerText = config.footer_text || "All rights reserved.";

  return (
    <>
      <footer id="contact" className="bg-zinc-950 border-t border-zinc-900 py-16 px-4 text-zinc-200">

        <div className="max-w-6xl mx-auto">
          {/* Footer Top Brand Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-900/80 mb-10">
            <div className="flex flex-col items-start gap-4 text-center md:text-left">
              {config.company_logo && (
                <Image
                  src={config.company_logo}
                  alt={brandName}
                  width={64}
                  height={64}
                  style={{ height: "48px", width: "auto" }}
                  className="object-contain mx-auto md:mx-0"
                />
              )}
              <div className="flex flex-col items-center md:items-start">
                <h3 className="text-xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                  {brandName}
                </h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                  {tagline}
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-brand-accent hover:border-brand-accent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(245,158,11,0.25)]"
                aria-label="Instagram"
              >
                <LucideInstagram size={15} />
              </a>
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-brand-accent hover:border-brand-accent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(245,158,11,0.25)]"
                aria-label="Facebook"
              >
                <LucideFacebook size={15} />
              </a>
              <a
                href={twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-brand-accent hover:border-brand-accent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(245,158,11,0.25)]"
                aria-label="Twitter"
              >
                <LucideTwitter size={15} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12">
            {/* About Us column */}
            <div className="md:col-span-6 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-300 border-b border-zinc-900 pb-2">
                About Us
              </h4>
              <p className="text-zinc-400 text-xs font-semibold leading-relaxed max-w-md">
                {desc}
              </p>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-300 border-b border-zinc-900 pb-2">
                Quick Links
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href={isHome ? "#home" : "/#home"}
                    className="text-xs text-zinc-400 hover:text-brand-accent font-semibold transition-colors duration-200"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href={isHome ? "#home" : "/#home"}
                    className="text-xs text-zinc-400 hover:text-brand-accent font-semibold transition-colors duration-200"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href={isHome ? "#reviews" : "/#reviews"}
                    className="text-xs text-zinc-400 hover:text-brand-accent font-semibold transition-colors duration-200"
                  >
                    Reviews
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="text-xs text-zinc-400 hover:text-brand-accent font-semibold transition-colors duration-200"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    href={isHome ? "#blogs" : "/#blogs"}
                    className="text-xs text-zinc-400 hover:text-brand-accent font-semibold transition-colors duration-200"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href={isHome ? "#products" : "/#products"}
                    className="text-xs text-zinc-400 hover:text-brand-accent font-semibold transition-colors duration-200"
                  >
                    Order Now
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-300 border-b border-zinc-900 pb-2">
                Contact Us
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <LucideMapPin size={14} className="text-brand-accent mt-0.5 shrink-0" />
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                    {address}
                  </p>
                </li>
                <li className="flex items-center gap-2.5">
                  <LucidePhone size={14} className="text-brand-accent shrink-0" />
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="text-zinc-400 hover:text-brand-accent text-xs font-semibold transition-colors"
                  >
                    {phone}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <LucideMail size={14} className="text-brand-accent shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="text-zinc-400 hover:text-brand-accent text-xs font-semibold transition-colors break-all"
                  >
                    {email}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-zinc-900/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-zinc-500 font-bold">
              © {copyright} {brandName}. {footerText}
            </p>
            <div className="flex gap-6 text-[10px] text-zinc-500 font-bold">
              <Link href="/privacy-policy" className="hover:text-zinc-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-and-conditions" className="hover:text-zinc-400 transition-colors">
                Terms of Service
              </Link>
              <Link href={isHome ? "#tracking" : "/#tracking"} className="hover:text-zinc-400 transition-colors">
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
