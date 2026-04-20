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
- Renders as an SVG in-browser or converts to PNG via `@resvg/resvg-js` on demand.
- 1080×1080 square canvas (Instagram/WhatsApp-friendly).
- Design elements:
  - Deep navy gradient background with Jinan city backdrop at low opacity (0.15)
  - Gold ring and decorative dash circle centered on canvas
  - **LSUIC logo at 192px diameter** (fully-opaque white circle base, gold border, gold glow filter) — crisp at all export sizes
  - **"✦ 20TH ANNIVERSARY ✦"** label below logo
  - Conference name in gold Oswald below anniversary label
  - **Theme line** "Jinan 2026: Legacy and Influence" in italic below conference name
  - Giant countdown number in Oswald Bold (white, drop-shadow)
  - "TO GO" label in gold
  - Conference dates and venue below the number
  - Maroon "LSUIC CONFERENCE 2026" badge
  - **Conference leadership row** — Conference Chair, Co-Chair, Secretary names pulled live from DB (fallback to defaults if DB empty)
  - **No external branding** — generated-date watermark only (ekddigital.com removed)
- When `days === 0`, shows "TODAY!" instead of a number.

### 9.2a Leadership Data Source

The flyer queries `ConfMember` with `role IN (CHAIR, VICE_CHAIR, SECRETARY)` and `isActive = true` for the given conference. If no matching active members exist, the leadership row is omitted entirely — no hardcoded fallback names are shown.

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

### 10.0 Core Values

> **Peace · Togetherness · Love · Support · Willingness · Passion · Service**

These are the declared core values of LSUIC 2026. All conference communications, committee behavior expectations, and platform copy should reflect these values.

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

| Day             | Schedule                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Day 1 (July 24) | 2:00 PM Arrival → 6:00 PM Networking Dinner                                                      |
| Day 2 (July 25) | Breakfast 6–8 AM → Opening Ceremony 9 AM → Candidate Presentations → Debate → Dinner → Elections |
| Day 3 (July 26) | Independence Day Celebration → Election Results & Swearing In → Lunch → Sports → Cultural Night  |
| Day 4 (July 27) | Closing Ceremony → Lunch → Departure 2:00 PM                                                     |

**Key sessions:** Opening Ceremony, Panel Discussion, Debate, Elections, Independence Day Celebration, Sports, Cultural Night, Closing Ceremony.

### 11.2 Wuhan 2024 — Budget Lessons

| Category        | Approved Budget | Actual Spent        | Variance                 |
| --------------- | --------------- | ------------------- | ------------------------ |
| Accommodation   | 16,800 RMB      | 3,000 RMB (deposit) | 13,800 to pay on arrival |
| Conference Room | 4,000 RMB       | 0                   | 4,000 to pay on arrival  |
| Food & Drinks   | 14,000 RMB      | 5,500 RMB           | 8,500 remaining          |
| Souvenirs       | 7,000 RMB       | 7,999.83 RMB        | **-999.83 over budget**  |
| Banners & Decor | 1,500 RMB       | 0                   | Funds not released       |
| Transportation  | 800 RMB         | 0                   | —                        |
| Miscellaneous   | 500 RMB         | 0                   | —                        |
| **TOTAL**       | **44,600 RMB**  | **16,499.83 RMB**   | First disbursement only  |

**Critical issues from 2024 (must not repeat in 2026):**

- NEC removed event logistics/coordination budget → no funds for banners and hall decoration. **Must be included from the start in Jinan budget.**
- Souvenir category went over budget — procurement process needs better vendor research and bulk-order planning earlier
- Total first-year budget was 49,800 RMB, negotiated down to 43,100 RMB — keep this range in mind for 2026

### 11.3 Wuhan 2024 — Satisfaction Survey Results

| Aspect                       | Rating         |
| ---------------------------- | -------------- |
| Overall Experience           | Good           |
| Venue                        | Neutral        |
| Meals                        | Very Satisfied |
| Accommodation                | Very Satisfied |
| Event Organization           | Satisfied      |
| Opening Ceremony             | Good           |
| Panel Discussion             | Good           |
| Debate                       | Good           |
| Elections                    | **Average**    |
| Independence Day Celebration | Good           |
| Sports Events                | **Average**    |
| Cultural Night               | Good           |
| Closing Ceremony             | Good           |
| Communication                | Excellent      |

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

| Category         | Item                                  | Notes                         |
| ---------------- | ------------------------------------- | ----------------------------- |
| Beverages        | Soft Drinks (3 packs = 36 bottles)    | 1x Sprite, 2x Coke            |
| Beverages        | NFC Juice (1 carton = 10 bottles)     | Banana & Apple                |
| Cooking supplies | Mayonnaise (1 jar)                    |                               |
| Cooking supplies | Hand Gloves (1 pack = 100 pcs)        | For cooking & serving         |
| Serving supplies | Disposable Pans (150 pcs)             | For serving/storing food      |
| Baking           | Baking Powder (3 cups)                | For bread                     |
| Serving          | Plastic Disposable Spoons (1,100 pcs) | For eating/serving            |
| Equipment        | Cooking Pot — Big (1 pc)              | In Hangzhou — needs transport |
| Equipment        | Rice Cooker (1 pc)                    | At Kuai-di pickup point       |
| Serving          | Silver Tray (4 pcs)                   |                               |
| Storage          | Tub/Container (3 pcs)                 | Big containers                |
| Cooking          | Sugar (2 jars)                        |                               |
| Baking           | Black Oven (2 pcs)                    | For baking                    |

### 11.5 Honorees & Awards — 2023/2024 Precedent

The following award categories have been established — replicate and expand for 2026:

| Award                          | Recipients Type                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------- |
| Presidential Award of Service  | NEC leadership (President, VP, Sec-Gen, Financial Sec, Deputy Sec-Gen, Chaplain) |
| Senior Coordinator Recognition | CoC (Senior Coordinator, Coordinating Secretary, Senior Adjudicator)             |
| City President Appreciation    | City Presidents across China                                                     |
| Certificate of Appreciation    | Provincial Coordinators, Deputy Coordinators                                     |

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

| Document                                        | Key Contents                                                | Status   |
| ----------------------------------------------- | ----------------------------------------------------------- | -------- |
| NEC View and Vision for the conference(1).pdf   | Official NEC directives, theme, fee, logistics requirements | ✅ OCR'd |
| LSUIC Wuhan 2024 Conference concept.pdf         | Conference structure, day-by-day agenda, objectives         | ✅ OCR'd |
| Revised Conference Budget & Spending Report.pdf | Wuhan 2024 budget breakdown, lessons learned                | ✅ OCR'd |
| Nanjing 2025 Conference Remaining Items.pdf     | Procurement checklist, cooking committee items              | ✅ OCR'd |
| Wuhan Convergence 2024 Satisfaction Survey.pdf  | Delegate feedback, ratings, improvement suggestions         | ✅ OCR'd |
| Updated Honorees of The Year 2023.pdf           | Award categories, precedent for 2026 awards night           | ✅ OCR'd |
| 20240715_NEC Election Budget_LSUIC_IEC.pdf      | NEC election budget breakdown                               | ✅ OCR'd |
| 18th Annual General Conference Booklet.pdf      | Full 18th conference booklet (15 pages)                     | ✅ OCR'd |

