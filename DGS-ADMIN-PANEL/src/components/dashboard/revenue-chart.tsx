/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { format, parseISO, eachDayOfInterval, subDays, isSameDay } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTransition } from "react";

interface RevenueChartProps {
  data: any[];
  days?: number;
  from?: string;
  to?: string;
}

export default function RevenueChart({ data, days = 30, from, to }: RevenueChartProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [draftFrom, setDraftFrom] = useState(from ?? "");
  const [draftTo, setDraftTo] = useState(to ?? "");

  const hasCustomRange = Boolean(from || to);

  const handleDaysChange = (val: string) => {
    setDraftFrom("");
    setDraftTo("");
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("days", val);
      params.delete("from");
      params.delete("to");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleApplyDateRange = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (draftFrom) params.set("from", draftFrom);
      else params.delete("from");

      if (draftTo) params.set("to", draftTo);
      else params.delete("to");

      params.delete("days");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const clearFilters = () => {
    setDraftFrom("");
    setDraftTo("");
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("days");
      params.delete("from");
      params.delete("to");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // 1. Sort incoming data
  const sortedRawData = [...(data || [])].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 2. Generate full timeline
  let startDate: Date;
  let endDate: Date;

  if (from && to) {
    startDate = parseISO(from);
    endDate = parseISO(to);
  } else if (from) {
    startDate = parseISO(from);
    endDate = new Date();
  } else if (to) {
    endDate = parseISO(to);
    startDate = subDays(endDate, (days || 30) - 1);
  } else {
    endDate = new Date();
    startDate = subDays(endDate, (days || 30) - 1);
  }

  if (startDate > endDate) {
    const tmp = startDate;
    startDate = endDate;
    endDate = tmp;
  }

  const timeline = eachDayOfInterval({ start: startDate, end: endDate });

  const chartData = timeline.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const existingEntry = sortedRawData.find((d) => {
      try {
        return isSameDay(parseISO(d.date), day);
      } catch {
        return d.date === dateStr;
      }
    });

    return {
      date: dateStr,
      revenue: existingEntry ? Number(existingEntry.revenue) : 0,
    };
  });

  // Map and format data
  const isLongRange = chartData.length > 365;
  const formattedData = chartData.map((item) => {
    let dateStr = item.date;
    try {
      const d = parseISO(dateStr);
      dateStr = format(d, isLongRange ? "MMM dd, yyyy" : "MMM dd");
    } catch {
      // Keep as is
    }

    return {
      ...item,
      formattedDate: dateStr,
      revenue: Number(item.revenue),
    };
  });

  return (
    <div className="space-y-4">
      {/* FILTER CONTROLS TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl border bg-gray-50/50">
        {/* Date Range Inputs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">From:</span>
            <Input
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="h-7 w-33 text-xs border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">To:</span>
            <Input
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              className="h-7 w-33 text-xs border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
          </div>

          <Button
            size="sm"
            onClick={handleApplyDateRange}
            className="h-8 px-4 text-xs font-semibold shadow-xs"
          >
            Apply Filter
          </Button>

          {(hasCustomRange || searchParams.has("days")) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-3 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border-gray-200"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Timeframe Presets */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {hasCustomRange && (
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Range: {from || "Start"} → {to || "Today"}
            </span>
          )}
          <span className="text-[10px] font-bold italic tracking-widest text-gray-500">
            Timeframe:
          </span>
          <Select
            value={hasCustomRange ? "custom" : String(days)}
            onValueChange={handleDaysChange}
          >
            <SelectTrigger className="h-8 w-36 text-xs font-semibold bg-white border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hasCustomRange && (
                <SelectItem value="custom" disabled>
                  Custom Range
                </SelectItem>
              )}
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="15">15 Days</SelectItem>
              <SelectItem value="30">1 Month</SelectItem>
              <SelectItem value="60">2 Months</SelectItem>
              <SelectItem value="90">3 Months</SelectItem>
              <SelectItem value="120">4 Months</SelectItem>
              <SelectItem value="180">6 Months</SelectItem>
              <SelectItem value="365">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CHART CONTAINER */}
      <div
        className={cn(
          "h-87.5 w-full pt-2 transition-opacity duration-200",
          isPending && "opacity-60"
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="formattedDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#888888", fontWeight: 500 }}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#888888", fontWeight: 500 }}
              tickFormatter={(value) => `৳${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2.5 shadow-md">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          {payload[0].payload.date}
                        </span>
                        <span className="font-extrabold text-primary text-sm">
                          ৳{Number(payload[0].value).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#dashboardRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
