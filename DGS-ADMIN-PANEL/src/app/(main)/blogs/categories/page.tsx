import React from "react";
import { getBlogCategoriesResult } from "@/services/blog/blog.service";
import LoadErrorPanel from "@/components/common/load-error-panel";
import BlogTaxonomyManager from "@/components/blog/blog-taxonomy-manager";

export const revalidate = 0;

export default async function BlogCategoriesPage() {

  const result = await getBlogCategoriesResult();

  if (!result.ok) return <LoadErrorPanel subject="blog categories" message={result.message} />;

  return <BlogTaxonomyManager kind="category" initialItems={result.data} />;
}