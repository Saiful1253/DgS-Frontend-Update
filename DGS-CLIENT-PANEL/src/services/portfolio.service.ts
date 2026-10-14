/**
 * Compatibility shim.
 *
 * The portfolio module now lives in `@/services/portfolio/portfolio.service`,
 * following the admin panel's layout. This file is re-exported rather than
 * deleted so the existing importers under `app/` keep resolving.
 */
export {
  getPublicPortfolio as getPublicPortfolio,
  getPublicPortfolioBySlug as getPublicPortfolioBySlug,
} from "@/services/portfolio/portfolio.service";

export { ALL_PROJECTS, PORTFOLIO_CATEGORIES } from "@/types/portfolio";