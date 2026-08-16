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
} from "../booklet/constants";
import { REPORT_META } from "./content-data";

const T = COVER_TYPOGRAPHY;
const S = COVER_SPACING;

/** Solid panels that match on-screen rgba overlays — html2canvas renders 8-digit hex + backdrop-filter as black. */
const PDF_THEME_PANEL_BG = "#2a3348";
const PDF_DETAILS_PANEL_BG = "#1a2744";

export function ConferenceReportCoverPage() {
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={REPORT_META.coverPhoto}
        alt="LSUIC Jinan 2026 delegate group photograph"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 35%",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: [
            `linear-gradient(to bottom,`,
            `  rgba(0,18,56,0.94) 0%,`,
            `  rgba(0,28,80,0.82) 20%,`,
            `  rgba(0,28,80,0.45) 48%,`,
            `  rgba(0,0,0,0.55) 72%,`,
            `  rgba(0,0,0,0.92) 100%`,
            `)`,
          ].join(" "),
          zIndex: 1,
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
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

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "222px",
            height: "168px",
            background: C.blue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "28px 52px 0",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: C.white,
              padding: "7px",
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
              style={{ width: "82px", height: "82px", objectFit: "contain" }}
            />
          </div>

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
                height: "24px",
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
                height: "24px",
                background: `${C.white}25`,
              }}
            />
          </div>

          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: C.white,
              padding: "7px",
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
              style={{ width: "82px", height: "82px", objectFit: "contain" }}
            />
          </div>
        </div>

        <div
          style={{
            fontSize: `${T.orgName.fontSize}px`,
            fontWeight: T.orgName.fontWeight,
            letterSpacing: T.orgName.letterSpacing,
            textTransform: "uppercase",
            color: C.gold,
            marginBottom: `${S.orgNameMarginBottom}px`,
          }}
        >
          Liberian Student Union in China
        </div>

        <div
          style={{
            width: "100px",
            height: "1.5px",
            background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
            marginBottom: `${S.goldDividerMarginBottom}px`,
          }}
        />

        <div
          style={{
            fontSize: `${T.title.fontSize}px`,
            fontWeight: T.title.fontWeight,
            color: C.white,
            lineHeight: T.title.lineHeight,
            maxWidth: "540px",
            marginBottom: "10px",
            textShadow: "0 2px 24px rgba(0,0,0,0.7)",
            letterSpacing: T.title.letterSpacing,
          }}
        >
          {REPORT_META.title}
        </div>

        <div
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: `${C.white}EE`,
            lineHeight: 1.35,
            maxWidth: "520px",
            marginBottom: `${S.titleMarginBottom}px`,
            textShadow: "0 2px 16px rgba(0,0,0,0.65)",
          }}
        >
          {REPORT_META.bookletTitle}
        </div>

        <div
          data-pdf-background={PDF_THEME_PANEL_BG}
          data-pdf-border="1.5px solid #8a7340"
          style={{
            padding: `${S.themePaddingY}px ${S.themePaddingX}px`,
            borderRadius: "8px",
            background: `${C.gold}20`,
            border: `1.5px solid ${C.gold}50`,
            maxWidth: "500px",
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
            }}
          >
            &ldquo;{REPORT_META.theme}&rdquo;
            <br />
            <span
              style={{
                fontSize: "15px",
                fontStyle: "normal",
                color: C.gold,
              }}
            >
              {REPORT_META.subTheme}
            </span>
          </div>
        </div>

        <div
          data-pdf-background={PDF_DETAILS_PANEL_BG}
          data-pdf-border="1px solid #4a5568"
          style={{
            padding: `${S.detailsCardPaddingY}px ${S.detailsCardPaddingX}px`,
            borderRadius: "14px",
            border: `1px solid ${C.white}28`,
            background: `${C.white}10`,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              fontSize: `${T.date.fontSize}px`,
              fontWeight: T.date.fontWeight,
              color: C.white,
              marginBottom: `${S.dateMarginBottom}px`,
              letterSpacing: T.date.letterSpacing,
            }}
          >
            {REPORT_META.dates}
          </div>
          <div
            style={{
              fontSize: `${T.venue.fontSize}px`,
              color: `${C.white}90`,
              letterSpacing: T.venue.letterSpacing,
            }}
          >
            {REPORT_META.venueEn}
          </div>
          <div
            style={{
              fontSize: `${T.location.fontSize}px`,
              color: `${C.white}70`,
              marginTop: `${S.locationMarginTop}px`,
            }}
          >
            {REPORT_META.city}, People&apos;s Republic of China
          </div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2 }}>
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

        <div
          style={{
            textAlign: "center",
            padding: "8px 16px",
            background: "rgba(0,10,32,0.92)",
            fontSize: "10px",
            color: `${C.white}55`,
            letterSpacing: "0.04em",
            lineHeight: 1.4,
          }}
        >
          {REPORT_META.coverPhotoCredit}
        </div>
      </div>
    </div>
  );
}
