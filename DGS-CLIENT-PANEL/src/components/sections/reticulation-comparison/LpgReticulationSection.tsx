"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, X, Check, Activity } from "lucide-react";

/* ── Figma Node 8:468 Comparison Data ── */
interface ComparisonRow {
  challenge: string;
  solution: string;
}

interface TabData {
  id: string;
  label: string;
  challengeHeader: {
    title: string;
    subtitle: string;
    badge: string;
  };
  solutionHeader: {
    title: string;
    subtitle: string;
    badge: string;
  };
  rows: ComparisonRow[];
}

const TABS: TabData[] = [
  {
    id: "central-lpg",
    label: "Central LPG Reticulation",
    challengeHeader: {
      title: "Traditional Challenges",
      subtitle: "Conventional Cylinder Setups",
      badge: "Pitfalls",
    },
    solutionHeader: {
      title: "DGS Engineered Solutions",
      subtitle: "Turnkey Certified Reticulation",
      badge: "Certified Fix",
    },
    rows: [
      {
        challenge: "Individual LPG cylinders require frequent replacement and are difficult to monitor.",
        solution: "Centralized LPG Reticulation System with continuous and safer gas distribution.",
      },
      {
        challenge: "Manual gas supply causes operational interruptions in restaurants and commercial kitchens.",
        solution: "Automated centralized gas pipeline ensuring uninterrupted supply.",
      },
      {
        challenge: "Multiple cylinders occupy valuable space and create safety concerns.",
        solution: "Secure manifold system with dedicated gas bank and safety monitoring.",
      },
      {
        challenge: "Gas leakage detection and maintenance are difficult.",
        solution: "Professionally designed pipeline network with safety valves and regular maintenance support.",
      },
    ],
  },
  {
    id: "industrial-piping",
    label: "Industrial Heavy Piping",
    challengeHeader: {
      title: "Traditional Challenges",
      subtitle: "Substandard Industrial Lines",
      badge: "High Risk",
    },
    solutionHeader: {
      title: "DGS Engineered Solutions",
      subtitle: "Heavy-Duty ASME Certified Piping",
      badge: "Engineered Fix",
    },
    rows: [
      {
        challenge: "Untested welded joints and low-grade ERW pipes risk severe rupture under high operational pressure.",
        solution: "Seamless ASTM A106 Grade B carbon steel piping with 100% NDT / radiographic inspection.",
      },
      {
        challenge: "Lack of pneumatic hydro-testing leads to undetected micro-leaks in furnace and boiler feed lines.",
        solution: "Comprehensive nitrogen pressure holding and hydrostatic certification by BUET-qualified engineers.",
      },
      {
        challenge: "Improper diameter engineering causes line pressure drops and fuel consumption spikes.",
        solution: "Precision hydraulic flow modeling ensuring consistent pressure delivery across all industrial burners.",
      },
      {
        challenge: "Uncertified field welders failing ASME Section IX and Titas Gas safety standards.",
        solution: "ASME & Titas 1st-class certified master welders delivering leak-proof structural integrity.",
      },
    ],
  },
  {
    id: "autogas-stations",
    label: "AutoGas Refueling Stations",
    challengeHeader: {
      title: "Traditional Challenges",
      subtitle: "Non-Compliant Station Setups",
      badge: "Pitfalls",
    },
    solutionHeader: {
      title: "DGS Engineered Solutions",
      subtitle: "Turnkey Compliant AutoGas Stations",
      badge: "Certified Fix",
    },
    rows: [
      {
        challenge: "Uncalibrated dispensers resulting in measurement drift and customer transaction friction.",
        solution: "OIML-compliant electronic dual-nozzle dispensers with high-precision mass flow metering.",
      },
      {
        challenge: "Substandard transfer pumps prone to cavitation, vapor lock, and frequent operational downtime.",
        solution: "Heavy-duty cryogenic side-channel pumps engineered specifically for continuous 24/7 duty cycles.",
      },
      {
        challenge: "Absence of emergency shear valves and remote Emergency Shut Down (ESD) interlocks.",
        solution: "Multi-point fail-safe ESD system with pneumatic actuators, breakaway couplings, and gas sniffers.",
      },
      {
        challenge: "Delayed regulatory approval caused by layout divergence from Explosives Department codes.",
        solution: "Full turnkey compliance and liaison services securing approvals from Explosives and Fire Service.",
      },
    ],
  },
  {
    id: "utility-rms",
    label: "Utility RMS & Compliance",
    challengeHeader: {
      title: "Traditional Challenges",
      subtitle: "Unregulated Utility Operations",
      badge: "Compliance Risk",
    },
    solutionHeader: {
      title: "DGS Engineered Solutions",
      subtitle: "Titas 1st-Class RMS Stations",
      badge: "Regulatory Shield",
    },
    rows: [
      {
        challenge: "Uncalibrated mechanical meters causing recurring billing disputes with utility providers.",
        solution: "Govt-approved Class 1.0 fiscal turbine metering skids with integrated electronic volume correctors.",
      },
      {
        challenge: "Erratic inlet pressure fluctuations triggering burner flameouts and production shutdowns.",
        solution: "Dual-stream active-monitor slam shut regulator skids delivering ultra-precise pressure control.",
      },
      {
        challenge: "Substandard pipe routing risking safety violation notices and utility disconnection.",
        solution: "100% compliant engineering documentation and official handover certified by regulatory authorities.",
      },
      {
        challenge: "Lack of digital data telemetry for real-time monitoring of gas consumption and line status.",
        solution: "IoT-enabled SCADA telemetry providing live cloud monitoring of pressure, temperature, and volume.",
      },
    ],
  },
];

