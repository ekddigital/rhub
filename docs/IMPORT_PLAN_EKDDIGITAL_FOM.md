# Single import plan: portable assets from ekddigital & fom → rhub

**One file** — full inventory of ideas, modules, and routes worth bringing into **`rhub/`**: print/digital **documents**, **flyers**, **brochures**, **banners**, **certificates**, **cards**, and related **formatting / export** code. Use it to **review first**, then **copy**, then **organize** inside rhub (merge with existing conference letters/booklet/flyer studio where it makes sense).

**Not in scope here:** elections, blog, auth, prayer APIs, or whole-app monorepo work — only **asset and document/certificate** surfaces plus their supporting `lib/` and APIs if you want parity later.

Follows the same **short `tools/*` naming** and **config-driven flow** as [`doc`](../src/app/(hub)/tools/doc), [`img`](../src/app/(hub)/tools/img), [`conf`](../src/app/(hub)/tools/conf).  
**REST + workspace spec:** [CREATIVE_WORKSPACE.md](./CREATIVE_WORKSPACE.md).  
**Draft DB / identity experiments (not live schema):** [drafts/README.md](./drafts/README.md).

### Current staging in this repo (prefer this over “brand-external” names)

| Staging path | Status |
| ------------ | ------ |
| **`src/components/creative/credia/`** + **`src/lib/creative/credia/`** | React-PDF certificate templates + types; [`server.ts`](../src/lib/creative/server.ts) for server PDF entry. |
| **`src/components/creative/ekddigital/`** + **`src/lib/creative/ekddigital/`** | Flyers, document model UI (partially type-excluded), shadcn `components/ui`, shims. |
| **`src/components/creative/fom/`** + **`src/lib/creative/fom/`** | Certificate builder / cards / JICF patterns (partially type-excluded). |
| **`src/lib/creative/`** (root files) | **Promoted** shared code: `brand-kit.ts`, `document-model.ts`, `data-export.ts`, barrel [`index.ts`](../src/lib/creative/index.ts) — import `@/lib/creative` in product code. |

The table in §2 below kept the **original “brand-external / ministry-external”** naming as an **organizational hint**; when adding new copies, place UI under **`src/components/creative/`** and libraries under **`src/lib/creative/`**, or promote shared contracts into **`src/lib/creative/*.ts`**.

---

## 1. What rhub already has (do not blindly duplicate)

| Area | Rhub location |
| ---- | ------------- |
| Conference letters / A4 / letterhead | `src/components/tools/conf/letter-composer-*.tsx`, `letterhead-display.tsx`, `src/lib/conf/` |
| Booklet (print) | `src/components/tools/conf/booklet/` |
| Conference flyer entry | `src/app/(hub)/tools/conf/flyers/page.tsx`, `flyer-studio-shell.tsx` |
| Generic doc converters | `src/app/(hub)/tools/doc/` (HTML/PDF/DOCX tooling) |
| **Certificates** | Staged under **`src/components/creative/*`** + **`src/lib/creative/*`** (credia React-PDF, ekddigital/fom surfaces); product routes **`/tools/kit/crt`** still to wire fully (see CREATIVE_WORKSPACE backlog). |

---

## 2. Staging layout in rhub (recommended for the copy phase)

Copy into clearly named buckets so you know origin before you reorganize.

| Staging path | Source |
| ------------ | ------ |
| `src/components/brand-external/` | ekddigital UI (flyers, brochure, banner, document studio, cert UI) |
| `src/lib/brand-external/` | ekddigital `lib/document`, `lib/utils/certificates`, `lib/services/certificates` |
| `src/components/ministry-external/` | fom UI (JICF flyers, cert admin/builder, cards) |
| `src/lib/ministry-external/` | fom `lib/utils/*` (certificates, cards, renderers, services) |
| `src/app/(hub)/external-staging/` *(optional)* | Routes copied verbatim before you remap URLs |

---

## 3. ekddigital — documents & brand formatting

### 3A. Flyer builder (design system + export)

