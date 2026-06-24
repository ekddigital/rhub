"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  Crown,
  Eye,
  FileText,
  Globe,
  LayoutList,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchDefaultConference } from "@/lib/conf/client";
import { BookletPreview } from "@/components/tools/conf/booklet-preview";
import { LsuicLeaderMappingPanel } from "@/components/tools/conf/lsuic-leader-mapping-panel";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookletStatus = "DRAFT" | "READY" | "PUBLISHED";

export type BookletConfig = {
  id: string;
  confId: string;
  title: string;
  subtitle: string | null;
  theme: string | null;
  coverImagePath: string | null;
  status: BookletStatus;
  lastGeneratedAt: string | null;
};

export type BookletSection = {
  id: string;
  bookletId: string;
  type: string;
  title: string;
  subtitle: string | null;
  bodyText: string | null;
  isEnabled: boolean;
  sortOrder: number;
  committeeScope: string | null;
};

export type LeaderProfile = {
  id: string;
  confId: string | null;
  role: string;
  name: string;
  title: string;
  bio: string | null;
  photoPath: string | null;
  country: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type NecMember = {
  id: string;
  name: string;
  role: string;
  title: string | null;
  city: string | null;
  phone?: string | null;
  province?: string | null;
  university?: string | null;
  delegateCode?: string | null;
  conferencePosition?: string | null;
  committeeScope: string | null;
  photoPath: string | null;
  bookletBio: string | null;
  hasRegistered?: boolean;
};

const COMMITTEE_ROLE_LABELS: Record<string, string> = {
  CHAIR: "Conference Chair",
  VICE_CHAIR: "Conference Vice-Chair",
  SECRETARY: "Conference Secretary",
  FINANCIAL_SECRETARY: "National Financial Secretary",
  TREASURER: "National Treasurer",
  COMMITTEE: "",
};

function getCommitteeRoleLabel(m: NecMember): string {
  const base = COMMITTEE_ROLE_LABELS[m.role];
  if (base !== undefined && base !== "") return base;
  return m.title ?? m.role;
}

export type BookletData = {
  event: {
    id: string;
    name: string;
    year: number;
    city: string;
    venue: string;
    startsAt: string;
    endsAt: string;
  };
  booklet: (BookletConfig & { sections: BookletSection[] }) | null;
  leaders: LeaderProfile[];
  necMembers: NecMember[];
  committeeMembers: NecMember[];
  conferenceChair: NecMember | null;
  membersByScope: Record<string, NecMember[]>;
  delegates: {
    id: string;
    name: string;
    delegateCode: string | null;
    university: string | null;
    province: string | null;
    city: string;
    conferencePosition: string | null;
    gender: string | null;
    bookletPhotoPath: string | null;
    status: string;
  }[];
  meetings: {
    id: string;
    title: string;
    scheduled: string;
    location: string | null;
    agenda: string | null;
  }[];
  counts: {
    totalDelegates: number;
    totalMembers: number;
    sectionsEnabled: number;
    sectionsTotal: number;
    leadersStored: number;
  };
};

type ActiveTab = "overview" | "preview" | "leaders" | "sections" | "config";

// ─── Status badge helper ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookletStatus }) {
  const map: Record<BookletStatus, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-zinc-500/20 text-zinc-600" },
    READY: {
      label: "Ready",
      className: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
    },
    PUBLISHED: {
      label: "Published",
      className: "bg-green-500/20 text-green-700 dark:text-green-400",
    },
  };
  const { label, className } = map[status] ?? map.DRAFT;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BookletManagerShell() {
  const [confId, setConfId] = useState("");
  const [data, setData] = useState<BookletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ActiveTab>("overview");

  // ── Leader form state
  const [leaderForm, setLeaderForm] = useState<{
    open: boolean;
    editId: string | null;
    role: string;
    name: string;
    title: string;
    bio: string;
    country: string;
    sortOrder: number;
    isGlobal: boolean;
  }>({
    open: false,
    editId: null,
    role: "",
    name: "",
    title: "",
    bio: "",
    country: "",
    sortOrder: 0,
    isGlobal: false,
  });
  const [leaderSaving, setLeaderSaving] = useState(false);

  // ── Section edit state
  const [sectionEdit, setSectionEdit] = useState<{
    open: boolean;
    section: BookletSection | null;
    bodyText: string;
    title: string;
  }>({ open: false, section: null, bodyText: "", title: "" });
  const [sectionSaving, setSectionSaving] = useState(false);

  // ── Config edit state
  const [configForm, setConfigForm] = useState<{
    title: string;
    subtitle: string;
    theme: string;
    status: BookletStatus;
  }>({ title: "", subtitle: "", theme: "", status: "DRAFT" });
  const [configSaving, setConfigSaving] = useState(false);

  // ── Load booklet data ──────────────────────────────────────────────────────

  const loadData = useCallback(async (id: string) => {
    const res = await fetch(`/api/conf/${id}/booklet/data`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw new Error((j.error as string) || "Failed to load booklet data");
    }
    return (await res.json()) as BookletData;
  }, []);

  const ensureBookletExists = useCallback(async (id: string) => {
    // Calling config GET auto-creates the booklet if it doesn't exist
    const res = await fetch(`/api/conf/${id}/booklet/config`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("Could not auto-init booklet config");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        await ensureBookletExists(conf.id);
        const d = await loadData(conf.id);
        setData(d);
        if (d.booklet) {
          setConfigForm({
            title: d.booklet.title,
            subtitle: d.booklet.subtitle ?? "",
            theme: d.booklet.theme ?? "",
            status: d.booklet.status,
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load booklet");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [ensureBookletExists, loadData]);

  const refresh = async () => {
    if (!confId) return;
    try {
      setError(null);
      const d = await loadData(confId);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    }
  };

  // ── Leader CRUD ────────────────────────────────────────────────────────────

  const openLeaderCreate = () =>
    setLeaderForm({
      open: true,
      editId: null,
      role: "",
      name: "",
      title: "",
      bio: "",
      country: "",
      sortOrder: 0,
      isGlobal: false,
    });

  const openLeaderEdit = (l: LeaderProfile) =>
    setLeaderForm({
      open: true,
      editId: l.id,
      role: l.role,
      name: l.name,
      title: l.title,
      bio: l.bio ?? "",
      country: l.country ?? "",
      sortOrder: l.sortOrder,
      isGlobal: l.confId === null,
    });

  const saveLeader = async () => {
    if (!confId) return;
    setLeaderSaving(true);
    try {
      const body = {
        role: leaderForm.role,
        name: leaderForm.name,
        title: leaderForm.title,
        bio: leaderForm.bio,
        country: leaderForm.country,
        sortOrder: leaderForm.sortOrder,
        isGlobal: leaderForm.isGlobal,
      };
      let res: Response;
      if (leaderForm.editId) {
        res = await fetch(
          `/api/conf/${confId}/booklet/leaders/${leaderForm.editId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
      } else {
        res = await fetch(`/api/conf/${confId}/booklet/leaders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        throw new Error((j.error as string) || "Save failed");
      }
      setLeaderForm((prev) => ({ ...prev, open: false }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLeaderSaving(false);
    }
  };

  const deleteLeader = async (id: string) => {
    if (!confId || !confirm("Delete this leader profile?")) return;
    try {
      await fetch(`/api/conf/${confId}/booklet/leaders/${id}`, {
        method: "DELETE",
      });
      await refresh();
    } catch {
      setError("Delete failed");
    }
  };

  // ── Section edit ───────────────────────────────────────────────────────────

  const openSectionEdit = (s: BookletSection) =>
    setSectionEdit({
      open: true,
      section: s,
      bodyText: s.bodyText ?? "",
      title: s.title,
    });

  const saveSectionEdit = async () => {
    if (!confId || !sectionEdit.section) return;
    setSectionSaving(true);
    try {
      const res = await fetch(
        `/api/conf/${confId}/booklet/sections/${sectionEdit.section.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: sectionEdit.title,
            bodyText: sectionEdit.bodyText,
          }),
        },
      );
      if (!res.ok) throw new Error("Save failed");
      setSectionEdit((prev) => ({ ...prev, open: false }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSectionSaving(false);
    }
  };

  const toggleSection = async (s: BookletSection) => {
    if (!confId || !data?.booklet) return;
    try {
      await fetch(`/api/conf/${confId}/booklet/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ id: s.id, isEnabled: !s.isEnabled }],
        }),
      });
      await refresh();
    } catch {
      setError("Toggle failed");
    }
  };

  const moveSection = async (s: BookletSection, direction: "up" | "down") => {
    if (!confId || !data?.booklet) return;
    const sections = [...(data.booklet.sections ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const idx = sections.findIndex((x) => x.id === s.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;

    const a = sections[idx];
    const b = sections[swapIdx];

    try {
      await fetch(`/api/conf/${confId}/booklet/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [
            { id: a.id, sortOrder: b.sortOrder },
            { id: b.id, sortOrder: a.sortOrder },
          ],
        }),
      });
      await refresh();
    } catch {
      setError("Reorder failed");
    }
  };

  // ── Config save ────────────────────────────────────────────────────────────

  const saveConfig = async () => {
    if (!confId) return;
    setConfigSaving(true);
    try {
      const res = await fetch(`/api/conf/${confId}/booklet/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configForm),
      });
      if (!res.ok) throw new Error("Save failed");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setConfigSaving(false);
    }
  };

  // ── Chair bio edit ─────────────────────────────────────────────────────────

  const [chairBioEdit, setChairBioEdit] = useState<{
    open: boolean;
    memberId: string;
    bioText: string;
    saving: boolean;
  }>({ open: false, memberId: "", bioText: "", saving: false });

  const openChairBioEdit = (m: NecMember) =>
    setChairBioEdit({
      open: true,
      memberId: m.id,
      bioText: m.bookletBio ?? "",
      saving: false,
    });

  const saveChairBio = async () => {
    if (!confId || !chairBioEdit.memberId) return;
    setChairBioEdit((prev) => ({ ...prev, saving: true }));
    try {
      const res = await fetch(
        `/api/conf/${confId}/members/${chairBioEdit.memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookletBio: chairBioEdit.bioText }),
        },
      );
      if (!res.ok) throw new Error("Save failed");
      setChairBioEdit((prev) => ({ ...prev, open: false }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setChairBioEdit((prev) => ({ ...prev, saving: false }));
    }
  };

  // ── Seed default leader profiles ──────────────────────────────────────────

  const [seedingLeaders, setSeedingLeaders] = useState(false);

  const seedDefaultLeaders = async () => {
    if (!confId) return;
    if (
      !confirm(
        "This will add the Liberian President, Chinese President, and Liberian Ambassador profile entries. Continue?",
      )
    )
      return;

    setSeedingLeaders(true);
    try {
      const defaults = [
        {
          role: "Head of State",
          name: "H.E. Joseph Nyuma Boakai Sr.",
          title: "President of the Republic of Liberia",
          country: "Liberia",
          photoPath: "/conf/president_boakai_Liberia.png",
          sortOrder: 1,
        },
        {
          role: "Head of State",
          name: "H.E. Xi Jinping",
          title: "President of the People's Republic of China",
          country: "China",
          photoPath: "/conf/president_xi_China.png",
          sortOrder: 2,
        },
        {
          role: "Ambassador",
          name: "H.E. Ambassador",
          title: "Ambassador of Liberia to China",
          country: "Liberia",
          photoPath: null,
          sortOrder: 3,
        },
      ];

      for (const leader of defaults) {
        const res = await fetch(`/api/conf/${confId}/booklet/leaders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...leader, isGlobal: false }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as Record<
            string,
            unknown
          >;
          throw new Error(
            (j.error as string) || `Failed to seed "${leader.name}"`,
          );
        }
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeedingLeaders(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const booklet = data?.booklet;
  const sections = booklet?.sections ?? [];
  const leaders = data?.leaders ?? [];
  const counts = data?.counts ?? {
    totalDelegates: 0,
    totalMembers: 0,
    sectionsEnabled: 0,
    sectionsTotal: 0,
    leadersStored: 0,
  };

  return (
    <div className="space-y-6 py-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C8A061]/20">
            <BookOpenText className="size-5 text-[#C8A061]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Booklet Manager
            </h1>
            <p className="text-sm text-muted-foreground">
              {data?.event.name ?? "Conference Booklet"} ·{" "}
              {booklet ? (
                <StatusBadge status={booklet.status} />
              ) : (
                "Not initialized"
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCcw className="size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}>
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-1 border-b">
        {(
          [
            { id: "overview", label: "Overview", icon: Eye },
            { id: "preview", label: "Live Preview", icon: FileText },
            { id: "leaders", label: "Leadership Profiles", icon: Crown },
            { id: "sections", label: "Section Manager", icon: LayoutList },
            { id: "config", label: "Settings", icon: Settings },
          ] as { id: ActiveTab; label: string; icon: React.ElementType }[]
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "border-[#C8A061] text-[#C8A061]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════ OVERVIEW TAB ══════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Users className="size-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl font-bold">{counts.totalDelegates}</p>
                  <p className="text-xs text-muted-foreground">
                    Confirmed Delegates
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Crown className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{counts.leadersStored}</p>
                  <p className="text-xs text-muted-foreground">
                    Leadership Profiles
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <CheckCircle2 className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">
                    {counts.sectionsEnabled}/{counts.sectionsTotal}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sections Enabled
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Users className="size-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{counts.totalMembers}</p>
                  <p className="text-xs text-muted-foreground">
                    Committee Members
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booklet Readiness Checklist */}
          {data &&
            (() => {
              const nationalPresident =
                data.necMembers.find((m) => m.role === "CHAIR") ?? null;
              const checks = [
                {
                  label: "Leader profiles added",
                  ok: data.counts.leadersStored >= 3,
                  hint: `${data.counts.leadersStored}/3 profiles stored. Add Liberian President, Chinese President, and Ambassador.`,
                  action: () => setTab("leaders"),
                  actionLabel: "Add Leaders",
                },
                {
                  label: "National President address written",
                  ok: !!nationalPresident?.bookletBio,
                  hint: "The National President has not yet written their booklet address.",
                  action: () =>
                    nationalPresident && openChairBioEdit(nationalPresident),
                  actionLabel: "Write Address",
                },
                {
                  label: "Confirmed delegates registered",
                  ok: data.counts.totalDelegates > 0,
                  hint: "No confirmed delegates yet.",
                  action: () =>
                    window.location.assign(
                      window.location.pathname.replace(
                        "/booklet",
                        "/delegates",
                      ),
                    ),
                  actionLabel: "View Delegates",
                },
                {
                  label: "Booklet sections configured",
                  ok: data.counts.sectionsEnabled >= 5,
                  hint: `Only ${data.counts.sectionsEnabled} sections enabled. Enable at least 5.`,
                  action: () => setTab("sections"),
                  actionLabel: "Configure",
                },
                {
                  label: "Booklet published",
                  ok: data.booklet?.status === "PUBLISHED",
                  hint:
                    data.booklet?.status === "READY"
                      ? "Booklet is ready — publish when finalized."
                      : "Booklet is still a draft.",
                  action: () => setTab("config"),
                  actionLabel: "Update Status",
                },
              ];
              const passCount = checks.filter((c) => c.ok).length;
              return (
                <Card
                  className={
                    passCount === checks.length
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-amber-500/30 bg-amber-500/5"
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Booklet Readiness
                      </CardTitle>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                          passCount === checks.length
                            ? "bg-green-500/20 text-green-700"
                            : passCount >= 4
                              ? "bg-amber-500/20 text-amber-700"
                              : "bg-red-500/20 text-red-700"
                        }`}
                      >
                        {passCount}/{checks.length} complete
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="divide-y">
                    {checks.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 py-2.5">
                        <span
                          className={
                            c.ok ? "text-green-600" : "text-muted-foreground"
                          }
                        >
                          {c.ok ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            <AlertCircle className="size-4 text-amber-500" />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${c.ok ? "text-[#1F1C18]" : "text-muted-foreground"}`}
                          >
                            {c.label}
                          </p>
                          {!c.ok && (
                            <p className="text-xs text-muted-foreground">
                              {c.hint}
                            </p>
                          )}
                        </div>
                        {!c.ok && c.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-[#C8A061] hover:bg-[#C8A061]/10 shrink-0"
                            onClick={c.action}
                          >
                            {c.actionLabel}
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })()}

          {/* Booklet section preview list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booklet Sections</CardTitle>
              <CardDescription>
                Quick view of all configured sections and their readiness.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {sections.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No sections configured. Go to the{" "}
                  <button
                    className="underline"
                    onClick={() => setTab("sections")}
                  >
                    Section Manager
                  </button>{" "}
                  tab.
                </p>
              ) : (
                sections.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      <span
                        className={`text-sm ${!s.isEnabled ? "text-muted-foreground line-through" : ""}`}
                      >
                        {s.title}
                      </span>
                      {s.committeeScope && (
                        <Badge variant="outline" className="text-xs">
                          {s.committeeScope}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {s.isEnabled ? (
                        <span className="text-xs text-green-600">Enabled</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Disabled
                        </span>
                      )}
                      <button
                        onClick={() => setTab("sections")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Conference Committee Members */}
          {(data?.committeeMembers ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Conference Committee
                </CardTitle>
                <CardDescription>
                  All organizing committee members for this conference.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y">
                {(data?.committeeMembers ?? []).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-2.5">
                    {m.photoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.photoPath}
                        alt={m.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                        {m.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCommitteeRoleLabel(m)}
                        {m.committeeScope ? ` · ${m.committeeScope}` : ""}
                        {m.city ? ` · ${m.city}` : ""}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      {m.role === "CHAIR" && (
                        <Badge className="bg-[#C8A061]/20 text-[#C8A061] border-[#C8A061]/30 text-xs">
                          Chairman
                        </Badge>
                      )}
                      {m.role === "VICE_CHAIR" && (
                        <Badge className="bg-ekd-deep-navy/20 border-ekd-deep-navy/30 text-xs text-ekd-deep-navy">
                          Co-Chair
                        </Badge>
                      )}
                      {m.role === "SECRETARY" && (
                        <Badge className="bg-[#8E0E00]/20 text-[#8E0E00] border-[#8E0E00]/30 text-xs">
                          Secretary
                        </Badge>
                      )}
                      {m.bookletBio && (
                        <Badge variant="secondary" className="text-xs">
                          Address written
                        </Badge>
                      )}
                      {!m.hasRegistered && (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          Not registered
                        </Badge>
                      )}
                      {m.role === "CHAIR" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-[#C8A061] hover:bg-[#C8A061]/10"
                          onClick={() => openChairBioEdit(m)}
                        >
                          {m.bookletBio ? "Edit Address" : "Write Address"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Chairman address editor ── */}
          {chairBioEdit.open && (
            <Card className="border-[#C8A061]/40 bg-[#C8A061]/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-ekd-deep-navy">
                  National President Address — Booklet Message
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  This message will appear in the
                  &quot;National President Address&quot; section of the booklet.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={10}
                  placeholder="Dear delegates, dignitaries, and honored guests..."
                  value={chairBioEdit.bioText}
                  onChange={(e) =>
                    setChairBioEdit((p) => ({ ...p, bioText: e.target.value }))
                  }
                  className="resize-y font-serif text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setChairBioEdit((p) => ({ ...p, open: false }))
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#C8A061] text-white hover:bg-[#B8903A]"
                    onClick={saveChairBio}
                    disabled={chairBioEdit.saving}
                  >
                    {chairBioEdit.saving ? "Saving…" : "Save Address"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════ PREVIEW TAB ══════════════════════════════════════ */}
      {tab === "preview" && data && (
        <BookletPreview data={data} confId={confId} />
      )}
      {tab === "preview" && !data && (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          No booklet data available
        </div>
      )}

      {/* ══════════════════════════════════════ LEADERS TAB ══════════════════════════════════════ */}
      {tab === "leaders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Pre-stored profiles for heads of state, ambassadors, and fixed
                leadership that appear in every booklet.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(data?.counts.leadersStored ?? 0) === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={seedDefaultLeaders}
                  disabled={seedingLeaders}
                  className="text-xs"
                >
                  {seedingLeaders ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Crown className="size-4" />
                  )}
                  {seedingLeaders ? "Seeding…" : "Seed Profiles"}
                </Button>
              )}
              <Button size="sm" onClick={openLeaderCreate}>
                <Plus className="size-4" />
                Add Leader
              </Button>
            </div>
          </div>

          {/* Leader form */}
          {leaderForm.open && (
            <Card className="border-[#C8A061]/40">
              <CardHeader>
                <CardTitle className="text-base">
                  {leaderForm.editId
                    ? "Edit Leader Profile"
                    : "Add Leader Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted-foreground">
                      Role / Position *
                    </span>
                    <Input
                      placeholder="President of Liberia"
                      value={leaderForm.role}
                      onChange={(e) =>
                        setLeaderForm((p) => ({ ...p, role: e.target.value }))
                      }
                    />
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted-foreground">Country</span>
                    <Input
                      placeholder="Liberia"
                      value={leaderForm.country}
                      onChange={(e) =>
                        setLeaderForm((p) => ({
                          ...p,
                          country: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted-foreground">Full Name *</span>
                  <Input
                    placeholder="Joseph Nyuma Boakai Sr."
                    value={leaderForm.name}
                    onChange={(e) =>
                      setLeaderForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted-foreground">
                    Official Title *
                  </span>
                  <Input
                    placeholder="President of the Republic of Liberia"
                    value={leaderForm.title}
                    onChange={(e) =>
                      setLeaderForm((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted-foreground">
                    Biography (optional)
                  </span>
                  <Textarea
                    rows={4}
                    placeholder="Brief biography or message..."
                    value={leaderForm.bio}
                    onChange={(e) =>
                      setLeaderForm((p) => ({ ...p, bio: e.target.value }))
                    }
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted-foreground">Sort Order</span>
                    <Input
                      type="number"
                      value={leaderForm.sortOrder}
                      onChange={(e) =>
                        setLeaderForm((p) => ({
                          ...p,
                          sortOrder: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="flex items-center gap-2 pt-6 text-sm">
                    <input
                      type="checkbox"
                      checked={leaderForm.isGlobal}
                      onChange={(e) =>
                        setLeaderForm((p) => ({
                          ...p,
                          isGlobal: e.target.checked,
                        }))
                      }
                    />
                    <div>
                      <p className="font-medium">Global profile</p>
                      <p className="text-xs text-muted-foreground">
                        Shared across all conferences
                      </p>
                    </div>
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => void saveLeader()}
                    disabled={leaderSaving}
                  >
                    {leaderSaving && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Save Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setLeaderForm((p) => ({ ...p, open: false }))
                    }
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leaders list */}
          {leaders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No leadership profiles yet. Add the Liberian President, Chinese
                President, and Ambassador.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {leaders.map((l) => (
                <Card key={l.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {l.photoPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={l.photoPath}
                          alt={l.name}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-lg object-cover"
                          onError={(e) => {
                            // On load failure fall back to the Globe placeholder
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                            const sib = e.currentTarget
                              .nextElementSibling as HTMLElement | null;
                            if (sib) sib.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted"
                        style={{ display: l.photoPath ? "none" : "flex" }}
                      >
                        <Globe className="size-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#8E0E00]">
                          {l.role}
                        </p>
                        <p className="mt-0.5 text-sm font-bold leading-tight">
                          {l.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {l.title}
                        </p>
                        {l.country && (
                          <Badge variant="outline" className="mt-1.5 text-xs">
                            {l.country}
                          </Badge>
                        )}
                        {l.confId === null && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Global
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openLeaderEdit(l)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
                        onClick={() => void deleteLeader(l.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {confId && <LsuicLeaderMappingPanel confId={confId} />}
        </div>
      )}

      {/* ══════════════════════════════════════ SECTIONS TAB ══════════════════════════════════════ */}
      {tab === "sections" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Reorder sections, enable/disable them, and edit their text content.
            Changes take effect immediately in the booklet preview.
          </p>

          {/* Section edit modal */}
          {sectionEdit.open && sectionEdit.section && (
            <Card className="border-[#C8A061]/40">
              <CardHeader>
                <CardTitle className="text-base">
                  Edit: {sectionEdit.section.title}
                </CardTitle>
                <CardDescription>
                  Type:{" "}
                  <code className="text-xs">{sectionEdit.section.type}</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted-foreground">Section Title</span>
                  <Input
                    value={sectionEdit.title}
                    onChange={(e) =>
                      setSectionEdit((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                </label>
                {(sectionEdit.section.type === "PRESIDENT_ADDRESS" ||
                  sectionEdit.section.type === "GUEST_BIO" ||
                  sectionEdit.section.type === "SPONSORS" ||
                  sectionEdit.section.type === "ABBREVIATIONS") && (
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted-foreground">Body Text</span>
                    <Textarea
                      rows={8}
                      placeholder={
                        sectionEdit.section.type === "PRESIDENT_ADDRESS"
                          ? "Enter the president's address or speech text..."
                          : sectionEdit.section.type === "GUEST_BIO"
                            ? "Enter guest speaker biography..."
                            : sectionEdit.section.type === "ABBREVIATIONS"
                              ? "Enter abbreviation list, one per line (e.g. NEC — National Executive Committee)"
                            : "Enter sponsor names, logos, or acknowledgements..."
                      }
                      value={sectionEdit.bodyText}
                      onChange={(e) =>
                        setSectionEdit((p) => ({
                          ...p,
                          bodyText: e.target.value,
                        }))
                      }
                    />
                  </label>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => void saveSectionEdit()}
                    disabled={sectionSaving}
                  >
                    {sectionSaving && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setSectionEdit((p) => ({ ...p, open: false }))
                    }
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {sections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No sections yet. Refresh the page to auto-initialize.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y pt-2">
                {[...sections]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((s, i, arr) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 py-3 ${!s.isEnabled ? "opacity-50" : ""}`}
                    >
                      {/* Order controls */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => void moveSection(s, "up")}
                          disabled={i === 0}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          onClick={() => void moveSection(s, "down")}
                          disabled={i === arr.length - 1}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>

                      <span className="w-5 text-center text-xs text-muted-foreground">
                        {s.sortOrder}
                      </span>

                      <div className="flex-1">
                        <p className="text-sm font-medium">{s.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.type}
                          {s.committeeScope ? ` · ${s.committeeScope}` : ""}
                        </p>
                      </div>

                      {s.bodyText && (
                        <Badge variant="secondary" className="text-xs">
                          Has text
                        </Badge>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openSectionEdit(s)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant={s.isEnabled ? "outline" : "ghost"}
                          onClick={() => void toggleSection(s)}
                          className={
                            s.isEnabled
                              ? ""
                              : "text-muted-foreground hover:text-foreground"
                          }
                        >
                          {s.isEnabled ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════ CONFIG TAB ══════════════════════════════════════ */}
      {tab === "config" && (
        <div className="max-w-xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booklet Settings</CardTitle>
              <CardDescription>
                Configure the title, theme, and publication status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground">Booklet Title</span>
                <Input
                  placeholder="20th Annual Conference Booklet"
                  value={configForm.title}
                  onChange={(e) =>
                    setConfigForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground">Subtitle</span>
                <Input
                  placeholder="20th Anniversary National Conference"
                  value={configForm.subtitle}
                  onChange={(e) =>
                    setConfigForm((p) => ({ ...p, subtitle: e.target.value }))
                  }
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground">Conference Theme</span>
                <Input
                  placeholder="Jinan 2026: Legacy and Influence"
                  value={configForm.theme}
                  onChange={(e) =>
                    setConfigForm((p) => ({ ...p, theme: e.target.value }))
                  }
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground">
                  Publication Status
                </span>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={configForm.status}
                  onChange={(e) =>
                    setConfigForm((p) => ({
                      ...p,
                      status: e.target.value as BookletStatus,
                    }))
                  }
                >
                  <option value="DRAFT">Draft — Work in progress</option>
                  <option value="READY">Ready — Awaiting final approval</option>
                  <option value="PUBLISHED">Published — Finalized</option>
                </select>
              </label>
              <Button
                onClick={() => void saveConfig()}
                disabled={configSaving}
                className="mt-2"
              >
                {configSaving && <Loader2 className="size-4 animate-spin" />}
                Save Settings
              </Button>
            </CardContent>
          </Card>

          {booklet && (
            <Card>
              <CardContent className="pt-6">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Booklet ID</dt>
                    <dd className="font-mono text-xs">{booklet.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Last generated</dt>
                    <dd>
                      {booklet.lastGeneratedAt
                        ? new Date(booklet.lastGeneratedAt).toLocaleString()
                        : "Never"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <StatusBadge status={booklet.status} />
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
