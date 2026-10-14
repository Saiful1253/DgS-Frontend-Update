import React from "react";
import {
  getPortfoliosResult,
  getPortfolioCategoriesResult,
} from "@/services/portfolio/portfolio.service";
import PortfolioManager from "@/components/portfolio/portfolio-manager";
import LoadErrorPanel from "@/components/common/load-error-panel";

export const revalidate = 0;

export const metadata = {
  title: "Portfolio & Case Studies Manager | Milanova Technologies",
  description: "Manages showcased client projects, case study details, category selectors, live search tags, and challenge vs. solution repeater blocks.",
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: Promise<{ action?: string; create?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const shouldAutoOpen =
    resolvedParams?.action === "create" || resolvedParams?.create === "true";

  const hasManageAccess = true;

  const [portfoliosResult, categoriesResult] = await Promise.all([
    getPortfoliosResult(),
    getPortfolioCategoriesResult(),
  ]);

  // A failed fetch must not render as an empty grid. The previous
  // `.catch(() => [])` made an API outage indistinguishable from "no case
  // studies yet", which is how a broken integration could sit unnoticed.
  if (!portfoliosResult.ok) {
    return (
      <LoadErrorPanel
        message={portfoliosResult.message}
        subject="portfolio projects"
      />
    );
  }
  if (!categoriesResult.ok) {
    return (
      <LoadErrorPanel
        message={categoriesResult.message}
        subject="portfolio categories"
      />
    );
  }

  return (
    <PortfolioManager
      initialPortfolios={portfoliosResult.data}
      initialCategories={categoriesResult.data.data}
      canManage={hasManageAccess}
      autoOpenCreate={shouldAutoOpen}
    />
  );
}
