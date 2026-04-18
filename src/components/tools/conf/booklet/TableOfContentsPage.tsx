import { C } from "./constants";
import type { BookletSection } from "./types";
import { PageHeader } from "./PageHeader";
import { PageFooter } from "./PageFooter";

export function TableOfContentsPage({
  sections,
  confName,
  confYear,
  totalPages,
}: {
  sections: BookletSection[];
  confName: string;
  confYear: number;
  totalPages: number;
}) {
  return (
    <div
      className="booklet-page"
      style={{
        width: "680px",
        minHeight: "962px",
        background: C.white,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <PageHeader
        confName={confName}
        sectionLabel="Table of Contents"
        pageNum={2}
      />

      <div style={{ flex: 1, padding: "28px 40px 20px" }}>
        {/* Heading */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: C.blue,
              marginBottom: "6px",
            }}
          >
            Table of Contents
          </div>
          <div
            style={{
              height: "3px",
              width: "60px",
              background: `linear-gradient(90deg, ${C.red}, ${C.blue})`,
              borderRadius: "2px",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {/* Cover entry */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 12px",
              borderRadius: "6px",
              background: C.lightBlue,
              marginBottom: "4px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.blue }}>
              Cover Page
            </div>
            <PageNumBadge n={1} highlighted />
          </div>

          {/* Body sections */}
          {sections.map((s, i) => {
            const pg = i + 3; // cover=1, TOC=2, body starts at 3
            const isKey =
              s.type === "LEADER" ||
              s.type === "NEC" ||
              s.type === "CHAIRMAN_ADDRESS" ||
              s.type === "PRESIDENT_ADDRESS";

            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  background: isKey ? `${C.blue}08` : "transparent",
                  borderBottom: `1px solid ${C.border}50`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: isKey ? C.red : C.border,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: isKey ? 700 : 500,
                        color: isKey ? C.blue : C.text,
                      }}
                    >
                      {s.title}
                    </div>
                    {s.subtitle && (
                      <div style={{ fontSize: "9px", color: C.muted }}>
                        {s.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {/* Dotted leader */}
                  <div
                    style={{
                      width: "80px",
                      height: "1px",
                      backgroundImage:
                        "repeating-linear-gradient(90deg, transparent, transparent 3px, #D1D9F0 3px, #D1D9F0 4px)",
                    }}
                  />
                  <PageNumBadge n={pg} highlighted={isKey} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PageFooter
        confName={confName}
        confYear={confYear}
        pageNum={2}
        totalPages={totalPages}
      />
    </div>
  );
}

// Small helper – not exported
function PageNumBadge({ n, highlighted }: { n: number; highlighted: boolean }) {
  return (
    <div
      style={{
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        background: highlighted ? C.blue : C.lightBlue,
        border: `1px solid ${highlighted ? C.blue : C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "9px",
        fontWeight: 700,
        color: highlighted ? C.white : C.blue,
        flexShrink: 0,
      }}
    >
      {n}
    </div>
  );
}
