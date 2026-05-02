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
export const FUNDRAISING_SAMPLE_FROM =
  "Liberian Student Union in China (LSUIC), Jinan 2026 Organizing Committee";
export const FUNDRAISING_SAMPLE_SUBJECT =
  "Invitation to Support LSUIC Jinan 2026 Conference and Student Participation";
export const FUNDRAISING_SAMPLE_RECIPIENT_NAME =
  "[Recipient title and name]";
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
    fields.fundraisingRecipientName.trim() ||
    FUNDRAISING_SAMPLE_RECIPIENT_NAME;

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
  const medium =
    fields.fundraisingMeetingMedium.trim() || "Zoom";
  const mtgId =
    fields.fundraisingMeetingId.trim() || "2312312006";
  const mtgPass =
    fields.fundraisingMeetingPassword.trim() || "LSUIC2006";
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

<h3>Payment channels</h3>
<table>
<thead>
<tr><th scope="col">Accepted channel</th></tr>
</thead>
<tbody>
<tr><td>Mobile Money</td></tr>
<tr><td>UBA</td></tr>
<tr><td>WeChat</td></tr>
<tr><td>Alipay</td></tr>
</tbody>
</table>
<p>Detailed QR codes and account titles appear on our official flyer included with this letter.</p>
<p>If needed, we can share confirmation steps immediately after payment for accountability and record keeping.</p>
<p>We would be honored to have your support. Your contribution is an investment in the leadership capacity of Liberian students in China.</p>
<p>Thank you for your time, trust, and partnership.</p>`;
}