_Document maintained in: `scripts/conference-2026/SYSTEM_REQUIREMENTS.md`_

---

## 14. Conference Booklet — Automatic Generation System

> **Source:** Leadership directive — "Dynamic Automatic Generation of Conference Booklets" (April 2026)  
> **Priority:** HIGH — Core deliverable for the 2026 20th Anniversary Conference

### 14.1 Overview

The conference booklet is the official printed and digital program guide distributed to all delegates. For the 2026 20th Anniversary Conference, the booklet is generated **automatically** from live system data — eliminating manual typesetting.

**Design reference:** 18th Annual General Conference Booklet (Wuhan 2024) — `scripts/conference-2026/ocr/others/18th_Annual_General_Conference_Booklet-*.txt` and matching images in `images/others/`.

The booklet system:

- Pulls all leadership, delegate, and committee data from the live database
- Pre-stores fixed leadership (Liberian President, Chinese President, Ambassador) independently of registration
- Updates dynamically as registrations and role assignments are completed
- Exports a print-ready PDF (A4) on demand
- Accessible to Super Admin and Conference Chair

---

### 14.2 Booklet Structure (Based on 18th Conference Reference)

Each section is independently toggleable and reorderable by the admin.

| #   | Section Type                          | Data Source                                    | Notes                                |
| --- | ------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| 1   | Cover Page                            | `ConfEvent` (name, theme, logo, year)          | Auto-generated                       |
| 2   | President of Liberia                  | `ConfLeaderProfile` (pre-stored)               | Joseph Nyuma Boakai Sr.              |
| 3   | President of China                    | `ConfLeaderProfile` (pre-stored)               | Xi Jinping                           |
| 4   | Liberian Ambassador to China          | `ConfLeaderProfile` (pre-stored)               | From stored data                     |
| 5   | NEC Leadership                        | `ConfMember` (NEC exec roles)                  | Auto from member assignments         |
| 6   | President's Address                   | `ConfMember.bookletBio` (National President)   | Rich text, manually entered          |
| 7   | Guest Speaker Biography               | `ConfBookletSection.bodyText`                  | Free-text entry                      |
| 8   | Council of Coordinators — Leadership  | `ConfMember` (committeeScope = "CoC")          | Auto from assignments                |
| 9   | Council of Coordinators — Members     | `ConfMember` (committeeScope = "CoC Province") | With province/role labels            |
| 10  | City Presidents                       | `ConfMember` (committeeScope = "City")         | With city labels                     |
| 11  | Judicial Board                        | `ConfMember` (committeeScope = "Judicial")     | With position labels                 |
| 12  | Planning & Program Committee (PPC)    | `ConfMember` (committeeScope = "PPC")          | With roles                           |
| 13  | Academic Excellence Committee (AEC)   | `ConfMember` (committeeScope = "AEC")          | With roles                           |
| 14  | Ways, Means & Finance Committee (WMF) | `ConfMember` (committeeScope = "WMF")          | With roles                           |
| 15  | Conference Schedule / Program         | `ConfMeeting` + `ConfTimeline`                 | Auto from agenda data                |
| 16  | Delegate Roster                       | `ConfDelegate` (status = CONFIRMED)            | Auto-updated as registrations arrive |
| 17  | Sponsors & Partners                   | `ConfBookletSection.bodyText`                  | Optional                             |
| 18  | Back Cover                            | `ConfEvent` + logo                             | Auto-generated                       |

---

### 14.3 New Database Models

#### `ConfLeaderProfile` — Pre-stored Fixed Leadership

```prisma
model ConfLeaderProfile {
  id            String    @id @default(cuid())
  confId        String?
  role          String    // "President of Liberia", "President of China", "Ambassador"
  name          String
  title         String    // Full official title
  bio           String?   @db.Text
  photoPath     String?
  photoFileName String?
  country       String?
  sortOrder     Int       @default(0)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  conf ConfEvent? @relation(fields: [confId], references: [id], onDelete: Cascade)
}
```

#### `ConfBooklet` — One Per Conference

```prisma
enum BookletStatus { DRAFT READY PUBLISHED }

model ConfBooklet {
  id              String        @id @default(cuid())
  confId          String        @unique
  title           String        @default("Conference Booklet")
  subtitle        String?
  theme           String?
  coverImagePath  String?
  status          BookletStatus @default(DRAFT)
  lastGeneratedAt DateTime?
  generatedBy     String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  conf     ConfEvent           @relation(fields: [confId], references: [id], onDelete: Cascade)
  sections ConfBookletSection[]
}
```

#### `ConfBookletSection` — Configurable Sections

```prisma
model ConfBookletSection {
  id             String   @id @default(cuid())
  bookletId      String
  type           String   // "COVER"|"LEADER"|"NEC"|"PRESIDENT_ADDRESS"|"GUEST_BIO"
                          // |"COC"|"COC_MEMBERS"|"CITY_PRESIDENTS"|"JUDICIAL"
                          // |"COMMITTEE"|"SCHEDULE"|"DELEGATES"|"SPONSORS"|"BACK_COVER"
  title          String
  subtitle       String?
  bodyText       String?  @db.Text
  isEnabled      Boolean  @default(true)
  sortOrder      Int      @default(0)
  committeeScope String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  booklet ConfBooklet @relation(fields: [bookletId], references: [id], onDelete: Cascade)
  @@index([bookletId])
}
```

#### Field Addition to `ConfMember`

```prisma
bookletBio String? @db.Text  // President's address / biography for the booklet
```

#### `ConfEvent` additions

```prisma
booklet        ConfBooklet?
leaderProfiles ConfLeaderProfile[]
```

---

### 14.4 Section Query Logic (Auto Data Binding)

