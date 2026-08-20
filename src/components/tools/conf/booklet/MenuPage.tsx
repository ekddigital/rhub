import { C, BOOKLET_A4 } from "./constants";
import { A4Page } from "./A4Page";
import type { BookletSection } from "./types";

/** Day summary derived from reading the event menu image. */
const MENU_DAYS = [
  {
    label: "DAY 1",
    day: "Arrival Day",
    date: "July 24, 2026",
    meals: ["Liberian Dry Rice"],
  },
  {
    label: "DAY 2",
    day: "Pool Party Day",
    date: "July 25, 2026",
    meals: ["Lunch: Beans Toborgee", "Dinner: Pepper Soup with Rice and Fufu"],
  },
  {
    label: "DAY 3",
    day: "Dinner & Awards Night",
    date: "July 26, 2026",
    meals: [
      "Lunch: Pepper Kala",
      "Dinner: Jollof Rice · Fried Rice · Fried Chicken · Barbecue · Fried Turkey · Potato Salad · Vegetable Salad · Macaroni Salad & More",
    ],
  },
  {
    label: "DAY 4",
    day: "Departure",
    date: "July 27, 2026",
    meals: [],
  },
];

/** Day accent colours: alternates blue / red matching the original menu graphic */
const DAY_COLORS = [C.blue, C.red, C.blue, C.red];

export function MenuPage({
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
  // Usable content width inside A4 page margins (40px each side)
  const contentWidth = BOOKLET_A4.width - 80;

  return (
    <A4Page
      pageNum={pageNum}
      totalPages={totalPages}
      sectionLabel={section.title}
      confName={confName}
      confYear={confYear}
    >
      {/* ── Section badge ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "4px",
            background: C.red,
            color: C.white,
            fontSize: "9.5px",
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

      {/* ── Full-width menu image ─────────────────────────────────────── */}
      {/* The image is a designed 4-day menu graphic — displayed full width,
          aspect-ratio preserved, no cropping. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/conf/menu-cooking-committee.jpg"
        alt="Conference Event Menu"
        style={{
          width: `${contentWidth}px`,
          height: `${Math.round(contentWidth * (1024 / 1536))}px`,
          objectFit: "contain",
          objectPosition: "center",
          display: "block",
          borderRadius: "10px",
          border: `1px solid ${C.border}`,
          marginBottom: "14px",
        }}
      />

      {/* ── Day-by-day text summary ───────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
        }}
      >
        {MENU_DAYS.map((day, i) => (
          <div
            key={day.label}
            style={{
              borderRadius: "8px",
              border: `1.5px solid ${DAY_COLORS[i]}30`,
              padding: "10px 10px 10px",
              background: `${DAY_COLORS[i]}07`,
            }}
          >
            {/* Day badge */}
            <div
              style={{
                display: "inline-block",
                background: DAY_COLORS[i],
                color: C.white,
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                padding: "3px 10px",
                borderRadius: "3px",
                marginBottom: "5px",
              }}
            >
              {day.label}
            </div>
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#000000",
                marginBottom: "3px",
                lineHeight: 1.3,
              }}
            >
              {day.day}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#444444",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              {day.date}
            </div>
            {day.meals.map((meal, j) => (
              <div
                key={j}
                style={{
                  fontSize: "12px",
                  color: "#111111",
                  fontWeight: 700,
                  lineHeight: 1.55,
                  borderTop: j > 0 ? `1px solid ${C.border}` : "none",
                  paddingTop: j > 0 ? "5px" : "0",
                  marginTop: j > 0 ? "5px" : "0",
                }}
              >
                {meal}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Tagline ───────────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          marginTop: "10px",
          fontSize: "10.5px",
          fontStyle: "italic",
          color: "#666666",
          letterSpacing: "0.06em",
        }}
      >
        Good Food · Good Mood · Great Memories
      </div>
    </A4Page>
  );
}
