import { C } from "./constants";
import { A4Page } from "./A4Page";
import type { ProgramOutlineDay } from "@/lib/conf/booklet-program-outline";
import type { BookletSection } from "./types";

function DailyActivitiesTable({ day }: { day: ProgramOutlineDay }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: C.blue,
          marginBottom: "4px",
        }}
      >
        {day.label}
      </div>
      <div
        style={{
          fontSize: "8.5px",
          color: C.muted,
          marginBottom: "6px",
        }}
      >
        {day.dateLabel}
      </div>
      <div
        style={{
          fontSize: "8px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: C.gold,
          marginBottom: "4px",
        }}
      >
        Daily Activities
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "9px",
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
                  color: C.red,
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
                  color: C.muted,
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
              fontSize: "10.5px",
              lineHeight: 1.75,
              color: C.text,
              marginBottom: "18px",
            }}
          >
            {intro.split("\n\n").map((paragraph, i) => (
              <p key={i} style={{ marginBottom: "10px" }}>
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
