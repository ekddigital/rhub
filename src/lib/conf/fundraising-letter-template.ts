/**
 * Fundraising invitation letter — canonical copy and defaults for the Letter Composer.
 * The runtime letter body is built here from draft fields (see `buildFundraisingLetterBodyRichHtml`)
 * so sidebar values (recipient, category, dates, Zoom, target, use of funds) match the narrative.
 *
 * `src/docs/FUNDRAISING_LETTER_SAMPLE.md` is an optional human reference only; the app does not load it.
 */

export const FUNDRAISING_SAMPLE_DOC_TITLE =
  "LSUIC 2026 Fundraising Letter (Template)";
/** Shown in Letter Details when loading the sample (replace with your sending date). */
export const FUNDRAISING_SAMPLE_DATE_PLACEHOLDER = "[Insert date]";
export const FUNDRAISING_SAMPLE_TO = "[Recipient name / organization]";
export const FUNDRAISING_SAMPLE_ADDRESS = "[Recipient address]";
export const FUNDRAISING_SAMPLE_FROM = "LSUIC, 2026 Conference Committee";
export const FUNDRAISING_SAMPLE_SUBJECT =
  "Invitation to Support LSUIC Jinan 2026 Conference and Student Participation";
export const FUNDRAISING_SAMPLE_RECIPIENT_NAME = "[Recipient title and name]";
export const FUNDRAISING_SAMPLE_TARGET_AMOUNT =
  "RMB 180,000 (approx. USD 25,000 at RMB 7.2 ≈ USD 1)";
/** Amount-only sample line for Letter Composer; the letter adds standard explanatory wording. */
export const FUNDRAISING_SAMPLE_RAISED_TO_DATE = "RMB 70,000";
export const FUNDRAISING_SAMPLE_EVENT_DATE = "May 29, 2026";
export const FUNDRAISING_SAMPLE_EVENT_TIME = "21:00 (China time)";
export const FUNDRAISING_SAMPLE_PAYMENT_DEADLINE = "June 6, 2026";
export const FUNDRAISING_SAMPLE_USE_OF_FUNDS = `- Fee reduction support for financially constrained students
- Venue and accommodation costs
- Transportation and logistics coordination
- Program delivery (sessions, speakers, coordination)
- Conference materials, communication, and documentation`;

// ── Shared conference identity ───────────────────────────────────────────────

/** The four letter categories available in the composer. */
export type FundraisingCategory =
  | "general"
  | "corporate"
  | "government"
  | "alumni"
  | "ngo";

export const FUNDRAISING_CATEGORY_LABELS: Record<FundraisingCategory, string> =
  {
    general: "General Fundraising",
    corporate: "Corporate Sponsor",
    government: "Government / Embassy",
    alumni: "Alumni",
    ngo: "NGO / Development Partner",
  };

export const CONF_FROM_COMMITTEE = "LSUIC, 2026 Conference Committee";

/** First line of legacy Letter Composer drafts that spelled out the union before the committee shorthand. */
const LEGACY_LETTER_FROM_FULL_ORG_PREFIX =
  /^LIBERIAN STUDENT UNION IN CHINA \(LSUIC\)/i;

/**
 * Replaces a spelled-out LSUIC header line with {@link FUNDRAISING_SAMPLE_FROM} while preserving
 * any following lines (e.g. signatory name/title). No-op outside fundraising letter mode.
 */
export function normalizeFundraisingLetterFromField(
  from: string,
  opts: { fundraisingMode: boolean },
): string {
  if (!opts.fundraisingMode || !(from ?? "").trim()) return from;
  const lines = from.split(/\r?\n/);
  const firstRaw = lines[0] ?? "";
  const firstTrim = firstRaw.trim();
  if (!LEGACY_LETTER_FROM_FULL_ORG_PREFIX.test(firstTrim)) return from;
  lines[0] = FUNDRAISING_SAMPLE_FROM;
  return lines.join("\n");
}

export const CONF_THEME =
  "Honoring Our Past, Engaging Our Present, Inspiring Our Future";
