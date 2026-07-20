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
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#000000",
          marginBottom: "5px",
        }}
      >
        {day.label}
      </div>
      <div
        style={{
          fontSize: "12.4px",
          color: "#111111",
          marginBottom: "7px",
        }}
      >
        {day.dateLabel}
      </div>
      {day.showDressCodes !== false && day.dressCodes.length > 0 && (
        <div
          style={{
            marginBottom: "8px",
            padding: "9px 11px",
            border: `1px solid ${C.border}`,
            borderRadius: "6px",
            background: "#F8FAFD",
          }}
        >
          <div
            style={{
              fontSize: "10.4px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.blue,
              marginBottom: "4px",
            }}
          >
            Dress Code
          </div>
          {day.dressCodes.map((dc, i) => (
            <div
              key={`${day.dayNumber}-dc-${i}`}
              style={{
                fontSize: "11.6px",
                lineHeight: 1.4,
                color: "#111111",
                marginBottom: i === day.dressCodes.length - 1 ? 0 : "2px",
              }}
            >
              <span style={{ fontWeight: 700 }}>{dc.session}:</span> {dc.code}
            </div>
          ))}
        </div>
      )}

      {day.showSummaryTable !== false && day.activities.length > 0 && (
        <>
          <div
            style={{
              fontSize: "11.2px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#000000",
              marginBottom: "4px",
            }}
          >
            Daily Activities (Summary)
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12.4px",
              lineHeight: 1.5,
              marginBottom: "10px",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr>
                {["Time", "Activities", "Location"].map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
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
                      padding: "8px 10px",
                      lineHeight: 1.45,
                      border: `1px solid ${C.border}`,
                      verticalAlign: "top",
                      fontWeight: 600,
                      color: "#000000",
                      whiteSpace: "nowrap",
                      width: "20%",
                    }}
                  >
                    {row.time}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      lineHeight: 1.5,
                      border: `1px solid ${C.border}`,
                      verticalAlign: "top",
                      color: C.text,
                      width: "45%",
                    }}
                  >
                    {row.activity}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      lineHeight: 1.5,
                      border: `1px solid ${C.border}`,
                      verticalAlign: "top",
                      color: "#111111",
                      width: "35%",
                    }}
                  >
                    {row.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {day.detailedActivities.length > 0 && (
        <>
          <div
            style={{
              fontSize: "11.2px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.red,
              marginBottom: "4px",
            }}
          >
            Detailed Flow
          </div>
          <div>
            {day.detailedActivities.map((row, i) => (
              <div
                key={`${day.dayNumber}-d-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "166px minmax(0, 1fr)",
                  alignItems: "start",
                  gap: "10px",
                  padding: "7px 9px",
                  borderRadius: "5px",
                  marginBottom: "5px",
                  background: row.highlight ? `${C.blue}0D` : "transparent",
                  borderLeft: row.highlight
                    ? `2px solid ${C.blue}`
                    : "2px solid transparent",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    lineHeight: 1.35,
                    color: C.blue,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.time}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12.2px",
                      lineHeight: 1.45,
                      color: "#111111",
                      fontWeight: row.highlight ? 700 : 600,
                    }}
                  >
                    {row.activity}
                  </div>
                  {row.responsible && (
                    <div
                      style={{
                        marginTop: "1px",
                        fontSize: "11.1px",
                        color: "#3A5080",
                        fontStyle: "italic",
                        fontWeight: 600,
                      }}
                    >
                      {row.responsible}
                    </div>
                  )}
                  {row.meal && (
                    <div
                      style={{
                        marginTop: "1px",
                        fontSize: "11.1px",
                        color: C.red,
                        fontWeight: 700,
                      }}
                    >
                      {row.meal}
                    </div>
                  )}
                  {row.subs && row.subs.length > 0 && (
                    <ul
                      style={{
                        margin: "2px 0 0",
                        paddingLeft: "14px",
                      }}
                    >
                      {row.subs.map((sub, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: "11px",
                            lineHeight: 1.35,
                            color: "#1A2F5E",
                            marginBottom: "1px",
                          }}
                        >
                          {sub}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
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
              width: "100%",
              maxWidth: "700px",
              margin: "0 auto 18px",
              fontSize: `${Math.max(BOOKLET_BODY.fontSize + 1, 15.5)}px`,
              lineHeight: 1.72,
              color: C.text,
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

      {days.map((day, index) => (
        <DailyActivitiesTable
          key={`${day.dayNumber}-${day.label}-${index}`}
          day={day}
        />
      ))}
    </A4Page>
  );
}
