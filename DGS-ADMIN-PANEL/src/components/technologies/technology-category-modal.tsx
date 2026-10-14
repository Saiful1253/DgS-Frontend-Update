/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Tag,
  FolderKanban,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TechnologyCategoryItem } from "@/types/technology";
import {
  createTechnologyCategory,
  updateTechnologyCategory,
  deleteTechnologyCategory,
  listTechnologyCategories,
} from "@/services/technology/technology.service";

interface TechnologyCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TechnologyCategoryItem[];
  onCategoriesChange: (categories: TechnologyCategoryItem[]) => void;
  canManage: boolean;
}

export default function TechnologyCategoryModal({
  open,
  onOpenChange,
  categories,
  onCategoriesChange,
  canManage,
}: TechnologyCategoryModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingLoading, setAddingLoading] = useState(false);

  // In-line Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<TechnologyCategoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination state (6 items per page, identical to Portfolio Category Modal)
  const CATEGORIES_PER_PAGE = 6;
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; totalPages: number; page: number } | null>(null);
  const [listCategories, setListCategories] = useState<TechnologyCategoryItem[]>(categories);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (categories && categories.length > 0 && listCategories.length === 0) {
      setListCategories(categories);
    }
  }, [categories, listCategories.length]);

  const loadCategories = async (targetPage: number): Promise<boolean> => {
    setListLoading(true);
    try {
      const res = await listTechnologyCategories(targetPage, CATEGORIES_PER_PAGE);
      if (res.success) {
        const resultMeta = (res as any).meta;
        const fetched = Array.isArray(res.data) ? res.data : [];
        setListCategories(fetched);
        setMeta(resultMeta || null);
        setPage(targetPage);
        if (targetPage === 1 && fetched.length > 0) {
          onCategoriesChange(fetched);
        }
        return true;
      }
      toast.error(res.message || "Failed to load categories");
      return false;
    } catch {
      toast.error("Failed to load categories");
      return false;
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCategories(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle Add Category
  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error("Please enter a category name");
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A category with this name already exists");
      return;
    }

    setAddingLoading(true);
    try {
      const res = await createTechnologyCategory(trimmed);
      if (res.success) {
        toast.success(res.message || "Category created");
        const createdCat: TechnologyCategoryItem = res.data || {
          id: Date.now(),
          name: trimmed,
        };
        onCategoriesChange([...categories, createdCat]);
        setNewCategoryName("");
        setIsAdding(false);
        loadCategories(1);
      } else {
        toast.error(res.message || "Failed to create category");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setAddingLoading(false);
    }
  };

  // Start Edit
  const startEdit = (cat: TechnologyCategoryItem) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  // Save Edit
  const handleSaveEdit = async (cat: TechnologyCategoryItem) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error("Category name cannot be empty");
      return;
    }

    if (
      categories.some(
        (c) => c.id !== cat.id && c.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      toast.error("Another category with this name already exists");
      return;
    }

    if (trimmed === cat.name) {
      cancelEdit();
      return;
    }

    setEditLoading(true);
    try {
      const res = await updateTechnologyCategory(cat.id, trimmed);
      if (res.success) {
        toast.success(res.message || "Category updated");
        onCategoriesChange(
          categories.map((c) => (c.id === cat.id ? { ...c, name: trimmed } : c))
        );
        cancelEdit();
        loadCategories(page);
      } else {
        toast.error(res.message || "Failed to update category");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await deleteTechnologyCategory(deleteTarget.id);
      if (res.success) {
        toast.success(res.message || "Category deleted");
        onCategoriesChange(categories.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
        const targetPage =
          meta && listCategories.length === 1 && page > 1 ? page - 1 : page;
        loadCategories(targetPage);
      } else {
        toast.error(res.message || "Failed to delete category");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl">
          {/* Header */}
          <DialogHeader className="p-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#00668a] uppercase mb-1">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>CATEGORY DIRECTORY</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Technology Categories
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Organize technical competencies and stacks by framework and domain.
                </DialogDescription>
              </div>

              {canManage && !isAdding && (
                <Button
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  className="bg-[#00668a] hover:bg-[#004c69] text-white font-semibold text-xs h-8 px-3 gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Inline Add Category Option Form */}
            {isAdding && canManage && (
              <form
                onSubmit={handleAddCategory}
                className="bg-sky-50/70 border border-[#00668a]/30 rounded-xl p-3.5 space-y-2.5 animate-in fade-in-50 duration-150"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#00668a]">
                  <span>NEW CATEGORY DETAILS</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewCategoryName("");
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. AI & Automation, Cloud & Infrastructure"
                    className="h-9 text-xs bg-white"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addingLoading || !newCategoryName.trim()}
                    className="h-9 px-3 bg-[#00668a] hover:bg-[#004c69] text-white text-xs font-semibold shrink-0 gap-1"
                  >
                    {addingLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Save</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAdding(false);
                      setNewCategoryName("");
                    }}
                    className="h-9 px-2.5 text-xs border-slate-200 text-slate-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Categories List */}
            {listLoading && listCategories.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#00668a]" />
                <p>Loading categories...</p>
              </div>
            ) : (meta ? meta.total === 0 : listCategories.length === 0) ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No categories created yet.</p>
              </div>
            ) : (
              <div
                className={cn(
                  "divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs",
                  listLoading ? "opacity-60 pointer-events-none" : ""
                )}
              >
                {listCategories.map((cat, idx) => {
                  const isEditingThis = editingId === cat.id;

                  return (
                    <div
                      key={cat.id || idx}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-8 text-xs flex-1 bg-white"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveEdit(cat);
                              } else if (e.key === "Escape") {
                                cancelEdit();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(cat)}
                            disabled={editLoading || !editingName.trim()}
                            className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                            title="Save changes"
                          >
                            {editLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={editLoading}
                            className="h-8 w-8 p-0 text-slate-500 border-slate-200 shrink-0"
                            title="Cancel edit"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-[#e6eff6] text-[#00668a] flex items-center justify-center text-[10px] font-bold shrink-0 border border-[#00668a]/20">
                              {(page - 1) * CATEGORIES_PER_PAGE + idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {cat.name}
                            </span>
                          </div>

                          {canManage && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(cat)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-[#00668a] hover:bg-[#e6eff6]"
                                title="Edit category name"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteTarget(cat)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={listLoading || meta.page <= 1}
                    onClick={() => loadCategories(meta.page - 1)}
                    className="h-7 w-7 p-0 border-slate-200"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={listLoading || meta.page >= meta.totalPages}
                    onClick={() => loadCategories(meta.page + 1)}
                    className="h-7 w-7 p-0 border-slate-200"
                    title="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-5">
            <span>{meta?.total ?? categories.length} total categories</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 px-3 text-xs border-slate-200"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(op) => !op && setDeleteTarget(null)}
      >
        <AlertDialogContent className="sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              Delete Category &quot;{deleteTarget?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to remove this category? Existing technologies tagged with this category will retain their category name, but it will be removed from category directory selectors.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={deleteLoading}
              className="h-8 text-xs font-semibold border-slate-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={deleteLoading}
              className="h-8 px-4 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Deleting...</span>
                </span>
              ) : (
                "Delete Category"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
