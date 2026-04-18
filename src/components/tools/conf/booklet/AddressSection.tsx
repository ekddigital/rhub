import { C } from "./constants";
import { roleLabel } from "./utils";
import { A4Page } from "./A4Page";
import { Avatar } from "./Avatar";
import type { BookletSection, NecMember } from "./types";

export function AddressSection({
  section,
  speaker,
  content,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  speaker: NecMember | null;
  content: string | null | undefined;
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
          {section.title}
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
              {roleLabel(speaker)}
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

      {content ? (
        <div
          style={{
            fontSize: "11.5px",
            lineHeight: 1.85,
            color: C.text,
            maxHeight: "520px",
            overflow: "hidden",
          }}
        >
          {content.split("\n").map((line, i) => (
            <p key={i} style={{ marginBottom: "8px" }}>
              {line || <br />}
            </p>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            border: `2px dashed ${C.border}`,
            borderRadius: "10px",
          }}
        >
          <div style={{ fontSize: "11px", color: C.muted }}>
            {section.type === "CHAIRMAN_ADDRESS"
              ? 'The Chairman\'s address will appear here. Click "Write Address" in the Overview tab.'
              : "Content not yet written. Use the Section Manager to add this text."}
          </div>
        </div>
      )}

      {speaker && content && (
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
            {speaker.name} · {roleLabel(speaker)}
          </div>
        </div>
      )}
    </A4Page>
  );
}
