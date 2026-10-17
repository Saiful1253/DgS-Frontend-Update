import React from "react";
import { Mail, Phone, Inbox, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLeadsAction, type LeadItem } from "@/actions/lead.actions";

export const revalidate = 0;

export const metadata = {
  title: "Leads & Consultation Pipeline | DGS Admin",
  description: "Manage client inquiries, consultation requests, and qualification pipeline.",
};

export default async function LeadsPage() {
  const result = await getLeadsAction();
  const leads: LeadItem[] = result.success && Array.isArray(result.data) ? result.data : [];

  const newCount = leads.filter((l) => l.status === "New" || !l.status).length;
  const contactedCount = leads.filter((l) => l.status === "Contacted" || l.status === "In Progress").length;
  const consultationCount = leads.filter((l) => l.type === "Consultation").length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-mist text-primary border border-primary/20">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Consultation Leads & Inquiries</h1>
            <Badge variant="outline" className="text-xs bg-sky-mist/50 text-primary border-primary/20 font-medium">
              Live Pipeline
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time inquiries and consultation bookings submitted from the DGS Client Portal.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Submissions</span>
          <div className="text-2xl font-bold text-slate-900">{leads.length}</div>
          <p className="text-[11px] text-slate-400">All recorded inbound requests</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Inquiries</span>
          <div className="text-2xl font-bold text-amber-600">{newCount}</div>
          <p className="text-[11px] text-slate-400">Awaiting engineer contact</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consultation Requests</span>
          <div className="text-2xl font-bold text-primary">{consultationCount}</div>
          <p className="text-[11px] text-slate-400">Hero consultation form leads</p>
        </div>
      </div>

      {/* Leads Directory / Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Inbound Leads ({leads.length})</h2>
        </div>

        {leads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-sky-mist text-primary flex items-center justify-center mx-auto border border-primary/20">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No leads recorded yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Inquiries and consultation requests submitted from the client panel will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Phone / Contact</th>
                  <th className="py-3 px-4">Service Scope</th>
                  <th className="py-3 px-4">Details / Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {lead.full_name}
                      {lead.type && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {lead.type} ({lead.source_channel || "website"})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {lead.mobile_number ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                          <span>{lead.mobile_number}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">No phone</span>
                      )}
                      {lead.email && (
                        <span className="block text-[11px] text-slate-400">{lead.email}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {lead.service_requirements && lead.service_requirements.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {lead.service_requirements.map((req, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-slate-50">
                              <Tag className="w-2.5 h-2.5 mr-1" />
                              {req}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                      {lead.message || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className={
                          lead.status === "New" || !lead.status
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : lead.status === "Contacted"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }
                      >
                        {lead.status || "New"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
