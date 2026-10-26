/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  FileText,
  ImageIcon,
  Plus,
  Search,
  ShieldCheck,
  Star,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppPagination } from "@/components/common/app-pagination";
import SortableGrid from "@/components/common/sortable-grid";
import { assignSlotOrders, toReorderPayload } from "@/lib/service-order";
import { cn } from "@/lib/utils";
import {
  deleteCertificate,
  reorderCertificates,
  updateCertificate,
} from "@/services/certificate/certificate.service";
import type {
  Certificate,
  CertificateListMeta,
  CertificateListQuery,
  CertificateStats,
} from "@/types/certificate";
import CertificateCard from "./certificate-card";
import CertificateFormModal from "./modals/certificate-form-modal";
import CertificateImageModal from "./modals/certificate-image-modal";

const SORT_LABELS: Record<string, string> = {
  display_order: "Display Order",
  title: "Title",
  year: "Year",
  reg_no: "Registration No.",
  issuing_authority: "Issuing Authority",
  created_at: "Date Added",
};

const ALL = "all";

function buildUrl(query: CertificateListQuery, overrides: Partial<CertificateListQuery> = {}) {
  const merged: CertificateListQuery = { ...query, ...overrides };
  const params = new URLSearchParams();

  if (merged.page && merged.page > 1) params.set("page", String(merged.page));
  if (merged.limit && merged.limit !== 10) params.set("limit", String(merged.limit));
  if (merged.search) params.set("search", merged.search);
  if (merged.sortBy && merged.sortBy !== "display_order") {
    params.set("sortBy", merged.sortBy);
  }
  if (merged.sortOrder && merged.sortOrder !== "asc") {
    params.set("sortOrder", merged.sortOrder);
  }
  if (typeof merged.is_active === "boolean") params.set("is_active", String(merged.is_active));
  if (typeof merged.is_featured === "boolean") {
    params.set("is_featured", String(merged.is_featured));
  }
  if (merged.file_type) params.set("file_type", merged.file_type);

  const qs = params.toString();
  return qs ? `/certificates?${qs}` : "/certificates";
}

interface Props {
  initialCertificates: Certificate[];
  meta: CertificateListMeta;
  query: CertificateListQuery;
  initialStats: CertificateStats;
}

