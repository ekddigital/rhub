import { C } from "./constants";
import {
  BOOKLET_BODY,
  BOOKLET_BODY_PARAGRAPH,
  splitBookletParagraphs,
} from "@/lib/conf/booklet-body-typography";
import { resolveTextSectionBody } from "@/lib/conf/resolve-booklet-section-content";
import { A4Page } from "./A4Page";
import type { BookletSection } from "./types";

export function TextSection({
  section,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  const trimmed = resolveTextSectionBody(section);
  if (!trimmed) return null;

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
              background: `linear-gradient(${C.blue}, ${C.gold})`,
            }}
          />
          <div style={{ fontSize: "16px", fontWeight: 800, color: C.blue }}>
            {section.title}
          </div>
        </div>
        {section.subtitle && (
          <div
            style={{
              fontSize: "10px",
              color: C.gold,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginLeft: "14px",
            }}
          >
            {section.subtitle}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: `${BOOKLET_BODY.fontSize}px`,
          lineHeight: BOOKLET_BODY.lineHeight,
          color: C.text,
        }}
      >
        {splitBookletParagraphs(trimmed).map((paragraph, i) => (
          <p key={i} style={BOOKLET_BODY_PARAGRAPH}>
            {paragraph}
          </p>
        ))}
      </div>
    </A4Page>
  );
}
