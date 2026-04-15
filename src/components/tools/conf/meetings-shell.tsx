"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  FileText,
  ListChecks,
  Plus,
  Circle,
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useUser } from "@/contexts/user-context";
import {
  FIRST_MEETING_AGENDA,
  getDefaultMeetings,
} from "@/lib/conf/meetings-defaults";
import {
  CATEGORY_LABELS,
  createInitialTimelineItems,
  getTimelineStats,
  sortTimelineItems,
  toUiTimelineItem,
  type TimelineDbRecord,
  type TimelineItem,
} from "@/lib/conf/timeline-client";

type MinutesStatus =
  | "NONE"
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "CHANGES_REQUESTED";

type Meeting = {
  id: string;
  dbId: string | null;
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

type MeetingProgressSnapshot = Pick<
  Meeting,
  | "id"
  | "minutes"
  | "minutesStatus"
  | "minutesSubmittedBy"
  | "chairNote"
  | "status"
>;

type MeetingDbRecord = {
  id: string;
  title: string;
  meetingNo: number;
  scheduled: string;
  location: string | null;
  agenda: string | null;
  minutes: string | null;
  minutesStatus: MinutesStatus | null;
  minutesSubmittedBy: string | null;
  chairNote: string | null;
  status: Meeting["status"];
};

type ChecklistDraft = {
  title: string;
  description: string;
  date: string;
  responsibleLead: string;
  category: string;
  isCritical: boolean;
};

const STATUS_CONFIG = {
  SCHEDULED: { label: "Scheduled", variant: "outline" as const, icon: Clock },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "default" as const,
    icon: AlertCircle,
  },
  DONE: {
    label: "Completed",
    variant: "secondary" as const,
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

const MEETING_AGENDA_STORAGE_KEY = "conf-meeting-agendas-v7";
const MEETING_PROGRESS_STORAGE_KEY = "conf-meeting-progress-v1";
const MEETINGS_DB_CACHE_KEY = "conf-meetings-db-cache-v1";
const MEETINGS_LEGACY_MIGRATED_KEY = "conf-meetings-legacy-migrated-v1";

const INITIAL_MEETINGS: Meeting[] = getDefaultMeetings().map((meeting) => ({
  id: `meeting_${meeting.meetingNo}`,
  dbId: null,
  title: meeting.title,
  meetingNo: meeting.meetingNo,
  scheduled: meeting.scheduled,
  location: meeting.location ?? "",
  agenda: meeting.agenda,
  minutes: meeting.minutes ?? "",
  minutesStatus: meeting.minutesStatus,
  minutesSubmittedBy: meeting.minutesSubmittedBy,
  chairNote: meeting.chairNote,
  status: meeting.status,
}));

function canApproveMinutesRole(role: string): boolean {
  // "ADMIN" represents chair-level control in the platform role model.
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "CHAIR";
}

function isSuperAdminRole(role: string): boolean {
  return role === "SUPER_ADMIN";
}

function canEditChecklistRole(role: string): boolean {
  // "ADMIN" represents chair-level control in the platform role model.
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "CHAIR";
}

export function MeetingsShell() {
  const { user, loading } = useUser();
  const [confId, setConfId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    if (typeof window === "undefined") return INITIAL_MEETINGS;

    const cachedRaw = window.localStorage.getItem(MEETINGS_DB_CACHE_KEY);
    if (cachedRaw) {
      try {
        const parsed = JSON.parse(cachedRaw) as Meeting[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Ignore malformed DB cache.
      }
    }

    let hydrated = INITIAL_MEETINGS;

    const agendaRaw = window.localStorage.getItem(MEETING_AGENDA_STORAGE_KEY);
    if (agendaRaw) {
      try {
        const savedAgendas = JSON.parse(agendaRaw) as Record<string, string>;
        hydrated = hydrated.map((meeting) => {
          const customAgenda = savedAgendas[meeting.id];
          if (
            meeting.id === "meeting_1" &&
            customAgenda?.trim().startsWith("Theme: Kickoff Alignment")
          ) {
            return { ...meeting, agenda: FIRST_MEETING_AGENDA };
          }
          if (!customAgenda) return meeting;
          return { ...meeting, agenda: customAgenda };
        });
      } catch {
        // Ignore malformed agenda cache.
      }
    }

    const progressRaw = window.localStorage.getItem(
      MEETING_PROGRESS_STORAGE_KEY,
    );
    if (progressRaw) {
      try {
        const savedProgress = JSON.parse(
          progressRaw,
        ) as MeetingProgressSnapshot[];
        const progressById = new Map(
          savedProgress.map((item) => [item.id, item]),
        );

        hydrated = hydrated.map((meeting) => {
          const saved = progressById.get(meeting.id);
          if (!saved) return meeting;

          return {
            ...meeting,
            minutes: saved.minutes,
            minutesStatus: saved.minutesStatus,
            minutesSubmittedBy: saved.minutesSubmittedBy,
            chairNote: saved.chairNote,
            status: saved.status,
          };
        });
      } catch {
        // Ignore malformed progress cache.
      }
    }

    return hydrated;
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState("");
  const [chairNote, setChairNote] = useState("");
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null);
  const [agendaDraft, setAgendaDraft] = useState("");
  const [checklistItems, setChecklistItems] = useState<TimelineItem[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [showNewChecklistItem, setShowNewChecklistItem] = useState(false);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(
    null,
  );
  const [editingChecklistDraft, setEditingChecklistDraft] =
    useState<ChecklistDraft | null>(null);
  const [newChecklistDraft, setNewChecklistDraft] = useState<ChecklistDraft>({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    responsibleLead: "",
    category: "governance",
    isCritical: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      MEETINGS_DB_CACHE_KEY,
      JSON.stringify(meetings),
    );
  }, [meetings]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    function normalizeDate(value: unknown): string {
      if (typeof value !== "string") return "";
      return value.includes("T") ? value.split("T")[0] : value;
    }

    function toUiMeeting(db: MeetingDbRecord): Meeting {
      return {
        id: `meeting_${db.meetingNo}`,
        dbId: db.id,
        title: db.title,
        meetingNo: db.meetingNo,
        scheduled: normalizeDate(db.scheduled),
        location: db.location ?? "",
        agenda: db.agenda ?? "",
        minutes: db.minutes ?? "",
        minutesStatus: (db.minutesStatus ?? "NONE") as MinutesStatus,
        minutesSubmittedBy: db.minutesSubmittedBy ?? null,
        chairNote: db.chairNote ?? null,
        status: db.status,
      };
    }

    async function migrateLegacyToDb(
      activeConfId: string,
      current: Meeting[],
    ): Promise<boolean> {
      const agendaRaw = window.localStorage.getItem(MEETING_AGENDA_STORAGE_KEY);
      const progressRaw = window.localStorage.getItem(
        MEETING_PROGRESS_STORAGE_KEY,
      );

      if (!agendaRaw && !progressRaw) return false;

      let savedAgendas: Record<string, string> = {};
      if (agendaRaw) {
        try {
          savedAgendas = JSON.parse(agendaRaw) as Record<string, string>;
        } catch {
          savedAgendas = {};
        }
      }

      let savedProgressById = new Map<string, MeetingProgressSnapshot>();
      if (progressRaw) {
        try {
          const parsed = JSON.parse(progressRaw) as MeetingProgressSnapshot[];
          if (Array.isArray(parsed)) {
            savedProgressById = new Map(parsed.map((item) => [item.id, item]));
          }
        } catch {
          savedProgressById = new Map();
        }
      }

      let attempted = false;
      let failed = false;

      for (const meeting of current) {
        if (!meeting.dbId) continue;

        const updates: Record<string, unknown> = {};

        const customAgenda = savedAgendas[meeting.id];
        if (typeof customAgenda === "string" && customAgenda.trim()) {
          if (
            meeting.id === "meeting_1" &&
            customAgenda.trim().startsWith("Theme: Kickoff Alignment")
          ) {
            // Ignore obsolete meeting #1 template.
          } else if (!meeting.agenda.trim()) {
            updates.agenda = customAgenda.trim();
          }
        }

        const saved = savedProgressById.get(meeting.id);
        if (saved) {
          if (
            typeof saved.minutes === "string" &&
            saved.minutes &&
            !meeting.minutes
          ) {
            updates.minutes = saved.minutes;
          }

          if (
            typeof saved.minutesStatus === "string" &&
            meeting.minutesStatus === "NONE" &&
            saved.minutesStatus !== "NONE"
          ) {
            updates.minutesStatus = saved.minutesStatus;
          }

          if (
            typeof saved.chairNote === "string" &&
            saved.chairNote &&
            !meeting.chairNote
          ) {
            updates.chairNote = saved.chairNote;
          }

          if (
            typeof saved.status === "string" &&
            meeting.status === "SCHEDULED" &&
            saved.status !== "SCHEDULED"
          ) {
            updates.status = saved.status;
          }
        }

        if (Object.keys(updates).length === 0) continue;

        attempted = true;
        try {
          const res = await fetch(
            `/api/conf/${activeConfId}/meetings/${meeting.dbId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updates),
            },
          );
          if (!res.ok) {
            failed = true;
          }
        } catch {
          failed = true;
        }
      }

      return attempted && !failed;
    }

    async function loadFromDb() {
      try {
        const confRes = await fetch("/api/conf/default", { cache: "no-store" });
        if (!confRes.ok) return;
        const conf = (await confRes.json()) as { id?: string };
        if (!conf?.id) return;
        if (cancelled) return;

        setConfId(conf.id);

        const listRes = await fetch(`/api/conf/${conf.id}/meetings`, {
          cache: "no-store",
        });
        if (!listRes.ok) return;
        const raw = (await listRes.json()) as unknown;
        if (!Array.isArray(raw) || raw.length === 0) return;

        let mapped = raw.map((entry) => toUiMeeting(entry as MeetingDbRecord));

        const legacyMigrated =
          window.localStorage.getItem(MEETINGS_LEGACY_MIGRATED_KEY) === "1";

        if (!legacyMigrated) {
          const didMigrate = await migrateLegacyToDb(conf.id, mapped);
          if (didMigrate) {
            window.localStorage.setItem(MEETINGS_LEGACY_MIGRATED_KEY, "1");
            window.localStorage.removeItem(MEETING_AGENDA_STORAGE_KEY);
            window.localStorage.removeItem(MEETING_PROGRESS_STORAGE_KEY);

            const refreshed = await fetch(`/api/conf/${conf.id}/meetings`, {
              cache: "no-store",
            });
            if (refreshed.ok) {
              const rawRefreshed = (await refreshed.json()) as unknown;
              if (Array.isArray(rawRefreshed) && rawRefreshed.length > 0) {
                mapped = rawRefreshed.map((entry) =>
                  toUiMeeting(entry as MeetingDbRecord),
                );
              }
            }
          }
        }

        if (cancelled) return;
        setMeetings(mapped);
      } catch {
        // Fall back to cached / default meetings.
      }
    }

    void loadFromDb();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!confId) return;

    let cancelled = false;

    async function loadChecklist() {
      setChecklistLoading(true);
      try {
        const res = await fetch(`/api/conf/${confId}/timeline`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Checklist fetch failed");

        const raw = (await res.json()) as unknown;
        if (!Array.isArray(raw)) throw new Error("Checklist payload invalid");

        const mapped = sortTimelineItems(
          raw.map((entry) => toUiTimelineItem(entry as TimelineDbRecord)),
        );
        if (cancelled) return;
        setChecklistItems(mapped);
      } catch {
        if (cancelled) return;
        setChecklistItems(sortTimelineItems(createInitialTimelineItems()));
      } finally {
        if (!cancelled) setChecklistLoading(false);
      }
    }

    void loadChecklist();

    return () => {
      cancelled = true;
    };
  }, [confId]);

  const patchMeeting = async (
    meetingId: string,
    updates: Record<string, unknown>,
  ) => {
    if (!confId) return;
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting?.dbId) return;

    try {
      const res = await fetch(`/api/conf/${confId}/meetings/${meeting.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) return;

      const updated = (await res.json()) as MeetingDbRecord;
      const scheduled =
        typeof updated.scheduled === "string" && updated.scheduled.includes("T")
          ? updated.scheduled.split("T")[0]
          : (updated.scheduled as string);

      const synced: Meeting = {
        id: `meeting_${updated.meetingNo}`,
        dbId: updated.id,
        title: updated.title,
        meetingNo: updated.meetingNo,
        scheduled,
        location: updated.location ?? "",
        agenda: updated.agenda ?? "",
        minutes: updated.minutes ?? "",
        minutesStatus: (updated.minutesStatus ?? "NONE") as MinutesStatus,
        minutesSubmittedBy: updated.minutesSubmittedBy ?? null,
        chairNote: updated.chairNote ?? null,
        status: updated.status,
      };

      setMeetings((prev) => prev.map((m) => (m.id === meetingId ? synced : m)));
    } catch {
      // Best-effort sync; local cache remains as fallback.
    }
  };

  const startChecklistEdit = (itemId: string) => {
    const item = checklistItems.find((entry) => entry.id === itemId);
    if (!item) return;

    setEditingChecklistId(itemId);
    setEditingChecklistDraft({
      title: item.title,
      description: item.description,
      date: item.date,
      responsibleLead: item.owner,
      category: item.category,
      isCritical: item.isCritical,
    });
  };

  const cancelChecklistEdit = () => {
    setEditingChecklistId(null);
    setEditingChecklistDraft(null);
  };

  const patchChecklistItem = async (
    itemId: string,
    updates: Record<string, unknown>,
  ) => {
    if (!confId) return;

    const item = checklistItems.find((entry) => entry.id === itemId);
    if (!item?.dbId) return;

    try {
      const res = await fetch(`/api/conf/${confId}/timeline/${item.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return;

      const updated = (await res.json()) as TimelineDbRecord;
      const synced = toUiTimelineItem(updated);
      setChecklistItems((prev) =>
        sortTimelineItems(
          prev.map((entry) => (entry.id === itemId ? synced : entry)),
        ),
      );
    } catch {
      // Best-effort sync; local state remains visible.
    }
  };

  const saveChecklistEdit = (itemId: string) => {
    if (!editingChecklistDraft) return;

    const title = editingChecklistDraft.title.trim();
    const date = editingChecklistDraft.date.trim();
    if (!title || !date) return;

    setChecklistItems((prev) =>
      sortTimelineItems(
        prev.map((entry) =>
          entry.id === itemId
            ? {
                ...entry,
                title,
                description: editingChecklistDraft.description.trim(),
                date,
                owner:
                  editingChecklistDraft.responsibleLead.trim() || "Unassigned",
                category: editingChecklistDraft.category,
                isCritical: editingChecklistDraft.isCritical,
              }
            : entry,
        ),
      ),
    );

    void patchChecklistItem(itemId, {
      title,
      description: editingChecklistDraft.description.trim(),
      date,
      responsibleLead: editingChecklistDraft.responsibleLead.trim(),
      category: editingChecklistDraft.category,
      isCritical: editingChecklistDraft.isCritical,
    });

    cancelChecklistEdit();
  };

  const toggleChecklistComplete = (itemId: string) => {
    const item = checklistItems.find((entry) => entry.id === itemId);
    if (!item) return;

    const next = !item.isCompleted;
    setChecklistItems((prev) =>
      prev.map((entry) =>
        entry.id === itemId ? { ...entry, isCompleted: next } : entry,
      ),
    );
    void patchChecklistItem(itemId, { isCompleted: next });
  };

  const addChecklistItem = async () => {
    if (!confId) return;

    const title = newChecklistDraft.title.trim();
    const date = newChecklistDraft.date.trim();
    if (!title || !date) return;

    try {
      const res = await fetch(`/api/conf/${confId}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: newChecklistDraft.description.trim(),
          date,
          responsibleLead: newChecklistDraft.responsibleLead.trim(),
          category: newChecklistDraft.category,
          isCritical: newChecklistDraft.isCritical,
          sortOrder: checklistItems.length,
        }),
      });
      if (!res.ok) return;

      const created = (await res.json()) as TimelineDbRecord;
      setChecklistItems((prev) =>
        sortTimelineItems([...prev, toUiTimelineItem(created)]),
      );
      setShowNewChecklistItem(false);
      setNewChecklistDraft({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        responsibleLead: "",
        category: "governance",
        isCritical: false,
      });
    } catch {
      // Best effort only.
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setRequestingChanges(false);
      setEditingAgendaId(null);
    } else {
      const meeting = meetings.find((m) => m.id === id);
      setExpandedId(id);
      setEditMinutes(meeting?.minutes ?? "");
      setChairNote(meeting?.chairNote ?? "");
      setAgendaDraft(meeting?.agenda ?? "");
      setRequestingChanges(false);
      setEditingAgendaId(null);
    }
  };

  const startAgendaEdit = (meetingId: string) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    setEditingAgendaId(meetingId);
    setAgendaDraft(meeting?.agenda ?? "");
  };

  const saveAgenda = (meetingId: string) => {
    const trimmed = agendaDraft.trim();
    if (!trimmed) return;
    setMeetings((prev) =>
      prev.map((meeting) =>
        meeting.id === meetingId ? { ...meeting, agenda: trimmed } : meeting,
      ),
    );
    setEditingAgendaId(null);
    void patchMeeting(meetingId, { agenda: trimmed });
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
    void patchMeeting(id, { minutes: editMinutes, minutesStatus: "DRAFT" });
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
    void patchMeeting(id, {
      minutes: editMinutes,
      minutesStatus: "PENDING_APPROVAL",
      status: "DONE",
    });
  };

  const approveMinutes = (id: string) => {
    if (!user || !canApproveMinutesRole(user.role)) return;
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, minutesStatus: "APPROVED", chairNote: null } : m,
      ),
    );
    setExpandedId(null);
    void patchMeeting(id, { minutesStatus: "APPROVED" });
  };

  const requestChanges = (id: string) => {
    if (!user || !canApproveMinutesRole(user.role)) return;
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
    void patchMeeting(id, {
      minutesStatus: "CHANGES_REQUESTED",
      chairNote,
    });
  };

  const reopenApprovedMinutes = (id: string) => {
    if (!user || !isSuperAdminRole(user.role)) return;
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              minutesStatus: "DRAFT",
              chairNote: null,
            }
          : m,
      ),
    );
    void patchMeeting(id, { minutesStatus: "DRAFT", chairNote: null });
  };

  const completed = meetings.filter((m) => m.status === "DONE").length;
  const checklistStats = getTimelineStats(checklistItems);
  const checklistTotal = checklistItems.length;
  const checklistCategoryOptions = Object.entries(CATEGORY_LABELS);
  const canEdit = !loading && !!user;
  const canEditChecklist =
    !loading && !!user && canEditChecklistRole(user.role);
  const canApproveMinutes =
    !loading && !!user && canApproveMinutesRole(user.role);
  const canReopenApprovedMinutes =
    !loading && !!user && isSuperAdminRole(user.role);
  const canEditAgenda = !loading && user?.role === "SUPER_ADMIN";

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
              <p className="text-sm font-medium">
                Sign in to add or edit meeting minutes
              </p>
              <p className="text-xs text-muted-foreground">
                Approved minutes are visible to everyone. Submitting minutes
                requires an account.
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

      {/* Conference Checklist */}
      <Card className="border-[#C8A061]/30">
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ListChecks className="size-5 text-[#C8A061]" />
                Conference Master Checklist
              </h2>
              <p className="text-xs text-muted-foreground">
                Track all required deliverables, what is done, and what is still
                pending.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Progress {checklistStats.progress}%
              </Badge>
              <Badge variant="outline" className="text-xs">
                Completed {checklistStats.completed}/{checklistTotal}
              </Badge>
              {canEditChecklist && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewChecklistItem((prev) => !prev)}
                >
                  <Plus className="size-4" />
                  Add Item
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              Overdue Open: {checklistStats.overdueOpen}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Due Soon (14d): {checklistStats.dueSoon}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Critical Open: {checklistStats.criticalOpen}
            </Badge>
          </div>

          {canEditChecklist && showNewChecklistItem && (
            <div className="space-y-3 rounded-lg border border-dashed border-[#C8A061]/40 bg-[#C8A061]/5 p-3">
              <p className="text-xs font-medium">Add checklist item</p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Task title</Label>
                  <Input
                    value={newChecklistDraft.title}
                    onChange={(e) =>
                      setNewChecklistDraft((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Complete Conference Program Outline for Day 1"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={newChecklistDraft.date}
                    onChange={(e) =>
                      setNewChecklistDraft((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={2}
                    value={newChecklistDraft.description}
                    onChange={(e) =>
                      setNewChecklistDraft((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Define scope, expected output, and review standard."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Responsible Lead</Label>
                  <Input
                    value={newChecklistDraft.responsibleLead}
                    onChange={(e) =>
                      setNewChecklistDraft((prev) => ({
                        ...prev,
                        responsibleLead: e.target.value,
                      }))
                    }
                    placeholder="Program Lead"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    value={newChecklistDraft.category}
                    onChange={(e) =>
                      setNewChecklistDraft((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {checklistCategoryOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={newChecklistDraft.isCritical}
                  onChange={(e) =>
                    setNewChecklistDraft((prev) => ({
                      ...prev,
                      isCritical: e.target.checked,
                    }))
                  }
                />
                Mark as critical
              </label>

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewChecklistItem(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => void addChecklistItem()}
                  disabled={!newChecklistDraft.title.trim() || !newChecklistDraft.date}
                >
                  Save Item
                </Button>
              </div>
            </div>
          )}

          {checklistLoading ? (
            <p className="text-xs text-muted-foreground">
              Loading checklist...
            </p>
          ) : checklistItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No checklist items found yet.
            </p>
          ) : (
            <div className="space-y-2">
              {checklistItems.map((item) => {
                const canManageItem = canEditChecklist && Boolean(item.dbId);
                const isEditing = editingChecklistId === item.id;

                return (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        {canEditChecklist ? (
                          <button
                            className="mt-0.5"
                            onClick={() => canManageItem && toggleChecklistComplete(item.id)}
                            disabled={!canManageItem}
                          >
                            {item.isCompleted ? (
                              <CheckCircle2 className="size-5 text-emerald-600" />
                            ) : (
                              <Circle className="size-5 text-muted-foreground" />
                            )}
                          </button>
                        ) : item.isCompleted ? (
                          <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                        ) : (
                          <Circle className="mt-0.5 size-5 text-muted-foreground" />
                        )}

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}
                          >
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            Responsible Lead: {item.owner}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          Due {new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </Badge>
                        {item.isCritical && (
                          <Badge
                            variant="outline"
                            className="border-red-500/40 bg-red-500/10 text-[10px] text-red-700"
                          >
                            Critical
                          </Badge>
                        )}
                        {canEditChecklist && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startChecklistEdit(item.id)}
                            disabled={!canManageItem}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {isEditing && editingChecklistDraft && (
                      <div className="mt-3 space-y-2 rounded-md border bg-muted/30 p-3">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Task title</Label>
                            <Input
                              value={editingChecklistDraft.title}
                              onChange={(e) =>
                                setEditingChecklistDraft((prev) =>
                                  prev
                                    ? { ...prev, title: e.target.value }
                                    : prev,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Due date</Label>
                            <Input
                              type="date"
                              value={editingChecklistDraft.date}
                              onChange={(e) =>
                                setEditingChecklistDraft((prev) =>
                                  prev
                                    ? { ...prev, date: e.target.value }
                                    : prev,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label>Description</Label>
                            <Textarea
                              rows={2}
                              value={editingChecklistDraft.description}
                              onChange={(e) =>
                                setEditingChecklistDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        description: e.target.value,
                                      }
                                    : prev,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Responsible Lead</Label>
                            <Input
                              value={editingChecklistDraft.responsibleLead}
                              onChange={(e) =>
                                setEditingChecklistDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        responsibleLead: e.target.value,
                                      }
                                    : prev,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Category</Label>
                            <select
                              value={editingChecklistDraft.category}
                              onChange={(e) =>
                                setEditingChecklistDraft((prev) =>
                                  prev
                                    ? { ...prev, category: e.target.value }
                                    : prev,
                                )
                              }
                              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                              {checklistCategoryOptions.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={editingChecklistDraft.isCritical}
                            onChange={(e) =>
                              setEditingChecklistDraft((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      isCritical: e.target.checked,
                                    }
                                  : prev,
                              )
                            }
                          />
                          Mark as critical
                        </label>

                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelChecklistEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveChecklistEdit(item.id)}
                            disabled={
                              !editingChecklistDraft.title.trim() ||
                              !editingChecklistDraft.date.trim()
                            }
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {canEditChecklist && checklistItems.some((item) => !item.dbId) && (
            <p className="text-[11px] text-muted-foreground">
              Some checklist rows are local fallback data and cannot be edited
              until timeline sync is available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Meeting List */}
      <div className="space-y-3">
        {meetings.map((meeting) => {
          const config = STATUS_CONFIG[meeting.status];
          const StatusIcon = config.icon;
          const isExpanded = expandedId === meeting.id;
          const meetingDate = new Date(meeting.scheduled);

          const hasMinutes =
            meeting.minutesStatus !== "NONE" && meeting.minutes;

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
                          <Badge
                            variant="outline"
                            className="h-5 text-xs text-amber-600 border-amber-500/40"
                          >
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
                  <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">
                    <span className="font-medium">Agenda:</span>{" "}
                    {meeting.agenda}
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
                    {meeting.minutesStatus === "PENDING_APPROVAL" &&
                      canEdit && (
                        <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                          <Clock className="mr-1.5 inline size-3.5" />
                          Minutes submitted by{" "}
                          <span className="font-medium">
                            {meeting.minutesSubmittedBy}
                          </span>{" "}
                          — pending Chair confirmation.
                        </div>
                      )}
                    {meeting.minutesStatus === "CHANGES_REQUESTED" &&
                      canEdit && (
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
                  <div className="mb-4 space-y-2 rounded-md border border-[#C8A061]/30 bg-[#C8A061]/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Meeting Agenda (Bullet Format)
                      </p>
                      {canEditAgenda && editingAgendaId !== meeting.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startAgendaEdit(meeting.id)}
                        >
                          <FileText className="size-4" />
                          Edit Agenda
                        </Button>
                      )}
                    </div>

                    {editingAgendaId === meeting.id ? (
                      <>
                        <Textarea
                          value={agendaDraft}
                          onChange={(e) => setAgendaDraft(e.target.value)}
                          rows={10}
                          className="font-mono text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingAgendaId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveAgenda(meeting.id)}
                            disabled={!agendaDraft.trim()}
                          >
                            Save Agenda
                          </Button>
                        </div>
                      </>
                    ) : (
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                        {meeting.agenda || "No agenda has been set yet."}
                      </pre>
                    )}

                    <p className="text-[11px] text-muted-foreground">
                      Agenda editing is locked to the Super Admin account.
                    </p>
                  </div>

                  {/* === APPROVED: read-only for everyone === */}
                  {meeting.minutesStatus === "APPROVED" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-emerald-500" />
                        <span className="text-sm font-medium">
                          Official Meeting Minutes
                        </span>
                        {meeting.minutesSubmittedBy && (
                          <span className="text-xs text-muted-foreground">
                            · recorded by {meeting.minutesSubmittedBy}
                          </span>
                        )}
                      </div>
                      <pre className="max-h-125 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-xs leading-relaxed">
                        {meeting.minutes}
                      </pre>
                      {/* Only Super Admin can re-open approved minutes for editing. */}
                      {canReopenApprovedMinutes && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reopenApprovedMinutes(meeting.id)}
                        >
                          <FileText className="size-4" />
                          Re-open for Editing
                        </Button>
                      )}
                      {!canReopenApprovedMinutes && canApproveMinutes && (
                        <p className="text-xs text-muted-foreground">
                          Approved minutes are locked. Only Super Admin can
                          re-open editing.
                        </p>
                      )}
                    </div>
                  )}

                  {/* === PENDING_APPROVAL: chair sees approve/request-changes; others see preview === */}
                  {meeting.minutesStatus === "PENDING_APPROVAL" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="size-4 text-amber-500" />
                        <span className="font-medium">
                          Submitted for your review
                        </span>
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

                      {canApproveMinutes && !requestingChanges && (
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

                      {canApproveMinutes && requestingChanges && (
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

                      {!canApproveMinutes && canEdit && (
                        <p className="text-xs text-muted-foreground">
                          These minutes are awaiting confirmation from the Chair
                          before they become the official record.
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => submitForApproval(meeting.id)}
                            >
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
                  {(meeting.minutesStatus === "NONE" ||
                    meeting.minutesStatus === "DRAFT") && (
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
                            <p className="text-sm font-medium">
                              Minutes not yet recorded
                            </p>
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
