# Conference Hub System Requirements

## Complete Feature Specifications — LSUIC 2026 Conference Hub

**Document Date:** April 18, 2026  
**Status:** Living Document — Updated as features are added  
**Scope:** Conference Hub Platform — All Features & Enhancements

---

## 1. Committee Chair Role System

### 1.1 Role Assignment Hierarchy

| Role Level               | Who Can Assign | Who They Can Assign                                 |
| ------------------------ | -------------- | --------------------------------------------------- |
| Super Admin              | Platform-level | Overall Conference Chair                            |
| Overall Conference Chair | Super Admin    | Committee Chairs (Cooking, Sports, Logistics, etc.) |
| Committee Chair          | Overall Chair  | Members within their committee scope                |

### 1.2 Conference Member Roles (`ConfRole`)

Existing roles remain unchanged:

- `CHAIR` — Overall Conference Chair
- `VICE_CHAIR` — Vice Chair
- `SECRETARY` — Secretary
- `TREASURER` — Treasurer
- `COMMITTEE` — General Committee Member
- `DELEGATE` — Delegate

### 1.3 New Committee Scope Fields

`ConfMember` now supports:

- **`committeeScope`** — Free-text committee name (e.g., `"Cooking"`, `"Sports"`, `"Logistics"`, `"Media"`, `"Transport"`)
- **`canAssignCommittee`** — If `true`, this member (Chair-level) can assign other members to their committee scope
- **`canApprovePayments`** — If `true`, this member can perform Level-1 committee approval of payments within their scope

### 1.4 User Account Linking

- Any `ConfMember` can be linked to a registered `User` account via the `userId` field
- Once linked, the user gains conference-context permissions matching their `ConfRole`
- Super admin links a `User` account to a member by searching registered users

### 1.5 Assignment Rules

- **Super Admin** can:
  - Create/edit any `ConfMember`
  - Set `role = CHAIR` and link to a `User` account
  - Grant `canAssignCommittee = true` to any CHAIR member
  - Grant `canApprovePayments = true` to any non-DELEGATE member

- **Chair** (linked User with `role = CHAIR` and `canAssignCommittee = true`) can:
  - Create new COMMITTEE members within their `committeeScope`
  - Link those members to existing User accounts
  - Set `canApprovePayments = true` for their committee members

---

## 2. Financial Transaction System

### 2.1 Payment Types

All transactions are categorized by `paymentType`:

| Type      | Description     | Examples                                            |
| --------- | --------------- | --------------------------------------------------- |
| `EXPENSE` | Money going out | Catering, venue, supplies                           |
| `INCOME`  | Money coming in | Fundraising, donations, sponsorships, contributions |

### 2.2 Payment Record Fields

All existing fields are preserved. New fields added:

- **`paymentType`** — `EXPENSE` or `INCOME` (default: `EXPENSE`)
- **`incomeSource`** — For INCOME: source description (e.g., "Fundraising Drive", "Alumni Donation")
- **`committeeScope`** — Which committee this payment belongs to (e.g., `"Cooking"`, `"Sports"`)
- **`submittedByMemberId`** — The `ConfMember` who submitted the record
- **`committeeApprovedBy`** — Member ID of the committee chair who gave Level-1 approval
- **`committeeApprovedAt`** — Timestamp of Level-1 approval
- **`isLocked`** — `true` once finally approved — permanently immutable

### 2.3 Two-Tier Approval Workflow

```
[Submitter]
    │ Creates payment record (status = PENDING)
    │ Selects relevant committee → routes to committee chair
    ▼
[Committee Chair / Treasurer]
    │ Reviews and approves (Level 1)
    │ status → APPROVED, committeeApprovedBy set
    ▼
[Overall Conference Chair / Super Admin]
    │ Final review and approval (Level 2)
    │ approvedBy, approvedAt set → isLocked = true
    │ ⚠️ Permanently locked — NO edits or deletions possible
    ▼
[FINAL APPROVED & LOCKED]
```

**Rejection:**

- Either approver can reject (status → `REJECTED`)
- Rejected records are NOT locked and can be resubmitted
- A rejection reason/note must be provided

### 2.4 Lock Rules