export const CONF_DATES = "July 24\u201327, 2026";
export const CONF_VENUE = "Jinan City, Shandong Province, China";

// ── Corporate Sponsor defaults ───────────────────────────────────────────────

export const CORPORATE_SAMPLE_ORG_NAME = "[Company Name]";
export const CORPORATE_SAMPLE_RECIPIENT = "[Company Name / Representative]";
export const CORPORATE_SAMPLE_SUBJECT =
  "Sponsorship Opportunity: LSUIC 20th Anniversary & Annual Conference";
export const CORPORATE_SAMPLE_USE_OF_FUNDS = `- Direct access to a pool of highly educated, globally trained African talent
- Brand visibility across event materials, media, and digital platforms
- Opportunities to engage in recruitment, CSR initiatives, and thought leadership`;

// ── Government / Embassy defaults ────────────────────────────────────────────

export const GOVERNMENT_SAMPLE_RECIPIENT = "[Title and Name]";
export const GOVERNMENT_SAMPLE_OFFICE = "[Embassy / Government Office Name]";
export const GOVERNMENT_SAMPLE_SUBJECT =
  "Request for Support: LSUIC 20th Anniversary Conference";
export const GOVERNMENT_SAMPLE_USE_OF_FUNDS = `- Strengthening student engagement and welfare
- Promoting Liberia's image and unity abroad
- Encouraging knowledge exchange aligned with national development goals`;

// ── Alumni defaults ───────────────────────────────────────────────────────────

export const ALUMNI_SAMPLE_RECIPIENT = "Esteemed Alumnus / Alumna";
export const ALUMNI_SAMPLE_SUBJECT =
  "Give Back: LSUIC 20th Anniversary Celebration";
export const ALUMNI_SAMPLE_USE_OF_FUNDS = `- Sponsor student participation
- Fund leadership and professional development programs
- Strengthen the LSUIC network for future generations`;

// ── NGO / Development Partner defaults ───────────────────────────────────────

export const NGO_SAMPLE_RECIPIENT = "[Organization Name]";
export const NGO_SAMPLE_SUBJECT =
  "Partnership Opportunity: Empowering Liberian Students in China";
export const NGO_SAMPLE_USE_OF_FUNDS = `- Capacity-building workshops and training sessions
- Inclusive student participation
- Sustainable leadership development initiatives`;
export const NGO_SAMPLE_PARTNERSHIP_TYPE =
  "funding, program collaboration, or resource sharing";

const DEFAULT_USE_OF_FUND_ITEMS = [
  "Fee reduction support for financially constrained students",
  "Venue and accommodation costs",
  "Transportation and logistics coordination",
  "Program delivery (sessions, speakers, coordination)",
  "Conference materials, communication, and documentation",
] as const;

export type FundraisingLetterBodyFields = {
  fundraisingRecipientName: string;
  fundraisingInviteRole: string;
  fundraisingInviteRoleOther: string;
  fundraisingTargetAmount: string;
  /** Secured toward goal so far (typically an amount); omit when blank. */
  fundraisingRaisedToDate: string;
  fundraisingUseOfFunds: string;
  fundraisingEventDate: string;
  fundraisingEventTime: string;
  fundraisingPaymentDeadline: string;
  fundraisingMeetingMedium: string;
  fundraisingMeetingId: string;
  fundraisingMeetingPassword: string;
  fundraisingMeetingLink: string;
};

function escapeLetterHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function parseUseOfFundsLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function inviteCategoryLabel(
  role: string,
  other: string,
): { article: "a" | "an"; label: string } {
  const label =
    role === "Other"
      ? (other.trim() || "Community partner").trim()
      : (role.trim() || "Sponsor").trim();
  const article = /^[AEIOUaeiou]/u.test(label.charAt(0)) ? "an" : "a";
  return { article, label };
}

/**
 * Rich HTML letter body wired to fundraising sidebar fields — fully editable afterward in Composer.
 */
