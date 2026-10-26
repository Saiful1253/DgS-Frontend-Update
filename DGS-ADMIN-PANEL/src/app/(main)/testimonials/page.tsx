import React, { Suspense } from "react";
import { MessageSquare, Star, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getTestimonialsResult,
  getTestimonialsStatsResult,
} from "@/services/testimonials/testimonials.service";
import { parseTestimonialSearchParams } from "@/lib/query/testimonial-query";
import TestimonialsClient from "@/components/testimonials/testimonials-client";
import { TestimonialsSkeleton } from "@/components/testimonials/testimonials-skeleton";
import AddTestimonialModal from "@/components/testimonials/add-testimonial-modal";

export const revalidate = 0;

export const metadata = {
  title: "Client Testimonials & Reviews | MilanoVA DGS",
  description:
    "Manage client reviews, enterprise testimonials, ratings, and client endorsements.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function TestimonialsPageContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const query = parseTestimonialSearchParams(searchParams);

  const [testimonialsRes, statsRes] = await Promise.all([
    getTestimonialsResult(query),
    getTestimonialsStatsResult(),
  ]);

  const payload = testimonialsRes.ok
    ? testimonialsRes.data
    : { data: [], total: 0, page: 1, limit: 10, pages: 1 };
  const stats = statsRes.ok
    ? statsRes.data
    : {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        featured: 0,
        averageRating: 5.0,
      };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-mist text-primary border border-primary/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Testimonials & Client Feedback
            </h1>
            <Badge
              variant="outline"
              className="text-xs bg-sky-mist/50 text-primary border-primary/20 font-medium"
            >
              Social Proof
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Curate verified client feedback, executive testimonials, and engineering reviews displayed on the public storefront.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AddTestimonialModal />
        </div>
      </div>

      {/* Stats KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Rating
          </span>
          <div className="text-2xl font-bold text-slate-900 flex items-center gap-1.5">
            <span>{stats.averageRating.toFixed(1)}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-[11px] text-slate-400">From approved reviews</p>
        </div>

        {/* Total Published / Approved */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Approved & Live
          </span>
          <div className="text-2xl font-bold text-emerald-600 flex items-center gap-1.5">
            <span>{stats.approved}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[11px] text-slate-400">Visible to public clients</p>
        </div>

        {/* Pending Moderation */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Moderation
          </span>
          <div className="text-2xl font-bold text-amber-600 flex items-center gap-1.5">
            <span>{stats.pending}</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-[11px] text-slate-400">Submitted by website visitors</p>
        </div>

        {/* Featured in Marquee */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Featured in Marquee
          </span>
          <div className="text-2xl font-bold text-primary flex items-center gap-1.5">
            <span>{stats.featured}</span>
            <Star className="w-5 h-5 fill-primary text-primary" />
          </div>
          <p className="text-[11px] text-slate-400">Looping on landing page</p>
        </div>
      </div>

      {/* Main Client Table / List */}
      <TestimonialsClient
        testimonials={payload.data}
        total={payload.total}
        page={payload.page}
        limit={payload.limit}
        activeTab={query.is_featured ? "featured" : query.status === "pending" ? "pending" : "all"}
        stats={stats}
      />
    </div>
  );
}

export default async function TestimonialsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <Suspense fallback={<TestimonialsSkeleton />}>
      <TestimonialsPageContent searchParams={resolvedParams} />
    </Suspense>
  );
}
