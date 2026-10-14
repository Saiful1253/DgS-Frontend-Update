import React from "react";
import { getBlogResult } from "@/services/blog/blog.service";
import LoadErrorPanel from "@/components/common/load-error-panel";
import BlogDetailsView from "@/components/blog/blog-details-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileX } from "lucide-react";
import Link from "next/link";

interface BlogDetailsPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function BlogDetailsPage({ params }: BlogDetailsPageProps) {
  const { id } = await params;

  const hasManageAccess = true;
  const hasPublishAccess = true;
  const blogResult = await getBlogResult(id);

  if (!blogResult.ok) return <LoadErrorPanel subject="this blog" message={blogResult.message} />;

  const blog = blogResult.data;

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50/50">
        <div className="w-20 h-20 bg-white rounded-3xl border shadow-sm flex items-center justify-center mb-6">
          <FileX className="w-10 h-10 text-slate-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">No Blog Data Found</h1>
        <p className="text-slate-500 text-sm mt-2 mb-8 text-center max-w-md">
          The blog post you are looking for does not exist or has been removed from the database.
        </p>
        <Button variant="outline" asChild className="rounded-xl font-bold uppercase text-xs tracking-widest px-8 h-11">
          <Link href="/blogs">
            <ArrowLeft size={16} className="mr-2" />
            Back to Blogs
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <BlogDetailsView
      blog={blog}
      hasManageAccess={hasManageAccess}
      canPublish={hasPublishAccess}
    />
  );
}