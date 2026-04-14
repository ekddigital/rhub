"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  BookOpenText,
  CheckCircle2,
  Download,
  Printer,
  RefreshCcw,
  Search,
  Users,
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
import { AdaptivePhotoFrame } from "@/components/tools/conf/adaptive-photo-frame";
import { fetchDefaultConference } from "@/lib/conf/client";

type BookletScope = "all" | "paid" | "confirmed";

type BookletParticipant = {
  id: string;
  name: string;
  delegateCode: string | null;
  passportNo: string | null;
  gender: "MALE" | "FEMALE" | null;
  university: string | null;
  city: string;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  feePaid: boolean;
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  roomPref: "PAIR" | "SINGLE";
  bookletPhotoPath: string | null;
  partnerClaimNote: string | null;
  createdAt: string;
  roomCode: string | null;
  roommateName: string | null;
  roomType: "PAIR" | "SINGLE" | null;
  roomManualOverride: boolean;
  roomOverrideReason: string | null;
};

type BookletEvent = {
  id: string;
  name: string;
  slug: string;
  year: number;
  city: string;
  venue: string;
  startsAt: string;
  endsAt: string;
};

type BookletPayload = {
  event: BookletEvent;
  scope: BookletScope;
  participants: BookletParticipant[];
  counts: {
    total: number;
    paid: number;
    confirmed: number;
    withBookletPhotos: number;
    assignedRooms: number;
  };
  generatedAt: string;
};

const SCOPE_OPTIONS: Array<{ value: BookletScope; label: string }> = [
  { value: "confirmed", label: "Confirmed + Attended" },
  { value: "paid", label: "Paid Only" },
  { value: "all", label: "All Delegates" },
];