| Section                  | Query                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------- |
| NEC Leadership           | `ConfMember WHERE role IN (CHAIR, VICE_CHAIR, SECRETARY, TREASURER, ...) ORDER BY role` |
| President's Address      | `ConfMember WHERE role = CHAIR` → `bookletBio`                                          |
| CoC Leadership           | `ConfMember WHERE committeeScope = 'CoC'`                                               |
| CoC Members              | `ConfMember WHERE committeeScope = 'CoC Province' ORDER BY city`                        |
| City Presidents          | `ConfMember WHERE committeeScope = 'City' ORDER BY city`                                |
| Judicial Board           | `ConfMember WHERE committeeScope = 'Judicial'`                                          |
| Committees (PPC/AEC/WMF) | `ConfMember WHERE committeeScope = {section.committeeScope}`                            |
| Delegate Roster          | `ConfDelegate WHERE status = CONFIRMED ORDER BY name`                                   |
| Schedule                 | `ConfMeeting ORDER BY scheduled`                                                        |

---

### 14.5 Manual Assignment → Auto Placement Flow

1. Admin opens `/tools/conf/booklet` → Section Manager
2. Clicks a section (e.g., "City Presidents") → **Assign Member**
3. Searches existing `ConfMember` records → selects person
4. System sets `committeeScope = "City"` on that member and saves
5. Booklet preview immediately shows that person in the correct section with their photo

---

### 14.6 Photo Handling

| Person Type                   | Source                          | Upload Method                    |
| ----------------------------- | ------------------------------- | -------------------------------- |
| Heads of State / Ambassador   | `ConfLeaderProfile.photoPath`   | Admin via leader profile manager |
| NEC / CoC / Committee Members | `ConfMember.photoPath`          | Admin on member record           |
| Delegates                     | `ConfDelegate.bookletPhotoPath` | Delegate during registration     |

Missing photos → placeholder silhouette. Section always renders.

---

### 14.7 PDF Generation

**Browser print:** `/tools/conf/booklet/preview` has `@media print` CSS — print → Save as PDF.

**Server-side download:** `GET /api/conf/[confId]/booklet?format=pdf`

- Uses `puppeteer` for headless rendering
- A4 portrait output
- Returns `Content-Disposition: attachment`

---

### 14.8 Real-Time Delegate Sync

- Delegate registers → uploads photo → status = `CONFIRMED`
- Immediately appears in the booklet Delegate Roster
- Admin sees readiness summary: **"X delegates confirmed · Y leadership slots filled · Booklet status: DRAFT/READY"**
- Click **Regenerate PDF** for updated copy

---

### 14.9 UI Routes

| Route                                       | Purpose                                       | Access             |
| ------------------------------------------- | --------------------------------------------- | ------------------ |
| `/tools/conf/booklet`                       | Booklet overview — section status + readiness | Chair, Super Admin |
| `/tools/conf/booklet/preview`               | Full live print-styled booklet preview        | Chair, Super Admin |
| `/tools/conf/booklet/leaders`               | Manage pre-stored fixed leadership profiles   | Super Admin        |
| `/tools/conf/booklet/sections`              | Reorder, toggle, edit section body text       | Chair, Super Admin |
| `GET /api/conf/[confId]/booklet`            | Full booklet JSON                             | Authenticated      |
| `PATCH /api/conf/[confId]/booklet`          | Update config                                 | Chair              |
| `POST /api/conf/[confId]/booklet/leaders`   | Add/update leader profile                     | Super Admin        |
| `PATCH /api/conf/[confId]/booklet/sections` | Bulk section update                           | Chair              |
| `GET /api/conf/[confId]/booklet?format=pdf` | Download PDF                                  | Chair              |

---

### 14.10 Implementation Checklist

| Component                                                              | Status          |
| ---------------------------------------------------------------------- | --------------- |
| `ConfLeaderProfile` model                                              | ✅ Done         |
| `ConfBooklet` + `ConfBookletSection` models                            | ✅ Done         |
| `BookletStatus` enum                                                   | ✅ Done         |
| `ConfMember.bookletBio` field                                          | ✅ Done         |
| `ConfEvent` → `booklet` + `leaderProfiles` relations                   | ✅ Done         |
| DB push (schema synchronized)                                          | ✅ Done         |
| `GET /api/conf/[confId]/booklet/config` (auto-init booklet + sections) | ✅ Done         |
| `PATCH /api/conf/[confId]/booklet/config` (update title/theme/status)  | ✅ Done         |
| `GET/POST /api/conf/[confId]/booklet/leaders`                          | ✅ Done         |
| `PATCH/DELETE /api/conf/[confId]/booklet/leaders/[leaderId]`           | ✅ Done         |
| `GET/PATCH /api/conf/[confId]/booklet/sections` (bulk reorder/toggle)  | ✅ Done         |
| `PATCH/DELETE /api/conf/[confId]/booklet/sections/[sectionId]`         | ✅ Done         |
| `GET /api/conf/[confId]/booklet/data` (full preview payload)           | ✅ Done         |
| `BookletManagerShell` — Overview, Leaders, Sections, Config tabs       | ✅ Done         |
| Booklet page routing (`/tools/conf/booklet?view=manager`)              | ✅ Done         |
| `ConfDelegate.conferencePosition` field                                | 🔄 To implement |
| Position dropdown in delegate registration form                        | 🔄 To implement |
| Position → booklet section auto-mapping                                | 🔄 To implement |
| Print-styled booklet preview page                                      | 🔄 To implement |
| PDF download via browser print                                         | 🔄 To implement |

---

## 15. Static Assets — Leadership Photos & Official Seals

> **Added:** April 2026  
> **Location:** `public/conf/`

All assets in `public/conf/` are served statically and referenced directly in booklet templates, flyers, and UI components.

### 15.1 Current Asset Inventory

| File                                       | Subject                                             | Usage                                |
| ------------------------------------------ | --------------------------------------------------- | ------------------------------------ |
| `public/conf/lsuic_logo.png`               | LSUIC Official Logo (white background)              | Booklet cover, letterhead, flyers    |
| `public/conf/lsuic_logo_backup.png`        | LSUIC Logo backup copy                              | Fallback                             |
| `public/conf/president_boakai_Liberia.png` | President of Liberia — H.E. Joseph Nyuma Boakai Sr. | Booklet Page 2 (Leader section)      |
| `public/conf/president_xi_China.png`       | President of China — Xi Jinping                     | Booklet Page 3 (Leader section)      |
| `public/conf/liberia-seal.svg`             | Official Seal of the Republic of Liberia            | Booklet decorative, formal documents |

### 15.2 Usage in Booklet System

The leader photos map directly to `ConfLeaderProfile` records:

| Profile `role`                   | Photo Asset                       |
| -------------------------------- | --------------------------------- |
| `"President of Liberia"`         | `president_boakai_Liberia.png`    |
| `"President of China"`           | `president_xi_China.png`          |
| `"Liberian Ambassador to China"` | Upload via leader profile manager |

**Implementation note:** When a `ConfLeaderProfile` is created for the Liberian/Chinese presidents, the `photoPath` should be pre-set to `/conf/president_boakai_Liberia.png` and `/conf/president_xi_China.png` respectively. These are static public assets — no upload needed.

