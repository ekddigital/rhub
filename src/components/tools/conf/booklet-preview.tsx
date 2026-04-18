"use client";

import { useState } from "react";
import { Download, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  BookletData,
  BookletSection,
  LeaderProfile,
  NecMember,
} from "./booklet-manager-shell";

// ─── LSUIC Brand Colors (Liberian Flag + EKD Gold) ───────────────────────────
const C = {
  blue: "#002868",      // Liberian flag blue (canton) — primary
  red: "#BF0A30",       // Liberian flag red (stripes) — accent
  white: "#FFFFFF",
  gold: "#C8A061",      // EKD brand gold — accent
  darkBlue: "#001A4E",  // Deeper navy for gradients
  lightBlue: "#E8EEF8", // Pale blue for page backgrounds
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#D1D9F0",
};

type Meeting = BookletData["meetings"][0];
type Delegate = BookletData["delegates"][0];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtTime(d: string | Date) {
  return new Date(d).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRange(start: string | Date, end: string | Date) {
  const s = new Date(start);
  const e = new Date(end);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${fmt(s)} – ${fmt(e)}`;
}

const ROLE_LABELS: Record<string, string> = {
  CHAIR: "General Chairman",
  VICE_CHAIR: "General Co-Chair",
  SECRETARY: "General Secretary",
  TREASURER: "Treasurer",
  COMMITTEE: "",
};

function roleLabel(m: NecMember) {
  const base = ROLE_LABELS[m.role];
  if (base !== undefined && base !== "") return base;
  return m.title ?? m.committeeScope ?? "Committee Member";
}

// ─── Avatar placeholder ───────────────────────────────────────────────────────
function Avatar({
  src,
  name,
  size = 48,
  square = false,
  borderColor = C.blue,
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  square?: boolean;
  borderColor?: string;
}) {
  const radius = square ? "6px" : "50%";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          flexShrink: 0,
          border: `2px solid ${borderColor}30`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${C.blue} 0%, ${C.darkBlue} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: Math.max(10, size * 0.32),
        fontWeight: 700,
        color: C.white,
        border: `2px solid ${borderColor}30`,
        letterSpacing: "0.04em",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Page Header (on every body page) ────────────────────────────────────────
function PageHeader({
  confName,
  sectionLabel,
  pageNum,
}: {
  confName: string;
  sectionLabel: string;
  pageNum: number;
}) {
  return (
    <div>
      {/* Liberian flag stripe bar */}
      <div style={{ display: "flex", height: "10px" }}>
        {[C.red, C.white, C.red, C.white, C.red, C.white, C.red, C.white, C.red].map((color, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: color,
              borderBottom: color === C.white ? `0.5px solid #e0e0e0` : "none",
            }}
          />
        ))}
      </div>

      {/* Header content row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 40px",
          background: C.white,
          borderBottom: `1.5px solid ${C.blue}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/conf/lsuic_logo.png"
            alt="LSUIC"
            style={{ width: 30, height: 30, objectFit: "contain" }}
          />
          <div>
            <div
              style={{
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.blue,
                lineHeight: 1.2,
              }}
            >
              Liberian Student Union in China
            </div>
            <div style={{ fontSize: "7.5px", color: C.muted, lineHeight: 1.3, marginTop: "1px" }}>
              {confName}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              fontSize: "8px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.red,
              textAlign: "right",
            }}
          >
            {sectionLabel}
          </div>
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: C.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
              fontWeight: 700,
              color: C.white,
            }}
          >
            {pageNum}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page Footer ─────────────────────────────────────────────────────────────
function PageFooter({
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  return (
    <div style={{ marginTop: "auto" }}>
      <div
        style={{
          height: "1px",
          margin: "0 40px",
          background: `linear-gradient(90deg, transparent, ${C.blue}40, ${C.red}40, transparent)`,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 40px",
        }}
      >
        <div style={{ fontSize: "7.5px", color: C.muted }}>
          {confName} · {confYear}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: C.blue,
              color: C.white,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "7px",
              fontWeight: 700,
            }}
          >
            {pageNum}
          </span>
          <span style={{ fontSize: "8px", color: C.border }}>of {totalPages}</span>
        </div>
        <div style={{ fontSize: "7.5px", color: C.muted, fontStyle: "italic" }}>
          Excellence Through Hard Work
        </div>
      </div>
    </div>
  );
}

// ─── A4 Body Page Wrapper ─────────────────────────────────────────────────────
function A4Page({
  children,
  pageNum,
  totalPages,
  sectionLabel,
  confName,
  confYear,
}: {
  children: React.ReactNode;
  pageNum: number;
  totalPages: number;
  sectionLabel: string;
  confName: string;
  confYear: number;
}) {
  return (
    <div
      className="booklet-page"
      style={{
        width: "680px",
        minHeight: "962px",
        background: C.white,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle LSUIC watermark */}
      <div
        style={{
          position: "absolute",
          right: "30px",
          bottom: "60px",
          opacity: 0.03,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/conf/lsuic_logo.png" alt="" style={{ width: "200px", height: "200px", objectFit: "contain" }} />
      </div>

      <PageHeader confName={confName} sectionLabel={sectionLabel} pageNum={pageNum} />

      <div style={{ flex: 1, padding: "28px 40px 20px", position: "relative", zIndex: 1 }}>
        {children}
      </div>

      <PageFooter confName={confName} confYear={confYear} pageNum={pageNum} totalPages={totalPages} />
    </div>
  );
}

