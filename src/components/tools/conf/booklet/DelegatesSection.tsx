import {
  C,
  DELEGATE_CARD_HEIGHT,
  DELEGATE_CARD_PADDING,
  DELEGATE_CARD_PHOTO_SIZE,
  DELEGATE_ROSTER_COLS,
  DELEGATE_ROSTER_GAP,
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
              display: "grid",
              gridTemplateColumns: `repeat(${DELEGATE_ROSTER_COLS}, minmax(0, 1fr))`,
              gridAutoRows: `${DELEGATE_CARD_HEIGHT}px`,
              gap: DELEGATE_ROSTER_GAP,
              alignContent: "start",
            }}
          >
            {delegates.map((d) => (
              <div
                key={d.id}
                style={{
                  height: `${DELEGATE_CARD_HEIGHT}px`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: DELEGATE_CARD_PADDING,
                  borderRadius: "10px",
                  border: `1px solid ${C.border}`,
                  background: C.lightBlue,
                  boxShadow: `0 1px 4px rgba(0,40,104,0.06)`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${DELEGATE_CARD_PHOTO_SIZE}px`,
                    height: `${DELEGATE_CARD_PHOTO_SIZE}px`,
                    maxWidth: "100%",
                    borderRadius: "7px",
                    overflow: "hidden",
                    border: `2px solid ${C.blue}30`,
                    flexShrink: 0,
                  }}
                >
                  <Avatar
                    src={d.bookletPhotoPath}
                    name={d.name}
                    size={DELEGATE_CARD_PHOTO_SIZE}
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
                    marginTop: "3px",
                    lineHeight: 1.2,
                    maxHeight: "24px",
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
                    marginTop: "1px",
                    fontSize: "7.5px",
                    color: C.blue,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    lineHeight: 1.2,
                    maxHeight: "18px",
                    overflow: "hidden",
                    flexShrink: 0,
                    width: "100%",
                  }}
                >
                  {formatDelegateOffice(d.conferencePosition)}
                </div>

                <div
                  style={{
                    marginTop: "3px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1px",
                    width: "100%",
                    flexShrink: 0,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "7.5px",
                      color: C.muted,
                      lineHeight: 1.25,
                      overflow: "hidden",
                      overflowWrap: "break-word",
                      wordBreak: "normal",
                      width: "100%",
                      maxHeight: "18px",
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
                      overflowWrap: "break-word",
                      wordBreak: "normal",
                      width: "100%",
                      maxHeight: "18px",
                    }}
                  >
                    {d.university?.trim() || "Member"}
                  </div>
                </div>

                {d.delegateCode ? (
                  <div
                    style={{
                      marginTop: "2px",
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
                      marginTop: "2px",
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
