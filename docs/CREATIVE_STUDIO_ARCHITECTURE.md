# Creative studio architecture — templates, CRUD, orgs, assets, performance

This document is the **contract** for how creative content is **grouped**, **named**, **owned**, and **evolved**. It complements [CREATIVE_WORKSPACE.md](./CREATIVE_WORKSPACE.md) (hub, API, routes) and [../src/lib/creative/README.md](../src/lib/creative/README.md) (import paths).

---

## 1. Group by surface, not by legacy app

Everything ships in **one Next app** (`rhub/`). Folders and registries use **what the user sees** (certificate, flyer, document, brochure), not vendor names.

| Surface | Purpose | Code “home” today | Sub-modularity (keep shallow) |
| ------- | ------- | ----------------- | ----------------------------- |
| **Certificates** | Issuance, verify, PDF/HTML/React-PDF | `src/lib/creative/certificates/` | `html-export/templates/{family}/` (e.g. jicf, juls, fom, ekd, general), `react-pdf-templates/`, `template-builder/` for canvas builder |
| **Flyers** | Layered brand flyers, export PNG/JPG/PDF | `src/components/creative/flyers/` | Presets: one file per preset **or** future `flyers/presets/`; shared: `hooks/`, panels, `flyer-templates.ts` registry |
| **Documents** | Letterhead AST, DOCX/PDF | `src/lib/creative/documents/`, `src/components/creative/documents/` | `documents/docx/`, `document/` UI; types via `document-model.ts` |
| **Brochure** | Tri-fold / print brochure | Placeholder [`/tools/kit/bro`](../src/app/(hub)/tools/kit/bro/page.tsx) | Future: `components/creative/brochure/` + `lib/creative/brochure/` when built |
| **Booklet / letter (conf)** | Conference ops | `src/app/(hub)/tools/conf/*` | Existing routes; brand via conf letterhead + `OrganizationBrandKit` |
| **Brand / colors** | Tokens, typography, asset refs | `src/lib/creative/brand-kit.ts`, API merge [`/api/v1/kit/brand-kit/merge`](../src/app/api/v1/kit/brand-kit/merge/route.ts) | Not a “template folder”; persisted per org when Prisma model lands |
| **Conversions** | doc/img tools | `src/app/(hub)/tools/doc`, `tools/img` | Tool-specific; not mixed into certificate trees |

**Rule:** If it is a **certificate template definition**, it lives under **`lib/creative/certificates/…`** (with subdirs by **family** or **layout type**, not by old product name). If it is a **flyer preset**, it stays under **`components/creative/flyers/`** until we introduce `flyers/presets/` — then move presets only, not chrome.

---

## 2. Naming conventions

- **Registry IDs** (`kitTemplates[].id`): `kebab-case`, stable forever for API clients (`ekd-flyer-builder`, `credia-degree-pdf` → prefer `kit-*` or domain-prefix: `certificate-react-pdf-degree`).
- **Folders:** `kebab-case` for directories; **PascalCase** only for React components.
- **Template modules:** export a **single default** or named `templateDefinition` object with `id`, `title`, `category` aligned with `KitTemplateCategory` in [`templates-registry.ts`](../src/lib/kit/templates-registry.ts).
- **Org slugs:** lowercase; map to brand kit `orgId` / `slug` consistently.
- **Forked copies:** name with suffix `-copy-{orgSlug}` or store `forkedFromTemplateId` in DB (see §4).

---

## 3. Full CRUD (target state)

Today, many definitions are **code-backed** (TypeScript modules + registry). **Target:** **database-backed** templates with **code fallbacks** for system defaults.

| Operation | Certificates | Flyers | Documents | Brand kit |
| --------- | ------------ | ------ | --------- | ------- |
| **Create** | API + UI; version 1 | API + UI; layers JSON | Save `DocumentModel` | Admin sets tokens |
| **Read** | List by org + visibility | List by org | Load by id / share | GET by org |
| **Update** | Optimistic + version bump | Patch layers / preset ref | Autosave + history | PATCH kit |
| **Delete** | Soft-delete + revoke policy | Archive | Trash / retention | Restrict to admin |
| **List / search** | Paginate; filter org | Same | Same | N/A |

**Principles**

- **Nothing is only static:** system defaults can be **seeded** from repo, then **cloned** into an org row for editing.
- **Versions:** immutable `template_version` rows for audit and “revert”.
- **Validation:** Zod (or similar) per surface; shared `OrganizationBrandKit` merge before render.

Exact Prisma models belong in the unified schema effort ([PRISMA_MERGE_STRATEGY.md](../../docs/PRISMA_MERGE_STRATEGY.md)); this doc defines **behavior**, not column names.

---

## 4. Multi-org, duplicate, and reuse

- **Baseline:** Any template may be **global** (system), **org-owned**, or **shared** (link).
- **Duplicate (“fork”)** — user with permission chooses “**Copy to my organization**”:
  - New row: `organizationId = targetOrg`, `forkedFromId = sourceId`, new `name` / `slug`.
  - **Detach** from source updates after fork (optional “subscribe to updates” later).
