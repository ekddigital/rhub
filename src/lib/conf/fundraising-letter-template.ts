/**
 * Fundraising invitation letter — canonical copy and defaults for the Letter Composer.
 * The runtime letter body is built here from draft fields (see `buildFundraisingLetterBodyRichHtml`)
 * so sidebar values (recipient, category, dates, Zoom, target, use of funds) match the narrative.
 *
 * Keynote Speaker (general letters only): respectful invitation pairing remarks at the virtual fundraiser with an earnest appeal for substantive support for the Liberian student community; optional thematic emphasis / duration sidebar fields populate the narrative.
 *
 * Docs (not loaded by the app):
 * - `src/docs/LSUIC-2026-positioning-and-keynote-fundraising-letter-sample.md` — LSUIC 2026 planning identity + keynote fundraising letter sample aligned with this module.
 * - `src/docs/FUNDRAISING_LETTER_SAMPLE.md` — optional older reference.
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
  | "ngo"
  | "miss_lsuic";

export const FUNDRAISING_CATEGORY_LABELS: Record<FundraisingCategory, string> =
  {
    general: "General Fundraising",
    corporate: "Corporate Sponsor",
    government: "Government / Embassy",
    alumni: "Alumni",
    ngo: "NGO / Development Partner",
    miss_lsuic: "Miss LSUIC Pageant & Achievers Night",
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
  "Honoring Our Past, Engaging Our Present, and Inspiring Our Future";
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

// ── Miss LSUIC Pageant / Achievers Night sponsorship ─────────────────────────

export const MISS_LSUIC_SAMPLE_RECIPIENT =
  "[Programme Sponsor Name or Organization]";
export const MISS_LSUIC_SAMPLE_SUBJECT =
  "Partnership Invitation - Miss LSUIC 2026 / Liberia Students Union in China (LSUIC) Annual Conference - Jinan, July 23-27, 2026";
/** Editable sidebar lines — rendered as sponsor visibility / recognition bullets in the Miss LSUIC letter. */
export const MISS_LSUIC_SAMPLE_USE_OF_FUNDS = `- Placement of your business logo on the official Miss LSUIC event banner
- Inclusion of your promotional video or clip in the event marketing/programme replay reel
- On-stage / printed acknowledgement aligned to Platinum, Gold, and VIP programme sponsor table tiers`;

/** Consolidated programme-support table (single table to avoid repeated sections). */
export const MISS_LSUIC_PROGRAMME_SNAPSHOT_ROWS: readonly {
  area: string;
  basis: string;
}[] = [
  {
    area: "Cash prizes for placings (winner + first runner-up + second runner-up)",
    basis: "Fixed per committee minutes",
  },
  {
    area: "Recognition kit (crown, sashes, flowers)",
    basis:
      "Depends on sash count as registrations grow toward 6–10 contestants (+ title & special-award units)",
  },
  {
    area: "Official event banner incorporating supporting partners' logos",
    basis: "One main banner with sponsor visibility placement",
  },
  {
    area: "Pageant staging, sound/lighting, and rehearsal support",
    basis: "Venue-dependent; programme scope",
  },
  {
    area: "Photo/video documentation of the Achievers and Miss LSUIC programme",
    basis: "Event documentation deliverables",
  },
  {
    area: "Contestant preparation through June auditions and line-up coordination to show night",
    basis: "Committee planning and rehearsal operations",
  },
  {
    area: "Achievers Award Dinner hospitality, programme sponsor table tiers, and professional programme delivery",
    basis: "Banquet-night execution and guest hosting requirements",
  },
];

