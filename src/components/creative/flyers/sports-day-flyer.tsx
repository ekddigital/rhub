"use client";

import { useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/creative/ui/button";

/* ─── Flyer Canvas ──────────────────────────────────────────────────────────
  Designed for 540 × 675 px preview  →  scale:2 export  →  1080 × 1350
   Instagram portrait (4:5)

  Layout uses position:absolute exclusively — NO flex:1 spacers — so that
  export captures identically to the browser render.
   • Header  → absolute, top: 0
   • Content → absolute, bottom: 0
─────────────────────────────────────────────────────────────────────────── */
function JICFSportsDayCanvas() {
  return (
    <div
      style={{
        position: "relative",
        width: 540,
        height: 675,
        overflow: "hidden",
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* ── BACKGROUND: field photo + layered overlays ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 540,
          height: 675,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/jicf/outdoor-field.png"
          alt=""
          crossOrigin="anonymous"
          style={{
            width: 540,
            height: 675,
            objectFit: "cover",
            objectPosition: "center 25%",
            display: "block",
          }}
        />
        {/* Deep navy gradient from bottom up */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(23,37,84,0.55) 0%, rgba(12,67,106,0.25) 30%, rgba(12,67,106,0.45) 50%, rgba(23,37,84,0.88) 65%, #172554 85%)",
          }}
        />
        {/* Top edge darkening */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 169,
            background:
              "linear-gradient(to bottom, rgba(12,67,106,0.75) 0%, transparent 100%)",
          }}
        />
        {/* Subtle radial glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(37,150,190,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── DECORATIVE: thin diagonal accent lines ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 120,
          height: 120,
          opacity: 0.18,
          overflow: "hidden",
        }}
      >
        {[0, 18, 36, 54].map((offset) => (
          <div
            key={offset}
            style={{
              position: "absolute",
              width: 200,
              height: 2,
              background:
                "linear-gradient(to right, transparent, #2596be, transparent)",
              top: offset,
              right: -50,
              transform: "rotate(-45deg)",
              transformOrigin: "right center",
            }}
          />
        ))}
      </div>

      {/* ── HEADER — pinned to top via absolute ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "18px 22px 10px",
        }}
      >
        {/* JICF identity */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "#ffffff",
              border: "2.5px solid rgba(37,150,190,0.7)",
              boxShadow:
                "0 0 18px rgba(37,150,190,0.45), 0 2px 8px rgba(0,0,0,0.3)",
              overflow: "hidden",
              flexShrink: 0,
              marginRight: 10,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/JICF_LOGO1.png"
              alt="JICF"
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
          <div style={{ marginTop: 15 }}>
            <p
              style={{
                fontSize: 10,
                color: "#fbbf24",
                fontWeight: 900,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                lineHeight: 1,
                margin: 0,
              }}
            >
              JICF
            </p>
            <p
              style={{
                fontSize: 7.5,
                color: "rgba(255,255,255,0.82)",
                fontWeight: 600,
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              Jinan International
            </p>
            <p
              style={{
                fontSize: 7.5,
                color: "rgba(255,255,255,0.82)",
                fontWeight: 600,
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              Christian Fellowship
            </p>
          </div>
        </div>

        {/* Year badge */}
        <div
          style={{
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.5)",
            borderRadius: 20,
            height: 26,
            minWidth: 64,
            textAlign: "center",
            marginTop: 21,
          }}
        >
          <p
            style={{
              fontSize: 9,
              color: "#fbbf24",
              fontWeight: 800,
              letterSpacing: "0.12em",
              margin: 0,
              lineHeight: "24px",
            }}
          >
            2026
          </p>
        </div>
      </div>

      {/* ── BOTTOM CONTENT STACK — pinned to bottom via absolute ── */}
      {/* data-bottom-content lets the download fn swap bottom:0→top:Npx for html2canvas */}
      <div
        data-bottom-content="1"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── EVENT BADGE ── */}
        <div style={{ padding: "0 22px 8px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(12,67,106,0.72)",
              border: "1px solid rgba(37,150,190,0.5)",
              borderRadius: 22,
              padding: "5px 14px",
            }}
          >
            <span style={{ fontSize: 11 }}>⛪</span>
            <p
              style={{
                fontSize: 8.5,
                color: "rgba(255,255,255,0.92)",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              JICF Sports Day
            </p>
          </div>
        </div>

        {/* ── MAIN TITLE ── */}
        <div style={{ padding: "0 22px 2px" }}>
          <h1
            style={{
              fontSize: 62,
              fontWeight: 900,
              color: "white",
              lineHeight: 0.9,
              letterSpacing: "-0.02em",
              textShadow:
                "0 3px 18px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.4)",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            JICF
          </h1>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: "#fbbf24",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              textShadow:
                "0 3px 16px rgba(0,0,0,0.55), 0 1px 4px rgba(251,191,36,0.35)",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            SPORTS DAY
          </h1>
          <p
            style={{
              fontSize: 8,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: "5px 0 0",
            }}
          >
            Fun games · fellowship · recreation
          </p>
        </div>

        {/* ── VERSE ── */}
        <div style={{ padding: "8px 22px 10px" }}>
          <p
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.6)",
              fontStyle: "italic",
              lineHeight: 1.5,
              margin: "0 0 2px",
              borderLeft: "2px solid rgba(251,191,36,0.6)",
              paddingLeft: 8,
            }}
          >
            &ldquo;They will run and not grow weary, they will walk and not be
            faint.&rdquo;
          </p>
          <p
            style={{
              fontSize: 7.5,
              color: "#fbbf24",
              fontWeight: 700,
              letterSpacing: "0.1em",
              margin: 0,
              paddingLeft: 10,
            }}
          >
            — Isaiah 40:31
          </p>
        </div>

        {/* ── ACCENT STRIPE ── */}
        <div
          style={{
            height: 3,
            background:
              "linear-gradient(to right, #172554, #2596be 25%, #fbbf24 50%, #2596be 75%, #172554)",
          }}
        />

        {/* ── DETAILS PANEL ── */}
        <div
          style={{
            background: "rgba(23,37,84,0.97)",
            padding: "16px 22px 14px",
          }}
        >
          <p
            style={{
              fontSize: 8,
              color: "#fbbf24",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              margin: "0 0 10px",
            }}
          >
            Event Details
          </p>

          {/* Detail rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              {
                icon: "📅",
                label: "Sunday, May 17, 2026",
                sub: "A special day set apart for worship & fun",
              },
              {
                icon: "🕑",
                label: "2:00 PM",
                sub: "Sports activities, fellowship, and fun games",
              },
              {
                icon: "📍",
                label: "Venue — To Be Announced",
                sub: "Location details coming soon",
              },
            ].map(({ icon, label, sub }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(37,150,190,0.12)",
                    border: "1px solid rgba(37,150,190,0.3)",
                    fontSize: 12,
                    flexShrink: 0,
                    textAlign: "center",
                    lineHeight: "28px",
                  }}
                >
                  {icon}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11.5,
                      color: "white",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      margin: 0,
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.45)",
                      lineHeight: 1.3,
                      margin: 0,
                    }}
                  >
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Activity tags */}
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              style={{
                fontSize: 8.8,
                color: "rgba(255,255,255,0.4)",
                margin: "0 0 7px",
                textAlign: "center",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Activities include:
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: 4,
                justifyContent: "space-between",
              }}
            >
              {(
                [
                  { label: "🎯 Fun Games", highlight: false },
                  { label: "🤝 Fellowship", highlight: true },
                  { label: "🎉 Recreation", highlight: false },
                ] as { label: string; highlight: boolean }[]
              ).map(({ label, highlight }) => (
                <span
                  key={label}
                  style={{
                    background: highlight
                      ? "rgba(251,191,36,0.1)"
                      : "rgba(255,255,255,0.06)",
                    border: highlight
                      ? "1px solid rgba(251,191,36,0.4)"
                      : "1px solid rgba(255,255,255,0.11)",
                    borderRadius: 20,
                    padding: "4px 10px",
                    fontSize: 9,
                    color: highlight ? "#fbbf24" : "rgba(255,255,255,0.78)",
                    fontWeight: highlight ? 600 : 500,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTACT STRIP ── */}
        <div
          style={{
            background: "#0a3050",
            borderTop: "1px solid rgba(251,191,36,0.15)",
            padding: "5px 22px",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 9 }}>🌐</span>
            <span
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.65)",
                fontWeight: 500,
                marginLeft: 4,
                whiteSpace: "nowrap",
              }}
            >
              jinanicf.com
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 9 }}>✉</span>
            <span
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.65)",
                fontWeight: 500,
                marginLeft: 4,
                whiteSpace: "nowrap",
              }}
            >
              admin@jinanicf.com
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 9 }}>📞</span>
            <span
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.65)",
                fontWeight: 500,
                marginLeft: 4,
                whiteSpace: "nowrap",
              }}
            >
              +86 185 0683 2159
            </span>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          style={{
            background: "#0c436a",
            padding: "7px 22px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              padding: 2,
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/JICF_LOGO1.png"
              alt="JICF"
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.75)",
              fontStyle: "italic",
              fontWeight: 500,
              margin: 0,
              letterSpacing: "0.02em",
              marginTop: 5,
              whiteSpace: "nowrap",
            }}
          >
            Come as you are · Bring a friend
          </p>
          <p
            style={{
              fontSize: 9,
              color: "#fbbf24",
              fontWeight: 700,
              margin: 0,
              marginTop: 7,
              whiteSpace: "nowrap",
            }}
          >
            #JICFSportsDay
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Shell (preview + download controls) ───────────────────────────────── */
export function SportsDayFlyerShell() {
  const flyerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadPng = async () => {
    if (!flyerRef.current || downloading) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const el = flyerRef.current;

      // Wait for fonts to be fully ready before rasterizing.
      if ("fonts" in document) {
        await (document as Document & { fonts: { ready: Promise<unknown> } })
          .fonts.ready;
      }

      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2, // 540 × 2 = 1080, 675 × 2 = 1350
        width: 540,
        height: 675,
        canvasWidth: 1080,
        canvasHeight: 1350,
        backgroundColor: "#172554",
      });

      const link = document.createElement("a");
      link.download = "jicf-sports-day-may-2026.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const printFlyer = () => window.print();

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button
          onClick={() => void downloadPng()}
          disabled={downloading}
          className="bg-[#0c436a] hover:bg-[#172554] text-white"
        >
          <Download className="size-4 mr-2" />
          {downloading ? "Preparing…" : "Download PNG (1080 × 1350)"}
        </Button>
        <Button
          variant="outline"
          onClick={printFlyer}
          className="border-[#0c436a] text-[#0c436a] hover:bg-[#ccdce3]"
        >
          <Printer className="size-4 mr-2" />
          Print / Save PDF
        </Button>
      </div>

      {/* Flyer preview */}
      <div
        className="shadow-2xl print:shadow-none"
        style={{
          width: "100%",
          maxWidth: 540,
          aspectRatio: "4 / 5",
          overflow: "hidden",
          borderRadius: 16,
        }}
      >
        <div
          ref={flyerRef}
          style={{
            width: 540,
            height: 675,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <JICFSportsDayCanvas />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center print:hidden">
        Preview is 540 × 675 px · Download exports at 1080 × 1350 px (Instagram
        portrait, 4:5)
      </p>
    </div>
  );
}
