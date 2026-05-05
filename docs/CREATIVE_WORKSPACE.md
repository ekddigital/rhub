# Creative Workspace — north star, modular stack, REST API

**Goal:** a **cohesive studio** (direction: **stronger than generic Canva** for orgs you serve) — **documents, certificates, flyers, brochures, booklets, PDF, Word**, with **per-organization colors and assets**, **short `tools/*` routes**, and a **versioned REST API** so **other apps** can use the same brain.

This doc is the **single inventory** of what is **in place**, what is **planned**, and how pieces **swap interchangeably**.

---

## Documentation map (rhub `docs/`)

| Doc | Role |
| --- | ---- |
| **This file** | Creative kit, REST `/api/v1/kit/*`, brand kit, workspace routes, build/typecheck notes. |
| [CREATIVE_STUDIO_ARCHITECTURE.md](./CREATIVE_STUDIO_ARCHITECTURE.md) | **Template grouping by surface**, naming, full CRUD target, org fork/duplicate, RBAC, **EKD-only assets**, performance & mobile. |
| [IMPORT_PLAN_EKDDIGITAL_FOM.md](./IMPORT_PLAN_EKDDIGITAL_FOM.md) | Historical import checklist from legacy apps (prefer architecture doc for **current** layout). |
| [drafts/README.md](./drafts/README.md) | Non-production artifacts: draft unified auth Prisma, links to migration script, adoption checklist. |
| [drafts/unified-auth-schema.prisma](./drafts/unified-auth-schema.prisma) | **Draft** NextAuth-oriented schema only (comment header explains scope). |
| [../src/lib/creative/README.md](../src/lib/creative/README.md) | Creative module layout: feature folders (`documents/`, `certificates/`, `shims/`, …), barrel imports, server PDF. |

Parent folder (sibling to `rhub/`): [PRISMA_MERGE_STRATEGY.md](../../docs/PRISMA_MERGE_STRATEGY.md), [ROUTE_API_INVENTORY.md](../../docs/ROUTE_API_INVENTORY.md) — both assume **rhub is the only shipping app** for this product line.

---

## Design principles (carry into every change)

1. **Short, scalable routing** — same pattern as `doc`, `img`, `conf`, `dbt`, `kit`: `/tools/{group}` + config-driven lists (`lib/tools-config.ts`, `lib/kit/tools-config.ts`, `lib/kit/templates-registry.ts`).
2. **DRY** — one **template registry** (`kitTemplates`), one **brand model** (`OrganizationBrandKit`), one **studio shadcn** tree (`components/creative/ui`) aligned with `@/lib/utils` for `cn()`.
3. **Interchangeable outputs** — templates declare `outputs[]` (pdf, png, docx, …); renderers are pluggable per implementation row.
4. **Multi-org** — all customer-facing templates should eventually accept **brand kit** (API merge below + future persisted org rows).
5. **REST for integrations** — `/api/v1/kit/*` for external apps; expand with auth (`X-API-Key` / OAuth) as you harden.
6. **Templates by surface** — certificates, flyers, documents, brochure each have a **single home** in `lib/creative` / `components/creative` with **modular subdirs** (see [CREATIVE_STUDIO_ARCHITECTURE.md](./CREATIVE_STUDIO_ARCHITECTURE.md)); target **full CRUD** via DB with code defaults, org **fork** for copies, **EKD Digital asset API** only (no Cloudinary).
7. **Speed + mobile** — lazy-load studios, paginate lists, responsive toolbars; heavy work async where needed.

### Single app (rhub only)

Ship everything in **this** Next app (`rhub/`). There is **no** sibling `packages/*` workspace or `apps/work` app under `coding/web/andgroupco` for this product. Draft Prisma/auth experiments live only under [`docs/drafts/`](./drafts/README.md) and [`scripts/migrations/`](../scripts/migrations/README.md).

### Keeping rhub fast

- **`/tools/conf/*`:** [`src/app/(hub)/tools/conf/layout.tsx`](../src/app/(hub)/tools/conf/layout.tsx) sets **`export const dynamic = "force-dynamic"`** so conference ops pages are **not** statically prerendered at build time (avoids 60s timeouts; routes show as **ƒ Dynamic** in `next build` output).
- Use the same pattern for other heavy **tools** surfaces if build prerender becomes slow again.
- **Lazy-load** large studios (`next/dynamic`) so default dashboards stay small; mount vendor/design bundles only when the user opens that surface.
- **One deploy**, one MySQL + Prisma schema for rhub; integrate other codebases by **copy/import into `rhub`** or HTTP APIs, not by workspace wiring.

---

## What is in place today

| Layer | Location | Status |
| ----- | -------- | ------ |
| **Creative Kit hub** | [`/tools/kit`](../src/app/(hub)/tools/kit/page.tsx), [`KitCreativeWorkspace`](../src/components/tools/kit/kit-creative-workspace.tsx) | Beta |
| **Kit surfaces config** | [`lib/kit/tools-config.ts`](../src/lib/kit/tools-config.ts) | Live |
| **Template / output catalog (API + DRY)** | [`lib/kit/templates-registry.ts`](../src/lib/kit/templates-registry.ts) | Live |
| **Org brand kit (types + merge + CSS vars)** | [`lib/creative/brand-kit.ts`](../src/lib/creative/brand-kit.ts), barrel [`lib/creative/index.ts`](../src/lib/creative/index.ts) | Beta |
| **Studio UI + engines** | [`components/creative/*`](../src/components/creative/), [`lib/creative/`](../src/lib/creative/) (documents, certificates, flyers, editor, shims) | Staged |
| **Tools menu registration** | `group: "kit"` in [`lib/tools-config.ts`](../src/lib/tools-config.ts) | Beta |
| **Conference surfaces** | [`/tools/conf/*`](../src/app/(hub)/tools/conf) flyers, letters, booklet | Live |
| **Converters** | [`/tools/doc`](../src/app/(hub)/tools/doc), [`/tools/img`](../src/app/(hub)/tools/img) | Live |
| **REST v1 (kit)** | [`/api/v1/kit/*`](../src/app/api/v1/kit) | Live: catalog, brand merge, health; **studio templates CRUD + fork**, **EKD assets list/upload proxy** (session auth) |

