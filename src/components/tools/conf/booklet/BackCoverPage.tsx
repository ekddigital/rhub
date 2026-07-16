import {
  BOOKLET_A4,
  C,
  ASSETS,
  FLAG_STRIPES_7,
  FLAG_STRIPES_11,
} from "./constants";
import { fmtRange } from "./utils";
import type { BookletData } from "./types";

export function BackCoverPage({
  event,
  totalPages,
}: {
  event: BookletData["event"];
  totalPages: number;
}) {
  return (
    <div
      className="booklet-page"
      style={{
        width: `${BOOKLET_A4.width}px`,
        height: `${BOOKLET_A4.height}px`,
        minHeight: `${BOOKLET_A4.height}px`,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top flag stripes */}
      <div style={{ display: "flex", height: "20px" }}>
        {FLAG_STRIPES_7.map((color, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: color,
              borderBottom: color === C.white ? "0.5px solid #e0e0e0" : "none",
            }}
          />
        ))}
      </div>

      {/* Blue canton top-left */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "130px",
          height: "86px",
          background: C.blue,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: "32px", color: C.white, lineHeight: 1 }}>★</div>
      </div>

      {/* Hotel / venue photo strip */}
      <div
        style={{
          position: "relative",
          height: "200px",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.hotelEntrance}
          alt="Conference Venue"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 30%",
          }}
        />
        {/* Gradient fade at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "80px",
            background: `linear-gradient(transparent, ${C.white})`,
          }}
        />
        {/* Venue label */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "20px",
            fontSize: "8px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: C.muted,
          }}
        >
          {event.venue} · {event.city}
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 60px",
          textAlign: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.lsuicLogo}
          alt="LSUIC"
          style={{
            width: "104px",
            height: "104px",
            objectFit: "contain",
            marginBottom: "18px",
          }}
        />

        <div
          style={{
            fontSize: "13px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#000000",
            marginBottom: "5px",
          }}
        >
          Liberian Student Union in China
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#111111",
            fontStyle: "italic",
            marginBottom: "24px",
          }}
        >
          Excellence Through Hard Work
        </div>

        {/* Divider with star */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
            width: "300px",
          }}
        >
          <div style={{ flex: 1, height: "1.5px", background: C.red }} />
          <div style={{ fontSize: "16px", color: C.blue }}>★</div>
          <div style={{ flex: 1, height: "1.5px", background: C.blue }} />
        </div>

        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#000000",
            marginBottom: "7px",
          }}
        >
          {event.name}
        </div>
        <div style={{ fontSize: "12px", color: "#111111", marginBottom: "3px" }}>
          {event.venue} · {event.city}, China
        </div>
        <div style={{ fontSize: "12px", color: "#111111", marginBottom: "28px" }}>
          {fmtRange(event.startsAt, event.endsAt)}
        </div>

        {/* Thank-you card */}
        <div
          style={{
            padding: "20px 28px",
            borderRadius: "14px",
            border: `1px solid ${C.blue}20`,
            background: C.lightBlue,
            maxWidth: "440px",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#000000",
              marginBottom: "8px",
            }}
          >
            Thank You for Attending
          </div>
          <div style={{ fontSize: "12px", lineHeight: 1.8, color: "#111111" }}>
            Your participation makes LSUIC stronger. Together we advance
            education, unity, and development for Liberian students across
            China.
          </div>
        </div>

        <div
          style={{
            marginTop: "24px",
            fontSize: "26px",
            letterSpacing: "0.3em",
          }}
        >
          🇱🇷 🤝 🇨🇳
        </div>
      </div>

      {/* Footer bar */}
      <div>
        <div
          style={{
            height: "1px",
            margin: "0 40px",
            background: `linear-gradient(90deg, ${C.blue}, ${C.red})`,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 40px",
            fontSize: "8px",
            color: C.muted,
          }}
        >
          <span>LSUIC © {event.year}</span>
          <span style={{ color: C.blue, fontWeight: 600 }}>
            Page {totalPages} of {totalPages}
          </span>
          <span>Established July 2006</span>
        </div>
      </div>

      {/* Bottom flag stripes */}
      <div style={{ display: "flex", height: "16px" }}>
        {FLAG_STRIPES_11.map((color, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: color,
              borderTop: color === C.white ? "0.5px solid #e0e0e0" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
