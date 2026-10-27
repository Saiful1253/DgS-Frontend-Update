"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import {
  ShieldCheck,
  Flame,
  Radio,
  Sliders,
  CheckCircle2,
  PhoneCall,
  ArrowRight,
  Building2,
  Factory,
  Gauge,
  FileCheck,
} from "lucide-react";
import type { Service } from "@/types/service";
import { BRAND } from "@/lib/brand";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { embedYouTubeVideos } from "@/lib/utils";

interface Props {
  services?: Service[];
}

const cardAccents = [
  {
    iconBox: "bg-sky-50 border-sky-100 text-[#00668a] group-hover:bg-[#00668a] group-hover:text-white",
    cardHover: "hover:border-sky-300",
    titleHover: "group-hover:text-[#00668a]",
  },
  {
    iconBox: "bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    cardHover: "hover:border-emerald-300",
    titleHover: "group-hover:text-emerald-700",
  },
  {
    iconBox: "bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
    cardHover: "hover:border-indigo-300",
    titleHover: "group-hover:text-indigo-700",
  },
  {
    iconBox: "bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
    cardHover: "hover:border-amber-300",
    titleHover: "group-hover:text-amber-700",
  },
];

function getFeatureIcon(iconName?: string, index: number = 0) {
  switch (iconName?.toLowerCase()) {
    case "shield":
    case "shield-check":
    case "check-circle":
      return ShieldCheck;
    case "flame":
    case "shield-alert":
      return Flame;
    case "radio":
      return Radio;
    case "gauge":
    case "chart":
      return Gauge;
    case "building":
      return Building2;
    case "factory":
      return Factory;
    case "file-check":
      return FileCheck;
    case "sliders":
    default:
      if (index === 1) return ShieldCheck;
      if (index === 2) return Radio;
      if (index === 3) return Gauge;
      return Sliders;
  }
}

