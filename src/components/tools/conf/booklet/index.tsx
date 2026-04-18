"use client";

import { useState } from "react";
import { Download, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { C } from "./constants";
import type { BookletData, BookletSection } from "./types";

// ── Page components
import { CoverPage } from "./CoverPage";
import { BackCoverPage } from "./BackCoverPage";
import { TableOfContentsPage } from "./TableOfContentsPage";
import { LeaderSection } from "./LeaderSection";
import { AddressSection } from "./AddressSection";
import { CommitteeSection } from "./CommitteeSection";
import { ScheduleSection } from "./ScheduleSection";
import { DelegatesSection } from "./DelegatesSection";
import { TextSection } from "./TextSection";

// ─── Section dispatcher ───────────────────────────────────────────────────────
// startPageNum: the page number of the FIRST page this section occupies.
// For LEADER sections this spans leaders.length pages.
function renderSection(
  section: BookletSection,
  data: BookletData,
  startPageNum: number,
  totalPages: number,
) {
  const { event, leaders, committeeMembers, conferenceChair, delegates } = data;
  const meetings = data.meetings ?? [];
  const confName = event.name;
  const confYear = event.year;
  const key = section.id;
  const common = { startPageNum, totalPages, confName, confYear };
  // Alias for sections that are always single-page
  const pageNum = startPageNum;
  const commonSingle = { pageNum, totalPages, confName, confYear };

  switch (section.type) {
    case "LEADER":
      return (
        <LeaderSection
          key={key}
          section={section}
          leaders={leaders}
          startPageNum={common.startPageNum}
          totalPages={totalPages}
          confName={confName}
          confYear={confYear}
        />
      );

    case "PRESIDENT_ADDRESS":
    case "GUEST_BIO":
      return (
        <AddressSection
          key={key}
          section={section}
          speaker={null}
          content={section.bodyText}
          {...commonSingle}
        />
      );

    case "CHAIRMAN_ADDRESS":
      return (
        <AddressSection
          key={key}
          section={section}
          speaker={conferenceChair}
          content={conferenceChair?.bookletBio ?? section.bodyText}
          {...commonSingle}
        />
      );

    case "NEC":
    case "COMMITTEE":
    case "COC":
    case "COC_MEMBERS":
    case "CITY_PRESIDENTS":
    case "JUDICIAL":
      return (
        <CommitteeSection
          key={key}
          section={section}
          members={committeeMembers}
          {...commonSingle}
        />
      );

    case "SCHEDULE":
      return (
        <ScheduleSection
          key={key}
          section={section}
          meetings={meetings}
          {...commonSingle}
        />
      );

    case "DELEGATES":
      return (
        <DelegatesSection
          key={key}
          section={section}
          delegates={delegates}
          {...commonSingle}
        />
      );

    default:
      return <TextSection key={key} section={section} {...commonSingle} />;
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function BookletPreview({
  data,
  confId,
}: {
  data: BookletData;
  confId: string;
}) {
  const [zoom, setZoom] = useState(90);

  const enabledSections = [...(data.booklet?.sections ?? [])]
    .filter((s) => s.isEnabled && s.type !== "COVER" && s.type !== "BACK_COVER")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const hasCover = (data.booklet?.sections ?? []).some(
    (s) => s.type === "COVER" && s.isEnabled,
  );
  const hasBackCover = (data.booklet?.sections ?? []).some(
    (s) => s.type === "BACK_COVER" && s.isEnabled,
  );

  // Count pages properly: LEADER sections consume leaders.length pages each
  const leaderCount = data.leaders.length;
  const bodyPageCount = enabledSections.reduce((sum, s) => {
    if (s.type === "LEADER") return sum + Math.max(1, leaderCount);
    return sum + 1;
  }, 0);
  const totalPages =
    (hasCover ? 1 : 0) + 1 + bodyPageCount + (hasBackCover ? 1 : 0);

  const letterheadUrl = `/api/conf/${confId}/letterhead?mode=header&format=png`;

  return (
    <div className="space-y-4">
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .booklet-document, .booklet-document * { visibility: visible; }
          .booklet-no-print { display: none !important; }
          .booklet-document {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
          }
          .booklet-page {
            width: 210mm !important;
            min-height: 297mm !important;
            page-break-after: always;
            page-break-inside: avoid;
            box-shadow: none !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* Toolbar */}
      <div
        className="booklet-no-print"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "10px 16px",
          borderRadius: "10px",
          border: `1px solid ${C.blue}20`,
          background: C.lightBlue,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: C.blue }}>
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
          <span style={{ fontSize: "10px", color: C.muted }}>
            {totalPages} pages · {enabledSections.length} sections
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Zoom controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              style={{
                padding: "4px 8px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
              }}
              title="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span
              style={{
                minWidth: "3rem",
                textAlign: "center",
                fontSize: "11px",
                fontFamily: "monospace",
              }}
            >
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              style={{
                padding: "4px 8px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
              }}
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
            Letterhead
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
      <div
        style={{
          overflowX: "auto",
          borderRadius: "16px",
          background: "#D8D8D8",
          padding: "24px",
        }}
      >
        <div
          className="booklet-document"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            width: "680px",
            margin: "0 auto",
            marginBottom: zoom < 100 ? `${((zoom - 100) / 100) * 400}px` : "0",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {hasCover && (
              <CoverPage
                event={data.event}
                bookletTitle={data.booklet?.title ?? data.event.name}
                bookletSubtitle={data.booklet?.subtitle ?? null}
                theme={data.booklet?.theme ?? null}
              />
            )}

            <TableOfContentsPage
              sections={enabledSections}
              confName={data.event.name}
              confYear={data.event.year}
              totalPages={totalPages}
            />

            {(() => {
              // Build a running page counter so multi-page sections get correct numbers
              let runningPage = (hasCover ? 1 : 0) + 2; // cover=1, TOC=1
              return enabledSections.map((s) => {
                const startPage = runningPage;
                if (s.type === "LEADER") {
                  runningPage += Math.max(1, leaderCount);
                } else {
                  runningPage += 1;
                }
                return renderSection(s, data, startPage, totalPages);
              });
            })()}

            {hasBackCover && (
              <BackCoverPage event={data.event} totalPages={totalPages} />
            )}

            {!hasBackCover && (
              <div
                style={{
                  width: "680px",
                  padding: "18px 40px",
                  background: C.blue,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: `${C.white}70`,
                  }}
                >
                  Liberian Student Union in China · {data.event.name} ·{" "}
                  {data.event.year}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Letterhead preview strip */}
      <div className="booklet-no-print rounded-xl border border-[#C8A061]/20 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: C.blue }}>
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
          style={{
            maxHeight: "160px",
            objectFit: "contain",
            objectPosition: "top",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    </div>
  );
}
