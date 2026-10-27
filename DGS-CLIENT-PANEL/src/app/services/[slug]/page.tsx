import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  Factory,
  Flame,
  ShieldCheck,
  Radio,
  Sliders,
  CheckCircle2,
  PhoneCall,
  ArrowRight,
  Sparkles,
  Building2,
  ChevronRight,
  ShieldAlert,
  FileCheck2,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { getPublicServices, getPublicServiceBySlug } from "@/services/service/service.service";
import { BRAND } from "@/lib/brand";
import type { Service } from "@/types/service";
import { embedYouTubeVideos } from "@/lib/utils";

export const revalidate = 3600;

interface ServiceDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { services } = await getPublicServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: ServiceDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);

  if (!service) {
    return {
      title: `Service Not Found | ${BRAND.name}`,
    };
  }

  const cleanDesc = service.description
    ? service.description.replace(/<[^>]*>/g, "").slice(0, 160)
    : `Turnkey engineering specifications and regulatory compliance for ${service.name}.`;

  return {
    title: `${service.name} | ${BRAND.name}`,
    description: cleanDesc,
    openGraph: {
      title: `${service.name} | ${BRAND.name}`,
      description: cleanDesc,
      images: service.image_url ? [{ url: service.image_url }] : [],
    },
  };
}

export default async function ServiceDetailsPage({ params }: ServiceDetailsPageProps) {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const { services: allServices } = await getPublicServices();
  const sameCategoryServices = allServices.filter(
    (s) =>
      s.id !== service.id &&
      s.is_active &&
      ((service.pillar && s.pillar?.toLowerCase() === service.pillar.toLowerCase()) ||
        (service.pillar_id && s.pillar_id === service.pillar_id))
  );
  const otherServices = allServices.filter(
    (s) =>
      s.id !== service.id &&
      s.is_active &&
      !sameCategoryServices.some((c) => c.id === s.id)
  );
  const relatedServices = [...sameCategoryServices, ...otherServices].slice(0, 3);

  const phoneHref = `tel:${BRAND.contact.phone.replace(/[^0-9+]/g, "")}`;
  const isFire = service.slug?.includes("fire");

  return (
    <div className="w-full min-h-screen bg-slate-50/60 pb-20">
      
      {/* ── Breadcrumb & Navigation Bar ───────────────────────────────── */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs">
          <nav className="flex items-center gap-1.5 text-slate-500 font-medium overflow-x-auto">
            <Link href="/" className="hover:text-[#0072b2] transition-colors whitespace-nowrap">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link href="/services" className="hover:text-[#0072b2] transition-colors whitespace-nowrap">
              Services
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-xs">
              {service.name}
            </span>
          </nav>

          <Link
            href="/services"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0072b2] font-semibold transition-colors shrink-0 ml-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All Services</span>
          </Link>
        </div>
      </div>

      {/* ── Main Service Detail Container ────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-10">
        
        {/* Header Hero Card */}
        <div className="rounded-3xl border border-sky-100 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
          
          {/* Top Blue Header Strip if Flagship */}
          {service.is_flagship && (
            <div className="bg-[#0072b2] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-900 font-black text-xs shadow-xs">
                  ★
                </span>
                <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">
                  {service.category_tag || "FLAGSHIP ENGINEERING SPECIALTY • #1 TURNKEY CONTRACTOR"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white/15 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold text-white/95">
                  BNBC 2020 &amp; NFPA 58 CERTIFIED
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Visual Column */}
            <div className="lg:col-span-5 relative min-h-[340px] sm:min-h-[440px] bg-slate-900 overflow-hidden group">
              <img
                src={service.image_url || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80"}
                alt={service.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/30 pointer-events-none" />

              {/* Floating Top Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {service.badge_label && (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-white text-[11px] font-bold tracking-wider shadow-md uppercase ${
                    isFire ? "bg-red-600" : "bg-[#f95700]"
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                    <span>{service.badge_label}</span>
                  </div>
                )}
              </div>

              {/* Floating Bottom Info Pill */}
              {(service.sub_title || service.badge_status) && (
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/60 shadow-lg flex items-center justify-between gap-2">
                    {service.sub_title && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Radio className="w-4 h-4 text-[#0072b2] shrink-0 animate-pulse" />
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {service.sub_title}
                        </span>
                      </div>
                    )}
                    {service.badge_status && (
                      <span className="shrink-0 text-[10px] font-bold tracking-wider text-sky-700 bg-sky-100/90 px-2 py-0.5 rounded-md uppercase ml-auto">
                        {service.badge_status}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Info & Description Column */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
              <div>
                {/* Category & Tier Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#0072b2] border border-sky-100 text-xs font-bold tracking-wide uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    {service.pillar || "Engineering & Reticulation Systems"}
                  </span>
                  {service.tier_label && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {service.tier_label}
                    </span>
                  )}
                </div>

                {/* Service Title */}
                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {service.name}
                </h1>

                {/* Rich Text Description */}
                <div
                  className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed font-normal prose prose-slate max-w-none [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-4"
                  dangerouslySetInnerHTML={{ __html: embedYouTubeVideos(service.description) }}
                />

                {/* Dynamic Features Matrix */}
                {(() => {
                  const validFeatures = (service.features || []).filter(
                    (f) => Boolean(f && (f.title?.trim() || f.description?.trim()))
                  );
                  if (validFeatures.length === 0) return null;

                  return (
                    <div className="mt-8 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Technical Capabilities &amp; Specifications ({validFeatures.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {validFeatures.map((f, i) => (
                          <div
                            key={i}
                            className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 hover:bg-sky-50/50 hover:border-sky-200 transition-colors"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100/80 text-[#0072b2] shrink-0 mt-0.5">
                                <CheckCircle2 className="w-4 h-4 text-[#0072b2]" />
                              </div>
                              <div className="min-w-0">
                                {f.title?.trim() && (
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{f.title}</h4>
                                )}
                                {f.description?.trim() && (
                                  <p className="text-xs text-slate-600 mt-1 leading-snug">
                                    {f.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bottom Actions Row */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Compliance info */}
                {service.compliance_codes ? (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 tracking-wider">
                      {service.compliance_codes}
                    </span>
                  </div>
                ) : (
                  <div />
                )}

                {/* Primary CTA and Hotline */}
                <div className="flex items-center gap-3 ml-auto">
                  <Link
                    href={service.cta_url || `/contact?topic=${service.slug}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#f95700] hover:bg-[#ea4f00] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all group"
                  >
                    <span>{service.cta_label || "Request Audit & Blueprint"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <a
                    href={phoneHref}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-100 hover:bg-sky-200 text-[#0072b2] font-semibold text-xs sm:text-sm transition-colors"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Hotline</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Related / Other Engineering Services ───────────────────── */}
        {relatedServices.length > 0 && (
          <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wider">
                Other Specialized Gas &amp; Pipeline Networks
              </h2>
              <Link
                href="/services"
                className="text-xs font-semibold text-[#0072b2] hover:underline flex items-center gap-1"
              >
                <span>View Full Catalogue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedServices.map((card) => (
                <Link
                  key={card.id}
                  href={`/services/${card.slug}`}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-lg hover:border-sky-300 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="relative h-40 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={card.image_url || "https://images.unsplash.com/photo-1545262812-70337c768994?auto=format&fit=crop&w=800&q=80"}
                      alt={card.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0072b2] transition-colors leading-snug">
                        {card.name}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {card.description?.replace(/<[^>]*>/g, "")}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0072b2]">
                      <span>{card.tier_label || "Explore Specs"}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