Once `isLocked = true`:

- No user (including Super Admin) can edit, delete, or modify the record
- All API endpoints enforce this constraint
- The UI shows a locked badge and disables all action buttons

---

## 3. Proof of Payment / Receipt Uploads

### 3.1 Supported Formats

- Images: `image/jpeg`, `image/png`, `image/webp`
- Documents: `application/pdf`
- Max file size: 10 MB per file
- Multiple files per payment record

### 3.2 Image Display in Exports

When generating PDF or Word exports:

- Proof images are embedded as **thumbnails within the payment table row** (not separate full-page images)
- Column width: ~2.5 cm — compact but verifiable
- Multiple images per row arranged in sub-columns, not stacked vertically
- Default caption: `Proof of Payment / Receipt`
- Users can rename captions (e.g., `Receipt from Catering`, `Fundraising Donation Received`)

---

## 4. Incoming Funds Management

### 4.1 Separate but Consistent Structure

- Incoming funds use the same `ConfPayment` model with `paymentType = INCOME`
- Same upload, approval workflow, and export rules apply
- `incomeSource` field identifies the funding origin

### 4.2 Fund Categories

Common income sources:

- `Fundraising` — Money raised through events or drives
- `Donation` — Individual or group donations
- `Sponsorship` — Corporate or organizational sponsors
- `Contribution` — Member contributions
- `Other` — Miscellaneous income

### 4.3 Reporting

- Financial reports clearly distinguish between EXPENSE and INCOME transactions
- Net balance (INCOME − EXPENSE) is shown in report summaries
- All incoming and outgoing entries appear in the same report with clear labels

---

## 5. Finance Audit Log

### 5.1 Logged Actions

Every significant financial action is recorded:

| Action                       | Trigger                              |
| ---------------------------- | ------------------------------------ |
| `PAYMENT_CREATED`            | New payment record submitted         |
| `PAYMENT_UPDATED`            | Payment details edited (before lock) |
| `PAYMENT_COMMITTEE_APPROVED` | Level-1 approval by committee chair  |
| `PAYMENT_FINAL_APPROVED`     | Level-2 final approval → locked      |
| `PAYMENT_REJECTED`           | Payment rejected with reason         |
| `PAYMENT_PROOF_UPLOADED`     | Receipt/proof image added            |
| `BUDGET_CREATED`             | New budget created                   |
| `BUDGET_APPROVED`            | Budget approved                      |
| `BUDGET_REJECTED`            | Budget rejected                      |
| `REPORT_CREATED`             | Report generated                     |
| `REPORT_EXPORTED`            | Report exported to file              |
| `MEMBER_CHAIR_ASSIGNED`      | User assigned as chair               |
| `MEMBER_SCOPE_SET`           | Committee scope assigned to member   |

### 5.2 Audit Log Fields

Each log entry records:

- Who performed the action (actorUserId, actorName)
- What was done (action, entityType, entityId)
- When it happened (createdAt)
- Additional details (JSON payload with before/after values where applicable)
- Optional note (e.g., rejection reason)

---

## 6. Report Builder

### 6.1 Report Composition

Users can build custom financial reports by:

- Selecting a **date range** (e.g., April 1–30, or specific dates like 1st and 3rd)
- Filtering by **payment type** (EXPENSE / INCOME / both)
- Filtering by **committee scope**
- Filtering by **approval status**

### 6.2 Comments

- **Line comments**: Add a comment immediately after a specific payment line item
- **General comment**: A single summary comment at the report level (for discussion, notes, or summary)

### 6.3 Report Content

Each exported report includes:

- Report title, date range, generated-by, generated-on date
- Well-formatted table: payment date, description, amount (¥/\$), committee, type, approval status
- Proof-of-payment thumbnails embedded in table columns
- Individual line comments
- General overall comment section at end
- Net balance summary (INCOME − EXPENSE)

### 6.4 Export Formats

| Format            | Details                                    |
| ----------------- | ------------------------------------------ |
| **CSV**           | Raw data, no images                        |
| **Excel (.xlsx)** | Formatted table with all fields, no images |
| **PDF**           | Full report with embedded proof thumbnails |
| **Word (.docx)**  | Editable report with tables and thumbnails |