export function buildFundraisingLetterBodyRichHtml(
  fields: FundraisingLetterBodyFields,
): string {
  const dear =
    fields.fundraisingRecipientName.trim() || FUNDRAISING_SAMPLE_RECIPIENT_NAME;

  const { article, label } = inviteCategoryLabel(
    fields.fundraisingInviteRole,
    fields.fundraisingInviteRoleOther,
  );
  const inviteClause = `${article} ${label}`;

  const targetSummary =
    fields.fundraisingTargetAmount.trim() || FUNDRAISING_SAMPLE_TARGET_AMOUNT;

  const bullets = parseUseOfFundsLines(fields.fundraisingUseOfFunds);
  const fundItems =
    bullets.length > 0 ? bullets : [...DEFAULT_USE_OF_FUND_ITEMS];

  const evDate =
    fields.fundraisingEventDate.trim() || FUNDRAISING_SAMPLE_EVENT_DATE;
  const evTime =
    fields.fundraisingEventTime.trim() || FUNDRAISING_SAMPLE_EVENT_TIME;
  const payDl =
    fields.fundraisingPaymentDeadline.trim() ||
    FUNDRAISING_SAMPLE_PAYMENT_DEADLINE;
  const medium = fields.fundraisingMeetingMedium.trim() || "Zoom";
  const mtgId = fields.fundraisingMeetingId.trim() || "2312312006";
  const mtgPass = fields.fundraisingMeetingPassword.trim() || "LSUIC2006";
  const mtgLink =
    fields.fundraisingMeetingLink.trim() ||
    "https://us02web.zoom.us/j/2312312006?pwd=ZHh3V2dXZGJ6Y2NCa0IxczdOaWJVQT09";

  const inviteClauseEscaped = escapeLetterHtml(inviteClause);

  const useOfFundsRows = fundItems
    .map(
      (item, i) =>
        `<tr><td>${i + 1}.</td><td>${escapeLetterHtml(item)}</td></tr>`,
    )
    .join("\n");

  return `<p>Dear <strong>${escapeLetterHtml(dear)}</strong>,</p>
<p>Warm greetings from the Liberian Student Union in China (LSUIC).</p>
<p>We are writing to respectfully invite you to support the <strong>LSUIC Jinan 2026 Conference Fundraising Campaign</strong> as <strong>${inviteClauseEscaped}</strong>.</p>
<p>Each year, LSUIC organizes this conference to unite Liberian students across China for leadership development, mentorship, professional networking, and national service planning. It is one of the few spaces where students from different cities can gather, learn, and build practical support systems together.</p>
<p>As a student organization, we face a real challenge: many students are not fully funded. Some are on partial scholarships, while others carry significant financial disadvantages. Most students are not working, and conference-related costs can easily prevent participation.</p>
<p>Our goal is simple and urgent: <strong>raise support to reduce conference fees so more Liberian students can attend.</strong></p>

<h3>Fundraising snapshot</h3>
<table>
<thead>
<tr><th scope="col">Item</th><th scope="col">Detail</th></tr>
</thead>
<tbody>
<tr><td>Invitation category</td><td>${inviteClauseEscaped}</td></tr>
<tr><td>Public target communicated</td><td>${escapeLetterHtml(targetSummary)}</td></tr>
<tr><td>Scale / planning premise</td><td>This target is framed around approximately <strong>170 participants</strong>, reflecting accommodation, catering, logistics, souvenirs, printing, and comparable conference-production costs.</td></tr>
</tbody>
</table>

<h3>Use of proceeds</h3>
<table>
<thead>
<tr><th scope="col">#</th><th scope="col">Supporting area</th></tr>
</thead>
<tbody>
${useOfFundsRows}
</tbody>
</table>
<p>Every contribution, regardless of size, helps a student remain meaningfully involved in this national student platform.</p>

<h3>Logistics — session and deadlines</h3>
<table>
<thead>
<tr><th scope="col">Topic</th><th scope="col">Information</th></tr>
</thead>
<tbody>
<tr><td>Fundraising session</td><td>${escapeLetterHtml(evDate)} (${escapeLetterHtml(evTime)})</td></tr>
<tr><td>Payment deadline</td><td>${escapeLetterHtml(payDl)}</td></tr>
<tr><td>Meeting medium</td><td>${escapeLetterHtml(medium)}</td></tr>
<tr><td>Meeting ID / password</td><td>${escapeLetterHtml(mtgId)} / ${escapeLetterHtml(mtgPass)}</td></tr>
<tr><td>Meeting link</td><td>${escapeLetterHtml(mtgLink)}</td></tr>
</tbody>
</table>

<p>Detailed QR codes and account titles appear on our official flyer included within this letter.</p>
<p>If needed, we can share confirmation steps immediately after payment for accountability and record keeping.</p>
<p>We would be honored to have your support. Your contribution is an investment in the leadership capacity of Liberian students in China.</p>
<p>Thank you for your time, trust, and partnership.</p>`;
}

