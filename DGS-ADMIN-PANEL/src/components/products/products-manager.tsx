"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppPagination } from "@/components/common/app-pagination";
import type { Product } from "@/types/product/product";
import type { Brand } from "@/types/product/brand";
import type { Category } from "@/types/product/product.category";
import type { ProductInput } from "@/zod/product.validation";
import { updateProduct } from "@/services/product.service";
import ProductsHeader from "./products-header";
import ProductFilters, { type ProductCategoryOption } from "./product-filters";
import { ProductTable } from "./product-table";
import ProductCards from "./product-cards";
import AddProductModal from "./modals/product/create-product-modal";
import CategoriesClient from "./categories/categories-client";

interface Props {
  initialProducts: Product[];
  categories: Category[];
  brands: Brand[];
}

type Tab = "products" | "categories";

/** The filters' sort select encodes column and direction as `column|direction`. */
const parseSortKey = (sortKey: string): { sortBy: string; sortOrder: "asc" | "desc" } => {
  const [column, direction] = sortKey.split("|");
  if (!column) return { sortBy: "created_at", sortOrder: "desc" };
  return { sortBy: column, sortOrder: direction === "asc" ? "asc" : "desc" };
};

/**
 * Products manager — the client half of `/products`.
 *
 * Holds the view mode, the filters and the pagination, and renders the product
 * table/cards plus the category table. The data comes in as props from the
 * server page's single read, so filtering and paging are local rather than a
 * round trip per keystroke; mutations still go through the product service, and
 * `router.refresh()` re-runs the page read afterwards.
 */
export default function ProductsManager({
  initialProducts,
  categories,
  brands,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("products");
  const [view, setView] = useState<"list" | "card">("list");

  // Filter drafts vs applied filters: the form has an explicit Search button, so
  // typing must not re-filter the table before the operator asks for it.
  const [searchDraft, setSearchDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("all");
  const [statusDraft, setStatusDraft] = useState("all");
  const [sortKeyDraft, setSortKeyDraft] = useState("default");
  const [applied, setApplied] = useState({
    search: "",
    categoryId: "all",
    status: "all",
    sortKey: "default",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const categoryOptions = useMemo<ProductCategoryOption[]>(
    () =>
      categories.map((c) => ({
        id: String(c.id),
        name: c.name,
        parent_id: c.parent_id == null ? null : String(c.parent_id),
      })),
    [categories]
  );

  // The tables' selects want `{id, name}`; the API returns numeric ids.
  const brandOptions = useMemo(
    () => brands.map((b) => ({ id: String(b.id), name: b.name })),
    [brands]
  );

  const visibleProducts = useMemo(() => {
    const term = applied.search.trim().toLowerCase();

    const filtered = initialProducts.filter((p) => {
      if (term && !p.name.toLowerCase().includes(term) && !(p.serial_number ?? "").toLowerCase().includes(term)) {
        return false;
      }
      if (applied.categoryId !== "all" && String(p.category_id) !== applied.categoryId) {
        return false;
      }
      if (applied.status !== "all" && p.status !== applied.status) {
        return false;
      }
      return true;
    });

    const { sortBy, sortOrder } = parseSortKey(applied.sortKey);
    const direction = sortOrder === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name) * direction;
      if (sortBy === "base_price") {
        return (Number(a.base_price ?? 0) - Number(b.base_price ?? 0)) * direction;
      }
      const left = new Date(sortBy === "updated_at" ? a.updated_at : a.created_at).getTime();
      const right = new Date(sortBy === "updated_at" ? b.updated_at : b.created_at).getTime();
      return (left - right) * direction;
    });
  }, [initialProducts, applied]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageProducts = visibleProducts.slice(startIdx, startIdx + pageSize);

  const applyFilters = () => {
    setApplied({
      search: searchDraft,
      categoryId: categoryDraft,
      status: statusDraft,
      sortKey: sortKeyDraft,
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchDraft("");
    setCategoryDraft("all");
    setStatusDraft("all");
    setSortKeyDraft("default");
    setApplied({ search: "", categoryId: "all", status: "all", sortKey: "default" });
    setCurrentPage(1);
  };

  /**
   * The edit modal only persists the core fields through `onSave` — with no
   * handler it would close on a green toast having written nothing.
   */
  const handleProductUpdate = async (
    updated: ProductInput & { id: string | number }
  ): Promise<void> => {
    const { id, ...input } = updated;
    const res = await updateProduct(id, input);
    if (!res.success) {
      throw new Error(res.message || "Failed to update product");
    }
    router.refresh();
  };

  return (
    <div className="w-full space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {(["products", "categories"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {key === "products" ? "Products" : "Categories"}
          </button>
        ))}
      </div>

      {tab === "categories" ? (
        <CategoriesClient
          categories={categories}
          allCategories={categories}
        />
      ) : (
        <>
          <ProductsHeader
            view={view}
            onViewChange={setView}
            rightActions={
              (
                <AddProductModal
                  categories={categoryOptions}
                  brands={brandOptions}
                  onCreated={() => router.refresh()}
                  trigger={
                    <Button size="sm" className="gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </Button>
                  }
                />
              )
            }
          />

          <ProductFilters
            search={searchDraft}
            onSearchChange={setSearchDraft}
            categoryId={categoryDraft}
            onCategoryIdChange={setCategoryDraft}
            categoryOptions={categoryOptions}
            status={statusDraft}
            onStatusChange={setStatusDraft}
            sortKey={sortKeyDraft}
            onSortKeyChange={setSortKeyDraft}
            onClear={clearFilters}
            onSearch={applyFilters}
          />

          {view === "list" ? (
            <ProductTable
              products={pageProducts}
              categories={categoryOptions}
              brands={brandOptions}
              onProductUpdate={handleProductUpdate}
            />
          ) : (
            <ProductCards
              products={pageProducts}
              categories={categoryOptions}
              brands={brandOptions}
              onProductUpdate={handleProductUpdate}
            />
          )}

          {visibleProducts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              {initialProducts.length === 0
                ? "No products yet. Add the first product to start the catalogue."
                : "No products match the current filters."}
            </p>
          ) : null}

          {visibleProducts.length > 0 && (
            <AppPagination
              page={safePage}
              totalPages={totalPages}
              total={visibleProducts.length}
              itemLabel="products"
              appliedPath={() => "#"}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          )}
        </>
      )}
    </div>
  );
}
