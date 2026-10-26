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
import {
  saveServiceCategory,
  deleteServiceCategory,
  listServiceCategories,
} from "@/services/service/service.service";

export interface ServiceCategoryItem {
  id: number;
  name: string;
  slug?: string;
  display_label?: string;
  display_order?: number;
  is_active?: boolean;
}

interface ServiceCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ServiceCategoryItem[];
  onCategoriesChange: (categories: ServiceCategoryItem[]) => void;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function ServiceCategoryModal({
  open,
  onOpenChange,
  categories,
  onCategoriesChange,
}: ServiceCategoryModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingLoading, setAddingLoading] = useState(false);

  // In-line Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<ServiceCategoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [listCategories, setListCategories] = useState<ServiceCategoryItem[]>(categories);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setListCategories(categories);
    }
  }, [categories]);

  const loadCategories = async (): Promise<boolean> => {
    setListLoading(true);
    try {
      const res = await listServiceCategories();
      if (res.success) {
        const fetched = Array.isArray(res.data) ? res.data : [];
        setListCategories(fetched);
        onCategoriesChange(fetched);
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
      loadCategories();
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
      const res = await saveServiceCategory({
        name: trimmed,
        slug: generateSlug(trimmed),
        display_label: trimmed,
        display_order: 0,
        is_active: true,
      });

      if (res.success) {
        toast.success(res.message || "Category created");
        const createdCat: ServiceCategoryItem = (res.data as any) || {
          id: Date.now(),
          name: trimmed,
          slug: generateSlug(trimmed),
        };
        onCategoriesChange([...categories, createdCat]);
        setNewCategoryName("");
        setIsAdding(false);
        loadCategories();
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
  const startEdit = (cat: ServiceCategoryItem) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  // Save Edit
  const handleSaveEdit = async (cat: ServiceCategoryItem) => {
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
      const res = await saveServiceCategory({
        id: cat.id,
        name: trimmed,
        slug: generateSlug(trimmed),
        display_label: trimmed,
        display_order: cat.display_order ?? 0,
        is_active: cat.is_active ?? true,
      });

      if (res.success) {
        toast.success(res.message || "Category updated");
        onCategoriesChange(
          categories.map((c) => (c.id === cat.id ? { ...c, name: trimmed, slug: generateSlug(trimmed) } : c))
        );
        cancelEdit();
        loadCategories();
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
      const res = await deleteServiceCategory(deleteTarget.id);
      if (res.success) {
        toast.success(res.message || "Category deleted");
        onCategoriesChange(categories.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
        loadCategories();
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
        <DialogContent className="sm:max-w-xl md:max-w-2xl p-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl">
          {/* Header */}
          <DialogHeader className="p-5 pb-4 border-b border-slate-100 pr-12">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#00668a] uppercase mb-1">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>CATEGORY DIRECTORY</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-bold text-slate-900 leading-snug">
                  Service Categories
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Organize and manage engineering service categories.
                </DialogDescription>
              </div>

              {!isAdding && (
                <Button
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  className="bg-[#00668a] hover:bg-[#004c69] text-white font-semibold text-xs h-8 px-3.5 gap-1.5 shadow-xs shrink-0 self-start sm:self-center"
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
            {isAdding && (
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
                    placeholder="e.g. Commercial Deluge & Safety Networks"
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
            ) : listCategories.length === 0 ? (
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
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveEdit(cat);
                              } else if (e.key === "Escape") {
                                cancelEdit();
                              }
                            }}
                            className="h-8 text-xs flex-1 bg-white"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSaveEdit(cat)}
                            disabled={editLoading || !editingName.trim()}
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Save changes"
                          >
                            {editLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            title="Cancel editing"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {cat.name}
                            </p>
                            {cat.slug && (
                              <p className="text-[10px] font-mono text-slate-400 truncate">
                                {cat.slug}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEdit(cat)}
                              className="h-7 w-7 text-slate-400 hover:text-[#00668a] hover:bg-sky-50"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteTarget(cat)}
                              className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <AlertDialogTitle className="text-base font-bold">
                Delete Service Category
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete category{" "}
              <strong className="text-slate-800">
                &quot;{deleteTarget?.name}&quot;
              </strong>
              ? Services currently assigned to this category will retain their label, but the category will be removed from category selectors.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold gap-1"
            >
              {deleteLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Delete Category</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