export default function LpgReticulationSection() {
  const [activeTab, setActiveTab] = useState<string>("central-lpg");
  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <section id="reticulation-comparison" className="w-full bg-[#E5EEFF] py-16 lg:py-24">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 sm:px-6 lg:px-8">
        
        {/* ── Section Header ── */}
        <div className="flex flex-col gap-1.5">
          <h2 className="font-sans text-2xl font-semibold tracking-[-0.8px] text-[#0B1C30] sm:text-3xl lg:text-[32px] lg:leading-10">
            Why Choose Our LPG Reticulation System?
          </h2>
          <p className="font-sans text-sm font-semibold text-[#005F9D]">
            Traditional Challenges &amp; Our Solutions
          </p>
        </div>

        {/* ── Tab Switcher Navigation ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none sm:gap-2.5">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer whitespace-nowrap rounded px-4 py-2 font-space text-[12px] font-semibold transition-all ${
                  isActive
                    ? "bg-[#005F9D] text-white shadow-sm"
                    : "border border-slate-200/80 bg-white text-[#0B1C30] hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Comparison Table Card ── */}
        <div className="overflow-hidden rounded-lg border border-slate-200/60 bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]">
          
          {/* Table Headers (Traditional vs DGS Solutions) */}
          <div className="grid grid-cols-1 border-b border-slate-200/80 lg:grid-cols-2">
            
            {/* Left Header — Challenges */}
            <div className="flex items-center justify-between bg-[#FEF2F2] p-5 sm:px-6 sm:py-5 lg:border-r lg:border-slate-200/80">
              <div className="flex items-center gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFDAD6] text-[#BA1A1A]">
                  <X className="h-4 w-4 stroke-[2.5]" />
                </span>
                <div className="flex flex-col">
                  <span className="font-sans text-base font-bold text-[#0B1C30]">
                    {currentTab.challengeHeader.title}
                  </span>
                  <span className="font-space text-[11px] font-medium text-[#BA1A1A]">
                    {currentTab.challengeHeader.subtitle}
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#FFDAD6] px-2.5 py-0.5 font-space text-[11px] font-semibold text-[#BA1A1A]">
                {currentTab.challengeHeader.badge}
              </span>
            </div>

            {/* Right Header — Solutions */}
            <div className="flex items-center justify-between bg-[#ECFDF5] p-5 sm:px-6 sm:py-5">
              <div className="flex items-center gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D1FAE5] text-[#047857]">
                  <Check className="h-4 w-4 stroke-[2.5]" />
                </span>
                <div className="flex flex-col">
                  <span className="font-sans text-base font-bold text-[#0B1C30]">
                    {currentTab.solutionHeader.title}
                  </span>
                  <span className="font-space text-[11px] font-medium text-[#047857]">
                    {currentTab.solutionHeader.subtitle}
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#D1FAE5] px-2.5 py-0.5 font-space text-[11px] font-semibold text-[#047857]">
                {currentTab.solutionHeader.badge}
              </span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100">
            {currentTab.rows.map((row, index) => (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-2">
                
                {/* Left Column Item (Challenge) */}
                <div className="flex items-start gap-3.5 p-4 sm:px-6 sm:py-5 lg:border-r lg:border-slate-100">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[#BA1A1A]">
                    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 7L13 13M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <p className="font-sans text-[14px] leading-relaxed text-[#404751]">
                    {row.challenge}
                  </p>
                </div>

                {/* Right Column Item (Solution) */}
                <div className="flex items-start gap-3.5 bg-emerald-50/20 p-4 sm:px-6 sm:py-5 lg:bg-transparent">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[#059669]">
                    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M6.5 10.5L9 13L13.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <p className="font-sans text-[14px] font-medium leading-relaxed text-[#0B1C30]">
                    {row.solution}
                  </p>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* ── Safety Audit Callout Banner ── */}
        <div className="flex flex-col items-start justify-between gap-5 rounded-lg border border-slate-200/60 bg-white p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center sm:p-6 lg:p-7">
          <div className="flex items-start gap-4 sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#005F9D]">
              <Activity className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <h3 className="font-sans text-base font-semibold text-[#0B1C30] sm:text-[16px]">
                Suspect Leaks or Substandard Piping in Your Facility?
              </h3>
              <p className="mt-0.5 font-sans text-xs text-[#404751] sm:text-[13px]">
                Our BUET-qualified engineers perform ultrasonic leak detection and hydro-pressure verification across Greater Dhaka.
              </p>
            </div>
          </div>

          <Link
            href="/contact"
            className="group inline-flex shrink-0 items-center gap-2 rounded bg-[#FF5400] px-5 py-3 font-space text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#E64B00] hover:shadow"
          >
            <span>Book Diagnostic Audit</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </section>
  );
}