The `liberia-seal.svg` can be used as a watermark or decorative element on the booklet cover and the President of Liberia page.

### 15.3 Asset Seeding Plan

The three permanent leader profiles (Liberian President, Chinese President, Ambassador) should be seeded via the admin panel using the **Leader Profile Manager** at `/tools/conf/booklet?view=manager`. For the two presidents, the photoPath values are:

```
/conf/president_boakai_Liberia.png   ← already in public/
/conf/president_xi_China.png          ← already in public/
```

No upload required for these — just reference the path in the `ConfLeaderProfile.photoPath` field.

---

## 16. Delegate Registration — Conference Position Field

> **Requirement origin:** Leadership directive, April 19 2026  
> **Purpose:** Allow delegates to declare their LSUIC/leadership position during registration so the system can auto-route them to the correct booklet section and alert admins.

### 16.1 Problem Statement

Currently, delegate registration captures personal/logistical information but has no field for **organizational position**. As a result:

- City Presidents, NEC officers, and committee chairs registering as delegates are indistinguishable from regular delegates
- Admin must manually cross-reference the member/leadership list to find who goes where in the booklet
- Leadership assignment to booklet sections is entirely manual

### 16.2 Solution: `conferencePosition` Field

Add a `conferencePosition String?` field to `ConfDelegate`. During registration, a delegate selects their position from a dropdown. The system uses this to:

1. **Flag** them in the delegates list (admin sees role tag immediately)
2. **Auto-suggest** their placement in the correct booklet section
3. **Assist admins** in quickly assigning them as `ConfMember` in the right `committeeScope`

### 16.3 Position Options (Dropdown Values)

These are the canonical position values stored in `conferencePosition`:

| Value                        | Display Label                          | Booklet Section Mapping                         |
| ---------------------------- | -------------------------------------- | ----------------------------------------------- |
| `""` (empty)                 | None — Regular Delegate                | Delegate Roster only                            |
| `"National President"`       | National President                     | NEC Leadership → `ConfMember.role = CHAIR`      |
| `"National Vice President"`  | National Vice President                | NEC Leadership → `ConfMember.role = VICE_CHAIR` |
| `"Secretary General"`        | Secretary General                      | NEC Leadership → `ConfMember.role = SECRETARY`  |
| `"Deputy Secretary General"` | Deputy Secretary General               | NEC Leadership                                  |
| `"Financial Secretary"`      | Financial Secretary                    | NEC Leadership → `ConfMember.role = TREASURER`  |
| `"National Treasurer"`       | National Treasurer                     | NEC Leadership                                  |
| `"Chaplain General"`         | Chaplain General                       | NEC Leadership                                  |
| `"Senior Coordinator"`       | Senior Coordinator                     | CoC Leadership → `committeeScope = "CoC"`       |
| `"Province Coordinator"`     | Province Coordinator                   | CoC Members → `committeeScope = "CoC Province"` |
| `"City President"`           | City President                         | City Presidents → `committeeScope = "City"`     |
| `"Senior Adjudicator"`       | Senior Adjudicator                     | Judicial Board → `committeeScope = "Judicial"`  |
| `"Adjudicator"`              | Adjudicator                            | Judicial Board → `committeeScope = "Judicial"`  |
| `"PPC Chair"`                | Planning & Program Committee Chair     | PPC → `committeeScope = "PPC"`                  |
| `"PPC Member"`               | Planning & Program Committee Member    | PPC                                             |
| `"AEC Chair"`                | Academic Excellence Committee Chair    | AEC → `committeeScope = "AEC"`                  |
| `"AEC Member"`               | Academic Excellence Committee Member   | AEC                                             |
| `"WMF Chair"`                | Ways, Means & Finance Committee Chair  | WMF → `committeeScope = "WMF"`                  |
| `"WMF Member"`               | Ways, Means & Finance Committee Member | WMF                                             |
| `"Guest Speaker"`            | Guest Speaker / Special Invitee        | Guest Speaker Biography section                 |
| `"Other"`                    | Other (specify in comments)            | Admin review                                    |

### 16.4 Schema Change

```prisma
// In model ConfDelegate — add:
conferencePosition String?  // Declared LSUIC role/position (see position list)
```

### 16.5 Registration Form Change

- **Field label:** "14. Do you hold any official LSUIC position? (optional)"
- **Type:** `<select>` dropdown — defaults to empty (none)
- **Placement:** After study year, before accommodation question
- **Note shown to user:** _"If you hold a position, selecting it helps us place you in the correct section of the conference booklet."_

### 16.6 Admin Dashboard — Flagged Delegates

Delegates with a non-empty `conferencePosition` should be highlighted in the admin delegates list with a badge showing their position. An admin should be able to click **"Add to Booklet"** which creates a `ConfMember` record with the appropriate `committeeScope` derived from the position mapping table above.

### 16.7 Implementation Checklist

| Task                                                        | Status          |
| ----------------------------------------------------------- | --------------- |
| `ConfDelegate.conferencePosition String?` schema field      | 🔄 To implement |
| DB push                                                     | 🔄 To implement |
| `DelegateRegistrationPayload` type update                   | 🔄 To implement |
| Position dropdown in `DelegateRegistrationForm`             | 🔄 To implement |
| API `POST /delegates` — accept + store `conferencePosition` | 🔄 To implement |
| Delegates admin list — position badge for flagged delegates | 🔄 To implement |
| "Add to Booklet" action in admin delegates view             | 🔄 To implement |

---

## 17. Full Implementation Roadmap — Booklet System

> **Target:** Ready before 2026 LSUIC 20th Anniversary National Conference (Jinan)  
> **Current status:** Phase 1 complete, Phase 2 in progress

### Phase 1 — Foundation ✅ Complete

| #   | Task                                                                                            | Status  |
| --- | ----------------------------------------------------------------------------------------------- | ------- |
| 1.1 | Design booklet structure from 18th conference OCR reference                                     | ✅ Done |
| 1.2 | Document all requirements in SYSTEM_REQUIREMENTS.md                                             | ✅ Done |
| 1.3 | Add `ConfBooklet`, `ConfBookletSection`, `ConfLeaderProfile` schema models                      | ✅ Done |
| 1.4 | Add `ConfMember.bookletBio`, `ConfEvent.booklet`, `ConfEvent.leaderProfiles`                    | ✅ Done |
| 1.5 | Run `prisma db push` — schema in sync                                                           | ✅ Done |
| 1.6 | Build all API routes (config, leaders, sections, data)                                          | ✅ Done |
| 1.7 | Build `BookletManagerShell` (Overview / Leaders / Sections / Config tabs)                       | ✅ Done |
| 1.8 | Add static assets: `president_boakai_Liberia.png`, `president_xi_China.png`, `liberia-seal.svg` | ✅ Done |

