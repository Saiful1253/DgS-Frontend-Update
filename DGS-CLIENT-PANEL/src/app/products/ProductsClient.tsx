/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight,  RotateCcw, Search, SlidersHorizontal, ChevronDown, ChevronUp, Tag, LayoutGrid, Coins } from "lucide-react";
import type { Product } from "@/types/product/product";
import type { Category } from "@/types/product/product.category";
import ProductCard from "@/components/sections/products/ProductCard";
import { Pagination } from "@/components/ui/pagination";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductsSkeleton from "@/components/skeletons/ProductsSkeleton";
import { getCategorySpecDefinitions } from "@/services/product/product.service";

interface ProductsClientProps {
  initialProducts: Product[];
  categories: Category[];
  brands: any[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  filterParams: {
    search?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    featured?: string;
    specifications?: string;
  };
}

export default function ProductsClient({
  initialProducts,
  categories,
  brands,
  totalProducts: initialTotal,
  totalPages: initialTotalPages,
  currentPage: initialPage,
  filterParams,
}: ProductsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Filter states
  const [searchVal, setSearchVal] = useState(filterParams.search || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filterParams.category ? filterParams.category.split(",") : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    filterParams.brand ? filterParams.brand.split(",") : []
  );
  const [minPrice, setMinPrice] = useState(filterParams.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(filterParams.maxPrice || "");
  const [sortBy, setSortBy] = useState(filterParams.sort || "newest");
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true, // open by default
    brand: false, // collapsed by default
    price: false, // collapsed by default
  });

  const [specDefinitions, setSpecDefinitions] = useState<any[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Loaded products list (client state for async transition updates)
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);

  // Parse specs from the URL. Done as a render-time state sync (React's
  // "adjust state during render" pattern) instead of an effect.
  const specParam = searchParams.get("specifications");
  const [syncedSpecParam, setSyncedSpecParam] = useState<string | null>(specParam);
  if (specParam !== syncedSpecParam) {
    setSyncedSpecParam(specParam);
    if (specParam) {
      try {
        const parsed = JSON.parse(specParam);
        const normalized: Record<string, string[]> = {};
        Object.entries(parsed).forEach(([key, val]) => {
          normalized[key] = Array.isArray(val) ? (val as string[]) : [String(val)];
        });
        setSelectedSpecs(normalized);
      } catch {
        setSelectedSpecs({});
      }
    } else {
      setSelectedSpecs({});
    }
  }

  // Clear stale spec definitions as soon as the category filter empties.
  if (selectedCategories.length === 0 && specDefinitions.length > 0) {
    setSpecDefinitions([]);
  }

  useEffect(() => {
    if (selectedCategories.length > 0) {
      const promises = selectedCategories.map(async (slug) => {
        const catObj = categories.find((c) => c.slug === slug);
        if (catObj) {
          try {
            const attributes = await getCategorySpecDefinitions(Number(catObj.id));
            if (Array.isArray(attributes)) {
              return attributes;
            }
          } catch (e) {
            console.error("Failed to load attributes for category " + slug, e);
          }
        }
        return [];
      });

      Promise.all(promises).then((results) => {
        const mergedMap = new Map<string, any>();
        results.flat().forEach((def) => {
          if (!def) return;
          if (!mergedMap.has(def.key)) {
            mergedMap.set(def.key, { ...def });
          } else {
            const existing = mergedMap.get(def.key)!;
            const existingOpts = Array.isArray(existing.options) ? existing.options : [];
            const newOpts = Array.isArray(def.options) ? def.options : [];
            const combined = Array.from(new Set([...existingOpts, ...newOpts]));
            existing.options = combined;
          }
        });

        const data = Array.from(mergedMap.values());
        setSpecDefinitions(data);

        setOpenSections((prev) => {
          const updated = { ...prev };
          data.forEach((def: any) => {
            if (updated[def.key] === undefined) {
              updated[def.key] = false;
            }
          });
          return updated;
        });
      });
    }
  }, [selectedCategories, categories]);


  // Sync state from the server payload on navigation, keyed on the incoming
  // server props (render-time state adjustment).
  const serverSyncKey = [
    initialPage,
    initialTotal,
    initialTotalPages,
    initialProducts.length,
    filterParams.category ?? "",
    filterParams.brand ?? "",
  ].join("|");
  const [syncedServerKey, setSyncedServerKey] = useState(serverSyncKey);
  if (serverSyncKey !== syncedServerKey) {
    setSyncedServerKey(serverSyncKey);
    setProducts(initialProducts);
    setTotal(initialTotal);
    setTotalPages(initialTotalPages);
    setCurrentPage(initialPage);
    setSelectedCategories(filterParams.category ? filterParams.category.split(",") : []);
    setSelectedBrands(filterParams.brand ? filterParams.brand.split(",") : []);
  }

