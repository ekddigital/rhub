import { Fragment, useState } from "react";
import { ASSETS, C } from "./constants";
import { resolveLeadersForBookletSection } from "@/lib/conf/resolve-booklet-leader";
import {
  leaderBioWarrantsMessagePage,
  leaderProfileToSpeaker,
} from "@/lib/conf/resolve-booklet-section-content";
import { AddressSection } from "./AddressSection";
import { A4Page } from "./A4Page";
import type { BookletSection, LeaderProfile } from "./types";

// Country → known static dignitary photo (fallback when photoPath is null in DB)
const COUNTRY_PHOTO_MAP: Record<string, string> = {
  liberia: ASSETS.presidentBoakai,
  china: ASSETS.presidentXi,
};

function resolvePhoto(leader: LeaderProfile): string | null {
  if (leader.photoPath) return leader.photoPath;
  const title = (leader.title ?? "").toLowerCase();
  const role = (leader.role ?? "").toLowerCase();
  if (title.includes("ambassador") || role.includes("ambassador")) {
    return ASSETS.ambassadorThomas;
  }
  const country = leader.country?.toLowerCase() ?? "";
  for (const [key, path] of Object.entries(COUNTRY_PHOTO_MAP)) {
    if (country.includes(key)) return path;
  }
  return null;
}

function leaderMessageTitle(leader: LeaderProfile): string {
  const title = (leader.title ?? "").toLowerCase();
  const role = (leader.role ?? "").toLowerCase();
  if (title.includes("ambassador") || role.includes("ambassador")) {
    return "Ambassador's Message";
  }
  if (title.includes("president")) {
    return "Presidential Message";
  }
  return `${leader.name} — Message`;
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          margin: "-28px -40px 0",
          padding: "0",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
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
                width: "480px",
                height: "580px",
                objectFit: "cover",
                objectPosition: "center top",
                display: "block",
              }}
            />
          ) : (
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
              <div style={{ fontSize: "72px", zIndex: 1 }}>
                {flagEmoji ?? "🏛️"}
              </div>
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

        <div
          style={{
            textAlign: "center",
            zIndex: 1,
            padding: "0 40px",
            paddingBottom: "24px",
          }}
        >
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

          {leader.title && (
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: C.text,
                lineHeight: 1.45,
                maxWidth: "460px",
                margin: "0 auto",
              }}
            >
              {leader.title}
            </div>
          )}

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
        </div>
      </div>
    </A4Page>
  );
}

export function LeaderSection({
  section,
  leaders,
  conferenceId,
  confName,
  confYear,
  startPageNum,
  totalPages,
}: {
  section: BookletSection;
  leaders: LeaderProfile[];
  conferenceId: string;
  confName: string;
  confYear: number;
  startPageNum: number;
  totalPages: number;
}) {
  const rosterLeaders = resolveLeadersForBookletSection(
    section.title,
    leaders,
    conferenceId,
  );

  if (rosterLeaders.length === 0) return null;

  let pageCursor = startPageNum;

  return (
    <>
      {rosterLeaders.map((leader) => {
        const portraitPage = pageCursor++;
        const hasMessage = leaderBioWarrantsMessagePage(leader.bio);
        const messagePage = hasMessage ? pageCursor++ : null;

        return (
          <Fragment key={leader.id}>
            <LeaderPortraitPage
              leader={leader}
              confName={confName}
              confYear={confYear}
              pageNum={portraitPage}
              totalPages={totalPages}
            />
            {hasMessage && messagePage != null && leader.bio ? (
              <AddressSection
                section={section}
                sectionLabel={leaderMessageTitle(leader)}
                speaker={leaderProfileToSpeaker(leader)}
                content={leader.bio}
                pageNum={messagePage}
                totalPages={totalPages}
                confName={confName}
                confYear={confYear}
              />
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
}
