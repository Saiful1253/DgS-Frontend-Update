import React from "react";
import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50/50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 animate-pulse">
          Loading...
        </span>
      </div>
    </div>
  );
}