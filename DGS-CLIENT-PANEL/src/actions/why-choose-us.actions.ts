"use server";

import { fail, failWithStatus, ok, type ActionResult } from "./action-result";
import { publicFetch } from "@/lib/server-fetch";
import { extractApiErrorMessage, parseApiResponse } from "@/lib/api-error";
import type { WhyChooseUs } from "@/types/why-choose-us";

export async function getPublicWhyChooseUsAction(): Promise<ActionResult> {
  try {
    const res = await publicFetch.get("/services/why-choose-us/public", {
      cache: "no-store",
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load Why Choose Us items"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load Why Choose Us items", json?.statusCode);
    }

    const data = json?.data ?? json;
    return ok("Why Choose Us loaded", Array.isArray(data) ? (data as WhyChooseUs[]) : []);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to load Why Choose Us items");
  }
}

export async function getPublicWhyChooseUsMetricsAction(): Promise<ActionResult> {
  try {
    const res = await publicFetch.get("/services/why-choose-us/metrics", {
      cache: "no-store",
    });
    if (!res.ok) {
      return failWithStatus(
        await extractApiErrorMessage(res, "Failed to load Why Choose Us metrics"),
        res.status
      );
    }

    const json = await parseApiResponse(res);
    if (json?.success === false) {
      return failWithStatus(json?.message || "Failed to load Why Choose Us metrics", json?.statusCode);
    }

    const data = json?.data ?? json;
    return ok("Why Choose Us metrics loaded", data);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to load Why Choose Us metrics");
  }
}

