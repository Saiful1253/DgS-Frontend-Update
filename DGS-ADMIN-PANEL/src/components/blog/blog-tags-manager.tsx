/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Tag, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { AppPagination } from "@/components/common/app-pagination";
import { cn } from "@/lib/utils";
import {
  createBlogTag,
  updateBlogTag,
} from "@/services/blog/blog.service";
import DeleteTagDialog from "./modals/tag/delete-tag-dialog";

const RECENT_DAYS = 30;

const tagUses = (t: any) => Number(t.usages ?? t.posts_count ?? 0);

interface BlogTagsManagerProps {
  initialItems: any[];
}

export default function BlogTagsManager({ initialItems }: BlogTagsManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>(initialItems);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{ id: string | number | null; name: string }>({ id: null, name: "" });
  const [busy, setBusy] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  // Filter / Search / Sort / Pagination State
  const [searchDraft, setSearchDraft] = useState("");
  const [filterDraft, setFilterDraft] = useState("all");
  const [sortDraft, setSortDraft] = useState("recent");
  const [applied, setApplied] = useState({ search: "", filter: "all", sort: "recent" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isEditing = form.id !== null;

  const refresh = async () => {
    const { listBlogTags } = await import("@/services/blog/blog.service");
    const res = await listBlogTags();
    if (res.success) setItems(res.data ?? []);
    router.refresh();
  };

  const openAdd = () => {
    setForm({ id: null, name: "" });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (tag: any) => {
    setForm({ id: tag.id, name: tag.name });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (busy) return;
    setFormErrors({});
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (busy) return;
    if (!form.name.trim()) {
      setFormErrors({ name: "Tag name is required" });
      return;
    }
    setBusy(true);
    const loading = toast.loading(isEditing ? "Saving changes..." : "Creating tag...");
    try {
      const res = isEditing
        ? await updateBlogTag(form.id!, form.name.trim())
        : await createBlogTag(form.name.trim());
      if (res.success) {
        toast.success(res.message || (isEditing ? "Tag updated" : "Tag created"), { id: loading });
        setModalOpen(false);
        await refresh();
      } else {
        toast.error(res.message || "Failed to save", { id: loading });
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred", { id: loading });
    } finally {
      setBusy(false);
    }
  };

  const handleApplyFilters = () => {
    setApplied({ search: searchDraft.trim(), filter: filterDraft, sort: sortDraft });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setFilterDraft("all");
    setSortDraft("recent");
    setApplied({ search: "", filter: "all", sort: "recent" });
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(applied.search || applied.filter !== "all");
  const isFilterPending =
    searchDraft.trim() !== applied.search ||
    filterDraft !== applied.filter ||
    sortDraft !== applied.sort;

  // Stats
  const totalCount = items.length;
  const usedCount = items.filter((t) => tagUses(t) > 0).length;
  const sumLinks = items.reduce((acc, t) => acc + tagUses(t), 0);
  const recentCount = items.filter((t) => {
    const d = new Date(t.created_at);
    return !isNaN(d.getTime()) && Date.now() - d.getTime() <= RECENT_DAYS * 24 * 60 * 60 * 1000;
  }).length;

  const statCards = [
    { label: "Total Tags", value: totalCount, sub: "Global registry", color: "text-slate-900" },
    { label: "Tags In Use", value: usedCount, sub: "Linked to blog posts", color: "text-emerald-600" },
    { label: "Total Post Links", value: sumLinks, sub: "Post–tag associations", color: "text-primary" },
    { label: "Recently Added", value: recentCount, sub: `Last ${RECENT_DAYS} days`, color: "text-amber-600" },
  ];

  // Filtered + sorted + paginated
  const filtered = useMemo(() => {
    const q = applied.search.toLowerCase();
    const base = q
      ? items.filter((t) => String(t.name || "").toLowerCase().includes(q) || String(t.slug || "").toLowerCase().includes(q))
      : items;
    const locals = applied.filter === "all"
      ? base
      : applied.filter === "used"
        ? base.filter((t) => tagUses(t) > 0)
        : base.filter((t) => tagUses(t) === 0);
    const sorted = [...locals];
    switch (applied.sort) {
      case "oldest":
        sorted.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
        break;
      case "az":
        sorted.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        break;
      case "za":
        sorted.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
        break;
      case "most":
        sorted.sort((a, b) => tagUses(b) - tagUses(a));
        break;
      default:
        sorted.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    }
    return sorted;
  }, [items, applied]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (validCurrentPage - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-bold tracking-wider text-primary uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span className="truncate">GLOBAL TAG REGISTRY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">Blog Tags</h1>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          {(
            <Button onClick={openAdd} className="h-10 px-4 w-full sm:w-auto bg-primary text-white hover:bg-primary/90 font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Add Tag</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Purpose Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">PURPOSE</h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-5xl">
          Shared tag registry used across blog posts for search, filtering, and related-article matching — tags created here are reused by the Articles editor.
        </p>
      </div>

      {/* 3. Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
            <div className={cn("text-3xl font-extrabold tracking-tight", s.color)}>{s.value}</div>
            <p className="text-xs text-slate-500 font-medium">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3">
          {/* Usage Filter Dropdown */}
          <div className="w-full sm:w-44 lg:w-44 shrink-0 space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Status :</label>
            <div className="relative">
              <select
                value={filterDraft}
                onChange={(e) => setFilterDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyFilters(); } }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer truncate"
              >
                <option value="all">All Tags</option>
                <option value="used">In Use</option>
                <option value="unused">Unused</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full sm:w-44 lg:w-44 shrink-0 space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Sort By :</label>
            <div className="relative">
              <select
                value={sortDraft}
                onChange={(e) => setSortDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyFilters(); } }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer truncate"
              >
                <option value="recent">Recently Added</option>
                <option value="oldest">Oldest First</option>
                <option value="az">Name (A–Z)</option>
                <option value="za">Name (Z–A)</option>
                <option value="most">Most Used</option>
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
              <span>Search Tags :</span>
            </label>
            <div className="relative">
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyFilters(); } }}
                placeholder="Search by tag name or slug..."
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

      {/* 5. Tags List */}
      {paginated.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-mist text-primary flex items-center justify-center mx-auto border border-primary/20">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {hasActiveFilters ? "No tags match your filters" : "No tags yet"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Nothing matches your current search and filter criteria. Try adjusting or clearing your filters."
              : "Tags are auto-created when added to blog posts, or create one from the Add Tag button."}
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
              <Button onClick={openAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 text-xs font-bold gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add Tag
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto shadow-xs">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <div className="col-span-5">Tag Name</div>
                <div className="col-span-2 text-center">Slug</div>
                <div className="col-span-2 text-center">Linked Posts</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>

              {paginated.map((tag) => (
                <div
                  key={tag.id}
                  className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary truncate" title={`#${tag.name}`}>
                      <span className="text-slate-400 font-bold">#</span>{tag.name}
                    </span>
                  </div>
                  <div className="col-span-2 text-center text-[11px] font-mono text-slate-400 truncate" title={tag.slug}>{tag.slug}</div>
                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-mist text-primary px-2 py-0.5 text-[10px] font-bold">
                      {tagUses(tag)}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-1.5">
                    {(
                      <>
                        <Button variant="outline" size="sm" onClick={() => openEdit(tag)} className="h-7 px-2.5 text-[10px] font-semibold">
                          <Pencil className="w-3 h-3 mr-1" /> Rename
                        </Button>
                        <DeleteTagDialog
                          tag={tag}
                          onDeleted={async () => { await refresh(); }}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" title="Delete tag">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          <AppPagination
            page={validCurrentPage}
            totalPages={totalPages}
            total={totalItems}
            itemLabel="tags"
            appliedPath={() => "#"}
            onPageChange={(p) => setCurrentPage(p)}
            pageSize={pageSize}
            onPageSizeChange={(v) => { setPageSize(v); setCurrentPage(1); }}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(v) => (v ? setModalOpen(true) : closeModal())}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEditing ? "Rename Tag" : "Add Tag"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            <label className="text-xs font-bold text-slate-700">
              Tag Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                if (formErrors.name) setFormErrors((f) => ({ ...f, name: undefined }));
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
              className={cn("h-10 text-sm bg-white", formErrors.name && "border-red-500 focus:ring-red-500/20")}
              placeholder="e.g. scalable-architecture"
            />
            {formErrors.name && <p className="text-[10px] font-bold text-red-500">{formErrors.name}</p>}
            <p className="text-[10px] font-medium text-slate-400">
              {isEditing
                ? "Renaming updates the tag everywhere it is linked. New slug is generated automatically."
                : "Lowercased automatically. Tags here are reused across posts in the Articles editor."}
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={busy} className="bg-primary text-white hover:bg-primary/90 font-semibold">
              {busy ? "Saving..." : isEditing ? "Save Changes" : "Add Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}