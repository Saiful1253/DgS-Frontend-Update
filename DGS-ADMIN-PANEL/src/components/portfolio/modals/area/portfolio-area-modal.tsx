/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  MapPin,
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
import { PortfolioArea } from "@/types/portfolio";
import {
  createPortfolioArea,
  updatePortfolioArea,
  deletePortfolioArea,
  listPortfolioAreas,
} from "@/services/portfolio/portfolio.service";

interface PortfolioAreaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areas: PortfolioArea[];
  onAreasChange: (areas: PortfolioArea[]) => void;
  onSelectArea?: (areaName: string) => void;
}

export default function PortfolioAreaModal({
  open,
  onOpenChange,
  areas,
  onAreasChange,
  onSelectArea,
}: PortfolioAreaModalProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [addingLoading, setAddingLoading] = useState(false);

  // In-line Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<PortfolioArea | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Backend-paginated list state
  const AREAS_PER_PAGE = 6;
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; totalPages: number; page: number } | null>(null);
  const [listAreas, setListAreas] = useState<PortfolioArea[]>(areas);
  const [listLoading, setListLoading] = useState(false);

  const loadAreas = async (targetPage: number): Promise<boolean> => {
    setListLoading(true);
    try {
      const res = await listPortfolioAreas(targetPage, AREAS_PER_PAGE);
      if (res.success) {
        const resultMeta = (res as any).meta;
        const loaded: PortfolioArea[] = Array.isArray(res.data) ? res.data : [];
        setListAreas(loaded);
        setMeta(resultMeta || null);
        setPage(targetPage);
        return true;
      }
      toast.error(res.message || "Failed to load areas");
      return false;
    } catch {
      toast.error("Failed to load areas");
      return false;
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadAreas(1);
    }
  }, [open]);

  // Handle Add Area
  const handleAddArea = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newAreaName.trim();
    if (!trimmed) {
      toast.error("Please enter an area/zone name");
      return;
    }

    if (areas.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("An area with this name already exists");
      return;
    }

    setAddingLoading(true);
    try {
      const res = await createPortfolioArea(trimmed);
      if (res.success) {
        toast.success(res.message || "Area created successfully");
        const createdArea: PortfolioArea = res.data || {
          id: Date.now(),
          name: trimmed,
        };
        onAreasChange([...areas, createdArea]);
        setNewAreaName("");
        setIsAdding(false);
        loadAreas(1);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to create area");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setAddingLoading(false);
    }
  };

  // Start Edit
  const startEdit = (areaItem: PortfolioArea) => {
    setEditingId(areaItem.id);
    setEditingName(areaItem.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  // Save Edit
  const handleSaveEdit = async (areaItem: PortfolioArea) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error("Area name cannot be empty");
      return;
    }

    if (
      areas.some(
        (a) => a.id !== areaItem.id && a.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      toast.error("Another area with this name already exists");
      return;
    }

    if (trimmed === areaItem.name) {
      cancelEdit();
      return;
    }

    setEditLoading(true);
    try {
      const res = await updatePortfolioArea(areaItem.id, trimmed);
      if (res.success) {
        toast.success(res.message || "Area updated");
        onAreasChange(
          areas.map((a) => (a.id === areaItem.id ? { ...a, name: trimmed } : a))
        );
        cancelEdit();
        loadAreas(page);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to update area");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  // Confirm & Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await deletePortfolioArea(deleteTarget.id);
      if (res.success) {
        toast.success(res.message || `Area "${deleteTarget.name}" deleted`);
        onAreasChange(areas.filter((a) => a.id !== deleteTarget.id));
        setDeleteTarget(null);
        const remainingCount = (meta?.total ?? 1) - 1;
        const newMaxPage = Math.max(1, Math.ceil(remainingCount / AREAS_PER_PAGE));
        const targetPage = page > newMaxPage ? newMaxPage : page;
        loadAreas(targetPage);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to delete area");
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
        <DialogContent
          className="w-[calc(100vw-2rem)] sm:w-full max-w-xl p-0 overflow-hidden bg-white shadow-2xl rounded-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase mb-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>PROJECT LOCATION &amp; COVERAGE</span>
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
              Manage Operating Areas &amp; Zones
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure official project zones and regional coverage sectors across Bangladesh.
            </DialogDescription>
          </DialogHeader>

          {/* Action Bar (Add New Area) */}
          <div className="px-6 pt-4 pb-2">
            {!isAdding ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {meta ? `${meta.total} Registered Areas` : `${areas.length} Areas`}
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setIsAdding(true);
                    setNewAreaName("");
                  }}
                  className="h-8.5 px-3 bg-primary text-white hover:bg-primary/90 font-bold text-xs gap-1.5 rounded-lg shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Area</span>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAddArea} className="flex items-center gap-2">
                <Input
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="e.g. Uttara Sector 11, Banani DOHS..."
                  className="h-9 text-xs font-medium flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setIsAdding(false);
                  }}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={addingLoading || !newAreaName.trim()}
                  className="h-9 px-3 bg-primary text-white hover:bg-primary/90 font-bold text-xs shrink-0 cursor-pointer"
                >
                  {addingLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  className="h-9 px-2 text-slate-500 hover:text-slate-800 shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </form>
            )}
          </div>

          {/* Body List */}
          <div className="p-6 pt-2">
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 min-h-[260px] flex flex-col justify-between">
              <div>
                {listLoading ? (
                  <div className="py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading areas...</p>
                  </div>
                ) : listAreas.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs font-medium">
                    No areas registered yet. Click &quot;Add New Area&quot; above.
                  </div>
                ) : (
                  listAreas.map((areaItem) => {
                    const isEditingThis = editingId === areaItem.id;
                    return (
                      <div
                        key={areaItem.id}
                        className={cn(
                          "px-4 py-3 flex items-center justify-between gap-3 text-xs transition-colors",
                          isEditingThis ? "bg-sky-50/50" : "hover:bg-slate-50/80"
                        )}
                      >
                        {isEditingThis ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-8 text-xs font-semibold flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveEdit(areaItem);
                                } else if (e.key === "Escape") {
                                  cancelEdit();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSaveEdit(areaItem)}
                              disabled={editLoading || !editingName.trim()}
                              className="h-8 px-2.5 bg-primary text-white hover:bg-primary/90 font-bold text-xs shrink-0 cursor-pointer"
                            >
                              {editLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={cancelEdit}
                              className="h-8 px-2 text-slate-500 hover:text-slate-800 shrink-0 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectArea?.(areaItem.name);
                                  onOpenChange(false);
                                }}
                                className="font-semibold text-slate-800 truncate hover:text-primary transition-colors text-left cursor-pointer"
                                title="Click to use this area"
                              >
                                {areaItem.name}
                              </button>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEdit(areaItem)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Edit Area"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(areaItem)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Delete Area"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination Bar */}
              {meta && meta.totalPages > 1 && (
                <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>
                    Page {meta.page} of {meta.totalPages} ({meta.total} total)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadAreas(page - 1)}
                      disabled={page <= 1 || listLoading}
                      className="h-7 w-7 p-0 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadAreas(page + 1)}
                      disabled={page >= meta.totalPages || listLoading}
                      className="h-7 w-7 p-0 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-md bg-white rounded-2xl p-6">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertTriangle className="w-5 h-5" />
              <AlertDialogTitle className="text-base font-bold text-slate-900">
                Delete Operating Area?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? Existing projects
              assigned to this area will keep their address intact, but it will be removed from the
              global suggestions list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={deleteLoading}
              className="text-xs font-semibold cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 cursor-pointer"
            >
              {deleteLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Delete Area"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
