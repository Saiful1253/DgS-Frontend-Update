import React from "react";
import { Package } from "lucide-react";
import { getProductsResult } from "@/services/product.service";
import { getBrandsResult } from "@/services/brand.service";
import { getCategoriesResult } from "@/services/category/category.service";
import LoadErrorPanel from "@/components/common/load-error-panel";
import ProductsManager from "@/components/products/products-manager";

export const revalidate = 0;

export const metadata = {
  title: "Product Catalogue | MilanoVA",
  description: "Manage catalogue products, categories, brands, pricing, warranty coverage and galleries.",
};

export default async function ProductsPage() {

  // One read per module, in parallel. A failure in any of them is a broken
  // screen, not an empty catalogue, so each is reported rather than defaulted to
  // an empty array.
  const [productResult, brandResult, categoryResult] = await Promise.all([
    getProductsResult({ page: 1, limit: 100 }),
    getBrandsResult(),
    getCategoriesResult(),
  ]);

  if (!productResult.ok) {
    return <LoadErrorPanel subject="products" message={productResult.message} />;
  }
  if (!brandResult.ok) {
    return <LoadErrorPanel subject="brands" message={brandResult.message} />;
  }
  if (!categoryResult.ok) {
    return <LoadErrorPanel subject="categories" message={categoryResult.message} />;
  }

  const { products, total } = productResult.data;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-mist text-primary border border-primary/20">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Product Catalogue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {total} {total === 1 ? "product" : "products"} across {categoryResult.data.length}{" "}
            {categoryResult.data.length === 1 ? "category" : "categories"} and{" "}
            {brandResult.data.length} {brandResult.data.length === 1 ? "brand" : "brands"}.
          </p>
        </div>
      </div>

      <ProductsManager
        initialProducts={products}
        categories={categoryResult.data}
        brands={brandResult.data}
      />
    </div>
  );
}
