import { useState } from "react";
import { ASSETS, C } from "./constants";
import { A4Page } from "./A4Page";
import type { BookletSection, LeaderProfile } from "./types";

// Country → known static dignitary photo (fallback when photoPath is null in DB)
const COUNTRY_PHOTO_MAP: Record<string, string> = {
  liberia: ASSETS.presidentBoakai,
  china: ASSETS.presidentXi,
};

function resolvePhoto(leader: LeaderProfile): string | null {
  if (leader.photoPath) return leader.photoPath;
  const country = leader.country?.toLowerCase() ?? "";
  for (const [key, path] of Object.entries(COUNTRY_PHOTO_MAP)) {
    if (country.includes(key)) return path;
  }
  return null;
}

// ─── Single full-page portrait ─────────────────────────────────────────────
// Design mirrors the LSUIC 18th Annual General Conference Booklet (pages 2–4):
//   • White page
//   • Light-blue diagonal X-line decorations in corners / centre
//   • Large photo — clean rectangle, no border-radius, no shadow
//   • "HIS EXCELLENCY" (role) → bold name → bold title — all centred below
function LeaderPortraitPage({
  leader,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  leader: LeaderProfile;
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const flagEmoji = leader.country?.toLowerCase().includes("liberia")
    ? "🇱🇷"
    : leader.country?.toLowerCase().includes("china")
      ? "🇨🇳"
      : null;

  const photo = resolvePhoto(leader);
  const showPhoto = !!photo && !imgFailed;

  return (
    <A4Page
      pageNum={pageNum}
      totalPages={totalPages}
      sectionLabel={leader.title}
      confName={confName}
      confYear={confYear}
    >
      {/* ── Layout wrapper ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          /* cancel the A4Page content-area padding so the photo can be wider */
          margin: "-28px -40px 0",
          padding: "0",
        }}
      >
        {/* ── Geometric X-line background — same light-blue cross as reference ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {/* Upper X pair */}
          {[
            { top: "-60px", left: "-60px", rotate: "32deg" },
            { top: "-60px", right: "-60px", rotate: "-32deg" },
            { top: "160px", left: "-60px", rotate: "32deg" },
            { top: "160px", right: "-60px", rotate: "-32deg" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: s.top,
                left: s.left ?? undefined,
                right: s.right ?? undefined,
                width: "480px",
                height: "1.5px",
                background: `linear-gradient(90deg, transparent 0%, ${C.blue}22 40%, ${C.blue}22 60%, transparent 100%)`,
                transform: `rotate(${s.rotate})`,
                transformOrigin: "center",
              }}
            />
          ))}
        </div>

        {/* ── Photo / Placeholder ────────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: "32px",
            marginBottom: "28px",
          }}
        >
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={leader.name}
              onError={() => setImgFailed(true)}
              style={{
                /* Matches the reference proportions: fills most of the content
                   width, clean rectangle, no round corners, no shadow */
                width: "480px",
                height: "580px",
                objectFit: "cover",
                objectPosition: "center top",
                display: "block",
              }}
            />
          ) : (
            /* ── Designed placeholder — professional "photo pending" box ── */
            <div
              style={{
                width: "480px",
                height: "580px",
                background: `linear-gradient(160deg, ${C.lightBlue} 0%, #C8D5EC 100%)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Faint LSUIC logo watermark */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ASSETS.lsuicLogo}
                alt=""
                style={{
                  position: "absolute",
                  width: "220px",
                  height: "220px",
                  objectFit: "contain",
                  opacity: 0.06,
                }}
              />
              {/* Flag emoji — large, centred */}
              <div style={{ fontSize: "72px", zIndex: 1 }}>
                {flagEmoji ?? "🏛️"}
              </div>
              {/* "PHOTO PENDING" label */}
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: C.blue,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  zIndex: 1,
                  opacity: 0.6,
                }}
              >
                Photo Pending
              </div>
            </div>
          )}
        </div>

        {/* ── Name / title block — matches reference layout exactly ──────────── */}
        <div
          style={{
            textAlign: "center",
            zIndex: 1,
            padding: "0 40px",
            paddingBottom: "24px",
          }}
        >
          {/* Honorific / role — e.g. "HIS EXCELLENCY" */}
          {leader.role && (
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: C.darkBlue,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              {leader.role}
            </div>
          )}

          {/* Full name — large bold */}
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: C.darkBlue,
              lineHeight: 1.1,
              marginBottom: "10px",
              letterSpacing: "-0.01em",
            }}
          >
            {leader.name}
          </div>

          {/* Official title — bold small-caps */}
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: C.darkBlue,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              lineHeight: 1.45,
              maxWidth: "440px",
              margin: "0 auto",
            }}
          >
            {leader.title}
          </div>

          {/* Country + flag */}
          {(flagEmoji ?? leader.country) && (
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                fontSize: "12px",
                color: C.muted,
              }}
            >
              {flagEmoji && <span>{flagEmoji}</span>}
              {leader.country && (
                <span style={{ fontWeight: 500 }}>{leader.country}</span>
              )}
            </div>
          )}

          {/* Bio — shown when provided */}
          {leader.bio && (
            <div
              style={{
                marginTop: "18px",
                paddingTop: "14px",
                borderTop: `1px solid ${C.border}`,
                maxWidth: "460px",
                fontSize: "10.5px",
                lineHeight: 1.8,
                color: C.text,
                textAlign: "left",
              }}
            >
              {leader.bio}
            </div>
          )}
        </div>
      </div>
    </A4Page>
  );
}

export function LeaderSection({
  section,
  leaders,
  confName,
  confYear,
  startPageNum,
  totalPages,
}: {
  section: BookletSection;
  leaders: LeaderProfile[];
  confName: string;
  confYear: number;
  /** Page number of the FIRST leader page. Subsequent leaders increment from here. */
  startPageNum: number;
  totalPages: number;
}) {
  if (leaders.length === 0) {
    // Empty state — single page placeholder
    return (
      <A4Page
        pageNum={startPageNum}
        totalPages={totalPages}
        sectionLabel={section.title}
        confName={confName}
        confYear={confYear}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "600px",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              border: `2px dashed ${C.border}`,
              borderRadius: "10px",
              color: C.muted,
              fontSize: "11px",
            }}
          >
            No leader profiles stored yet. Add them in the Leadership Profiles
            tab.
          </div>
        </div>
      </A4Page>
    );
  }

  // Each leader gets their own full page
  return (
    <>
      {leaders.map((l, idx) => (
        <LeaderPortraitPage
          key={l.id}
          leader={l}
          confName={confName}
          confYear={confYear}
          pageNum={startPageNum + idx}
          totalPages={totalPages}
        />
      ))}
    </>
  );
}