| Kind | Path (from repo root) |
| ---- | --------------------- |
| Page | `ekddigital/app/(root)/brand/flyers/page.tsx` |
| All UI + hooks + guides | `ekddigital/components/flyers/` (entire folder: `flyer-dashboard.tsx`, `flyer-templates.ts`, `flyer-download.ts`, `hooks/*`, `context-menu-provider.tsx`, `README.md`, `*_GUIDE.md`, `*_SUMMARY.md`) |

**Ideas to preserve:** template keys + layer model, history/undo hooks, JPG/PNG export, context menus, keyboard shortcuts.

### 3B. Brochure (tri-fold, print)

| Kind | Path |
| ---- | ---- |
| Routes | `ekddigital/app/(root)/brand/brochure/page.tsx`, `brochure-content.tsx` |

**Ideas:** print-only CSS, `@media print`, screen vs print controls.

### 3C. Banner templates

| Kind | Path |
| ---- | ---- |
| Routes | `ekddigital/app/(root)/brand/banner/page.tsx`, `banner/index.tsx` |
| Templates | `ekddigital/app/(root)/brand/banner/templates/template1.tsx` … `template3.tsx` |

### 3D. Document studio (rich editor + letterhead + DOCX/PDF)

| Kind | Path |
| ---- | ---- |
| Routes | `ekddigital/app/(root)/brand/document/page.tsx`, `document/layout.tsx`, `document/shared/[shareId]/*` |
| Document model & parsing | `ekddigital/lib/document/types.ts`, `htmlParser.ts`, `numberingEngine.ts`, `tocBuilder.ts`, `constants.ts`, `shared-styles.ts`, `pdfExport.ts`, `docxExport.ts`, `index.ts` |
| DOCX pipeline | `ekddigital/lib/document/docx/` (full tree) |
| Editor | `ekddigital/components/editor/` (full tree) |
| Document UI | `ekddigital/components/document/` (full tree) |
| History hook | `ekddigital/hooks/use-document-history.ts` |

**Ideas:** `DocumentModel` AST, HTML ↔ model, TOC, numbering, A4 letterhead layout, share viewer.

### 3E. Optional brand surfaces

| Kind | Path |
| ---- | ---- |
| Calendar | `ekddigital/app/(root)/brand/calendar/page.tsx` — include only if you want the same printable UX |

### 3F. ekddigital — certificates (DB-backed issuance + public verify)

**Concepts:** Prisma models `certificate_templates`, `certificates` (see `ekddigital/prisma/schema.prisma`); admin UI; REST APIs; template definitions in TS; PDF/QR helpers.

| Kind | Path |
| ---- | ---- |
| Public marketing | `ekddigital/app/(root)/services/certificates/page.tsx`, `verify/page.tsx` |
| Admin | `ekddigital/app/admin/certificates/page.tsx`, `issue/page.tsx`, `[id]/view/page.tsx` |
| API | `ekddigital/app/api/certificates/` — `route.ts`, `[id]/*`, `verify/*`, `templates/route.ts`, `upload`, `initialize`, `stats` |
| Admin API | `ekddigital/app/api/admin/certificates/seed/route.ts` |
| Services | `ekddigital/lib/services/certificates/certificate-service.ts`, `organization-service.ts` |
| Utils / templates | `ekddigital/lib/utils/certificates/` — `renderer.ts`, `pdf-generator.ts`, `qr-code-generator.ts`, `certificate-id-generator.ts`, `certificate-data-processor.ts`, `templates/` (ekd, fom, jicf, juls, general), `seeder.ts`, `test-templates.ts`, `index.ts`, etc. |
| React | `ekddigital/components/certificates/` — `certificate-dashboard.tsx`, `certificate-issue-form.tsx`, `certificate-renderer.tsx`, `certificate-template-preview.tsx`, `certificate-preview.tsx`, `certificate-initializer.tsx`, `certificate-issue-page.tsx` |

### 3G. ekddigital — shared “ideas” for certificates & docs