### Phase 2 — Registration Position Field 🔄 In Progress

| #   | Task                                                      | Status  |
| --- | --------------------------------------------------------- | ------- |
| 2.1 | Add `ConfDelegate.conferencePosition` to schema + DB push | 🔄 Next |
| 2.2 | Add position dropdown to `DelegateRegistrationForm`       | 🔄 Next |
| 2.3 | Update delegate POST API to accept `conferencePosition`   | 🔄 Next |
| 2.4 | Show position badge in admin delegates list               | 🔄 Next |

### Phase 3 — Leader Profiles Seeding 📋 Planned

| #   | Task                                                                               | Status     |
| --- | ---------------------------------------------------------------------------------- | ---------- |
| 3.1 | Seed Liberian President profile (`photoPath = /conf/president_boakai_Liberia.png`) | 📋 Planned |
| 3.2 | Seed Chinese President profile (`photoPath = /conf/president_xi_China.png`)        | 📋 Planned |
| 3.3 | Add Ambassador profile + upload photo via leader manager                           | 📋 Planned |
| 3.4 | Verify all 3 leaders appear in booklet overview                                    | 📋 Planned |

### Phase 4 — Booklet Preview Page 📋 Planned

| #   | Task                                                         | Status     |
| --- | ------------------------------------------------------------ | ---------- |
| 4.1 | Create `/tools/conf/booklet/preview` print-styled page       | 📋 Planned |
| 4.2 | Cover page — LSUIC logo + seal, conference name, year, theme | 📋 Planned |
| 4.3 | Leader pages (full-page layout per leader, photo + title)    | 📋 Planned |
| 4.4 | NEC Leadership grid (photo grid, roles)                      | 📋 Planned |
| 4.5 | President's Address (text block with signature)              | 📋 Planned |
| 4.6 | Committee pages (photo + name + role grid per committee)     | 📋 Planned |
| 4.7 | Delegate Roster (confirmed delegates list)                   | 📋 Planned |
| 4.8 | Print CSS (`@media print`) — A4 layout, page breaks          | 📋 Planned |
| 4.9 | Browser print-to-PDF button                                  | 📋 Planned |

### Phase 5 — Admin Quality-of-Life 📋 Planned

| #   | Task                                                               | Status     |
| --- | ------------------------------------------------------------------ | ---------- |
| 5.1 | Delegates list — position badge for flagged delegates              | 📋 Planned |
| 5.2 | "Add to Booklet" quick-action on delegates with declared positions | 📋 Planned |
| 5.3 | Booklet readiness checklist on conf dashboard                      | 📋 Planned |
| 5.4 | Missing photo warnings per section                                 | 📋 Planned |

### Phase 6 — Final Polish 📋 Planned

| #   | Task                                                             | Status     |
| --- | ---------------------------------------------------------------- | ---------- |
| 6.1 | Liberia seal as decorative element on cover + presidential pages | 📋 Planned |
| 6.2 | LSUIC branding (gold/maroon colors) throughout preview           | 📋 Planned |
| 6.3 | Test full booklet with real data                                 | 📋 Planned |
| 6.4 | Final print quality review                                       | 📋 Planned |

---

## Section 18 — Document & Asset Inventory (OCR Archive)

All images from `scripts/conference-2026/images/` have been OCR'd and stored in `scripts/conference-2026/ocr/`. Total: **189 image files** across 5 subdirectories. This section documents key files and their findings.

### 18.1 Committee Members Documents

**Path:** `scripts/conference-2026/images/committee-members/`

#### LSUIC Constitution (2020 Amendment)

- **Files:** `LSUIC_Amended_Constitution_of_2020-01.png` through `-46.png` (46 pages)
- **Summary:** Full constitution of LSUIC. Covers sovereignty, membership, NEC structure (National President, Vice President, Secretary General, Deputy Secretary General, Financial Secretary, Treasurer, Chaplain General), City structure, Committees (CoC, AEC, PPC, WMF, Judicial Board), finances, conference procedure.
- **Key reference:** Article 25 governs delegate contributions for conferences.

#### Mr. Enoch Kwateh Dongbo — Appointment Letter

- **Files:** `Mr._Enoch_Appointment-1.png` through `-4.png` (4 pages)
- **Issued by:** Olano Teah Bloh, National President, LSUIC 2025–2026
- **Key finding:** Enoch is appointed as **General Conference Chairman** — he is NOT a member of the NEC (National Executive Committee). He was commissioned by the National President to plan and execute the 19th LSUIC Annual General Conference.
- **Conference Committee members appointed** (from appointment letter):

| Name                     | Position                                | City      | Province |
| ------------------------ | --------------------------------------- | --------- | -------- |
| Enoch Kwateh Dongbo      | **General Chairman** (Conference Chair) | Jinan     | Shandong |
| Alfreda Ruth Togbah      | General Co-Chair                        | Suzhou    | Jiangsu  |
| Harris M Bowulo          | General Secretary                       | Beijing   | Beijing  |
| Abdul Corneh             | PRO & Media                             | Zhengzhou | Henan    |
| Kukor Brooks             | Cooking Team Chair                      | Jinan     | Shandong |
| Jefferson T Banquando    | Chair on Sports                         | Suzhou    | Jiangsu  |
| Lisa Y SET               | Member, Cooking Team                    | Qingdao   | Shandong |
| Blessing Hawa Washington | Member, Cooking Team                    | Nantong   | Jiangsu  |
| Robert D Molley          | Chair on Logistics                      | Qufu      | Shandong |
| Priscilla Bamu Dweh      | Member, Cooking Team                    | Suzhou    | Jiangsu  |
| Willimena Y. Munyenneh   | Member, Cooking Team                    | Suzhou    | Jiangsu  |

- **Chairman responsibilities per the letter:** Budget Management, Delegates Management, Program Execution, Reporting, City/District coordination
- **CC on the letter:** Council of Coordinators, NEC, National Secretariat, Judicial Board

> ⚠️ **Important:** In the system, Enoch's `ConfMember.role = "CHAIR"` means **Conference Chair** (not NEC Chair). The NEC is a separate body stored in `ConfLeaderProfile`. The booklet display has been corrected to label him "Conference Chair" and the committee section renamed from "NEC Leadership" → "Conference Committee".

#### NEC Members (National Executive Committee)

Stored as `ConfLeaderProfile` entries (global profiles). From the letterhead on all official documents:

