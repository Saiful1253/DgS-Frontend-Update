/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  FolderOpen,
  Users,
  Upload,
  Loader2,
  Search,
  X,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { AppPagination } from "@/components/common/app-pagination";
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  createBlogCategory,
  updateBlogCategory,
  createBlogAuthor,
  updateBlogAuthor,
  uploadBlogAuthorAvatar,
  deleteBlogAuthorAvatar,
} from "@/services/blog/blog.service";
import DeleteTaxonomyDialog from "./modals/taxonomy/delete-taxonomy-dialog";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const RECENT_DAYS = 30;

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

type Kind = "category" | "author";

interface BlogTaxonomyManagerProps {
  kind: Kind;
  initialItems: any[];
}

interface FormState {
  id: string | number | null;
  name: string;
  extra: string;
  bio: string;
  avatarFile: { file: File; preview: string } | null;
  removeAvatar: boolean;
}

export default function BlogTaxonomyManager({ kind, initialItems }: BlogTaxonomyManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>(initialItems);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ id: null, name: "", extra: "", bio: "", avatarFile: null, removeAvatar: false });
  const [busy, setBusy] = useState(false);
  const [avatarBusyId, setAvatarBusyId] = useState<string | number | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Filter / Search / Sort / Pagination State
  const filterConfig = kind === "category"
    ? { label: "Status :", all: "All Categories", used: "In Use", unused: "Unused" }
    : { label: "Status :", all: "All Authors", used: "With Posts", unused: "No Posts" };
  const [searchDraft, setSearchDraft] = useState("");
  const [filterDraft, setFilterDraft] = useState("all");
  const [sortDraft, setSortDraft] = useState("recent");
  const [applied, setApplied] = useState({ search: "", filter: "all", sort: "recent" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isCategory = kind === "category";
  const title = isCategory ? "Blog Categories" : "Blog Authors";
  const plural = isCategory ? "categories" : "authors";
  const goal = isCategory ? "category" : "author";
  const purpose = isCategory
    ? "Manage editorial taxonomy — categories used to group and filter technical articles."
    : "Manage contributor profiles — authors and co-authors credited on engineering articles.";
  const moduleTag = isCategory ? "BLOG TAXONOMY" : "CONTRIBUTOR PROFILES";
  const Icon = isCategory ? FolderOpen : Users;

  const isEditing = form.id !== null;

  const refresh = async () => {
    const { listBlogCategories, listBlogAuthors } = await import("@/services/blog/blog.service");
    const res = isCategory ? await listBlogCategories() : await listBlogAuthors();
    if (res.success) setItems(res.data ?? []);
    router.refresh();
  };

  const openAdd = () => {
    setForm({ id: null, name: "", extra: "", bio: "", avatarFile: null, removeAvatar: false });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setForm({
      id: item.id,
      name: item.name,
      extra: isCategory ? item.description ?? "" : item.designation ?? "",
      bio: item.bio ?? "",
      avatarFile: null,
      removeAvatar: false,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (busy) return;
    if (form.avatarFile?.preview) URL.revokeObjectURL(form.avatarFile.preview);
    setFormErrors({});
    setModalOpen(false);
  };

  const handleAvatarChange = (file: File) => {
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Avatar image exceeds 5MB limit.");
      return;
    }
    if (form.avatarFile?.preview) URL.revokeObjectURL(form.avatarFile.preview);
    setForm((f) => ({ ...f, avatarFile: { file, preview: URL.createObjectURL(file) }, removeAvatar: false }));
  };

  const handleSave = async () => {
    if (busy) return;
    if (!form.name.trim()) {
      setFormErrors({ name: `${isCategory ? "Category" : "Author"} name is required` });
      return;
    }
    setBusy(true);
    const loading = toast.loading(isEditing ? "Saving changes..." : `Creating ${goal}...`);
    try {
      if (isEditing) {
        const payload = isCategory
          ? { name: form.name.trim(), description: form.extra.trim() || undefined } as any
          : {
              name: form.name.trim(),
              designation: form.extra.trim() || null,
              bio: form.bio.trim() || null,
            };
        const res = isCategory
          ? await updateBlogCategory(form.id!, payload.name, payload.description)
          : await updateBlogAuthor(form.id!, payload);
        if (!res.success) {
          toast.error(res.message || "Failed to update", { id: loading });
          return;
        }
        if (!isCategory && form.removeAvatar && !form.avatarFile && form.id) {
          try {
            await deleteBlogAuthorAvatar(form.id);
          } catch {
            /* avatar delete failure is non-fatal */
          }
        }
        if (!isCategory && form.avatarFile) {
          try {
            const fd = new FormData();
            fd.append("file", form.avatarFile.file);
            await uploadBlogAuthorAvatar(form.id!, fd);
          } catch {
            /* avatar upload failure is non-fatal */
          }
        }
        toast.success(res.message || "Updated", { id: loading });
      } else {
        const res = isCategory
          ? await createBlogCategory(form.name.trim(), form.extra.trim() || undefined)
          : await createBlogAuthor({
              name: form.name.trim(),
              designation: form.extra.trim() || undefined,
              bio: form.bio.trim() || undefined,
            });
        if (!res.success) {
          toast.error(res.message || "Failed to create", { id: loading });
          return;
        }
        if (!isCategory && form.avatarFile) {
          try {
            const created = (res as any).data;
            if (created?.id) {
              const fd = new FormData();
              fd.append("file", form.avatarFile.file);
              await uploadBlogAuthorAvatar(created.id, fd);
            }
          } catch {
            /* avatar upload failure is non-fatal */
          }
        }
        toast.success(res.message || `Created ${title.slice(0, -1)}`, { id: loading });
      }
      if (form.avatarFile?.preview) URL.revokeObjectURL(form.avatarFile.preview);
      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "An error occurred", { id: loading });
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarUpload = async (item: any, file: File) => {
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE) return toast.error("Avatar image exceeds 5MB limit.");
    setAvatarBusyId(item.id);
    const loading = toast.loading("Uploading avatar...");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadBlogAuthorAvatar(item.id, fd);
      if (res.success) {
        toast.success("Avatar updated", { id: loading });
        await refresh();
      } else {
        toast.error(res.message || "Failed to upload avatar", { id: loading });
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred", { id: loading });
    } finally {
      setAvatarBusyId(null);
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
  const usedCount = items.filter((i) => Number(i.posts_count ?? 0) > 0).length;
  const sumPosts = items.reduce((acc, i) => acc + Number(i.posts_count ?? 0), 0);
  const missingAvatar = !isCategory
    ? items.filter((i) => !i.avatar_url).length
    : 0;
  const recentCount = items.filter((i) => {
    const d = new Date(i.created_at);
    return !isNaN(d.getTime()) && Date.now() - d.getTime() <= RECENT_DAYS * 24 * 60 * 60 * 1000;
  }).length;

  const statCards = isCategory
    ? [
        { label: "Total Categories", value: totalCount, sub: "Editorial groups", color: "text-slate-900" },
        { label: "Categorized Posts", value: sumPosts, sub: "Linked to articles", color: "text-emerald-600" },
        { label: "Unused Categories", value: totalCount - usedCount, sub: "No posts yet", color: "text-amber-600" },
        { label: "Recently Added", value: recentCount, sub: `Last ${RECENT_DAYS} days`, color: "text-primary" },
      ]
    : [
        { label: "Total Authors", value: totalCount, sub: "Contributor profiles", color: "text-slate-900" },
        { label: "Authors With Posts", value: usedCount, sub: "Credited on articles", color: "text-emerald-600" },
        { label: "Posts Authored", value: sumPosts, sub: "Primary + co-author", color: "text-primary" },
        { label: "No Profile Photo", value: missingAvatar, sub: "Avatar missing", color: "text-amber-600" },
      ];

  // Filtered + sorted + paginated
  const filtered = useMemo(() => {
    const q = applied.search.toLowerCase();
    const base = q
      ? items.filter((item) => {
          const secondary = isCategory ? item.description : item.designation;
          return (
            String(item.name || "").toLowerCase().includes(q) ||
            String(secondary || "").toLowerCase().includes(q)
          );
        })
      : items;
    const locals = applied.filter === "all"
      ? base
      : applied.filter === "used"
        ? base.filter((i) => Number(i.posts_count ?? 0) > 0)
        : base.filter((i) => Number(i.posts_count ?? 0) === 0);
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
        sorted.sort((a, b) => Number(b.posts_count ?? 0) - Number(a.posts_count ?? 0));
        break;
      default:
        sorted.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    }
    return sorted;
  }, [items, applied, isCategory]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (validCurrentPage - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);

  const serverAvatarUrl = !isCategory && isEditing
    ? items.find((i) => String(i.id) === String(form.id))?.avatar_url ?? null
    : null;

  const currentAvatarUrl = form.removeAvatar ? null : serverAvatarUrl;

  const handleRemoveAvatar = () => {
    if (form.avatarFile?.preview) URL.revokeObjectURL(form.avatarFile.preview);
    setForm((f) => ({ ...f, avatarFile: null, removeAvatar: true }));
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-xs font-bold tracking-wider text-primary uppercase mb-1">
            <span>ADMIN CMS</span>
            <span>•</span>
            <span className="truncate">{moduleTag}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">{title}</h1>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          {(
            <Button onClick={openAdd} className="h-10 px-4 w-full sm:w-auto bg-primary text-white hover:bg-primary/90 font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Add {isCategory ? "Category" : "Author"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Purpose Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">PURPOSE</h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-5xl">{purpose}</p>
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
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">{filterConfig.label}</label>
            <div className="relative">
              <select
                value={filterDraft}
                onChange={(e) => setFilterDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyFilters(); } }}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer truncate"
              >
                <option value="all">{filterConfig.all}</option>
                <option value="used">{filterConfig.used}</option>
                <option value="unused">{filterConfig.unused}</option>
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
              <span>Search {plural} :</span>
            </label>
            <div className="relative">
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyFilters(); } }}
                placeholder={`Search by name or ${isCategory ? "description" : "designation"}...`}
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

      {/* 5. List */}
      {paginated.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-mist text-primary flex items-center justify-center mx-auto border border-primary/20">
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {hasActiveFilters ? "No matches found" : `No ${plural} yet`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Nothing matches your current search and filter criteria. Try adjusting or clearing your filters."
              : isCategory
                ? "Add categories to organise technical articles into searchable groups."
                : "Add contributor profiles so articles carry author credits and bios."}
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
                Add {isCategory ? "Category" : "Author"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto shadow-xs">
            <div className="min-w-[650px]">
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isCategory ? (
                <>
                  <div className="col-span-5">Category Name</div>
                  <div className="col-span-3">Description</div>
                </>
              ) : (
                <>
                  <div className="col-span-4">Author</div>
                  <div className="col-span-2">Designation</div>
                  <div className="col-span-3">Short Bio</div>
                </>
              )}
              <div className={isCategory ? "col-span-2 text-center" : "col-span-1 text-center"}>Posts</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {paginated.map((item) => {
              const secondary = isCategory ? item.description : item.designation;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <div className={cn(isCategory ? "col-span-5" : "col-span-4", "flex items-center gap-2.5 min-w-0")}>
                    {!isCategory && (
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-sky-mist text-primary flex items-center justify-center border border-primary/20 text-[10px] font-bold">
                          {item.avatar_url ? (
                            <Image src={item.avatar_url} alt={item.name} width={36} height={36} className="object-cover w-9 h-9" />
                          ) : (
                            initialsOf(item.name)
                          )}
                        </div>
                        <label
                          title="Upload avatar"
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/90 shadow border border-white"
                        >
                          {avatarBusyId === item.id ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Upload className="w-2.5 h-2.5" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={avatarBusyId === item.id}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleAvatarUpload(item, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                        {isCategory && <FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span className="truncate">{item.name}</span>
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                        {format(new Date(item.created_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className={cn(isCategory ? "col-span-3" : "col-span-2", "text-left min-w-0")}>
                    <span className="text-[11px] text-slate-500 truncate block">{secondary || "—"}</span>
                  </div>
                  {!isCategory && (
                    <div className="col-span-3 text-left min-w-0">
                      {item.bio ? (
                        <span className="text-[11px] text-slate-500 truncate block" title={item.bio}>{item.bio}</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </div>
                  )}
                  <div className={cn(isCategory ? "col-span-2" : "col-span-1", "text-center")}>
                    {typeof item.posts_count === "number" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-mist text-primary px-2 py-0.5 text-[10px] font-bold">
                        {item.posts_count}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    {(
                      <>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-7 w-7 text-slate-600 hover:text-green-600 hover:bg-green-50" title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <DeleteTaxonomyDialog
                          kind={kind}
                          item={item}
                          onDeleted={async () => { await refresh(); }}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* Pagination Controls */}
          <AppPagination
            page={validCurrentPage}
            totalPages={totalPages}
            total={totalItems}
            itemLabel={plural}
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold text-slate-900">
              {isEditing ? `Edit ${isCategory ? "Category" : "Author"}` : `Add New ${isCategory ? "Category" : "Author"}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {isCategory
                ? "Categories group technical articles into searchable editorial sections."
                : "Contributor profiles credit articles — shared with the blog editor and co-author picker."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Profile Photo (Authors only) - Centered Layout */}
            {!isCategory && (
              <div className="flex flex-col items-center justify-center text-center py-2 space-y-2">
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 bg-sky-mist text-primary flex items-center justify-center font-bold text-xl shrink-0 cursor-pointer group hover:border-primary transition-all shadow-xs"
                  title="Click to upload photo"
                >
                  {form.avatarFile ? (
                    <Image src={form.avatarFile.preview} alt="avatar" fill sizes="80px" className="object-cover" />
                  ) : currentAvatarUrl ? (
                    <Image src={currentAvatarUrl} alt="avatar" fill sizes="80px" className="object-cover" />
                  ) : form.name ? (
                    <span className="text-primary font-bold text-xl">{initialsOf(form.name)}</span>
                  ) : (
                    <Users className="w-8 h-8 text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1.5 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                    className="h-8 px-3.5 text-xs font-semibold gap-1.5 border-slate-200 bg-white hover:bg-slate-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    {form.avatarFile || currentAvatarUrl ? "Change Photo" : "Upload Photo"}
                  </Button>

                  {(form.avatarFile || currentAvatarUrl) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="h-7 px-2.5 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </Button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  {form.removeAvatar && !form.avatarFile ? (
                    <span className="text-amber-600 font-medium">Photo will be removed when you click Save Changes.</span>
                  ) : (
                    "JPG, PNG or WebP up to 5MB."
                  )}
                </p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAvatarChange(f);
                    e.target.value = "";
                  }}
                />
              </div>
            )}

            {/* Name + Designation */}
            <div className={cn("grid gap-3", !isCategory && "sm:grid-cols-2")}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {isCategory ? "Category Name" : "Author Name"} <span className="text-red-500">*</span>
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
                  placeholder={isCategory ? "e.g. Software Engineering" : "e.g. John Milano"}
                />
                {formErrors.name && <p className="text-[10px] font-bold text-red-500">{formErrors.name}</p>}
              </div>

              {!isCategory && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Designation</label>
                  <Input
                    value={form.extra}
                    onChange={(e) => setForm((f) => ({ ...f, extra: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    className="h-10 text-xs bg-white"
                    placeholder="e.g. Senior Cloud Architect"
                  />
                </div>
              )}
            </div>

            {/* Description (Category) or Bio (Author) */}
            {isCategory ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <Textarea
                  value={form.extra}
                  onChange={(e) => setForm((f) => ({ ...f, extra: e.target.value }))}
                  rows={3}
                  className="text-xs bg-white resize-none"
                  placeholder="What does this category cover? Shown in the Categories table."
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Short Bio</label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="text-xs bg-white resize-none"
                  placeholder="Quick bio shown with author credits on articles (optional)"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-slate-100 mt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="h-10 px-4 text-xs font-semibold">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={busy} className="bg-primary text-white hover:bg-primary/90 font-semibold h-10 px-5 text-xs shadow-xs">
              {busy ? "Saving..." : isEditing ? "Save Changes" : `Add ${isCategory ? "Category" : "Author"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}