import {
  C,
  DELEGATE_ROSTER_COLS,
  DELEGATE_ROSTER_ROWS,
} from "./constants";
import { A4Page } from "./A4Page";
import { Avatar } from "./Avatar";
import type { BookletSection, Delegate } from "./types";

function formatDelegateOffice(position: string | null | undefined): string {
  const raw = (position ?? "").trim();
  if (!raw) return "Member, LSUIC";
  if (/,\s*[A-Z]{2,}$/i.test(raw)) return raw;

  const lower = raw.toLowerCase();
  if (lower === "member") return "Member, LSUIC";
  if (lower.startsWith("national ")) return `${raw}, NEC`;
  if (
    lower.startsWith("conference ") ||
    lower.includes("committee chair") ||
    lower.includes("publicity")
  ) {
    return `${raw}, CC`;
  }
  if (lower.includes("coordinator")) return `${raw}, COC`;
  if (lower.includes("city president")) return `${raw}, CL`;
  if (lower.includes("adjudicator")) return `${raw}, JB`;
  if (/^(ppc|ppa|aec|wmf)\b/i.test(raw)) {
    return `${raw}, ${raw.slice(0, 3).toUpperCase()}`;
  }
  if (lower.includes("guest speaker")) return `${raw}, GS`;
  return raw;
}

export function DelegatesSection({
  section,
  delegates,
  totalDelegateCount,
  rosterPageIndex,
  rosterPageCount,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  delegates: Delegate[];
  totalDelegateCount: number;
  rosterPageIndex: number;
  rosterPageCount: number;
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  const rosterGap = "9px";
  const participantLabel =
    rosterPageCount > 1
      ? `${totalDelegateCount} Participants · Page ${rosterPageIndex + 1} of ${rosterPageCount}`
      : `${totalDelegateCount} Participants`;

  return (
    <A4Page
      pageNum={pageNum}
      totalPages={totalPages}
      sectionLabel={section.title}
      confName={confName}
      confYear={confYear}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header row */}
        <div style={{ flexShrink: 0, marginBottom: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "4px",
                  height: "24px",
                  borderRadius: "2px",
                  background: `linear-gradient(${C.blue}, ${C.red})`,
                }}
              />
              <div style={{ fontSize: "16px", fontWeight: 800, color: C.blue }}>
                {section.title}
              </div>
            </div>
            <div
              style={{
                padding: "3px 10px",
                borderRadius: "20px",
                background: C.blue,
                color: C.white,
                fontSize: "9px",
                fontWeight: 700,
                maxWidth: "52%",
                textAlign: "right",
                lineHeight: 1.35,
              }}
            >
              {participantLabel}
            </div>
          </div>
          {section.bodyText && (
            <div style={{ fontSize: "10px", color: C.muted, marginLeft: "14px" }}>
              {section.bodyText}
            </div>
          )}
        </div>

        {delegates.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
              textAlign: "center",
              border: `2px dashed ${C.border}`,
              borderRadius: "10px",
              color: C.muted,
              fontSize: "11px",
            }}
          >
            No signed-up participants yet.
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${DELEGATE_ROSTER_COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${Math.min(
                DELEGATE_ROSTER_ROWS,
                Math.ceil(delegates.length / DELEGATE_ROSTER_COLS),
              )}, minmax(0, 1fr))`,
              gap: rosterGap,
              alignContent: "stretch",
            }}
          >
            {delegates.map((d) => (
              <div
                key={d.id}
                style={{
                  height: "100%",
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "8px 6px 6px",
                  borderRadius: "10px",
                  border: `1px solid ${C.border}`,
                  background: C.lightBlue,
                  boxShadow: `0 1px 4px rgba(0,40,104,0.06)`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "78px",
                    maxWidth: "100%",
                    borderRadius: "7px",
                    overflow: "hidden",
                    border: `2px solid ${C.blue}30`,
                    marginBottom: "2px",
                    flexShrink: 0,
                  }}
                >
                  <Avatar
                    src={d.bookletPhotoPath}
                    name={d.name}
                    size={78}
                    square
                    silhouette
                    borderColor={C.blue}
                  />
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: C.blue,
                    marginTop: "6px",
                    lineHeight: 1.25,
                    maxHeight: "30px",
                    overflow: "hidden",
                    width: "100%",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {d.name}
                </div>

                <div
                  style={{
                    marginTop: "2px",
                    fontSize: "7.5px",
                    color: C.blue,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    lineHeight: 1.25,
                    maxHeight: "28px",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {formatDelegateOffice(d.conferencePosition)}
                </div>

                <div
                  style={{
                    marginTop: "2px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1px",
                    width: "100%",
                    flex: 1,
                    minHeight: 0,
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      fontSize: "7.5px",
                      color: C.muted,
                      lineHeight: 1.3,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {(d.city ? d.city : "Member") +
                      (d.province ? `, ${d.province}` : "")}
                  </div>

                  <div
                    style={{
                      fontSize: "7.5px",
                      color: C.muted,
                      lineHeight: 1.25,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {d.university?.trim() || "Member"}
                  </div>
                </div>

                {d.delegateCode ? (
                  <div
                    style={{
                      marginTop: "4px",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      background: `${C.red}15`,
                      color: C.red,
                      fontSize: "7px",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {d.delegateCode}
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: "4px",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      background: `${C.border}60`,
                      color: C.muted,
                      fontSize: "7px",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    ID pending
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalDelegateCount > 0 && rosterPageIndex === rosterPageCount - 1 && (
          <div
            style={{
              flexShrink: 0,
              marginTop: "12px",
              textAlign: "right",
              fontSize: "8.5px",
              color: C.muted,
              fontStyle: "italic",
            }}
          >
            {totalDelegateCount} signed-up participant
            {totalDelegateCount !== 1 ? "s" : ""} as of{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}
      </div>
    </A4Page>
  );
}
