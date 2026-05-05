/**
 * JICF Easter Video Contest Winner Certificate
 * Easter Celebration — April 5, 2026
 * Theme: The Resurrected King | 1 Corinthians 15:20-22
 */

import { CertificateTemplate } from "../types";
import { JICF_COLORS } from "./constants";

// ─── Shared colour aliases ─────────────────────────────────────────────────────
const C = {
  navy: JICF_COLORS.blue, // #190570
  red: JICF_COLORS.red, // #ed1c24
  gold: JICF_COLORS.gold!, // #d4af37
  yellow: JICF_COLORS.yellow, // #efe31e
  white: JICF_COLORS.white, // #ffffff
  dark: "#0d0040", // deeper navy for body text
};

// ─── Template (800 × 600) ──────────────────────────────────────────────────────
export const jicfEasterWinnerCert: CertificateTemplate = {
  id: "jicf-easter-winner-2026",
  name: "JICF Easter Winner Certificate 2026",
  description:
    "Certificate of Excellence for the JICF Easter Video Contest winners — Easter Celebration, April 5, 2026.",
  organization: "jicf",
  category: "appreciation",
  elements: [
    // ── Outer navy border ─────────────────────────────────────────────────
    {
      id: "outer-border",
      type: "shape",
      content: "",
      position: { x: 15, y: 15, width: 770, height: 570 },
      style: { color: C.navy, borderRadius: "8px" },
    },

    // ── Inner cream/white panel ───────────────────────────────────────────
    {
      id: "inner-panel",
      type: "shape",
      content: "",
      position: { x: 28, y: 28, width: 744, height: 544 },
      style: { color: "#fffef8", borderRadius: "4px" },
    },

    // ── Top gold accent bar ────────────────────────────────────────────────
    {
      id: "gold-bar-top",
      type: "shape",
      content: "",
      position: { x: 28, y: 28, width: 744, height: 6 },
      style: { color: C.gold, borderRadius: "4px 4px 0 0" },
    },

    // ── Bottom gold accent bar ─────────────────────────────────────────────
    {
      id: "gold-bar-bottom",
      type: "shape",
      content: "",
      position: { x: 28, y: 566, width: 744, height: 6 },
      style: { color: C.gold, borderRadius: "0 0 4px 4px" },
    },

    // ── JICF Logo (left) ──────────────────────────────────────────────────
    {
      id: "jicf-logo",
      type: "image",
      content: "/JICF_LOGO1.png",
      position: { x: 50, y: 48, width: 80, height: 80 },
      style: {},
    },

    // ── Cross / Easter emblem (navy circle with gold cross, right side) ──
    {
      id: "easter-cross-circle",
      type: "shape",
      content: "",
      position: { x: 670, y: 48, width: 80, height: 80 },
      style: { color: C.navy, borderRadius: "50%" },
    },
    {
      id: "easter-cross-v",
      type: "shape",
      content: "",
      position: { x: 706, y: 58, width: 8, height: 52 },
      style: { color: C.gold, borderRadius: "2px" },
    },
    {
      id: "easter-cross-h",
      type: "shape",
      content: "",
      position: { x: 688, y: 75, width: 44, height: 8 },
      style: { color: C.gold, borderRadius: "2px" },
    },

    // ── Organization name ─────────────────────────────────────────────────
    {
      id: "org-name",
      type: "text",
      content: "JINAN INTERNATIONAL CHRISTIAN FELLOWSHIP",
      position: { x: 150, y: 53, width: 500, height: 26 },
      style: {
        fontSize: 17,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: C.navy,
        textAlign: "center",
      },
    },
    {
      id: "org-tagline",
      type: "text",
      content: "Easter Celebration · April 5, 2026",
      position: { x: 150, y: 79, width: 500, height: 18 },
      style: {
        fontSize: 11,
        fontFamily: "Georgia, serif",
        color: C.red,
        textAlign: "center",
      },
    },
    {
      id: "org-location",
      type: "text",
      content: "Jinan City, China",
      position: { x: 150, y: 97, width: 500, height: 16 },
      style: {
        fontSize: 10,
        fontFamily: "Georgia, serif",
        color: C.dark,
        textAlign: "center",
      },
    },

    // ── Divider line below header ─────────────────────────────────────────
    {
      id: "header-divider",
      type: "shape",
      content: "",
      position: { x: 50, y: 138, width: 700, height: 1.5 },
      style: { color: C.gold },
    },

    // ── "CERTIFICATE OF EXCELLENCE" title ────────────────────────────────
    {
      id: "cert-title",
      type: "text",
      content: "CERTIFICATE OF EXCELLENCE",
      position: { x: 80, y: 148, width: 640, height: 38 },
      style: {
        fontSize: 28,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: C.red,
        textAlign: "center",
      },
    },

    // ── Contest award badge ────────────────────────────────────────────────
    {
      id: "award-badge-bg",
      type: "shape",
      content: "",
      position: { x: 295, y: 188, width: 210, height: 22 },
      style: { color: C.navy, borderRadius: "11px" },
    },
    {
      id: "award-badge-text",
      type: "text",
      content: "✦  {{custom.placement}}  ✦",
      position: { x: 295, y: 191, width: 210, height: 16 },
      style: {
        fontSize: 10,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: C.yellow,
        textAlign: "center",
        letterSpacing: "1px",
      },
    },

    // ── "This certificate is proudly presented to" ────────────────────────
    {
      id: "presented-to",
      type: "text",
      content: "This certificate is proudly presented to",
      position: { x: 80, y: 225, width: 640, height: 22 },
      style: {
        fontSize: 14,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        color: C.dark,
        textAlign: "center",
      },
    },

    // ── Recipient name (large, navy bold) ─────────────────────────────────
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 80, y: 250, width: 640, height: 50 },
      style: {
        fontSize: 34,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: C.navy,
        textAlign: "center",
      },
    },

    // ── Underline beneath recipient name ──────────────────────────────────
    {
      id: "name-underline",
      type: "shape",
      content: "",
      position: { x: 200, y: 303, width: 400, height: 1.5 },
      style: { color: C.navy },
    },

    // ── Description ───────────────────────────────────────────────────────
    {
      id: "description",
      type: "text",
      content:
        'In recognition of outstanding dedication and creativity in the JICF Easter Video Contest,\ntheme: "The Resurrected King" — 1 Corinthians 15:20. Your cell group\'s video inspired faith,\nspread the joy of Resurrection, and brought glory to our Lord Jesus Christ.',
      position: { x: 70, y: 314, width: 660, height: 58 },
      style: {
        fontSize: 12.5,
        fontFamily: "Georgia, serif",
        color: C.dark,
        textAlign: "center",
        lineHeight: "1.55",
      },
    },

    // ── Scripture banner ──────────────────────────────────────────────────
    {
      id: "scripture-bg",
      type: "shape",
      content: "",
      position: { x: 120, y: 380, width: 560, height: 42 },
      style: { color: C.navy, borderRadius: "4px" },
    },
    {
      id: "scripture-text",
      type: "text",
      content:
        '"But now is Christ risen from the dead, and become the firstfruits of them that slept."',
      position: { x: 130, y: 386, width: 540, height: 16 },
      style: {
        fontSize: 11,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        color: C.white,
        textAlign: "center",
      },
    },
    {
      id: "scripture-ref",
      type: "text",
      content: "— 1 Corinthians 15:20 (KJV)   ·   He is risen indeed! ✝",
      position: { x: 130, y: 404, width: 540, height: 13 },
      style: {
        fontSize: 10,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: C.yellow,
        textAlign: "center",
      },
    },

    // ── Date issued ───────────────────────────────────────────────────────
    {
      id: "date-issued",
      type: "text",
      content: "Date Issued: {{issueDate}}",
      position: { x: 60, y: 436, width: 680, height: 14 },
      style: {
        fontSize: 10,
        fontFamily: "Georgia, serif",
        color: C.dark,
        textAlign: "center",
      },
    },

    // ── Pastor signature (centred) ─────────────────────────────────────────
    {
      id: "pastor-signature",
      type: "image",
      group: "signature",
      content: "/pastor_Joe_signaturepng.png",
      position: { x: 310, y: 454, width: 180, height: 44 },
      style: {},
    },
    {
      id: "pastor-sig-line",
      type: "shape",
      content: "",
      position: { x: 290, y: 500, width: 220, height: 1 },
      style: { color: C.dark },
    },
    {
      id: "pastor-name",
      type: "text",
      content: "Pst. Joseph G. Summers",
      position: { x: 270, y: 505, width: 260, height: 14 },
      style: {
        fontSize: 10,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: C.dark,
        textAlign: "center",
      },
    },
    {
      id: "pastor-title",
      type: "text",
      content: "Senior Pastor, JICF",
      position: { x: 270, y: 519, width: 260, height: 12 },
      style: {
        fontSize: 8,
        fontFamily: "Georgia, serif",
        color: C.dark,
        textAlign: "center",
      },
    },

    // ── Certificate ID (below pastor block) ───────────────────────────────
    {
      id: "certificate-id",
      type: "text",
      content: "ID: {{certificateId}}",
      position: { x: 270, y: 534, width: 260, height: 12 },
      style: {
        fontSize: 8,
        fontFamily: "Georgia, serif",
        color: C.dark,
        textAlign: "center",
      },
    },

    // ── Decorative corner dots ─────────────────────────────────────────────
    {
      id: "dot-tl",
      type: "shape",
      content: "",
      position: { x: 36, y: 136, width: 10, height: 10 },
      style: { color: C.gold, borderRadius: "50%" },
    },
    {
      id: "dot-tr",
      type: "shape",
      content: "",
      position: { x: 754, y: 136, width: 10, height: 10 },
      style: { color: C.gold, borderRadius: "50%" },
    },
    {
      id: "dot-bl",
      type: "shape",
      content: "",
      position: { x: 36, y: 450, width: 10, height: 10 },
      style: { color: C.red, borderRadius: "50%" },
    },
    {
      id: "dot-br",
      type: "shape",
      content: "",
      position: { x: 754, y: 450, width: 10, height: 10 },
      style: { color: C.red, borderRadius: "50%" },
    },
  ],

  pageSettings: {
    width: 800,
    height: 600,
    margin: { top: 15, right: 15, bottom: 15, left: 15 },
    background: { color: JICF_COLORS.white },
  },
  fonts: [{ family: "Georgia, serif", variants: ["normal", "bold", "italic"] }],
};