| Name                   | Role                                     | City    | Province |
| ---------------------- | ---------------------------------------- | ------- | -------- |
| Olano Teah Bloh        | National President                       | Nanjing | Jiangsu  |
| Ruphine M. Harmon      | National Vice President                  | Jinan   | Shandong |
| C. Nathaniel Willie II | National Secretary General               | Chengdu | Sichuan  |
| Jenkins G. Wilson      | Acting National Deputy Secretary General | Xuzhou  | Jiangsu  |
| Noah D. Mason          | National Financial Secretary General     | Ningbo  | Zhejiang |
| Jenneh Bonah           | National Treasurer                       | Jinan   | Shandong |
| Mitchell Vampelt       | National Chaplain General                | Suzhou  | Jiangsu  |

---

### 18.2 Meeting Documents

**Path:** `scripts/conference-2026/images/meetings/`

#### First Conference Committee Meeting Agenda

- **Files:** `conference_agenda-1.png`, `conference_agenda-2.png`
- **Date:** April 10, 2026
- **Presiding:** Committee Chairman (Enoch)
- **Key agenda items:**
  1. Opening formalities (prayer, welcome, introductions) — 10 min
  2. Review of previous conferences (lessons learned, budgets, attendance) — 20 min
  3. Key financial proposals (accommodation: 5,000 RMB deposit, 85 rooms; budget headcount 170 persons; conference hall 2 days @ 4,000 RMB; transport 1,000 RMB; cooking budget) — 60 min
  4. Award night planning (Miss LSUIC, Best Dressed, award categories) — 30 min
  5. Committee structure & sub-committees (Finance, Logistics, Program, Awards, Transport & Accommodation, Communication) — 30 min

---

### 18.3 Venue Documents

**Path:** `scripts/conference-2026/images/venue/`

#### Hotel Deposit Payment Agreement

- **Files:** `Hotel_Agreement-1.png`, `Hotel_Agreement-2.png`
- **Date signed:** March 13, 2026
- **Parties:** LSUIC (represented by Noah D. Mason, National Financial Secretary General)
- **Terms:** Deposit paid for conference venue; 85 rooms confirmed
- **Significance:** Hotel booking confirmed before the first committee meeting

#### Hotel Presentation (Venue Slides)

- **Files:** `Hotel_Presentation-01.png` through `-23.png` (23 pages)
- **Hotel:** RiseSun Hotel (日出酒店)
- **Content:** Chinese-language presentation showing hotel facilities, room types, pricing (approx. 45–80 RMB per person range noted), banquet hall capacity, catering options
- **Note:** Primary language is Chinese; OCR text is mostly transliterated Chinese characters

#### HonorPrint / Credentials Letter

- **Files:** `HonorPrint_20260314_145922-1.png`, `-2.png`
- **Date:** March 14, 2026
- **From:** Office of the National Financial Secretary General (Noah D. Mason)
- **Purpose:** Official LSUIC credentials/certification document (likely a letter of introduction or financial authorization for venue negotiations)

#### Recent WeChat Photos (Venue)

- **Files:** `Weixin_Image_20260410145410.jpg`, `145415.jpg`, `145421.jpg`, `145441.jpg`, `145450.png`
- **Date captured:** April 10, 2026
- **Content:** Physical venue photos (hotel rooms, conference hall, venue exterior). OCR was not extractable from photos.

---

### 18.4 Others (Historical Reference)

**Path:** `scripts/conference-2026/images/others/`

Key documents (all previously referenced in earlier planning):

- **18th Annual General Conference Booklet** (15 pages) — template for the 19th booklet
- **Nanjing Renaissance 2025 Final Report** (40 pages) — previous conference full report
- **LSUIC Financial Policy Document** (12 pages) — financial governance reference
- **LSUIC Conference Assessment Report** (15 pages) — past conference evaluation
- **NEC Budget Deliberation Outcome 2025–2026** (2 pages) — approved budget baseline
- **Wuhan 2024 Conference documents** — execution plan, budget, satisfaction survey
- **LSUIC Financial Policy Document** (12 pages)
- **Cooking Committee Financial Report 2025** (8 pages)
- **Updated Honorees of the Year 2023** (4 pages)
- **WeChat Images** (`Weixin_Image_20260410144732.jpg` through `145001.jpg`) — 5 recent photos

---

### 18.5 Previous Conference Reference

**Path:** `scripts/conference-2026/images/previous-conf/`

- Constitution pages, budget documents, execution plans
- 2025 NEC election budget (IEC reference)
- Wuhan 2024 concept documents

---

### 18.6 OCR Coverage Summary

| Category          | Image Files | OCR Files | Notes                                                               |
| ----------------- | ----------- | --------- | ------------------------------------------------------------------- |
| committee-members | 50          | 50        | Constitution (46 pages) + Enoch appointment (4 pages)               |
| meetings          | 2           | 2         | First committee meeting agenda                                      |
| others            | 98          | 98        | Historical conference documents                                     |
| previous-conf     | 16          | 16        | Previous conference reference material                              |
| venue             | 32          | 31        | Hotel agreement, presentation, venue photos; `address.txt` is empty |
| **Total**         | **189**     | **188**   | All images OCR'd                                                    |

> `address.txt` in venue is an empty placeholder file (not an image, no content).

---

## Section 19 — LSUIC Constitutional Structure (Full Reference)

_Source: LSUIC Amended Constitution of 2020, all 46 pages read and archived in `scripts/conference-2026/ocr/committee-members/`_

### 19.1 Organizational Bodies

| Body                  | Type                                   | Members            | Selection                                                                       |
| --------------------- | -------------------------------------- | ------------------ | ------------------------------------------------------------------------------- |
| **NEC**               | Standing executive                     | 7 elected officers | Elected at General Conference                                                   |
| **CoC**               | Council of all Provincial Coordinators | Variable           | Elected per province; officers elected at CoC first sitting                     |
| **Judicial Board**    | Judicial body                          | 5 appointed        | Appointed by National President with CoC consent                                |
| **Board of Advisors** | Advisory body                          | 8 members          | Appointed roles (Embassy, MoE, MoFA, LACTS, business community, past president) |

### 19.2 NEC (National Executive Committee) — 7 Elected Officers

| Office                                   | Current (2025–2026)    | City             | Phone       |
| ---------------------------------------- | ---------------------- | ---------------- | ----------- |
| National President                       | Olano Teah Bloh        | Nanjing, Jiangsu | 18351981723 |
| National Vice President                  | Ruphine M. Harmon      | Jinan, Shandong  | 18651615822 |
| National Secretary General               | C. Nathaniel Willie II | Chengdu, Sichuan | 18581578335 |
| Acting National Deputy Secretary General | Jenkins G. Wilson      | Xuzhou, Jiangsu  | 18556169627 |
| National Financial Secretary General     | Noah D. Mason          | Ningbo, Zhejiang | 19825661023 |
| National Treasurer                       | Jenneh Bonah           | Jinan, Shandong  | 18906417225 |
| National Chaplain General                | Mitchell Vampelt       | Suzhou, Jiangsu  | 15601544001 |

