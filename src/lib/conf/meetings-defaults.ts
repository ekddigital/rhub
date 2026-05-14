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
• Williamena Yah Munyenneh — Cooking Committee            → "Williamena Yah Munyenneh"
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
• 2026 fees are by attendance package (see registration), not a single flat-rate figure.
• Committee to finalize package amounts and publication timing by the next meeting.

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

// Meeting schedule realignment:
// #1 = April 10 (Fri), #2 = April 16 (Thu), #3 = April 30 (Thu),
// then Thursdays weekly thereafter.
function buildMeetingDates(count: number): string[] {
  const dates: string[] = [];
  // Meeting 1: April 10, 2026 (Friday)
  dates.push("2026-04-10");
  if (count === 1) return dates;

  // Meeting 2: April 16, 2026 (Thursday)
  dates.push("2026-04-16");
  if (count === 2) return dates;

  // Meeting 3+: weekly Thursdays starting April 30
  const start = new Date("2026-04-30");
  for (let i = 2; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + (i - 2) * 7);
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
    `  - ${decision}`,
    "- Action Points (assign tasks; expected feedback next meeting)",
    aobNote ? `- AOB: ${aobNote}` : "- AOB",
    "- Closing Prayer",
  ];

  return lines.join("\n");
}

const MEETING_3_AGENDA = `Theme: Execution and Fundraising Closeout
- 21:00-21:02 (2 mins) Opening Prayer
- 21:02-21:07 (5 mins) Recap of Meeting #2
  - Confirm completed items.
  - Confirm unresolved blockers and responsible leads.
- 21:07-21:19 (12 mins) Committee Progress and Blockers
  - Each committee gives concise status (completed, in progress, blocked), strict cap: 2 minutes per committee.
  - Timekeeper cuts overrun and parks deep issues for follow-up.
- 21:19-21:27 (8 mins) Final Conference Fees Confirmation
  - Approve final fee table and payment timeline for publication.
  - Confirm communication language for members, guests, and patrons.
- 21:27-21:37 (10 mins) Fundraising Plan Confirmation
  - Confirm target amount, campaign channels (letters, direct outreach, digital, events), and campaign window/date(s).
- 21:37-21:44 (7 mins) Fundraising Leads and Reporting Checkpoints
  - Assign one lead and one backup per channel/workstream.
  - Set weekly reporting checkpoints and reporting format.
- 21:44-21:52 (8 mins) Fundraising Communications Kickoff
  - Confirm flyer concept, Media Committee lead, and first release date.
  - Approve fundraiser letter template, recipient segments, and distribution schedule.
- 21:52-21:56 (4 mins) Decision and Formal Approvals
  - Conclude and approve the fundraising plan.
  - Confirm immediate publication of the execution tracker.
- 21:56-22:04 (8 mins) Action Points
  - Assign responsible lead, backup, deadline, expected feedback format, and priority level.
- 22:04-22:08 (4 mins) AOB
- 22:08-22:10 (2 mins) Closing Prayer`;

/** Meeting #4 — May 7, 2026 — budget working session in the hub. */
export const MEETING_4_AGENDA = `Theme: Committee Budget Build-Out & Platform Hands-On
- Opening Prayer
- Recap of previous meeting
- Discussion
  - Souvenirs / branded items — confirm list, quantities, owner
  - Hub Budget module — hands-on; chairs draft or update lines; fix blockers live
  - Letters / outreach — follow-up owners and check-ins
  - Committees — brief win or one blocker each (keep short)
  - Target: draft committee budgets in hub before next meeting; one person owns roll-up for Chair/Finance
- Action Points (assign tasks; expected feedback next meeting)
- AOB
- Closing Prayer`;

