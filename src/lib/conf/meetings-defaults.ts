export type DefaultMeetingSeed = {
  meetingNo: number;
  title: string;
  scheduled: string; // YYYY-MM-DD
  location: string | null;
  agenda: string;
  minutes: string | null;
  minutesStatus:
    | "NONE"
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "CHANGES_REQUESTED";
  minutesSubmittedBy: string | null;
  chairNote: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
};

export const DEFAULT_MEETINGS_COUNT = 14;

export const MEETING_1_MINUTES = `LSUIC 2026 CONFERENCE COMMITTEE
Meeting #1 Minutes — April 10, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Convened by: Enoch Kwateh Dongbo (Conference Chair)
Venue:       LSUIC Zoom (ID: 2312312006 · Password: LSUIC2006)
Scheduled:  21:00 — 22:05 (Friday, April 10, 2026)
Actual End: ~23:00 (meeting ran approximately 2 hours)

ATTENDEES (18 in total)
─────────────────────────────────────────
COMMITTEE                                  [Zoom display name]
• Enoch Kwateh Dongbo — Conf. Chair · Jinan (Co-host)     → "Enoch"
• Alfreda Ruth Togbah — Co-Chair · Suzhou                 → "Alfreda Ruth Togbah"
• Harris M Bowulo — General Secretary (Co-host)           → "HARRIS"
• Abdul Corneh — PRO / Media Committee Chair              → "Abdul"
• Kukor Brooks — Cooking Committee Chair · Jinan          → "Kukor  Brooks - Jinan"
• Jefferson T Banquando — Sports Committee Chair          → "Jeffery"
• Robert D. Molley — Logistics Committee Chair            → "Amb. Robert D. Molley"
• Priscilla — Cooking Committee · Suzhou                  → "Priscilla - Suzhou"
• Williamena Yah MUNYENEH — Cooking Committee             → "Williamena Yah MUNYENEH"
• Blessing — Cooking Committee · Nantong                  → "Blessing - Nantong"
• Lisa — Cooking Committee · Qingdao                      → "Lisa - Qingdao"

NEC / OBSERVERS                            [Zoom display name]
• Olano — LSUIC President (Host)                          → "Olano" / "Olano - Prezo"
• Mitchell Vampelt — NCG Representative                   → "Mitchell Vampelt - NCG"
• Hon. Noah D. Mason Jr. — NEC Representative             → "Hon. Noah D. Mason Jr."
• Hon. Ruphine M. Harmon — NEC Representative             → "Hon. Ruphine M. Harmon"
• Jenneh Bonah — NEC Representative                               → "JENNEH BONAH"
• Yvonne — Observer · Nanjing                             → "Yvonne - Nanjing"

AGENDA
─────────────────────────────────────────
1. Opening Formalities (10 min) — Opening prayer · Welcome remarks · Self-introductions
2. Discussion (30 min) — Previous conference review · Committee structure · Meeting schedule ·
   Sub-committee creation · Timeline & milestones · Cooking committee budget · Action items
3. AOB (20 min)
4. Closing Prayer (5 min)

SUMMARY
─────────────────────────────────────────
This was the inaugural meeting of the 2026 LSUIC Conference Committee, held on LSUIC Zoom. Meeting was originally scheduled for 21:00–22:05 but ran until approximately 23:00 (~2 hours total) due to the volume of discussion. All committee members were introduced and outlined their roles. The meeting focused on establishing team relationships, communication channels, committee structure, and the overall planning direction for the Jinan conference — LSUIC's 20th Anniversary Conference.

KEY DISCUSSIONS
─────────────────────────────────────────

1. Introductions & Roles
All 11 appointed committee members were introduced and stated their role and city. The committee is constitutionally capped at 11 appointees (maximum as per LSUIC Constitution).

2. Meeting Schedule
• Initial proposal of Fridays was discussed but raised conflict concerns.
• Kukor suggested adjusting to 8–9 PM on Fridays to accommodate weekend plans.
• Harris recommended meetings be 2–2.5 hours given the online format.
• Hon. Noah recommended Thursdays to ensure NEC participation and weekend productivity.
• After a vote, Thursday 9–10 PM was selected as the regular meeting time.
• DECISION: All future meetings will be held on Thursdays at 9:00 PM online.

3. Conference Inventory Review
• Olano presented an overview of leftover items from the previous conference: food, drinks, and kitchen supplies.
• Some drink expiration dates need to be verified before use.
• Olano to send a detailed list with photos to the general group chat.

4. Committee Structure & Confirmation Hearings
• Constitutional limit: minimum 5, maximum 11 appointed committee members.
• All 11 appointees require CoC (Council of Coordinators) confirmation hearing (scheduled for Tuesday, April 14, 2026).
• Subcommittees may recruit volunteers — volunteers do NOT require CoC confirmation.
• All subcommittee chairs to create group chats before Thursday, including Chair, Co-Chair, and General Secretary in every group.

5. Subcommittees Established
• Cooking Committee — Kukor Brooks (Chair)
• Sports Committee — Jefferson T Banquando (Chair)
• Logistics Committee — Robert D Molley (Chair)
• Media & Publicity — Abdul Corneh (Chair)
• Decoration Committee — Volunteer-led (no CoC confirmation required)

6. Conference Improvement Areas (raised by Hon. Noah)
• Earlier planning and committee formation
• Better committee preparation and structure
• Securing sponsors early in the process
• Setting conference fees earlier
• Ensuring more food availability and variety for all delegates
• Creating more engaging and memorable experiences for participants

7. Conference Fee Discussion
• Last year's fee: ¥275 per delegate.
• Committee to propose a revised fee structure by the next meeting.
• Considerations: whether to increase, maintain, or offer tiered/discounted options.

8. Delegate Target
• Target for 2026 Jinan Conference: 170 attendees.

9. Fundraising Ideas
• Raffle system — fundraising goal: ¥50,000 RMB.
• County contest representing Liberia's 15 counties.
• Sponsor outreach to begin after confirmation hearings.

10. Media & Promotional Plans
• Media team to begin creating flyers and write-ups immediately.
• Share conference information on social media after confirmation hearing.
• Use available photos/videos from Olano for initial promotional content.

ACTION POINTS
─────────────────────────────────────────

ALL SUBCOMMITTEE CHAIRS
1. Create your subcommittee group chats before Thursday. Include Chairman, Co-Chair, and General Secretary in every group.
2. Develop a detailed plan of action and submit to Chair, Co-Chair, and General Secretary.
3. Begin developing budget proposals for your area (plan for 170 people).
4. Come to Thursday's meeting with concrete proposals and updates.

ALL COMMITTEE MEMBERS
5. Prepare for confirmation hearing on Tuesday, April 14, 2026 — update your CV in PDF format.
6. Be prepared to answer questions about your contributions and new ideas for the conference.
7. Identify volunteers for your committee; recognize them in conference materials.
8. Collect information about attendee food preferences and allergies for the Cooking Committee.
9. Brainstorm fundraising activities for discussion at the next meeting.
10. Review these minutes when shared by the General Secretary.

COOKING COMMITTEE (Kukor Brooks)
11. Plan food quantities and options for approximately 170 people.
12. Account for dietary restrictions and food preferences.
13. Submit food list and initial budget proposal by Thursday.

SPORTS COMMITTEE (Jefferson T Banquando)
14. Begin contacting city leaders and representatives to organize sports activities.
15. Begin identifying and recruiting players across cities.

LOGISTICS COMMITTEE (Robert D Molley)
16. Develop logistics framework and recruit additional volunteers.
17. Begin planning accommodation and conference registration logistics.

MEDIA & PUBLICITY (Abdul Corneh)
18. Begin media strategy — create flyers and write-ups immediately.
19. Release content after confirmation hearing, using Olano's photos and videos.
20. Launch social media campaign to promote the conference.

PRESIDENT OLANO
21. Send photos and detailed list of leftover items from previous conference to the group chat.

ALL MEMBERS
22. Begin planning and organizing county contest if agreed upon by the committee.
23. Develop the full conference budget for CoC submission.
24. Begin planning the Awards / Program Night.
25. Begin planning pool and recreational activities at the hotel.
26. Begin developing the conference fee structure for discussion next Thursday.
27. Begin planning sponsor outreach strategy (after confirmation hearings).

NEXT MEETING
─────────────────────────────────────────
Date:    Thursday, April 16, 2026
Time:    9:00 PM (LSUIC Zoom)
Link:    https://us02web.zoom.us/j/2312312006?pwd=ZHh3V2dXZGJ6Y2NCa0IxczdOaWJVQT09
Zoom ID: 2312312006 · Password: LSUIC2006
Agenda:  Subcommittee reports, confirmation hearing recap, conference fee proposals, initial budget drafts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Meeting adjourned with a prayer led by Enoch.
Minutes recorded by: Harris M Bowulo (General Secretary)`;

