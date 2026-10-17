/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import { parseApiResponse, extractApiErrorMessage } from "@/lib/api-error";
import { ok, fail, failWithStatus, type ActionResult } from "./action-result";

export type LeadItem = {
  id: number;
  type: string;
  source_channel?: string;
  full_name: string;
  email?: string;
  mobile_number?: string;
  service_requirements?: string[];
  message?: string;
  status: string;
  created_at: string;
};

export async function getLeadsAction(params?: {
  type?: string;
  status?: string;
  search?: string;
}): Promise<ActionResult> {
  try {
    const q = new URLSearchParams();
    if (params?.type) q.set("type", params.type);
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);

    const qs = q.toString() ? `?${q.toString()}` : "";
    const res = await serverFetch.get(`/leads${qs}`);
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to fetch leads"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    const list: LeadItem[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : [];

    return ok("Leads loaded", list);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch leads");
  }
}

export async function updateLeadStatusAction(
  id: number,
  status: string
): Promise<ActionResult> {
  try {
    const res = await serverFetch.patch(`/leads/${id}/status`, {
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to update lead status"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    revalidatePath("/leads");
    return ok("Status updated", json?.data ?? json);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update lead status");
  }
}