const MISS_LSUIC_SPONSORSHIP_CLOSER = `<p>Your generosity helps us honour student achievement, celebrate leadership, and invest in the next generation of Liberian women in our community. We are sincerely grateful for any support you can offer toward this milestone evening.</p>
<p>Thank you for considering this invitation and for standing with LSUIC in building a meaningful, dignified programme for our students. We would be honoured to welcome you and your guests, and to acknowledge your contribution before our community.</p>
<p>Please accept our heartfelt appreciation for your time, goodwill, and continued support. Should you require further information, the Conference Committee remains at your disposal.</p>`;
export const MISS_LSUIC_ESTIMATED_TOTAL_BUDGET = "¥36,000";

export const MISS_LSUIC_SAMPLE_EVENT_DATE = "July 26, 2026";
export const MISS_LSUIC_SAMPLE_EVENT_TIME =
  "Evening programme during LSUIC 2026 Conference week (exact time TBC)";
export const MISS_LSUIC_SAMPLE_PAYMENT_DEADLINE = "July 10, 2026";
export const MISS_LSUIC_SAMPLE_CONFERENCE_DATES = "July 23-27, 2026";

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
  fundraisingUseOfFunds: string;
  fundraisingEventDate: string;
  fundraisingEventTime: string;
  fundraisingPaymentDeadline: string;
  fundraisingMeetingMedium: string;
  fundraisingMeetingId: string;
  fundraisingMeetingPassword: string;
  fundraisingMeetingLink: string;
  /**
   * Optional theme line for copy (e.g. general letter + keynote). Empty → {@link CONF_THEME}.
   */
  fundraisingConferenceTheme: string;
  /** Focus / angle for Zoom fundraising keynote; shown when role is Keynote Speaker. */
  fundraisingKeynoteTopicDirection: string;
  /** E.g. "15–20 minutes"; optional, keynote only. */
  fundraisingKeynoteApproxDuration: string;
};

/** All possible fundraising/outreach letter fields combined (Letter Composer draft). */
export type AllLetterBodyFields = FundraisingLetterBodyFields & {
  fundraisingCategory: FundraisingCategory;
  fundraisingOrgName: string;
  fundraisingOfficeName: string;
  fundraisingAlumniGradYear: string;
  fundraisingPartnershipType: string;
};

/**
 * Removes legacy “Progress secured toward goal” snapshot rows from rich HTML drafts.
 * Older composer builds inserted this table row when a “raised to date” sidebar value was set.
 */
export function stripLegacyFundraisingProgressRow(html: string): string {
  if (!html || !/Progress\s+secured\s+toward\s+goal/i.test(html)) return html;
  return html.replace(
    /<tr[^>]*>\s*<t[dh][^>]*>\s*Progress\s+secured\s+toward\s+goal\s*<\/t[dh]>\s*<t[dh][^>]*>[\s\S]*?<\/t[dh]>\s*<\/tr>/gi,
    "",
  );
}

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

/** Must match Invitation Category → Keynote Speaker in the Letter Composer. */
export const FUNDRAISING_KEYNOTE_SPEAKER_ROLE = "Keynote Speaker";

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

const STANDARD_FUNDRAISING_OUTREACH_CLOSER = `<p>We would be honored to receive your support. Your contribution supports the leadership development of Liberian students in China.</p>
<p>Thank you for your consideration. Should you require further information, we remain at your disposal.</p>`;

/**
 * Campaign overview, use of proceeds, logistics, and flyer reference — appended to every
 * fundraising outreach category (general, corporate, government, alumni, NGO). General / Keynote only
 * differs in the opening paragraphs (speaking + support vs. support-only).
 */