- **Verification URLs + QR** (`qr-code-generator`, verify routes).
- **Template library as code** under `lib/utils/certificates/templates/*` (multi-brand: EKD, FOM, JICF, JULS).
- **Seeder** for demo templates (`seeder.ts`, `admin` seed API).

---

## 4. fom — flyers, cards, and certificate ecosystem

### 4A. JICF flyers (fixed React layouts)

| Kind | Path |
| ---- | ---- |
| Components | `fom/components/jicf/english-tutoring-flyer.tsx`, `sports-day-flyer.tsx`, `graduates-celebration-flyer.tsx` |
| Routes | `fom/app/jicf/page.tsx`, `english-tutoring/page.tsx`, `sports-day/page.tsx`, `graduates-celebration/page.tsx` |

### 4B. Cards (invitations, graduations — code-defined layouts)

| Kind | Path |
| ---- | ---- |
| Card layouts by org | `fom/lib/utils/cards/` — `jicf/`, `fom/`, `juls/`, `general/`, `index.ts`, `types.ts` |
| Render / templates | `fom/lib/utils/card-renderer.ts`, `card-templates.ts`, `card-templates-new.ts`, `card-renderer-fixed.ts`, `card-renderer-old.ts` |
| Service | `fom/lib/services/card-database.ts` |
| APIs | `fom/app/api/cards/` — `route.ts`, `issue`, `templates`, `[id]/*`, `initialize` |

### 4C. fom — certificates (large surface: admin, bulk, flexible issue, builder)

**Lib — core engines & design**

| Kind | Path |
| ---- | ---- |
| Core utils | `fom/lib/utils/certificate.ts`, `certificate-security.ts`, `certificate-renderer.ts`, `canvas-certificate-renderer.ts`, `enhanced-certificate-renderer.ts`, `hybrid-certificate-renderer.ts`, `website-certificate-renderer.ts` |
| Templates / config | `fom/lib/utils/certificate-templates.ts`, `certificate-templates-clean.ts`, `certificate-templates-old.ts`, `certificate-design-system.ts`, `certificate-manager.ts`, `certificate-debugger.ts`, `certificate-config` → `fom/lib/config/certificate-config.ts` |
| By-audience packs | `fom/lib/utils/certificates/` — `index.ts`, `types.ts`, `fom/`, `jicf/`, `juls/`, `general/`, `jicf/ISSUING_MANUAL.txt`, etc. |
| Services | `fom/lib/services/certificate-service.ts`, `certificate-database.ts` |

**Admin & app UI**

| Kind | Path |
| ---- | ---- |
| Admin pages | `fom/app/(admin)/admin/certificates/page.tsx`, `issue/page.tsx`, `preview/page.tsx`, `flexible-preview/page.tsx`, `flexible-issue/page.tsx`, `builder/page.tsx` *(skip `*_backup*`, `*.bak` unless you need history)* |
| Member | `fom/app/(app)/dash/certificates/page.tsx` |
| Public verify | `fom/app/(community)/verify-certificate/page.tsx` |

**Template builder (visual editor)**

| Kind | Path |
| ---- | ---- |
| Builder UI | `fom/components/ui/features/certificate-template-builder/` — `index.tsx`, `design-canvas.tsx`, `element-toolbar.tsx`, `element-properties-panel.tsx`, `template-properties-panel.tsx`, `preview-modal.tsx`, `custom-slider.tsx` |

**APIs (issuance, bulk, templates)**

| Kind | Path |
| ---- | ---- |
| Certificates | `fom/app/api/certificates/` — issue, `flexible-issue`, templates, `[id]/*` (download, download-html, debug, test, delete-permanent), `verify`, `my-certificates`, `user`, `issued`, `issued/export`, `bulk-*` |
| Admin | `fom/app/api/admin/certificates/route.ts`, `admin/certificate-templates/*` |

### 4D. fom — ideas worth keeping when merging with ekddigital

- **Multiple renderers** (canvas vs DOM vs “website” layout) — pick one long-term, but keep code until evaluated.
- **Flexible issue** + **template builder** — strongest if you want non-developers to adjust layouts.
- **Bulk download / revoke / delete** — operational tooling.
- **Security helpers** (`certificate-security.ts`) — keep with any unified verify flow.

