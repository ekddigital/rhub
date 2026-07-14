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
import { HOTEL_ADDRESS_LABEL, NAV_GUIDE_META } from "./content-data";

const T = COVER_TYPOGRAPHY;
const S = COVER_SPACING;

export function NavigationCoverPage() {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "28px",
          }}
        >
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
            <div style={{ fontSize: `${T.logoDivider}px`, color: `${C.white}40` }}>
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
            marginBottom: `${S.titleMarginBottom}px`,
            textShadow: "0 2px 24px rgba(0,0,0,0.7)",
            letterSpacing: T.title.letterSpacing,
          }}
        >
          20th Annual Conference Navigation Guide
        </div>

        <div
          style={{
            fontSize: `${T.subtitle.fontSize}px`,
            fontWeight: T.subtitle.fontWeight,
            color: C.gold,
            marginBottom: `${S.subtitleMarginBottom}px`,
            letterSpacing: T.subtitle.letterSpacing,
          }}
        >
          Travel Directions to Conference Venue
        </div>

        <div
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
            &ldquo;{NAV_GUIDE_META.theme}&rdquo;
          </div>
        </div>

        <div
          style={{
            width: "100px",
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`,
            marginBottom: `${S.redRuleMarginBottom}px`,
          }}
        />

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
            }}
          >
            {NAV_GUIDE_META.dates}
          </div>
          <div
            style={{
              fontSize: `${T.venue.fontSize}px`,
              color: `${C.white}90`,
              letterSpacing: T.venue.letterSpacing,
            }}
          >
            {NAV_GUIDE_META.venueEn}
          </div>
          <div
            style={{
              fontSize: `${T.venue.fontSize - 2}px`,
              color: `${C.gold}`,
              marginTop: "3px",
              letterSpacing: "0.02em",
            }}
          >
            {NAV_GUIDE_META.venueZh}
          </div>
          <div
            style={{
              fontSize: `${T.location.fontSize}px`,
              color: `${C.white}75`,
              marginTop: "5px",
              lineHeight: 1.4,
            }}
          >
            {HOTEL_ADDRESS_LABEL}: {NAV_GUIDE_META.addressZh}
          </div>
          <div
            style={{
              fontSize: `${T.location.fontSize}px`,
              color: `${C.white}70`,
              marginTop: `${S.locationMarginTop}px`,
            }}
          >
            {NAV_GUIDE_META.city}, People&apos;s Republic of China
          </div>
        </div>

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
              fontSize: "14px",
              fontWeight: 800,
              color: C.gold,
              letterSpacing: "0.14em",
              textShadow: "0 1px 8px rgba(0,0,0,0.55)",
            }}
          >
            Section A: Transit · Section B: Taxi
          </span>
          <span
            style={{ height: "1px", width: "52px", background: `${C.gold}80` }}
          />
          <span>🇨🇳</span>
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
            padding: "8px",
            background: "rgba(0,10,32,0.92)",
            fontSize: `${T.footer.fontSize}px`,
            color: `${C.white}40`,
            letterSpacing: T.footer.letterSpacing,
            textTransform: "uppercase",
          }}
        >
          Official Navigation Guide · Page 1
        </div>
      </div>
    </div>
  );
}
