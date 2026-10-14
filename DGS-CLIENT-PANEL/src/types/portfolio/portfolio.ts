/**
 * Public read models for the Portfolio module (SRS 4).
 *
 * These are aliases, not a second declaration. They used to re-declare the
 * portfolio entity with *different* field names than the admin panel uses for the
 * same row (`challenge_title` vs `title`, `image_url` vs `supporting_image`,
 * `is_featured` vs `is_most_popular` on pricing tiers). The case-study page
 * therefore read fields the endpoint never returns, and every render of a
 * challenge or pricing tier was silently empty.
 *
 * The canonical contract lives in `@/types/portfolio`; this module only keeps the
 * historical names resolving.
 */

export type {
  PortfolioChallenge,
  PortfolioCategory,
  PortfolioItem,
  PortfolioPricingTier,
  PublicPortfolioList,
} from "@/types/portfolio";

export type { PortfolioItem as PublicPortfolioProject } from "@/types/portfolio";

export { ALL_PROJECTS, PORTFOLIO_CATEGORIES } from "@/types/portfolio";