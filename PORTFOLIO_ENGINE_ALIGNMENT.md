# Dynamic Portfolio Engine – Alignment Analysis & Missing Work

> Objective: Align `DGS-BACKEND`, `DGS-ADMIN-PANEL` and `DGS-CLIENT-PANEL` with the "Dynamic Portfolio (Portfolio Engine)" requirement without breaking existing case-study data.

## 1) Current State Summary

The existing portfolio is more of a **Case Study Engine** (`challenges`, `pricing_tiers`, `comparison_*`, `primary_challenge/solution`). The new requirement wants a **Project Showcase Portfolio** with stronger filtering, location, media type and landing page constraints.

| Layer | Status | Notes |
| --- | --- | --- |
| **Backend (NestJS + TypeORM)** | Partially Aligned | Core CRUD exists. Missing new fields, public pagination & location-aware filters. |
| **Admin Panel (Next.js)** | Partially Aligned | `is_featured` toggle exists. Missing new form fields, location dropdowns & filters in list. |
| **Client Panel (Next.js)** | Partially Aligned | Public listing/detail exists. Missing landing constraints, filters, 20/page + infinite/load-more and YouTube media rendering. |

## 2) Requirement vs Implementation Gap

### A) Admin Panel

| Requirement | Current | Gap | Priority |
| --- | --- | --- | --- |
| **Media Type (Image / YouTube Video)** | Not present | Add `media_type` (`image` \| `youtube`) + `media_url` (YouTube embed/watch URL). Conditional validation needed. | `P0` |
| **Project Title** | `project_name` exists | Map/label as `Project Title` in UI. Keep DB column for backward compat. | `OK` |
| **Rich Text Description** | Uses `primary_challenge`, `primary_solution`, `challenges[]` | Add `description` (rich text) to match requirement. Don't remove existing case-study fields. | `P0` |
| **Project Status (Completed / Ongoing)** | Not present | Add `project_status` enum (`completed` \| `ongoing`). | `P0` |
| **Project Type (Residential / Industrial / Commercial / Restaurant)** | Not present (`category` is used differently) | Add `project_type` enum (`residential` \| `industrial` \| `commercial_restaurant`). Keep `category` untouched. | `P0` |
| **Project Area / Location (Address + Lat/Lng)** | Not present | Add `address` (full address), `latitude` (decimal), `longitude` (decimal). Create a route to fetch locations (for map/autocomplete or listing). Also support searchable selection if using master data. | `P0` |
| **Featured Toggle** | Present (`is_featured`) | Already there. Ensure action + UI consistent. | `OK` |

### B) Landing Page (Client Panel)

| Requirement | Current | Gap | Priority |
| --- | --- | --- | --- |
| **Only Featured Projects** | Unclear / mixed | Filter by `is_featured = true` on landing fetch. | `P0` |
| **Grid Layout (4 × 2)** | Varies | Use responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` to achieve 4x2 feel. | `P1` |
| **Max 8 Project Cards** | No enforced limit | Call API with `featured=true&limit=8`. | `P0` |
| **View More Projects Button** | Missing/unclear | Link to `/portfolio`. | `P1` |

### C) Portfolio Listing Page (Client Panel)

| Requirement | Current | Gap | Priority |
| --- | --- | --- | --- |
| **Filter by Status** | None | `status=completed\|ongoing` | `P0` |
| **Filter by Project Type** | None | `project_type=residential\|industrial\|commercial_restaurant` | `P0` |
| **Filter by Location** | None | Filter by address/area or via coordinates. Add route to fetch locations (e.g. `GET /portfolio/locations`) for dropdown/map. Can filter by proximity later if needed. | `P0` |
| **Location Selection** | None | Input for `address` with map picker or manual entry. Store `latitude`/`longitude`. Fetch saved locations via dedicated route. | `P0` |
| **Card per row by screen size** | Basic grid likely | Responsive grid matching design (mobile 1, tablet 2, lg up to 4). | `P1` |
| **20 per load** | Public list likely returns all or unpaginated | Enforce `limit=20`. Add `page` support in public endpoint. | `P0` |
| **Infinite Scroll / Load More** | Missing likely | Implement IntersectionObserver (infinite) or "Load More" button. Append results to state. | `P0` |

## 3) Target Schema (DB / Entity)

Update `portfolios` table in `DGS-BACKEND`.

```ts
// DGS-BACKEND/src/portfolio/entities/portfolio.entity.ts

@Column({ type: 'enum', enum: ['image', 'youtube'], default: 'image' })
media_type: 'image' | 'youtube';

