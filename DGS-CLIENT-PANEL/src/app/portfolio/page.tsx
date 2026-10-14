import type { Metadata } from "next";
import { getPublicPortfolio } from "@/services/portfolio/portfolio.service";
import PortfolioClientView from "@/components/portfolio/PortfolioClientView";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Portfolio & Case Studies | MilanoVA Technologies",
  description:
    "Browse MilanoVA's shipped work across software engineering, creative production, and digital marketing — each project documented with its challenge, solution, and measurable outcome.",
};

export default async function PortfolioPage() {
  const { projects, categories } = await getPublicPortfolio();

  return (
    <>
      <section className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-10 md:py-24">
          <p className="text-xs font-black uppercase tracking-widest text-brand-accent">
            Portfolio &amp; Case Studies
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground md:text-5xl">
            Work we have shipped
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Every engagement documented as a case study: the challenge, the
            engineered solution, and the benchmark comparison against the
            industry-standard approach.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 md:px-10 md:py-16">
        <PortfolioClientView projects={projects} categories={categories} />
      </main>
    </>
  );
}
