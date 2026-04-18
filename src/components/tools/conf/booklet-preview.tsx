"use client";

import { useState } from "react";
import { Download, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  BookletData,
  BookletSection,
  LeaderProfile,
  NecMember,
} from "./booklet-manager-shell";

type Meeting = BookletData["meetings"][0];

// ─── Helper ───────────────────────────────────────────────────────────────────

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtRange(start: string | Date, end: string | Date) {
  const s = new Date(start);
  const e = new Date(end);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${fmt(s)} – ${fmt(e)}`;
}

const ROLE_LABELS: Record<string, string> = {
  CHAIR: "General Chairman",
  VICE_CHAIR: "General Co-Chair",
  SECRETARY: "General Secretary",
  TREASURER: "Treasurer",
  COMMITTEE: "",
};

function roleLabel(m: NecMember) {
  const base = ROLE_LABELS[m.role];
  if (base !== undefined && base !== "") return base;
  return m.title ?? m.committeeScope ?? "Committee Member";
}

// ─── Shared: letterhead mini header ──────────────────────────────────────────

function PageHeader({
  confName,
  section,
}: {
  confName: string;
  section: string;
}) {
  return (
    <div className="mb-8 border-b border-[#C8A061]/30 pb-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C8A061]">
            LIBERIAN STUDENT UNION IN CHINA
          </p>
          <p className="mt-0.5 text-xs text-[#182e5f]/70">{confName}</p>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {section}
        </p>
      </div>
    </div>
  );
}

// ─── Cover page ───────────────────────────────────────────────────────────────

function CoverPage({
  event,
  bookletTitle,
  bookletSubtitle,
  theme,
}: {
  event: BookletData["event"];
  bookletTitle: string;
  bookletSubtitle: string | null;
  theme: string | null;
}) {
  return (
    <div
      className="relative flex min-h-[560px] flex-col overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #182e5f 0%, #0D1F45 55%, #1F1C18 100%)",
      }}
    >
      {/* Gold top bar */}
      <div className="h-2 w-full bg-gradient-to-r from-[#C8A061] via-[#D4AF6A] to-[#C8A061]" />

      {/* Decorative gold diagonal overlay */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-5"
        style={{
          background:
            "repeating-linear-gradient(-45deg, #C8A061 0px, #C8A061 1px, transparent 1px, transparent 20px)",
        }}
      />

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-10 py-12 text-center">
        {/* LSUIC emblem placeholder */}
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#C8A061] bg-white/10"
          aria-hidden
        >
          <span className="text-sm font-bold tracking-wider text-[#C8A061]">
            LSUIC
          </span>
        </div>

        {/* Organization name */}
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C8A061]/80">
          Liberian Student Union in China
        </p>

        {/* Rule */}
        <div className="my-4 h-px w-24 bg-gradient-to-r from-transparent via-[#C8A061] to-transparent" />

        {/* Conference name */}
        <h1 className="max-w-sm text-2xl font-bold leading-tight text-white">
          {bookletTitle}
        </h1>

        {bookletSubtitle && (
          <p className="mt-2 text-sm font-medium text-[#C8A061]">
            {bookletSubtitle}
          </p>
        )}

        {theme && (
          <p className="mt-4 max-w-xs text-xs italic text-white/60">
            &ldquo;{theme}&rdquo;
          </p>
        )}

        {/* Rule */}
        <div className="my-5 h-px w-24 bg-gradient-to-r from-transparent via-[#C8A061] to-transparent" />

        {/* Dates + Venue */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white/90">
            {fmtRange(event.startsAt, event.endsAt)}
          </p>
          <p className="text-xs text-white/60">
            {event.venue}, {event.city}, China
          </p>
        </div>
      </div>

      {/* Maroon bottom band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#8E0E00] via-[#C8A061] to-[#8E0E00]" />
    </div>
  );
}

// ─── Back cover ───────────────────────────────────────────────────────────────

function BackCoverPage({ event }: { event: BookletData["event"] }) {
  return (
    <div
      className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden px-10 py-10 text-center"
      style={{
        background: "linear-gradient(160deg, #C8A061 0%, #D4AF6A 50%, #B8903A 100%)",
      }}
    >
      {/* Decorative */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/20">
        <span className="text-xs font-bold tracking-wider text-white">
          LSUIC
        </span>
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/80">
        Liberian Student Union in China
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{event.name}</p>
      <p className="mt-1 text-xs text-white/70">
        {event.venue} · {event.city} · {event.year}
      </p>
      <div className="my-5 h-px w-20 bg-white/30" />
      <p className="max-w-xs text-[10px] leading-relaxed text-white/60">
        &ldquo;Promoting Education, Unity and Development&rdquo;
        <br />
        Est. July 2008
      </p>
    </div>
  );
}

// ─── Leader section ───────────────────────────────────────────────────────────

function LeaderSection({
  section,
  leaders,
  confName,
}: {
  section: BookletSection;
  leaders: LeaderProfile[];
  confName: string;
}) {
  return (
    <div className="px-10 py-8">
      <PageHeader confName={confName} section={section.title} />
      <div className="grid gap-6 sm:grid-cols-2">
        {leaders.map((l) => (
          <div
            key={l.id}
            className="flex gap-4 rounded-xl border border-[#C8A061]/20 bg-[#C8A061]/5 p-4"
          >
            {l.photoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={l.photoPath}
                alt={l.name}
                className="h-20 w-16 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-[#182e5f]/10">
                <span className="text-xs font-bold text-[#182e5f]/40">
                  {l.name[0]}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E0E00]">
                {l.role}
              </p>
              <p className="mt-0.5 text-sm font-bold leading-tight text-[#1F1C18]">
                {l.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{l.title}</p>
              {l.country && (
                <Badge
                  variant="outline"
                  className="mt-2 text-[10px]"
                >
                  {l.country}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Address / Bio section ────────────────────────────────────────────────────

function AddressSection({
  section,
  speaker,
  content,
  confName,
}: {
  section: BookletSection;
  speaker: NecMember | null;
  content: string | null | undefined;
  confName: string;
}) {
  return (
    <div className="px-10 py-8">
      <PageHeader confName={confName} section={section.title} />

      {/* Gold quote mark */}
      <div className="mb-4 text-5xl font-serif leading-none text-[#C8A061]/30">
        &ldquo;
      </div>

      {speaker && (
        <div className="mb-5 flex items-center gap-3">
          {speaker.photoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={speaker.photoPath}
              alt={speaker.name}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-[#C8A061]/40"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C8A061]/20 text-[#C8A061] font-bold">
              {speaker.name[0]}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-[#1F1C18]">{speaker.name}</p>
            <p className="text-xs text-muted-foreground">{roleLabel(speaker)}</p>
          </div>
        </div>
      )}

      {content ? (
        <div className="prose prose-sm max-w-none text-[#1F1C18]/80">
          {content.split("\n").map((line, i) => (
            <p key={i} className="mb-2 leading-relaxed text-sm">
              {line || <br />}
            </p>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#C8A061]/40 bg-[#C8A061]/5 px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            {section.type === "CHAIRMAN_ADDRESS"
              ? "Chairman's address not yet written. Use the Overview tab to add the address."
              : "Address not yet written. Use the Section Manager tab to add content."}
          </p>
        </div>
      )}

      {speaker && (
        <div className="mt-6 border-t border-[#C8A061]/20 pt-4">
          <p className="text-xs text-muted-foreground italic">
            — {speaker.name}, {roleLabel(speaker)}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Committee section ────────────────────────────────────────────────────────

function CommitteeSection({
  section,
  members,
  confName,
}: {
  section: BookletSection;
  members: NecMember[];
  confName: string;
}) {
  const filteredMembers = section.committeeScope
    ? members.filter(
        (m) =>
          m.committeeScope === section.committeeScope ||
          m.role === "CHAIR" ||
          m.role === "VICE_CHAIR" ||
          m.role === "SECRETARY",
      )
    : members;

  const KEY_ORDER = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"];
  const sorted = [
    ...KEY_ORDER.map((r) => filteredMembers.find((m) => m.role === r)).filter(
      Boolean,
    ),
    ...filteredMembers.filter((m) => !KEY_ORDER.includes(m.role)),
  ] as NecMember[];

  return (
    <div className="px-10 py-8">
      <PageHeader confName={confName} section={section.title} />
      {section.bodyText && (
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          {section.bodyText}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((m) => (
          <div
            key={m.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              m.role === "CHAIR"
                ? "border-[#C8A061]/40 bg-[#C8A061]/8"
                : m.role === "VICE_CHAIR"
                  ? "border-[#182e5f]/20 bg-[#182e5f]/5"
                  : "border-border bg-muted/30"
            }`}
          >
            {m.photoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.photoPath}
                alt={m.name}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  m.role === "CHAIR"
                    ? "bg-[#C8A061] text-white"
                    : m.role === "VICE_CHAIR"
                      ? "bg-[#182e5f] text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {m.name[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#1F1C18]">
                {m.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {roleLabel(m)}
                {m.city ? ` · ${m.city}` : ""}
              </p>
            </div>
            {m.role === "CHAIR" && (
              <span className="shrink-0 rounded-full bg-[#C8A061] px-2 py-0.5 text-[10px] font-bold text-white">
                Chair
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Schedule section ─────────────────────────────────────────────────────────

function ScheduleSection({
  section,
  meetings,
  confName,
}: {
  section: BookletSection;
  meetings: Meeting[];
  confName: string;
}) {
  return (
    <div className="px-10 py-8">
      <PageHeader confName={confName} section={section.title} />
      {meetings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted px-4 py-6 text-center text-xs text-muted-foreground">
          No meetings scheduled yet.
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m, i) => (
            <div key={m.id} className="flex gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    i === 0 ? "bg-[#C8A061]" : "bg-[#182e5f]/70"
                  }`}
                >
                  {i + 1}
                </div>
                {i < meetings.length - 1 && (
                  <div className="mt-1 flex-1 w-px bg-border" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-4">
                <p className="text-sm font-semibold text-[#1F1C18]">
                  {m.title}
                </p>
                <p className="mt-0.5 text-xs text-[#C8A061]">
                  {new Date(m.scheduled).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {m.location && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    📍 {m.location}
                  </p>
                )}
                {m.agenda && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {m.agenda}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Delegates section ────────────────────────────────────────────────────────

type Delegate = BookletData["delegates"][0];

function DelegatesSection({
  section,
  delegates,
  confName,
}: {
  section: BookletSection;
  delegates: Delegate[];
  confName: string;
}) {
  return (
    <div className="px-10 py-8">
      <PageHeader confName={confName} section={section.title} />
      {section.bodyText && (
        <p className="mb-5 text-xs text-muted-foreground">{section.bodyText}</p>
      )}
      {delegates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted px-4 py-8 text-center text-xs text-muted-foreground">
          No confirmed delegates yet.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {delegates.map((d) => (
            <div key={d.id} className="flex flex-col items-center text-center">
              {d.bookletPhotoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.bookletPhotoPath}
                  alt={d.name}
                  className="h-14 w-14 rounded-xl object-cover shadow-sm ring-2 ring-[#C8A061]/20"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#182e5f]/10 shadow-sm ring-2 ring-[#C8A061]/20">
                  <span className="text-sm font-bold text-[#182e5f]/50">
                    {d.name[0]}
                  </span>
                </div>
              )}
              <p className="mt-1.5 line-clamp-2 text-[10px] font-medium leading-tight text-[#1F1C18]">
                {d.name}
              </p>
              {d.city && (
                <p className="text-[9px] text-muted-foreground">{d.city}</p>
              )}
              {d.delegateCode && (
                <span className="mt-1 rounded bg-[#C8A061]/15 px-1 py-0.5 text-[9px] font-mono text-[#C8A061]">
                  {d.delegateCode}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-right text-[10px] text-muted-foreground">
        {delegates.length} delegate{delegates.length !== 1 ? "s" : ""} · as of{" "}
        {new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

// ─── Sponsors / generic text section ─────────────────────────────────────────

function TextSection({
  section,
  confName,
}: {
  section: BookletSection;
  confName: string;
}) {
  return (
    <div className="px-10 py-8">
      <PageHeader confName={confName} section={section.title} />
      {section.subtitle && (
        <p className="mb-4 text-xs text-[#C8A061] font-medium">
          {section.subtitle}
        </p>
      )}
      {section.bodyText ? (
        <div className="text-sm leading-relaxed text-[#1F1C18]/80 space-y-2">
          {section.bodyText.split("\n").map((line, i) => (
            <p key={i}>{line || <br />}</p>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-muted px-4 py-6 text-center text-xs text-muted-foreground">
          No content yet. Add text in the Section Manager.
        </div>
      )}
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

function BookletPage({
  children,
  hasDivider = true,
}: {
  children: React.ReactNode;
  hasDivider?: boolean;
}) {
  return (
    <div className="booklet-page relative">
      {children}
      {hasDivider && (
        <div className="mx-10 border-b border-dashed border-[#C8A061]/20" />
      )}
    </div>
  );
}

// ─── Section renderer ─────────────────────────────────────────────────────────

function renderSection(
  section: BookletSection,
  data: BookletData,
  isLast: boolean,
) {
  const { event, leaders, committeeMembers, conferenceChair, delegates } = data;
  const meetings = data.meetings ?? [];

  const confName = event.name;
  const key = section.id;

  switch (section.type) {
    case "LEADER":
      return (
        <BookletPage key={key} hasDivider={!isLast}>
          <LeaderSection
            section={section}
            leaders={leaders}
            confName={confName}
          />
        </BookletPage>
      );

    case "PRESIDENT_ADDRESS":
    case "GUEST_BIO":
      // Text-only address — admin writes content in Section Manager
      return (
        <BookletPage key={key} hasDivider={!isLast}>
          <AddressSection
            section={section}
            speaker={null}
            content={section.bodyText}
            confName={confName}
          />
        </BookletPage>
      );

    case "CHAIRMAN_ADDRESS":
      // Conference Chairman's personal message — uses ConfMember.bookletBio
      return (
        <BookletPage key={key} hasDivider={!isLast}>
          <AddressSection
            section={section}
            speaker={conferenceChair}
            content={conferenceChair?.bookletBio ?? section.bodyText}
            confName={confName}
          />
        </BookletPage>
      );

    case "NEC":
    case "COMMITTEE":
    case "COC":
    case "COC_MEMBERS":
    case "CITY_PRESIDENTS":
    case "JUDICIAL":
      return (
        <BookletPage key={key} hasDivider={!isLast}>
          <CommitteeSection
            section={section}
            members={committeeMembers}
            confName={confName}
          />
        </BookletPage>
      );

    case "SCHEDULE":
      return (
        <BookletPage key={key} hasDivider={!isLast}>
          <ScheduleSection
            section={section}
            meetings={meetings}
            confName={confName}
          />
        </BookletPage>
      );

    case "DELEGATES":
      return (
        <BookletPage key={key} hasDivider={!isLast}>
          <DelegatesSection
            section={section}
            delegates={delegates}
            confName={confName}
          />
        </BookletPage>
      );

    case "BACK_COVER":
      return (
        <BookletPage key={key} hasDivider={false}>
          <BackCoverPage event={event} />
        </BookletPage>
      );

    default:
      return (
        <BookletPage key={key} hasDivider={!isLast}>
          <TextSection section={section} confName={confName} />
        </BookletPage>
      );
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function BookletPreview({
  data,
  confId,
}: {
  data: BookletData;
  confId: string;
}) {
  const [zoom, setZoom] = useState(100);

  const enabledSections = [...(data.booklet?.sections ?? [])]    .filter((s) => s.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Split sections: cover first, back cover last, rest in order
  const coverSection = enabledSections.find((s) => s.type === "COVER");
  const backSection = enabledSections.find((s) => s.type === "BACK_COVER");
  const bodySections = enabledSections.filter(
    (s) => s.type !== "COVER" && s.type !== "BACK_COVER",
  );

  const letterheadUrl = `/api/conf/${confId}/letterhead?mode=header&format=png`;

  return (
    <div className="space-y-4">
      {/* Print CSS — A4 layout */}
      <style>{`
        @media print {
          body > *:not(#booklet-print-root) { display: none !important; }
          #booklet-print-root {
            display: block !important;
            position: fixed;
            inset: 0;
            z-index: 9999;
          }
          .booklet-no-print { display: none !important; }
          .booklet-document {
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .booklet-page {
            page-break-after: always;
            break-after: page;
          }
          .booklet-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="booklet-no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#C8A061]/20 bg-[#C8A061]/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Live Booklet Preview
          </span>
          {data.booklet && (
            <Badge
              className={
                data.booklet.status === "PUBLISHED"
                  ? "bg-green-500/20 text-green-700 text-[10px]"
                  : data.booklet.status === "READY"
                    ? "bg-amber-500/20 text-amber-700 text-[10px]"
                    : "bg-zinc-500/20 text-zinc-600 text-[10px]"
              }
            >
              {data.booklet.status}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            {enabledSections.length} section
            {enabledSections.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-lg border border-border">
            <button
              onClick={() => setZoom((z) => Math.max(60, z - 10))}
              className="px-2 py-1 text-muted-foreground hover:text-foreground"
              title="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span className="min-w-[3rem] text-center text-xs font-mono">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="px-2 py-1 text-muted-foreground hover:text-foreground"
              title="Zoom in"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>

          <a
            href={letterheadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3.5" />
            Letterhead PNG
          </a>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => window.print()}
          >
            <Download className="size-3.5" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Booklet viewport */}
      <div className="overflow-x-auto rounded-2xl border border-[#C8A061]/20 bg-[#E6E6E6] p-4 shadow-inner">
        <div
          className="mx-auto origin-top transition-transform duration-200"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            width: "680px",
            // Offset the container height when zoomed out so there's no gap
            marginBottom: zoom < 100 ? `${((zoom - 100) / 100) * 200}px` : 0,
          }}
        >
          {/* Booklet document */}
          <div
            className="booklet-document w-[680px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(200,160,97,0.2)",
            }}
          >
            {/* Cover */}
            <CoverPage
              event={data.event}
              bookletTitle={data.booklet?.title ?? data.event.name}
              bookletSubtitle={data.booklet?.subtitle ?? null}
              theme={data.booklet?.theme ?? null}
            />

            {/* Body sections */}
            {bodySections.map((s, i) =>
              renderSection(s, data, i === bodySections.length - 1 && !backSection),
            )}

            {/* Back cover (if enabled) */}
            {backSection && (
              <BackCoverPage event={data.event} />
            )}

            {/* If no back cover section, add a minimal footer */}
            {!backSection && (
              <div className="flex items-center justify-center gap-3 border-t border-[#C8A061]/20 bg-[#182e5f] px-10 py-5">
                <p className="text-center text-[10px] font-medium tracking-widest text-[#C8A061]/80 uppercase">
                  Liberian Student Union in China · {data.event.name} · {data.event.year}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Letterhead preview strip */}
      <div className="booklet-no-print rounded-xl border border-[#C8A061]/20 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-[#182e5f]">
            Conference Committee Letterhead
          </p>
          <a
            href={`/api/conf/${confId}/letterhead?format=svg`}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-[#C8A061] hover:underline"
          >
            View SVG →
          </a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={letterheadUrl}
          alt="Conference Committee Letterhead"
          className="w-full rounded-lg"
          style={{ maxHeight: "160px", objectFit: "contain", objectPosition: "top" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    </div>
  );
}
