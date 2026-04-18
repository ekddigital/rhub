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

// ─── Single full-page portrait for one dignitary ──────────────────────────────
function LeaderPortraitPage({
  leader,
  sectionLabel,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  leader: LeaderProfile;
  sectionLabel: string;
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  // Map country to flag emoji for quick recognition
  const flagEmoji = leader.country?.toLowerCase().includes("liberia")
    ? "🇱🇷"
    : leader.country?.toLowerCase().includes("china")
      ? "🇨🇳"
      : null;

  return (
    <A4Page
      pageNum={pageNum}
      totalPages={totalPages}
      sectionLabel={sectionLabel}
      confName={confName}
      confYear={confYear}
    >
      {/* Full-page dignitary portrait layout — mirrors 18th Annual reference */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "820px", // fill most of the A4 content area
          position: "relative",
          padding: "0 48px",
        }}
      >
        {/* ── Geometric cross decoration (top area, like reference) ── */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            height: "360px",
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {/* Diagonal line 1 — top-left to bottom-right */}
          <div
            style={{
              position: "absolute",
              top: "-120px",
              left: "-80px",
              width: "130%",
              height: "2px",
              background: `linear-gradient(90deg, transparent 0%, ${C.blue}18 30%, ${C.blue}18 70%, transparent 100%)`,
              transform: "rotate(30deg)",
              transformOrigin: "center",
            }}
          />
          {/* Diagonal line 2 — top-right to bottom-left */}
          <div
            style={{
              position: "absolute",
              top: "-120px",
              right: "-80px",
              width: "130%",
              height: "2px",
              background: `linear-gradient(90deg, transparent 0%, ${C.blue}18 30%, ${C.blue}18 70%, transparent 100%)`,
              transform: "rotate(-30deg)",
              transformOrigin: "center",
            }}
          />
          {/* Extra line pair for depth */}
          <div
            style={{
              position: "absolute",
              top: "-40px",
              left: "-80px",
              width: "130%",
              height: "1px",
              background: `linear-gradient(90deg, transparent 0%, ${C.blue}0A 30%, ${C.blue}0A 70%, transparent 100%)`,
              transform: "rotate(30deg)",
              transformOrigin: "center",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "-40px",
              right: "-80px",
              width: "130%",
              height: "1px",
              background: `linear-gradient(90deg, transparent 0%, ${C.blue}0A 30%, ${C.blue}0A 70%, transparent 100%)`,
              transform: "rotate(-30deg)",
              transformOrigin: "center",
            }}
          />
        </div>

        {/* ── Portrait photo ── */}
        <div
          style={{
            position: "relative",
            marginBottom: "36px",
            zIndex: 1,
          }}
        >
          {resolvePhoto(leader) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvePhoto(leader)!}
              alt={leader.name}
              style={{
                width: "310px",
                height: "380px",
                objectFit: "cover",
                objectPosition: "center top",
                borderRadius: "4px",
                boxShadow:
                  "0 8px 40px rgba(0,40,104,0.22), 0 2px 12px rgba(0,0,0,0.18)",
              }}
            />
          ) : (
            <div
              style={{
                width: "310px",
                height: "380px",
                borderRadius: "4px",
                background: `linear-gradient(145deg, ${C.blue}22, ${C.blue}08)`,
                border: `2px dashed ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "48px", opacity: 0.3 }}>
                {flagEmoji ?? "👤"}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: C.muted,
                  fontStyle: "italic",
                }}
              >
                Photo to be added
              </div>
            </div>
          )}
        </div>

        {/* ── Name & title block ── */}
        <div
          style={{
            textAlign: "center",
            zIndex: 1,
          }}
        >
          {/* Honorific / role label */}
          {leader.role && (
            <div
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: C.blue,
                letterSpacing: "0.02em",
                marginBottom: "6px",
                textTransform: "uppercase",
              }}
            >
              {leader.role}
            </div>
          )}

          {/* Full name — large, bold, dark navy */}
          <div
            style={{
              fontSize: "26px",
              fontWeight: 900,
              color: C.darkBlue,
              lineHeight: 1.15,
              marginBottom: "10px",
              letterSpacing: "-0.01em",
            }}
          >
            {leader.name}
          </div>

          {/* Thin gold divider */}
          <div
            style={{
              width: "72px",
              height: "2px",
              background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
              margin: "0 auto 12px",
            }}
          />

          {/* Title (official position) */}
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: C.blue,
              lineHeight: 1.4,
              maxWidth: "460px",
              marginBottom: flagEmoji ? "12px" : "0",
            }}
          >
            {leader.title}
          </div>

          {/* Country flag + name */}
          {(flagEmoji ?? leader.country) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
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

          {/* Bio (if provided) — shown below, with subtle top border */}
          {leader.bio && (
            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: `1px solid ${C.border}`,
                maxWidth: "480px",
                fontSize: "10.5px",
                lineHeight: 1.75,
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
          sectionLabel={section.title}
          confName={confName}
          confYear={confYear}
          pageNum={startPageNum + idx}
          totalPages={totalPages}
        />
      ))}
    </>
  );
}
