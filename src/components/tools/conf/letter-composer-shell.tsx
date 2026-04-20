"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Printer,
  FolderOpen,
  Plus,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Clock,
  ZoomIn,
  ZoomOut,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { fetchDefaultConference } from "@/lib/conf/client";

// ── Types ────────────────────────────────────────────────────────────────────

type LetterDraft = {
  id: string;
  title: string;
  to: string;
  from: string;
  re: string;
  date: string;
  body: string;
  savedAt: string;
};

type Member = {
  id: string;
  name: string;
  role: string;
  title: string | null;
  city: string | null;
  committeeScope: string | null;
  phone: string | null;
};

type ConfInfo = {
  name: string;
  city: string;
  venue: string | null;
  startsAt: string;
  endsAt: string;
};

// ── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = "conf_letter_drafts";

function loadDrafts(): LetterDraft[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as LetterDraft[]) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: LetterDraft[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(drafts));
  } catch {
    // storage full
  }
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function newDraft(): LetterDraft {
  return {
    id: newId(),
    title: "",
    to: "",
    from: "Enoch Kwateh Dongbo\nConference Chair, LSUIC 2026",
    re: "",
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    body: "",
    savedAt: "",
  };
}

// ── Design constants (mirrors letterhead route) ───────────────────────────────

const C = {
  navy: "#002868",
  darkNavy: "#001A4E",
  red: "#BF0A30",
  gold: "#C8A061",
  white: "#FFFFFF",
  muted: "#777777",
  sideAccent: "#88A4C8",
  divider: "#1a3568",
};

const FLAG_STRIPES_11 = [
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
] as const;

const ROLE_LABELS: Record<string, string> = {
  CHAIR: "General Chairman",
  VICE_CHAIR: "General Co-Chair",
  SECRETARY: "General Secretary",
  TREASURER: "Treasurer",
};

function memberLabel(m: Member): string {
  const base = ROLE_LABELS[m.role];
  if (base) return base;
  return m.title ?? m.committeeScope ?? "Committee Member";
}

function fmtDateRange(start: string, end: string): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-US", opts);
  return (
    fmt(new Date(start), { month: "long", day: "numeric" }) +
    " – " +
    fmt(new Date(end), { month: "long", day: "numeric", year: "numeric" })
  );
}

// ── A4 Letter Preview ─────────────────────────────────────────────────────────