// ── Corporate Sponsor letter ──────────────────────────────────────────────────

export type CorporateSponsorLetterFields = {
  fundraisingOrgName: string;
  fundraisingRecipientName: string;
  fundraisingTargetAmount: string;
  fundraisingUseOfFunds: string;
  fundraisingConferenceTheme: string;
};

export function buildCorporateSponsorLetterBodyRichHtml(
  fields: CorporateSponsorLetterFields,
): string {
  const dear =
    fields.fundraisingRecipientName.trim() || CORPORATE_SAMPLE_RECIPIENT;
  const orgName = fields.fundraisingOrgName.trim() || CORPORATE_SAMPLE_ORG_NAME;
  const theme = fields.fundraisingConferenceTheme.trim() || CONF_THEME;
  const bullets = parseUseOfFundsLines(fields.fundraisingUseOfFunds);
  const benefitItems =
    bullets.length > 0
      ? bullets
      : parseUseOfFundsLines(CORPORATE_SAMPLE_USE_OF_FUNDS);
  const targetNote = fields.fundraisingTargetAmount.trim()
    ? `<p>Our target for this campaign is <strong>${escapeLetterHtml(fields.fundraisingTargetAmount.trim())}</strong>. We welcome any level of support and would be pleased to discuss a customized sponsorship package aligned with your strategic objectives.</p>`
    : `<p>We welcome any level of support and would be pleased to discuss a customized sponsorship package aligned with your strategic objectives.</p>`;

  const benefitRows = benefitItems
    .map(
      (item, i) =>
        `<tr><td>${i + 1}.</td><td>${escapeLetterHtml(item)}</td></tr>`,
    )
    .join("\n");

  return `<p>Dear <strong>${escapeLetterHtml(dear)}</strong>,</p>
<p>Greetings from the Liberian Student Union in China (LSUIC). We are pleased to invite <strong>${escapeLetterHtml(orgName)}</strong> to partner with us as a sponsor for our <strong>20th Anniversary and Annual Conference</strong>, taking place from <strong>${CONF_DATES}</strong>, in <strong>${CONF_VENUE}</strong>.</p>
<p>This milestone event will convene a diverse network of Liberian students, graduates, and emerging professionals across China under the theme: <em>"${escapeLetterHtml(theme)}"</em>. The conference will feature leadership forums, career development sessions, and cross-cultural engagement opportunities.</p>
<h3>Partnership benefits for ${escapeLetterHtml(orgName)}</h3>
<table>
<thead>
<tr><th scope="col">#</th><th scope="col">Benefit</th></tr>
</thead>
<tbody>
${benefitRows}
</tbody>
</table>
${targetNote}
<p>We are committed to delivering a high-impact event and would welcome your organization's name, logo, and message across our conference materials, media platforms, and digital communication channels.</p>
<p>Thank you for considering this partnership opportunity. We look forward to the possibility of working with you.</p>`;
}

// ── Government / Embassy letter ───────────────────────────────────────────────

export type GovernmentLetterFields = {
  fundraisingRecipientName: string;
  fundraisingOfficeName: string;
  fundraisingUseOfFunds: string;
  fundraisingConferenceTheme: string;
};