function buildFundraisingCampaignAppendixHtml(
  fields: FundraisingLetterBodyFields,
  opts: {
    invitationCategoryDetailEscaped: string;
    /** Optional extra {@code <tr>} rows after the invitation category row (e.g. keynote snapshot). */
    extraOverviewRowsHtml: string;
    useOfFundsFallbackMultiline: string;
    /**
     * When false, the appendix ignores {@link FundraisingLetterBodyFields.fundraisingUseOfFunds}
     * (already shown in a category-specific table) and uses only the fallback, then defaults.
     */
    useDraftFieldForAppendixProceeds?: boolean;
  },
): string {
  const useDraft = opts.useDraftFieldForAppendixProceeds !== false;
  const fromDraft = useDraft
    ? parseUseOfFundsLines(fields.fundraisingUseOfFunds)
    : [];
  const fromFallback = parseUseOfFundsLines(opts.useOfFundsFallbackMultiline);
  const fundItems =
    fromDraft.length > 0
      ? fromDraft
      : fromFallback.length > 0
        ? fromFallback
        : [...DEFAULT_USE_OF_FUND_ITEMS];

  const targetSummary =
    fields.fundraisingTargetAmount.trim() || FUNDRAISING_SAMPLE_TARGET_AMOUNT;

  const useOfFundsRows = fundItems
    .map(
      (item, i) =>
        `<tr><td>${i + 1}.</td><td>${escapeLetterHtml(item)}</td></tr>`,
    )
    .join("\n");

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

  return `<h3>Campaign overview</h3>
<table>
<thead>
<tr><th scope="col">Item</th><th scope="col">Detail</th></tr>
</thead>
<tbody>
<tr><td>Invitation category</td><td>${opts.invitationCategoryDetailEscaped}</td></tr>
${opts.extraOverviewRowsHtml}
<tr><td>Stated fundraising target</td><td>${escapeLetterHtml(targetSummary)}</td></tr>
<tr><td>Planning basis</td><td>The target is framed around approximately <strong>170 participants</strong>, reflecting accommodation, catering, logistics, souvenirs, printing, and comparable conference-related costs.</td></tr>
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
<p>Contributions at every level help sustain meaningful participation on this national student platform.</p>

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

<p>Payment details, including QR codes and account titles, appear on our official flyer accompanying this letter.</p>
<p>Upon request, we can provide acknowledgement procedures following remittance.</p>`;
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

  const evDate =
    fields.fundraisingEventDate.trim() || FUNDRAISING_SAMPLE_EVENT_DATE;
  const evTime =
    fields.fundraisingEventTime.trim() || FUNDRAISING_SAMPLE_EVENT_TIME;
  const medium = fields.fundraisingMeetingMedium.trim() || "Zoom";

  const inviteClauseEscaped = escapeLetterHtml(inviteClause);

  const isKeynoteSpeaker =
    fields.fundraisingInviteRole.trim() === FUNDRAISING_KEYNOTE_SPEAKER_ROLE;

  const themeLine =
    (fields.fundraisingConferenceTheme ?? "").trim() || CONF_THEME;

  const topicDir = (fields.fundraisingKeynoteTopicDirection ?? "").trim();
  const durationRaw = (fields.fundraisingKeynoteApproxDuration ?? "").trim();

  const durationSlotFragment = durationRaw
    ? `; we propose an approximate duration of <strong>${escapeLetterHtml(durationRaw)}</strong>, subject to your availability`
    : "";

  const keynoteSnapshotRow = isKeynoteSpeaker
    ? `<tr><td>Keynote address (virtual session)</td><td>To be delivered during the fundraising session noted above${
        durationRaw
          ? `; proposed duration <strong>${escapeLetterHtml(durationRaw)}</strong> (to be confirmed)`
          : "; duration to be confirmed with you"
      }.</td></tr>`
    : "";

  const keynoteTopicHtml = topicDir
    ? `<p><strong>Proposed thematic emphasis (for your consideration):</strong><br />${escapeLetterHtml(topicDir).replaceAll("\n", "<br />")}</p>`
    : "";

  const openingBlock = isKeynoteSpeaker
    ? `<p>We respectfully invite you to deliver the <strong>keynote address</strong> at a <strong>virtual fundraising session</strong> benefiting the <strong>LSUIC Jinan 2026 Conference Fundraising Campaign</strong> and the broader <strong>Liberian student community in China</strong>. The session is scheduled for <strong>${escapeLetterHtml(evDate)}</strong> at <strong>${escapeLetterHtml(evTime)}</strong>, via <strong>${escapeLetterHtml(medium)}</strong>${durationSlotFragment}.</p>
<p>The thematic focus for this milestone is <strong><em>&ldquo;${escapeLetterHtml(themeLine)}&rdquo;</em></strong>. We welcome remarks that reinforce this vision, engage students and supporting partners constructively, and help inspire concrete support so that peers who rely on pooled resources can take part.</p>
${keynoteTopicHtml}
<p>We are asking for <strong>both</strong> your voice on this programme and your <strong>meaningful backing of our community</strong>. Alongside delivering the keynote, we earnestly invite a <strong>financial or comparable contribution</strong> aligned with what you can offer; the overview and payment channels below show how donations directly ease fees and sustain the conference for Liberian students in China.</p>`
    : `<p>We respectfully invite you to support the <strong>LSUIC Jinan 2026 Conference Fundraising Campaign</strong> as <strong>${inviteClauseEscaped}</strong>.</p>`;

  const appendix = buildFundraisingCampaignAppendixHtml(fields, {
    invitationCategoryDetailEscaped: inviteClauseEscaped,
    extraOverviewRowsHtml: keynoteSnapshotRow,
    useOfFundsFallbackMultiline: FUNDRAISING_SAMPLE_USE_OF_FUNDS,
  });

  return `<p>Dear <strong>${escapeLetterHtml(dear)}</strong>,</p>
<p>On behalf of the <strong>Liberian Student Union in China (LSUIC)</strong>, we write with respect.</p>
${openingBlock}
<p>Each year, <strong>LSUIC</strong> convenes this conference to bring together Liberian students across China for <strong>leadership development, mentorship, professional networking,</strong> and <strong>national service planning</strong>. It offers a structured forum where students from many cities can meet, learn, and strengthen practical support networks.</p>
<p>As a <strong>student-led organization</strong>, we operate under significant resource constraints. Many members are <strong>not fully funded</strong>; some rely on partial scholarships, while others face considerable financial pressures. With limited paid employment during study, conference-related costs can prevent participation.</p>
<p>Our present objective is to <strong>secure support that will help reduce conference fees and enable more Liberian students to attend.</strong></p>

${appendix}
${STANDARD_FUNDRAISING_OUTREACH_CLOSER}`;
}

