import React from "react";
import { getBlogsResult } from "@/services/blog/blog.service";
import LoadErrorPanel from "@/components/common/load-error-panel";
import BlogsManager from "@/components/blog/blogs-manager";

export const revalidate = 0;

export const metadata = {
  title: "Blogs & Articles Manager | Milanova Technologies",
  description: "Creates and manages editorial content, engineering news, technical publications, featured images, and rich-text article bodies.",
};

export default async function BlogsPage() {

  const blogResult = await getBlogsResult({ page: 1, limit: 100 });

  if (!blogResult.ok) return <LoadErrorPanel subject="blogs" message={blogResult.message} />;

  return (
    <BlogsManager
      initialBlogs={blogResult.data.data}
    />
  );
}