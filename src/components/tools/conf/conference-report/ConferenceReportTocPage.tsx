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
  entries,
}: {
  pageNum: number;
  pageIndex: number;
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
            gap: "5px",
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
              {"subs" in entry && Array.isArray(entry.subs) &&
                entry.subs.map((sub: string) => (
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
  entries: readonly (typeof REPORT_TOC)[number][],
): (typeof REPORT_TOC)[number][][] {
  return [entries.slice()];
}