// ── Corporate Sponsor letter ──────────────────────────────────────────────────

export function buildCorporateSponsorLetterBodyRichHtml(
  fields: AllLetterBodyFields,
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

  const benefitRows = benefitItems
    .map(
      (item, i) =>
        `<tr><td>${i + 1}.</td><td>${escapeLetterHtml(item)}</td></tr>`,
    )
    .join("\n");

  const appendix = buildFundraisingCampaignAppendixHtml(fields, {
    invitationCategoryDetailEscaped: escapeLetterHtml(
      FUNDRAISING_CATEGORY_LABELS.corporate,
    ),
    extraOverviewRowsHtml: "",
    useOfFundsFallbackMultiline: FUNDRAISING_SAMPLE_USE_OF_FUNDS,
    useDraftFieldForAppendixProceeds: false,
  });

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
<p>We are committed to delivering a high-impact event and would welcome your organization's name, logo, and message across our conference materials, media platforms, and digital communication channels.</p>
${appendix}
${STANDARD_FUNDRAISING_OUTREACH_CLOSER}
<p>Thank you for considering this partnership opportunity. We look forward to the possibility of working with you.</p>`;
}

// ── Government / Embassy letter ───────────────────────────────────────────────

export function buildGovernmentLetterBodyRichHtml(
  fields: AllLetterBodyFields,
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

  const appendix = buildFundraisingCampaignAppendixHtml(fields, {
    invitationCategoryDetailEscaped: escapeLetterHtml(
      FUNDRAISING_CATEGORY_LABELS.government,
    ),
    extraOverviewRowsHtml: "",
    useOfFundsFallbackMultiline: FUNDRAISING_SAMPLE_USE_OF_FUNDS,
    useDraftFieldForAppendixProceeds: false,
  });

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
${appendix}
${STANDARD_FUNDRAISING_OUTREACH_CLOSER}
<p>Respectfully submitted on behalf of the LSUIC 2026 Conference Committee.</p>`;
}

