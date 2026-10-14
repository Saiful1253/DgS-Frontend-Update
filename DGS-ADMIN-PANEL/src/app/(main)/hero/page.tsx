import React from "react";
import { getHeroesResult } from "@/services/hero/hero.service";
import HeroManager from "@/components/hero/hero-manager";

export const revalidate = 0;

export const metadata = {
  title: "Hero Sections Manager | Milanova Technologies",
  description: "Manages homepage hero slider sections, promotional banners, call-to-action buttons, and image/video media assets.",
};

export default async function HeroPage({
  searchParams,
}: {
  searchParams?: Promise<{ action?: string; create?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const shouldAutoOpen =
    resolvedParams?.action === "create" || resolvedParams?.create === "true";

  const hasManageAccess = true;

  const heroResult = await getHeroesResult({ page: 1, limit: 100 });

  // A failed fetch must not render as an empty carousel. The previous
  // `.catch(() => ({ data: [], … }))` made an API outage indistinguishable from
  // "no sections yet", which is how a broken integration could sit unnoticed.
  if (!heroResult.ok) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-200"
      >
        <h2 className="text-lg font-semibold text-red-100">Could not load hero sections</h2>
        <p className="mt-2 text-sm text-red-200/90">{heroResult.message}</p>
        <p className="mt-3 text-xs text-red-200/70">
          This is a backend or network problem, not an empty carousel. Retry, and check the
          API service if it persists.
        </p>
      </div>
    );
  }

  return (
    <HeroManager
      initialHeroes={heroResult.data.data}
      canManage={hasManageAccess}
      autoOpenCreate={shouldAutoOpen}
    />
  );
}
