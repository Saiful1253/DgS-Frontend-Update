/**
 * Compatibility shim.
 *
 * The blog actions now live in `@/actions/blog.actions`, following the admin
 * panel's layout. This file is re-exported rather than deleted so the existing
 * importer at `@/services/blog/blog.service` keeps resolving.
 */
export { getBlog, getBlogs, getRelatedBlogs } from "@/services/blog/blog.service";