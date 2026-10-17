/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  X,
  PanelsTopLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppPagination } from "@/components/common/app-pagination";
import { HeroSection, HeroImageOps } from "@/types/hero";
import {
  createHero,
  updateHero,
  uploadHeroMedia,
  addHeroMediaUrl,
  deleteHeroMedia,
  replaceHeroMedia,
  updateMediaMetadata,
  reorderHeroMedia,
  listHeroes,
} from "@/services/hero/hero.service";
import AddHeroModal from "./modals/create-hero-modal";
import HeroCard from "./hero-card";

interface HeroManagerProps {
  initialHeroes: HeroSection[];
  autoOpenCreate?: boolean;
}

export default function HeroManager({
  initialHeroes,
}: HeroManagerProps) {
  const router = useRouter();
  const [heroes, setHeroes] = useState<HeroSection[]>(initialHeroes);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Array.isArray(initialHeroes)) {
      setHeroes(initialHeroes);
    }
  }, [initialHeroes]);

  // Search & Filter State
  const [searchDraft, setSearchDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({ search: "", status: "all" });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const handleApplyFilters = () => {
    setAppliedFilters({ search: searchDraft.trim(), status: statusDraft });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setStatusDraft("all");
    setAppliedFilters({ search: "", status: "all" });
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
    appliedFilters.status !== "all" ||
    searchDraft.trim() ||
    statusDraft !== "all"
  );

  const isFilterPending =
    searchDraft.trim() !== appliedFilters.search ||
    statusDraft !== appliedFilters.status;

  const totalSections = heroes.length;
  const activeCount = heroes.filter((h) => h.status === "active").length;
  const inactiveCount = heroes.filter((h) => h.status === "inactive").length;
  const draftCount = heroes.filter((h) => h.status === "draft").length;
  const totalMedia = heroes.reduce(
    (sum, h) => sum + (Array.isArray(h.media) ? h.media.length : 0),
    0
  );

  const filteredHeroes = useMemo(() => {
    const tokens = appliedFilters.search
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return heroes.filter((h) => {
      const matchesStatus = appliedFilters.status === "all" || h.status === appliedFilters.status;
      const haystack = [h.headline, h.sub_headline, h.primary_cta_label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const words = haystack.split(/\s+/);
      const matchesSearch =
        tokens.length === 0 || tokens.every((t) => words.some((w) => w.startsWith(t)));
      return matchesStatus && matchesSearch;
    });
  }, [heroes, appliedFilters]);

  const totalItems = filteredHeroes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (validCurrentPage - 1) * pageSize;
  const paginatedHeroes = filteredHeroes.slice(startIdx, startIdx + pageSize);

  // Uniform card height synchronization
  const [cardHeights, setCardHeights] = useState<Record<string | number, number>>({});

  const handleMeasureHeight = useCallback((id: string | number, height: number) => {
    setCardHeights((prev) => {
      if (prev[id] === height) return prev;
      return { ...prev, [id]: height };
    });
  }, []);

  const uniformCardHeight = useMemo(() => {
    const currentHeroIds = paginatedHeroes.map((h) => h.id);
    const heights = currentHeroIds.map((id) => cardHeights[id]).filter(Boolean);
    if (heights.length === 0) return 240;
    return Math.max(240, ...heights);
  }, [paginatedHeroes, cardHeights]);

  // ── Hero Transaction Handlers ─────────────────────────────

  const handleHeroStatusExclusive = async (id: string | number, currentHeroes: any[]) => {
    const otherActive = currentHeroes.filter((h) => h.id !== id && h.status === "active");
    if (otherActive.length > 0) {
      await Promise.all(otherActive.map((h) => updateHero(h.id, { status: "inactive" })));
    }
  };

  const refreshHeroes = async () => {
    try {
      const res = await listHeroes(1, 100);
      if (res?.success) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        setHeroes(list);
      }
    } catch (e) {
      console.error("refreshHeroes error:", e);
    }
  };

  const handleAddHero = async (
    data: any,
    images: { tempId: string; file: File; is_active: boolean }[],
    videos: { tempId: string; media_url: string; is_active: boolean }[],
    order: { tempId: string; type: string; is_active: boolean }[],
  ): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    const loading = toast.loading("Creating hero section...");

    let newId: string | number | null = null;

    try {
      const res = await createHero(data);
      if (!res.success) {
        toast.error(res.message || "Failed to create hero", { id: loading });
        return false;
      }

      newId = res.data.id;

      try {
        const idMap: Record<string, number> = {};

        if (images.length > 0) {
          toast.loading("Uploading media assets...", { id: loading });
          const formData = new FormData();
          images.forEach((img) => formData.append("files", img.file));

          const mediaRes = await uploadHeroMedia(newId!, formData);
          if (!mediaRes.success) throw new Error(mediaRes.message || "Media upload failed");

          const uploadedMedia: any[] = mediaRes.data || [];
          images.forEach((img, idx) => {
            const realId = uploadedMedia[idx]?.id ?? uploadedMedia[idx]?.data?.id;
            if (realId != null) idMap[img.tempId] = realId;
          });
        }

        for (const v of videos) {
          const vres = await addHeroMediaUrl(newId!, { media_url: v.media_url, media_type: "youtube", is_active: v.is_active });
          if (!vres.success) throw new Error(vres.message || "Failed to add video");
          const vId = vres.data?.id ?? vres.data?.data?.id;
          if (vId != null) idMap[v.tempId] = vId;
        }

        const ordered = order
          .map((o) => {
            const realId = idMap[o.tempId];
            return realId == null ? null : { id: realId, is_active: o.is_active };
          })
          .filter((x: any) => x != null);

        if (ordered.length > 0) {
          const metadataTasks = ordered.map((o: any) => updateMediaMetadata(o.id, { is_active: o.is_active }));
          await Promise.all(metadataTasks);

          const sortData = ordered.map((o: any, idx: number) => ({ id: o.id, sort_order: idx }));
          const ores = await reorderHeroMedia(newId!, sortData);
          if (!ores.success) throw new Error(ores.message || "Failed to reorder media");
        }
      } catch (mediaErr: any) {
        if (newId) {
          toast.loading("Media failed. Rolling back creation...", { id: loading });
          await deleteHeroMedia(newId as any);
        }
        throw mediaErr;
      }

      if (data.status === "active") {
        await handleHeroStatusExclusive(newId!, heroes);
      }

      toast.success("Hero section created successfully", { id: loading });
      await refreshHeroes();
      router.refresh();
      return true;
    } catch (err: any) {
      console.error("Hero Transaction Error:", err);
      toast.error(err.message || "An unexpected error occurred", { id: loading });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleHeroUpdate = async (id: string | number, data: any, ops: HeroImageOps): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);

    // Optimistically update status/fields immediately
    setHeroes((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          return { ...h, ...data };
        }
        if (data.status === "active") {
          return { ...h, status: "inactive" };
        }
        return h;
      })
    );

    const hasMediaChanges =
      ops.imagesToDelete.length > 0 ||
      ops.imagesToReplace.length > 0 ||
      ops.imagesToAdd.length > 0 ||
      (ops.videosToAdd || []).length > 0 ||
      Boolean(ops.newOrder && ops.newOrder.length > 0);

    const loading = toast.loading(
      hasMediaChanges ? "Updating hero section..." : "Updating status..."
    );

    try {
      if (data.status === "active") {
        await handleHeroStatusExclusive(id, heroes);
      }

      const res = await updateHero(id, data);
      if (!res.success) {
        toast.error(res.message || "Failed to update hero", { id: loading });
        await refreshHeroes();
        return false;
      }

      if (hasMediaChanges) {
        try {
          toast.loading("Processing media changes...", { id: loading });

          const idMap: Record<string, number> = {};

          for (const mid of ops.imagesToDelete) {
            const dres = await deleteHeroMedia(mid);
            if (!dres.success) throw new Error(dres.message || "Failed to delete media");
          }

          for (const r of ops.imagesToReplace) {
            const formData = new FormData();
            formData.append("file", r.file);
            const rres = await replaceHeroMedia(id, r.id, formData);
            if (!rres.success) throw new Error(rres.message || "Failed to replace media");

            await updateMediaMetadata(r.id, { is_active: r.is_active });
          }

          if (ops.imagesToAdd.length > 0) {
            const formData = new FormData();
            ops.imagesToAdd.forEach((img: any) => formData.append("files", img.file));
            const ares = await uploadHeroMedia(id, formData);
            if (!ares.success) throw new Error(ares.message || "Failed to add media");
            const uploaded: any[] = ares.data || [];
            ops.imagesToAdd.forEach((img: any, i: number) => {
              const realId = uploaded[i]?.id ?? uploaded[i]?.data?.id;
              if (realId != null) idMap[img.tempId] = realId;
            });
          }

          for (const v of ops.videosToAdd || []) {
            const vres = await addHeroMediaUrl(id, { media_url: v.media_url, media_type: "youtube", is_active: v.is_active });
            if (!vres.success) throw new Error(vres.message || "Failed to add video");
            const vId = vres.data?.id ?? vres.data?.data?.id;
            if (vId != null) idMap[v.tempId] = vId;
          }

          if (ops.newOrder) {
            const ordered = ops.newOrder
              .map((item: any) => {
                let resolved = typeof item.id === "number" ? item.id : undefined;
                if (resolved == null) resolved = idMap[item.id];
                if (resolved == null && typeof item.id === "string" && !item.id.startsWith("new-") && !item.id.startsWith("yt-")) {
                  resolved = item.id;
                }
                return resolved == null ? null : { id: resolved, is_active: item.is_active };
              })
              .filter((x: any) => x != null);

            if (ordered.length > 0) {
              const metadataTasks = ordered.map((o: any) => updateMediaMetadata(o.id, { is_active: o.is_active }));
              await Promise.all(metadataTasks);

              const sortData = ordered.map((o: any, idx: number) => ({ id: o.id, sort_order: idx }));
              const ores = await reorderHeroMedia(id, sortData);
              if (!ores.success) throw new Error(ores.message || "Failed to reorder media");
            }
          }
        } catch (mediaErr: any) {
          console.error("Hero media processing failure:", mediaErr);
          toast.error(mediaErr.message || "Hero info updated, but media updates failed", { id: loading });
          await refreshHeroes();
          return false;
        }
      }

      toast.success(hasMediaChanges ? "Hero section updated successfully" : "Status updated successfully", { id: loading });
      await refreshHeroes();
      router.refresh();
      return true;
    } catch (err: any) {
      console.error("Hero update failed:", err);
      toast.error(err.message || "An unexpected error occurred", { id: loading });
      await refreshHeroes();
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-bold tracking-wider text-primary uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span className="truncate">MODULE 2: HERO SECTIONS MANAGER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            Hero Sections Manager
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AddHeroModal onAddHero={handleAddHero} />
        </div>
      </div>

      {/* 2. Purpose Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
          PURPOSE
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-5xl">
          Manages homepage hero slider sections, promotional banners, primary/secondary call-to-actions,
          and draggable image/video media queues powering the featured homepage carousel.
        </p>
      </div>

      {/* 3. Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Hero Sections
          </span>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalSections}</div>
          <p className="text-xs text-slate-500 font-medium">Configured banners</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Sliders
          </span>
          <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">{activeCount}</div>
          <p className="text-xs text-slate-500 font-medium">Live on homepage</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Inactive Sections
          </span>
          <div className="text-3xl font-extrabold text-amber-600 tracking-tight">{inactiveCount}</div>
          <p className="text-xs text-slate-500 font-medium">Hidden from site</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Draft Sections
          </span>
          <div className="text-3xl font-extrabold text-slate-500 tracking-tight">{draftCount}</div>
          <p className="text-xs text-slate-500 font-medium">In preparation</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Media Assets
          </span>
          <div className="text-3xl font-extrabold text-primary tracking-tight">{totalMedia}</div>
          <p className="text-xs text-slate-500 font-medium">Images & videos</p>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3">
          {/* Status Dropdown */}
          <div className="w-full sm:w-44 lg:w-44 shrink-0 space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Status :
            </label>
            <div className="relative">
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer truncate"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="draft">Draft Only</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex-1 min-w-[220px] space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-primary" />
              <span>Search Hero Content :</span>
            </label>
            <div className="relative">
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                placeholder="Search by headline, sub-headline, CTA labels..."
                className="h-10 text-xs font-semibold pl-3.5 pr-8 border-slate-200 w-full"
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => setSearchDraft("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  title="Clear search input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full lg:w-auto flex items-center gap-2 shrink-0 pt-1 lg:pt-0">
            <Button
              type="button"
              onClick={handleApplyFilters}
              className={cn(
                "h-10 px-4 bg-primary text-white hover:bg-primary/90 text-xs font-bold gap-1.5 shadow-xs transition-all w-full lg:w-auto justify-center flex-1 lg:flex-initial",
                isFilterPending && "ring-2 ring-primary/40 ring-offset-1"
              )}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="h-10 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border-transparent text-slate-700 gap-1 transition-colors shrink-0 whitespace-nowrap"
                title="Reset all filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Hero Slider Grid */}
      {paginatedHeroes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-mist text-primary flex items-center justify-center mx-auto border border-primary/20">
            <PanelsTopLeft className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Hero Sections Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "No hero sections match your current search and filter criteria. Try adjusting or clearing your filters."
              : "No hero sections have been created yet. Click below to add your first homepage banner."}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="border-slate-200 text-xs font-semibold"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                <span>Clear Filters</span>
              </Button>
            )}
            {(
              <AddHeroModal onAddHero={handleAddHero} />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedHeroes.map((hero) => (
              <HeroCard
                key={hero.id}
                hero={hero}
                hasManageAccess={true}
                onUpdate={handleHeroUpdate}
                onDeleted={async () => {
                  setHeroes((prev) => prev.filter((h) => h.id !== hero.id));
                  await refreshHeroes();
                  router.refresh();
                }}
                cardHeight={uniformCardHeight}
                onMeasureHeight={handleMeasureHeight}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <AppPagination
            page={validCurrentPage}
            totalPages={totalPages}
            total={totalItems}
            itemLabel="hero sections"
            appliedPath={() => "#"}
            onPageChange={(p) => setCurrentPage(p)}
            pageSize={pageSize}
            onPageSizeChange={(v) => {
              setPageSize(v);
              setCurrentPage(1);
            }}
            pageSizeOptions={[6, 9, 12, 24]}
          />
        </div>
      )}
    </div>
  );
}