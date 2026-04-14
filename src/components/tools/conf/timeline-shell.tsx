"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, CheckCircle2, Circle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TimelineItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  owner: string;
  isCritical: boolean;
  isCompleted: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  governance: "bg-indigo-500",
  finance: "bg-emerald-500",
  registration: "bg-cyan-500",
  logistics: "bg-amber-500",
  program: "bg-violet-500",
  event: "bg-emerald-500",
  "post-event": "bg-slate-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  governance: "Governance",
  finance: "Finance",
  registration: "Registration",
  logistics: "Logistics",
  program: "Program",
  event: "Conference Days",
  "post-event": "Post Event",
};

const INITIAL_TIMELINE: TimelineItem[] = [
  {
    id: "0",
    title: "Hotel Deposit Secured",
    description:
      "5,000 RMB advance paid to secure conference hall and accommodation credit.",
    owner: "Financial Secretary + Treasurer",
    date: "2026-03-13",
    category: "finance",
    isCritical: true,
    isCompleted: true,
  },
  {
    id: "1",
    title: "Conference Chair Appointed",
    description: "Ad hoc committee leadership established for LSUIC 2026.",
    owner: "National President",
    date: "2026-04-06",
    category: "governance",
    isCritical: true,
    isCompleted: true,
  },
  {
    id: "2",
    title: "First Committee Meeting Completed",
    description:
      "Kickoff completed with agenda, committee structure, and action points.",
    owner: "Chair + Secretary",
    date: "2026-04-10",
    category: "governance",
    isCritical: true,
    isCompleted: true,
  },
  {
    id: "3",
    title: "Approval Workflow Locked",
    description:
      "All spending and decisions pass through Chair, Co-Chair, and Secretary-General.",
    owner: "Chair + Co-Chair + Secretary",
    date: "2026-04-17",
    category: "governance",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "4",
    title: "Disbursement SLA Published",
    description:
      "Funding requests must be released within 24-48 hours after approval.",
    owner: "Treasurer + Financial Secretary",
    date: "2026-04-18",
    category: "finance",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "5",
    title: "Subcommittee Channels Activated",
    description:
      "Every committee group is created with Chair, Co-Chair, and Secretary included.",
    owner: "All Committee Leaders",
    date: "2026-04-19",
    category: "governance",
    isCritical: false,
    isCompleted: false,
  },
  {
    id: "6",
    title: "Master Task Board Published",
    description:
      "One workplan with owner, due date, risk, and status for every committee output.",
    owner: "Secretary + Chair",
    date: "2026-04-21",
    category: "governance",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "7",
    title: "Budget Drafts Submitted",
    description: "Committee leads submit first pass budget for 170 delegates.",
    owner: "Cooking, Logistics, Program, Media, Sports",
    date: "2026-04-24",
    category: "finance",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "8",
    title: "Conference Fee Structure Finalized",
    description: "Fee tiers and payment policy approved and documented.",
    owner: "Chair + Finance Team",
    date: "2026-04-25",
    category: "finance",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "9",
    title: "Budget Defense and Approval Gate",
    description:
      "Consolidated budget defended and signed off with NEC alignment.",
    owner: "Chair + Treasurer + Financial Secretary",
    date: "2026-04-28",
    category: "finance",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "10",
    title: "Registration and Fees Announced",
    description:
      "Public release of registration form, fee policy, and payment channels.",
    owner: "Secretary + Media",
    date: "2026-05-01",
    category: "registration",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "11",
    title: "Media Wave 1 Launch",
    description:
      "First promotion pack: flyers, writeups, and committee messaging.",
    owner: "PRO / Media",
    date: "2026-05-03",
    category: "program",
    isCritical: false,
    isCompleted: false,
  },
  {
    id: "12",
    title: "Rooming Policy and Allocation Rules Locked",
    description:
      "Finalize pairing policy, single-room rules, and accommodation assignment process.",
    owner: "Logistics Lead",
    date: "2026-05-08",
    category: "logistics",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "13",
    title: "Transport Plan v1",
    description: "Inter-city arrival support and local route plan drafted.",
    owner: "Logistics + Sports",
    date: "2026-05-12",
    category: "logistics",
    isCritical: false,
    isCompleted: false,
  },
  {
    id: "14",
    title: "Mid-Point Readiness Review",
    description: "Cross-committee checkpoint with risk and blocker escalation.",
    owner: "Chair + Co-Chair",
    date: "2026-05-15",
    category: "governance",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "15",
    title: "Menu and Procurement Plan v1",
    description:
      "Meal-by-day plan, quantity model, and dietary handling approved.",
    owner: "Cooking Chair + Team",
    date: "2026-05-18",
    category: "logistics",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "16",
    title: "Panel and Program Topics Final",
    description:
      "Program sequence and speaking sessions frozen for publication.",
    owner: "Program Lead + Secretary",
    date: "2026-05-29",
    category: "program",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "17",
    title: "Awards Criteria Approved",
    description: "Awards categories, scoring, and host flow finalized.",
    owner: "Awards/Program + Media",
    date: "2026-06-02",
    category: "program",
    isCritical: false,
    isCompleted: false,
  },
  {
    id: "18",
    title: "Election Operations Plan Signed",
    description:
      "IEC coordination, campaign timeline, voting and certification flow fixed.",
    owner: "Secretary + IEC Liaison",
    date: "2026-06-05",
    category: "governance",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "19",
    title: "Program Finalization Gate",
    description: "All plenary, elections, sports, and awards slots time-boxed.",
    owner: "Chair + Program Lead",
    date: "2026-06-12",
    category: "program",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "20",
    title: "Print and Branding Freeze",
    description:
      "Booklets, badges, tags, T-shirts, and banners locked for production.",
    owner: "Media + Logistics",
    date: "2026-06-20",
    category: "logistics",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "21",
    title: "Registration Closes",
    description:
      "Final delegate list, payment reconciliation, and rooming base frozen.",
    owner: "Registration + Finance",
    date: "2026-06-22",
    category: "registration",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "22",
    title: "Final Vendor Payments Complete",
    description: "Critical venue, transport, and procurement payments cleared.",
    owner: "Treasurer + Financial Secretary",
    date: "2026-06-24",
    category: "finance",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "23",
    title: "Operational Dry Run",
    description:
      "Registration desk, transport handoff, and session transitions rehearsed.",
    owner: "Logistics + Program",
    date: "2026-06-26",
    category: "logistics",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "24",
    title: "Go/No-Go Decision Meeting",
    description: "Final readiness vote with contingency activation if needed.",
    owner: "Chair + NEC",
    date: "2026-06-28",
    category: "governance",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "25",
    title: "Arrival Briefing Pack Released",
    description:
      "Final delegate travel guidance, check-in details, and day-1 brief sent before July.",
    owner: "Secretary + Logistics + Media",
    date: "2026-06-29",
    category: "registration",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "25b",
    title: "Manual Correction Window Opens",
    description:
      "July is reserved for manual fixes, contingency handling, and resolving flagged issues only.",
    owner: "Chair + All Committee Leads",
    date: "2026-07-01",
    category: "governance",
    isCritical: false,
    isCompleted: false,
  },
  {
    id: "26",
    title: "Onsite Setup Day",
    description:
      "Venue setup, signage, technical checks, and material staging.",
    owner: "Logistics + Media",
    date: "2026-07-22",
    category: "event",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "27",
    title: "Conference Day 1 - Arrival and Opening",
    description:
      "Delegate check-in, opening formalities, and initial sessions.",
    owner: "Chair + Secretariat",
    date: "2026-07-23",
    category: "event",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "28",
    title: "Conference Day 2 - Proceedings and Elections",
    description:
      "Reports, campaigns, voting operations, and election announcements.",
    owner: "Program + IEC + Secretariat",
    date: "2026-07-24",
    category: "event",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "29",
    title: "Conference Day 3 - Independence and Sports",
    description: "Independence program, certification, and sports activities.",
    owner: "Program + Sports",
    date: "2026-07-25",
    category: "event",
    isCritical: false,
    isCompleted: false,
  },
  {
    id: "30",
    title: "Awards Night and Inaugural Ball",
    description: "Awards delivery, crowning flow, and formal evening program.",
    owner: "Program + Media + Logistics",
    date: "2026-07-26",
    category: "event",
    isCritical: false,
    isCompleted: false,
  },
  {
    id: "31",
    title: "Conference Closeout and Departure",
    description:
      "Final delegate support, venue handover, and closure activities.",
    owner: "Logistics + Secretariat",
    date: "2026-07-27",
    category: "event",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "32",
    title: "Committee Activity Report Submitted",
    description:
      "Comprehensive conference report delivered to NEC within one week.",
    owner: "Chair + Secretary",
    date: "2026-08-03",
    category: "post-event",
    isCritical: true,
    isCompleted: false,
  },
  {
    id: "33",
    title: "Post-Conference Audit Completed",
    description:
      "Financial audit and reconciled expenditure records finalized.",
    owner: "Financial Secretary + Treasurer",
    date: "2026-08-27",
    category: "post-event",
    isCritical: true,
    isCompleted: false,
  },
];