---

## 7. Implementation Notes

### 7.1 Database Models Involved

| Model                 | Changes                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `ConfMember`          | + `committeeScope`, `canAssignCommittee`, `canApprovePayments`                                                                     |
| `ConfPayment`         | + `paymentType`, `incomeSource`, `committeeScope`, `submittedByMemberId`, `committeeApprovedBy`, `committeeApprovedAt`, `isLocked` |
| `ConfFinanceAuditLog` | NEW — full audit trail                                                                                                             |
| `ConfReport`          | NEW — saved reports                                                                                                                |
| `ConfReportEntry`     | NEW — report line items with comments                                                                                              |

### 7.2 Access Control Levels

| Action                 | Required Permission                                   |
| ---------------------- | ----------------------------------------------------- |
| Submit payment         | Conference participant (manager or committee member)  |
| Level-1 approve        | `canApprovePayments = true` OR Super Admin            |
| Level-2 final approve  | `isSuperAdmin` OR CHAIR with overall conference scope |
| View audit log         | Manager-level or above                                |
| Build/export report    | Manager-level or above                                |
| Assign committee scope | `canAssignCommittee = true` (Chair) OR Super Admin    |
| Link user to member    | Super Admin only                                      |

### 7.3 Preserved Existing Fields

The following fields are **not modified**:

- `ConfPayment`: `amount`, `paidBy`, `paidTo`, `method`, `ref`, `note`, `status`, `approvedBy`, `approvedAt`, `paidAt`
- `ConfMember`: `name`, `role`, `city`, `phone`, `email`, `title`, `photoPath`, `photoFileName`, `isActive`, `joinedAt`
- All `ConfBudget` and `ConfBudgetItem` fields
- All `ConfPaymentProof` fields

---

## 8. UI Pages

| Route                          | Purpose                                                |
| ------------------------------ | ------------------------------------------------------ |
| `/tools/conf/payments`         | Enhanced payment list with approval status and filters |
| `/tools/conf/payments/new`     | Create EXPENSE or INCOME payment with proof upload     |
| `/tools/conf/finance/audit`    | Full audit log with filters                            |
| `/tools/conf/finance/reports`  | Report builder — compose, preview, and export          |
| `/tools/conf/committee`        | Enhanced committee list with chair assignment          |
| `/tools/conf/committee/assign` | Assign/link users to member roles (manager only)       |

---

_Document maintained in: `scripts/conference-2026/SYSTEM_REQUIREMENTS.md`_

---

## 8. Secure User Impersonation

### 8.1 Overview

Authorized administrators can impersonate any platform user to view and interact with the system exactly as that user would — without knowing the user's password. All impersonation sessions are fully logged and auditable.

### 8.2 Who Can Impersonate

| Identity                    | Condition                               |
| --------------------------- | --------------------------------------- |
| Super Admin                 | Always; no extra flag required          |
| Virtual Assistant / Exec VA | `canImpersonate = true` flag on account |
| Conference Chair            | `canImpersonate = true` flag on account |

The `canImpersonate` flag is set by a Super Admin from the user management panel.

### 8.3 Who Can Be Impersonated

Any user **except** Super Admin accounts. Attempting to impersonate a Super Admin is blocked at the API level and returns a 403 error.

### 8.4 How It Works

1. Authorized user navigates to `/admin/impersonate`.
2. Searches for the target user by name or email.
3. Optionally enters a reason/note for the session (stored in the audit log).
4. Clicks **View As** — the system stores the target user ID in the current session.
5. The platform immediately behaves as if the target user is logged in.
6. An amber sticky banner at the top of every page shows:
   - Target user name, email, and role
   - Real admin name
   - **Stop Impersonating** button
7. Clicking **Stop Impersonating** (or calling `DELETE /api/admin/impersonate`) clears the session and restores normal access.

### 8.5 Security Guarantees

- `validateSession()` transparently resolves the correct effective user — all existing code routes behave as the target user without modification.
- `validateSessionWithContext()` returns `{ effectiveUser, realUser, isImpersonating }` — used by the impersonation API to verify real-admin permissions.
- Every impersonation start and stop is written to the `ImpersonationLog` table with timestamps, actor, target, and note.
- Super Admins can never be impersonated.