// ─── COVER PAGE ───────────────────────────────────────────────────────────────
function CoverPage({
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
        background: `linear-gradient(170deg, ${C.darkBlue} 0%, ${C.blue} 50%, #003492 100%)`,
      }}
    >
      {/* Liberian flag red/white stripes at top */}
      <div>
        <div style={{ display: "flex", height: "22px" }}>
          {[C.red, C.white, C.red, C.white, C.red, C.white, C.red, C.white, C.red, C.white, C.red].map((color, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: color,
                borderBottom: color === C.white ? `0.5px solid #e0e0e0` : "none",
              }}
            />
          ))}
        </div>
        {/* Blue canton (top-left block with white star) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "200px",
            height: "132px", // 11 stripes × 12px
            background: C.blue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "44px", color: C.white, lineHeight: 1, textShadow: `0 2px 20px ${C.white}40` }}>
            ★
          </div>
        </div>
      </div>

      {/* Subtle diagonal texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage: "repeating-linear-gradient(-55deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 28px)",
          pointerEvents: "none",
        }}
      />

      {/* Main centered content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 60px",
          textAlign: "center",
          gap: "0",
          paddingTop: "60px",
        }}
      >
        {/* LSUIC emblem */}
        <div
          style={{
            width: "130px",
            height: "130px",
            borderRadius: "50%",
            background: C.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            boxShadow: `0 0 0 8px ${C.white}15, 0 0 0 16px ${C.white}08`,
            marginBottom: "28px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/conf/lsuic_logo.png" alt="LSUIC" style={{ width: "110px", height: "110px", objectFit: "contain" }} />
        </div>

        {/* Org name */}
        <div
          style={{
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.gold,
            marginBottom: "14px",
          }}
        >
          Liberian Student Union in China
        </div>

        {/* Gold divider */}
        <div
          style={{
            width: "80px",
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
            marginBottom: "22px",
          }}
        />

        {/* Conference title */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 900,
            color: C.white,
            lineHeight: 1.15,
            maxWidth: "480px",
            marginBottom: "16px",
            textShadow: "0 2px 16px rgba(0,0,0,0.4)",
          }}
        >
          {bookletTitle}
        </div>

        {bookletSubtitle && (
          <div style={{ fontSize: "14px", fontWeight: 600, color: C.gold, marginBottom: "12px" }}>
            {bookletSubtitle}
          </div>
        )}

        {theme && (
          <div
            style={{
              fontSize: "12px",
              fontStyle: "italic",
              color: `${C.white}75`,
              maxWidth: "400px",
              marginBottom: "18px",
              lineHeight: 1.6,
            }}
          >
            &ldquo;{theme}&rdquo;
          </div>
        )}

        {/* Red divider */}
        <div
          style={{
            width: "80px",
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`,
            marginBottom: "22px",
          }}
        />

        {/* Date + Venue box */}
        <div
          style={{
            padding: "16px 32px",
            borderRadius: "10px",
            border: `1px solid ${C.white}18`,
            background: `${C.white}0A`,
          }}
        >
          <div style={{ fontSize: "17px", fontWeight: 700, color: C.white, marginBottom: "8px" }}>
            {fmtRange(event.startsAt, event.endsAt)}
          </div>
          <div style={{ fontSize: "11px", color: `${C.white}80`, letterSpacing: "0.05em" }}>
            {event.venue}
          </div>
          <div style={{ fontSize: "11px", color: `${C.white}65`, marginTop: "3px" }}>
            {event.city}, People&apos;s Republic of China
          </div>
        </div>

        {/* Liberia × China friendship tag */}
        <div
          style={{
            marginTop: "28px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "10px",
            color: `${C.white}45`,
            letterSpacing: "0.08em",
          }}
        >
          <span>🇱🇷</span>
          <span style={{ height: "1px", width: "50px", background: `${C.white}20` }} />
          <span style={{ textTransform: "uppercase" }}>Est. July 2006</span>
          <span style={{ height: "1px", width: "50px", background: `${C.white}20` }} />
          <span>🇨🇳</span>
        </div>
      </div>

      {/* Bottom: Liberian flag stripes + dark footer */}
      <div>
        <div style={{ display: "flex", height: "16px" }}>
          {[C.red, C.white, C.red, C.white, C.red, C.white, C.red].map((color, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: color,
                borderTop: color === C.white ? `0.5px solid #e0e0e0` : "none",
              }}
            />
          ))}
        </div>
        <div
          style={{
            textAlign: "center",
            padding: "7px",
            background: C.darkBlue,
            fontSize: "8px",
            color: `${C.white}35`,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Official Conference Booklet · Page 1
        </div>
      </div>
    </div>
  );
}

