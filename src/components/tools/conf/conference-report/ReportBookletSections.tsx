import { C } from "../booklet/constants";
import {
  LSUIC_OVERVIEW_NO_CONFERENCE_NOTE,
  LSUIC_OVERVIEW_VENUES_CLOSING,
} from "@/lib/conf/booklet-conference-copy";
import type {
  ReportBookletBlock,
  ReportBookletContent,
  ReportBookletOverviewTables,
  ReportBookletProgramDay,
} from "@/lib/conf/conference-report/connectors/booklet";
import {
  REPORT_BODY,
  REPORT_CONTINUATION,
  REPORT_LINK,
  REPORT_LIST_ITEM,
  REPORT_SECTION_TITLE,
  REPORT_SUBSECTION,
  REPORT_TABLE,
} from "./report-typography";

function splitInHalf<T>(items: readonly T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

function isMemorialPresident(name: string): boolean {
  return name.trim().toLowerCase() === "dr. presley k. wesseh, jr.";
}

function ReportOverviewTableHeader({
  columns,
}: {
  columns: Array<{ label: string; width?: string }>;
}) {
  return (
    <tr style={{ background: C.blue, color: C.white }}>
      {columns.map((column) => (
        <th
          key={column.label}
          style={{
            padding: REPORT_TABLE.cellPadding,
            textAlign: "left",
            fontWeight: 700,
            fontSize: `${REPORT_TABLE.headerFontSize}px`,
            width: column.width,
          }}
        >
          {column.label}
        </th>
      ))}
    </tr>
  );
}

function BookletSourceNote() {
  return (
    <p
      style={{
        fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
        color: REPORT_LIST_ITEM.color,
        marginTop: "8px",
        lineHeight: REPORT_LIST_ITEM.lineHeight,
      }}
    >
      Source:{" "}
      <a
        href="https://rhub.ekddigital.com/tools/conf/booklet"
        style={{
          color: REPORT_LINK.color,
          textDecoration: REPORT_LINK.textDecoration,
          fontWeight: REPORT_LINK.fontWeight,
        }}
      >
        Conference Booklet tool
      </a>
    </p>
  );
}

export function ReportBookletOverviewSection({
  block,
  paragraphs,
  tables,
  showPresidents,
  showVenues,
}: {
  block: ReportBookletBlock;
  paragraphs: readonly string[];
  tables: ReportBookletOverviewTables;
  showPresidents: boolean;
  showVenues: boolean;
}) {
  const [presidentsLeft, presidentsRight] = splitInHalf(tables.presidents);
  const [venuesLeft, venuesRight] = splitInHalf(tables.venues);

  return (
    <>
      <div
        style={{
          fontSize: `${REPORT_SECTION_TITLE.fontSize - 2}px`,
          fontWeight: REPORT_SECTION_TITLE.fontWeight,
          color: REPORT_SECTION_TITLE.color,
          marginBottom: "8px",
        }}
      >
        {block.title}
        {block.subtitle ? ` — ${block.subtitle}` : ""}
      </div>

      {paragraphs.map((paragraph) => (
        <p
          key={paragraph.slice(0, 48)}
          style={{
            fontSize: `${REPORT_BODY.fontSize}px`,
            lineHeight: REPORT_BODY.lineHeight,
            color: REPORT_BODY.color,
            marginBottom: "10px",
            textAlign: "justify",
          }}
        >
          {paragraph}
        </p>
      ))}

      {showPresidents && (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              fontSize: `${REPORT_SUBSECTION.fontSize}px`,
              fontWeight: REPORT_SUBSECTION.fontWeight,
              color: REPORT_SUBSECTION.color,
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Presidents of LSUIC (2006 - Present)
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            {[presidentsLeft, presidentsRight].map((rows, tableIndex) => (
              <table
                key={tableIndex === 0 ? "presidents-left" : "presidents-right"}
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: `${REPORT_TABLE.fontSize}px`,
                }}
              >
                <thead>
                  <ReportOverviewTableHeader
                    columns={[
                      { label: "No.", width: "42px" },
                      { label: "President" },
                      { label: "Term", width: "96px" },
                    ]}
                  />
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={`${row.no}-${row.name}`}
                      style={{
                        background: idx % 2 === 0 ? "#F8FAFC" : C.white,
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      <td style={{ padding: REPORT_TABLE.compactCellPadding }}>
                        {row.no}
                      </td>
                      <td
                        style={{
                          padding: REPORT_TABLE.compactCellPadding,
                          color: isMemorialPresident(row.name) ? C.red : "#111",
                          fontWeight: isMemorialPresident(row.name) ? 700 : 500,
                        }}
                      >
                        {row.name}
                      </td>
                      <td style={{ padding: REPORT_TABLE.compactCellPadding }}>
                        {row.term}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        </div>
      )}

      {showVenues && (
        <div style={{ marginTop: showPresidents ? "14px" : "4px" }}>
          <div
            style={{
              fontSize: `${REPORT_SUBSECTION.fontSize}px`,
              fontWeight: REPORT_SUBSECTION.fontWeight,
              color: REPORT_SUBSECTION.color,
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Past Conference Venues
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            {[venuesLeft, venuesRight].map((rows, tableIndex) => (
              <table
                key={tableIndex === 0 ? "venues-left" : "venues-right"}
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: `${REPORT_TABLE.fontSize}px`,
                }}
              >
                <thead>
                  <ReportOverviewTableHeader
                    columns={[
                      { label: "City" },
                      { label: "Year", width: "112px" },
                    ]}
                  />
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={`${row.city}-${row.year}`}
                      style={{
                        background: idx % 2 === 0 ? "#F8FAFC" : C.white,
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      <td style={{ padding: REPORT_TABLE.compactCellPadding }}>
                        {row.city}
                      </td>
                      <td style={{ padding: REPORT_TABLE.compactCellPadding }}>
                        {row.year}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
          <p
            style={{
              marginTop: "10px",
              marginBottom: "6px",
              fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
              lineHeight: REPORT_LIST_ITEM.lineHeight,
              color: REPORT_BODY.color,
            }}
          >
            {LSUIC_OVERVIEW_VENUES_CLOSING}
          </p>
          <p
            style={{
              marginBottom: 0,
              fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
              lineHeight: REPORT_LIST_ITEM.lineHeight,
              color: REPORT_BODY.color,
            }}
          >
            <strong>NB:</strong> {LSUIC_OVERVIEW_NO_CONFERENCE_NOTE}
          </p>
        </div>
      )}
    </>
  );
}

export function ReportBookletBlockSection({
  block,
  showSource = false,
}: {
  block: ReportBookletBlock;
  showSource?: boolean;
}) {
  return (
    <>
      <div
        style={{
          fontSize: `${REPORT_SECTION_TITLE.fontSize - 2}px`,
          fontWeight: REPORT_SECTION_TITLE.fontWeight,
          color: REPORT_SECTION_TITLE.color,
          marginBottom: "8px",
        }}
      >
        {block.title}
        {block.subtitle ? ` — ${block.subtitle}` : ""}
      </div>
      {(block.speakerName || block.speakerTitle) && (
        <div
          style={{
            fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
            fontWeight: 700,
            color: C.blue,
            marginBottom: "8px",
          }}
        >
          {block.speakerName}
          {block.speakerTitle ? ` · ${block.speakerTitle}` : ""}
        </div>
      )}
      {block.paragraphs.map((paragraph) => (
        <p
          key={paragraph.slice(0, 48)}
          style={{
            fontSize: `${REPORT_BODY.fontSize}px`,
            lineHeight: REPORT_BODY.lineHeight,
            color: REPORT_BODY.color,
            marginBottom: "10px",
            textAlign: "justify",
          }}
        >
          {paragraph}
        </p>
      ))}
      {showSource && <BookletSourceNote />}
    </>
  );
}

export function ReportBookletContinuationLabel({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: `${REPORT_CONTINUATION.fontSize}px`,
        fontWeight: REPORT_CONTINUATION.fontWeight,
        color: REPORT_CONTINUATION.color,
        marginBottom: "8px",
      }}
    >
      {title} — continued
    </div>
  );
}

export function ReportBookletProgramOutlineSection({
  content,
  days,
  showIntro,
  showTitle = true,
}: {
  content: ReportBookletContent;
  days: readonly ReportBookletProgramDay[];
  showIntro: boolean;
  showTitle?: boolean;
}) {
  return (
    <>
      {showTitle && (
        <div
          style={{
            fontSize: `${REPORT_SECTION_TITLE.fontSize - 2}px`,
            fontWeight: REPORT_SECTION_TITLE.fontWeight,
            color: REPORT_SECTION_TITLE.color,
            marginBottom: "8px",
          }}
        >
          Program Outline — {content.programOutline.welcomeTitle}
        </div>
      )}
      {showIntro && (
        <p
          style={{
            fontSize: `${REPORT_BODY.fontSize}px`,
            lineHeight: REPORT_BODY.lineHeight,
            color: REPORT_BODY.color,
            marginBottom: "10px",
            textAlign: "justify",
          }}
        >
          {content.programOutline.intro}
        </p>
      )}
      {days.map((day) => (
        <div key={day.label} style={{ marginBottom: "8px" }}>
          <div
            style={{
              fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
              fontWeight: 700,
              color: C.blue,
              marginBottom: "4px",
            }}
          >
            {day.label} · {day.dateLabel}
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: `${REPORT_TABLE.fontSize}px`,
            }}
          >
            <thead>
              <tr style={{ background: "#F0F7FF" }}>
                {["Time", "Activity", "Location"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: REPORT_TABLE.cellPadding,
                      textAlign: "left",
                      fontWeight: 700,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {day.activities.map((row) => (
                <tr
                  key={`${row.time}-${row.activity.slice(0, 24)}`}
                  style={{ borderBottom: "1px solid #E5E7EB" }}
                >
                  <td
                    style={{
                      padding: REPORT_TABLE.compactCellPadding,
                      whiteSpace: "nowrap",
                      verticalAlign: "top",
                    }}
                  >
                    {row.time}
                  </td>
                  <td
                    style={{
                      padding: REPORT_TABLE.compactCellPadding,
                      verticalAlign: "top",
                    }}
                  >
                    {row.activity}
                  </td>
                  <td
                    style={{
                      padding: REPORT_TABLE.compactCellPadding,
                      color: "#444",
                      verticalAlign: "top",
                    }}
                  >
                    {row.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {showIntro && <BookletSourceNote />}
    </>
  );
}
