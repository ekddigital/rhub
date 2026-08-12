import { BOOKLET_A4, C } from "../booklet/constants";
import { PageHeader } from "../booklet/PageHeader";
import { PageFooter } from "../booklet/PageFooter";
import {
  computeReportTotalPages,
  REPORT_META,
  REPORT_TOC,
} from "./content-data";

export function ConferenceReportTocPage({
  pageNum,
  pageIndex,
  totalTocPages,
  entries,
}: {
  pageNum: number;
  pageIndex: number;
  totalTocPages: number;
  entries: (typeof REPORT_TOC)[number][];
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
          padding: "18px 40px 10px",
          overflow: "hidden",
        }}
      >
        {pageIndex === 0 && (
          <div
            style={{
              fontSize: "17px",
              fontWeight: 800,
              color: C.blue,
              marginBottom: "12px",
              paddingBottom: "6px",
              borderBottom: `2px solid ${C.gold}`,
            }}
          >
            Table of Contents
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            flex: 1,
          }}
        >
          {entries.map((entry) => (
            <div key={entry.num}>
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: C.blue,
                  lineHeight: 1.45,
                }}
              >
                {entry.num}. {entry.title}
              </div>
              {"subs" in entry &&
                entry.subs?.map((sub) => (
                  <div
                    key={sub}
                    style={{
                      fontSize: "11px",
                      color: "#444",
                      paddingLeft: "16px",
                      lineHeight: 1.4,
                    }}
                  >
                    – {sub}
                  </div>
                ))}
            </div>
          ))}
        </div>

        {pageIndex === totalTocPages - 1 && (
          <div
            style={{
              marginTop: "auto",
              paddingTop: "10px",
              borderTop: `1px solid ${C.border}`,
              fontSize: "10px",
              color: "#666",
              lineHeight: 1.5,
            }}
          >
            Source: {REPORT_META.markdownPath} · {totalPages} pages · Theme:
            &ldquo;{REPORT_META.theme}&rdquo;
          </div>
        )}
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

/** Split TOC entries across two pages for readable spacing. */
export function chunkReportToc(
  entries: readonly (typeof REPORT_TOC)[number][],
  firstPageCount = 9,
): (typeof REPORT_TOC)[number][][] {
  if (entries.length <= firstPageCount) return [entries.slice()];
  return [
    entries.slice(0, firstPageCount),
    entries.slice(firstPageCount),
  ];
}
