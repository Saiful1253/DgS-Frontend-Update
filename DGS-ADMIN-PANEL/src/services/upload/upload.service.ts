import { uploadServicePillarIconAction } from "@/actions/upload.actions";

/**
 * Upload service — the domain layer for the module.
 *
 * House chain: `page / component → service → action → HTTP`. The service holds no
 * transport: the multipart body — including the `folder` field — is built by the
 * action, so a client component may import this module and its call arrives as
 * an RPC on the server, where the validation lives.
 */

export const uploadServicePillarIcon = (formData: FormData) =>
  uploadServicePillarIconAction(formData);

