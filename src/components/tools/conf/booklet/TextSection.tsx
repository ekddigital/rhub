import { C } from "./constants";
import {
  BOOKLET_BODY,
  BOOKLET_BODY_PARAGRAPH,
  BOOKLET_GLOSSARY_ROW,
  splitBookletGlossaryLines,
  splitBookletParagraphs,
} from "@/lib/conf/booklet-body-typography";
import { resolveTextSectionBody } from "@/lib/conf/resolve-booklet-section-content";
import { A4Page } from "./A4Page";
import type { BookletSection } from "./types";

export function TextSection({
  section,
  bodyText,
  showSectionHeading = true,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  bodyText?: string;
  showSectionHeading?: boolean;
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  const trimmed = (bodyText ?? resolveTextSectionBody(section)).trim();
  if (!trimmed) return null;

  const isGlossary = section.type === "ABBREVIATIONS";

  return (
    <A4Page
      pageNum={pageNum}
      totalPages={totalPages}
      sectionLabel={section.title}
      confName={confName}
      confYear={confYear}
    >
      {showSectionHeading ? (
        <div style={{ marginBottom: "16px" }}>
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
            <div
              style={{ fontSize: "20px", fontWeight: 800, color: "#000000" }}
            >
              {section.title}
            </div>
          </div>
          {section.subtitle && (
            <div
              style={{
                fontSize: "12px",
                color: "#000000",
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
      ) : null}

      <div
        style={{
          fontSize: `${BOOKLET_BODY.fontSize}px`,
          lineHeight: BOOKLET_BODY.lineHeight,
          color: "#0A1328",
        }}
      >
        {isGlossary
          ? splitBookletGlossaryLines(trimmed).map((line, i) => (
              <div key={i} style={BOOKLET_GLOSSARY_ROW}>
                {line}
              </div>
            ))
          : splitBookletParagraphs(trimmed).map((paragraph, i) => (
              <p key={i} style={BOOKLET_BODY_PARAGRAPH}>
                {paragraph}
              </p>
            ))}
      </div>
    </A4Page>
  );
}
