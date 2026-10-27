import { cache } from "react";
import {
  getPublicServiceGroupsAction,
  getPublicServicesAction,
} from "@/actions/service.actions";
import type { ActionResult } from "@/actions/action-result";
import type { PublicServicesPayload, Service, ServiceGroup } from "@/types/service";

/**
 * Services service - the domain layer for the module.
 *
 * House chain: `page / component -> service -> action -> HTTP`. The service holds
 * no transport: every request is a `"use server"` action, so a client component
 * may import this module and its calls arrive as an RPC on the server.
 *
 * The `get*Result` readers are for server pages. A read that fails must not
 * render as an empty catalogue, so the failure is reported as data and the page
 * decides what to show; the `get*` wrappers are the throwing convenience form.
 */

export type {
  Service,
  ServiceGroup,
  ServicePillarEntity,
  PublicServicesPayload,
} from "@/types/service";

export type ReadResult<T> = { ok: true; data: T } | { ok: false; message: string };

// ── Reads for the page layer ─────────────────────────────────────────────────

export const getPublicServicesResult = cache(async (): Promise<ReadResult<PublicServicesPayload>> => {
  const res = await getPublicServicesAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to load services" };
  return { ok: true, data: (res.data ?? { services: [], pillars: [], groups: [] }) as PublicServicesPayload };
});

export const getPublicServiceGroupsResult = cache(async (): Promise<ReadResult<ServiceGroup[]>> => {
  const res = await getPublicServiceGroupsAction();
  if (!res.success) return { ok: false, message: res.message || "Failed to load service groups" };
  return { ok: true, data: Array.isArray(res.data) ? (res.data as ServiceGroup[]) : [] };
});

// ── Reads for the page layer, degrading instead of throwing ──────────────────

/**
 * Never throws: this runs during static rendering of `/services`, and a failed
 * fetch should degrade to an empty page rather than a 500. The action layer
 * reports the failure in its result; the page renders what it can.
 */
export const getPublicServices = cache(async (): Promise<PublicServicesPayload> => {
  const result = await getPublicServicesResult();
  return result.ok ? result.data : { services: [], pillars: [], groups: [] };
});

export const getPublicServiceGroups = cache(async (): Promise<ServiceGroup[]> => {
  const result = await getPublicServiceGroupsResult();
  return result.ok ? result.data : [];
});

/** Services belonging to one group, in `display_order`. */
export const getServicesByGroup = cache(
  async (groupId: number): Promise<Service[]> => {
    const payload = await getPublicServices();
    return payload.services
      .filter((service) => service.group_id === groupId)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }
);

export const getPublicServiceBySlug = cache(
  async (slug: string): Promise<Service | null> => {
    const payload = await getPublicServices();
    return payload.services.find((s) => s.slug === slug) ?? null;
  }
);

// ── Reads for client components ──────────────────────────────────────────────

export const listPublicServices = (): Promise<ActionResult> => getPublicServicesAction();

export const listPublicServiceGroups = (): Promise<ActionResult> => getPublicServiceGroupsAction();