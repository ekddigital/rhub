import type { CSSProperties } from "react";
import {
  C,
  computeDelegatePhotoSize,
  computeDelegateRosterCardHeight,
  DELEGATE_CARD_INNER_GAP,
  DELEGATE_CARD_PADDING,
  DELEGATE_ROSTER_COLS,
  DELEGATE_ROSTER_GAP,
} from "./constants";
import { A4Page } from "./A4Page";
import { Avatar } from "./Avatar";
import type { BookletSection, Delegate } from "./types";

/** Fixed-height text block — avoids -webkit-line-clamp, which html2canvas mispositions in PDF. */
function linesBlock(
  lines: number,
  lineHeightPx: number,
): Pick<CSSProperties, "lineHeight" | "maxHeight" | "overflow"> {
  return {
    lineHeight: `${lineHeightPx}px`,
    maxHeight: `${lines * lineHeightPx}px`,
    overflow: "hidden",
  };
}

function MapPinIcon() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      stroke={C.darkBlue}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: "1px" }}
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      stroke={C.darkBlue}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: "1px" }}
      aria-hidden
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
    </svg>
  );
}

function DelegateCard({
  delegate: d,
  cardHeight,
  photoSize,
}: {
  delegate: Delegate;
  cardHeight: number;
  photoSize: number;
}) {
  const location =
    (d.city ? d.city : "Member") + (d.province ? `, ${d.province}` : "");
  const university = d.university?.trim() || "Member";

  const idBadge = d.delegateCode ? (
    <div
      style={{
        padding: "1px 6px",
        borderRadius: "4px",
        background: `${C.red}18`,
        color: C.red,
        fontSize: "7px",
        fontFamily: "monospace",
        fontWeight: 600,
      }}
    >
      {d.delegateCode}
    </div>
  ) : (
    <div
      style={{
        padding: "1px 6px",
        borderRadius: "4px",
        background: `${C.border}60`,
        color: C.darkBlue,
        fontSize: "7px",
        fontFamily: "monospace",
        fontWeight: 600,
      }}
    >
      ID
    </div>
  );

  return (
    <div
      style={{
        minHeight: `${cardHeight}px`,
        height: `${cardHeight}px`,
        boxSizing: "border-box",
        padding: DELEGATE_CARD_PADDING,
        borderRadius: "10px",
        border: `1px solid ${C.border}`,
        background: C.lightBlue,
        boxShadow: "0 1px 4px rgba(0,40,104,0.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: DELEGATE_CARD_INNER_GAP,
          alignItems: "flex-start",
          width: "100%",
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: `${photoSize}px`,
            height: `${photoSize}px`,
            borderRadius: "7px",
            overflow: "hidden",
            border: `2px solid ${C.blue}30`,
            flexShrink: 0,
          }}
        >
          <Avatar
            src={d.bookletPhotoPath}
            name={d.name}
            size={photoSize}
            square
            silhouette
            borderColor={C.blue}
          />
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#000000",
              width: "100%",
              wordBreak: "break-word",
              ...linesBlock(2, 14),
            }}
          >
            {d.name}
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "10px",
              color: "#111111",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              width: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: "12px",
            }}
          >
            {formatDelegateOffice(d.conferencePosition)}
          </div>

          <div
            style={{
              marginTop: "4px",
              display: "flex",
              alignItems: "flex-start",
              gap: "3px",
              width: "100%",
              fontSize: "8.5px",
              color: "#111111",
              fontWeight: 700,
              lineHeight: "11px",
            }}
          >
            <MapPinIcon />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: "11px",
              }}
            >
              {location}
            </span>
          </div>

          <div
            style={{
              marginTop: "4px",
              display: "flex",
              alignItems: "flex-start",
              gap: "3px",
              width: "100%",
              fontSize: "8.5px",
              color: "#111111",
              fontWeight: 700,
              lineHeight: "11px",
            }}
          >
            <BuildingIcon />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                wordBreak: "break-word",
                ...linesBlock(2, 11),
              }}
            >
              {university}
            </span>
          </div>

          <div style={{ marginTop: "5px" }}>{idBadge}</div>
        </div>
      </div>
    </div>
  );
}

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
  const participantLabel = `Page ${rosterPageIndex + 1} of ${rosterPageCount}`;

  const isLastRosterPage = rosterPageIndex === rosterPageCount - 1;
  const cardHeight = computeDelegateRosterCardHeight(delegates.length, {
    bodyText: Boolean(section.bodyText?.trim()),
    lastPage: isLastRosterPage && totalDelegateCount > 0,
  });
  const photoSize = computeDelegatePhotoSize(cardHeight);

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
                fontSize: "10px",
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
            <div
              style={{ fontSize: "11px", color: "#111111", marginLeft: "14px" }}
            >
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
              color: C.darkBlue,
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
              gridAutoRows: `${cardHeight}px`,
              gap: DELEGATE_ROSTER_GAP,
              alignContent: "start",
            }}
          >
            {delegates.map((d) => (
              <DelegateCard
                key={d.id}
                delegate={d}
                cardHeight={cardHeight}
                photoSize={photoSize}
              />
            ))}
          </div>
        )}

        {totalDelegateCount > 0 && isLastRosterPage && (
          <div
            style={{
              flexShrink: 0,
              marginTop: "12px",
              textAlign: "right",
              fontSize: "8.5px",
              color: C.darkBlue,
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
            <div style={{ marginTop: "6px", color: "#111111" }}>
              Delegates who have not registered will not be assigned a room.
            </div>
          </div>
        )}
      </div>
    </A4Page>
  );
}
