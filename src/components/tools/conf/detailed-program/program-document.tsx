import type { ReactNode } from "react";
import { BOOKLET_A4, C } from "../booklet/constants";
import { PageHeader } from "../booklet/PageHeader";
import { PageFooter } from "../booklet/PageFooter";
import {
  DETAILED_PROGRAM_DAYS,
  PROGRAM_GENERAL_NOTES,
  PROGRAM_META,
  type ProgramDay,
  type ProgramSlot,
} from "./program-data";

export const PROGRAM_GUIDE_TOTAL_PAGES = 9;

const DAY_COLORS: Record<number, { accent: string; badge: string }> = {
  1: { accent: C.blue, badge: "#E8EEF8" },
  2: { accent: C.red, badge: "#FEF0F0" },
  3: { accent: "#1A5C36", badge: "#E8F5EE" },
  4: { accent: "#5C4A1A", badge: "#F5F0E8" },
};

function ProgramA4Page({
  children,
  pageNum,
  sectionLabel,
}: {
  children: ReactNode;
  pageNum: number;
  sectionLabel: string;
}) {
  return (
    <div
      className="booklet-page"
      style={{
        width: `${BOOKLET_A4.width}px`,
        height: `${BOOKLET_A4.height}px`,
        maxHeight: `${BOOKLET_A4.height}px`,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <PageHeader
        confName={PROGRAM_META.confName}
        sectionLabel={sectionLabel}
        pageNum={pageNum}
      />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          padding: "18px 40px 10px",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      <PageFooter
        confName={PROGRAM_META.confName}
        confYear={PROGRAM_META.confYear}
        pageNum={pageNum}
        totalPages={PROGRAM_GUIDE_TOTAL_PAGES}
      />
    </div>
  );
}

function SlotRow({ slot, accent }: { slot: ProgramSlot; accent: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "152px 1fr",
        gap: "8px",
        padding: "9px 12px",
        borderRadius: "6px",
        background: slot.highlight ? `${accent}0D` : "transparent",
        borderLeft: slot.highlight
          ? `3px solid ${accent}`
          : `3px solid transparent`,
        marginBottom: "4px",
      }}
    >
      {/* Time */}
      <div
        style={{
          fontSize: "13px",
          fontWeight: 800,
          color: accent,
          lineHeight: 1.4,
          paddingTop: "1px",
          flexShrink: 0,
        }}
      >
        {slot.time}
      </div>

      {/* Activity block */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: slot.highlight ? 800 : 700,
            color: "#000000",
            lineHeight: 1.48,
          }}
        >
          {slot.activity}
        </div>

        {slot.meal && (
          <div
            style={{
              marginTop: "3px",
              fontSize: "12.5px",
              fontWeight: 700,
              color: C.red,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            🍽 {slot.meal}
          </div>
        )}

        {slot.by && (
          <div
            style={{
              marginTop: "3px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#3A5080",
              fontStyle: "italic",
            }}
          >
            {slot.by}
          </div>
        )}

        {slot.subs && slot.subs.length > 0 && (
          <ul
            style={{
              margin: "4px 0 0",
              paddingLeft: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {slot.subs.map((sub, i) => (
              <li
                key={i}
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#1A2F5E",
                  lineHeight: 1.48,
                }}
              >
                {sub.label}
                {sub.by && (
                  <span style={{ color: "#3A5080", fontStyle: "italic" }}>
                    {" "}
                    — {sub.by}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DayHeader({ day }: { day: ProgramDay }) {
  const color = DAY_COLORS[day.day] ?? DAY_COLORS[1];
  return (
    <div
      style={{
        marginBottom: "10px",
        paddingBottom: "8px",
        borderBottom: `2px solid ${color.accent}`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            padding: "3px 12px",
            borderRadius: "14px",
            background: color.accent,
            color: C.white,
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Day {day.day} — {day.dayOfWeek}
        </div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#555555",
          }}
        >
          {day.date}
        </div>
      </div>
      <div
        style={{
          marginTop: "4px",
          fontSize: "21px",
          fontWeight: 900,
          color: "#000000",
          lineHeight: 1.2,
        }}
      >
        {day.label}
      </div>
      {day.theme && (
        <div
          style={{
            marginTop: "2px",
            fontSize: "13.5px",
            fontWeight: 700,
            color: color.accent,
            fontStyle: "italic",
          }}
        >
          {day.theme}
        </div>
      )}
    </div>
  );
}

export function ProgramDocument({ gap = 0 }: { gap?: number }) {
  const colors = DAY_COLORS;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: `${gap}px`,
      }}
    >
      {/* ── Page 1: Cover ─────────────────────────────────────────────── */}
      <div
        className="booklet-page"
        style={{
          width: `${BOOKLET_A4.width}px`,
          height: `${BOOKLET_A4.height}px`,
          background: C.blue,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* flag-stripe top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "18px",
            display: "flex",
          }}
        >
          {[
            "#BF0A30",
            "#FFFFFF",
            "#BF0A30",
            "#FFFFFF",
            "#BF0A30",
            "#FFFFFF",
            "#BF0A30",
          ].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c, opacity: 0.9 }} />
          ))}
        </div>

        <div style={{ textAlign: "center", padding: "0 60px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: `${C.white}AA`,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "18px",
            }}
          >
            Liberian Student Union in China
          </div>

          <div
            style={{
              fontSize: "42px",
              fontWeight: 900,
              color: C.white,
              lineHeight: 1.15,
              marginBottom: "10px",
            }}
          >
            Detailed Program Guide
          </div>

          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: C.gold,
              marginBottom: "6px",
            }}
          >
            {PROGRAM_META.confName}
          </div>

          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: `${C.white}CC`,
              marginBottom: "28px",
            }}
          >
            {PROGRAM_META.dates} · {PROGRAM_META.venue}
          </div>

          {/* divider */}
          <div
            style={{
              width: "260px",
              height: "2px",
              background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
              margin: "0 auto 28px",
            }}
          />

          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: C.white,
              fontStyle: "italic",
              marginBottom: "4px",
            }}
          >
            &ldquo;{PROGRAM_META.theme}&rdquo;
          </div>
          <div
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: `${C.white}99`,
            }}
          >
            {PROGRAM_META.subTheme}
          </div>
        </div>

        {/* day quick-reference strip */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "40px",
            right: "40px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
          }}
        >
          {DETAILED_PROGRAM_DAYS.map((d) => (
            <div
              key={d.day}
              style={{
                background: `${C.white}18`,
                borderRadius: "8px",
                padding: "8px 10px",
                textAlign: "center",
                border: `1px solid ${C.white}30`,
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: C.gold,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Day {d.day}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: C.white,
                  lineHeight: 1.3,
                }}
              >
                {d.label}
              </div>
              <div
                style={{
                  fontSize: "9.5px",
                  color: `${C.white}99`,
                  marginTop: "2px",
                }}
              >
                {d.date.replace(", 2026", "")}
              </div>
            </div>
          ))}
        </div>

        {/* flag-stripe bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "14px",
            display: "flex",
          }}
        >
          {[
            "#BF0A30",
            "#FFFFFF",
            "#BF0A30",
            "#FFFFFF",
            "#BF0A30",
            "#FFFFFF",
            "#BF0A30",
          ].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c, opacity: 0.9 }} />
          ))}
        </div>
      </div>

      {/* ── Page 2: General Notes ─────────────────────────────────────── */}
      <ProgramA4Page pageNum={2} sectionLabel="Conference Notes">
        <div
          style={{
            fontSize: "22px",
            fontWeight: 900,
            color: C.blue,
            marginBottom: "6px",
          }}
        >
          Conference Notes
        </div>
        <div
          style={{
            height: "2px",
            background: `linear-gradient(90deg, ${C.blue}, ${C.red}, transparent)`,
            marginBottom: "16px",
          }}
        />

        <div style={{ marginBottom: "18px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#111111",
              marginBottom: "6px",
            }}
          >
            Venue
          </div>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: C.blue }}>
            {PROGRAM_META.venue}
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#333333" }}>
            {PROGRAM_META.location}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#111111",
              marginBottom: "10px",
            }}
          >
            General Rules &amp; Information
          </div>
          {PROGRAM_GENERAL_NOTES.map((note, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: C.blue,
                  color: C.white,
                  fontSize: "10px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "1px",
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#111111",
                  lineHeight: 1.55,
                }}
              >
                {note}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#111111",
              marginBottom: "10px",
            }}
          >
            Four-Day Overview
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px",
            }}
          >
            {DETAILED_PROGRAM_DAYS.map((d) => {
              const c = colors[d.day] ?? colors[1];
              return (
                <div
                  key={d.day}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: c.badge,
                    border: `1.5px solid ${c.accent}30`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      color: c.accent,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "3px",
                    }}
                  >
                    Day {d.day} · {d.dayOfWeek}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "#000000",
                      lineHeight: 1.2,
                    }}
                  >
                    {d.label}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#555555",
                      marginTop: "2px",
                    }}
                  >
                    {d.date}
                  </div>
                  {d.theme && (
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontStyle: "italic",
                        color: c.accent,
                        marginTop: "2px",
                        fontWeight: 700,
                      }}
                    >
                      {d.theme}
                    </div>
                  )}

                  {d.dressCodes.length > 0 && (
                    <div
                      style={{
                        marginTop: "7px",
                        borderTop: `1px solid ${c.accent}22`,
                        paddingTop: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          color: c.accent,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: "4px",
                        }}
                      >
                        Dress Code
                      </div>
                      {d.dressCodes.map((dc, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: "5px",
                            marginBottom: "3px",
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              flexShrink: 0,
                              marginTop: "2px",
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: c.accent,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: "9.5px",
                                fontWeight: 700,
                                color: "#000000",
                              }}
                            >
                              {dc.session}:
                            </span>{" "}
                            <span
                              style={{
                                fontSize: "9.5px",
                                fontWeight: 600,
                                color: "#333333",
                              }}
                            >
                              {dc.code}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ProgramA4Page>

      {/* ── Day 1 across 2 pages ──────────────────────────────────────── */}
      {renderDayPages(
        DAY_1_SLOTS_PAGE1,
        DAY_1_SLOTS_PAGE2,
        DETAILED_PROGRAM_DAYS[0],
        3,
      )}

      {/* ── Day 2 across 2 pages ──────────────────────────────────────── */}
      {renderDayPages(
        DAY_2_SLOTS_PAGE1,
        DAY_2_SLOTS_PAGE2,
        DETAILED_PROGRAM_DAYS[1],
        5,
      )}

      {/* ── Day 3 across 2 pages ──────────────────────────────────────── */}
      {renderDayPages(
        DAY_3_SLOTS_PAGE1,
        DAY_3_SLOTS_PAGE2,
        DETAILED_PROGRAM_DAYS[2],
        7,
      )}

      {/* ── Day 4: 1 page ─────────────────────────────────────────────── */}
      <ProgramA4Page
        pageNum={9}
        sectionLabel={`Day 4 — ${DETAILED_PROGRAM_DAYS[3].label}`}
      >
        <DayHeader day={DETAILED_PROGRAM_DAYS[3]} />
        {DETAILED_PROGRAM_DAYS[3].slots.map((slot, i) => (
          <SlotRow
            key={i}
            slot={slot}
            accent={DAY_COLORS[4]?.accent ?? C.blue}
          />
        ))}
      </ProgramA4Page>
    </div>
  );
}

// ── Slot splits: each day split across two A4 pages ───────────────────────────
const DAY_1_SLOTS_PAGE1 = DETAILED_PROGRAM_DAYS[0].slots.slice(0, 7);
const DAY_1_SLOTS_PAGE2 = DETAILED_PROGRAM_DAYS[0].slots.slice(7);

const DAY_2_SLOTS_PAGE1 = DETAILED_PROGRAM_DAYS[1].slots.slice(0, 10);
const DAY_2_SLOTS_PAGE2 = DETAILED_PROGRAM_DAYS[1].slots.slice(10);

const DAY_3_SLOTS_PAGE1 = DETAILED_PROGRAM_DAYS[2].slots.slice(0, 12);
const DAY_3_SLOTS_PAGE2 = DETAILED_PROGRAM_DAYS[2].slots.slice(12);

function renderDayPages(
  page1Slots: ProgramSlot[],
  page2Slots: ProgramSlot[],
  day: ProgramDay,
  startPageNum: number,
) {
  const accent = DAY_COLORS[day.day]?.accent ?? C.blue;
  return (
    <>
      <ProgramA4Page
        pageNum={startPageNum}
        sectionLabel={`Day ${day.day} — ${day.label}`}
      >
        <DayHeader day={day} />
        {page1Slots.map((slot, i) => (
          <SlotRow key={i} slot={slot} accent={accent} />
        ))}
      </ProgramA4Page>

      <ProgramA4Page
        pageNum={startPageNum + 1}
        sectionLabel={`Day ${day.day} — ${day.label} (cont.)`}
      >
        {/* continuation sub-heading */}
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: accent,
            marginBottom: "8px",
            borderBottom: `1px solid ${accent}40`,
            paddingBottom: "6px",
          }}
        >
          Day {day.day} continued — {day.label}
        </div>
        {page2Slots.map((slot, i) => (
          <SlotRow key={i} slot={slot} accent={accent} />
        ))}
      </ProgramA4Page>
    </>
  );
}