### 19.3 CoC (Council of Coordinators)

- All Provincial Coordinators form the full CoC (Article 15)
- Three officers elected at first CoC sitting: **Senior Coordinator**, **Deputy Senior Coordinator**, **Coordinating Secretary**
- CoC precedes NEC — meets before NEC monthly meeting
- Consents to Judicial Board appointments

### 19.4 Judicial Board — Article 16

5 members appointed by National President with CoC consent:

1. Senior Adjudicator (2-year term)
2. Associate Adjudicator (2-year term)
3. Assistant Adjudicator (2-year term)
4. Adjudicator 1 (1-year term)
5. Adjudicator 2 (1-year term)

### 19.5 Standing Committees (Article 23)

| Committee                                  | Type     | Mandate                                                                                            |
| ------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------- |
| **AEC** — Academic Excellence Committee    | Standing | Promote academic achievement                                                                       |
| **WMF** — Ways, Means & Finance Committee  | Standing | Financial oversight and fundraising                                                                |
| **Audit Committee**                        | Standing | Audits all LSUIC accounts; reports to NEC + CoC                                                    |
| **PPC** — Planning & Program Committee     | Ad hoc   | Plans and implements programs; becomes **Conference Committee** when organizing General Conference |
| **IEC** — Independent Elections Commission | Ad hoc   | Conducts elections; set up 90–60 days before conference                                            |
| **Students Container Committee**           | Ad hoc   | Coordinates transportation of graduating students' belongings to Liberia                           |
| **Scholarly Literature Committee**         | Ad hoc   | Books, articles, scholarly programs                                                                |

> **Key:** The Conference Committee (Section 16 of this doc) is constitutionally the PPC — "Also be referred to as Conference Committee especially when organized to execute the General Conference and other similar conferences." (Art. 23j.i)

### 19.6 Board of Advisors — Article 17

8 members (appointed roles):

1. Representative of Liberian Embassy in China — **Chair of Board**
2. Representative of Liberian Ministry of Education — **Co-Chair of Board**
3. Representative of Liberian Ministry of Foreign Affairs
4. Representative of LACTS (Liberian Association of Chinese Trained Students)
5. Representative of Liberian Business Community in China
6. Former LSUIC National President (most recent)
7. Prominent Liberian in China nominated by NEC
8. National President of LSUIC — **Board Secretary** (no voting right)

### 19.7 Elections & Tenure (Articles 28–32)

- All levels: democratic election by secret ballot, simple majority
- **Tenure:** 1 academic year per term; maximum 2 consecutive terms
- Officers must show valid Liberian passport for citizenship proof
- NEC President + VP must hold bachelor's degree; others: undergraduate studies or high school diploma
- IEC set up not sooner than 90 days, not later than 60 days before conference

### 19.8 Conference Finance (Articles 24–27)

- Funds: membership dues + fundraising + donations + other lawful income
- All members contribute toward conference budget (accommodation + feeding)
- Three signatories: National President, Secretary General, Treasurer
- President + Treasurer sign all pay vouchers
- Student loan program possible if financially viable (with guarantors + payment bond)

---

## Section 20 — Conference Committee Letterhead

### 20.1 Design Specification

Modeled after the official NEC letterhead format (from OCR of `Mr._Enoch_Appointment-3.txt`).

**Layout (A4, 96dpi = 794×1123px):**

| Zone                          | Content                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| Gold top bar (7px)            | `#C8A061` gradient                                            |
| Left: LSUIC logo              | Circular clip, 108×108px, ring-bordered                       |
| Center: Organization name     | "LIBERIAN STUDENT UNION IN CHINA (LSUIC)"                     |
| Center: Conference name       | Conference event name (gold color)                            |
| Center: Venue + Date          | Venue, city, date range                                       |
| Center: Office label          | "Office of the Conference Chairman"                           |
| Center: Motto + Contact       | "Promoting Education, Unity and Development" · Est. July 2008 |
| Right sidebar: Committee list | All `ConfMember` records (gold separator), top roles first    |
| Navy bottom bar (5px)         | `#182e5f`                                                     |

**Right sidebar order:** CHAIR → VICE_CHAIR → SECRETARY → TREASURER → COMMITTEE

### 20.2 API Endpoint

```
GET /api/conf/[confId]/letterhead
```

Query params:

- `?mode=header` — header-only (~218px tall)
- `?mode=page` — full A4 page with body area (default)
- `?format=svg` — return raw SVG
- `?format=png` — return PNG via resvg-js (default)

### 20.3 Integration Points

- **Booklet Preview tab** — letterhead preview strip at bottom of Live Preview
- **Future PDF exports** — all generated documents should embed this letterhead as the first page header
- **Booklet generation** — when implemented, prefix each page with the header variant

### 20.4 Implementation Checklist

- [x] `GET /api/conf/[confId]/letterhead` — SVG builder + PNG renderer
- [x] Letterhead preview strip in Booklet Preview tab
- [ ] Integrate into DOCX/Word export templates
- [ ] Integrate into PDF generation pipeline
- [ ] Print-quality resolution option (`?scale=2` for 2x PNG)
- [ ] QR code in footer linking to conference registration page

---

## Section 21 — Booklet Live Preview

### 21.1 Overview

A beautiful in-browser booklet preview renders all enabled sections in a realistic magazine/program format.

**Route:** `/tools/conf/booklet` → click "Live Preview" tab

### 21.2 Preview Sections Rendered

| Section Type                              | Visual Treatment                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| `COVER`                                   | Full dark-navy gradient, gold accents, LSUIC logo, conference name, theme, dates |
| `LEADER`                                  | 2-column grid of leader cards with photo, name, title, country badge             |
| `PRESIDENT_ADDRESS` / `GUEST_BIO` / `NEC` | Gold quote mark, speaker photo + name, body text with line breaks                |
| `COMMITTEE` / `COC` / `COC_MEMBERS`       | 2-column member cards; CHAIR in gold, VICE_CHAIR in navy                         |
| `SCHEDULE`                                | Timeline with numbered dots, date/time/location per meeting                      |
| `DELEGATES`                               | 5-column photo grid with name, city, delegate code                               |
| `SPONSORS` / generic                      | Styled text body                                                                 |
| `BACK_COVER`                              | Gold gradient, logo, conference name, motto                                      |

### 21.3 Toolbar Features

- Zoom in/out (60%–150%) with live transform scaling
- Link to Letterhead PNG download
- Print/PDF button (`window.print()`)
- Live status badge (DRAFT / READY / PUBLISHED)
- Section count display

### 21.4 Booklet Manager Tabs

