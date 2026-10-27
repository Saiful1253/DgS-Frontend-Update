/**
 * Compatibility shim.
 *
 * The services and technologies modules now live in
 * `@/services/service/service.service` and `@/services/technology/technology.service`,
 * following the admin panel's layout. This file is re-exported rather than
 * deleted so the existing importers under `app/` and `components/` keep
 * resolving.
 *
 * `getTechnologies` now derives its rows from the same public
 * technology catalogue the services page filters, so the chips and the rows
 * cannot disagree.
 */
export { getPublicServices } from "@/services/service/service.service";

export type {
  PublicService,
  PublicServicePillar,
  PublicServiceGroup,
  PublicServicesPayload,
} from "@/types/service/service";