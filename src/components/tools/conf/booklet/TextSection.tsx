import { C } from "./constants";
import {
  BOOKLET_BODY,
  BOOKLET_BODY_PARAGRAPH,
  BOOKLET_GLOSSARY_ROW,
  splitBookletGlossaryLines,
  splitBookletParagraphs,
} from "@/lib/conf/booklet-body-typography";
import {
  LIBERIAN_NATIONAL_ANTHEM,
  LSUIC_HISTORY_MILESTONES,
  LSUIC_PAST_CONFERENCES,
  LSUIC_PRESIDENT_HISTORY,
} from "@/lib/conf/booklet-conference-copy";
import { resolveTextSectionBody } from "@/lib/conf/resolve-booklet-section-content";
import { A4Page } from "./A4Page";
import type { BookletSection } from "./types";

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function isOverviewSection(section: BookletSection): boolean {
  return normalizeLabel(section.title).includes("overview of lsuic");
}

function isHistorySection(section: BookletSection): boolean {
  return normalizeLabel(section.title).includes("history of the union");
}

function isAnthemSection(section: BookletSection): boolean {
  const title = normalizeLabel(section.title);
  return (
    title.includes("national anthem") || title.includes("anthem of liberia")
  );
}

function splitInHalf<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

function PresidentsTable({
  rows,
}: {
  rows: Array<{ name: string; term: string }>;
}) {
  return (
    <table
      style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.6px" }}
    >
      <thead>
        <tr>
          <th
            style={{
              textAlign: "left",
              padding: "7px 9px",
              background: C.blue,
              color: C.white,
              border: `1px solid ${C.blue}`,
            }}
          >
            Name
          </th>
          <th
            style={{
              textAlign: "left",
              padding: "7px 9px",
              background: C.blue,
              color: C.white,
              border: `1px solid ${C.blue}`,
              width: "112px",
            }}
          >
            Term
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.name}-${row.term}`}>
            <td style={{ padding: "6px 9px", border: `1px solid ${C.border}` }}>
              {row.name}
            </td>
            <td style={{ padding: "6px 9px", border: `1px solid ${C.border}` }}>
              {row.term}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TextSection({
  section,
  bodyText,
  showSectionHeading = true,
  pageIndex = 0,
  pageCount = 1,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  bodyText?: string;
  showSectionHeading?: boolean;
  pageIndex?: number;
  pageCount?: number;
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  const trimmed = (bodyText ?? resolveTextSectionBody(section)).trim();
  if (!trimmed) return null;

  const isGlossary = section.type === "ABBREVIATIONS";
  const overviewSection = isOverviewSection(section);
  const historySection = isHistorySection(section);
  const anthemSection = isAnthemSection(section);
  const paragraphs = splitBookletParagraphs(trimmed);
  const [presidentsLeft, presidentsRight] = splitInHalf(
    LSUIC_PRESIDENT_HISTORY,
  );
  const [venuesLeft, venuesRight] = splitInHalf(LSUIC_PAST_CONFERENCES);
  const isOverviewContinuationPage = overviewSection && pageCount > 1 && pageIndex > 0;
  const showOverviewPresidents = overviewSection && !isOverviewContinuationPage;
  const showOverviewVenues = overviewSection && (isOverviewContinuationPage || pageCount === 1);

  const visibleParagraphs = anthemSection
    ? []
    : showOverviewPresidents
      ? paragraphs.slice(0, 2)
      : paragraphs;

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
              style={{
                fontSize: anthemSection
                  ? "24px"
                  : historySection
                    ? "22px"
                    : "21px",
                fontWeight: 800,
                color: "#000000",
              }}
            >
              {section.title}
            </div>
          </div>
          {section.subtitle && (
            <div
              style={{
                fontSize: "12.8px",
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
          fontSize: `${anthemSection ? 15.8 : historySection ? 15.6 : overviewSection ? 15.2 : BOOKLET_BODY.fontSize}px`,
          lineHeight: anthemSection
            ? 1.72
            : historySection
              ? 1.72
              : overviewSection
                ? 1.68
                : BOOKLET_BODY.lineHeight,
          color: "#0A1328",
        }}
      >
        {isGlossary
          ? splitBookletGlossaryLines(trimmed).map((line, i) => (
              <div key={i} style={BOOKLET_GLOSSARY_ROW}>
                {line}
              </div>
            ))
          : visibleParagraphs.map((paragraph, i) => (
              <p key={i} style={BOOKLET_BODY_PARAGRAPH}>
                {paragraph}
              </p>
            ))}

        {showOverviewPresidents && (
          <div style={{ marginTop: "14px" }}>
            <div
              style={{
                fontSize: "13.8px",
                fontWeight: 800,
                color: "#0F1E45",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Presidents of LSUIC (2006 - Present)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <PresidentsTable rows={presidentsLeft} />
              <PresidentsTable rows={presidentsRight} />
            </div>

            {pageCount > 1 && (
              <p
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  fontSize: "12.6px",
                  lineHeight: 1.55,
                  color: "#27395D",
                }}
              >
                Past conference venues continue on the next page.
              </p>
            )}
          </div>
        )}

        {showOverviewVenues && (
          <div style={{ marginTop: showOverviewPresidents ? "14px" : "4px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "26px",
                marginBottom: "10px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/conf/flag-of-liberia.png"
                alt="Flag of Liberia"
                style={{ width: "82px", height: "52px", objectFit: "contain" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/conf/liberia-seal.svg"
                alt="Seal of Liberia"
                style={{ width: "52px", height: "52px", objectFit: "contain" }}
              />
            </div>

            <div
              style={{
                fontSize: "13.8px",
                fontWeight: 800,
                color: "#0F1E45",
                marginTop: "14px",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Past Conference Venues
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12.6px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "7px 9px",
                        background: C.blue,
                        color: C.white,
                        border: `1px solid ${C.blue}`,
                      }}
                    >
                      City
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "7px 9px",
                        background: C.blue,
                        color: C.white,
                        border: `1px solid ${C.blue}`,
                        width: "132px",
                      }}
                    >
                      Year
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {venuesLeft.map((row) => (
                    <tr key={`left-${row.city}-${row.year}`}>
                      <td
                        style={{ padding: "6px 9px", border: `1px solid ${C.border}` }}
                      >
                        {row.city}
                      </td>
                      <td
                        style={{ padding: "6px 9px", border: `1px solid ${C.border}` }}
                      >
                        {row.year}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12.6px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "7px 9px",
                        background: C.blue,
                        color: C.white,
                        border: `1px solid ${C.blue}`,
                      }}
                    >
                      City
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "7px 9px",
                        background: C.blue,
                        color: C.white,
                        border: `1px solid ${C.blue}`,
                        width: "132px",
                      }}
                    >
                      Year
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {venuesRight.map((row) => (
                    <tr key={`right-${row.city}-${row.year}`}>
                      <td
                        style={{ padding: "6px 9px", border: `1px solid ${C.border}` }}
                      >
                        {row.city}
                      </td>
                      <td
                        style={{ padding: "6px 9px", border: `1px solid ${C.border}` }}
                      >
                        {row.year}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p
              style={{
                marginTop: "10px",
                marginBottom: 0,
                fontSize: "12.8px",
                lineHeight: 1.56,
              }}
            >
              <strong>NB:</strong> There was no conference in 2007 because
              conferences were originally held once every two years; during the
              2008 conference in Wuhan, a referendum approved annual
              conferences.
            </p>
          </div>
        )}

        {historySection && (
          <div style={{ marginTop: "14px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/conf/flag-of-liberia.png"
                alt="Flag of Liberia"
                style={{ width: "58px", height: "36px", objectFit: "contain" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/conf/liberia-seal.svg"
                alt="Seal of Liberia"
                style={{ width: "36px", height: "36px", objectFit: "contain" }}
              />
            </div>
            <div
              style={{
                fontSize: "13.8px",
                fontWeight: 800,
                color: "#0F1E45",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Institutional Milestones
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "7px 9px",
                      background: C.blue,
                      color: C.white,
                      border: `1px solid ${C.blue}`,
                      width: "120px",
                    }}
                  >
                    Period
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "7px 9px",
                      background: C.blue,
                      color: C.white,
                      border: `1px solid ${C.blue}`,
                      width: "180px",
                    }}
                  >
                    Focus
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "7px 9px",
                      background: C.blue,
                      color: C.white,
                      border: `1px solid ${C.blue}`,
                    }}
                  >
                    Outcomes
                  </th>
                </tr>
              </thead>
              <tbody>
                {LSUIC_HISTORY_MILESTONES.map((row) => (
                  <tr key={row.period}>
                    <td
                      style={{
                        padding: "7px 9px",
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      {row.period}
                    </td>
                    <td
                      style={{
                        padding: "7px 9px",
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      {row.focus}
                    </td>
                    <td
                      style={{
                        padding: "7px 9px",
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      {row.outcomes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {anthemSection && (
          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px",
            }}
          >
            {[
              LIBERIAN_NATIONAL_ANTHEM.verse1,
              LIBERIAN_NATIONAL_ANTHEM.verse2,
            ].map((verse, idx) => (
              <div
                key={idx}
                style={{
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  padding: "16px 16px",
                  background: `${C.lightBlue}80`,
                  minHeight: "560px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: C.blue,
                    marginBottom: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  Verse {idx + 1}
                </div>
                {verse.map((line, lineIndex) => (
                  <div
                    key={`${idx}-${lineIndex}`}
                    style={{
                      fontSize: "17px",
                      lineHeight: 1.62,
                      marginBottom: "2px",
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </A4Page>
  );
}