export const FIRST_MEETING_AGENDA = `CONFERENCE COMMITTEE MEETING AGENDA
Date: April 10, 2026
Time: 21:00 - 22:05
Venue: LSUIC ZOOM
Presiding: Committee Chairman

1. OPENING FORMALITIES (10 minutes)
- Opening Prayer
- Welcome Remarks by the Chairman
- Self-Introduction of Members

2. DISCUSSION (30 minutes)
- Review of Previous Conference (Lessons + Key Questions + Available Documents)
- Committee Structure (Main Committees Needed)
- Meeting Schedule (Set recurring time or agree on flexible schedule)
- Sub-Committee Creation Process (Guidelines & Approval Flow)
- Timeline & Key Milestones
- Cooking Committee Budget: amount, items, responsibilities - 170 persons; meal type
- Action Items, Next Steps & Next Meeting Date

3. AOB (20 minutes)

4. Closing Prayer (5 minutes)`;

// Meeting schedule: #1 = April 10 (Fri), then Thursdays weekly from April 16
function buildMeetingDates(count: number): string[] {
  const dates: string[] = [];
  // Meeting 1: April 10, 2026 (Friday)
  dates.push("2026-04-10");
  // Meetings 2+: weekly Thursdays starting April 16
  const start = new Date("2026-04-16");
  for (let i = 1; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + (i - 1) * 7);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function buildStandardAgenda(
  theme: string,
  focusItems: string[],
  decision: string,
  aobNote?: string,
): string {
  const lines: string[] = [
    `Theme: ${theme}`,
    "- Opening Prayer",
    "- Recap of previous meeting",
    "- Discussion",
    ...focusItems.map((item) => `  - ${item}`),
    `  - Decision: ${decision}`,
    "- Action Points (assign tasks and expected feedback next meeting)",
    aobNote ? `- AOB: ${aobNote}` : "- AOB",
    "- Closing Prayer",
  ];

  return lines.join("\n");
}

const MEETING_TOPICS = [
  FIRST_MEETING_AGENDA,
  buildStandardAgenda(
    "Hearing Wrap and Publicity Kickoff",
    [
      "Confirm hearing outcomes and quick updates from Cooking, Media, Logistics, Sports, and Decoration",
      "Finalize fee communication and publicity message for this week",
      "Start 3-day publicity run immediately after the meeting",
      "Issue fundraising idea call so every team comes prepared for Meeting #3",
    ],
    "Approve publicity rollout and post-publicity signup timing",
    "Each committee submits at least one fundraising idea before Meeting #3",
  ),
  buildStandardAgenda(
    "Execution and Fundraising Closeout",
    [
      "Review committee progress and unresolved blockers",
      "Finalize fundraising plan: target, channels, and timeline",
      "Assign fundraising responsible leads and reporting checkpoints",
    ],
    "Conclude fundraising plan and publish execution tracker",
  ),
  buildStandardAgenda(
    "Budget Implementation and Sponsor Execution",
    [
      "Review budget updates against the approved fundraising plan",
      "Track sponsor outreach execution and response status",
      "Close critical cost gaps and confirm immediate spending priorities",
    ],
    "Approve weekly budget implementation actions",
  ),
  buildStandardAgenda(
    "Registration and Payment Control",
    [
      "Review registration count, paid count, and verification delays",
      "Fix payment approval bottlenecks and dispute handling",
      "Confirm weekly registration and payment reporting",
    ],
    "Start weekly verified payment status reporting",
  ),
  buildStandardAgenda(
    "Program Structure",
    [
      "Finalize flow for sessions, elections, sports, and awards",
      "Close pending items for welcome and recreation blocks",
      "Resolve schedule and staffing conflicts",
    ],
    "Approve updated program structure",
  ),
  buildStandardAgenda(
    "Logistics and Rooming",
    [
      "Finalize rooming rules and transport updates",
      "Confirm check-in workflow and late-arrival handling",
      "Resolve logistics blockers raised by committee leads",
    ],
    "Lock rooming and movement operations plan",
  ),
  buildStandardAgenda(
    "Midpoint Recovery",
    [
      "Review overdue actions and root causes",
      "Re-assign delayed tasks with corrected deadlines",
      "Escalate unresolved dependencies for rapid decisions",
    ],
    "Approve recovery plan for delayed workstreams",
  ),
  buildStandardAgenda(
    "Materials and Production",
    [
      "Confirm final content for booklet, badges, shirts, and signage",
      "Validate print quantities from verified delegate numbers",
      "Confirm procurement deadlines and payment readiness",
    ],
    "Approve production release",
  ),
  buildStandardAgenda(
    "Operations Drill",
    [
      "Simulate registration flow and session transitions",
      "Confirm security, crowd control, and emergency contacts",
      "Resolve dry-run findings and assign fixes",
    ],
    "Sign off operations drill corrections",
  ),
  buildStandardAgenda(
    "Final Readiness Gate",
    [
      "Review open critical items and responsible leads",
      "Confirm delegate and volunteer communication package",
      "Validate payment closeout and unresolved balance cases",
    ],
    "Submit Go/No-Go recommendation",
  ),
  buildStandardAgenda(
    "Last Call and Contingencies",
    [
      "Confirm final roster and travel readiness",
      "Validate contingency plans for key risks",
      "Finalize awards, stage, and media run sheet",
    ],
    "Lock contingency checklist",
  ),
  buildStandardAgenda(
    "Pre-Conference Briefing",
    [
      "Confirm deployment assignments for committees and volunteers",
      "Align reporting rhythm for conference week",
      "Close final coordination gaps across teams",
    ],
    "Approve execution handoff",
  ),
  buildStandardAgenda(
    "Conference Week Command Briefing",
    [
      "Confirm day-by-day command flow and emergency contacts",
      "Review arrival support and first-day readiness checklist",
      "Confirm closure reporting expectations for all leads",
    ],
    "Activate conference week command protocol",
  ),
];

const DATES = buildMeetingDates(DEFAULT_MEETINGS_COUNT);

export function getDefaultMeetings(): DefaultMeetingSeed[] {
  return DATES.map((date, i) => ({
    meetingNo: i + 1,
    title:
      i === 0
        ? "First Committee Meeting"
        : `Weekly Committee Meeting #${i + 1}`,
    scheduled: date,
    location: i === 0 ? "LSUIC Zoom | Fri 9:00 PM" : "LSUIC Zoom | Thu 9:00 PM",
    agenda: MEETING_TOPICS[i] || "",
    minutes: i === 0 ? MEETING_1_MINUTES : null,
    minutesStatus: i === 0 ? "PENDING_APPROVAL" : "NONE",
    minutesSubmittedBy: i === 0 ? "Harris M Bowulo" : null,
    chairNote: null,
    status: i === 0 ? "DONE" : "SCHEDULED",
  }));
}