export default function ServicesSection({ services = [] }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const activeServices = services.filter((s) => s.is_active);

  if (activeServices.length === 0) {
    return null;
  }

  // Find flagship or first active service
  const flagship =
    activeServices.find((s) => s.is_flagship) ||
    activeServices[0];

  // Specialized grid cards = other active services
  const gridCards = activeServices.filter((s) => s.id !== flagship.id);
  const totalPages = Math.max(1, Math.ceil(gridCards.length / ITEMS_PER_PAGE));
  const paginatedCards = gridCards.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const siteConfig = useSiteConfig();
  const phoneDisplay = siteConfig.company_phone || BRAND.contact.phone;
  const phoneHref = `tel:${phoneDisplay.replace(/[^0-9+]/g, "")}`;

  // Feature items fallback if not populated in DB
  const validFeatures = (flagship.features || []).filter(
    (f) => Boolean(f && (f.title?.trim() || f.description?.trim()))
  );
  const fallbackFeatures = [
    {
      title: "Auto-regulated manifold",
      description: "Dual-stage regulators & automated vaporizers maintain constant 2.8 kPa pressure 24/7.",
      icon: "sliders",
    },
    {
      title: "Instant safety shut-off",
      description: "Optical sniffer sensors with fast solenoid emergency shut-off valves under 100ms.",
      icon: "shield-check",
    },
    {
      title: "Prepaid smart meters",
      description: "Individual prepaid telemetry digital meters per apartment with automated billing.",
      icon: "radio",
    },
    {
      title: "Certified & Hydro-Tested",
      description: "100% radiographic weld testing, ultrasonic thickness gauging exceeding BNBC standards.",
      icon: "gauge",
    },
  ];
  const displayFeatures = validFeatures.length > 0 ? validFeatures : fallbackFeatures;

  return (
    <section className="relative w-full py-10 md:py-14 bg-gradient-to-b from-[#edf2f7] via-[#f0f4f8] to-[#e8eef4] border-y border-slate-300/70">
      {/* Subtle Technical Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-35 pointer-events-none" />

      <div className="relative container mx-auto px-4 space-y-10 lg:space-y-12">
        
        {/* ================================================================= */}
        {/* TOP FLAGSHIP HERO CARD WITH BLUE BANNER                          */}
        {/* ================================================================= */}
        <div className="rounded-md border border-slate-300/90 bg-white shadow-xl shadow-slate-300/30 overflow-hidden ring-1 ring-slate-900/5">
          
          {/* Cyan/Blue Header Strip */}
          {(flagship.category_tag || flagship.tier_label) && (
            <div className="bg-[#0072b2] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-white">
              {flagship.category_tag && (
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-xs bg-amber-400 text-slate-900 font-black text-[10px] shadow-xs">
                    ★
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">
                    {flagship.category_tag}
                  </span>
                </div>
              )}
              {flagship.tier_label && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="bg-white/15 backdrop-blur-xs px-2.5 py-0.5 rounded-sm text-[10px] sm:text-[11px] font-semibold text-white/95">
                    {flagship.tier_label}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Hero Card Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Left Image Column: Boxed Frame */}
            <div className="lg:col-span-6 p-4 sm:p-5 lg:p-6 flex flex-col justify-center bg-slate-50/60">
              <div className="relative w-full h-full min-h-[340px] sm:min-h-[420px] rounded-md border border-slate-200/90 overflow-hidden shadow-xs bg-slate-900 group">
                <img
                  src={flagship.image_url || "/placeholder-product.svg"}
                  alt={flagship.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-black/30 pointer-events-none" />

                {/* Floating Top Badges */}
                <div className="absolute top-3.5 left-3.5 flex flex-col gap-2 z-10">
                  {flagship.badge_label && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#f95700] text-white text-[11px] font-bold tracking-wider shadow-md uppercase">
                      <Flame className="w-3.5 h-3.5 fill-white text-white" />
                      <span>{flagship.badge_label}</span>
                    </div>
                  )}
                </div>

                {/* Floating Bottom Info Row: Compliance & Telemetry Side by Side, Equal Size & Full Text */}
                {(flagship.compliance_codes || flagship.sub_title || flagship.badge_status) && (
                  <div className="absolute bottom-3 left-3 right-3 z-10 grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
                    {flagship.compliance_codes && (
                      <div className="bg-white/95 backdrop-blur-md px-2.5 sm:px-3 py-2 rounded-md border border-white/60 shadow-lg flex items-center gap-2 min-w-0">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-800 leading-snug">
                          {flagship.compliance_codes}
                        </span>
                      </div>
                    )}

                    {(flagship.sub_title || flagship.badge_status) && (
                      <div className="bg-white/95 backdrop-blur-md px-2.5 sm:px-3 py-2 rounded-md border border-white/60 shadow-lg flex items-center justify-between gap-1.5 min-w-0">
                        {flagship.sub_title && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Radio className="w-4 h-4 text-[#0072b2] shrink-0 animate-pulse" />
                            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-800 leading-snug">
                              {flagship.sub_title}
                            </span>
                          </div>
                        )}
                        {flagship.badge_status && (
                          <span className="shrink-0 text-[9px] font-bold tracking-wider text-sky-700 bg-sky-100/90 px-1.5 py-0.5 rounded-sm uppercase ml-auto">
                            {flagship.badge_status}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Details Column: Modern Zentra-Inspired Content with Distinct Sky-Mist Backdrop */}
            <div className="lg:col-span-6 p-6 sm:p-7 lg:p-8 flex flex-col justify-between bg-gradient-to-br from-[#f0f7fc] via-[#e8f2f9] to-[#e1edf6] border-t lg:border-t-0 lg:border-l border-sky-200/90">
              <div>
                {/* Eyebrow Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-sky-300/80 bg-white shadow-2xs text-[#00668a] text-xs font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00668a] animate-pulse" />
                  <span>{flagship.category_tag || "Why choose our system?"}</span>
                </div>

                {/* Main Heading */}
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight">
                  {flagship.name}
                </h2>

                {/* Description */}
                <div
                  className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal prose prose-sm max-w-none [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-4"
                  dangerouslySetInnerHTML={{ __html: embedYouTubeVideos(flagship.description) || "" }}
                />

                {/* 2x2 Feature Grid: Elevated crisp white cards on distinct sky-mist backdrop */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  {displayFeatures.slice(0, 4).map((f, i) => {
                    const accent = cardAccents[i % cardAccents.length];
                    const IconComp = getFeatureIcon(f.icon, i);

                    return (
                      <div
                        key={i}
                        className={`p-3.5 sm:p-4 rounded-md border border-sky-100/90 bg-white shadow-xs hover:shadow-md hover:border-sky-300 ${accent.cardHover} transition-all duration-200 flex flex-col justify-between group`}
                      >
                        <div className="space-y-2.5">
                          {/* Top-left Square Icon Chip */}
                          <div
                            className={`h-9 w-9 rounded-md border ${accent.iconBox} flex items-center justify-center transition-colors duration-200`}
                          >
                            <IconComp className="w-4 h-4 stroke-[1.9]" />
                          </div>

                          {/* Text Layout */}
                          <div>
                            {f.title?.trim() && (
                              <h4
                                className={`text-xs sm:text-[13px] font-bold text-slate-900 ${accent.titleHover} transition-colors leading-snug`}
                              >
                                {f.title}
                              </h4>
                            )}
                            {f.description?.trim() && (
                              <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
                                {f.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action Row: Equal size side-by-side buttons */}
              <div className="mt-8 pt-5 border-t border-sky-200/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <Link
                    href={flagship.cta_url || `/services/${flagship.slug}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-md bg-[#f95700] hover:bg-[#ea4f00] text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all text-center group"
                  >
                    <span className="truncate">{flagship.cta_label || "Request System Blueprint"}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <a
                    href={phoneHref}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-md border border-slate-300 hover:border-[#00668a] text-slate-800 hover:text-[#00668a] bg-white font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all shadow-2xs text-center"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#00668a] shrink-0" />
                    <span>{phoneDisplay}</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================================================================= */}
        {/* SUB-SECTION: ADDITIONAL SPECIALIZED ENGINEERING                   */}
        {/* ================================================================= */}
        {gridCards.length > 0 && (
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300/80 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-wider uppercase">
                ADDITIONAL SPECIALIZED ENGINEERING &amp; PIPELINE NETWORKS
              </h3>
              <span className="text-xs font-medium text-slate-500">
                Turnkey Industrial &amp; Regulatory Services
              </span>
            </div>

            {/* 4 Cards Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {paginatedCards.map((card) => {
                const isFire = card.slug?.includes("fire");

                return (
                  <div
                    key={card.id}
                    className="rounded-md border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col justify-between group"
                  >
                    {/* Card Image Area */}
                    <div>
                      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                        <img
                          src={card.image_url || "/placeholder-product.svg"}
                          alt={card.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-end gap-2 z-10">
                          {card.badge_label && (
                            <span className="px-2 py-0.5 rounded-sm bg-white/90 backdrop-blur-xs text-[10px] font-semibold text-slate-700 shadow-xs">
                              {card.badge_label}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 sm:p-5">
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-[#0072b2] transition-colors leading-snug">
                          {card.name}
                        </h4>
                        <div
                          className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: card.description || "" }}
                        />

                        {/* Elevated Modern Features List */}
                        {(() => {
                          const validCardFeatures = (card.features || []).filter(
                            (f) => Boolean(f && (f.title?.trim() || f.description?.trim()))
                          );
                          if (validCardFeatures.length === 0) return null;

                          return (
                            <div className="mt-4 pt-3.5 border-t border-slate-100/90 space-y-2.5">
                              {validCardFeatures.slice(0, 3).map((f, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <div
                                    className={`flex h-5 w-5 rounded-xs items-center justify-center shrink-0 mt-1 border ${
                                      isFire
                                        ? "bg-red-50 border-red-100 text-red-600"
                                        : "bg-sky-50 border-sky-100 text-[#00668a]"
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
                                  </div>
                                  <div className="min-w-0 flex-1 p-2 sm:p-2.5 rounded-md bg-slate-50/90 border border-slate-200/80 hover:bg-white hover:border-sky-200 hover:shadow-2xs transition-all">
                                    {f.title?.trim() && (
                                      <span className="font-bold text-slate-900 block text-xs tracking-tight leading-snug">
                                        {f.title}
                                      </span>
                                    )}
                                    {f.description?.trim() && (
                                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                        {f.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                      {card.tier_label ? (
                        <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                          {card.tier_label}
                        </span>
                      ) : (
                        <span />
                      )}
                      <Link
                        href={`/services/${card.slug}`}
                        className={`font-bold text-xs flex items-center gap-1.5 group/btn hover:underline ${
                          isFire ? "text-red-600" : "text-[#00668a] hover:text-[#004c69]"
                        }`}
                      >
                        <span>{card.cta_label || "View Details"}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-medium text-slate-500">
                  Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                  <span className="font-semibold text-slate-800">{Math.min(currentPage * ITEMS_PER_PAGE, gridCards.length)}</span> of{" "}
                  <span className="font-semibold text-slate-800">{gridCards.length}</span> specialized services
                </span>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                  alwaysVisible={true}
                />
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}