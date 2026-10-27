# Implementation Plan: Government & Regulatory Certifications Section

Based on the provided design mockup, here is the architectural specification and implementation plan to deliver the **Government & Regulatory Certifications** module across backend, admin panel, and client storefront.

---

## 1. Visual Design Breakdown

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LEGAL ACCREDITATIONS                                                                   │
│ Government & Regulatory Certifications                 [ ✓ Bangladesh Govt. Approved ] │
│ Digital Gas Service operates with complete legal compliance and adheres strictly...    │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ [REG #TGS-1C-4402]   (🏅)│ [DEP-EXP-BULK-91]    (🎖️)│ [FSCD-HYD-778]               (🔥)│
│ Titas Gas 1st Class      │ Dept of Explosives       │ Fire Service & Civil Defence NOC │
│ License                  │ Approval                 │                                  │
│ Officially recognized... │ Full regulatory accr...  │ Approved design & execution...   │
│ ──────────────────────── │ ──────────────────────── │ ──────────────────────────────── │
│ Verified & Active ⤓ View │ Dept of Explosives ⤓ View│ Fire Safety Standard     ⤓ View  │
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
│ [ISO 9001:2015]      (🛡️)│ [BERC-GAS-880]       (⚖️)│ (📄) [DARK NAVY CTA CARD]        │
│ ISO 9001:2015 Quality    │ BERC Registered          │ Need Regulatory Approvals?       │
│ Management               │ Contractor               │ Our specialized legal and...     │
│ International quality... │ Enlisted gas infra...    │                                  │
│ ──────────────────────── │ ──────────────────────── │ [ 💬 Get Approval Support ]      │
│ Global Accr.      ⤓ View │ BERC Code          ⤓ View│                                  │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

### Key UI Features:
1. **Section Header**:
   - Eyebrow: `LEGAL ACCREDITATIONS` in coral/orange (`#ff5722` / `#f97316`)
   - Headline: `Government & Regulatory Certifications` in bold dark navy (`#0f2438`)
   - Subtitle: Compliance statement in slate muted tone
   - Top-Right Badge: Pill with green checkmark `✓ Bangladesh Govt. Approved`
2. **5 Certification Cards** (Clean White Card Style):
   - Badge Pill (top-left): Peach bg (`#fff2eb`), orange text (`#f97316`), tracking-wide font
   - Category Icon (top-right): Lucide icon in orange outline (`Award`, `Medal`, `Flame`, `ShieldCheck`, `Scale`)
   - Title: Bold dark title
   - Body: Clean truncated/clamped description
   - Footer: Left sub-label / authority code + Right interactive `⤓ View Certificate` button triggering lightbox/PDF viewer
3. **6th Card (Regulatory Support CTA)**:
   - Deep slate-navy background (`#16283d` / `#1b324f`)
   - Orange document icon (`#ff5722`)
   - White bold headline `Need Regulatory Approvals?`
   - Light gray explanatory copy
   - Orange solid CTA button `Get Approval Support` (routes to `/contact?topic=regulatory-approvals`)

---

## 2. Architecture & Data Model

### Database Schema Updates (`certificates` table)
| Column | Type | Description |
|---|---|---|
| `reg_no` | `VARCHAR(100)` (nullable) | e.g. `REG #TGS-1C-4402`, `DEP-EXP-BULK-91` |
| `category_icon` | `VARCHAR(50)` (nullable) | `award` \| `medal` \| `flame` \| `shield` \| `scale` \| `file` |
| `sub_label` | `VARCHAR(100)` (nullable) | e.g. `Verified & Active License`, `Fire Safety Standard` |
| *existing columns* | | `id`, `title_en`, `title_bn`, `description_en`, `description_bn`, `file_type`, `file_url`, `thumb_url`, `issuing_authority`, `year`, `verification_link`, `is_featured`, `display_order`, `is_active` |

---

## 3. Step-by-Step Implementation Tasks

### Phase 1: Backend (`DGS-BACKEND`)
1. **Migration**: Create TypeORM migration `AddCertificateDesignColumns` for `reg_no`, `category_icon`, `sub_label`.
2. **Entity & DTOs**:
   - Update [`Certificate`](file:///d:/WORK/ARCHIOTECH/DGS/DGS-BACKEND/src/settings/entities/certificate.entity.ts)
   - Update `CreateCertificateDto` and `UpdateCertificateDto`
3. **Seeder**:
   - Seed the 5 realistic government certifications from the design so the site immediately displays production-ready data.

### Phase 2: Admin Panel (`DGS-ADMIN-PANEL`)
1. **Types & Validation**:
   - Update [`certificate.ts`](file:///d:/WORK/ARCHIOTECH/DGS/DGS-ADMIN-PANEL/src/types/certificate.ts) and Zod schema.
2. **Form Modal**:
   - Add fields for `Registration / License No`, `Icon Picker`, and `Sub-label / Authority Note`.
3. **Manager Table**:
   - Show `reg_no` pill and icon preview in certificate list.

### Phase 3: Client Storefront (`DGS-CLIENT-PANEL`)
1. **New Component**: Create `GovernmentCertifications.tsx` in `src/components/sections/certifications/`:
   - Exact typography, colors, borders, and shadows matching the screenshot mockup.
   - Dynamic icon mapper for `category_icon`.
   - Responsive 3-column layout (collapses gracefully on mobile & tablet).
   - Lightbox modal for image/PDF preview on clicking `⤓ View Certificate`.
2. **Homepage Integration**:
   - Import and render `GovernmentCertifications` on [`(home)/page.tsx`](file:///d:/WORK/ARCHIOTECH/DGS/DGS-CLIENT-PANEL/src/app/(home)/page.tsx).

---

## 4. Verification & Testing Checklist
- [ ] Backend migration runs cleanly and API returns `reg_no`, `category_icon`, `sub_label`.
- [ ] Admin panel allows creating and updating certificates with new fields.
- [ ] Client section matches screenshot aesthetics 1:1.
- [ ] Clicking `View Certificate` opens document lightbox / viewer.
- [ ] CTA card button navigates to contact / support.
