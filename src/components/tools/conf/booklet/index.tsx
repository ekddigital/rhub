"use client";

import { type ReactNode, useState } from "react";
import { Download, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { C, DELEGATES_PER_BOOKLET_PAGE } from "./constants";
import type { BookletData, BookletSection } from "./types";
import {
  bookletBodyPageCount,
  chunkDelegates,
  computeSectionTocRows,
  getTocPageNum,
  sectionPageSpan,
} from "./booklet-section-pages";

import { CoverPage } from "./CoverPage";
import { BackCoverPage } from "./BackCoverPage";
import { TableOfContentsPage } from "./TableOfContentsPage";
import { LeaderSection } from "./LeaderSection";
import { AddressSection } from "./AddressSection";
import { CommitteeSection } from "./CommitteeSection";
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
  const {
    event,
    leaders,
    necMembers,
    committeeMembers,
    conferenceChair,
    delegates,
  } = data;
  const confName = event.name;
  const confYear = event.year;
  const key = section.id;
  const common = { startPageNum, totalPages, confName, confYear };
  // Alias for sections that are always single-page
  const pageNum = startPageNum;
  const commonSingle = { pageNum, totalPages, confName, confYear };

  // Helper: normalize name for comparison
  function normalizeName(name: string): string {
    return (name ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  // For CITY_PRESIDENTS: filter out members that match leader names to prevent duplicates
  const leaderNames = new Set(leaders.map((l) => normalizeName(l.name)));
  const filteredCommitteeForCityPresidents = committeeMembers.filter(
    (m) => !leaderNames.has(normalizeName(m.name)),
  );
  const nationalPresident = necMembers.find((m) => m.role === "CHAIR") ?? null;

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
      return (
        <AddressSection
          key={key}
          section={section}
          speaker={nationalPresident}
          content={nationalPresident?.bookletBio ?? section.bodyText}
          {...commonSingle}
        />
      );

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
      return (
        <CommitteeSection
          key={key}
          section={section}
          members={necMembers}
          startPageNum={startPageNum}
          totalPages={totalPages}
          confName={confName}
          confYear={confYear}
        />
      );

    case "COMMITTEE":
    case "COC":
    case "COC_MEMBERS":
    case "CITY_PRESIDENTS":
    case "JUDICIAL":
      return (
        <CommitteeSection
          key={key}
          section={section}
          members={
            section.type === "CITY_PRESIDENTS"
              ? filteredCommitteeForCityPresidents
              : committeeMembers
          }
          startPageNum={startPageNum}
          totalPages={totalPages}
          confName={confName}
          confYear={confYear}
        />
      );

    case "DELEGATES": {
      const rosterChunks =
        delegates.length === 0
          ? [[] as typeof delegates]
          : chunkDelegates(delegates, DELEGATES_PER_BOOKLET_PAGE);
      return (
        <>
          {rosterChunks.map((chunk, idx) => (
            <DelegatesSection
              key={`${key}-${idx}`}
              section={section}
              delegates={chunk}
              totalDelegateCount={delegates.length}
              rosterPageIndex={idx}
              rosterPageCount={rosterChunks.length}
              pageNum={startPageNum + idx}
              totalPages={totalPages}
              confName={confName}
              confYear={confYear}
            />
          ))}
        </>
      );
    }

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
    .filter(
      (s) =>
        s.isEnabled &&
        s.type !== "COVER" &&
        s.type !== "BACK_COVER" &&
        s.type !== "SCHEDULE",
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const hasCover = (data.booklet?.sections ?? []).some(
    (s) => s.type === "COVER" && s.isEnabled,
  );
  const hasBackCover = (data.booklet?.sections ?? []).some(
    (s) => s.type === "BACK_COVER" && s.isEnabled,
  );

  // Count pages properly: LEADER sections → leaders.length pages each
  // Committee sections → 2 pages when there are general members (role=COMMITTEE), else 1
  const bodyPageCount = bookletBodyPageCount(enabledSections, data);
  const tocSectionRows = computeSectionTocRows(
    enabledSections,
    data,
    hasCover,
  );
  const tocPageNum = getTocPageNum(hasCover);
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
            height: 297mm !important;
            max-height: 297mm !important;
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden !important;
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
              tocPageNum={tocPageNum}
              hasCover={hasCover}
              hasBackCover={hasBackCover}
              sectionRows={tocSectionRows}
              confName={data.event.name}
              confYear={data.event.year}
              totalPages={totalPages}
            />

            {
              enabledSections.reduce<{ nodes: ReactNode[]; rp: number }>(
                ({ nodes, rp }, s) => {
                  const startPage = rp;
                  const delta = sectionPageSpan(s, data);
                  return {
                    nodes: [
                      ...nodes,
                      renderSection(s, data, startPage, totalPages),
                    ],
                    rp: rp + delta,
                  };
                },
                { nodes: [], rp: (hasCover ? 1 : 0) + 2 } as {
                  nodes: ReactNode[];
                  rp: number;
                },
              ).nodes
            }

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
      <div className="booklet-no-print rounded-xl border border-[#C8A061]/20 bg-white p-4 shadow-sm space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: C.blue }}>
            Conference Committee Letterhead
          </p>
          <div className="flex items-center gap-2">
            <a
              href={`/api/conf/${confId}/letterhead?mode=page&format=png`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded border border-[#C8A061]/40 bg-[#C8A061]/10 px-2 py-0.5 text-[10px] text-[#8E6B30] hover:bg-[#C8A061]/20 transition-colors"
            >
              <Download className="size-2.5" />
              Page 1 PNG
            </a>
            <a
              href={`/api/conf/${confId}/letterhead?mode=continuation&format=png`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded border border-[#C8A061]/40 bg-[#C8A061]/10 px-2 py-0.5 text-[10px] text-[#8E6B30] hover:bg-[#C8A061]/20 transition-colors"
            >
              <Download className="size-2.5" />
              Page 2+ PNG
            </a>
            <a
              href={`/api/conf/${confId}/letterhead?mode=page&format=svg`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-[#C8A061] hover:underline"
            >
              SVG →
            </a>
          </div>
        </div>

        {/* Two-column preview: first page header + continuation header */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-[9px] font-medium text-zinc-500 uppercase tracking-wide">
              First Page — Full Header + Sidebar
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/conf/${confId}/letterhead?mode=header&format=png`}
              alt="First page letterhead header"
              className="w-full rounded border border-zinc-100"
              style={{ objectFit: "contain", objectPosition: "top" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div>
            <p className="mb-1 text-[9px] font-medium text-zinc-500 uppercase tracking-wide">
              Continuation Pages — Compact Header
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/conf/${confId}/letterhead?mode=continuation&format=png`}
              alt="Continuation page letterhead header"
              className="w-full rounded border border-zinc-100"
              style={{ objectFit: "contain", objectPosition: "top" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Full page 1 preview (scrollable) */}
        <details className="group">
          <summary className="cursor-pointer text-[10px] font-medium text-[#C8A061] hover:underline list-none flex items-center gap-1">
            <ExternalLink className="size-3" />
            View full first-page preview (with sidebar)
          </summary>
          <div
            className="mt-2 overflow-auto rounded border border-zinc-100"
            style={{ maxHeight: "400px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/conf/${confId}/letterhead?mode=page&format=png`}
              alt="Full letterhead first page"
              className="w-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </details>
      </div>
    </div>
  );
}