function LetterA4Preview({
  draft,
  members,
  confInfo,
  forPrint = false,
}: {
  draft: LetterDraft;
  members: Member[];
  confInfo: ConfInfo | null;
  forPrint?: boolean;
}) {
  const PAGE_W = 794;
  const PAGE_H = 1123;
  const STRIPE_H = 14;
  const HEADER_H = 158; // taller to fit officer phone row
  const GOLD_BAR = 2.5;
  const OFFICE_ROW = 26;
  const NAVY_BAR = 7;
  const RED_BAR = 3;
  const TOTAL_HEADER =
    STRIPE_H + HEADER_H + GOLD_BAR + OFFICE_ROW + NAVY_BAR + RED_BAR;
  const FOOTER_H = 32;
  const SIDEBAR_W = 215; // navy-accent(8) + red-accent(3) + content(204)
  const BODY_H = PAGE_H - TOTAL_HEADER - FOOTER_H;

  const KEY_ORDER = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"];
  const sortedMembers = [
    ...KEY_ORDER.map((r) => members.find((m) => m.role === r)).filter(Boolean),
    ...members.filter((m) => !KEY_ORDER.includes(m.role)),
  ] as Member[];

  // Officers whose phones go in the header
  const chair = members.find((m) => m.role === "CHAIR");
  const viceChair = members.find((m) => m.role === "VICE_CHAIR");
  const secretary = members.find((m) => m.role === "SECRETARY");
  const officerPhones = [
    chair && chair.phone ? { label: "Chair", phone: chair.phone } : null,
    viceChair && viceChair.phone
      ? { label: "Co-Chair", phone: viceChair.phone }
      : null,
    secretary && secretary.phone
      ? { label: "Secretary", phone: secretary.phone }
      : null,
  ].filter(Boolean) as { label: string; phone: string }[];

  const dateRange = confInfo
    ? fmtDateRange(confInfo.startsAt, confInfo.endsAt)
    : "July 23 – 27, 2026";
  const venue = confInfo?.venue ?? "Arcadia Spa Golf International Hotel";

  return (
    <div
      className="letter-page"
      style={{
        width: PAGE_W,
        height: forPrint ? "auto" : PAGE_H,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        overflow: forPrint ? "visible" : "hidden",
        boxShadow: forPrint ? "none" : "0 4px 32px rgba(0,0,0,0.18)",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* ── Liberian flag stripes ── */}
      <div style={{ display: "flex", height: STRIPE_H, flexShrink: 0 }}>
        {FLAG_STRIPES_11.map((color, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: color,
              borderBottom: color === "#FFFFFF" ? "0.5px solid #ddd" : "none",
            }}
          />
        ))}
      </div>

      {/* ── Header row: logo | text | seal ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: HEADER_H,
          flexShrink: 0,
          background: C.white,
          padding: "10px 18px",
          gap: 12,
        }}
      >
        {/* LSUIC Logo */}
        <div
          style={{
            flexShrink: 0,
            width: 108,
            height: 108,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/conf/lsuic_logo.png"
            alt="LSUIC"
            style={{ width: 108, height: 108, objectFit: "contain" }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              (el.parentElement as HTMLElement).innerHTML =
                '<span style="font-size:10px;font-weight:800;color:#002868;">LSUIC</span>';
            }}
          />
        </div>

        {/* Center text block */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 800,
              color: C.navy,
              letterSpacing: "0.3px",
              lineHeight: 1.2,
            }}
          >
            LIBERIAN STUDENT UNION IN CHINA (LSUIC)
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: C.gold,
              marginTop: 4,
            }}
          >
            {confInfo?.name ?? "LSUIC 20th Anniversary National Conference"}
          </div>
          <div style={{ fontSize: 8.5, color: "#555", marginTop: 4 }}>
            {venue}
          </div>
          <div style={{ fontSize: 8.5, color: "#555" }}>
            {confInfo?.city ?? "Jinan"}, Shandong Province, P.R. China
          </div>
          <div style={{ fontSize: 8.5, color: "#555" }}>{dateRange}</div>
          <div style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>
            Email: ekd@ekddigital.com · lsuic2006@gmail.com
          </div>
          {officerPhones.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginTop: 5,
                flexWrap: "wrap" as const,
              }}
            >
              {officerPhones.map(({ label, phone }) => (
                <span
                  key={label}
                  style={{ fontSize: 8.5, color: C.navy, fontWeight: 600 }}
                >
                  {label}: {phone}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Liberia National Seal */}
        <div
          style={{
            flexShrink: 0,
            width: 104,
            height: 104,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/conf/liberia-seal.svg"
            alt="Liberia Seal"
            style={{ width: 104, height: 104, objectFit: "contain" }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              (el.parentElement as HTMLElement).innerHTML =
                '<span style="font-size:7px;text-align:center;color:#002868;">REPUBLIC OF LIBERIA</span>';
            }}
          />
        </div>
      </div>

      {/* ── Gold separator ── */}
      <div style={{ height: GOLD_BAR, background: C.gold, flexShrink: 0 }} />

      {/* ── "Office of…" row ── */}
      <div
        style={{
          height: OFFICE_ROW,
          background: C.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 20px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: C.navy,
            fontStyle: "italic",
          }}
        >
          Office of the Conference Chairman
        </span>
      </div>

      {/* ── Navy + Red bars ── */}
      <div style={{ height: NAVY_BAR, background: C.navy, flexShrink: 0 }} />
      <div style={{ height: RED_BAR, background: C.red, flexShrink: 0 }} />

      {/* ── Body area: sidebar + content ── */}
      <div
        style={{
          display: "flex",
          height: forPrint ? "auto" : BODY_H,
          flexShrink: 0,
          overflow: forPrint ? "visible" : "hidden",
        }}
      >
        {/* Left sidebar — white bg, navy+red left accent, center-aligned (matches reference letter) */}
        <div
          style={{
            width: SIDEBAR_W,
            background: C.white,
            flexShrink: 0,
            overflow: forPrint ? "visible" : "hidden",
            display: "flex",
            borderRight: `1px solid #dde3ef`,
          }}
        >
          {/* Vertical accent strips */}
          <div style={{ display: "flex", flexShrink: 0, height: "100%" }}>
            <div style={{ width: 8, background: C.navy }} />
            <div style={{ width: 3, background: C.red }} />
          </div>

          {/* Member list */}
          <div
            style={{
              flex: 1,
              padding: "12px 8px 12px 9px",
              overflowY: forPrint ? "visible" : "hidden",
            }}
          >
            <div
              style={{
                fontSize: 7.5,
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "0.8px",
                textTransform: "uppercase" as const,
                textAlign: "center",
                marginBottom: 5,
              }}
            >
              CONFERENCE COMMITTEE
            </div>
            <div
              style={{
                height: 1,
                background: C.navy,
                opacity: 0.25,
                marginBottom: 9,
              }}
            />
            {sortedMembers.map((m) => (
              <div key={m.id} style={{ marginBottom: 6, textAlign: "center" }}>
                {/* Name: bold italic navy, largest */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.navy,
                    fontStyle: "italic",
                    lineHeight: 1.25,
                    wordBreak: "break-word" as const,
                  }}
                >
                  {m.name}
                </div>
                {/* Role: italic navy, slightly smaller */}
                <div
                  style={{
                    fontSize: 9.5,
                    color: C.navy,
                    fontStyle: "italic",
                    lineHeight: 1.3,
                    opacity: 0.8,
                  }}
                >
                  {memberLabel(m)}
                </div>
                {/* City */}
                {m.city && (
                  <div
                    style={{
                      fontSize: 9,
                      color: "#444",
                      fontStyle: "italic",
                      lineHeight: 1.3,
                    }}
                  >
                    {m.city}, China
                  </div>
                )}
                {/* Phone: bold italic, prominent — matches reference */}
                {m.phone && (
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: C.navy,
                      fontStyle: "italic",
                      lineHeight: 1.4,
                      marginTop: 2,
                    }}
                  >
                    {m.phone}
                  </div>
                )}
                {/* Thin divider */}
                <div
                  style={{
                    height: 0.8,
                    background: C.navy,
                    opacity: 0.15,
                    marginTop: 6,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Main letter content */}
        <div
          style={{
            flex: 1,
            padding: "24px 32px 24px",
            overflow: forPrint ? "visible" : "hidden",
          }}
        >
          {/* Date (right-aligned) */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>
              {draft.date ||
                new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </span>
          </div>

          {/* To / From / Re */}
          <div
            style={{
              fontSize: 12,
              color: "#222",
              lineHeight: 1.8,
              marginBottom: 6,
            }}
          >
            {draft.to && (
              <div>
                <strong style={{ color: C.navy }}>To:</strong>{" "}
                <span style={{ whiteSpace: "pre-line" }}>{draft.to}</span>
              </div>
            )}
            {draft.from && (
              <div>
                <strong style={{ color: C.navy }}>From:</strong>{" "}
                <span style={{ whiteSpace: "pre-line" }}>{draft.from}</span>
              </div>
            )}
            {draft.re && (
              <div style={{ marginTop: 4 }}>
                <strong style={{ color: C.navy }}>Re:</strong>{" "}
                <strong>{draft.re}</strong>
              </div>
            )}
          </div>

          {/* Gold divider */}
          <div style={{ height: 1.5, background: C.gold, margin: "12px 0" }} />

          {/* Body text */}
          <div
            style={{
              fontSize: 12,
              color: "#222",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}
          >
            {draft.body ? (
              draft.body
            ) : (
              <span style={{ color: "#bbb", fontStyle: "italic" }}>
                Your letter content will appear here as you type…
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          height: FOOTER_H,
          background: C.navy,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            height: 2,
            background: C.red,
            width: "100%",
            marginBottom: 4,
          }}
        />
        <div
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: C.gold,
            letterSpacing: "0.5px",
          }}
        >
          Motto: &quot;Excellence Through Hard Work&quot;
        </div>
      </div>
    </div>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────

export function LetterComposerShell() {
  const [confId, setConfId] = useState("");
  const [confInfo, setConfInfo] = useState<ConfInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<LetterDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<LetterDraft>(newDraft);
  const [showList, setShowList] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [zoom, setZoom] = useState(72);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch conf data ──────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const conf = await fetchDefaultConference();
        setConfId(conf.id);

        const [eventRes, membersRes] = await Promise.all([
          fetch(`/api/conf/${conf.id}/route`).catch(() => null),
          fetch(`/api/conf/${conf.id}/members`),
        ]);

        if (membersRes.ok) {
          const mems = (await membersRes.json()) as Member[];
          setMembers(mems.filter((m) => m.role !== "COMMITTEE" || m.title));
        }

        // Try to get event info from members endpoint data or fallback
        // We'll try the default conf endpoint
        const defRes = await fetch("/api/conf/default");
        if (defRes.ok) {
          // fetch detailed info
          const detRes = await fetch(`/api/conf/${conf.id}/booklet/data`).catch(
            () => null,
          );
          if (detRes?.ok) {
            const data = await detRes.json();
            if (data?.event) {
              setConfInfo({
                name: data.event.name,
                city: data.event.city,
                venue: data.event.venue,
                startsAt: data.event.startsAt,
                endsAt: data.event.endsAt,
              });
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  // ── Drafts ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = loadDrafts();
    setDrafts(stored);
    if (stored.length > 0) setActiveDraft(stored[0]);
  }, []);

  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      persistDraft(activeDraft);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDraft]);

  const persistDraft = useCallback((draft: LetterDraft) => {
    const updated = { ...draft, savedAt: new Date().toISOString() };
    setDrafts((prev) => {
      const exists = prev.find((d) => d.id === updated.id);
      const next = exists
        ? prev.map((d) => (d.id === updated.id ? updated : d))
        : [updated, ...prev];
      saveDrafts(next);
      return next;
    });
  }, []);

  const handleManualSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    persistDraft(activeDraft);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2500);
  }, [activeDraft, persistDraft]);

  const handleNew = useCallback(() => {
    setActiveDraft(newDraft());
    setShowList(false);
  }, []);

  const handleLoad = useCallback((d: LetterDraft) => {
    setActiveDraft(d);
    setShowList(false);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setDrafts((prev) => {
        const next = prev.filter((d) => d.id !== id);
        saveDrafts(next);
        return next;
      });
      if (activeDraft.id === id) {
        const remaining = drafts.filter((d) => d.id !== id);
        setActiveDraft(remaining.length > 0 ? remaining[0] : newDraft());
      }
    },
    [activeDraft.id, drafts],
  );

  const set = useCallback(
    (field: keyof LetterDraft) => (v: string) =>
      setActiveDraft((d) => ({ ...d, [field]: v })),
    [],
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Open a clean popup window with just the A4 letter, then auto-print
  // so the user stays on the composer page and only needs one click to save.
  const handleDownloadPdf = useCallback(() => {
    const root = document.getElementById("letter-print-root");
    if (!root) {
      window.print();
      return;
    }
    const popup = window.open(
      "",
      "_blank",
      `width=860,height=1000,scrollbars=no,menubar=no,toolbar=no,status=no`,
    );
    if (!popup) {
      // Popups blocked — fall back to same-window print
      window.print();
      return;
    }
    popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <base href="${window.location.origin}">
  <title>LSUIC Letter</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 794px; background: #888; }
    .letter-page { box-shadow: none !important; display: block !important; }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      html, body { background: #fff !important; width: 210mm; height: 297mm; overflow: hidden; }
      .letter-page { width: 210mm !important; height: 297mm !important; box-shadow: none !important; }
    }
  </style>
</head>
<body>
  ${root.innerHTML}
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 400);
    });
  <\/script>
</body>
</html>`);
    popup.document.close();
  }, []);

  // ── Loading / error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground">
          Loading conference data…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Print CSS.
           #letter-print-root is always rendered but positioned off-screen
           so images load. In print mode we hide the whole app shell with
           visibility:hidden (works even on app-shell divs we don't own),
           then reveal only the print root. */}
      <style>{`
        #letter-print-root {
          position: fixed;
          left: -9999px;
          top: 0;
          width: 794px;
          pointer-events: none;
        }
        @media print {
          body * { visibility: hidden !important; }
          #letter-print-root,
          #letter-print-root * { visibility: visible !important; }
          #letter-print-root {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            pointer-events: auto !important;
          }
          .letter-page {
            width: 210mm !important;
            height: 297mm !important;
            box-shadow: none !important;
            transform: none !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* ── Viewport frame: header + 2-panel body ── */}
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-0">

      {/* ── Header ── */}
      <div className="letter-no-print flex items-center gap-4 shrink-0 pb-3 mb-3 border-b border-border/30">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Letter Composer</h1>
          <p className="text-sm text-muted-foreground">
            Write official correspondence with the LSUIC letterhead — download
            as PDF
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveStatus === "saved" ? (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-500" /> Saved
              </>
            ) : (
              <>
                <Clock className="size-3.5" /> Auto-saving
              </>
            )}
          </span>
          <Button variant="outline" size="sm" onClick={handleManualSave}>
            <Save className="size-4" /> Save Draft
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowList((v) => !v)}
          >
            <FolderOpen className="size-4" />
            Drafts ({drafts.length})
            <ChevronDown
              className={`size-3.5 ml-1 transition-transform ${showList ? "rotate-180" : ""}`}
            />
          </Button>
          <Button size="sm" onClick={handleNew}>
            <Plus className="size-4" /> New Letter
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-[#002868] hover:bg-[#001A4E]"
          >
            <Printer className="size-4" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* ── Drafts list ── */}
      {showList && (
        <Card className="letter-no-print border-[#C8A061]/30 shrink-0 mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Saved Drafts</CardTitle>
            <CardDescription className="text-xs">
              Click a draft to load it. Drafts are saved locally on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No saved drafts yet.
              </p>
            ) : (
              <div className="space-y-2">
                {drafts.map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
                      d.id === activeDraft.id
                        ? "border-[#C8A061]/50 bg-[#C8A061]/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleLoad(d)}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {d.title || d.re || "Untitled Letter"}
                        {d.id === activeDraft.id && (
                          <span className="ml-2 text-xs text-[#C8A061]">
                            current
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {d.date}
                        {d.to ? ` · To: ${d.to.split("\n")[0]}` : ""}
                        {d.savedAt
                          ? ` · saved ${new Date(d.savedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                          : ""}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(d.id)}
                        title="Delete draft"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Main layout: form (left) + preview (right) ── */}
      <div className="letter-no-print flex gap-6 flex-1 min-h-0">
        {/* ── Left: form fields ── */}
        <div className="w-[380px] shrink-0 overflow-y-auto space-y-4 pr-1 pb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="size-4 text-[#C8A061]" />
                Letter Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Draft Label (internal)</Label>
                <Input
                  placeholder="e.g. Committee Action Items Apr 20"
                  className="h-8 text-sm"
                  value={activeDraft.title}
                  onChange={(e) => set("title")(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  placeholder="e.g. April 20, 2026"
                  className="h-8 text-sm"
                  value={activeDraft.date}
                  onChange={(e) => set("date")(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To</Label>
                <Textarea
                  placeholder="e.g. All Committee Members&#10;LSUIC 2026 Conference"
                  className="text-sm resize-none"
                  rows={2}
                  value={activeDraft.to}
                  onChange={(e) => set("to")(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">From</Label>
                <Textarea
                  placeholder="e.g. Enoch Kwateh Dongbo&#10;Conference Chair, LSUIC 2026"
                  className="text-sm resize-none"
                  rows={2}
                  value={activeDraft.from}
                  onChange={(e) => set("from")(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subject / Re</Label>
                <Input
                  placeholder="e.g. Committee Action Items — Week of April 20"
                  className="h-8 text-sm"
                  value={activeDraft.re}
                  onChange={(e) => set("re")(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Letter Body</CardTitle>
              <CardDescription className="text-xs">
                Paste or type your content. Use blank lines to separate
                paragraphs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Type or paste your letter content here…"
                className="text-sm resize-none font-mono"
                rows={18}
                value={activeDraft.body}
                onChange={(e) => set("body")(e.target.value)}
              />
              <p className="mt-1.5 text-[10px] text-muted-foreground text-right">
                {activeDraft.body.length} characters
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-[#002868] hover:bg-[#001A4E]"
              onClick={handleDownloadPdf}
            >
              <Printer className="size-4" />
              Download PDF
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Opens in a new window — choose &quot;Save as PDF&quot; in the print
            dialog.
          </p>
        </div>

        {/* ── Right: A4 preview ── */}
        <div className="flex-1 min-w-0 overflow-y-auto pb-6">
          {/* Zoom controls */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-[#002868]">
              Live A4 Preview
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setZoom((z) => Math.max(40, z - 5))}
                className="px-2 py-1 text-xs hover:bg-muted/50"
                title="Zoom out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="px-2 text-xs font-mono">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(120, z + 5))}
                className="px-2 py-1 text-xs hover:bg-muted/50"
                title="Zoom in"
              >
                <ZoomIn className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Preview viewport */}
          <div
            style={{
              background: "#c8c8c8",
              borderRadius: 12,
              padding: 24,
              overflowX: "auto",
            }}
          >
            <div
              className="letter-document"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                width: 794,
                margin: "0 auto",
                marginBottom:
                  zoom < 100 ? `${((zoom - 100) / 100) * 900}px` : 0,
              }}
            >
              <LetterA4Preview
                draft={activeDraft}
                members={members}
                confInfo={confInfo}
              />
            </div>
          </div>
        </div>
      </div>

      </div>{/* end flex flex-col viewport frame */}

      {/* ── Print root — rendered off-screen (not display:none so visibility trick works) ── */}
      <div id="letter-print-root">
        <LetterA4Preview
          draft={activeDraft}
          members={members}
          confInfo={confInfo}
        />
      </div>
    </div>
  );
}