export function buildGovernmentLetterBodyRichHtml(
  fields: GovernmentLetterFields,
): string {
  const dear =
    fields.fundraisingRecipientName.trim() || GOVERNMENT_SAMPLE_RECIPIENT;
  const office =
    fields.fundraisingOfficeName.trim() || GOVERNMENT_SAMPLE_OFFICE;
  const theme = fields.fundraisingConferenceTheme.trim() || CONF_THEME;
  const bullets = parseUseOfFundsLines(fields.fundraisingUseOfFunds);
  const supportItems =
    bullets.length > 0
      ? bullets
      : parseUseOfFundsLines(GOVERNMENT_SAMPLE_USE_OF_FUNDS);

  const supportRows = supportItems
    .map(
      (item, i) =>
        `<tr><td>${i + 1}.</td><td>${escapeLetterHtml(item)}</td></tr>`,
    )
    .join("\n");

  return `<p>Dear <strong>${escapeLetterHtml(dear)}</strong>,</p>
<p>Warm greetings from the Liberian Student Union in China (LSUIC). As we mark our <strong>20th Anniversary</strong>, we are organizing our Annual Conference from <strong>${CONF_DATES}</strong>, in <strong>${CONF_VENUE}</strong>. This event represents a critical platform for fostering leadership, academic excellence, and national development among Liberian students abroad.</p>
<p>The conference is themed: <em>"${escapeLetterHtml(theme)}"</em> — a reflection of our commitment to honoring what has been built while charting a path for the next generation.</p>
<p>We respectfully seek the support of <strong>${escapeLetterHtml(office)}</strong> in making this event a success. Your support will contribute to:</p>
<table>
<thead>
<tr><th scope="col">#</th><th scope="col">Area of impact</th></tr>
</thead>
<tbody>
${supportRows}
</tbody>
</table>
<p>Your presence and / or financial support would significantly elevate the impact of this milestone celebration. We remain committed to representing Liberia with excellence and would be honored to collaborate with your office.</p>
<p>We would welcome the opportunity to discuss how best your office can participate in or support this important gathering of Liberians in China.</p>
<p>Respectfully submitted on behalf of the LSUIC 2026 Conference Committee.</p>`;
}

// ── Alumni letter ─────────────────────────────────────────────────────────────

export type AlumniLetterFields = {
  fundraisingRecipientName: string;
  fundraisingAlumniGradYear: string;
  fundraisingUseOfFunds: string;
};

export function buildAlumniLetterBodyRichHtml(
  fields: AlumniLetterFields,
): string {
  const dear =
    fields.fundraisingRecipientName.trim() || ALUMNI_SAMPLE_RECIPIENT;
  const gradNote = fields.fundraisingAlumniGradYear.trim()
    ? ` — Class of ${escapeLetterHtml(fields.fundraisingAlumniGradYear.trim())}`
    : "";
  const bullets = parseUseOfFundsLines(fields.fundraisingUseOfFunds);
  const contributionItems =
    bullets.length > 0
      ? bullets
      : parseUseOfFundsLines(ALUMNI_SAMPLE_USE_OF_FUNDS);

  const contributionRows = contributionItems
    .map(
      (item, i) =>
        `<tr><td>${i + 1}.</td><td>${escapeLetterHtml(item)}</td></tr>`,
    )
    .join("\n");

  return `<p>Dear <strong>${escapeLetterHtml(dear)}${gradNote}</strong>,</p>
<p>Greetings from LSUIC. This year marks a proud milestone — <strong>20 years of LSUIC's impact</strong> in shaping Liberian students in China. To celebrate, we will host our Annual Conference from <strong>${CONF_DATES}</strong>, in <strong>${CONF_VENUE}</strong>.</p>
<p>As an integral part of our legacy, we invite you to <strong>give back and support the next generation</strong>. Your contribution will help:</p>
<table>
<thead>
<tr><th scope="col">#</th><th scope="col">Contribution area</th></tr>
</thead>
<tbody>
${contributionRows}
</tbody>
</table>
<p>Your support is not just a donation — it is an investment in continuity, mentorship, and national progress. The students who will gather in Jinan this July are walking a path that you helped define.</p>
<p>We deeply appreciate your continued commitment to LSUIC and look forward to celebrating this milestone together. We hope to count on your support as we carry the torch forward.</p>
<p>With warm regards and gratitude.</p>`;
}

