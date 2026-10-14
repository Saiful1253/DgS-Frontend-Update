import React from "react";
import { Mail, Plus, ShieldCheck,    Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0;

export const metadata = {
  title: "Leads & Consultation Pipeline | MilanoVA",
  description: "Manage client inquiries, consultation bookings, RFP requests, and qualification pipeline.",
};

export default async function LeadsPage() {

  const hasManageAccess = true;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-mist text-primary border border-primary/20">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Contact Leads & Inquiries Manager</h1>
            <Badge variant="outline" className="text-xs bg-sky-mist/50 text-primary border-primary/20 font-medium">
              Sales Pipeline
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Track, qualify, and convert enterprise consultations, general inquiries, partnership proposals, and project RFP submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasManageAccess ? (
            <Button size="sm" className="gap-1.5 h-9 bg-primary text-white hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              <span>Log Inbound Lead</span>
            </Button>
          ) : (
            <Badge variant="secondary" className="text-xs gap-1 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              Read-Only Access
            </Badge>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Inquiries</span>
          <div className="text-2xl font-bold text-slate-900">12</div>
          <p className="text-[11px] text-slate-400">Needs qualification</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualified Deals</span>
          <div className="text-2xl font-bold text-primary">7</div>
          <p className="text-[11px] text-slate-400">Discovery call completed</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proposal Sent</span>
          <div className="text-2xl font-bold text-amber-600">4</div>
          <p className="text-[11px] text-slate-400">Awaiting client signoff</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Won This Quarter</span>
          <div className="text-2xl font-bold text-emerald-600">€240k</div>
          <p className="text-[11px] text-slate-400">Contract value secured</p>
        </div>
      </div>

      {/* Leads Directory */}
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-full bg-sky-mist text-primary flex items-center justify-center mx-auto border border-primary/20">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Lead Pipeline & Inquiries Table</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          View full message histories, export contact leads to CSV/XLSX, update pipeline stages, and log consultation notes.
        </p>
      </div>
    </div>
  );
}
