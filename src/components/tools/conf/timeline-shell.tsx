"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TimelineStatCard } from "@/components/tools/conf/timeline/timeline-stat-card";
import { useUser } from "@/contexts/user-context";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  TIMELINE_DB_CACHE_KEY,
  TIMELINE_LEGACY_MIGRATED_KEY,
  TIMELINE_STORAGE_KEY,
  createInitialTimelineItems,
  getTimelineStats,
  normalizeTimelineDate,
  sortTimelineItems,
  toUiTimelineItem,
  type TimelineDbRecord,
  type TimelineItem,
} from "@/lib/conf/timeline-client";

export function TimelineShell() {
  const { user, loading } = useUser();
  const [confId, setConfId] = useState<string | null>(null);

  const [items, setItems] = useState<TimelineItem[]>(() => {
    if (typeof window === "undefined") {
      return createInitialTimelineItems();
    }

    const cachedRaw = window.localStorage.getItem(TIMELINE_DB_CACHE_KEY);
    if (cachedRaw) {
      try {
        const parsed = JSON.parse(cachedRaw) as TimelineItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Ignore malformed DB cache.
      }
    }

    const legacyRaw = window.localStorage.getItem(TIMELINE_STORAGE_KEY);
    if (legacyRaw) {
      try {
        const parsed = JSON.parse(legacyRaw) as Omit<TimelineItem, "dbId">[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => ({ ...item, dbId: null }));
        }
      } catch {
        // Ignore malformed legacy cache.
      }
    }

    return createInitialTimelineItems();
  });

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("governance");
  const [newOwner, setNewOwner] = useState("");
  const [newCritical, setNewCritical] = useState(false);

  const canEditTimeline =
    !loading &&
    (user?.role === "SUPER_ADMIN" ||
      user?.role === "ADMIN" ||
      user?.role === "CHAIR");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TIMELINE_DB_CACHE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function loadFromDb() {
      try {
        const confRes = await fetch("/api/conf/default", { cache: "no-store" });
        if (!confRes.ok) return;
        const conf = (await confRes.json()) as { id?: string };
        if (!conf?.id) return;
        if (cancelled) return;

        setConfId(conf.id);

        const listRes = await fetch(`/api/conf/${conf.id}/timeline`, {
          cache: "no-store",
        });
        if (!listRes.ok) return;

        const raw = (await listRes.json()) as unknown;
        if (!Array.isArray(raw) || raw.length === 0) return;

        const mapped = raw.map((entry) =>
          toUiTimelineItem(entry as TimelineDbRecord),
        );
        if (cancelled) return;
        setItems(mapped);
      } catch {
        // Fall back to cached/default timeline.
      }
    }

    void loadFromDb();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loading) return;
    if (!canEditTimeline) return;
    if (!confId) return;

    const legacyMigrated =
      window.localStorage.getItem(TIMELINE_LEGACY_MIGRATED_KEY) === "1";
    if (legacyMigrated) return;

    const legacyRaw = window.localStorage.getItem(TIMELINE_STORAGE_KEY);
    if (!legacyRaw) {
      window.localStorage.setItem(TIMELINE_LEGACY_MIGRATED_KEY, "1");
      return;
    }

    let legacyItems: Omit<TimelineItem, "dbId">[] = [];
    try {
      const parsed = JSON.parse(legacyRaw) as Omit<TimelineItem, "dbId">[];
      if (Array.isArray(parsed)) legacyItems = parsed;
    } catch {
      legacyItems = [];
    }

    if (legacyItems.length === 0) {
      window.localStorage.setItem(TIMELINE_LEGACY_MIGRATED_KEY, "1");
      window.localStorage.removeItem(TIMELINE_STORAGE_KEY);
      return;
    }

    let cancelled = false;

    async function migrateLegacy() {
      let attempted = false;
      let failed = false;

      const listRes = await fetch(`/api/conf/${confId}/timeline`, {
        cache: "no-store",
      });
      if (!listRes.ok) return;
      const raw = (await listRes.json()) as unknown;
      if (!Array.isArray(raw)) return;

      const byClientId = new Map<string, TimelineDbRecord>();
      for (const item of raw as TimelineDbRecord[]) {
        const key = (item?.clientId as string | null) ?? item?.id;
        if (typeof key === "string" && key.trim()) {
          byClientId.set(key, item);
        }
      }

      for (const legacy of legacyItems) {
        if (cancelled) return;
        if (!legacy || typeof legacy.id !== "string") continue;

        const existing = byClientId.get(legacy.id);
        if (existing) {
          const updates: Record<string, unknown> = {};

          if (
            typeof legacy.title === "string" &&
            legacy.title !== existing.title
          ) {
            updates.title = legacy.title.trim();
          }

          if (
            typeof legacy.description === "string" &&
            legacy.description !== (existing.description ?? "")
          ) {
            updates.description = legacy.description;
          }

          if (typeof legacy.date === "string") {
            const existingDate = normalizeTimelineDate(existing.date);
            if (legacy.date !== existingDate) updates.date = legacy.date;
          }

          if (
            typeof legacy.category === "string" &&
            legacy.category !== (existing.category ?? "")
          ) {
            updates.category = legacy.category;
          }

          if (
            typeof legacy.owner === "string" &&
            legacy.owner !== (existing.responsibleLead ?? "")
          ) {
            updates.responsibleLead = legacy.owner;
          }

          if (
            typeof legacy.isCritical === "boolean" &&
            legacy.isCritical !== Boolean(existing.isCritical)
          ) {
            updates.isCritical = legacy.isCritical;
          }

          if (
            typeof legacy.isCompleted === "boolean" &&
            legacy.isCompleted !== Boolean(existing.isCompleted)
          ) {
            updates.isCompleted = legacy.isCompleted;
          }

          if (Object.keys(updates).length > 0) {
            attempted = true;
            const res = await fetch(
              `/api/conf/${confId}/timeline/${existing.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
              },
            );
            if (!res.ok) failed = true;
          }
        } else {
          if (!legacy.title || !legacy.date) continue;
          attempted = true;
          const res = await fetch(`/api/conf/${confId}/timeline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId: legacy.id,
              title: legacy.title,
              description: legacy.description,
              responsibleLead: legacy.owner,
              isCritical: legacy.isCritical,
              date: legacy.date,
              category: legacy.category,
            }),
          });
          if (!res.ok) failed = true;
        }
      }

      if (!attempted || failed) return;

      window.localStorage.setItem(TIMELINE_LEGACY_MIGRATED_KEY, "1");
      window.localStorage.removeItem(TIMELINE_STORAGE_KEY);

      const refreshed = await fetch(`/api/conf/${confId}/timeline`, {
        cache: "no-store",
      });
      if (!refreshed.ok) return;
      const refreshedRaw = (await refreshed.json()) as unknown;
      if (!Array.isArray(refreshedRaw)) return;

      if (cancelled) return;
      setItems(
        refreshedRaw.map((entry) =>
          toUiTimelineItem(entry as TimelineDbRecord),
        ),
      );
    }

    void migrateLegacy();

    return () => {
      cancelled = true;
    };
  }, [loading, canEditTimeline, confId]);

  const toggleComplete = (id: string) => {
    if (!canEditTimeline) return;
    const current = items.find((item) => item.id === id);
    const nextCompleted = !current?.isCompleted;

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item,
      ),
    );

    if (!confId || !current?.dbId) return;
    void fetch(`/api/conf/${confId}/timeline/${current.dbId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: nextCompleted }),
    });
  };

  const handleAdd = async () => {
    if (!canEditTimeline) return;
    if (!confId) return;
    if (!newTitle || !newDate) return;

    const clientId = `local_${Date.now()}`;
    const res = await fetch(`/api/conf/${confId}/timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        title: newTitle,
        description: newDesc,
        date: newDate,
        category: newCategory,
        responsibleLead: newOwner.trim() || "Unassigned",
        isCritical: newCritical,
      }),
    });

    if (res.ok) {
      const created = (await res.json()) as TimelineDbRecord;
      const createdUi = toUiTimelineItem(created);
      setItems((prev) => sortTimelineItems([...prev, createdUi]));
    }

    setNewTitle("");
    setNewDesc("");
    setNewDate("");
    setNewCategory("governance");
    setNewOwner("");
    setNewCritical(false);
    setShowForm(false);
  };

  const { completed, progress, overdueOpen, dueSoon, criticalOpen } =
    getTimelineStats(items);

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
          <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
          <p className="text-sm text-muted-foreground">
            {completed}/{items.length} milestones completed ({progress}%)
          </p>
        </div>
        {canEditTimeline ? (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4" />
            Add Milestone
          </Button>
        ) : (
          <Badge variant="outline" className="gap-1">
            <Lock className="size-3" />
            Super Admin Editing Only
          </Badge>
        )}
      </div>

      {!loading && !canEditTimeline && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3 text-xs text-amber-700 dark:text-amber-400">
            This roadmap is view-only for non-super-admin accounts.
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[#C8A061] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <TimelineStatCard label="Overdue Open" value={overdueOpen} />
        <TimelineStatCard label="Due in 14 Days" value={dueSoon} />
        <TimelineStatCard label="Critical Open" value={criticalOpen} />
      </div>

      {/* Add Form */}
      {showForm && canEditTimeline && (
        <Card className="border-[#C8A061]/40">
          <CardHeader>
            <CardTitle className="text-base">Add Milestone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Milestone title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Responsible Lead</Label>
                <Input
                  placeholder="e.g. Logistics Chair (person accountable)"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  The responsible lead is the person or team accountable for
                  closing this milestone.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={newCritical ? "critical" : "normal"}
                  onChange={(e) =>
                    setNewCritical(e.target.value === "critical")
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Details about this milestone..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!newTitle || !newDate}
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute top-0 left-4.75 h-full w-0.5 bg-border" />

        {items.map((item) => {
          const isToday = item.date === new Date().toISOString().split("T")[0];
          const isPast = new Date(item.date) < new Date();
          return (
            <div key={item.id} className="relative flex gap-4 pb-6">
              {/* Dot */}
              {canEditTimeline ? (
                <button
                  className="relative z-10 mt-1 shrink-0"
                  onClick={() => toggleComplete(item.id)}
                >
                  {item.isCompleted ? (
                    <CheckCircle2 className="size-9.5 text-[#C8A061]" />
                  ) : (
                    <Circle
                      className={`size-9.5 ${isToday ? "text-[#C8A061]" : isPast ? "text-muted-foreground" : "text-border"}`}
                    />
                  )}
                </button>
              ) : (
                <div className="relative z-10 mt-1 shrink-0">
                  {item.isCompleted ? (
                    <CheckCircle2 className="size-9.5 text-[#C8A061]" />
                  ) : (
                    <Circle
                      className={`size-9.5 ${isToday ? "text-[#C8A061]" : isPast ? "text-muted-foreground" : "text-border"}`}
                    />
                  )}
                </div>
              )}

              {/* Content */}
              <Card
                className={`flex-1 ${item.isCompleted ? "opacity-60" : ""} ${isToday ? "border-[#C8A061]/50" : ""}`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className={`font-medium ${item.isCompleted ? "line-through" : ""}`}
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
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="mr-1 size-3" />
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {item.isCritical && (
                          <Badge
                            variant="outline"
                            className="border-red-500/40 bg-red-500/10 text-[10px] text-red-700"
                          >
                            Critical
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </Badge>
                        <div
                          className={`size-2 rounded-full ${CATEGORY_COLORS[item.category] || "bg-gray-400"}`}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
