import {
  uploadServiceCategoryIconAction,
  uploadServicePillarIconAction,
} from "@/actions/upload.actions";

/**
 * Upload service — the domain layer for the module.
 */

export const uploadServiceCategoryIcon = (formData: FormData) =>
  uploadServiceCategoryIconAction(formData);

export const uploadServicePillarIcon = uploadServiceCategoryIcon;
