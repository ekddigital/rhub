"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  LogIn,
  ShieldCheck,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/contexts/user-context";

type MinutesStatus = "NONE" | "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "CHANGES_REQUESTED";

type Meeting = {
  id: string;
  title: string;
  meetingNo: number;
  scheduled: string;
  location: string;
  agenda: string;
  minutes: string;
  minutesStatus: MinutesStatus;
  minutesSubmittedBy: string | null;
  chairNote: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
};

const STATUS_CONFIG = {
  SCHEDULED: { label: "Scheduled", variant: "outline" as const, icon: Clock },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "default" as const,
    icon: AlertCircle,
  },
  DONE: { label: "Completed", variant: "secondary" as const, icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const, icon: XCircle },
};

const MEETING_1_MINUTES = `LSUIC 2026 CONFERENCE COMMITTEE
Meeting #1 Minutes — April 10, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Convened by: Enoch Kwateh Dongbo (Chair)
Location: Online — WeChat
Time: Evening

ATTENDEES
─────────────────────────────────────────
• Enoch Kwateh Dongbo — Conference Chair (Jinan)
• Alfreda Ruth Togbah — Co-Chair (Suzhou)
• Harris M Bowulo — Financial Secretary / General Secretary (Beijing)
• Abdul Corneh — PRO / Media Chair (Zhengzhou)
• Kukor Brooks — Cooking Committee Chair (Jinan)
• Jefferson T Banquando — Sports Committee Chair (Suzhou)
• Robert D Molley — Logistics Committee Chair (Qufu)
• Priscilla Bamu Dweh — Cooking Committee (Suzhou)
• Williamena Yah SENET — Cooking Committee (Suzhou)
• Blessing Hawa Washington — Cooking Committee (Nantong)
• Lisa Y SET — Cooking Committee (Qingdao)
• Olano — LSUIC President
• Hon. Noah — NEC Representative

SUMMARY
─────────────────────────────────────────
This was the inaugural meeting of the 2026 LSUIC Conference Committee. All committee members were introduced and outlined their roles. The cooking committee reported approximately 50% preparation completion. The meeting focused on establishing team relationships, communication channels, and the overall planning direction for the Jinan conference — LSUIC's 20th Anniversary Conference.

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
• All 11 appointees require NEC confirmation hearing (scheduled for next week).
• Subcommittees may recruit volunteers — volunteers do NOT require NEC confirmation.
• All subcommittee chairs to create group chats before Thursday, including Chair, Co-Chair, and General Secretary in every group.

5. Subcommittees Established
• Cooking Committee — Kukor Brooks (Chair)
• Sports Committee — Jefferson T Banquando (Chair)
• Logistics Committee — Robert D Molley (Chair)
• Media & Publicity — Abdul Corneh (Chair)
• Decoration Committee — Volunteer-led (no NEC confirmation required)

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
5. Prepare for confirmation hearing next week — update your CV in PDF format.
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
23. Develop the full conference budget for NEC submission.
24. Begin planning the Awards / Program Night.
25. Begin planning pool and recreational activities at the hotel.
26. Begin developing the conference fee structure for discussion next Thursday.
27. Begin planning sponsor outreach strategy (after confirmation hearings).

NEXT MEETING
─────────────────────────────────────────
Date:    Thursday, April 16, 2026
Time:    9:00 PM (Online — WeChat)
Agenda:  Subcommittee reports, confirmation hearing prep, conference fee proposals, initial budget drafts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Meeting adjourned with a prayer led by Enoch.
Minutes recorded by: Harris M Bowulo (General Secretary)`;

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

const MEETING_TOPICS = [
  "Kickoff — roles, timeline, system overview",
  "Subcommittee reports, confirmation hearing recap, fee proposals",
  "Delegate outreach plan, venue coordination",
  "Budget approval, registration system launch",
  "Progress check, logistics planning",
  "Mid-point review, payment tracking",
  "Program / agenda draft, speaker confirmations",
  "Document review, certificate design",
  "Final budget review, payment status",
  "Program finalization, printing prep",
  "Logistics finalization, travel coordination",
  "Final review, contingency planning",
  "Last call — all materials ready",
  "Pre-conference briefing",
];

const DATES = buildMeetingDates(14);

const INITIAL_MEETINGS: Meeting[] = DATES.map((date, i) => ({
  id: `meeting_${i + 1}`,
  title: i === 0 ? "First Committee Meeting" : `Weekly Committee Meeting #${i + 1}`,
  meetingNo: i + 1,
  scheduled: date,
  location: i === 0 ? "Online — WeChat (Friday)" : "Online — WeChat | Thu 9:00 PM",
  agenda: MEETING_TOPICS[i] || "",
  minutes: i === 0 ? MEETING_1_MINUTES : "",
  minutesStatus: (i === 0 ? "PENDING_APPROVAL" : "NONE") as MinutesStatus,
  minutesSubmittedBy: i === 0 ? "Harris M Bowulo" : null,
  chairNote: null,
  status: i === 0 ? "DONE" : ("SCHEDULED" as const),
}));

