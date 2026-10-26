"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, RotateCcw } from "lucide-react";
import type { WhyChooseUsMetrics } from "@/types/why-choose-us";
import {
  saveWhyChooseUsMetrics,
  DEFAULT_WHY_CHOOSE_US_METRICS,
} from "@/services/why-choose-us/why-choose-us.service";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: WhyChooseUsMetrics;
  onSaved: (updated: WhyChooseUsMetrics) => void;
}

export default function EditWhyChooseUsMetricsModal({
  open,
  onOpenChange,
  metrics,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<WhyChooseUsMetrics>(metrics || DEFAULT_WHY_CHOOSE_US_METRICS);

  useEffect(() => {
    if (metrics) {
      setForm(metrics);
    }
  }, [metrics, open]);

  const handleResetToDefaults = () => {
    setForm(DEFAULT_WHY_CHOOSE_US_METRICS);
    toast.info("Reset metrics to default 0 values (click Save to persist)");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Disallow negative values across all 4 metrics
    const keys: (keyof WhyChooseUsMetrics)[] = ["metric1", "metric2", "metric3", "metric4"];
    for (const k of keys) {
      const val = form[k]?.value ?? "";
      if (val.includes("-") || (parseFloat(val) < 0 && !isNaN(parseFloat(val)))) {
        toast.error("Metric values cannot be negative. Only positive values or 0 are allowed.");
        return;
      }
    }

    setLoading(true);

    try {
      const cleanVal = (raw?: string, fallback: string = "0") => {
        const cleaned = (raw ?? "").replace(/-/g, "").trim();
        return cleaned || fallback;
      };

      const res = await saveWhyChooseUsMetrics({
        metric1: {
          value: cleanVal(form.metric1.value, "0"),
          label: form.metric1.label?.trim() || DEFAULT_WHY_CHOOSE_US_METRICS.metric1.label,
          subtitle: form.metric1.subtitle?.trim() || DEFAULT_WHY_CHOOSE_US_METRICS.metric1.subtitle,
        },
        metric2: {
          value: cleanVal(form.metric2.value, "0"),
          label: form.metric2.label?.trim() || DEFAULT_WHY_CHOOSE_US_METRICS.metric2.label,
          subtitle: form.metric2.subtitle?.trim() || DEFAULT_WHY_CHOOSE_US_METRICS.metric2.subtitle,
        },
        metric3: {
          value: cleanVal(form.metric3.value, "0%"),
          label: form.metric3.label?.trim() || DEFAULT_WHY_CHOOSE_US_METRICS.metric3.label,
          subtitle: form.metric3.subtitle?.trim() || DEFAULT_WHY_CHOOSE_US_METRICS.metric3.subtitle,
        },
        metric4: {
          value: cleanVal(form.metric4.value, "0"),
          label: form.metric4.label?.trim() || DEFAULT_WHY_CHOOSE_US_METRICS.metric4.label,
          subtitle: form.metric4.subtitle?.trim() || DEFAULT_WHY_CHOOSE_US_METRICS.metric4.subtitle,
        },
      });

      if (!res.success) {
        toast.error(res.message || "Failed to save metrics");
        return;
      }

      toast.success("Why Choose Us statistics metrics updated successfully");
      if (res.data) {
        onSaved(res.data as WhyChooseUsMetrics);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save metrics");
    } finally {
      setLoading(false);
    }
  };

  const METRIC_CONFIGS = [
    {
      key: "metric1" as const,
      num: 1,
      title: "Metric 1",
      defaultVal: "0",
      accent: "text-[#FE6A34] border-orange-200 focus-visible:ring-orange-400",
      valPlaceholder: "e.g. 500+ or 0",
      labelPlaceholder: "e.g. Completed Projects",
      subPlaceholder: "e.g. Residential, Commercial & Industrial",
    },
    {
      key: "metric2" as const,
      num: 2,
      title: "Metric 2",
      defaultVal: "0",
      accent: "text-[#4EDEA3] border-emerald-200 focus-visible:ring-emerald-400",
      valPlaceholder: "e.g. 15+ or 0",
      labelPlaceholder: "e.g. Years Experience",
      subPlaceholder: "e.g. Excellence Since 2009",
    },
    {
      key: "metric3" as const,
      num: 3,
      title: "Metric 3",
      defaultVal: "0%",
      accent: "text-[#60a5fa] border-blue-200 focus-visible:ring-blue-400",
      valPlaceholder: "e.g. 99.9% or 0%",
      labelPlaceholder: "e.g. Safety Record",
      subPlaceholder: "e.g. Zero Critical Accident Incident",
    },
    {
      key: "metric4" as const,
      num: 4,
      title: "Metric 4",
      defaultVal: "0",
      accent: "text-[#FFDBD0] border-rose-200 focus-visible:ring-rose-400",
      valPlaceholder: "e.g. 100+ or 0",
      labelPlaceholder: "e.g. Restaurants & Food Courts",
      subPlaceholder: "e.g. Commercial Kitchen Networks",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Edit Why Choose Us Achievements Strip
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 pt-1">
            Update the 4 statistics metrics shown in the blue banner. All fields are optional (default is 0).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {METRIC_CONFIGS.map((cfg) => {
              const current = form[cfg.key];
              return (
                <div
                  key={cfg.key}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {cfg.title}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Default: {cfg.defaultVal}
                    </span>
                  </div>

                  {/* Value */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Number / Value <span className="text-slate-400 font-normal">(Optional, ≥ 0 only)</span>
                    </Label>
                    <Input
                      type="text"
                      value={current.value}
                      placeholder={cfg.valPlaceholder}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "Subtract") {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/-/g, "");
                        setForm((prev) => ({
                          ...prev,
                          [cfg.key]: { ...prev[cfg.key], value: clean },
                        }));
                      }}
                      className={`text-sm font-bold ${cfg.accent}`}
                    />
                  </div>

                  {/* Title / Label */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Title / Label <span className="text-slate-400 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      type="text"
                      value={current.label}
                      placeholder={cfg.labelPlaceholder}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [cfg.key]: { ...prev[cfg.key], label: e.target.value },
                        }))
                      }
                      className="text-xs"
                    />
                  </div>

                  {/* Subtitle / Description */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Subtitle / Context <span className="text-slate-400 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      type="text"
                      value={current.subtitle}
                      placeholder={cfg.subPlaceholder}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [cfg.key]: { ...prev[cfg.key], subtitle: e.target.value },
                        }))
                      }
                      className="text-xs text-slate-600"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToDefaults}
              className="text-xs h-10 px-3 text-slate-600 gap-1.5 border-slate-200 rounded-lg self-start sm:self-auto"
              title="Reset all fields to 0 default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </Button>

            <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="text-xs font-semibold h-10 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="text-xs font-bold h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white shadow-xs gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Metrics</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