// ── Alumni letter ─────────────────────────────────────────────────────────────

export function buildAlumniLetterBodyRichHtml(
  fields: AllLetterBodyFields,
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

  const appendix = buildFundraisingCampaignAppendixHtml(fields, {
    invitationCategoryDetailEscaped: escapeLetterHtml(
      FUNDRAISING_CATEGORY_LABELS.alumni,
    ),
    extraOverviewRowsHtml: "",
    useOfFundsFallbackMultiline: FUNDRAISING_SAMPLE_USE_OF_FUNDS,
    useDraftFieldForAppendixProceeds: false,
  });

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
${appendix}
${STANDARD_FUNDRAISING_OUTREACH_CLOSER}
<p>With warm regards and gratitude.</p>`;
}

// ── NGO / Development Partner letter ─────────────────────────────────────────

// ── Miss LSUIC Pageant / Achievers Night letter ──────────────────────────────

export function buildMissLsuicSponsorshipLetterBodyRichHtml(
  fields: AllLetterBodyFields,
): string {
  const dear =
    fields.fundraisingRecipientName.trim() || MISS_LSUIC_SAMPLE_RECIPIENT;
  const theme = fields.fundraisingConferenceTheme.trim() || CONF_THEME;
  const bullets = parseUseOfFundsLines(fields.fundraisingUseOfFunds);
  const sponsorBenefits =
    bullets.length > 0
      ? bullets
      : parseUseOfFundsLines(MISS_LSUIC_SAMPLE_USE_OF_FUNDS);

  const benefitRows = sponsorBenefits
    .map(
      (item, i) =>
        `<tr><td>${i + 1}.</td><td>${escapeLetterHtml(item)}</td></tr>`,
    )
    .join("\n");

  const rawEvDate = fields.fundraisingEventDate.trim();
  const rawEvTime = fields.fundraisingEventTime.trim();
  const rawPayDl = fields.fundraisingPaymentDeadline.trim();

  // Guard against stale general-fundraising defaults leaking into Miss LSUIC drafts.
  const evDate =
    !rawEvDate || rawEvDate === FUNDRAISING_SAMPLE_EVENT_DATE
      ? MISS_LSUIC_SAMPLE_EVENT_DATE
      : rawEvDate;
  const evTime =
    !rawEvTime || rawEvTime === FUNDRAISING_SAMPLE_EVENT_TIME
      ? MISS_LSUIC_SAMPLE_EVENT_TIME
      : rawEvTime;
  const payDl =
    !rawPayDl || rawPayDl === FUNDRAISING_SAMPLE_PAYMENT_DEADLINE
      ? MISS_LSUIC_SAMPLE_PAYMENT_DEADLINE
      : rawPayDl;

  const programmeSnapshotRows = MISS_LSUIC_PROGRAMME_SNAPSHOT_ROWS.map(
    (row) =>
      `<tr><td>${escapeLetterHtml(row.area)}</td><td>${escapeLetterHtml(row.basis)}</td></tr>`,
  ).join("\n");

  return `<p>Dear <strong>${escapeLetterHtml(dear)}</strong>,</p>
<p>Greetings from the <strong>Liberian Student Union in China (LSUIC)</strong>. As we celebrate our <strong>20th Anniversary</strong> and convene our Annual Conference from <strong>${MISS_LSUIC_SAMPLE_CONFERENCE_DATES}</strong> in <strong>${CONF_VENUE}</strong>, we are preparing a signature evening programme: the <strong>Achievers Award Dinner &amp; Miss LSUIC Pageant</strong>.</p>
<p>This celebration honours student excellence, leadership, and service while showcasing the talent and dignity of Liberian young women in our community. The evening sits within our broader conference vision: <em>&ldquo;${escapeLetterHtml(theme)}&rdquo;</em>. Rather than quoting a conference-wide lump-sum goal, we are asking programme sponsors to help offset the tangible costs below so the committee can pay vendors, procure awards, and present the programme responsibly.</p>
<p>We respectfully invite you to join us as a <strong>Programme Sponsor</strong>.</p>

<h3>Programme support snapshot</h3>
<p>The table below summarizes where programme sponsor support is applied. Individual line-item figures are not quoted in this letter; only the committee&rsquo;s current working total is shown (subject to final vendor quotes and headcount).</p>
<table>
<thead>
<tr><th scope="col">Supporting area</th><th scope="col">Basis</th></tr>
</thead>
<tbody>
${programmeSnapshotRows}
<tr><td colspan="2"><strong>Programme total: ${escapeLetterHtml(MISS_LSUIC_ESTIMATED_TOTAL_BUDGET)}</strong></td></tr>
</tbody>
</table>
<p>This total excludes wider Achievers dinner catering and unrelated conference pillars; programme sponsor tables exist precisely to crowd-in support where student contributions and union reserves cannot comfortably carry production alone.</p>

<h3>Sponsor visibility and recognition</h3>
<p>In return we offer clear acknowledgement opportunities (final artwork subject to sponsor tier).</p>
<table>
<thead>
<tr><th scope="col">#</th><th scope="col">Recognition</th></tr>
</thead>
<tbody>
${benefitRows}
</tbody>
</table>
<p>Published programme sponsor table tiers reference <strong>Platinum (table of 8)</strong>, <strong>Gold (table of 5)</strong>, and <strong>VIP (table of 4)</strong>, with hospitality and programme recognition scaled accordingly. Contributions may alternatively be customised as directed programme sponsorship or in-kind support toward any of the expenditure lines above.</p>

<h3>Programme schedule</h3>
<table>
<thead>
<tr><th scope="col">Item</th><th scope="col">Detail</th></tr>
</thead>
<tbody>
<tr><td>Achievers &amp; pageant evening</td><td>${escapeLetterHtml(evDate)} (${escapeLetterHtml(evTime)}) — during LSUIC 2026 in Jinan.</td></tr>
<tr><td>Conference dates</td><td>${MISS_LSUIC_SAMPLE_CONFERENCE_DATES}</td></tr>
<tr><td>Venue</td><td>${CONF_VENUE}</td></tr>
<tr><td>Programme sponsor confirmation (suggested)</td><td>Please revert by ${escapeLetterHtml(payDl)} so we can lock placements, banners, and table counts.</td></tr>
</tbody>
</table>

<p>Payment details and formal sponsorship confirmation packets are supplied by the Conference Committee on request.</p>
${MISS_LSUIC_SPONSORSHIP_CLOSER}`;
}

export function buildNgoLetterBodyRichHtml(
  fields: AllLetterBodyFields,
): string {
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

  const appendix = buildFundraisingCampaignAppendixHtml(fields, {
    invitationCategoryDetailEscaped: escapeLetterHtml(
      FUNDRAISING_CATEGORY_LABELS.ngo,
    ),
    extraOverviewRowsHtml: "",
    useOfFundsFallbackMultiline: FUNDRAISING_SAMPLE_USE_OF_FUNDS,
    useDraftFieldForAppendixProceeds: false,
  });

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
<p>We remain open to any form of engagement and look forward to your response.</p>
${appendix}
${STANDARD_FUNDRAISING_OUTREACH_CLOSER}
<p>Sincerely,</p>`;
}

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
    case "miss_lsuic":
      return buildMissLsuicSponsorshipLetterBodyRichHtml(fields);
    case "general":
    default:
      return buildFundraisingLetterBodyRichHtml(fields);
  }
}