@Column({ type: 'varchar', length: 500, nullable: true })
media_url: string;

@Column({ type: 'enum', enum: ['completed', 'ongoing'], default: 'completed' })
project_status: 'completed' | 'ongoing';

@Column({ type: 'enum', enum: ['residential', 'industrial', 'commercial_restaurant'], default: 'residential' })
project_type: 'residential' | 'industrial' | 'commercial_restaurant';

@Column({ type: 'text', nullable: true })
address: string;

@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
latitude: number;

@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
longitude: number;

@Column({ type: 'text', nullable: true })
description: string;
```

**Notes:**
- Keep all existing columns (`category`, `challenges`, `pricing_tiers`, `comparison_*`) intact.
- For `Commercial / Restaurant` use `commercial_restaurant` as enum value and map label in UI.
- If scaling needed later, introduce `districts(id, name, slug)` and `areas(id, district_id, name, slug)` with relations. For "add if not exist" it's cleaner with master tables.

## 4) File-Level Work Plan

### 4.1 DGS-BACKEND

| File | Action | Details |
| --- | --- | --- |
| `src/portfolio/entities/portfolio.entity.ts` | **Update** | Add enums + columns above. |
| `src/database/migrations/*` | **Add Migration** | Generate migration for new columns/enums. Check existing enum types in Postgres. |
| `src/portfolio/dto/create-portfolio.dto.ts` | **Update** | Add validation: `@IsEnum`, `@IsOptional`, `@IsUrl`/custom for YouTube, etc. |
| `src/portfolio/dto/update-portfolio.dto.ts` | **Update** | Make all new fields optional, preserve partial update. |
| `src/portfolio/portfolio.service.ts` | **Update** | `findAll()` accept `status`, `projectType`, `district`, `area`. `findAllPublic()` add pagination (`page`, `limit` default 20), add same filters, keep backward compatible if no params passed. |
| `src/portfolio/portfolio.controller.ts` | **Update** | Accept new query params for admin/public. Return pagination envelope for public as well (`data/projects + meta/page/limit/total/totalPages`). |
| `src/portfolio/portfolio.module.ts` | **Check** | Ensure entities/repos wired. |
| *(Optional)* `src/locations/*` | **Create** | `districts/areas` module + controller/service/entity if going with master-data approach. Add `GET/POST` for search + create. |

### 4.2 DGS-ADMIN-PANEL

| File | Action | Details |
| --- | --- | --- |
| `src/zod/portfolio.validation.ts` | **Update** | Extend `portfolioSchema` with enums + optional strings. Add conditional rule: if `media_type === 'youtube'` require valid `media_url`. |
| `src/types/portfolio.ts` | **Update** | Sync `PortfolioItem` with new fields + correct enum union types. |
| `src/actions/portfolio.actions.ts` | **Update** | Pass new filters from UI. Ensure `savePortfolioAction` sends new fields. Keep `togglePortfolioFeaturedAction` as-is. |
| `src/components/portfolio/portfolio-manager.tsx` | **Update** | Add form sections: Media, Status, Project Type, Location (District/Area), Description (Rich Text). Add searchable comboboxes + "Add new..." modal/input. Update filters UI (add Status/Type/Location). Keep existing case-study blocks. |
| `src/components/portfolio/*` (modals/forms) | **Update** | If split into smaller components, update those too. |

### 4.3 DGS-CLIENT-PANEL

| File | Action | Details |
| --- | --- | --- |
| `src/types/portfolio.ts` | **Update** | Mirror backend types for new fields. |
| `src/actions/portfolio.actions.ts` | **Update** | Build query with `status`, `project_type`, `district`, `area`, `page`, `limit`, `featured`. |
| `src/services/portfolio/portfolio.service.ts` | **Update** | Support pagination + filters. Handle both shapes if backend changes gradually. |
| `src/app/portfolio/page.tsx` | **Update** | Wire filters + pagination/infinite/load-more. Default `limit=20`. |
| `src/components/portfolio/PortfolioClientView.tsx` | **Update** | Filter state, URL sync (`useSearchParams`), fetch on filter change, infinite scroll via `IntersectionObserver` or "Load More". Show empty state. |
| `src/app/portfolio/[slug]/page.tsx` | **Update** | Render based on `media_type`. For `youtube` show responsive embed/thumbnail+player. Show new fields (Status/Type/Location/Description). |
| `src/app/page.tsx` / landing components | **Update** | Fetch featured only: `featured=true&limit=8`. 4x2 grid. "View More Projects" -> `/portfolio`. |
| `src/app/sitemap.ts` | **Check** | Usually fine, just ensure slugs still pulled correctly. |

## 5) API Contract Proposal

Keep existing contracts working. Additive only.

### Admin
```http
GET /portfolio?category=...&search=...&featured=true&status=completed&projectType=residential&district=Dhaka&area=Banani&page=1&limit=10
POST /portfolio
PUT /portfolio/:id
PUT /portfolio/:id/featured
```

### Public
```http
GET /client/portfolio?featured=true&limit=8
GET /client/portfolio?status=completed&projectType=residential&district=Dhaka&area=Banani&page=1&limit=20
GET /client/portfolio/public/:slug
```

**Expected shape (public listing):**
```json
{
  "success": true,
  "data": { "projects": [...], "categories": [...] } // or "data": [...]
  // better: { "projects": [...], "meta": { "page":1,"limit":20,"total":..., "totalPages":... }, "filters": {...} }
}
```

> Suggest normalizing to a single paginated envelope for public too to avoid client-side branching.

### Locations (if implemented)
```http
GET /locations/districts?q=...
POST /locations/districts  { "name": "..." }
GET /locations/areas?district=Dhaka&q=...
POST /locations/areas { "district": "Dhaka", "name": "..." }
```

## 6) Implementation Order (Safe & Aligned)

Do in this exact order to avoid cross-project breakage.

| Step | Task | Notes |
| --- | --- | --- |
| **1.** | **DB + Entity (Backend)** | Add columns/enums + migration. Test migration locally. |
| **2.** | **DTO + Validation (Backend)** | Update create/update DTO. Keep backward compatible. |
| **3.** | **Service + Controller (Backend)** | Add filters + public pagination. Don't remove old params. |
| **4.** | **Types + Zod (Admin)** | Sync `types/portfolio.ts` and `portfolio.validation.ts`. |
| **5.** | **Admin Form + List (Admin)** | Add new fields, searchable district/area, filters. Test create/update. |
| **6.** | **Public API wiring (Client)** | Update actions/services to send new params. |
| **7.** | **Portfolio Listing Page (Client)** | Filters + 20/load-more or infinite scroll. |
| **8.** | **Landing Page (Client)** | Featured-only 8, grid 4x2, "View More". |
| **9.** | **Detail Page (Client)** | Media render (YouTube/Image), show new meta. |
| **10.** | **QA Alignment** | Check empty states, dependent area dropdown, "add if not exist", pagination, featured toggle. |

## 7) Quick Checklist

### Backend
- [ ] Migration added for new fields
- [ ] Entity updated
- [ ] DTO validation updated
- [ ] `findAll` filters extended
- [ ] `findAllPublic` paginated + filtered
- [ ] Controller query parsing updated

### Admin Panel
- [ ] Zod schema updated with enums + conditional YouTube validation
- [ ] Form has Media/Status/Type/Location/Description
- [ ] Searchable District/Area with "Add option if not exist"
- [ ] List filters for Status/Project Type/Location
- [ ] Types synced

### Client Panel
- [ ] Landing uses `featured=true&limit=8`
- [ ] Portfolio page has all filters
- [ ] 20 per load + infinite scroll/load more
- [ ] YouTube + Image media handling
- [ ] Responsive grid as per spec
- [ ] "View More Projects" points to `/portfolio`

## 8) Files To Cross-Check First

Before editing, quickly verify these to avoid guessing:

```text
DGS-BACKEND/src/portfolio/portfolio.controller.ts
DGS-BACKEND/src/portfolio/dto/create-portfolio.dto.ts
DGS-BACKEND/src/portfolio/dto/update-portfolio.dto.ts

DGS-ADMIN-PANEL/src/types/portfolio.ts
DGS-ADMIN-PANEL/src/zod/portfolio.validation.ts
DGS-ADMIN-PANEL/src/components/portfolio/portfolio-manager.tsx

DGS-CLIENT-PANEL/src/types/portfolio.ts
DGS-CLIENT-PANEL/src/actions/portfolio.actions.ts
DGS-CLIENT-PANEL/src/services/portfolio/portfolio.service.ts
DGS-CLIENT-PANEL/src/components/portfolio/PortfolioClientView.tsx
DGS-CLIENT-PANEL/src/app/portfolio/page.tsx
DGS-CLIENT-PANEL/src/app/portfolio/[slug]/page.tsx
```

**Recommendation:** Treat this as an **additive migration**. Don't rename existing fields. Add new ones, keep fallbacks, and align types across all three projects in one pass.