import React from "react";
import { getBlogAuthorsResult } from "@/services/blog/blog.service";
import LoadErrorPanel from "@/components/common/load-error-panel";
import BlogTaxonomyManager from "@/components/blog/blog-taxonomy-manager";

export const revalidate = 0;

export default async function BlogAuthorsPage() {

  const canManage = true;
  const result = await getBlogAuthorsResult();

  if (!result.ok) return <LoadErrorPanel subject="blog authors" message={result.message} />;

  return <BlogTaxonomyManager kind="author" initialItems={result.data} canManage={canManage} />;
}