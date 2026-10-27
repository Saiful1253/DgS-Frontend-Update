import type { WhyChooseUsSchemaType } from "@/zod/why-choose-us.validation";

export type WhyChooseUs = WhyChooseUsSchemaType;

export interface WhyChooseUsState {
  items: WhyChooseUs[];
  loading: boolean;
  error?: string | null;
}

export interface WhyChooseUsMetricItem {
  value: string;
  label: string;
  subtitle: string;
}

export interface WhyChooseUsMetrics {
  metric1: WhyChooseUsMetricItem;
  metric2: WhyChooseUsMetricItem;
  metric3: WhyChooseUsMetricItem;
  metric4: WhyChooseUsMetricItem;
}

export const DEFAULT_WHY_CHOOSE_US_METRICS: WhyChooseUsMetrics = {
  metric1: {
    value: "0",
    label: "Completed Projects",
    subtitle: "Residential, Commercial & Industrial",
  },
  metric2: {
    value: "0",
    label: "Years Experience",
    subtitle: "Excellence Since 2009",
  },
  metric3: {
    value: "0%",
    label: "Safety Record",
    subtitle: "Zero Critical Accident Incident",
  },
  metric4: {
    value: "0",
    label: "Restaurants & Food Courts",
    subtitle: "Commercial Kitchen Networks",
  },
};

