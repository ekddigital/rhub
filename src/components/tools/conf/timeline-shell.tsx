"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, CheckCircle2, Circle, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  isCompleted: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  planning: "bg-blue-500",
  preparation: "bg-purple-500",
  execution: "bg-orange-500",
  event: "bg-emerald-500",
  "post-event": "bg-gray-500",
};

const INITIAL_TIMELINE: TimelineItem[] = [
  {
    id: "1",
    title: "Committee Formation",
    description: "Chair appointment and initial committee member selection",
    date: "2026-04-06",
    category: "planning",
    isCompleted: true,
  },
  {
    id: "2",
    title: "First Committee Meeting",
    description: "Kickoff meeting — roles, timeline, system overview",
    date: "2026-04-10",
    category: "planning",
    isCompleted: false,
  },
  {
    id: "3",
    title: "Budget Draft Submission",
    description: "All committee budget drafts due for review",
    date: "2026-04-24",
    category: "planning",
    isCompleted: false,
  },
  {
    id: "4",
    title: "Budget Approval",
    description: "Final budget review and approval by committee",
    date: "2026-05-01",
    category: "preparation",
    isCompleted: false,
  },
  {
    id: "5",
    title: "Delegate Registration Opens",
    description: "Open registration for all LSUIC members",
    date: "2026-05-01",
    category: "preparation",
    isCompleted: false,
  },
  {
    id: "6",
    title: "Mid-Point Review",
    description: "Progress check on all committees and logistics",
    date: "2026-05-15",
    category: "preparation",
    isCompleted: false,
  },
  {
    id: "7",
    title: "Program Finalization",
    description: "Conference program, speakers, and schedule finalized",
    date: "2026-06-12",
    category: "execution",
    isCompleted: false,
  },
  {
    id: "8",
    title: "Registration Deadline",
    description: "Final date for delegate registration and fee payment",
    date: "2026-06-30",
    category: "execution",
    isCompleted: false,
  },
  {
    id: "9",
    title: "Final Preparations",
    description:
      "All materials printed, logistics confirmed, supplies purchased",
    date: "2026-07-10",
    category: "execution",
    isCompleted: false,
  },
  {
    id: "10",
    title: "Conference Day 1",
    description: "Arrival, registration, welcome ceremony",
    date: "2026-07-23",
    category: "event",
    isCompleted: false,
  },
  {
    id: "11",
    title: "Conference Day 5",
    description: "Closing ceremony, departure",
    date: "2026-07-27",
    category: "event",
    isCompleted: false,
  },
  {
    id: "12",
    title: "Post-Conference Audit",
    description: "Financial audit within 30 days per financial policy",
    date: "2026-08-27",
    category: "post-event",
    isCompleted: false,
  },
];

export function TimelineShell() {
  const [items, setItems] = useState<TimelineItem[]>(INITIAL_TIMELINE);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("planning");

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
      isCompleted: false,
    };
    setItems((prev) =>
      [...prev, item].sort((a, b) => a.date.localeCompare(b.date)),
    );
    setNewTitle("");
    setNewDesc("");
    setNewDate("");
    setNewCategory("planning");
    setShowForm(false);
  };

  const completed = items.filter((i) => i.isCompleted).length;
  const progress =
    items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

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
                  <option value="planning">Planning</option>
                  <option value="preparation">Preparation</option>
                  <option value="execution">Execution</option>
                  <option value="event">Event</option>
                  <option value="post-event">Post-Event</option>
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
        <div className="absolute left-[19px] top-0 h-full w-0.5 bg-border" />

        {items.map((item, idx) => {
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
                  <CheckCircle2 className="size-[38px] text-[#C8A061]" />
                ) : (
                  <Circle
                    className={`size-[38px] ${isToday ? "text-[#C8A061]" : isPast ? "text-muted-foreground" : "text-border"}`}
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
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="mr-1 size-3" />
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Badge>
                      <div
                        className={`size-2 rounded-full ${CATEGORY_COLORS[item.category] || "bg-gray-400"}`}
                      />
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
