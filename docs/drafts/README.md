# `docs/drafts/` — design artifacts (not production schema)

This folder holds **reference** files only. Nothing here is imported by `npm run dev` / `npm run build`. The live app uses [`../../prisma/schema.prisma`](../../prisma/schema.prisma) and [`../../src/lib/auth.ts`](../../src/lib/auth.ts).

---

## Contents

| Artifact | File | What it is |
| -------- | ---- | ---------- |
| Unified auth (draft) | [`unified-auth-schema.prisma`](./unified-auth-schema.prisma) | Standalone Prisma file: NextAuth-shaped `User` + `Account` + `Session` + `VerificationToken`, with `WorkRole` / `HubAccessStatus`. Use when **designing** a future identity merge—not the running rhub DB. |
| User import script (draft targets) | [`../../scripts/migrations/migrate-rhub-users-unified-draft.ts`](../../scripts/migrations/migrate-rhub-users-unified-draft.ts) | One-off MySQL copy from a **rhub** DB into a DB whose Prisma client matches the draft schema. Documented in [`../../scripts/migrations/README.md`](../../scripts/migrations/README.md). Excluded from root `tsconfig.json` typecheck. |

---

## Why this exists

We briefly had a **`packages/` + `apps/work`** layout under the parent folder; that was **removed** in favor of a **single deployable app: `rhub/`**. Auth/DB experiments from that period were **moved here** so nothing is lost, without running two Prisma clients in production.

---

## Related docs (read in this order for creative + import work)

1. **[CREATIVE_WORKSPACE.md](../CREATIVE_WORKSPACE.md)** — product kit, `/api/v1/kit`, brand kit, performance (`/tools/conf` dynamic), typecheck excludes.
2. **[IMPORT_PLAN_EKDDIGITAL_FOM.md](../IMPORT_PLAN_EKDDIGITAL_FOM.md)** — sister-project inventory; checklist for `components/creative` / `lib/creative` and routes.
3. **[../src/lib/creative/README.md](../../src/lib/creative/README.md)** — creative module layout (`credia`, `ekddigital`, `fom`), barrel + server PDF.
4. Parent repo **[PRISMA_MERGE_STRATEGY.md](../../../docs/PRISMA_MERGE_STRATEGY.md)** — long-term DB merge narrative (rhub-only canonical app).

---

## Adoption checklist (if you merge this draft into production)

- [ ] Diff **`WorkRole` / `HubAccessStatus`** against rhub’s **`UserRole` / `AccessApprovalStatus`** and map enums in a migration.
- [ ] Decide: keep rhub **custom `Session` (token cookie)** only, or add NextAuth tables and **`PrismaAdapter`** (then `User.email` / `Session` shape must match).
- [ ] Run Prisma migrate from **one** `schema.prisma` only; delete or archive this draft once merged.
- [ ] Remove `scripts/migrations/**` exclude from `tsconfig.json` only if that script is updated to use the merged client types.

---

*Add new draft files here only when they must stay **outside** the main Prisma schema (experiments, ADRs as schema, import specs). Promote stable contracts to **`src/lib/creative/`** (or other `src/lib/*`) when stable.*
