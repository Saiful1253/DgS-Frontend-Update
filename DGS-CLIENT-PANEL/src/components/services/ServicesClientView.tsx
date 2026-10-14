"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Code2,   Image as ImageIcon, 
   Megaphone,  CheckCircle2, Layers,  
  LifeBuoy, BarChart3, TrendingUp, Compass, type LucideIcon
} from "lucide-react";
import {
  PublicService,
  PublicServicePillar,
  PublicServiceGroup,
  PublicTechnology,
} from "@/types/service/service";

/** Presentation only — tab content and ordering come from the API. */
const PILLAR_ICONS: Record<string, LucideIcon> = {
  "software-development": Code2,
  "creative-services": ImageIcon,
  "digital-marketing": Megaphone,
  "managed-services-support": LifeBuoy,
  "data-analytics": BarChart3,
  "growth-conversion": TrendingUp,
  "strategy-consulting": Compass,
};

interface Props {
  initialServices: PublicService[];
  pillars: PublicServicePillar[];
  groups: PublicServiceGroup[];
  technologies: PublicTechnology[];
}

interface PillarTab {
  key: string;
  slug: string;
  label: string;
  blurb: string | null;
  /** Uploaded asset, preferred when the admin set one. */
  iconUrl: string | null;
  /** Hardcoded fallback for pillars with no upload. */
  icon: LucideIcon;
}