// ── NGO / Development Partner letter ─────────────────────────────────────────

export type NgoLetterFields = {
  fundraisingRecipientName: string;
  fundraisingPartnershipType: string;
  fundraisingUseOfFunds: string;
  fundraisingConferenceTheme: string;
};

export function buildNgoLetterBodyRichHtml(fields: NgoLetterFields): string {
  const dear = fields.fundraisingRecipientName.trim() || NGO_SAMPLE_RECIPIENT;
  const partnerType =
    fields.fundraisingPartnershipType.trim() || NGO_SAMPLE_PARTNERSHIP_TYPE;
  const theme = fields.fundraisingConferenceTheme.trim() || CONF_THEME;
  const bullets = parseUseOfFundsLines(fields.fundraisingUseOfFunds);
  const supportItems =
    bullets.length > 0
      ? bullets
      : parseUseOfFundsLines(NGO_SAMPLE_USE_OF_FUNDS);

  const supportRows = supportItems
    .map(
      (item, i) =>
        `<tr><td>${i + 1}.</td><td>${escapeLetterHtml(item)}</td></tr>`,
    )
    .join("\n");

  return `<p>Dear <strong>${escapeLetterHtml(dear)}</strong>,</p>
<p>Greetings from the Liberian Student Union in China (LSUIC). We are organizing our <strong>20th Anniversary and Annual Conference</strong> from <strong>${CONF_DATES}</strong>, in <strong>${CONF_VENUE}</strong>. This event serves as a platform for leadership development, education, and cross-cultural collaboration among Liberian students, themed: <em>"${escapeLetterHtml(theme)}"</em>.</p>
<p>We believe our mission aligns closely with your organization's commitment to education, youth empowerment, and capacity building. We are therefore seeking partnership support in the form of <strong>${escapeLetterHtml(partnerType)}</strong>.</p>
<h3>Your support will enable</h3>
<table>
<thead>
<tr><th scope="col">#</th><th scope="col">Impact area</th></tr>
</thead>
<tbody>
${supportRows}
</tbody>
</table>
<p>We would welcome the opportunity to explore how we can collaborate for mutual impact. A partnership between our organizations would be a meaningful step toward strengthening educational and leadership outcomes for Liberian youth in China.</p>
<p>Thank you for your consideration. We remain open to any form of engagement and look forward to your response.</p>
<p>Sincerely,</p>`;
}

// ── Master dispatch type + builder ───────────────────────────────────────────

/** All possible fundraising/outreach letter fields combined. */
export type AllLetterBodyFields = FundraisingLetterBodyFields & {
  fundraisingCategory: FundraisingCategory;
  fundraisingOrgName: string;
  fundraisingConferenceTheme: string;
  fundraisingOfficeName: string;
  fundraisingAlumniGradYear: string;
  fundraisingPartnershipType: string;
};

/**
 * Dispatch to the correct body builder based on `fields.fundraisingCategory`.
 * Falls back to the general fundraising builder for unknown categories.
 */
export function buildLetterBodyRichHtml(fields: AllLetterBodyFields): string {
  switch (fields.fundraisingCategory) {
    case "corporate":
      return buildCorporateSponsorLetterBodyRichHtml(fields);
    case "government":
      return buildGovernmentLetterBodyRichHtml(fields);
    case "alumni":
      return buildAlumniLetterBodyRichHtml(fields);
    case "ngo":
      return buildNgoLetterBodyRichHtml(fields);
    case "general":
    default:
      return buildFundraisingLetterBodyRichHtml(fields);
  }
}