---

## REST API (`/api/v1/kit`)

**CORS:** set `KIT_API_CORS_ORIGIN` to your consuming app origin in production (default `*` for dev).

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/v1/kit` | Discovery: links to sub-endpoints |
| `OPTIONS` | `/*` | CORS preflight (each route implements OPTIONS) |
| `GET` | `/api/v1/kit/health` | Liveness |
| `GET` | `/api/v1/kit/surfaces` | Hub rows (short slugs + hrefs) |
| `GET` | `/api/v1/kit/templates` | Code catalog only; query `?category=` `?status=` |
| `GET` | `/api/v1/kit/studio-templates` | DB-backed instances; optional auth (see [CREATIVE_STUDIO_ARCHITECTURE.md](./CREATIVE_STUDIO_ARCHITECTURE.md)) |
| `POST` | `/api/v1/kit/studio-templates` | Create (session cookie) |
| `GET` | `/api/v1/kit/studio-templates/:id` | Read one |
| `PATCH` | `/api/v1/kit/studio-templates/:id` | Update (`publish: true` to publish) |
| `DELETE` | `/api/v1/kit/studio-templates/:id` | Archive |
| `POST` | `/api/v1/kit/studio-templates/:id/fork` | Duplicate into another tenant |
| `GET` | `/api/v1/kit/assets` | List via EKD Digital Assets API (auth) |
| `POST` | `/api/v1/kit/assets/upload` | Upload via EKD (multipart, auth) |
| `POST` | `/api/v1/kit/brand-kit/merge` | Body: `{ base: OrganizationBrandKit, override: Partial<...> }` → merged kit JSON |

**Example — list flyer-capable templates**

```http
GET /api/v1/kit/templates?category=flyer
```

**Example — merge event override onto org defaults**

```http
POST /api/v1/kit/brand-kit/merge
Content-Type: application/json

{
  "base": {
    "orgId": "org_1",
    "slug": "acme",
    "displayName": "ACME",
    "colors": { "primary": "#0f172a" },
    "assets": {},
    "typography": {}
  },
  "override": { "colors": { "primary": "#0f172a", "accent": "#c9a227" } }
}
```

### API backlog (add next)

| Endpoint | Purpose |
| -------- | ------- |
| `GET /api/v1/kit/brand-kit/:orgId` | Load persisted kit from DB |
| `PUT /api/v1/kit/brand-kit/:orgId` | Update kit (auth required) |
| `POST /api/v1/kit/render/pdf` | Server render job (queue + storage) |
| `POST /api/v1/kit/render/docx` | DOCX generation from `DocumentModel` |
| `GET /api/v1/kit/jobs/:jobId` | Async render status |

Use the same **`templates-registry`** `id` field in render requests so other apps stay decoupled from file paths.

---

## Workspace map (where users work)

| Short path | Purpose |
| ---------- | ------- |
| `/tools/kit` | Hub: all creative surfaces |
| `/tools/kit/crt` | Certificates (placeholder → `components/creative` + `lib/creative`) |
| `/tools/kit/bro` | Brochure (placeholder) |
| `/tools/conf/flyers`, `/letters`, `/booklet` | Ops-grade surfaces (live) |
| `/tools/doc`, `/tools/img` | Conversions (live) |

---

## Modular file map (DRY entrypoints)

- **Hub UI:** `src/components/tools/kit/`
- **Kit config:** `src/lib/kit/tools-config.ts`
- **Template catalog:** `src/lib/kit/templates-registry.ts`
- **Brand validation (API):** `src/lib/kit/brand-kit-zod.ts`
- **HTTP helpers:** `src/lib/kit/http.ts`
- **Studio UI:** `src/components/creative/{ui,documents,editor,flyers,certificates}/`
- **Shared lib:** `src/lib/creative/` (includes **document AST** `document-model.ts`; `documents/types` → same model)

---

## Typecheck / build note

`tsconfig.json` still **excludes** `scripts/migrations/**` (draft DB client types) and a small set of **optional / legacy** creative files (e.g. unused flyer card presets under `certificates/template-builder/cards/`, Puppeteer-heavy certificate render stubs, legacy seeders, globe demo, stub `markdown-editor`) so the main app **typechecks and builds** while those pieces are wired to rhub schemas and storage. Public document types export from `lib/creative/document-model.ts`.

---

## What we still need (high level)

1. **Unify TipTap** (v2 vendor vs v3 rhub) or **lazy-isolate** editor bundles.
2. **Persist** `OrganizationBrandKit` in Prisma + admin UI per org.
3. **Wire** certificate and brochure UIs from `components/creative` + `lib/creative` into `/tools/kit/crt` and `/tools/kit/bro`.
4. **Auth** on mutate/render APIs (API keys or session).
5. **Render queue** for heavy PDF/DOCX from other apps.

---

*Update this file whenever you add a template row, API route, or workspace path. Keep the **documentation map** at the top of this file in sync with [drafts/README.md](./drafts/README.md) and [IMPORT_PLAN_EKDDIGITAL_FOM.md](./IMPORT_PLAN_EKDDIGITAL_FOM.md).*
