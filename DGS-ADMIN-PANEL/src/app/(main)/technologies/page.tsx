import React from "react";
import {
  getTechnologiesResult,
  getTechnologyCategoriesResult,
} from "@/services/technology/technology.service";
import TechnologiesManager from "@/components/technologies/technologies-manager";
import LoadErrorPanel from "@/components/common/load-error-panel";

export const revalidate = 0;

export const metadata = {
  title: "Technologies & Tech Stacks | MilanoVA",
  description: "Manage technical framework categories, cloud tools, and architecture competencies.",
};

export default async function TechnologiesPage() {

  const [techResult, catResult] = await Promise.all([
    getTechnologiesResult(),
    getTechnologyCategoriesResult(),
  ]);

  if (!techResult.ok) return <LoadErrorPanel subject="technologies" message={techResult.message} />;
  if (!catResult.ok) return <LoadErrorPanel subject="technology categories" message={catResult.message} />;

  return (
    <TechnologiesManager
      initialTechnologies={techResult.data}
      initialCategories={catResult.data.data}
    />
  );
}