export default function CertificatesManager({
  initialCertificates,
  meta,
  query,
  initialStats,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Local certificates list state for optimistic drag & drop reorder
  const [certificatesList, setCertificatesList] = useState<Certificate[]>(initialCertificates);
  const [reordering, setReordering] = useState(false);

  // Search & Filter drafts (matching ServicesManager pattern)
  const [searchDraft, setSearchDraft] = useState(query.search ?? "");
  const [statusDraft, setStatusDraft] = useState<string>(
    typeof query.is_active === "boolean" ? String(query.is_active) : ALL
  );
  const [featuredDraft, setFeaturedDraft] = useState<string>(
    typeof query.is_featured === "boolean" ? String(query.is_featured) : ALL
  );
  const [fileTypeDraft, setFileTypeDraft] = useState<string>(query.file_type ?? ALL);
  const [sortDraft, setSortDraft] = useState<string>(query.sortBy ?? "display_order");
  const [orderDraft, setOrderDraft] = useState<"asc" | "desc">(query.sortOrder ?? "asc");

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [deletingCert, setDeletingCert] = useState<Certificate | null>(null);
  const [removing, setRemoving] = useState(false);

  // Separate media viewer modal state
  const [activeMedia, setActiveMedia] = useState<{
    fileUrl: string;
    thumbUrl?: string | null;
    fileType?: "image" | "pdf";
    title?: string;
  } | null>(null);

  useEffect(() => {
    setCertificatesList(initialCertificates);
  }, [initialCertificates]);

  useEffect(() => {
    setSearchDraft(query.search ?? "");
    setStatusDraft(typeof query.is_active === "boolean" ? String(query.is_active) : ALL);
    setFeaturedDraft(typeof query.is_featured === "boolean" ? String(query.is_featured) : ALL);
    setFileTypeDraft(query.file_type ?? ALL);
    setSortDraft(query.sortBy ?? "display_order");
    setOrderDraft(query.sortOrder ?? "asc");
  }, [query]);

  const handleApplyFilters = () => {
    startTransition(() => {
      router.push(
        buildUrl(query, {
          page: 1,
          search: searchDraft.trim() || undefined,
          is_active: statusDraft === ALL ? undefined : statusDraft === "true",
          is_featured: featuredDraft === ALL ? undefined : featuredDraft === "true",
          file_type: fileTypeDraft === ALL ? undefined : (fileTypeDraft as "image" | "pdf"),
          sortBy: sortDraft as any,
          sortOrder: orderDraft,
        })
      );
    });
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setStatusDraft(ALL);
    setFeaturedDraft(ALL);
    setFileTypeDraft(ALL);
    setSortDraft("display_order");
    setOrderDraft("asc");
    startTransition(() => {
      router.push("/certificates");
    });
  };

  const hasActiveFilters = Boolean(
    query.search ||
      typeof query.is_active === "boolean" ||
      typeof query.is_featured === "boolean" ||
      query.file_type ||
      (query.sortBy && query.sortBy !== "display_order") ||
      (query.sortOrder && query.sortOrder !== "asc")
  );

  // Drag and drop reordering using slot-preserving assignment
  const handleReorder = async (newList: Certificate[]) => {
    const updatedList = assignSlotOrders(certificatesList, newList);
    setCertificatesList(updatedList);

    if (!reordering) {
      setReordering(true);
      const payload = toReorderPayload(updatedList);

      const loadingToast = toast.loading("Saving certification display order...");
      try {
        const res = await reorderCertificates(payload);
        if (res.success) {
          toast.success(res.message || "Certifications reordered successfully", { id: loadingToast });
          router.refresh();
        } else {
          toast.error(res.message || "Failed to reorder certifications", { id: loadingToast });
        }
      } catch {
        toast.error("Failed to persist display order", { id: loadingToast });
      } finally {
        setReordering(false);
      }
    }
  };

  // Quick manual order adjustment from card badge
  const handleQuickOrderUpdate = async (certId: number, newOrder: number) => {
    const updatedList = certificatesList.map((c) =>
      c.id === certId ? { ...c, display_order: newOrder } : c
    );
    setCertificatesList(updatedList);

    const payload = [{ id: certId, display_order: newOrder }];
    const loadingToast = toast.loading("Updating certification order...");
    try {
      const res = await reorderCertificates(payload);
      if (res.success) {
        toast.success(`Updated order to ${newOrder}`, { id: loadingToast });
        router.refresh();
      } else {
        toast.error(res.message || "Failed to update order", { id: loadingToast });
      }
    } catch {
      toast.error("Failed to update display order", { id: loadingToast });
    }
  };

  // Delete certificate handler
  const confirmDelete = async () => {
    if (!deletingCert || removing) return;
    setRemoving(true);
    try {
      const res = await deleteCertificate(deletingCert.id);
      if (!res.success) {
        toast.error(res.message || "Failed to delete certificate");
        return;
      }
      setCertificatesList((prev) => prev.filter((c) => c.id !== deletingCert.id));
      toast.success("Certificate deleted successfully");
      setDeletingCert(null);
      router.refresh();
    } finally {
      setRemoving(false);
    }
  };

  const handleSaved = (saved: Certificate) => {
    if (editingCert) {
      setCertificatesList((prev) => prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c)));
    }
    router.refresh();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner (Matching ServicesManager) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-bold tracking-wider text-[#00668a] uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span className="truncate">MODULE: CERTIFICATIONS &amp; REGULATORY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words flex items-center gap-2">
            <Award className="h-6 w-6 text-[#00668a]" />
            Certifications &amp; Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage government &amp; regulatory licences, awards, and compliance documents shown on the storefront.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <Button
            onClick={() => {
              setEditingCert(null);
              setFormOpen(true);
            }}
            className="h-10 px-4 w-full sm:w-auto bg-[#00668a] hover:bg-[#004c69] text-white text-xs font-bold gap-1.5 shadow-xs transition-all flex items-center justify-center rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>New Certification</span>
          </Button>
        </div>
      </div>

      {/* 2. Stat Cards (Matching ServicesManager 4-card grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Certifications</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{initialStats.total}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6eff6] text-[#00668a]">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Licenses</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{initialStats.active}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Featured On Storefront</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1">{initialStats.featured}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Star className="h-5 w-5 fill-amber-500" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inactive Licenses</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-500 mt-1">{initialStats.inactive}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls (Matching ServicesManager design) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 flex-wrap">
          {/* File Type Filter */}
          <div className="w-full sm:w-40 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              File Type :
            </label>
            <div className="relative">
              <select
                value={fileTypeDraft}
                onChange={(e) => setFileTypeDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
              >
                <option value={ALL}>All File Types</option>
                <option value="image">Image Only</option>
                <option value="pdf">PDF Only</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Featured Filter */}
          <div className="w-full sm:w-40 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              Featured Filter :
            </label>
            <div className="relative">
              <select
                value={featuredDraft}
                onChange={(e) => setFeaturedDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
              >
                <option value={ALL}>Featured &amp; Not</option>
                <option value="true">Featured Only</option>
                <option value="false">Not Featured</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              Status Filter :
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
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
              >
                <option value={ALL}>All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Sort By Filter */}
          <div className="w-full sm:w-52 shrink-0 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center h-4">
              Sort By :
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <select
                  value={sortDraft}
                  onChange={(e) => setSortDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyFilters();
                    }
                  }}
                  className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#00668a]/20 focus:border-[#00668a] transition-all cursor-pointer truncate"
                >
                  {Object.entries(SORT_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOrderDraft(orderDraft === "asc" ? "desc" : "asc")}
                className="h-10 px-2.5 border-slate-200 text-xs font-bold text-slate-700 font-mono shadow-2xs bg-white"
                title="Toggle sort order"
              >
                {orderDraft.toUpperCase()}
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex-1 min-w-[220px] space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 h-4">
              <Search className="w-3.5 h-3.5 text-[#00668a]" />
              <span>Search Certifications :</span>
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
                placeholder="Search by title, registration no., authority..."
                className="h-10 text-xs font-semibold pl-3.5 pr-8 border-slate-200 w-full bg-white shadow-2xs"
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => setSearchDraft("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Search & Clear Buttons */}
          <div className="w-full lg:w-auto flex items-center gap-2 shrink-0">
            <div className="hidden lg:block h-4" />
            <div className="flex items-center gap-2 w-full">
              <Button
                type="button"
                onClick={handleApplyFilters}
                className="h-10 px-4 bg-[#00668a] text-white hover:bg-[#004c69] text-xs font-bold gap-1.5 shadow-xs transition-all w-full lg:w-auto justify-center flex-1 lg:flex-initial"
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
      </div>

      {/* 4. Certification Cards Grid (Drag & Drop with SortableGrid) */}
      {certificatesList.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Award className="h-6 w-6 text-[#00668a]" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900">
            {hasActiveFilters ? "No certifications match search criteria" : "No certifications added yet"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting search terms, file type or status filters to view records."
              : "Upload government approvals or compliance licenses to feature on the website."}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <SortableGrid
          items={certificatesList}
          getKey={(c) => c.id}
          onReorder={handleReorder}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch"
        >
          {(cert, { isDragging, isOver, rootProps, handleProps }) => (
            <CertificateCard
              certificate={cert}
              rootProps={rootProps}
              dragHandleProps={handleProps}
              onEdit={(c) => {
                setEditingCert(c);
                setFormOpen(true);
              }}
              onDelete={(c) => setDeletingCert(c)}
              onOpenImage={(media) => setActiveMedia(media)}
              onQuickOrderUpdate={handleQuickOrderUpdate}
              isDragging={isDragging}
              isTarget={isOver}
            />
          )}
        </SortableGrid>
      )}

      {/* 5. Pagination Bar */}
      {meta.total > 0 && (
        <AppPagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          itemLabel="certifications"
          appliedPath={(p) => buildUrl(query, { page: p })}
          pageSize={meta.limit}
          onPageSizeChange={(size) => {
            startTransition(() => {
              router.push(buildUrl(query, { limit: size, page: 1 }));
            });
          }}
          scroll={false}
        />
      )}

      {/* Create / Edit Form Modal */}
      <CertificateFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        certificate={editingCert}
        nextDisplayOrder={certificatesList.length + 1}
        onSaved={handleSaved}
      />

      {/* Full-size Media / PDF Lightbox Modal */}
      <CertificateImageModal
        open={Boolean(activeMedia)}
        onOpenChange={(open) => !open && setActiveMedia(null)}
        fileUrl={activeMedia?.fileUrl}
        thumbUrl={activeMedia?.thumbUrl}
        fileType={activeMedia?.fileType}
        title={activeMedia?.title}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deletingCert)}
        onOpenChange={(open) => !open && setDeletingCert(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this certification?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deletingCert?.title}” will be permanently removed from the website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {removing ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}