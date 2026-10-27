import React from "react";
import { getPortfoliosResult } from "@/services/portfolio/portfolio.service";
import { getServicesResult } from "@/services/service/service.service";
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

  const [portfoliosResult, servicesResult] = await Promise.all([
    getPortfoliosResult(),
    getServicesResult({ limit: 100 }),
  ]);

  if (!portfoliosResult.ok) {
    return (
      <LoadErrorPanel
        message={portfoliosResult.message}
        subject="portfolio projects"
      />
    );
  }

  const rawServices = servicesResult.ok && servicesResult.data?.data ? servicesResult.data.data : [];
  const serviceCategories =
    Array.isArray(rawServices)
      ? rawServices.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
        }))
      : [];

  return (
    <PortfolioManager
      initialPortfolios={portfoliosResult.data}
      initialCategories={serviceCategories}
      autoOpenCreate={shouldAutoOpen}
    />
  );
}
