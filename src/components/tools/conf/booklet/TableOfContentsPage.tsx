import { BOOKLET_A4, C } from "./constants";
import type { BookletTocSectionRow } from "./booklet-section-pages";
import { PageHeader } from "./PageHeader";
import { PageFooter } from "./PageFooter";

export function TableOfContentsPage({
  tocPageNum,
  hasCover,
  hasBackCover,
  sectionRows,
  confName,
  confYear,
  totalPages,
}: {
  tocPageNum: number;
  hasCover: boolean;
  hasBackCover: boolean;
  sectionRows: BookletTocSectionRow[];
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

      <div style={{ flex: 1, padding: "28px 40px 20px" }}>
        {/* Heading */}
        <div style={{ marginBottom: "24px" }}>
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

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {hasCover && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 12px",
                borderRadius: "6px",
                background: C.lightBlue,
                marginBottom: "4px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: C.blue }}>
                Cover Page
              </div>
              <PageRangeBadge startPage={1} pageSpan={1} highlighted />
            </div>
          )}

          {sectionRows.map(({ section: s, startPage, pageSpan }) => {
            const isKey =
              s.type === "LEADER" ||
              s.type === "NEC" ||
              s.type === "CHAIRMAN_ADDRESS" ||
              s.type === "PRESIDENT_ADDRESS";

            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  background: isKey ? `${C.blue}08` : "transparent",
                  borderBottom: `1px solid ${C.border}50`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: isKey ? C.red : C.border,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: isKey ? 700 : 500,
                        color: isKey ? C.blue : C.text,
                      }}
                    >
                      {s.title}
                    </div>
                    {s.subtitle && (
                      <div style={{ fontSize: "9px", color: C.muted }}>
                        {s.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "1px",
                      backgroundImage:
                        "repeating-linear-gradient(90deg, transparent, transparent 3px, #D1D9F0 3px, #D1D9F0 4px)",
                    }}
                  />
                  <PageRangeBadge
                    startPage={startPage}
                    pageSpan={pageSpan}
                    highlighted={isKey}
                  />
                </div>
              </div>
            );
          })}

          {hasBackCover && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 12px",
                borderRadius: "6px",
                background: C.lightBlue,
                marginTop: "6px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: C.blue }}>
                Back Cover
              </div>
              <PageRangeBadge
                startPage={totalPages}
                pageSpan={1}
                highlighted={false}
              />
            </div>
          )}
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
        minWidth: multi ? 38 : 22,
        height: "22px",
        padding: multi ? "0 7px" : "0",
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
      }}
    >
      {label}
    </div>
  );
}
