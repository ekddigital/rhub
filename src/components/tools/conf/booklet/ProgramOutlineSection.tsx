import { C } from "./constants";
import {
  BOOKLET_BODY,
  BOOKLET_BODY_PARAGRAPH,
  splitBookletParagraphs,
} from "@/lib/conf/booklet-body-typography";
import { A4Page } from "./A4Page";
import type { ProgramOutlineDay } from "@/lib/conf/booklet-program-outline";
import type { BookletSection } from "./types";

function DailyActivitiesTable({ day }: { day: ProgramOutlineDay }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#000000",
          marginBottom: "4px",
        }}
      >
        {day.label}
      </div>
      <div
        style={{
          fontSize: "9.5px",
          color: "#111111",
          marginBottom: "6px",
        }}
      >
        {day.dateLabel}
      </div>
      <div
        style={{
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#000000",
          marginBottom: "4px",
        }}
      >
        Daily Activities
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "10px",
          lineHeight: 1.45,
        }}
      >
        <thead>
          <tr>
            {["Time", "Activities", "Location"].map((col) => (
              <th
                key={col}
                style={{
                  textAlign: "left",
                  padding: "5px 8px",
                  background: C.blue,
                  color: C.white,
                  fontWeight: 700,
                  border: `1px solid ${C.blue}`,
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {day.activities.map((row, i) => (
            <tr key={i}>
              <td
                style={{
                  padding: "5px 8px",
                  border: `1px solid ${C.border}`,
                  verticalAlign: "top",
                  fontWeight: 600,
                  color: "#000000",
                  whiteSpace: "nowrap",
                  width: "18%",
                }}
              >
                {row.time}
              </td>
              <td
                style={{
                  padding: "5px 8px",
                  border: `1px solid ${C.border}`,
                  verticalAlign: "top",
                  color: C.text,
                  width: "46%",
                }}
              >
                {row.activity}
              </td>
              <td
                style={{
                  padding: "5px 8px",
                  border: `1px solid ${C.border}`,
                  verticalAlign: "top",
                  color: "#111111",
                  width: "36%",
                }}
              >
                {row.location}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProgramOutlineSection({
  section,
  welcomeTitle,
  intro,
  days,
  showIntro,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  welcomeTitle: string;
  intro: string;
  days: ProgramOutlineDay[];
  showIntro: boolean;
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  return (
    <A4Page
      pageNum={pageNum}
      totalPages={totalPages}
      sectionLabel={section.title}
      confName={confName}
      confYear={confYear}
    >
      {showIntro && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: "4px",
                background: C.red,
                color: C.white,
                fontSize: "8.5px",
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Program Outline
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: C.blue,
                lineHeight: 1.2,
                marginBottom: "8px",
              }}
            >
              {welcomeTitle}
            </div>
            <div
              style={{
                height: "2px",
                background: `linear-gradient(90deg, ${C.blue}, ${C.red}, ${C.gold}, transparent)`,
                marginBottom: "14px",
              }}
            />
          </div>

          <div
            style={{
              fontSize: `${BOOKLET_BODY.fontSize}px`,
              lineHeight: BOOKLET_BODY.lineHeight,
              color: C.text,
              marginBottom: "18px",
            }}
          >
            {splitBookletParagraphs(intro).map((paragraph, i) => (
              <p key={i} style={BOOKLET_BODY_PARAGRAPH}>
                {paragraph}
              </p>
            ))}
          </div>
        </>
      )}

      {days.map((day) => (
        <DailyActivitiesTable key={day.dayNumber} day={day} />
      ))}
    </A4Page>
  );
}