const MEETING_TOPICS = [
  FIRST_MEETING_AGENDA,
  buildStandardAgenda(
    "Hearing Wrap and Publicity Kickoff",
    [
      "Confirm hearing outcomes and unresolved questions from Cooking, Media, Logistics, Sports, and Decoration",
      "Approve the 'What to Expect at LSUIC 2026' promotional flyer for immediate release",
      "Assign hotel media capture deliverables: conference hall, pool, dining hall, dinner hall, and hotel yard",
      "Confirm the 3-day publicity schedule and posting responsibilities",
    ],
    "Approve promo rollout and confirm signup flyer publication gate after full publicity window",
    "Each committee submits one fundraising idea and one sponsor lead before Meeting #3",
  ),
  MEETING_3_AGENDA,
  MEETING_4_AGENDA,
  buildStandardAgenda(
    "Committee Budget Presentation Review and Funding Follow-Through",
    [
      "Committee-by-committee budget presentations and line-item review (primary focus)",
      "Finalize souvenir package proposal and budget",
      "Design conference talk-show structure together: format, segments, hosts, guests, and support roles",
    ],
    "Approve revised committee budgets, freeze immediate spending priorities, and confirm final submission deadlines",
  ),
  buildStandardAgenda(
    "Program Design and Speaker Coordination",
    [
      "Confirm day-by-day program framework and session time blocks",
      "Assign speaker outreach ownership, bio collection, and confirmation deadlines",
      "Confirm moderation, protocol, and timekeeping assignments",
      "Review open dependencies affecting final run-sheet development",
    ],
    "Approve draft program structure and speaker coordination plan",
  ),
  buildStandardAgenda(
    "Logistics, Rooming, and Operations Readiness",
    [
      "Finalize rooming policy, room assignment process, and check-in/check-out controls",
      "Confirm transport, movement support, and arrival-assistance process",
      "Confirm AV, venue operations, and emergency-response preparation",
      "Review unresolved logistics blockers and escalation actions",
    ],
    "Approve rooming and logistics operations plan",
  ),
  buildStandardAgenda(
    "Midpoint Recovery",
    [
      "Review overdue action items against section deadlines in the master plan",
      "Re-assign delayed work with corrected deadlines and backup leads",
      "Escalate unresolved dependencies requiring Chair/NEC intervention",
      "Confirm weekly variance-report format for governance and finance",
    ],
    "Approve midpoint recovery plan and escalation tracker",
  ),
  buildStandardAgenda(
    "Booklet, Branding, and Production Gate",
    [
      "Finalize booklet contents, emergency details, and committee/delegate profile completeness",
      "Confirm final quantities for badges, tags, signage, and souvenir materials",
      "Review vendor readiness, payment status, and production timeline risks",
      "Approve print and branding freeze checklist",
    ],
    "Approve production release and design freeze",
  ),
  buildStandardAgenda(
    "Operations Drill and Event Control Systems",
    [
      "Run simulation for registration desk, payment exceptions, and session transitions",
      "Validate operations control logs: minutes, decisions, finance receipts, and incident handling",
      "Confirm command flow for protocol, ushering, and media coordination",
      "Resolve dry-run findings and assign corrective actions with deadlines",
    ],
    "Approve operations drill corrections and event-control readiness",
  ),
  buildStandardAgenda(
    "Final Readiness and Conference Week Authorization",
    [
      "Review all open critical actions and close/no-close status by committee",
      "Confirm delegate communications package: arrival guide, FAQ, and conduct instructions",
      "Validate payment closeout status, unresolved balances, and rooming finalization",
      "Confirm team deployment schedule for conference week",
    ],
    "Submit formal Go/No-Go recommendation with documented risk posture",
  ),
  buildStandardAgenda(
    "Contingency and Last-Mile Coordination",
    [
      "Confirm final roster, late-arrival cases, and travel support readiness",
      "Validate contingency plans for finance, logistics, program, and communication risks",
      "Finalize awards-night, stage management, and media coverage run-sheet",
      "Confirm fallback decision path for same-day operational disruptions",
    ],
    "Approve contingency protocol and last-mile execution checklist",
  ),
  buildStandardAgenda(
    "Pre-Conference Command Briefing",
    [
      "Confirm final deployment assignments for committees and volunteers",
      "Align reporting rhythm and escalation windows for conference days",
      "Confirm opening-day script ownership and timing responsibilities",
      "Close final cross-team coordination gaps before on-site setup",
    ],
    "Approve execution handoff from planning to command mode",
  ),
  buildStandardAgenda(
    "Conference Week Command Briefing",
    [
      "Confirm day-by-day command flow, emergency contacts, and duty roster",
      "Review arrival support readiness and first-day opening checklist",
      "Confirm daily reporting expectations: minutes, decision log, finance log, and incidents",
      "Set closeout reporting deadlines for post-event submissions",
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
