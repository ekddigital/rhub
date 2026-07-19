import {
  COVER_SPACING,
  COVER_TYPOGRAPHY,
} from "@/lib/conf/booklet-cover-typography";
import {
  BOOKLET_A4,
  C,
  ASSETS,
  FLAG_STRIPES_11,
  FLAG_STRIPES_7,
} from "./constants";
import { fmtRange } from "./utils";
import type { BookletData } from "./types";

const T = COVER_TYPOGRAPHY;
const S = COVER_SPACING;

function renderCoverTitle(bookletTitle: string) {
  const normalized = bookletTitle.trim().toLowerCase();
  if (
    normalized ===
    "20th annaual conference & 179th independence day celebration of liberia"
  ) {
    return (
      <>
        20th Annaual Conference
        <br />
        &amp;
        <br />
        179th Independence Day Celebration of Liberia
      </>
    );
  }

  return bookletTitle;
}

export function CoverPage({
  event,
  bookletTitle,
  bookletSubtitle,
  theme,
  subTheme,
}: {
  event: BookletData["event"];
  bookletTitle: string;
  bookletSubtitle: string | null;
  theme: string | null;
  subTheme?: string | null;
}) {
  return (
    <div
      className="booklet-page"
      style={{
        width: `${BOOKLET_A4.width}px`,
        height: `${BOOKLET_A4.height}px`,
        minHeight: `${BOOKLET_A4.height}px`,
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
              fontSize: `${T.flagStar}px`,
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
            <div
              style={{ fontSize: `${T.logoDivider}px`, color: `${C.white}40` }}
            >
              ×
            </div>
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
            fontSize: `${T.orgName.fontSize}px`,
            fontWeight: T.orgName.fontWeight,
            letterSpacing: T.orgName.letterSpacing,
            textTransform: "uppercase",
            color: C.gold,
            marginBottom: `${S.orgNameMarginBottom}px`,
            textShadow: "0 1px 12px rgba(0,0,0,0.55)",
          }}
        >
          Liberian Student Union in China (LSUIC)
        </div>

        {/* Gold thin divider */}
        <div
          style={{
            width: "100px",
            height: "1.5px",
            background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
            marginBottom: `${S.goldDividerMarginBottom}px`,
          }}
        />

        {/* Conference / booklet title */}
        <div
          style={{
            fontSize: `${T.title.fontSize}px`,
            fontWeight: T.title.fontWeight,
            color: C.white,
            lineHeight: T.title.lineHeight,
            maxWidth: "540px",
            marginBottom: `${S.titleMarginBottom}px`,
            textShadow: "0 2px 24px rgba(0,0,0,0.7)",
            letterSpacing: T.title.letterSpacing,
          }}
        >
          {renderCoverTitle(bookletTitle)}
        </div>

        {bookletSubtitle && (
          <div
            style={{
              fontSize: `${T.subtitle.fontSize}px`,
              fontWeight: T.subtitle.fontWeight,
              color: C.gold,
              marginBottom: `${S.subtitleMarginBottom}px`,
              letterSpacing: T.subtitle.letterSpacing,
              textShadow: "0 1px 10px rgba(0,0,0,0.5)",
            }}
          >
            {bookletSubtitle}
          </div>
        )}

        {theme && (
          <div
            style={{
              padding: `${S.themePaddingY}px ${S.themePaddingX}px`,
              borderRadius: "8px",
              background: `${C.gold}20`,
              border: `1.5px solid ${C.gold}50`,
              maxWidth: "500px",
              marginTop: "14px",
              marginBottom: `${S.themeMarginBottom}px`,
            }}
          >
            <div
              style={{
                fontSize: `${T.themeLabel.fontSize}px`,
                fontWeight: T.themeLabel.fontWeight,
                letterSpacing: T.themeLabel.letterSpacing,
                textTransform: "uppercase",
                color: C.gold,
                marginBottom: "7px",
              }}
            >
              Conference Theme
            </div>
            <div
              style={{
                fontSize: `${T.themeText.fontSize}px`,
                fontStyle: "italic",
                fontWeight: T.themeText.fontWeight,
                color: C.white,
                lineHeight: T.themeText.lineHeight,
                textShadow: "0 1px 8px rgba(0,0,0,0.45)",
              }}
            >
              &ldquo;{theme}&rdquo;
              {subTheme ? (
                <>
                  <br />
                  <span
                    style={{
                      fontSize: "16px",
                      fontStyle: "normal",
                      color: C.gold,
                      fontWeight: 700,
                    }}
                  >
                    {subTheme}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* Red rule */}
        <div
          style={{
            width: "100px",
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`,
            marginBottom: `${S.redRuleMarginBottom}px`,
          }}
        />

        {/* Date + Venue frosted card */}
        <div
          style={{
            padding: `${S.detailsCardPaddingY}px ${S.detailsCardPaddingX}px`,
            borderRadius: "14px",
            border: `1px solid ${C.white}28`,
            background: `${C.white}10`,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            marginBottom: `${S.detailsCardMarginBottom}px`,
          }}
        >
          <div
            style={{
              fontSize: `${T.date.fontSize}px`,
              fontWeight: T.date.fontWeight,
              color: C.white,
              marginBottom: `${S.dateMarginBottom}px`,
              letterSpacing: T.date.letterSpacing,
              textShadow: "0 1px 10px rgba(0,0,0,0.55)",
            }}
          >
            {fmtRange(event.startsAt, event.endsAt)}
          </div>
          <div
            style={{
              fontSize: `${T.venue.fontSize}px`,
              fontWeight: T.venue.fontWeight,
              color: C.white,
              letterSpacing: T.venue.letterSpacing,
              textShadow: "0 1px 8px rgba(0,0,0,0.45)",
            }}
            lang="zh-Hans"
          >
            {event.venue}
          </div>
          <div
            style={{
              fontSize: `${T.location.fontSize}px`,
              color: `${C.white}90`,
              marginTop: `${S.locationMarginTop}px`,
              textShadow: "0 1px 6px rgba(0,0,0,0.4)",
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
            gap: "12px",
            fontSize: `${T.tagline.fontSize}px`,
            color: `${C.white}70`,
            letterSpacing: T.tagline.letterSpacing,
          }}
        >
          <span>🇱🇷</span>
          <span
            style={{ height: "1px", width: "52px", background: `${C.gold}80` }}
          />
          <span
            style={{
              textTransform: "uppercase",
              fontSize: `${T.taglineMeta.fontSize}px`,
              fontWeight: T.taglineMeta.fontWeight,
              color: C.gold,
              letterSpacing: T.taglineMeta.letterSpacing,
              textShadow: "0 1px 8px rgba(0,0,0,0.55)",
            }}
          >
            {theme ?? "Jinan 2026: Legacy and Influence"}
            {subTheme ? (
              <>
                <br />
                <span
                  style={{
                    fontSize: `${Math.max(T.taglineMeta.fontSize - 1, 9)}px`,
                    letterSpacing: "0.08em",
                    color: `${C.white}CC`,
                    textTransform: "none",
                  }}
                >
                  {subTheme}
                </span>
              </>
            ) : null}
          </span>
          <span
            style={{ height: "1px", width: "52px", background: `${C.gold}80` }}
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
            fontSize: `${T.footer.fontSize}px`,
            fontWeight: T.footer.fontWeight,
            color: `${C.white}70`,
            letterSpacing: T.footer.letterSpacing,
            textTransform: "uppercase",
          }}
        >
          20th Annual Conference & 179th Independence Day Celebration of Liberia
          · Page 1
        </div>
      </div>
    </div>
  );
}
