import React from "react";
import { getBlogTagsResult } from "@/services/blog/blog.service";
import LoadErrorPanel from "@/components/common/load-error-panel";
import BlogTagsManager from "@/components/blog/blog-tags-manager";

export const revalidate = 0;

export default async function BlogTagsPage() {

  const canManage = true;
  const result = await getBlogTagsResult();

  if (!result.ok) return <LoadErrorPanel subject="blog tags" message={result.message} />;

  return <BlogTagsManager initialItems={result.data} canManage={canManage} />;
}