"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebounce } from "./use-debounce";
import type { Category } from "@/types/product/product.category";

export interface ProductFilterValues {
  search: string;
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
}

export interface UseProductFiltersOptions {
  categories: Category[];
  onFilterChange?: (filters: ProductFilterValues) => void;
  instantSearch?: boolean;
}

export function useProductFilters({
  categories,
  onFilterChange,
  instantSearch = false,
}: UseProductFiltersOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(() => {
    const raw = searchParams.get("category");
    return raw && raw !== "all" && categories?.some?.((c) => c.slug === raw) ? raw : "";
  });
  const [brand, setBrand] = useState(() => {
    const raw = searchParams.get("brand");
    return raw && raw !== "all" ? raw : "";
  });
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "");

  const debouncedSearch = useDebounce(search, 400);
  const isInitialSearch = useRef(true);

  const readPrices = (minP: string, maxP: string) => ({
    minPriceNum:
      minP.trim() && !Number.isNaN(Number(minP)) && Number(minP) >= 0 ? minP.trim() : "",
    maxPriceNum:
      maxP.trim() && !Number.isNaN(Number(maxP)) && Number(maxP) >= 0 ? maxP.trim() : "",
  });

  // Core filter applier
  const applyFilters = (values: ProductFilterValues) => {
    if (onFilterChange) {
      onFilterChange(values);
      return;
    }

    const { minPriceNum, maxPriceNum } = readPrices(values.minPrice, values.maxPrice);
    const params = new URLSearchParams(searchParams.toString());
    if (values.search.trim()) {
      params.set("search", values.search.trim());
    } else {
      params.delete("search");
    }

    if (values.category) {
      params.set("category", values.category);
    } else {
      params.delete("category");
    }

    if (values.brand) {
      params.set("brand", values.brand);
    } else {
      params.delete("brand");
    }

    if (minPriceNum) {
      params.set("min_price", minPriceNum);
    } else {
      params.delete("min_price");
    }

    if (maxPriceNum) {
      params.set("max_price", maxPriceNum);
    } else {
      params.delete("max_price");
    }

    if (values.sort) {
      params.set("sort", values.sort);
    } else {
      params.delete("sort");
    }
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Debounced search trigger for instant search
  useEffect(() => {
    if (!instantSearch) return;
    if (isInitialSearch.current) {
      isInitialSearch.current = false;
      return;
    }
    applyFilters({ search: debouncedSearch, category, brand, minPrice, maxPrice, sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, instantSearch]);

  const handleCategoryChange = (value: string) => {
    const newCategory = value === "all" ? "" : value;
    setCategory(newCategory);
    if (instantSearch) {
      applyFilters({ search, category: newCategory, brand, minPrice, maxPrice, sort });
    }
  };

  const handleBrandChange = (value: string) => {
    const newBrand = value === "all" ? "" : value;
    setBrand(newBrand);
    if (instantSearch) {
      applyFilters({ search, category, brand: newBrand, minPrice, maxPrice, sort });
    }
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    if (instantSearch) {
      applyFilters({ search, category, brand, minPrice, maxPrice, sort: value });
    }
  };

  const handleApplyClick = () => {
    applyFilters({ search, category, brand, minPrice, maxPrice, sort });
  };

  const handleReset = () => {
    setSearch("");
    setCategory("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSort("");
    if (onFilterChange) {
      onFilterChange({ search: "", category: "", brand: "", minPrice: "", maxPrice: "", sort: "" });
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    ["search", "category", "brand", "min_price", "max_price", "sort"].forEach((k) =>
      params.delete(k)
    );
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("category") ||
    searchParams.has("brand") ||
    searchParams.has("min_price") ||
    searchParams.has("max_price") ||
    searchParams.has("sort");

  return {
    search,
    setSearch,
    category,
    sort,
    brand,
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
    hasFilters,
    handleCategoryChange,
    handleBrandChange,
    handleSortChange,
    handleApplyClick,
    handleReset,
  };
}
