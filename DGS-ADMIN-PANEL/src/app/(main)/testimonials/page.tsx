import React from "react";
import { MessageSquare, Plus, ShieldCheck, Star,  Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0;

export const metadata = {
  title: "Client Testimonials & Reviews | MilanoVA",
  description: "Manage client reviews, enterprise testimonials, ratings, and client company logos.",
};

export default async function TestimonialsPage() {

  const hasManageAccess = true;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-mist text-primary border border-primary/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Testimonials & Client Feedback</h1>
            <Badge variant="outline" className="text-xs bg-sky-mist/50 text-primary border-primary/20 font-medium">
              Social Proof
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Manage client quotes, executive testimonials, enterprise reviews, and author credentials displayed across landing pages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasManageAccess ? (
            <Button size="sm" className="gap-1.5 h-9 bg-primary text-white hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              <span>Add Testimonial</span>
            </Button>
          ) : (
            <Badge variant="secondary" className="text-xs gap-1 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              Read-Only Access
            </Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Rating</span>
          <div className="text-2xl font-bold text-slate-900 flex items-center gap-1">
            <span>4.9</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-[11px] text-slate-400">From enterprise clients</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Published</span>
          <div className="text-2xl font-bold text-primary">18</div>
          <p className="text-[11px] text-slate-400">Active on client storefront</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enterprise Logos</span>
          <div className="text-2xl font-bold text-emerald-600">14</div>
          <p className="text-[11px] text-slate-400">Verified partner brands</p>
        </div>
      </div>

      {/* Directory Placeholder */}
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-full bg-sky-mist text-primary flex items-center justify-center mx-auto border border-primary/20">
          <Quote className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Client Reviews & Quotes Manager</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Add and curate testimonials with author designations, company names, headshots, and star ratings.
        </p>
      </div>
    </div>
  );
}