- **Reuse without copy:** **reference** a system template + **overlay** brand kit at render time (fastest, single source of truth).
- **Not limited to one org:** registry entries describe **capability**; **instances** are per-org in DB.

Super admin / admin may **restrict** which orgs see which system templates (feature flags or ACL table).

---

## 5. Users, roles, and connectivity

- **Default:** Authenticated users can **see** org-scoped content for orgs they belong to (membership / conference access patterns already in rhub).
- **Elevation:** **Admin** / **super admin** manage global templates, org assignments, and hard limits.
- **Document history** and future **template activity** should use the **same** session/auth story as the rest of rhub (avoid parallel user silos).
- **API:** `/api/v1/kit/*` grows with auth (`session`, API key, or OAuth) — same identity where possible.

---

## 6. Assets — EKD Digital only (no Cloudinary)

- **All uploads, optimization URLs, and library browsing** go through the **EKD Digital asset API** (server routes proxying to EKD as needed).
- **Client helpers:** evolve [`src/lib/creative/shims/lib/ekd-assets-client.ts`](../src/lib/creative/shims/lib/ekd-assets-client.ts), [`ekd-assets-api.ts`](../src/lib/creative/shims/lib/ekd-assets-api.ts), [`image-upload-client.ts`](../src/lib/creative/shims/lib/image-upload-client.ts) — **do not** introduce Cloudinary SDKs or URLs in new code.
- **Images in UI:** `EKDAssetImage` and `getOptimizedImageUrl` should call **EKD** transformation parameters only.

---

## 7. Speed and UX

- **Code splitting:** Lazy-load heavy studios (`next/dynamic`), TipTap, certificate builder, and map demos.
- **Data:** Paginate template lists; avoid loading full histories on first paint.
- **Caching:** HTTP cache headers on read-heavy kit endpoints where safe; revalidate on template publish.
- **Mobile:** Studio layouts must use **responsive** breakpoints; touch-friendly controls on flyer/document toolbars; test `/tools/kit/*` and conf surfaces on narrow viewports.
- **Perceived performance:** Optimistic UI on save; background PDF jobs if generation exceeds ~2s.

---

## 8. Registry and code layout (DRY)

- **Catalog:** [`src/lib/kit/templates-registry.ts`](../src/lib/kit/templates-registry.ts) — one list for hub + `GET /api/v1/kit/templates`.
- **Implementation tags** are **feature-based** (`creative-certificates`, `creative-flyers`, …), not legacy vendor labels.

### 7b. REST — DB-backed studio templates & EKD asset proxy

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| `GET` | `/api/v1/kit/studio-templates` | Optional | List: published **system** templates for anonymous callers; authenticated users also see their `user:{id}` rows. Admins may filter by `tenantKey` and `category`. |
| `POST` | `/api/v1/kit/studio-templates` | Required | Create template (`definition` JSON + `tenantKey`; defaults to `user:{id}` for non-admins). |
| `GET` | `/api/v1/kit/studio-templates/{id}` | Optional | Read one row if policy allows. |
| `PATCH` | `/api/v1/kit/studio-templates/{id}` | Required | Update fields; `publish: true` sets **PUBLISHED** + `publishedAt`. |
| `DELETE` | `/api/v1/kit/studio-templates/{id}` | Required | Soft-archive (`ARCHIVED`). |
| `POST` | `/api/v1/kit/studio-templates/{id}/fork` | Required | Copy definition into a new tenant (`targetTenantKey`, `slug`, `name`). |
| `GET` | `/api/v1/kit/assets` | Required | List assets from **EKD Digital Assets API** (server-side credentials). |
| `POST` | `/api/v1/kit/assets/upload` | Required | Upload via EKD (multipart `file`, `asset_type`, optional `project_name`). |

**Server modules:** `src/lib/creative/studio/` — `template-repository.ts` (Prisma), `template-policy.ts` (RBAC), `template-schemas.ts` (Zod), `tenant-keys.ts`.

**Apply schema:** after deploy, run `npx prisma db push` or generate a migration so `CreativeTemplate` exists in MySQL.

---

## 9. Documentation hygiene

When adding a new template family or route:

1. Add or update a row in `kitTemplates` (if it is kit-visible).
2. Add a one-line pointer in [../src/lib/creative/README.md](../src/lib/creative/README.md) if new top-level folders appear.
3. If behavior changes (CRUD, ACL, assets), update **this file** or [CREATIVE_WORKSPACE.md](./CREATIVE_WORKSPACE.md).

---

## 10. Related docs

| Doc | Role |
| --- | ---- |
| [CREATIVE_WORKSPACE.md](./CREATIVE_WORKSPACE.md) | Hub routes, REST kit API, build notes |
| [IMPORT_PLAN_EKDDIGITAL_FOM.md](./IMPORT_PLAN_EKDDIGITAL_FOM.md) | Historical import checklist (prefer this doc for **current** layout) |
| [../src/lib/creative/README.md](../src/lib/creative/README.md) | Import paths and folder map |
