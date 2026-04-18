import { C } from "./constants";
import { fmtTime } from "./utils";
import { A4Page } from "./A4Page";
import type { BookletSection, Meeting } from "./types";

export function ScheduleSection({
  section,
  meetings,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  meetings: Meeting[];
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
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "6px",
          }}
        >
          <div
            style={{
              width: "4px",
              height: "24px",
              borderRadius: "2px",
              background: `linear-gradient(${C.red}, ${C.blue})`,
            }}
          />
          <div style={{ fontSize: "16px", fontWeight: 800, color: C.blue }}>
            {section.title}
          </div>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            border: `2px dashed ${C.border}`,
            borderRadius: "10px",
            color: C.muted,
            fontSize: "11px",
          }}
        >
          No meetings scheduled yet. Add meetings in the Meetings section.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {meetings.map((m, i) => (
            <div key={m.id} style={{ display: "flex", gap: "16px" }}>
              {/* Timeline dot + connector */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background:
                      i === 0 ? C.red : i % 2 === 0 ? C.blue : `${C.blue}60`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: C.white,
                    flexShrink: 0,
                    border: `2px solid ${C.white}`,
                    boxShadow: `0 0 0 2px ${i === 0 ? C.red : C.blue}40`,
                  }}
                >
                  {i + 1}
                </div>
                {i < meetings.length - 1 && (
                  <div
                    style={{
                      width: "2px",
                      flex: 1,
                      minHeight: "16px",
                      background: `linear-gradient(${C.blue}40, ${C.border})`,
                      margin: "3px 0",
                    }}
                  />
                )}
              </div>

              {/* Meeting card */}
              <div
                style={{
                  flex: 1,
                  paddingBottom: i < meetings.length - 1 ? "16px" : "0",
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${C.border}`,
                    background: i === 0 ? `${C.red}06` : C.lightBlue,
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: C.blue,
                      marginBottom: "4px",
                    }}
                  >
                    {m.title}
                  </div>
                  <div
                    style={{
                      fontSize: "9.5px",
                      color: C.red,
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    {fmtTime(m.scheduled)}
                  </div>
                  {m.location && (
                    <div
                      style={{
                        fontSize: "9px",
                        color: C.muted,
                        marginBottom: "2px",
                      }}
                    >
                      📍 {m.location}
                    </div>
                  )}
                  {m.agenda && (
                    <div
                      style={
                        {
                          fontSize: "9.5px",
                          color: C.text,
                          lineHeight: 1.5,
                          marginTop: "6px",
                          paddingTop: "6px",
                          borderTop: `1px solid ${C.border}`,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        } as React.CSSProperties
                      }
                    >
                      {m.agenda}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </A4Page>
  );
}
