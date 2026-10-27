import React from "react";
import { getPublicServices } from "@/services/service/service.service";
import {
  getPublicWhyChooseUs,
  getPublicWhyChooseUsMetrics,
} from "@/services/why-choose-us/why-choose-us.service";
import ServicesSection from "@/components/sections/services/ServicesSection";
import WhyChooseUsSection from "@/components/sections/services/WhyChooseUsSection";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `Services | ${BRAND.name}`,
  description:
    "Centralised LPG reticulation, autogas plants, industrial utility pipelines and fire hydrant systems for residential, commercial and industrial projects.",
};

export default async function ServicesPage() {
  const [{ services }, whyChooseItems, whyChooseMetrics] = await Promise.all([
    getPublicServices(),
    getPublicWhyChooseUs(),
    getPublicWhyChooseUsMetrics(),
  ]);

  return (
    <div className="space-y-0">
      <ServicesSection services={services} />
      <WhyChooseUsSection items={whyChooseItems} metrics={whyChooseMetrics} />
    </div>
  );
}