---

## 5. Overlap: two certificate worlds (fix properly later)

| Aspect | ekddigital | fom |
| ------ | ---------- | --- |
| Storage | Prisma templates + issued rows | Prisma (FOM schema) + rich template JSON |
| Authoring | TS template modules + admin issue UI | Visual builder + flexible issue + code templates |
| Export | PDF pipeline in `lib/utils/certificates` | Many render paths + Puppeteer/HTML patterns elsewhere in app |

**Direction (after copy):** one **product** in rhub — either “DB + builder drives renderers” or “code templates + optional DB metadata” — but **do not** maintain two full issuance stacks in production long term. This plan captures **both** so nothing is lost before you decide.

---

## 6. Cross-cutting: dependencies & conflicts

| Topic | Notes |
| ----- | ----- |
| TipTap | ekddigital **v2**, rhub **v3** — align or isolate document studio in a bundle boundary. |
| Tailwind | ekddigital **v3**, rhub/fom **v4** — expect class/token tweaks after copy. |
| Puppeteer / jspdf / docx / sharp | Compare `package.json` across apps when wiring exports. |
| Auth / DB | Certificate **APIs** assume NextAuth + Prisma models — rhub uses its own auth/schema; APIs may need adapters or a read-only “import scripts” phase before full integration. |
| Assets | `public/logo.png`, Cloudinary, Firebase — note what each page requires when copying. |

---

## 7. Master checklist (copy phase)

**ekddigital — brand & documents**

- [ ] `components/flyers/` + brand flyers page  
- [ ] `brand/brochure/*`  
- [ ] `brand/banner/*`  
- [ ] `brand/document/*` + shared viewer  
- [ ] `lib/document/**` + `components/editor/**` + `components/document/**` + `hooks/use-document-history.ts`  
- [ ] `brand/calendar` (optional)  

**ekddigital — certificates**

- [ ] `components/certificates/**`  
- [ ] `lib/utils/certificates/**` + `lib/services/certificates/**`  
- [ ] `app/admin/certificates/**` + `app/(root)/services/certificates/**`  
- [ ] `app/api/certificates/**` + `app/api/admin/certificates/**`  

**fom — flyers & cards**

- [ ] `components/jicf/*-flyer.tsx` + `app/jicf/**`  
- [ ] `lib/utils/cards/**` + card renderer/template files  
- [ ] `app/api/cards/**` (if you need issuance from rhub)  

**fom — certificates**

- [ ] `lib/utils/certificate*.ts`, `lib/utils/certificates/**`, `lib/services/certificate*.ts`, `lib/config/certificate-config.ts`  
- [ ] `components/ui/features/certificate-template-builder/**`  
- [ ] `app/(admin)/admin/certificates/**`, `app/(app)/dash/certificates/**`, `verify-certificate` page  
- [ ] `app/api/certificates/**`, `app/api/admin/certificate-templates/**`, `app/api/admin/certificates/**`  

**rhub — organize phase (later)**

- [ ] Map routes under [`/tools/kit/*`](../src/app/(hub)/tools/kit), merge with [`/tools/conf/flyers`](../src/app/(hub)/tools/conf/flyers/page.tsx) and letters/booklet where it makes sense  
- [ ] Single Prisma story: live [`prisma/schema.prisma`](../prisma/schema.prisma); optional future identity merge sketched in [`docs/drafts/unified-auth-schema.prisma`](./drafts/unified-auth-schema.prisma)  
- [ ] Retire duplicate renderer after consolidation; keep **one** row per template in [`lib/kit/templates-registry.ts`](../src/lib/kit/templates-registry.ts)  

---

*This is the only living checklist for “bring sister-project document + certificate ideas into rhub.” Update this file in place as you drop or add scope. Keep in sync with **`src/lib/creative/`** / **`src/components/creative/`** and [CREATIVE_WORKSPACE.md](./CREATIVE_WORKSPACE.md).*