### 8.6 Database Schema Additions

```prisma
model ImpersonationLog {
  id           String    @id @default(cuid())
  actorUserId  String
  actorName    String
  targetUserId String
  targetName   String
  targetEmail  String
  startedAt    DateTime  @default(now())
  endedAt      DateTime?
  note         String?   @db.Text
  actor        User      @relation("ImpersonationActor", fields: [actorUserId], references: [id], onDelete: Cascade)
}
```

Fields added to existing models:

- `User.canImpersonate Boolean @default(false)`
- `Session.impersonatingUserId String?`

### 8.7 Routes

| Route                           | Purpose                                           |
| ------------------------------- | ------------------------------------------------- |
| `/admin/impersonate`            | UI: search users, enter note, start impersonation |
| `POST /api/admin/impersonate`   | Start impersonation session                       |
| `DELETE /api/admin/impersonate` | End impersonation session                         |
| `GET /api/admin/impersonate`    | Return current impersonation state                |

---

## 9. Dynamic Daily Countdown Flyer (PNG Export)

### 9.1 Overview

The system generates a branded promotional graphic showing the number of days remaining until the conference. The graphic matches the LSUIC visual identity and can be exported as a PNG image for sharing on messaging platforms and social media.

### 9.2 Features

- Auto-computed daily countdown from `ConfEvent.startsAt` — no manual update needed.
- Renders as an SVG in-browser or converts to PNG via `sharp` on demand.
- 1080×1080 square canvas (Instagram/WhatsApp-friendly).
- Design elements:
  - Deep navy gradient background with Jinan city backdrop at low opacity
  - Gold ring and decorative dash circle
  - Centered LSUIC logo
  - Giant countdown number in Oswald Bold (white, drop-shadow)
  - "TO GO" label in gold
  - Conference dates and venue below
  - Maroon EKD Digital badge
  - Generated-date watermark
- When `days === 0`, shows "TODAY!" instead of a number.

### 9.3 Access

The flyer endpoint is **public** (no authentication required) so the PNG can be embedded in emails, WhatsApp, and WeChat without login.

Authorized users (conference staff) see a **Countdown Flyer** card on the Conference Hub dashboard with:

- Live preview of today's SVG flyer
- Current days-remaining badge
- One-click **Download PNG** button

### 9.4 API

| Endpoint                                                       | Query Params            | Output                                                               |
| -------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| `GET /api/conf/{confId}/countdown-flyer`                       | —                       | SVG (inline preview)                                                 |
| `GET /api/conf/{confId}/countdown-flyer?format=png`            | `format=png`            | PNG image                                                            |
| `GET /api/conf/{confId}/countdown-flyer?format=png&download=1` | `format=png&download=1` | PNG download attachment with filename `countdown-{N}days-{date}.png` |

Cache-control is `no-store` so the browser always fetches the latest countdown number.

---

## 10. NEC Leadership Vision & Conference Directives

> **Source:** _NEC View and Vision for the conference (official document, April 2026)_  
> This section governs all planning, system features, and event execution. All platform features and decisions must align with these directives.

### 10.1 Official Theme

> **"Jinan 2026: Legacy and Influence"**  
> _Honoring Our Past, Engaging Our Present, and Inspiring Our Future._

This is the 20th Anniversary National Conference — all materials, flyers, booklets, and UI copy must reference this milestone.

### 10.2 NEC Core Priorities (in order)

1. **Better planning than last year** — Early preparation, earlier disbursements, no last-minute crises
2. **Best conference experience** — Every delegate should feel this was the best LSUIC conference they attended
3. **Introduce tech where possible** — This platform (Resource Hub) is the direct response to this directive
4. **Publicity** — Attract more people, grow attendance beyond previous years
5. **Find partners and donors** — Sponsorship acquisition and fund tracking
6. **Award & Dinner Night** — Achievers' Awards, Leadership Awards, Red-Carpet entrance, Turning Over ceremony
7. **Sports & Games** — Football (jersey + field needed), intercity/veterans games, checkers, ludo, lappa, jumping rope, bag race, egg race, running race

