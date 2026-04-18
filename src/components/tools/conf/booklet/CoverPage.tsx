import { C, ASSETS, FLAG_STRIPES_11, FLAG_STRIPES_7 } from "./constants";
import { fmtRange } from "./utils";
import type { BookletData } from "./types";

export function CoverPage({
  event,
  bookletTitle,
  bookletSubtitle,
  theme,
}: {
  event: BookletData["event"];
  bookletTitle: string;
  bookletSubtitle: string | null;
  theme: string | null;
}) {
  return (
    <div
      className="booklet-page"
      style={{
        width: "680px",
        minHeight: "962px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        background: C.darkBlue,
      }}
    >
      {/* ── Full-bleed city photo background ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.cityEvening}
        alt="Jinan City"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          zIndex: 0,
        }}
      />

      {/* ── Multi-layer dark gradient overlay ── */}
      {/* Top: strong dark blue for flag / logo area */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: [
            `linear-gradient(to bottom,`,
            `  rgba(0,18,56,0.92) 0%,`,
            `  rgba(0,28,80,0.78) 22%,`,
            `  rgba(0,28,80,0.55) 45%,`,
            `  rgba(0,0,0,0.60) 72%,`,
            `  rgba(0,0,0,0.88) 100%`,
            `)`,
          ].join(" "),
          zIndex: 1,
        }}
      />

      {/* ── Liberian flag design — top ── */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {/* 11 red/white stripes */}
        <div style={{ display: "flex", height: "28px" }}>
          {FLAG_STRIPES_11.map((color, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: color,
                opacity: color === C.white ? 0.85 : 1,
              }}
            />
          ))}
        </div>

        {/* Blue canton with white ★ — overlays top-left of stripes */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "222px",
            height: "168px", // 11 stripes × ~15px equivalent
            background: C.blue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div
            style={{
              fontSize: "52px",
              color: C.white,
              lineHeight: 1,
              textShadow: `0 0 24px ${C.white}60`,
            }}
          >
            ★
          </div>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "32px 52px 0",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Logos row: LSUIC seal + Liberia national seal */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "28px",
          }}
        >
          {/* LSUIC emblem */}
          <div
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              background: C.white,
              padding: "8px",
              boxShadow: `0 0 0 4px ${C.gold}60, 0 0 0 8px ${C.white}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ASSETS.lsuicLogo}
              alt="LSUIC"
              style={{ width: "90px", height: "90px", objectFit: "contain" }}
            />
          </div>

          {/* Divider bar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <div
              style={{
                width: "1.5px",
                height: "28px",
                background: `${C.white}25`,
              }}
            />
            <div style={{ fontSize: "18px", color: `${C.white}40` }}>×</div>
            <div
              style={{
                width: "1.5px",
                height: "28px",
                background: `${C.white}25`,
              }}
            />
          </div>

          {/* Liberia national seal */}
          <div
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              background: C.white,
              padding: "8px",
              boxShadow: `0 0 0 4px ${C.red}60, 0 0 0 8px ${C.white}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ASSETS.liberiaSeal}
              alt="Liberia Seal"
              style={{ width: "90px", height: "90px", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Org name */}
        <div
          style={{
            fontSize: "12.5px",
            fontWeight: 800,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: C.gold,
            marginBottom: "12px",
          }}
        >
          Liberian Student Union in China
        </div>

        {/* Gold thin divider */}
        <div
          style={{
            width: "100px",
            height: "1.5px",
            background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
            marginBottom: "20px",
          }}
        />

        {/* Conference / booklet title */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: 900,
            color: C.white,
            lineHeight: 1.12,
            maxWidth: "540px",
            marginBottom: "16px",
            textShadow: "0 2px 24px rgba(0,0,0,0.7)",
            letterSpacing: "-0.01em",
          }}
        >
          {bookletTitle}
        </div>

        {bookletSubtitle && (
          <div
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: C.gold,
              marginBottom: "14px",
              letterSpacing: "0.04em",
            }}
          >
            {bookletSubtitle}
          </div>
        )}

        {theme && (
          <div
            style={{
              padding: "14px 28px",
              borderRadius: "8px",
              background: `${C.gold}20`,
              border: `1.5px solid ${C.gold}50`,
              maxWidth: "500px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                fontSize: "9.5px",
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: C.gold,
                marginBottom: "7px",
              }}
            >
              Conference Theme
            </div>
            <div
              style={{
                fontSize: "14.5px",
                fontStyle: "italic",
                fontWeight: 600,
                color: C.white,
                lineHeight: 1.55,
              }}
            >
              &ldquo;{theme}&rdquo;
            </div>
          </div>
        )}

        {/* Red rule */}
        <div
          style={{
            width: "100px",
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`,
            marginBottom: "24px",
          }}
        />

        {/* Date + Venue frosted card */}
        <div
          style={{
            padding: "20px 44px",
            borderRadius: "14px",
            border: `1px solid ${C.white}28`,
            background: `${C.white}10`,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: C.white,
              marginBottom: "10px",
              letterSpacing: "0.02em",
            }}
          >
            {fmtRange(event.startsAt, event.endsAt)}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: `${C.white}90`,
              letterSpacing: "0.06em",
            }}
          >
            {event.venue}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: `${C.white}70`,
              marginTop: "4px",
            }}
          >
            {event.city}, People&apos;s Republic of China
          </div>
        </div>

        {/* Liberia × China tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "10px",
            color: `${C.white}40`,
            letterSpacing: "0.08em",
          }}
        >
          <span>🇱🇷</span>
          <span
            style={{ height: "1px", width: "44px", background: `${C.white}18` }}
          />
          <span style={{ textTransform: "uppercase", fontSize: "9px" }}>
            Est. July 2006
          </span>
          <span
            style={{ height: "1px", width: "44px", background: `${C.white}18` }}
          />
          <span>🇨🇳</span>
        </div>
      </div>

      {/* ── Bottom Liberian flag stripes + footer ── */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {/* 7 stripes at bottom */}
        <div style={{ display: "flex", height: "20px" }}>
          {FLAG_STRIPES_7.map((color, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: color,
                opacity: color === C.white ? 0.85 : 1,
              }}
            />
          ))}
        </div>

        {/* Dark footer bar */}
        <div
          style={{
            textAlign: "center",
            padding: "8px",
            background: "rgba(0,10,32,0.92)",
            fontSize: "8px",
            color: `${C.white}40`,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Official Conference Booklet · Page 1
        </div>
      </div>
    </div>
  );
}
