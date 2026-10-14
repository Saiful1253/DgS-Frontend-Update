/**
 * Public read models for the Services and Technologies modules.
 *
 * These are aliases, not a second declaration. They used to be declared
 * independently of `@/types/service` and `@/types/technology`, which meant the
 * services page and the services module could drift apart on a field the page
 * renders. The canonical contracts live in those modules; this file only keeps
 * the historical `Public*` names resolving.
 *
 * They remain interfaces rather than Zod schemas on purpose: they describe the
 * *backend's* response, which is validated by the backend's DTOs. Re-declaring
 * them here as Zod would create a second source of truth that could drift from
 * the API without failing any build.
 */

export type {
  Service,
  ServiceGroup,
  ServicePillarEntity,
} from "@/types/service";

export type {
  Service as PublicService,
  ServiceGroup as PublicServiceGroup,
  ServicePillarEntity as PublicServicePillar,
} from "@/types/service";

export type { Technology, TechnologyCategoryItem } from "@/types/technology";

export type { Technology as PublicTechnology } from "@/types/technology";

export type { PublicServicesPayload } from "@/types/service";