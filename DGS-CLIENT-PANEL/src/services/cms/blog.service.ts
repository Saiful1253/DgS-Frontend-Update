/**
 * Compatibility shim.
 *
 * The blog module now lives in `@/services/blog/blog.service`, following the
 * admin panel's `page / component -> service -> action` layout. This file is
 * re-exported rather than deleted so the existing importers under
 * `app/` and `components/` keep resolving; new code should import the canonical
 * path directly.
 */
export {
  getBlog,
  getBlogCategories,
  getBlogs,
  getRelatedBlogs,
} from "@/services/blog/blog.service";