export function TimelineShell() {
  const [items, setItems] = useState<TimelineItem[]>(INITIAL_TIMELINE);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("governance");
  const [newOwner, setNewOwner] = useState("");
  const [newCritical, setNewCritical] = useState(false);

  const toggleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item,
      ),
    );
  };

  const handleAdd = () => {
    if (!newTitle || !newDate) return;
    const item: TimelineItem = {
      id: `local_${Date.now()}`,
      title: newTitle,
      description: newDesc,
      date: newDate,
      category: newCategory,
      owner: newOwner.trim() || "Unassigned",
      isCritical: newCritical,
      isCompleted: false,
    };
    setItems((prev) =>
      [...prev, item].sort((a, b) => a.date.localeCompare(b.date)),
    );
    setNewTitle("");
    setNewDesc("");
    setNewDate("");
    setNewCategory("governance");
    setNewOwner("");
    setNewCritical(false);
    setShowForm(false);
  };

  const completed = items.filter((i) => i.isCompleted).length;
  const progress =
    items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next14 = new Date(today);
  next14.setDate(next14.getDate() + 14);

  const overdueOpen = items.filter((item) => {
    if (item.isCompleted) return false;
    const due = new Date(item.date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  const dueSoon = items.filter((item) => {
    if (item.isCompleted) return false;
    const due = new Date(item.date);
    due.setHours(0, 0, 0, 0);
    return due >= today && due <= next14;
  }).length;

  const criticalOpen = items.filter(
    (item) => item.isCritical && !item.isCompleted,
  ).length;

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
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" />
          Add Milestone
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[#C8A061] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Overdue Open</p>
            <p className="text-xl font-semibold">{overdueOpen}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Due in 14 Days</p>
            <p className="text-xl font-semibold">{dueSoon}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Critical Open</p>
            <p className="text-xl font-semibold">{criticalOpen}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      {showForm && (
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
                <Label>Owner</Label>
                <Input
                  placeholder="e.g. Logistics Chair"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                />
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
                        Owner: {item.owner}
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
