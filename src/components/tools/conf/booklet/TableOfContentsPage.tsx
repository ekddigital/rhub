import type { ReactNode } from "react";
import { BOOKLET_A4, C } from "./constants";
import type { TocRenderableEntry } from "./booklet-section-pages";
import { PageHeader } from "./PageHeader";
import { PageFooter } from "./PageFooter";

export function TableOfContentsPage({
  tocPageNum,
  showHeading,
  entries,
  confName,
  confYear,
  totalPages,
}: {
  tocPageNum: number;
  showHeading: boolean;
  entries: TocRenderableEntry[];
  confName: string;
  confYear: number;
  totalPages: number;
}) {
  return (
    <div
      className="booklet-page"
      style={{
        width: `${BOOKLET_A4.width}px`,
        height: `${BOOKLET_A4.height}px`,
        minHeight: `${BOOKLET_A4.height}px`,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <PageHeader
        confName={confName}
        sectionLabel="Table of Contents"
        pageNum={tocPageNum}
      />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: "28px 40px 20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {showHeading && (
          <div style={{ marginBottom: "24px", flexShrink: 0 }}>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: C.blue,
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
          {entries.map((entry, idx) => {
            if (entry.kind === "cover") {
              return (
                <TocHighlightRow key={`cover-${idx}`} label="Cover Page">
                  <PageRangeBadge startPage={1} pageSpan={1} highlighted />
                </TocHighlightRow>
              );
            }

            if (entry.kind === "back_cover") {
              return (
                <TocHighlightRow
                  key={`back-${idx}`}
                  label="Back Cover"
                  marginTop
                >
                  <PageRangeBadge
                    startPage={entry.page}
                    pageSpan={1}
                    highlighted={false}
                  />
                </TocHighlightRow>
              );
            }

            return (
              <div
                key={entry.sectionId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 72px 40px",
                  columnGap: "8px",
                  alignItems: "center",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  background: entry.isKey ? `${C.blue}08` : "transparent",
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
                      background: entry.isKey ? C.red : C.border,
                      flexShrink: 0,
                      marginTop: "6px",
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: entry.isKey ? 700 : 500,
                        color: entry.isKey ? C.blue : "#111111",
                        lineHeight: 1.38,
                      }}
                    >
                      {entry.title}
                    </div>
                    {entry.subtitle && (
                      <div
                        style={{
                          fontSize: "10.5px",
                          color: "#555555",
                          lineHeight: 1.35,
                        }}
                      >
                        {entry.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <TocDotLeader />

                <div style={{ justifySelf: "end" }}>
                  <PageRangeBadge
                    startPage={entry.startPage}
                    pageSpan={entry.pageSpan}
                    highlighted={entry.isKey}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PageFooter
        confName={confName}
        confYear={confYear}
        pageNum={tocPageNum}
        totalPages={totalPages}
      />
    </div>
  );
}

function TocHighlightRow({
  label,
  children,
  marginTop,
}: {
  label: string;
  children: ReactNode;
  marginTop?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        columnGap: "8px",
        alignItems: "center",
        padding: "9px 12px",
        borderRadius: "6px",
        background: C.lightBlue,
        marginBottom: marginTop ? undefined : "4px",
        marginTop: marginTop ? "6px" : undefined,
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: "13px", fontWeight: 700, color: C.blue }}>
        {label}
      </div>
      <div style={{ justifySelf: "end" }}>{children}</div>
    </div>
  );
}

/** Dot leader stable for html2canvas (avoids flex + border-top sub-pixel drift). */
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
        fontSize: "9px",
        fontWeight: 700,
        color: highlighted ? C.white : C.blue,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {label}
    </div>
  );
}
