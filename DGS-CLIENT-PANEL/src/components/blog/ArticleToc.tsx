 
"use client";

import React, { useEffect, useState } from "react";
import { ListOrdered } from "lucide-react";

interface TocHeading {
  level: number;
  text: string;
  id: string;
}

interface ArticleTocProps {
  headings: TocHeading[];
}

export default function ArticleToc({ headings }: ArticleTocProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <ListOrdered size={14} className="text-brand-accent" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-700">
          Table of Contents
        </span>
      </div>
      <ul className="space-y-2">
        {headings.map((h) => (
          <li key={h.id}>
            <button
              onClick={() => scrollTo(h.id)}
              className={`text-left text-[13px] font-semibold leading-snug transition-colors duration-200 hover:text-brand-accent ${
                h.level === 3 ? "pl-4" : ""
              } ${
                activeId === h.id
                  ? "text-brand-accent"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}