export function BookletShell() {
  const [confId, setConfId] = useState("");
  const [event, setEvent] = useState<BookletEvent | null>(null);
  const [participants, setParticipants] = useState<BookletParticipant[]>([]);
  const [counts, setCounts] = useState<BookletPayload["counts"]>({
    total: 0,
    paid: 0,
    confirmed: 0,
    withBookletPhotos: 0,
    assignedRooms: 0,
  });

  const [scope, setScope] = useState<BookletScope>("confirmed");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState("");

  const fetchBooklet = useCallback(
    async (id: string, nextScope: BookletScope) => {
      const res = await fetch(`/api/conf/${id}/booklet?scope=${nextScope}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load booklet data");
      }

      return (await res.json()) as BookletPayload;
    },
    [],
  );

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const conf = await fetchDefaultConference();
        setConfId(conf.id);

        const payload = await fetchBooklet(conf.id, scope);
        setEvent(payload.event);
        setParticipants(payload.participants);
        setCounts(payload.counts);
        setGeneratedAt(payload.generatedAt);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to initialize booklet",
        );
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [fetchBooklet, scope]);

  const refresh = async () => {
    if (!confId) return;
    try {
      setRefreshing(true);
      setError(null);
      const payload = await fetchBooklet(confId, scope);
      setEvent(payload.event);
      setParticipants(payload.participants);
      setCounts(payload.counts);
      setGeneratedAt(payload.generatedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh booklet");
    } finally {
      setRefreshing(false);
    }
  };

  const filteredParticipants = useMemo(() => {
    if (!search.trim()) return participants;
    const q = search.trim().toLowerCase();
    return participants.filter((participant) => {
      return (
        participant.name.toLowerCase().includes(q) ||
        (participant.delegateCode || "").toLowerCase().includes(q) ||
        (participant.passportNo || "").toLowerCase().includes(q) ||
        participant.city.toLowerCase().includes(q) ||
        (participant.university || "").toLowerCase().includes(q)
      );
    });
  }, [participants, search]);

  const handleExportCsv = () => {
    const header =
      "Conference ID,Name,Gender,Passport No,University,City,Phone,WeChat,Email,Fee Paid,Status,Room Code,Roommate,Room Type,Booklet Photo";
    const rows = filteredParticipants.map((participant) =>
      [
        participant.delegateCode || "",
        `"${participant.name}"`,
        participant.gender || "",
        participant.passportNo || "",
        `"${participant.university || ""}"`,
        `"${participant.city}"`,
        participant.phone || "",
        participant.wechat || "",
        participant.email || "",
        participant.feePaid ? "Yes" : "No",
        participant.status,
        participant.roomCode || "",
        `"${participant.roommateName || ""}"`,
        participant.roomType || "",
        participant.bookletPhotoPath ? "Yes" : "No",
      ].join(","),
    );

    const csv = `${header}\n${rows.join("\n")}`;
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conference-booklet-roster.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const dateRange = event
    ? `${new Date(event.startsAt).toLocaleDateString()} - ${new Date(event.endsAt).toLocaleDateString()}`
    : "";

  if (loading) {
    return (
      <div className="space-y-4 py-6 conf-booklet-page">
        <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-20 animate-pulse rounded-md bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 conf-booklet-page">
      <div className="flex items-center gap-4 conf-booklet-actions">
        <Link href="/tools/conf/delegates">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Conference Booklet Builder
          </h1>
          <p className="text-sm text-muted-foreground">
            Printable participant profiles for LSUIC booklet production.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print / Save PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCcw className="size-4" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card className="border-[#C8A061]/30 bg-linear-to-r from-[#1F1C18]/5 to-transparent">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/conf/lsuic_logo.png"
              alt="LSUIC Logo"
              width={60}
              height={60}
              className="h-14 w-14 rounded-full border border-[#C8A061]/40 bg-white object-contain p-2 shadow-sm"
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#8E0E00]">
                LSUIC Participant Booklet
              </p>
              <p className="text-lg font-bold">
                {event?.name || "Conference Booklet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {event?.venue || ""} - {event?.city || ""} - {dateRange}
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Generated:{" "}
            {generatedAt ? new Date(generatedAt).toLocaleString() : "-"}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{counts.total}</p>
              <p className="text-xs text-muted-foreground">
                Included Delegates
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-green-500/10 p-2">
              <CheckCircle2 className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{counts.paid}</p>
              <p className="text-xs text-muted-foreground">Payment Confirmed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <BookOpenText className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{counts.withBookletPhotos}</p>
              <p className="text-xs text-muted-foreground">Booklet Photos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <BedDouble className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{counts.assignedRooms}</p>
              <p className="text-xs text-muted-foreground">Room Assignments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="conf-booklet-actions">
        <CardHeader>
          <CardTitle className="text-base">Booklet Filters</CardTitle>
          <CardDescription>
            Control roster scope and search for individual delegates before
            printing.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1.5 text-sm">
            <span className="text-muted-foreground">Participant Scope</span>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={scope}
              onChange={(e) => setScope(e.target.value as BookletScope)}
            >
              {SCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm sm:col-span-2 xl:col-span-2">
            <span className="text-muted-foreground">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, ID, passport, city, or university"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </label>
        </CardContent>
      </Card>

      {filteredParticipants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-base font-medium">
              No delegates matched this booklet view.
            </p>
            <p className="text-sm text-muted-foreground">
              Change the scope or search query, then refresh the roster.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 conf-booklet-grid">
          {filteredParticipants.map((participant) => (
            <Card key={participant.id} className="conf-booklet-card">
              <CardContent className="pt-4">
                <div className="mb-3 flex gap-3">
                  {participant.bookletPhotoPath ? (
                    <AdaptivePhotoFrame
                      src={participant.bookletPhotoPath}
                      alt={participant.name}
                      containerClassName="h-28 w-24 rounded-md border border-border"
                    />
                  ) : (
                    <div className="flex h-28 w-24 items-center justify-center rounded-md border border-dashed border-border bg-muted text-xs text-muted-foreground">
                      No Photo
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-base font-semibold">
                      {participant.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.delegateCode || "Pending Conference ID"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.university || "University pending"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.city}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Badge
                        variant={participant.feePaid ? "default" : "outline"}
                      >
                        {participant.feePaid ? "Paid" : "Unpaid"}
                      </Badge>
                      <Badge variant="secondary">{participant.status}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Passport: {participant.passportNo || "-"}</p>
                  <p>Phone: {participant.phone || "-"}</p>
                  <p>WeChat: {participant.wechat || "-"}</p>
                  <p>Email: {participant.email || "-"}</p>
                  <p>Gender: {participant.gender || "-"}</p>
                  <p>
                    Room: {participant.roomCode || "Pending"}
                    {participant.roommateName
                      ? ` with ${participant.roommateName}`
                      : ""}
                  </p>
                  <p>
                    Room Type: {participant.roomType || participant.roomPref}
                    {participant.roomManualOverride ? " (manual)" : ""}
                  </p>
                  {participant.roomOverrideReason && (
                    <p className="text-amber-700">
                      Override: {participant.roomOverrideReason}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <style jsx global>{`
        @media print {
          .conf-booklet-actions {
            display: none !important;
          }

          .conf-booklet-page {
            padding-top: 0 !important;
          }

          .conf-booklet-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }

          .conf-booklet-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