| Tab                 | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| Overview            | Stats dashboard + section readiness + committee member list |
| **Live Preview**    | Full visual booklet preview (new)                           |
| Leadership Profiles | CRUD for heads of state, ambassadors                        |
| Section Manager     | Reorder, enable/disable, edit section text                  |
| Settings            | Title, subtitle, theme, publication status                  |

### 21.5 Committee Member Display Fix

Previously, committee members (VICE_CHAIR, SECRETARY, COMMITTEE roles) were hidden unless they had registered as delegates. This was incorrect.

**Fix applied:**

- Data API now returns **ALL active `ConfMember`** records, each with a `hasRegistered: boolean` flag
- Admin views show all members; members without delegate registration get a "Not registered" badge
- Role labels corrected: VICE_CHAIR → "General Co-Chair", SECRETARY → "General Secretary", CHAIR → "General Chairman"

---

## Section 22 — NEC Separation and Booklet Identity Fields (April 2026 Update)

### 22.1 Data Separation Rule (Mandatory)

- **NEC Board** must be rendered from a dedicated NEC dataset (`necMembers`) and must not use Conference Committee (`ConfMember`) data.
- **Conference Committee** must remain separate and continue to use `committeeMembers` (`ConfMember`) data.
- `ConfMember.role = CHAIR` represents **Conference Chair**, not NEC President.

### 22.2 NEC Board Source of Truth

- NEC board roster follows official NEC/letterhead directives:
  - Olano Teah Bloh — National President
  - Ruphine M. Harmon — National Vice President
  - C. Nathaniel Willie II — National Secretary General
  - Jenkins G. Wilson — Acting National Deputy Secretary General
  - Noah D. Mason — National Financial Secretary General
  - Jenneh Bonah — National Treasurer
  - Mitchell Vampelt — National Chaplain General
- NEC photos default to placeholder until linked signup/photo exists.

### 22.3 Identity Fields Required in Booklet Cards

For booklet people cards (where applicable), include:

- Name
- Position/role
- Conference ID (`delegateCode`) — show `ID pending` if missing
- School/University (`university`) — show `Member` if missing
- City and Province — show `Member` fallback where needed

Applies to:

- NEC board cards
- Conference committee cards
- Delegate/participant roster cards

### 22.4 Delegate Space Inclusion Rule

- Delegate roster must include **all signed-up participants** (statuses: `REGISTERED`, `CONFIRMED`, `ATTENDED`), excluding `CANCELLED`.
- Missing booklet photo uses placeholder silhouette and updates automatically once participant uploads photo.

### 22.5 Rendering/UX Rules

- NEC section header and labels must be NEC-specific (not conference chair wording).
- Conference committee sections must keep committee-specific labels and hierarchy.
- Role/position text should prefer explicit `conferencePosition`/`title` when available, not global fallback labels.

---

## Section 23 — Participant Registry Table & Registration Account Workflow (April 2026)

### 23.1 Participant Registry Table (Manager View)

**Route:** `/tools/conf/delegates`

The delegates module must provide a robust table view for all registered participants with dynamic controls for management operations.

Required capabilities:

- Full list of participants with key registration fields in one table
- Mandatory columns:
  - Conference ID (`delegateCode`)
  - Full name
  - Passport number
  - Passport file link (image/PDF)
  - Conference booklet photo preview
  - Phone, email, WeChat
  - City/province, university
  - Fee amount, fee-paid status
  - Registration status (`REGISTERED` / `CONFIRMED` / `ATTENDED` / `CANCELLED`)
  - Flyer readiness
- Search across name, ID, passport number, phone, email, city, and university
- Filters for registration status and payment state
- Pagination with selectable page size
- Multi-format export:
  - CSV
  - TXT (tabular text)
  - Excel-compatible export (`.xls`)
- Row-level actions:
  - Open details page
  - Toggle fee paid/unpaid (manager authorized)
  - Replace booklet photo
  - Replace passport file (manager authorized)

### 23.2 Registration Fee Policy

- Default conference registration fee is **250 RMB**.
- Registration forms must auto-fill the fee amount field with this default value.
- If no fee is explicitly supplied at submission time, backend delegate creation must persist `250` as `feeAmount` fallback.
- Fee defaults are exposed by default conference bootstrap API for consistent UI use.

### 23.3 Conference Registration + System Account Workflow (Target)

#### Step 1 — Conference Registration

- Participant submits full registration form with unique email and required uploads.
- Registration data is persisted in `ConfDelegate`.

#### Step 2 — Account Creation Link Delivery

- After successful registration, system should send a one-time account-creation link to the same registration email.
- Participant sets password and activates platform login.

#### Step 3 — Account Login

- Participant logs in with registered email and password.
- Before full payment confirmation: limited access view only.

### 23.4 Role-Based Approval Workflow (Target)

- Chairman/Super Admin defines authorized approvers (e.g., Financial Secretary, Vice Chair, Secretary, designated staff).
- Authorized approvers review payment records and update participant payment state.
- Final confirmation is allowed only when full fee obligation is satisfied.

### 23.5 Payment States and Confirmation Rules (Target)

- Required payment states:
  - `UNPAID`
  - `PARTIAL`
  - `FULLY_PAID`
  - `CONFIRMED`
- Only `FULLY_PAID` participants can be switched to `CONFIRMED` by authorized approvers.
- `UNPAID` and `PARTIAL` remain pending and cannot receive official confirmation flyer.

### 23.6 Conditional Flyer Generation Rule

- Official delegate flyer generation is conditional.
- Flyer is generated only after final approval for full payment completion.
- Pending/partial participants see a pending prompt instead of official confirmed flyer.

### 23.7 Real-Time Payment Metrics (Manager/Audit View)

Management dashboards should continuously compute and expose:

- Total registered participants
- Total fully paid participants
- Total confirmed participants
- Aggregate collected amount
- Outstanding amount

Visibility scope:

- Chairman / Super Admin
- Explicitly authorized approvers

### 23.8 Post-Approval Access Activation (Target)

After final payment confirmation:

- Unlock full participant hub permissions (materials, schedules, profile updates, flyer management)
- Persist approval and payment audit trail for historical and compliance review

### 23.9 Implementation Status Snapshot

| Area | Status |
| --- | --- |
| Participant registry table with pagination | ✅ Implemented |
| Passport + booklet photo visibility in registry table | ✅ Implemented |
| CSV / TXT / Excel export from participant registry | ✅ Implemented |
| Default 250 RMB auto-fill + backend fallback | ✅ Implemented |
| Auto account-creation email link after registration | 🔄 Planned |
| Partial payment state model + final confirmation gate | 🔄 Planned |
| Full post-payment permission unlock automation | 🔄 Planned |
