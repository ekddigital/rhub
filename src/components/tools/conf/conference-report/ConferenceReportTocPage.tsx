import { BOOKLET_A4, C } from "../booklet/constants";
import { PageHeader } from "../booklet/PageHeader";
import { PageFooter } from "../booklet/PageFooter";
import {
  buildReportTocWithPages,
  computeReportTotalPages,
  REPORT_META,
  type ReportTocEntry,
} from "./content-data";
import { REPORT_TOC } from "./report-typography";

function TocDotLeader() {
  return (
    <div
      aria-hidden
      style={{
        height: "12px",
        overflow: "hidden",
        fontSize: "10px",
        lineHeight: "12px",
        letterSpacing: "2px",
        color: C.border,
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {"·".repeat(24)}
    </div>
  );
}

function PageRangeBadge({
  startPage,
  pageSpan,
  highlighted,
}: {
  startPage: number;
  pageSpan: number;
  highlighted: boolean;
}) {
  const multi = pageSpan > 1;
  const endPage = startPage + pageSpan - 1;
  const label = multi ? `${startPage}–${endPage}` : String(startPage);

  return (
    <div
      style={{
        boxSizing: "border-box",
        width: multi ? "38px" : "22px",
        height: "22px",
        borderRadius: multi ? "11px" : "50%",
        background: highlighted ? C.blue : C.lightBlue,
        border: `1px solid ${highlighted ? C.blue : C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${REPORT_TOC.badge.fontSize}px`,
        fontWeight: REPORT_TOC.badge.fontWeight,
        color: highlighted ? C.white : C.blue,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {label}
    </div>
  );
}

export function ConferenceReportTocPage({
  pageNum,
  pageIndex,
  entries,
}: {
  pageNum: number;
  pageIndex: number;
  entries: ReportTocEntry[];
}) {
  const totalPages = computeReportTotalPages();
  return (
    <div
      className="booklet-page"
      style={{
        width: `${BOOKLET_A4.width}px`,
        height: `${BOOKLET_A4.height}px`,
        maxHeight: `${BOOKLET_A4.height}px`,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <PageHeader
        confName={REPORT_META.confName}
        sectionLabel="Table of Contents"
        pageNum={pageNum}
      />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          padding: "28px 40px 20px",
          overflow: "hidden",
        }}
      >
        {pageIndex === 0 && (
          <div style={{ marginBottom: "20px", flexShrink: 0 }}>
            <div
              style={{
                fontSize: `${REPORT_TOC.title.fontSize}px`,
                fontWeight: REPORT_TOC.title.fontWeight,
                color: REPORT_TOC.title.color,
                marginBottom: "6px",
              }}
            >
              Table of Contents
            </div>
            <div
              style={{
                height: "3px",
                width: "60px",
                background: `linear-gradient(90deg, ${C.red}, ${C.blue})`,
                borderRadius: "2px",
              }}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            flex: 1,
            minHeight: 0,
          }}
        >
          {entries.map((entry) => {
            const highlighted = Boolean(entry.isProgramDay);
            const hasPage = entry.startPage != null && entry.pageSpan != null;

            return (
              <div
                key={entry.num}
                style={{
                  display: "grid",
                  gridTemplateColumns: hasPage
                    ? "minmax(0, 1fr) 72px 40px"
                    : "minmax(0, 1fr)",
                  columnGap: "8px",
                  alignItems: "center",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  background: highlighted ? `${C.blue}08` : "transparent",
                  borderBottom: `1px solid ${C.border}50`,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: highlighted ? C.red : C.border,
                      flexShrink: 0,
                      marginTop: "6px",
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: `${REPORT_TOC.entry.fontSize}px`,
                        fontWeight: highlighted ? 700 : 500,
                        color: highlighted ? C.blue : "#111111",
                        lineHeight: REPORT_TOC.entry.lineHeight,
                      }}
                    >
                      {entry.num}. {entry.title}
                    </div>
                  </div>
                </div>

                {hasPage && (
                  <>
                    <TocDotLeader />
                    <div style={{ justifySelf: "end" }}>
                      <PageRangeBadge
                        startPage={entry.startPage!}
                        pageSpan={entry.pageSpan!}
                        highlighted={highlighted}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <PageFooter
        confName={REPORT_META.confName}
        confYear={REPORT_META.confYear}
        pageNum={pageNum}
        totalPages={totalPages}
      />
    </div>
  );
}

/** Keep the full TOC on one page when it fits A4 content height. */
export function chunkReportToc(
  entries: readonly ReportTocEntry[],
): ReportTocEntry[][] {
  return [entries.slice()];
}

/** TOC rows with computed page ranges for PDF preview. */
export function resolveReportTocEntries(
  runtime?: Parameters<typeof buildReportTocWithPages>[0],
): ReportTocEntry[] {
  return buildReportTocWithPages(runtime);
}