### 10.3 Conference Fee

- Proposed delegate fee: **225 RMB**
- Confirmed in NEC document — must be reflected in delegate registration and payment tracking

### 10.4 Conference Logistics Directives

#### Feeding & Catering
- Committee must define the **exact menu** for each meal: Day 1–4, lunch and dinner
- Cooking schedule: Who cooks on which day?
- Food delivery time must be published — delegates should know exactly when meals are served
- Nanjing 2025 reference items (from remaining items doc): soft drinks, juice, mayonnaise, disposable pans/spoons, cooking pots, rice cooker, silver trays, containers, sugar, black oven — **reuse this list for Jinan procurement planning**

#### Meet & Greet (Day 1 Protocol)
- All delegates **arrive by 8:00 AM**
- Outdoor activities run **8:00 AM – 12:00 noon** before room assignments
- First day is not just arrival/rooms — there must be an organized welcome activity with food

#### Room Assignment (Platform Feature Required)
- The system must support a **room assignment app/page**:
  - Which delegate is in which room
  - Room mates
  - Floor and block information
  - Messaging capability between room mates
  - Ability to select room mates
  - Request help feature
  - Photo sharing within room groups
- **This is an explicit NEC directive — must be built**

#### Dinner Night Program
- Red-carpet entrance
- Achievers' Awards
- Leadership Awards
- Turning Over Ceremony
- Full dinner program outline to be published in the system

#### Sports Program
- Football match (field + jerseys required — must be in budget)
- Intercity games
- Veterans games
- Traditional games: Checkers, Ludo, Lappa, Jumping Rope, Bag Race, Egg Race, Running Race
- Need to introduce **new games** — to be determined by sports committee

### 10.5 Member Positions
- Committee list is the authoritative source — see Committee section of the platform
- Position assignment must be documented and visible to NEC

### 10.6 Conference Location
- **Arcadia Spa Golf Hotel, Jinan, Shandong Province**
- Supporting visuals: city view videos and photos already in the system (`/conf/assets/jinan_city/`)

### 10.7 Budget Breakdown Requirement
- Committee must provide a line-by-line breakdown of what is needed **per day**
- NEC requires seeing what food items will be procured each day — not just a total
- This reinforces the need for the Budget module with committee-level granularity

---

## 11. Historical Conference Analysis & Lessons Learned

> **Sources:** Wuhan 2024 Conference Plan, Revised Budget Report, Satisfaction Survey, 18th Annual Booklet (2023), Nanjing 2025 Remaining Items  
> These documents inform what must be improved, repeated, or avoided for Jinan 2026.

### 11.1 Wuhan 2024 — Conference Structure (Reference Baseline)

| Day | Schedule |
|-----|----------|
| Day 1 (July 24) | 2:00 PM Arrival → 6:00 PM Networking Dinner |
| Day 2 (July 25) | Breakfast 6–8 AM → Opening Ceremony 9 AM → Candidate Presentations → Debate → Dinner → Elections |
| Day 3 (July 26) | Independence Day Celebration → Election Results & Swearing In → Lunch → Sports → Cultural Night |
| Day 4 (July 27) | Closing Ceremony → Lunch → Departure 2:00 PM |

**Key sessions:** Opening Ceremony, Panel Discussion, Debate, Elections, Independence Day Celebration, Sports, Cultural Night, Closing Ceremony.

### 11.2 Wuhan 2024 — Budget Lessons

| Category | Approved Budget | Actual Spent | Variance |
|----------|----------------|--------------|----------|
| Accommodation | 16,800 RMB | 3,000 RMB (deposit) | 13,800 to pay on arrival |
| Conference Room | 4,000 RMB | 0 | 4,000 to pay on arrival |
| Food & Drinks | 14,000 RMB | 5,500 RMB | 8,500 remaining |
| Souvenirs | 7,000 RMB | 7,999.83 RMB | **-999.83 over budget** |
| Banners & Decor | 1,500 RMB | 0 | Funds not released |
| Transportation | 800 RMB | 0 | — |
| Miscellaneous | 500 RMB | 0 | — |
| **TOTAL** | **44,600 RMB** | **16,499.83 RMB** | First disbursement only |

