<!-- EKD Digital Resource Hub - Workspace Instructions -->

- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [ ] Clarify Project Requirements
<!-- Next.js 14+ TypeScript project with Tailwind CSS, Prisma ORM, MySQL, and modular architecture -->

- [ ] Scaffold the Project
<!-- Initialize Next.js with TypeScript, Tailwind CSS, ESLint, and App Router -->

- [ ] Customize the Project
<!-- Configure EKD Digital brand colors, Prisma schema, route groups, and reference conversion tool -->

- [ ] Install Required Extensions
<!-- Install any extensions specified in the project setup info -->

- [ ] Compile the Project
<!-- Install dependencies and verify build -->

- [ ] Create and Run Task
<!-- Create dev task for running the development server -->

- [ ] Launch the Project
<!-- Run the development server -->

- [ ] Ensure Documentation is Complete
<!-- Verify README.md exists and contains project information -->

## Project Guidelines

### Architecture Principles

- Follow DRY (Don't Repeat Yourself) principle
- Use modular component structure
- Implement route groups for organization
- TypeScript for type safety
- Tailwind CSS for styling
- Never use prisma migrate, always use `npx prisma generate && npx prisma db push`
- Make use of `npm run lint && npx tsc --noEmit && npm run build` to verify code quality

### Brand Colors (EKD Digital)

- Gold: #C8A061
- Maroon: #8E0E00
- Dark Brown: #1F1C18
- Charcoal: #1A1A1A
- Light Gray: #E6E6E6
- Deep Navy: #182e5f
- Light Gold: #D4AF6A

### Directory Structure

- src/app - App Router with route groups
- src/components - Reusable UI components
- src/lib - Utilities and shared logic
- src/lib/types - TypeScript definitions
- src/prisma - Database schema

---

## Conference System (LSUIC 2026)

### Conference Vision & Identity

- **Conference**: LSUIC 20th Anniversary National Conference — Jinan, China
- **Target attendance**: 170 delegates
- **Previous year fee**: ¥275/delegate
- **Theme/Vision field**: stored in `ConfBooklet.theme` — displayed prominently on booklet cover as "Conference Vision"
- **Weekly committee meetings**: Thursdays at 9:00 PM via LSUIC Zoom

### Booklet System — Modular Architecture

All booklet components live in `src/components/tools/conf/booklet/`:

- `constants.ts` — brand colors `C`, `ASSETS` paths (including president photos + placeholder), flag stripe arrays
- `types.ts` — shared type re-exports
- `utils.ts` — date formatting helpers
- `Avatar.tsx` — photo/initials/silhouette component with `silhouette` prop
- `PageHeader.tsx`, `PageFooter.tsx`, `A4Page.tsx` — page chrome
- `CoverPage.tsx` — full-bleed Jinan city photo background + president photos strip
- `BackCoverPage.tsx` — hotel entrance photo strip + thank-you
- Section pages: `TableOfContentsPage`, `LeaderSection`, `AddressSection`, `CommitteeSection`, `ScheduleSection`, `DelegatesSection`, `TextSection`
- `index.tsx` — `BookletPreview` + `renderSection` dispatcher
- `booklet-preview.tsx` — thin 3-line re-export (do not add code here)

### Cover Page Features

- Full-bleed Jinan evening city photo (`/conf/assets/jinan_city/evening_view_portrait.png`)
- Liberian flag: 11 red/white stripes + blue canton with white ★
- LSUIC seal + Liberia national seal side by side (gold/red rings)
- **Conference Vision** styled box with gold label + italic theme text (if `booklet.theme` is set)
- **Presidents strip**: H.E. Joseph N. Boakai (Liberia) and H.E. Xi Jinping (China) side by side with 🤝 connector
- Frosted glass date/venue box
- Bottom: 7-stripe flag bar + dark footer

### State Dignitary Photos (static assets in `/public/conf/`)

- `president_boakai_Liberia.png` — President of Liberia
- `president_xi_China.png` — President of China
- `liberia-seal.svg` — Liberian national seal
- `lsuic_logo.png` — LSUIC logo
- `placeholder-delegate.svg` — Person silhouette; shown for delegates who haven't uploaded a photo yet

### Delegate Roster (Booklet)

- **3-column grid** (was 4-col) for better readability
- **80×90px passport-style photos** (was 52px square)
- **Silhouette placeholder** (`Avatar silhouette={true}`) auto-shown when `bookletPhotoPath` is null
- When delegate creates/links their account and uploads a photo, real photo automatically replaces silhouette — no manual action required

### Avatar Component (`Avatar.tsx`)

- `src` provided → real photo
- `src` null + `silhouette={true}` → person silhouette SVG (delegates in roster)
- `src` null + `silhouette={false}` (default) → initials pill (committee/NEC cards)

### Conference Events & Activities (2026)

From committee minutes and planning docs:

- Pool Party at hotel swimming pool
- Achievers Awards Night
- Meet & Greet / Welcome Party
- Roommate selection option
- County contest representing Liberia's 15 counties
- Raffle fundraising (target ¥50,000 RMB)

### Promotional Flyers Workflow

1. After NEC confirmation hearing: release "What to Expect" promo flyer
2. After promo flyer: release delegate signup flyer with registration link + QR code (WeChat Pay)
3. Financial secretary access: can approve delegates who have completed payment

### Database Rules

- **Never use** `prisma migrate` — always use `npx prisma generate && npx prisma db push`
- **Code quality check**: `npm run lint && npx tsc --noEmit && npm run build`
