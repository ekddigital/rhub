# Creative studio (`lib/creative` + `components/creative`)

Single-app layout: **no vendor parent folders** (`ekddigital/`, `credia/`, `fom/`). Code is grouped by **what it does** (documents, certificates, flyers, editor UI, shared shims).

| Area | Path |
| ---- | ---- |
| **Barrel (client-safe)** | [`index.ts`](./index.ts) — brand kit, document model, credential types |
| **Server-only PDF** | [`server.ts`](./server.ts) → [`certificates/certificate-pdf-reactpdf.ts`](./certificates/certificate-pdf-reactpdf.ts) |
| **Documents (AST, export, DOCX internals)** | [`documents/`](./documents/), [`document-model.ts`](./document-model.ts) |
| **Certificates (HTML templates, React-PDF, builder lib)** | [`certificates/html-export/`](./certificates/html-export/), [`certificates/credential.ts`](./certificates/credential.ts), [`certificates/template-builder/`](./certificates/template-builder/) — template model + FOM-derived builder utilities; hooks in [`certificates/hooks/`](./certificates/hooks/) |
| **Asset / upload (client → Kit API → EKD)** | [`shims/lib/ekd-assets-client.ts`](./shims/lib/ekd-assets-client.ts) calls `/api/v1/kit/assets/*` |
| **DB-backed studio templates** | [`studio/template-repository.ts`](./studio/template-repository.ts), [`studio/template-policy.ts`](./studio/template-policy.ts) — REST under `/api/v1/kit/studio-templates` |
| **Shared hook** | [`hooks/use-document-history.ts`](./hooks/use-document-history.ts) |

**React UI:** [`../components/creative/`](../components/creative/) — `ui/` (studio shadcn copy), `documents/`, `editor/`, `flyers/`, `certificates/`.

**Imports:** `@/lib/creative`, `@/lib/creative/server`, `@/components/creative/...` (feature paths above). Use `@/lib/utils` for `cn()`, not a creative-local duplicate.

**Docs:** [CREATIVE_WORKSPACE.md](../../docs/CREATIVE_WORKSPACE.md), [CREATIVE_STUDIO_ARCHITECTURE.md](../../docs/CREATIVE_STUDIO_ARCHITECTURE.md) (templates by surface, CRUD, org clone, EKD assets), [IMPORT_PLAN_EKDDIGITAL_FOM.md](../../docs/IMPORT_PLAN_EKDDIGITAL_FOM.md).

Some legacy trees (unused card presets, Puppeteer PDF stubs, DB seeders) stay on disk but are **excluded in `tsconfig.json`** until schemas and deps match rhub.