  // Helper to build URLs
  const getFilterUrl = (updatedParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updatedParams).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    // Reset page to 1 on filter changes unless specifying page explicitly
    if (!updatedParams.page) {
      params.set("page", "1");
    }
    return `${pathname}?${params.toString()}`;
  };

  const handleApplyFilters = (updates: Record<string, string | null>) => {
    const url = getFilterUrl(updates);
    setIsLoading(true);
    startTransition(() => {
      router.push(url);
      setIsLoading(false);
    });
  };

  const getRootBranchSlug = (slug: string): string | null => {
    let curr = categories.find((c) => c.slug === slug);
    if (!curr) return null;
    while (curr && curr.parent_id) {
      const parent = categories.find((c) => String(c.id) === String(curr!.parent_id));
      if (!parent) break;
      curr = parent;
    }
    return curr.slug;
  };

  const handleCategoryToggle = (slug: string) => {
    let updated: string[] = [...selectedCategories];

    if (selectedCategories.includes(slug)) {
      // Deselect: remove this slug and all its descendants
      updated = updated.filter((s) => s !== slug);
      const uncheckChildren = (parentSlug: string) => {
        const parent = categories.find((c) => c.slug === parentSlug);
        if (!parent) return;
        const children = categories.filter((c) => String(c.parent_id) === String(parent.id));
        children.forEach((child) => {
          updated = updated.filter((s) => s !== child.slug);
          uncheckChildren(child.slug);
        });
      };
      uncheckChildren(slug);
    } else {
      // Enforce single-branch: clear any selections from a different branch
      const incomingBranch = getRootBranchSlug(slug);
      const currentBranch = selectedCategories.length > 0 ? getRootBranchSlug(selectedCategories[0]) : null;
      const isBranchSwitch = currentBranch !== null && currentBranch !== incomingBranch;

      updated = updated.filter((s) => getRootBranchSlug(s) === incomingBranch);

      // Add the selected slug
      updated.push(slug);

      // Auto-check all ancestor categories
      const checkParents = (childSlug: string) => {
        const child = categories.find((c) => c.slug === childSlug);
        if (child && child.parent_id) {
          const parent = categories.find((c) => String(c.id) === String(child.parent_id));
          if (parent && !updated.includes(parent.slug)) {
            updated.push(parent.slug);
            checkParents(parent.slug);
          }
        }
      };
      checkParents(slug);

      // Collapse old branch, expand only the new branch root
      if (isBranchSwitch) {
        setExpandedCats({ [incomingBranch ?? slug]: true });
      }
    }

    // Clear spec filters when branch changes
    setSelectedSpecs({});
    setSelectedCategories(updated);
    handleApplyFilters({
      category: updated.length > 0 ? updated.join(",") : null,
      specifications: null,
    });
  };


  const handleBrandToggle = (slug: string) => {
    let updated: string[];
    if (selectedBrands.includes(slug)) {
      updated = selectedBrands.filter((s) => s !== slug);
    } else {
      updated = [...selectedBrands, slug];
    }
    setSelectedBrands(updated);
    handleApplyFilters({ brand: updated.length > 0 ? updated.join(",") : null });
  };

  const handleSpecToggle = (key: string, value: string) => {
    const current = selectedSpecs[key] ? [...selectedSpecs[key]] : [];
    let updatedVals: string[];
    if (current.includes(value)) {
      updatedVals = current.filter((v) => v !== value);
    } else {
      updatedVals = [...current, value];
    }

    const updatedSpecs = { ...selectedSpecs };
    if (updatedVals.length > 0) {
      updatedSpecs[key] = updatedVals;
    } else {
      delete updatedSpecs[key];
    }

    setSelectedSpecs(updatedSpecs);
    handleApplyFilters({
      specifications: Object.keys(updatedSpecs).length > 0 ? JSON.stringify(updatedSpecs) : null,
    });
  };

  const handleResetFilters = () => {
    setSearchVal("");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedSpecs({});
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setIsLoading(true);
    startTransition(() => {
      router.push(pathname);
      setIsLoading(false);
    });
  };

  const getPageTitle = () => {
    if (filterParams.featured === "true") return "Best Sellers";
    if (selectedCategories.length > 0) {
      const cat = categories.find((c) => c.slug === selectedCategories[0]);
      return cat
        ? `${cat.name}${selectedCategories.length > 1 ? ` + ${selectedCategories.length - 1} more` : ""}`
        : "Products";
    }
    return "All Products";
  };

  const toggleCategoryExpand = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedCats((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const renderCategoryNode = (cat: Category, depth: number): React.ReactNode => {
    const children = categories.filter((c) => String(c.parent_id) === String(cat.id));
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedCats[cat.slug];
    const isChecked = selectedCategories.includes(cat.slug);

    return (
      <div key={cat.id} className="space-y-1">
        <div
          style={{ paddingLeft: `${depth * 16}px` }}
          className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-100/85 transition-colors group cursor-pointer select-none"
        >
          <label
            className="flex items-center gap-2.5 py-1 flex-1 cursor-pointer"
            onClick={() => {
              if (hasChildren) {
                // expand when checking, collapse when unchecking
                setExpandedCats((prev) => ({ ...prev, [cat.slug]: !isChecked }));
              }
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleCategoryToggle(cat.slug)}
              className="rounded border-slate-300 text-brand-accent focus:ring-brand-accent cursor-pointer size-4"
            />
            <span className={depth === 0 ? "font-bold text-slate-800" : depth === 1 ? "font-semibold text-slate-700" : "text-slate-500 font-medium text-xs"}>
              {cat.name}
            </span>
          </label>

          {hasChildren && (
            <button
              onClick={(e) => toggleCategoryExpand(cat.slug, e)}
              className="p-1 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1 animate-in fade-in duration-200">
            {children.sort((a, b) => a.name.localeCompare(b.name)).map((child) => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFiltersContent = (isMobile = false) => (
    <div className={isMobile ? "" : "bg-slate-50 border border-slate-200 rounded-2xl p-6"}>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-lg uppercase tracking-tight">
          <SlidersHorizontal className="w-5 h-5 text-brand-accent" />
          Filters
        </div>
        <button
          onClick={handleResetFilters}
          className="text-xs font-semibold text-slate-500 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <label className="text-xs font-black uppercase tracking-wider text-slate-650 block mb-2">
          Search
        </label>
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="Search products..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplyFilters({ search: searchVal || null, page: "1" })}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-accent transition-colors"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <button
          onClick={() => handleApplyFilters({ search: searchVal || null, page: "1" })}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-brand-accent text-white rounded-xl text-xs font-bold hover:bg-brand-accent/90 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          Apply Search
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <button
          onClick={() => toggleSection("category")}
          className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-800 focus:outline-none hover:text-slate-900 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-slate-500" />
            <span>Category</span>
            {selectedCategories.length > 0 && (
              <span className="bg-brand-accent/10 text-brand-accent px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none">
                {selectedCategories.length}
              </span>
            )}
          </div>
          {openSections.category ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.category && (
          <div className="mt-3 space-y-1.5 pr-1 animate-in fade-in duration-200">
            {categories.filter((c) => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name)).map((root) => renderCategoryNode(root, 0))}
          </div>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-800 focus:outline-none hover:text-slate-900 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-slate-500" />
            <span>Price Range</span>
            {(minPrice || maxPrice) && (
              <span className="bg-brand-accent/10 text-brand-accent px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none">
                1
              </span>
            )}
          </div>
          {openSections.price ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.price && (
          <div className="mt-3 space-y-3 animate-in fade-in duration-200">
            <div className="flex gap-3 items-center">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-accent"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-accent"
              />
            </div>
            <button
              onClick={() => handleApplyFilters({ min_price: minPrice, max_price: maxPrice })}
              className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white font-black uppercase tracking-wider text-xs py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Apply Price
            </button>
          </div>
        )}
      </div>

      {/* Brand Filter */}
      <div className="mb-4 pb-4 border-b border-slate-200 last:border-0 last:pb-0">
        <button
          onClick={() => toggleSection("brand")}
          className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-800 focus:outline-none hover:text-slate-900 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-500" />
            <span>Brand</span>
            {selectedBrands.length > 0 && (
              <span className="bg-brand-accent/10 text-brand-accent px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none">
                {selectedBrands.length}
              </span>
            )}
          </div>
          {openSections.brand ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.brand && (
          <div className="mt-3 space-y-1.5 pr-1 animate-in fade-in duration-200">
            {brands.map((b) => (
              <label
                key={b.id}
                className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(b.slug)}
                  onChange={() => handleBrandToggle(b.slug)}
                  className="rounded border-slate-300 text-brand-accent focus:ring-brand-accent cursor-pointer size-4"
                />
                <span>{b.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Specification/Attribute Filters */}
      {selectedCategories.length > 0 && specDefinitions.map((def: any) => {
        const options = Array.isArray(def.options) ? def.options : [];
        if (options.length === 0) return null;

        const isSectionOpen = !!openSections[def.key];
        const activeCount = selectedSpecs[def.key] ? selectedSpecs[def.key].length : 0;

        return (
          <div key={def.id} className="mb-4 pb-4 border-b border-slate-200 last:border-0 last:pb-0">
            <button
              onClick={() => toggleSection(def.key)}
              className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-800 focus:outline-none hover:text-slate-900 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>{def.label}</span>
                {activeCount > 0 && (
                  <span className="bg-brand-accent/10 text-brand-accent px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none">
                    {activeCount}
                  </span>
                )}
              </div>
              {isSectionOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isSectionOpen && (
              <div className="mt-3 space-y-1.5 pr-1 animate-in fade-in duration-200">
                {options.map((option: string) => (
                  <label
                    key={option}
                    className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedSpecs[def.key]?.includes(option)}
                      onChange={() => handleSpecToggle(def.key, option)}
                      className="rounded border-slate-300 text-brand-accent focus:ring-brand-accent cursor-pointer size-4"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-550">
        <Link href="/" className="hover:text-black transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800">{getPageTitle()}</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-2">
          {getPageTitle()}
        </h1>
        <p className="text-sm text-slate-650">
          Browse through our curated collection of high-quality electronics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters - Desktop only */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          {renderFiltersContent(false)}
        </div>

        {/* Products Grid & Results */}
        <div className="lg:col-span-3 space-y-6">
          {/* Mobile Search Bar — visible only on small screens */}
          <div className="lg:hidden flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyFilters({ search: searchVal || null, page: "1" });
                }}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-accent shadow-sm"
              />
            </div>
            <button
              onClick={() => handleApplyFilters({ search: searchVal || null, page: "1" })}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-accent text-white rounded-xl text-xs font-bold hover:bg-brand-accent/90 transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
          </div>

          {/* Top Bar results count + Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4">
            {/* Left side: total count */}
            <div className="text-xs sm:text-sm font-bold text-slate-700">
              {total.toLocaleString()} products found
            </div>

            {/* Right side: mobile filters and sort inline */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Mobile Filter Button */}
              <div className="lg:hidden flex-1 sm:flex-initial">
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-50 focus:outline-none transition-colors cursor-pointer shadow-sm">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-brand-accent" />
                      Filters
                      {(selectedCategories.length > 0 || selectedBrands.length > 0 || Object.keys(selectedSpecs).length > 0) && (
                        <span className="bg-brand-accent text-white rounded-full w-4 h-4 text-[10px] font-black flex items-center justify-center">
                          {selectedCategories.length + selectedBrands.length + Object.keys(selectedSpecs).length}
                        </span>
                      )}
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto bg-white p-6 border-r border-slate-200 text-slate-900">
                    <SheetTitle className="sr-only">Product Filters</SheetTitle>
                    <div className="mt-6">
                      {renderFiltersContent(true)}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-slate-550 shrink-0">Sort</span>
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    setSortBy(val);
                    handleApplyFilters({ sort: val });
                  }}
                >
                  <SelectTrigger className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-3 text-xs sm:text-sm text-slate-900 focus:border-brand-accent cursor-pointer shadow-sm h-10">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent position="popper" align="end" className="bg-white border border-slate-200 text-slate-900 rounded-xl shadow-lg z-50">
                    <SelectItem value="newest" className="hover:bg-slate-50 cursor-pointer">Newest</SelectItem>
                    <SelectItem value="price_asc" className="hover:bg-slate-50 cursor-pointer">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc" className="hover:bg-slate-50 cursor-pointer">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>


          {/* Product Grid Area */}
          <div className={`transition-opacity duration-300 ${isPending || isLoading ? "opacity-40" : "opacity-100"}`}>
            {isPending || isLoading ? (
              <ProductsSkeleton gridOnly />
            ) : products.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
                <p className="text-slate-650 text-base mb-2">No products found matching the criteria.</p>
                <button
                  onClick={handleResetFilters}
                  className="text-sm font-bold text-brand-accent hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination Container */}
          {totalPages > 1 && (
            <div className={`mt-10 transition-opacity duration-300 ${isPending || isLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                buildPageUrl={(page) => getFilterUrl({ page: String(page) })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
