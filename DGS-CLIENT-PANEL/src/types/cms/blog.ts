/**
 * Public blog contracts.
 *
 * These are aliases, not a second declaration. They used to be declared
 * independently of `@/types/blog`, which meant the blog listing and the blog
 * detail page could disagree about what a post is - and any change had to be
 * made twice. The canonical contract lives in `@/types/blog`; this module only
 * keeps the historical names resolving so existing imports do not break.
 */

export type {
  BlogAuthor,
  BlogCategory,
  BlogListResponse,
  BlogPost,
  BlogStatus,
  BlogTag,
} from "@/types/blog";

/** Historical name for the post entity. */
export type { BlogPost as Blog } from "@/types/blog";