**Critical issues from 2024 (must not repeat in 2026):**
- NEC removed event logistics/coordination budget → no funds for banners and hall decoration. **Must be included from the start in Jinan budget.**
- Souvenir category went over budget — procurement process needs better vendor research and bulk-order planning earlier
- Total first-year budget was 49,800 RMB, negotiated down to 43,100 RMB — keep this range in mind for 2026

### 11.3 Wuhan 2024 — Satisfaction Survey Results

| Aspect | Rating |
|--------|--------|
| Overall Experience | Good |
| Venue | Neutral |
| Meals | Very Satisfied |
| Accommodation | Very Satisfied |
| Event Organization | Satisfied |
| Opening Ceremony | Good |
| Panel Discussion | Good |
| Debate | Good |
| Elections | **Average** |
| Independence Day Celebration | Good |
| Sports Events | **Average** |
| Cultural Night | Good |
| Closing Ceremony | Good |
| Communication | Excellent |

**What delegates enjoyed most:** Awards' Night  
**What they enjoyed least:** Conference activities timing; venue was "poorly selected"; presiding officer/CoC handling of sessions needs improvement  
**Key suggestion:** Decentralize communication to City → Province → National level

**Implications for 2026:**
- Election process needs better structure and moderation — consider digital voting via the platform
- Sports needs more organization and variety (NEC has already addressed this with expanded games list)
- CoC/presiding officer training or guidelines should be prepared in advance
- Communication hierarchy should be enforced: use the platform's city/province/national structure

### 11.4 Nanjing 2025 — Remaining Items Reference List

Items that were left unprocured or pending from Nanjing 2025. **Use as procurement checklist for Jinan:**

| Category | Item | Notes |
|----------|------|-------|
| Beverages | Soft Drinks (3 packs = 36 bottles) | 1x Sprite, 2x Coke |
| Beverages | NFC Juice (1 carton = 10 bottles) | Banana & Apple |
| Cooking supplies | Mayonnaise (1 jar) | |
| Cooking supplies | Hand Gloves (1 pack = 100 pcs) | For cooking & serving |
| Serving supplies | Disposable Pans (150 pcs) | For serving/storing food |
| Baking | Baking Powder (3 cups) | For bread |
| Serving | Plastic Disposable Spoons (1,100 pcs) | For eating/serving |
| Equipment | Cooking Pot — Big (1 pc) | In Hangzhou — needs transport |
| Equipment | Rice Cooker (1 pc) | At Kuai-di pickup point |
| Serving | Silver Tray (4 pcs) | |
| Storage | Tub/Container (3 pcs) | Big containers |
| Cooking | Sugar (2 jars) | |
| Baking | Black Oven (2 pcs) | For baking |

### 11.5 Honorees & Awards — 2023/2024 Precedent

The following award categories have been established — replicate and expand for 2026:

| Award | Recipients Type |
|-------|----------------|
| Presidential Award of Service | NEC leadership (President, VP, Sec-Gen, Financial Sec, Deputy Sec-Gen, Chaplain) |
| Senior Coordinator Recognition | CoC (Senior Coordinator, Coordinating Secretary, Senior Adjudicator) |
| City President Appreciation | City Presidents across China |
| Certificate of Appreciation | Provincial Coordinators, Deputy Coordinators |

**2026 must include:** 20th Anniversary Special Recognition category — to mark the milestone.

---

## 12. Platform Features Required by NEC Vision (Action Items)

The following features are explicitly or implicitly required based on the NEC directives and historical analysis. These are in addition to already-built features.

### 12.1 Room Assignment & Roommate System

**Priority: HIGH** — Explicitly requested in NEC document

- Page: `/tools/conf/rooms`
- Each delegate sees their assigned room, floor, block, and roommates
- Admin assigns rooms by selecting a delegate and a room
- Room groups have a messaging thread (or WhatsApp-equivalent link)
- Delegate can request room changes (flagged to admin)
- Delegates can share photos within room group

### 12.2 Conference Program / Agenda Page

**Priority: HIGH**