// ─── BACK COVER ───────────────────────────────────────────────────────────────
function BackCoverPage({
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
        width: "680px",
        minHeight: "962px",
        background: C.white,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top flag stripes */}
      <div style={{ display: "flex", height: "16px" }}>
        {[C.red, C.white, C.red, C.white, C.red, C.white, C.red].map((color, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: color,
              borderBottom: color === C.white ? `0.5px solid #e0e0e0` : "none",
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
          width: "120px",
          height: "80px",
          background: C.blue,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: "26px", color: C.white, lineHeight: 1 }}>★</div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 60px",
          textAlign: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/conf/lsuic_logo.png" alt="LSUIC" style={{ width: "100px", height: "100px", objectFit: "contain", marginBottom: "24px" }} />

        <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.blue, marginBottom: "6px" }}>
          Liberian Student Union in China
        </div>
        <div style={{ fontSize: "10px", color: C.muted, fontStyle: "italic", marginBottom: "28px" }}>
          Excellence Through Hard Work
        </div>

        {/* Red / Blue divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", width: "300px" }}>
          <div style={{ flex: 1, height: "1.5px", background: C.red }} />
          <div style={{ fontSize: "16px", color: C.blue }}>★</div>
          <div style={{ flex: 1, height: "1.5px", background: C.blue }} />
        </div>

        <div style={{ fontSize: "18px", fontWeight: 700, color: C.blue, marginBottom: "8px" }}>{event.name}</div>
        <div style={{ fontSize: "12px", color: C.muted, marginBottom: "4px" }}>{event.venue} · {event.city}, China</div>
        <div style={{ fontSize: "12px", color: C.muted, marginBottom: "32px" }}>{fmtRange(event.startsAt, event.endsAt)}</div>

        {/* Thank-you card */}
        <div
          style={{
            padding: "20px 28px",
            borderRadius: "12px",
            border: `1px solid ${C.blue}20`,
            background: C.lightBlue,
            maxWidth: "440px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 700, color: C.blue, marginBottom: "8px" }}>
            Thank You for Attending
          </div>
          <div style={{ fontSize: "11px", lineHeight: 1.75, color: C.muted }}>
            Your participation makes LSUIC stronger. Together we advance education,
            unity, and development for Liberian students across China.
          </div>
        </div>

        <div style={{ marginTop: "28px", fontSize: "26px", letterSpacing: "0.3em" }}>🇱🇷 🤝 🇨🇳</div>
      </div>

      {/* Footer */}
      <div>
        <div style={{ height: "1px", margin: "0 40px", background: `linear-gradient(90deg, ${C.blue}, ${C.red})` }} />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 40px", fontSize: "8px", color: C.muted }}>
          <span>LSUIC © {event.year}</span>
          <span style={{ color: C.blue, fontWeight: 600 }}>Page {totalPages} of {totalPages}</span>
          <span>Established July 2006</span>
        </div>
      </div>

      {/* Bottom flag stripes */}
      <div style={{ display: "flex", height: "12px" }}>
        {[C.red, C.white, C.red, C.white, C.red, C.white, C.red, C.white, C.red, C.white, C.red].map((color, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: color,
              borderTop: color === C.white ? `0.5px solid #e0e0e0` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── LEADER PAGE ──────────────────────────────────────────────────────────────
function LeaderSection({
  section,
  leaders,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  leaders: LeaderProfile[];
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  return (
    <A4Page pageNum={pageNum} totalPages={totalPages} sectionLabel={section.title} confName={confName} confYear={confYear}>
      {/* Section heading */}
      <div style={{ marginBottom: "22px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "4px",
            background: C.blue,
            color: C.white,
            fontSize: "8.5px",
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Leadership Profiles
        </div>
        <div style={{ height: "2px", background: `linear-gradient(90deg, ${C.red}, ${C.blue}, transparent)`, marginBottom: "6px" }} />
      </div>

      {leaders.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", border: `2px dashed ${C.border}`, borderRadius: "10px", color: C.muted, fontSize: "11px" }}>
          No leader profiles stored yet. Add them in the Leadership Profiles tab.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {leaders.map((l) => (
            <div
              key={l.id}
              style={{
                display: "flex",
                gap: "20px",
                padding: "18px",
                borderRadius: "10px",
                border: `1px solid ${C.border}`,
                background: C.lightBlue,
              }}
            >
              {/* Photo */}
              <div style={{ flexShrink: 0 }}>
                {l.photoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.photoPath}
                    alt={l.name}
                    style={{ width: "120px", height: "150px", objectFit: "cover", objectPosition: "top", borderRadius: "8px", border: `3px solid ${C.blue}` }}
                  />
                ) : (
                  <div
                    style={{
                      width: "120px",
                      height: "150px",
                      borderRadius: "8px",
                      background: `linear-gradient(145deg, ${C.blue}, ${C.darkBlue})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "40px",
                      color: `${C.white}40`,
                      border: `3px solid ${C.blue}40`,
                    }}
                  >
                    {l.name[0]}
                  </div>
                )}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {l.country && (
                  <div style={{ fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: C.red, marginBottom: "6px" }}>
                    {l.role} · {l.country}
                  </div>
                )}
                <div style={{ fontSize: "18px", fontWeight: 800, color: C.blue, lineHeight: 1.2, marginBottom: "4px" }}>
                  {l.name}
                </div>
                <div style={{ fontSize: "11px", color: C.muted, fontStyle: "italic", marginBottom: "12px", paddingBottom: "12px", borderBottom: `1px solid ${C.border}` }}>
                  {l.title}
                </div>
                {l.bio ? (
                  <div style={{ fontSize: "10.5px", lineHeight: 1.75, color: C.text, maxHeight: "80px", overflow: "hidden" }}>
                    {l.bio}
                  </div>
                ) : (
                  <div style={{ fontSize: "10px", color: `${C.muted}80`, fontStyle: "italic" }}>
                    Biography to be added.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </A4Page>
  );
}

// ─── ADDRESS / MESSAGE PAGE ───────────────────────────────────────────────────
function AddressSection({
  section,
  speaker,
  content,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  speaker: NecMember | null;
  content: string | null | undefined;
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  return (
    <A4Page pageNum={pageNum} totalPages={totalPages} sectionLabel={section.title} confName={confName} confYear={confYear}>
      {/* Section heading */}
      <div style={{ marginBottom: "22px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "4px",
            background: C.red,
            color: C.white,
            fontSize: "8.5px",
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          {section.title}
        </div>
        <div style={{ height: "2px", background: `linear-gradient(90deg, ${C.blue}, ${C.red}, transparent)` }} />
      </div>

      {/* Speaker card */}
      {speaker && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "14px 16px",
            borderRadius: "8px",
            background: `linear-gradient(90deg, ${C.blue}10, ${C.lightBlue})`,
            border: `1px solid ${C.blue}20`,
            marginBottom: "20px",
          }}
        >
          <Avatar src={speaker.photoPath} name={speaker.name} size={52} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: C.blue }}>{speaker.name}</div>
            <div style={{ fontSize: "10px", color: C.muted }}>
              {roleLabel(speaker)}{speaker.city ? ` · ${speaker.city}` : ""}
            </div>
          </div>
        </div>
      )}

      {/* Decorative open quote */}
      <div style={{ fontSize: "64px", lineHeight: 0.8, color: `${C.red}18`, fontFamily: "Georgia, serif", marginBottom: "14px", userSelect: "none" }}>
        &ldquo;
      </div>

      {content ? (
        <div style={{ fontSize: "11.5px", lineHeight: 1.85, color: C.text, maxHeight: "520px", overflow: "hidden" }}>
          {content.split("\n").map((line, i) => (
            <p key={i} style={{ marginBottom: "8px" }}>{line || <br />}</p>
          ))}
        </div>
      ) : (
        <div style={{ padding: "32px", textAlign: "center", border: `2px dashed ${C.border}`, borderRadius: "10px" }}>
          <div style={{ fontSize: "11px", color: C.muted }}>
            {section.type === "CHAIRMAN_ADDRESS"
              ? "The Chairman's address will appear here. Click \"Write Address\" in the Overview tab."
              : "Content not yet written. Use the Section Manager to add this text."}
          </div>
        </div>
      )}

      {speaker && content && (
        <div style={{ marginTop: "24px", paddingTop: "14px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "40px", height: "2px", background: C.red }} />
          <div style={{ fontSize: "10px", color: C.muted, fontStyle: "italic" }}>
            {speaker.name} · {roleLabel(speaker)}
          </div>
        </div>
      )}
    </A4Page>
  );
}

// ─── COMMITTEE PAGE ───────────────────────────────────────────────────────────
function CommitteeSection({
  section,
  members,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  members: NecMember[];
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  const KEY_ORDER = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"];

  const filtered = section.committeeScope
    ? members.filter(
        (m) =>
          m.committeeScope === section.committeeScope ||
          (section.type === "NEC" && KEY_ORDER.includes(m.role)),
      )
    : members;

  const sorted = [
    ...KEY_ORDER.flatMap((r) => filtered.filter((m) => m.role === r)),
    ...filtered.filter((m) => !KEY_ORDER.includes(m.role)),
  ];

  const roleColors: Record<string, { bg: string; text: string; isKey: boolean }> = {
    CHAIR: { bg: C.blue, text: C.white, isKey: true },
    VICE_CHAIR: { bg: C.red, text: C.white, isKey: true },
    SECRETARY: { bg: `${C.blue}15`, text: C.blue, isKey: true },
    TREASURER: { bg: `${C.red}15`, text: C.red, isKey: true },
    COMMITTEE: { bg: C.lightBlue, text: C.blue, isKey: false },
  };

  return (
    <A4Page pageNum={pageNum} totalPages={totalPages} sectionLabel={section.title} confName={confName} confYear={confYear}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: "4px", height: "24px", borderRadius: "2px", background: `linear-gradient(${C.blue}, ${C.red})` }} />
          <div style={{ fontSize: "16px", fontWeight: 800, color: C.blue }}>{section.title}</div>
        </div>
        {section.subtitle && (
          <div style={{ fontSize: "10px", color: C.red, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: "14px" }}>
            {section.subtitle}
          </div>
        )}
        {section.bodyText && (
          <div style={{ fontSize: "10.5px", color: C.muted, lineHeight: 1.6, marginTop: "8px", marginLeft: "14px" }}>
            {section.bodyText}
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", border: `2px dashed ${C.border}`, borderRadius: "10px", color: C.muted, fontSize: "11px" }}>
          No members in this committee scope.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {sorted.map((m) => {
            const colors = roleColors[m.role] ?? roleColors.COMMITTEE;
            const isKey = colors.isKey;
            const isChair = m.role === "CHAIR";

            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: isKey ? colors.bg : C.lightBlue,
                  border: `1px solid ${isKey ? "transparent" : C.border}`,
                  gridColumn: isChair ? "1 / -1" : "auto",
                }}
              >
                <Avatar src={m.photoPath} name={m.name} size={isChair ? 52 : 40} borderColor={isKey ? C.white : C.blue} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: isKey ? colors.text : C.blue, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: "9px", color: isKey ? `${colors.text}B0` : C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {roleLabel(m)}{m.city ? ` · ${m.city}` : ""}
                  </div>
                </div>
                {isChair && (
                  <div style={{ padding: "2px 8px", borderRadius: "20px", background: `${C.gold}30`, border: `1px solid ${C.gold}`, fontSize: "7px", fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>
                    Chairman
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </A4Page>
  );
}

// ─── SCHEDULE PAGE ────────────────────────────────────────────────────────────
function ScheduleSection({
  section,
  meetings,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  meetings: Meeting[];
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  return (
    <A4Page pageNum={pageNum} totalPages={totalPages} sectionLabel={section.title} confName={confName} confYear={confYear}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: "4px", height: "24px", borderRadius: "2px", background: `linear-gradient(${C.red}, ${C.blue})` }} />
          <div style={{ fontSize: "16px", fontWeight: 800, color: C.blue }}>{section.title}</div>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", border: `2px dashed ${C.border}`, borderRadius: "10px", color: C.muted, fontSize: "11px" }}>
          No meetings scheduled yet. Add meetings in the Meetings section.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {meetings.map((m, i) => (
            <div key={m.id} style={{ display: "flex", gap: "16px" }}>
              {/* Timeline */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: i === 0 ? C.red : i % 2 === 0 ? C.blue : `${C.blue}60`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: C.white,
                    flexShrink: 0,
                    border: `2px solid ${C.white}`,
                    boxShadow: `0 0 0 2px ${i === 0 ? C.red : C.blue}40`,
                  }}
                >
                  {i + 1}
                </div>
                {i < meetings.length - 1 && (
                  <div style={{ width: "2px", flex: 1, minHeight: "16px", background: `linear-gradient(${C.blue}40, ${C.border})`, margin: "3px 0" }} />
                )}
              </div>
              {/* Content */}
              <div style={{ flex: 1, paddingBottom: i < meetings.length - 1 ? "16px" : "0" }}>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${C.border}`,
                    background: i === 0 ? `${C.red}06` : C.lightBlue,
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: C.blue, marginBottom: "4px" }}>{m.title}</div>
                  <div style={{ fontSize: "9.5px", color: C.red, fontWeight: 600, marginBottom: "4px" }}>{fmtTime(m.scheduled)}</div>
                  {m.location && <div style={{ fontSize: "9px", color: C.muted, marginBottom: "2px" }}>📍 {m.location}</div>}
                  {m.agenda && (
                    <div
                      style={{
                        fontSize: "9.5px",
                        color: C.text,
                        lineHeight: 1.5,
                        marginTop: "6px",
                        paddingTop: "6px",
                        borderTop: `1px solid ${C.border}`,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      } as React.CSSProperties}
                    >
                      {m.agenda}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </A4Page>
  );
}

// ─── DELEGATES PAGE ───────────────────────────────────────────────────────────
function DelegatesSection({
  section,
  delegates,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  delegates: Delegate[];
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  return (
    <A4Page pageNum={pageNum} totalPages={totalPages} sectionLabel={section.title} confName={confName} confYear={confYear}>
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "4px", height: "24px", borderRadius: "2px", background: `linear-gradient(${C.blue}, ${C.red})` }} />
            <div style={{ fontSize: "16px", fontWeight: 800, color: C.blue }}>{section.title}</div>
          </div>
          <div style={{ padding: "3px 10px", borderRadius: "20px", background: C.blue, color: C.white, fontSize: "9px", fontWeight: 700 }}>
            {delegates.length} Delegates
          </div>
        </div>
        {section.bodyText && <div style={{ fontSize: "10px", color: C.muted, marginLeft: "14px" }}>{section.bodyText}</div>}
      </div>

      {delegates.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", border: `2px dashed ${C.border}`, borderRadius: "10px", color: C.muted, fontSize: "11px" }}>
          No confirmed delegates yet.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {delegates.map((d) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "10px 6px",
                borderRadius: "8px",
                border: `1px solid ${C.border}`,
                background: C.lightBlue,
              }}
            >
              <Avatar src={d.bookletPhotoPath} name={d.name} size={52} square borderColor={C.blue} />
              <div style={{ fontSize: "9.5px", fontWeight: 600, color: C.blue, marginTop: "7px", lineHeight: 1.3, maxHeight: "28px", overflow: "hidden", width: "100%", textAlign: "center" }}>
                {d.name}
              </div>
              {d.city && <div style={{ fontSize: "8px", color: C.muted, marginTop: "2px" }}>{d.city}</div>}
              {d.delegateCode && (
                <div style={{ marginTop: "5px", padding: "1px 6px", borderRadius: "4px", background: `${C.red}15`, color: C.red, fontSize: "7.5px", fontFamily: "monospace", fontWeight: 600 }}>
                  {d.delegateCode}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {delegates.length > 0 && (
        <div style={{ marginTop: "16px", textAlign: "right", fontSize: "8.5px", color: C.muted, fontStyle: "italic" }}>
          {delegates.length} confirmed delegate{delegates.length !== 1 ? "s" : ""} as of{" "}
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
      )}
    </A4Page>
  );
}

// ─── GENERIC TEXT PAGE ────────────────────────────────────────────────────────
function TextSection({
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
  return (
    <A4Page pageNum={pageNum} totalPages={totalPages} sectionLabel={section.title} confName={confName} confYear={confYear}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: "4px", height: "24px", borderRadius: "2px", background: `linear-gradient(${C.blue}, ${C.gold})` }} />
          <div style={{ fontSize: "16px", fontWeight: 800, color: C.blue }}>{section.title}</div>
        </div>
        {section.subtitle && (
          <div style={{ fontSize: "10px", color: C.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: "14px" }}>
            {section.subtitle}
          </div>
        )}
      </div>

      {section.bodyText ? (
        <div style={{ fontSize: "11.5px", lineHeight: 1.8, color: C.text }}>
          {section.bodyText.split("\n").map((line, i) => (
            <p key={i} style={{ marginBottom: "10px" }}>{line || <br />}</p>
          ))}
        </div>
      ) : (
        <div style={{ padding: "32px", textAlign: "center", border: `2px dashed ${C.border}`, borderRadius: "10px", color: C.muted, fontSize: "11px" }}>
          No content yet. Add text in the Section Manager.
        </div>
      )}
    </A4Page>
  );
}

// ─── TABLE OF CONTENTS ────────────────────────────────────────────────────────
function TableOfContentsPage({
  sections,
  confName,
  confYear,
  totalPages,
}: {
  sections: BookletSection[];
  confName: string;
  confYear: number;
  totalPages: number;
}) {
  return (
    <div
      className="booklet-page"
      style={{ width: "680px", minHeight: "962px", background: C.white, display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <PageHeader confName={confName} sectionLabel="Table of Contents" pageNum={2} />

      <div style={{ flex: 1, padding: "28px 40px 20px" }}>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.blue, marginBottom: "6px" }}>Table of Contents</div>
          <div style={{ height: "3px", width: "60px", background: `linear-gradient(90deg, ${C.red}, ${C.blue})`, borderRadius: "2px" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {/* Cover entry */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: "6px", background: C.lightBlue, marginBottom: "4px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.blue }}>Cover Page</div>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: C.white }}>1</div>
          </div>

          {sections.map((s, i) => {
            const pg = i + 3; // cover=1, TOC=2, body starts at 3
            const isKey = s.type === "LEADER" || s.type === "NEC" || s.type === "CHAIRMAN_ADDRESS" || s.type === "PRESIDENT_ADDRESS";
            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  background: isKey ? `${C.blue}08` : "transparent",
                  borderBottom: `1px solid ${C.border}50`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isKey ? C.red : C.border, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: isKey ? 700 : 500, color: isKey ? C.blue : C.text }}>{s.title}</div>
                    {s.subtitle && <div style={{ fontSize: "9px", color: C.muted }}>{s.subtitle}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "80px", height: "1px", backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, #D1D9F0 3px, #D1D9F0 4px)" }} />
                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: isKey ? C.blue : C.lightBlue, border: `1px solid ${isKey ? C.blue : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: isKey ? C.white : C.blue }}>
                    {pg}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PageFooter confName={confName} confYear={confYear} pageNum={2} totalPages={totalPages} />
    </div>
  );
}

// ─── Section renderer ─────────────────────────────────────────────────────────
function renderSection(
  section: BookletSection,
  data: BookletData,
  pageNum: number,
  totalPages: number,
) {
  const { event, leaders, committeeMembers, conferenceChair, delegates } = data;
  const meetings = data.meetings ?? [];
  const confName = event.name;
  const confYear = event.year;
  const key = section.id;
  const common = { pageNum, totalPages, confName, confYear };

  switch (section.type) {
    case "LEADER":
      return <LeaderSection key={key} section={section} leaders={leaders} {...common} />;

    case "PRESIDENT_ADDRESS":
    case "GUEST_BIO":
      return <AddressSection key={key} section={section} speaker={null} content={section.bodyText} {...common} />;

    case "CHAIRMAN_ADDRESS":
      return (
        <AddressSection
          key={key}
          section={section}
          speaker={conferenceChair}
          content={conferenceChair?.bookletBio ?? section.bodyText}
          {...common}
        />
      );

    case "NEC":
    case "COMMITTEE":
    case "COC":
    case "COC_MEMBERS":
    case "CITY_PRESIDENTS":
    case "JUDICIAL":
      return <CommitteeSection key={key} section={section} members={committeeMembers} {...common} />;

    case "SCHEDULE":
      return <ScheduleSection key={key} section={section} meetings={meetings} {...common} />;

    case "DELEGATES":
      return <DelegatesSection key={key} section={section} delegates={delegates} {...common} />;

    default:
      return <TextSection key={key} section={section} {...common} />;
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function BookletPreview({
  data,
  confId,
}: {
  data: BookletData;
  confId: string;
}) {
  const [zoom, setZoom] = useState(90);

  const enabledSections = [...(data.booklet?.sections ?? [])]
    .filter((s) => s.isEnabled && s.type !== "COVER" && s.type !== "BACK_COVER")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const hasCover = (data.booklet?.sections ?? []).some((s) => s.type === "COVER" && s.isEnabled);
  const hasBackCover = (data.booklet?.sections ?? []).some((s) => s.type === "BACK_COVER" && s.isEnabled);

  // Total: cover(1) + TOC(1) + body + backCover
  const totalPages = (hasCover ? 1 : 0) + 1 + enabledSections.length + (hasBackCover ? 1 : 0);

  const letterheadUrl = `/api/conf/${confId}/letterhead?mode=header&format=png`;

  return (
    <div className="space-y-4">
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .booklet-document, .booklet-document * { visibility: visible; }
          .booklet-no-print { display: none !important; }
          .booklet-document {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
          }
          .booklet-page {
            width: 210mm !important;
            min-height: 297mm !important;
            page-break-after: always;
            page-break-inside: avoid;
            box-shadow: none !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* Toolbar */}
      <div
        className="booklet-no-print"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "10px 16px",
          borderRadius: "10px",
          border: `1px solid ${C.blue}20`,
          background: C.lightBlue,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: C.blue }}>Live Booklet Preview</span>
          {data.booklet && (
            <Badge
              className={
                data.booklet.status === "PUBLISHED"
                  ? "bg-green-500/20 text-green-700 text-[10px]"
                  : data.booklet.status === "READY"
                    ? "bg-amber-500/20 text-amber-700 text-[10px]"
                    : "bg-zinc-500/20 text-zinc-600 text-[10px]"
              }
            >
              {data.booklet.status}
            </Badge>
          )}
          <span style={{ fontSize: "10px", color: C.muted }}>
            {totalPages} pages · {enabledSections.length} sections
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Zoom */}
          <div style={{ display: "flex", alignItems: "center", border: "1px solid #D1D5DB", borderRadius: "8px", overflow: "hidden" }}>
            <button onClick={() => setZoom((z) => Math.max(50, z - 10))} style={{ padding: "4px 8px", cursor: "pointer", background: "transparent", border: "none" }} title="Zoom out">
              <ZoomOut className="size-3.5" />
            </button>
            <span style={{ minWidth: "3rem", textAlign: "center", fontSize: "11px", fontFamily: "monospace" }}>{zoom}%</span>
            <button onClick={() => setZoom((z) => Math.min(150, z + 10))} style={{ padding: "4px 8px", cursor: "pointer", background: "transparent", border: "none" }} title="Zoom in">
              <ZoomIn className="size-3.5" />
            </button>
          </div>

          <a href={letterheadUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="size-3.5" />
            Letterhead
          </a>

          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => window.print()}>
            <Download className="size-3.5" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Booklet viewport */}
      <div style={{ overflowX: "auto", borderRadius: "16px", background: "#D8D8D8", padding: "24px" }}>
        <div
          className="booklet-document"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            width: "680px",
            margin: "0 auto",
            marginBottom: zoom < 100 ? `${((zoom - 100) / 100) * 400}px` : "0",
          }}
        >
          {/* Pages separated by gaps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {hasCover && (
              <CoverPage
                event={data.event}
                bookletTitle={data.booklet?.title ?? data.event.name}
                bookletSubtitle={data.booklet?.subtitle ?? null}
                theme={data.booklet?.theme ?? null}
              />
            )}

            <TableOfContentsPage
              sections={enabledSections}
              confName={data.event.name}
              confYear={data.event.year}
              totalPages={totalPages}
            />

            {enabledSections.map((s, i) =>
              renderSection(s, data, (hasCover ? 1 : 0) + 2 + i, totalPages),
            )}

            {hasBackCover && (
              <BackCoverPage event={data.event} totalPages={totalPages} />
            )}

            {!hasBackCover && (
              <div style={{ width: "680px", padding: "18px 40px", background: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: `${C.white}70` }}>
                  Liberian Student Union in China · {data.event.name} · {data.event.year}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Letterhead preview strip */}
      <div className="booklet-no-print rounded-xl border border-[#C8A061]/20 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: C.blue }}>Conference Committee Letterhead</p>
          <a href={`/api/conf/${confId}/letterhead?format=svg`} target="_blank" rel="noreferrer" className="text-[10px] text-[#C8A061] hover:underline">
            View SVG →
          </a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={letterheadUrl}
          alt="Conference Committee Letterhead"
          className="w-full rounded-lg"
          style={{ maxHeight: "160px", objectFit: "contain", objectPosition: "top" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
    </div>
  );
}
