import { C } from "./constants";
import { roleLabel } from "./utils";
import {
  BOOKLET_BODY,
  BOOKLET_BODY_PARAGRAPH,
  splitBookletParagraphs,
} from "@/lib/conf/booklet-body-typography";
import { A4Page } from "./A4Page";
import { Avatar } from "./Avatar";
import type { BookletSection, NecMember } from "./types";

export type AddressSpeaker = Pick<
  NecMember,
  "id" | "name" | "role" | "title" | "city" | "photoPath" | "committeeScope"
>;

/**
 * Shared booklet address template (National President Address design):
 * section badge, profile card with photo/name/role, quote + message body.
 */
export function AddressSection({
  section,
  speaker,
  content,
  confName,
  confYear,
  pageNum,
  totalPages,
  sectionLabel,
}: {
  section: BookletSection;
  speaker: AddressSpeaker | null;
  content: string | null | undefined;
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
  /** Optional override for page header / badge (roster address pages). */
  sectionLabel?: string;
}) {
  const label = sectionLabel ?? section.title;
  const trimmed = (content ?? "").trim();

  return (
    <A4Page
      pageNum={pageNum}
      totalPages={totalPages}
      sectionLabel={label}
      confName={confName}
      confYear={confYear}
    >
      {/* Section heading */}
      <div style={{ marginBottom: "22px" }}>
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
          {label}
        </div>
        <div
          style={{
            height: "2px",
            background: `linear-gradient(90deg, ${C.blue}, ${C.red}, transparent)`,
          }}
        />
      </div>

      {/* Speaker card */}
      {speaker && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "14px 16px",
            borderRadius: "8px",
            background: `linear-gradient(90deg, ${C.blue}10, ${C.lightBlue})`,
            border: `1px solid ${C.blue}20`,
            marginBottom: "20px",
          }}
        >
          <Avatar src={speaker.photoPath} name={speaker.name} size={52} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: C.blue }}>
              {speaker.name}
            </div>
            <div style={{ fontSize: "10px", color: C.muted }}>
              {roleLabel(speaker as NecMember)}
              {speaker.city ? ` · ${speaker.city}` : ""}
            </div>
          </div>
        </div>
      )}

      {/* Decorative open quote */}
      <div
        style={{
          fontSize: "64px",
          lineHeight: 0.8,
          color: `${C.red}18`,
          fontFamily: "Georgia, serif",
          marginBottom: "14px",
          userSelect: "none",
        }}
      >
        &ldquo;
      </div>

      {trimmed ? (
        <div
          style={{
            fontSize: `${BOOKLET_BODY.fontSize}px`,
            lineHeight: BOOKLET_BODY.lineHeight,
            color: C.text,
            maxHeight: "520px",
            overflow: "hidden",
          }}
        >
          {splitBookletParagraphs(trimmed).map((paragraph, i) => (
            <p key={i} style={BOOKLET_BODY_PARAGRAPH}>
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      {speaker && trimmed && (
        <div
          style={{
            marginTop: "24px",
            paddingTop: "14px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div style={{ width: "40px", height: "2px", background: C.red }} />
          <div
            style={{ fontSize: "10px", color: C.muted, fontStyle: "italic" }}
          >
            {speaker.name} · {roleLabel(speaker as NecMember)}
          </div>
        </div>
      )}
    </A4Page>
  );
}