function isChair(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function MeetingsShell() {
  const { user, loading } = useUser();
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState("");
  const [chairNote, setChairNote] = useState("");
  const [requestingChanges, setRequestingChanges] = useState(false);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setRequestingChanges(false);
    } else {
      const meeting = meetings.find((m) => m.id === id);
      setExpandedId(id);
      setEditMinutes(meeting?.minutes ?? "");
      setChairNote(meeting?.chairNote ?? "");
      setRequestingChanges(false);
    }
  };

  const saveDraft = (id: string) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              minutes: editMinutes,
              minutesStatus: "DRAFT",
              minutesSubmittedBy: user?.name ?? null,
            }
          : m,
      ),
    );
  };

  const submitForApproval = (id: string) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              minutes: editMinutes,
              minutesStatus: "PENDING_APPROVAL",
              minutesSubmittedBy: user?.name ?? null,
              status: "DONE",
            }
          : m,
      ),
    );
    setExpandedId(null);
  };

  const approveMinutes = (id: string) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, minutesStatus: "APPROVED", chairNote: null }
          : m,
      ),
    );
    setExpandedId(null);
  };

  const requestChanges = (id: string) => {
    if (!chairNote.trim()) return;
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              minutesStatus: "CHANGES_REQUESTED",
              chairNote: chairNote,
            }
          : m,
      ),
    );
    setExpandedId(null);
    setRequestingChanges(false);
  };

  const completed = meetings.filter((m) => m.status === "DONE").length;
  const canEdit = !loading && !!user;
  const canApprove = !loading && !!user && isChair(user.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-sm text-muted-foreground">
            {completed}/{meetings.length} meetings completed · Thursdays 9:00 PM
          </p>
        </div>
      </div>

      {/* Auth notice for non-logged-in users */}
      {!loading && !user && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <LogIn className="size-5 shrink-0 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Sign in to add or edit meeting minutes</p>
              <p className="text-xs text-muted-foreground">
                Approved minutes are visible to everyone. Submitting minutes requires an account.
              </p>
            </div>
            <Link href="/login">
              <Button size="sm" variant="outline">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Meeting List */}
      <div className="space-y-3">
        {meetings.map((meeting) => {
          const config = STATUS_CONFIG[meeting.status];
          const StatusIcon = config.icon;
          const isExpanded = expandedId === meeting.id;
          const meetingDate = new Date(meeting.scheduled);

          const hasMinutes = meeting.minutesStatus !== "NONE" && meeting.minutes;

          return (
            <Card
              key={meeting.id}
              className={`transition-all ${isExpanded ? "border-[#C8A061]/50" : ""}`}
            >
              {/* Card header row — always visible */}
              <CardContent
                className="cursor-pointer pt-4 pb-4"
                onClick={() => toggleExpand(meeting.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-lg text-sm font-bold ${
                        meeting.minutesStatus === "APPROVED"
                          ? "bg-[#C8A061]/15 text-[#C8A061]"
                          : "bg-muted"
                      }`}
                    >
                      #{meeting.meetingNo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{meeting.title}</p>
                        {meeting.minutesStatus === "APPROVED" && (
                          <Badge className="h-5 gap-1 bg-emerald-500/15 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                            <ShieldCheck className="size-3" />
                            Final
                          </Badge>
                        )}
                        {meeting.minutesStatus === "PENDING_APPROVAL" && (
                          <Badge variant="outline" className="h-5 text-xs text-amber-600 border-amber-500/40">
                            <Clock className="mr-1 size-3" />
                            Awaiting Approval
                          </Badge>
                        )}
                        {meeting.minutesStatus === "CHANGES_REQUESTED" && (
                          <Badge variant="destructive" className="h-5 text-xs">
                            <RotateCcw className="mr-1 size-3" />
                            Changes Requested
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {meetingDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {meeting.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.variant}>
                      <StatusIcon className="mr-1 size-3" />
                      {config.label}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {meeting.agenda && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Agenda:</span> {meeting.agenda}
                  </p>
                )}

                {/* Minutes preview (collapsed, APPROVED only for everyone; PENDING for logged-in) */}
                {!isExpanded && hasMinutes && (
                  <>
                    {meeting.minutesStatus === "APPROVED" && (
                      <div className="mt-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                        <div className="mb-1 flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                          <ShieldCheck className="size-3.5" />
                          Official Minutes
                          {meeting.minutesSubmittedBy && (
                            <span className="font-normal text-muted-foreground">
                              · recorded by {meeting.minutesSubmittedBy}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {meeting.minutes.substring(0, 200)}
                          {meeting.minutes.length > 200 ? "…" : ""}
                        </p>
                      </div>
                    )}
                    {meeting.minutesStatus === "PENDING_APPROVAL" && canEdit && (
                      <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                        <Clock className="mr-1.5 inline size-3.5" />
                        Minutes submitted by{" "}
                        <span className="font-medium">
                          {meeting.minutesSubmittedBy}
                        </span>{" "}
                        — pending Chair confirmation.
                      </div>
                    )}
                    {meeting.minutesStatus === "CHANGES_REQUESTED" && canEdit && (
                      <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/5 p-3 text-xs">
                        <p className="font-medium text-red-600 dark:text-red-400">
                          Chair&apos;s note:
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {meeting.chairNote}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>

              {/* Expanded panel */}
              {isExpanded && (
                <CardContent
                  className="border-t pt-4 pb-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* === APPROVED: read-only for everyone === */}
                  {meeting.minutesStatus === "APPROVED" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-emerald-500" />
                        <span className="text-sm font-medium">Official Meeting Minutes</span>
                        {meeting.minutesSubmittedBy && (
                          <span className="text-xs text-muted-foreground">
                            · recorded by {meeting.minutesSubmittedBy}
                          </span>
                        )}
                      </div>
                      <pre className="max-h-125 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-xs leading-relaxed">
                        {meeting.minutes}
                      </pre>
                      {/* Chair can still edit approved minutes */}
                      {canApprove && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMeetings((prev) =>
                              prev.map((m) =>
                                m.id === meeting.id
                                  ? { ...m, minutesStatus: "DRAFT" }
                                  : m,
                              ),
                            );
                          }}
                        >
                          <FileText className="size-4" />
                          Edit Minutes
                        </Button>
                      )}
                    </div>
                  )}

                  {/* === PENDING_APPROVAL: chair sees approve/request-changes; others see preview === */}
                  {meeting.minutesStatus === "PENDING_APPROVAL" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="size-4 text-amber-500" />
                        <span className="font-medium">Submitted for your review</span>
                        {meeting.minutesSubmittedBy && (
                          <span className="text-muted-foreground">
                            by {meeting.minutesSubmittedBy}
                          </span>
                        )}
                      </div>

                      {canEdit && (
                        <pre className="max-h-100 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-xs leading-relaxed">
                          {meeting.minutes}
                        </pre>
                      )}

                      {canApprove && !requestingChanges && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => approveMinutes(meeting.id)}
                          >
                            <ShieldCheck className="size-4" />
                            Approve as Final
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRequestingChanges(true)}
                          >
                            <RotateCcw className="size-4" />
                            Request Changes
                          </Button>
                        </div>
                      )}

                      {canApprove && requestingChanges && (
                        <div className="space-y-2">
                          <Label>Your note for the Secretary</Label>
                          <Textarea
                            placeholder="Describe the changes needed before these minutes can be approved..."
                            value={chairNote}
                            onChange={(e) => setChairNote(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => requestChanges(meeting.id)}
                              disabled={!chairNote.trim()}
                            >
                              Send Back for Revision
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRequestingChanges(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {!canApprove && canEdit && (
                        <p className="text-xs text-muted-foreground">
                          These minutes are awaiting confirmation from the Chair before they
                          become the official record.
                        </p>
                      )}

                      {!canEdit && (
                        <p className="text-xs text-muted-foreground">
                          Sign in to view and manage minutes.
                        </p>
                      )}
                    </div>
                  )}

                  {/* === CHANGES_REQUESTED: secretary/member edits and re-submits === */}
                  {meeting.minutesStatus === "CHANGES_REQUESTED" && (
                    <div className="space-y-3">
                      {meeting.chairNote && (
                        <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">
                            Chair&apos;s revision note:
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {meeting.chairNote}
                          </p>
                        </div>
                      )}
                      {canEdit ? (
                        <>
                          <Label>Revise Minutes</Label>
                          <Textarea
                            value={editMinutes}
                            onChange={(e) => setEditMinutes(e.target.value)}
                            rows={12}
                            className="font-mono text-xs"
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setExpandedId(null)}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => submitForApproval(meeting.id)}>
                              <FileText className="size-4" />
                              Re-submit for Approval
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Lock className="size-4" />
                          Sign in to revise these minutes.
                        </div>
                      )}
                    </div>
                  )}

                  {/* === NO MINUTES or DRAFT: edit form === */}
                  {(meeting.minutesStatus === "NONE" || meeting.minutesStatus === "DRAFT") && (
                    <>
                      {canEdit ? (
                        <div className="space-y-3">
                          <Label>
                            {meeting.minutesStatus === "DRAFT"
                              ? "Continue editing draft minutes"
                              : "Add Meeting Minutes"}
                          </Label>
                          <Textarea
                            placeholder="Record meeting minutes here..."
                            value={editMinutes}
                            onChange={(e) => setEditMinutes(e.target.value)}
                            rows={10}
                            className="font-mono text-xs"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => saveDraft(meeting.id)}
                              disabled={!editMinutes.trim()}
                            >
                              Save Draft
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => submitForApproval(meeting.id)}
                              disabled={!editMinutes.trim()}
                            >
                              <FileText className="size-4" />
                              Submit for Chair Approval
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 py-2">
                          <Lock className="size-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Minutes not yet recorded</p>
                            <p className="text-xs text-muted-foreground">
                              Committee members must{" "}
                              <Link href="/login" className="underline">
                                sign in
                              </Link>{" "}
                              to add or edit meeting minutes.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

