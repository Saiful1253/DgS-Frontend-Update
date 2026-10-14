import React from "react";
import { getPublicServices } from "@/services/service/service.service";
import { getTechnologies } from "@/services/technology/technology.service";
import ServicesClientView from "@/components/services/ServicesClientView";

export const revalidate = 3600;

export const metadata = {
  title: "Services & Capabilities | MilanoVA Technologies",
  description:
    "Explore MilanoVA's service pillars spanning software engineering, creative production, data, growth, and advisory services.",
};

export default async function ServicesPage() {
  const [{ services, pillars, groups }, technologies] = await Promise.all([
    getPublicServices(),
    getTechnologies(),
  ]);

  return (
    <ServicesClientView
      initialServices={services}
      pillars={pillars}
      groups={groups}
      technologies={technologies}
    />
  );
}
