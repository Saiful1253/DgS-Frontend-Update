"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleX,
  Edit2,
  GripVertical,
  Layers,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import type {
  PaginatedWhatWeDo,
  WhatWeDoItem,
  WhatWeDoQuery,
} from "@/types/what-we-do";
import { buildWhatWeDoPath } from "@/lib/query/what-we-do-query";
import {
  deleteWhatWeDo,
  reorderWhatWeDo,
  saveWhatWeDo,
} from "@/services/what-we-do/what-we-do.service";
import SortableGrid from "@/components/common/sortable-grid";
import WhatWeDoItemDialog from "./what-we-do-item-dialog";

interface Props {
  initialItems: PaginatedWhatWeDo;
  categories: string[];
  query: WhatWeDoQuery;
  pageSizeOptions: number[];
}

export default function WhatWeDoManager({
  initialItems,
  categories,
  query,
  pageSizeOptions,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems.data);
  const [meta, setMeta] = useState(initialItems.meta);
  const [search, setSearch] = useState(query.search ?? "");
  const [category, setCategory] = useState(query.category ?? "all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WhatWeDoItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<WhatWeDoItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [reorderingCategory, setReorderingCategory] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems.data);
    setMeta(initialItems.meta);
  }, [initialItems]);

  useEffect(() => {
    setSearch(query.search ?? "");
    setCategory(query.category ?? "all");
  }, [query]);

  const pageCategories = useMemo(
    () => [...new Set(items.map((item) => item.category))],
    [items],
  );

  const visibleCount = items.filter((item) => item.is_available).length;

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(
      buildWhatWeDoPath({
        page: 1,
        limit: query.limit,
        search: search.trim() || undefined,
        category: category === "all" ? undefined : category,
      }),
    );
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("all");
    router.push(buildWhatWeDoPath({ page: 1, limit: query.limit }));
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: WhatWeDoItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const refreshPage = () => router.refresh();

  const handleReorder = async (
    groupCategory: string,
    reorderedItems: WhatWeDoItem[],
  ) => {
    if (reorderingCategory) return;
    const offset = meta.categoryOffsets[groupCategory];
    if (offset === undefined) {
      toast.error("Could not determine this category’s order. Refresh and try again.");
      return;
    }
    const previousItems = items;
    const orderedItems = reorderedItems.map((item, index) => ({
      ...item,
      sort_order: offset + index,
    }));

    setItems((current) =>
      current.map(
        (item) =>
          orderedItems.find((ordered) => ordered.id === item.id) ?? item,
      ),
    );
    setReorderingCategory(groupCategory);
    const loadingToast = toast.loading("Saving category order...");

    try {
      const result = await reorderWhatWeDo(
        groupCategory,
        offset,
        orderedItems.map((item) => item.id),
      );
      if (!result.success) {
        setItems(previousItems);
        toast.error(result.message || "Failed to save category order.", {
          id: loadingToast,
        });
        return;
      }

      toast.success(result.message || "Category order saved.", {
        id: loadingToast,
      });
      refreshPage();
    } catch (error: unknown) {
      setItems(previousItems);
      toast.error(
        error instanceof Error ? error.message : "Failed to save category order.",
        { id: loadingToast },
      );
    } finally {
      setReorderingCategory(null);
    }
  };

  const handleAvailabilityChange = async (
    item: WhatWeDoItem,
    isAvailable: boolean,
  ) => {
    setUpdatingId(item.id);
    try {
      const result = await saveWhatWeDo({
        id: item.id,
        category: item.category,
        is_available: isAvailable,
        problem: item.problem,
        problem_desc: item.problem_desc,
        solution: item.solution,
        solution_desc: item.solution_desc,
        sort_order: item.sort_order,
      });
      if (!result.success) {
        toast.error(result.message || "Failed to update visibility.");
        return;
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, is_available: isAvailable } : entry,
        ),
      );
      toast.success(isAvailable ? "Item is now visible." : "Item is now hidden.");
      refreshPage();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update visibility.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      const result = await deleteWhatWeDo(deletingItem.id);
      if (!result.success) {
        toast.error(result.message || "Failed to delete item.");
        return;
      }

      setItems((current) =>
        current.filter((item) => item.id !== deletingItem.id),
      );
      toast.success(result.message || "Item deleted.");
      setDeletingItem(null);
      refreshPage();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete item.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#00668a] sm:text-xs">
            <span>ADMIN CMS</span>
            <span aria-hidden="true">/</span>
            <span>ENGINEERING SERVICES</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            What We Do
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Manage the challenge and solution pairs displayed across your
            service categories.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="h-10 shrink-0 gap-2 bg-[#00668a] text-white hover:bg-[#004c69]"
        >
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </section>

      <section
        aria-label="What We Do overview"
        className="grid gap-3 sm:grid-cols-3"
      >
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500">Matching items</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {meta.total}
            </p>
          </div>
          <Layers className="h-5 w-5 text-[#00668a]" aria-hidden="true" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500">Visible on page</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
              {visibleCount}
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500">Hidden on page</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-700">
              {items.length - visibleCount}
            </p>
          </div>
          <CircleX className="h-5 w-5 text-slate-500" aria-hidden="true" />
        </div>
      </section>

      <form
        onSubmit={handleFilterSubmit}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-end"
      >
        <div className="w-full space-y-1.5 sm:flex-1">
          <label
            htmlFor="what-we-do-search"
            className="text-xs font-semibold text-slate-700"
          >
            Search items
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              id="what-we-do-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories, challenges, or solutions"
              className="h-10 pl-9"
            />
          </div>
        </div>
        <div className="w-full space-y-1.5 sm:w-64">
          <label
            htmlFor="what-we-do-category-filter"
            className="text-xs font-semibold text-slate-700"
          >
            Category
          </label>
          <select
            id="what-we-do-category-filter"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-[#00668a] focus-visible:ring-2 focus-visible:ring-[#00668a]/20"
          >
            <option value="all">All categories</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="submit"
            className="h-10 gap-2 bg-[#00668a] text-white hover:bg-[#004c69]"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
          {(query.search || query.category) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              className="h-10 gap-1.5"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </form>
      {!query.search && (
        <p className="flex items-center gap-2 text-xs text-slate-600">
          <GripVertical className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Drag items by the grip to change their order within a category.
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h3 className="font-semibold text-slate-900">
            {meta.total === 0 ? "No items found" : "No items on this page"}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            {meta.total === 0
              ? "Adjust your search or category filter, or add a new challenge and solution."
              : "Choose another page to view more matching items."}
          </p>
          {meta.total === 0 && !query.search && !query.category && (
            <Button
              onClick={openCreateDialog}
              className="mt-4 gap-2 bg-[#00668a] text-white hover:bg-[#004c69]"
            >
              <Plus className="h-4 w-4" />
              Add first item
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {pageCategories.map((value) => {
              const categoryItems = items
                .filter((item) => item.category === value)
                .sort(
                  (left, right) =>
                    left.sort_order - right.sort_order || left.id - right.id,
                );
              if (categoryItems.length === 0) return null;

              return (
                <section key={value} aria-labelledby={`category-${value}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3
                      id={`category-${value}`}
                      className="text-sm font-bold text-slate-800"
                    >
                      {value}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {categoryItems.length}{" "}
                      {categoryItems.length === 1 ? "item" : "items"} on page
                    </span>
                  </div>
                  <SortableGrid
                    items={categoryItems}
                    getKey={(item) => item.id}
                    onReorder={(reorderedItems) =>
                      void handleReorder(value, reorderedItems)
                    }
                    disabled={Boolean(query.search) || Boolean(reorderingCategory)}
                    className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                  >
                    {(item, { rootProps, handleProps, isDragging, isOver }) => (
                      <article
                        {...rootProps}
                        className={`overflow-hidden rounded-xl border bg-white shadow-xs transition ${
                          isDragging
                            ? "border-dashed border-[#00668a] opacity-50"
                            : isOver
                              ? "border-[#00668a] ring-2 ring-[#00668a]/15"
                              : item.is_available
                                ? "border-slate-200"
                                : "border-slate-200 opacity-80"
                        }`}
                      >
                        <div className="flex min-w-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-3 sm:px-4">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <button
                              type="button"
                              {...handleProps}
                              disabled={Boolean(query.search) || Boolean(reorderingCategory)}
                              aria-label={`Drag to reorder ${item.problem}`}
                              title="Drag to reorder"
                              className="touch-none cursor-grab rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00668a] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <span
                              aria-label={`Order ${item.sort_order}`}
                              className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold tabular-nums text-slate-600"
                            >
                              #{item.sort_order}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                                item.is_available
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.is_available ? "Visible" : "Hidden"}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1">
                          <div className="bg-[#fff8f6] px-4 py-3 sm:px-5">
                            <p className="text-sm font-semibold text-slate-900">
                              {item.problem}
                            </p>
                            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                              {item.problem_desc}
                            </p>
                          </div>
                          <div className="bg-[#f2faf6] px-4 py-3 sm:px-5">
                            <p className="text-sm font-semibold text-slate-900">
                              {item.solution}
                            </p>
                            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                              {item.solution_desc}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-3 py-2.5 sm:px-4">
                          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <span>Visible on website</span>
                            <Switch
                              checked={item.is_available}
                              disabled={updatingId === item.id}
                              onCheckedChange={(checked) =>
                                void handleAvailabilityChange(item, checked)
                              }
                              aria-label={`Show ${item.problem} on website`}
                            />
                          </label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                              className="h-8 gap-1.5 px-2.5"
                            >
                              <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingItem(item)}
                              className="h-8 gap-1.5 px-2.5 text-red-700 hover:bg-red-50 hover:text-red-800"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </article>
                    )}
                  </SortableGrid>
                </section>
              );
          })}
        </div>
      )}

      {meta.total > 0 && (
        <AppPagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          itemLabel="What We Do items"
          appliedPath={(nextPage) => buildWhatWeDoPath(query, nextPage)}
          onPageChange={(nextPage) =>
            router.push(buildWhatWeDoPath(query, nextPage))
          }
          pageSize={query.limit}
          onPageSizeChange={(limit) =>
            router.push(
              buildWhatWeDoPath({ ...query, page: 1, limit }, 1),
            )
          }
          pageSizeOptions={pageSizeOptions}
        />
      )}

      <WhatWeDoItemDialog
        open={dialogOpen}
        item={editingItem}
        categories={categories}
        onOpenChange={setDialogOpen}
        onSuccess={refreshPage}
      />

      <AlertDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && !deleting && setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this challenge and solution?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deletingItem?.problem}” will be removed from the website and
              admin list. This can’t be undone from this screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
