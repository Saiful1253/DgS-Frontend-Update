import { Suspense } from "react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ProductsClient from "./ProductsClient"; // reload HMR
import ProductsSkeleton from "@/components/skeletons/ProductsSkeleton";
import {
  getCategories,
  getProducts,
  getBrands,
  getFeaturedProducts,
} from "@/services/product/product.service";
import type { Metadata } from "next";
import type {
  ProductSort,
  ProductsListPayload,
} from "@/types/product/product.list";
import type { Brand } from "@/types/product/product";
import type { Category } from "@/types/product/product.category";

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc"];

/**
 * `?sort=` is attacker-controlled text reaching the API query, so it is checked
 * against the closed set rather than cast.
 */
function normalizeSort(raw?: string): ProductSort | undefined {
  return SORTS.includes(raw as ProductSort) ? (raw as ProductSort) : undefined;
}

export const revalidate = 60;

export const metadata: Metadata = {
  title: "All Products | Electronics Retailer",
  description: "Browse our full range of genuine electronics, home appliances and accessories.",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    brand?: string;
    min_price?: string;
    max_price?: string;
    sort?: string;
    featured?: string;
    specifications?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { page, search, category, brand, min_price, max_price, sort, featured, specifications } = params;

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-white pt-24 text-slate-900">
        <Suspense fallback={<div className="container mx-auto px-6 py-10"><ProductsSkeleton /></div>}>
          <ProductsLoader
            page={page}
            search={search}
            category={category}
            brand={brand}
            minPrice={min_price}
            maxPrice={max_price}
            sort={sort}
            featured={featured}
            specifications={specifications}
          />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

async function ProductsLoader({
  page,
  search,
  category,
  brand,
  minPrice,
  maxPrice,
  sort,
  featured,
  specifications,
}: {
  page?: string;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  featured?: string;
  specifications?: string;
}) {
  const currentPage = Number(page) || 1;
  const isFeatured = featured === "true";

  const parsePrice = (v?: string) => {
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const PAGE_SIZE = 9;

  let productsData: ProductsListPayload | null = null;
  let categoriesData: Category[] = [];
  let brandsData: Brand[] = [];

  try {
    // Featured is the same query with `isFeatured: true`, not a separate route.
    // It used to call `/client/products/featured`, which collided with
    // `/client/products/:slug` and 404'd on every request.
    const productsPromise = isFeatured
      ? getFeaturedProducts(PAGE_SIZE)
      : getProducts({
          page: currentPage,
          limit: PAGE_SIZE,
          search,
          category,
          brand,
          minPrice: parsePrice(minPrice),
          maxPrice: parsePrice(maxPrice),
          sort: normalizeSort(sort),
          specifications,
        });

    const [categories, brands, products] = await Promise.all([
      getCategories(),
      getBrands(),
      productsPromise,
    ]);

    categoriesData = categories;
    brandsData = brands;
    productsData = products;
  } catch (error) {
    console.error("Error loading products page data:", error);
  }

  const initialProducts = productsData?.data ?? [];
  const totalProducts = productsData?.total ?? 0;
  const totalPages = productsData?.pages ?? 0;

  return (
    <ProductsClient
      initialProducts={initialProducts}
      categories={categoriesData}
      brands={brandsData}
      totalProducts={totalProducts}
      totalPages={totalPages}
      currentPage={currentPage}
      filterParams={{ search, category, brand, minPrice, maxPrice, sort, featured, specifications }}
    />
  );
}
