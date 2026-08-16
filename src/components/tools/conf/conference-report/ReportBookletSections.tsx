import { C } from "../booklet/constants";
import type {
  ReportBookletBlock,
  ReportBookletContent,
  ReportBookletProgramDay,
} from "@/lib/conf/conference-report/connectors/booklet";
import {
  REPORT_BODY,
  REPORT_CONTINUATION,
  REPORT_LINK,
  REPORT_LIST_ITEM,
  REPORT_SECTION_TITLE,
  REPORT_TABLE,
} from "./report-typography";

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
}: {
  content: ReportBookletContent;
  days: readonly ReportBookletProgramDay[];
  showIntro: boolean;
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
        Program Outline — {content.programOutline.welcomeTitle}
      </div>
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
        <div key={day.label} style={{ marginBottom: "12px" }}>
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