- Page: `/tools/conf/agenda` or within the Meetings section
- Day-by-day schedule visible to all delegates
- Includes meal times, event times, room/location for each session
- Printable/PDF-exportable version
- Must include: Meet & Greet (Day 1, 8 AM–noon), Dinner Night, Sports, Cultural Night, Closing

### 12.3 Delegate Check-In System

**Priority: HIGH** — Supports 8:00 AM arrival protocol

- Delegates are checked in on arrival (Day 1)
- System records arrival time and room assignment on check-in
- Admin sees real-time arrival list

### 12.4 Catering Menu & Cooking Schedule

**Priority: MEDIUM**

- Page or sub-section under `/tools/conf/meetings` or a dedicated `/tools/conf/catering`
- Committees can enter: meal type (breakfast/lunch/dinner), date, menu items, responsible cook(s)
- Delegates can see the meal plan for each day
- Cooking assignments are tracked

### 12.5 Sports & Games Scheduling

**Priority: MEDIUM**

- Page: `/tools/conf/sports`
- List of events (football, ludo, lappa, bag race, egg race, etc.)
- Team/participant assignments
- Schedule with time and location
- Results entry

### 12.6 Awards & Dinner Night Management

**Priority: MEDIUM**

- Page: `/tools/conf/awards`
- Admin nominates and manages award recipients
- Award categories: Presidential Award, Coordinator Recognition, City President Appreciation, Certificates, 20th Anniversary Special
- Dinner Night program outline (printable)
- Red-carpet list

### 12.7 Publicity & Flyer System (Already Built — Extend)

**Priority: ONGOING**

- Flyer Studio at `/tools/conf/flyers` — ✅ done
- Countdown flyer — ✅ done
- Add: Registration flyer template
- Add: Dinner Night invitation flyer
- Add: Sports Day flyer

### 12.8 Delegate Registration & Fee Tracking

**Priority: HIGH**

- Conference fee: **225 RMB per delegate** (NEC directive)
- Delegate registration status: Registered / Paid / Confirmed / Arrived
- Fee payment tracking linked to `ConfPayment` (INCOME type)
- Admin sees total collected vs expected

### 12.9 Digital Voting / Election System

**Priority: MEDIUM** — Based on satisfaction survey (elections rated "Average")

- Page: `/tools/conf/elections`
- Candidates register/are added by admin
- Voting open during conference Day 2 window
- Results tallied and displayed after polls close
- Audit log of votes (anonymized but verifiable count)

### 12.10 Sponsorship & Donor Registry

**Priority: MEDIUM** — Explicitly requested by NEC

- Track potential sponsors, contacted status, amount committed, amount received
- Link sponsor payments to `ConfPayment` (INCOME, source = "Sponsorship")
- Generate sponsorship acknowledgement letter/certificate from the platform

---

## 13. Reference Documents Index

> All source documents have been converted to PNG images and OCR'd for searchability.
> Location: `scripts/conference-2026/images/others/` and `scripts/conference-2026/ocr/others/`

| Document | Key Contents | Status |
|----------|-------------|--------|
| NEC View and Vision for the conference(1).pdf | Official NEC directives, theme, fee, logistics requirements | ✅ OCR'd |
| LSUIC Wuhan 2024 Conference concept.pdf | Conference structure, day-by-day agenda, objectives | ✅ OCR'd |
| Revised Conference Budget & Spending Report.pdf | Wuhan 2024 budget breakdown, lessons learned | ✅ OCR'd |
| Nanjing 2025 Conference Remaining Items.pdf | Procurement checklist, cooking committee items | ✅ OCR'd |
| Wuhan Convergence 2024 Satisfaction Survey.pdf | Delegate feedback, ratings, improvement suggestions | ✅ OCR'd |
| Updated Honorees of The Year 2023.pdf | Award categories, precedent for 2026 awards night | ✅ OCR'd |
| 20240715_NEC Election Budget_LSUIC_IEC.pdf | NEC election budget breakdown | ✅ OCR'd |
| 18th Annual General Conference Booklet.pdf | Full 18th conference booklet (15 pages) | ✅ OCR'd |

_Document maintained in: `scripts/conference-2026/SYSTEM_REQUIREMENTS.md`_