export default function ServicesClientView({
  initialServices,
  pillars,
  groups,
  technologies,
}: Props) {
  const [activePillar, setActivePillar] = useState<string>("");
  const [techFilter, setTechFilter] = useState<string>("All");

  const tabs = useMemo<PillarTab[]>(() => {
    const active = pillars.filter((p) => p.is_active);
    if (active.length) {
      return active
        .slice()
        // Name is the tiebreaker: pillars that were never reordered share
        // display_order, and an unstable sort would reshuffle the tabs between
        // renders and between visitors.
        .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name))
        .map((p) => ({
          key: p.name,
          slug: p.slug,
          label: p.display_label || p.name,
          blurb: p.blurb ?? null,
          iconUrl: p.icon ?? null,
          icon: PILLAR_ICONS[p.slug] ?? Layers,
        }));
    }
    // Fallback: derive tabs from the services themselves if pillars are unavailable.
    const seen = new Set<string>();
    initialServices.forEach((s) => seen.add(s.pillar));
    return Array.from(seen, (key) => ({
      key,
      slug: "",
      label: key,
      blurb: null,
      iconUrl: null,
      icon: Layers,
    }));
  }, [pillars, initialServices]);

  const currentTab = tabs.find((t) => t.key === activePillar) ?? tabs[0];

  // Pillar tabs are deep-linkable: `/services?pillar=software-development`.
  // Read from `window.location` in an effect rather than `useSearchParams` so the
  // page keeps its static rendering — `useSearchParams` would force a Suspense
  // boundary here and lose the revalidated server payload.
  useEffect(() => {
    if (tabs.length === 0) return;
    const requested = new URLSearchParams(window.location.search).get("pillar");
    if (!requested) return;
    const match =
      tabs.find((t) => t.slug === requested) ?? tabs.find((t) => t.key === requested);
    if (match && match.key !== activePillar) setActivePillar(match.key);
    // Only on mount: later tab clicks drive the state directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length]);

  // Keep the address bar in step so the tab can be shared or reloaded.
  useEffect(() => {
    if (!currentTab) return;
    const url = new URL(window.location.href);
    if (currentTab.slug) {
      if (url.searchParams.get("pillar") !== currentTab.slug) {
        url.searchParams.set("pillar", currentTab.slug);
      } else {
        return;
      }
    } else if (url.searchParams.has("pillar")) {
      url.searchParams.delete("pillar");
    } else {
      return;
    }
    window.history.replaceState(null, "", url.toString());
  }, [currentTab]);

  // Chips are derived from the published rows, so the filter list can never
  // drift from what an admin actually maintains. A hardcoded list was the bug:
  // it omitted seeded categories and matched with a fuzzy `includes`, so a chip
  // could highlight items the admin had re-categorised.
  const techCategories = useMemo(() => {
    const seen = new Set<string>();
    technologies.forEach((t) => {
      const c = t.category?.trim();
      if (c) seen.add(c);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [technologies]);

  const filteredTech =
    techFilter === "All"
      ? technologies
      : technologies.filter((t) => t.category === techFilter);

  // A category can disappear when its last technology is unpublished; fall back
  // rather than rendering an empty grid with no active chip.
  const activeTechFilter =
    techFilter === "All" || techCategories.includes(techFilter) ? techFilter : "All";

  const currentServices = currentTab
    ? initialServices.filter((s) => s.pillar === currentTab.key)
    : [];

  // Render from the API's group list, ordered by the group's own display_order
  // rather than by whichever service happened to arrive first — the section
  // sequence is an admin decision, not an accident of the service list.
  //
  // Groups are no longer inferred from the services that arrived: a group whose
  // services are all inactive (or staged with none yet) has to still have a
  // place in the sequence, otherwise it silently disappears from the page and
  // the admin cannot tell unpublished from non-existent. Ungrouped services keep
  // the "General Services" bucket, ordered last.
  const GENERAL_GROUP = "General Services";
  const groupOrder = new Map<number, { name: string; order: number }>();
  groups.forEach((g) => groupOrder.set(g.id, { name: g.name, order: g.display_order }));

  const buckets = new Map<number, PublicService[]>();
  const ungrouped: PublicService[] = [];
  currentServices.forEach((s) => {
    if (s.group_id == null) {
      ungrouped.push(s);
      return;
    }
    if (!buckets.has(s.group_id)) buckets.set(s.group_id, []);
    buckets.get(s.group_id)!.push(s);
  });

  const orderedGroups = [...buckets.entries()]
    .map(([id, items]) => ({
      name: groupOrder.get(id)?.name ?? items[0]?.group?.name ?? GENERAL_GROUP,
      order: groupOrder.get(id)?.order ?? Number.MAX_SAFE_INTEGER,
      items,
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  if (ungrouped.length > 0) {
    orderedGroups.push({ name: GENERAL_GROUP, order: Number.MAX_SAFE_INTEGER, items: ungrouped });
  }


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Header */}
      <section className="relative pt-32 pb-16 bg-gradient-to-b from-slate-900/90 to-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4">
            Service Capabilities
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 uppercase">
            WHAT SERVICES DO YOU NEED?
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Find the most suitable solution tailored to your business goals. Choose across software engineering, creative production, and growth marketing.
          </p>
        </div>
      </section>

      {/* Interactive 3-Tab Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap justify-center gap-3 p-2 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-3xl mx-auto mb-12">
          {tabs.map((p, i) => {
            const Icon = p.icon;
            const isActive = currentTab?.key === p.key;
            return (
              <button
                key={p.slug || p.key}
                onClick={() => setActivePillar(p.key)}
                className={`flex-1 min-w-[200px] py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isActive
                    ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {p.iconUrl ? (
                  // Uploaded icons are arbitrary artwork: a dark logo vanishes on
                  // the dark bar and a light one vanishes on the active cyan tab.
                  // A near-white chip keeps the icon legible in both states
                  // without discarding its own colours.
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/90 p-[3px]">
                    <Image
                      src={p.iconUrl}
                      alt=""
                      width={16}
                      height={16}
                      className="h-full w-full object-contain"
                    />
                  </span>
                ) : (
                  <Icon className="w-4 h-4 shrink-0" />
                )}
                {`${i + 1}. ${p.label}`}
              </button>
            );
          })}
        </div>

        {/* Active Pillar Overview */}
        {currentTab?.blurb && (
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {currentTab.label}
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              {currentTab.blurb}
            </p>
          </div>
        )}

        {/* Dynamic Groups Grid */}
        <div className="space-y-12 animate-in fade-in duration-300">
          {orderedGroups.length === 0 && (
            <p className="text-center text-slate-500 py-12">
              No services are currently listed under this pillar.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {orderedGroups.map(({ name: groupName, items }, idx) => {
              const borderColors = [
                "hover:border-cyan-500/40",
                "hover:border-blue-500/40",
                "hover:border-purple-500/40",
                "hover:border-emerald-500/40",
              ];
              const iconColors = [
                "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
                "bg-blue-500/10 border-blue-500/20 text-blue-400",
                "bg-purple-500/10 border-purple-500/20 text-purple-400",
                "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
              ];
              const colorIdx = idx % borderColors.length;

              return (
                <div
                  key={groupName}
                  className={`p-8 rounded-2xl bg-slate-900/60 border border-slate-800 ${borderColors[colorIdx]} transition-all flex flex-col justify-between`}
                >
                  <div>
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 ${iconColors[colorIdx]}`}>
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{groupName}</h3>
                    <ul className="space-y-4 text-sm text-slate-400">
                      {items.map((srv) => (
                        <li key={srv.id} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                          <div>
                            <strong className="text-slate-200 block">{srv.name}</strong>
                            <p className="text-xs text-slate-400 mt-0.5">{srv.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-800/80">
                    <Link
                      href="/contact"
                      className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      Request Quote & Consultation →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Industries We Served */}
        {/*
          Fixed marketing copy from the SRS, not an admin-managed list. The only
          industry data in the database is `products_saas.industry_focus`, which
          belongs to the separate SaaS module and is not part of this page, so
          there is nothing to sync from. Modelling these as a table would give
          admins edit rights the SRS never asked for.
        */}
        <div className="mt-20 pt-16 border-t border-slate-800">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">INDUSTRIES WE SERVED</h2>
            <p className="text-slate-400 text-sm">
              Proven delivery across regulated, high-stakes, and fast-moving sectors
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
            {[
              "Fashion & Luxury",
              "Creative & Design",
              "Retail & eCommerce",
              "Energy & Utilities",
              "Healthcare",
              "Finance & FinTech",
              "Real Estate & Architecture",
              "Hospitality",
              "Manufacturing",
              "Education",
              "Logistics",
              "Government",
              "Startups & SMEs",
            ].map((industry) => (
              <span
                key={industry}
                className="px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800 text-xs font-medium text-slate-300"
              >
                {industry}
              </span>
            ))}
            <span className="px-4 py-2 text-xs font-semibold text-cyan-400">
              + Many more
            </span>
          </div>
        </div>

        {/* Tech Stack Showcase */}
        <div className="mt-20 pt-16 border-t border-slate-800">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">MODERN TECHNOLOGY STACK</h2>
            <p className="text-slate-400 text-sm">Engineered with high-performance tools and framework ecosystems</p>
          </div>

          {techCategories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {["All", ...techCategories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTechFilter(cat)}
                  aria-pressed={activeTechFilter === cat}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTechFilter === cat
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filteredTech.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
              {filteredTech.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center hover:border-slate-700 transition-all"
                >
                  <p className="text-xs font-semibold text-slate-200">{t.name}</p>
                  {t.proficiency_tagline && (
                    <p className="text-[10px] text-cyan-400/80 mt-0.5">{t.proficiency_tagline}</p>
                  )}
                  <p className="text-[10px] text-slate-500 mt-0.5">{t.category}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500">
              No technologies published yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
