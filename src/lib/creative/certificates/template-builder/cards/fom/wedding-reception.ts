/**
 * KINGDOM Wedding Reception Card
 * Dongbo Enoch Kwateh & Fero Patience
 * Sat. 30th May, 2026 — Hangzhou City, 2PM
 *
 * Fonts: Great Vibes (calligraphy script), Playfair Display (elegant serif headings),
 *        Cormorant Garamond (refined old-style body/scripture)
 *
 * Color Palette (KINGDOM Wedding):
 *   Deep Emerald #00402E — used ONLY at: header bar, monogram, date bar
 *   Gold Accent  #C9A84C — ornamental dividers, borders, labels
 *   Coffee Bean  #3E2723 — primary text (names, scripture)
 *   Cream        #FAF3E8 — warm parchment background
 */

import { CardTemplate } from "../types";

export const KINGDOM_WEDDING_COLORS = {
  sandstoneLight: "#EDD9B8",
  emerald: "#00402E",
  coffee: "#3E2723",
  coffeeMid: "#5D3A32",
  white: "#FFFFFF",
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  cream: "#FAF3E8",
};

const W = 600; // square card width
const H = 600; // square card height

export const kingdomWeddingReceptionCard: CardTemplate = {
  id: "kingdom-wedding-reception-2026",
  name: "KINGDOM Wedding — Reception Card",
  description:
    "Luxury square reception admission card for the Dongbo–Fero Kingdom Wedding, 30th May 2026. Deep Emerald, Gold & Cream parchment palette.",
  category: "invitation",
  settings: {
    width: W,
    height: H,
    backgroundColor: KINGDOM_WEDDING_COLORS.cream,
  },
  elements: [
    // ─── Warm parchment gradient background ────────────────────────────────
    {
      id: "bg-parchment",
      type: "decoration",
      content: `<div style="
        width:${W}px; height:${H}px;
        background: radial-gradient(ellipse at 50% 25%, #FEFAF1 0%, #F8EEDD 45%, #F0DEC0 100%);
      "></div>`,
      position: { x: 0, y: 0, width: W, height: H },
      style: { zIndex: 1 },
    },

    // ─── Outer gold border ─────────────────────────────────────────────────
    {
      id: "border-outer",
      type: "decoration",
      content: `<div style="
        width:${W - 12}px; height:${H - 12}px;
        border: 2.5px solid ${KINGDOM_WEDDING_COLORS.gold};
        border-radius: 0;
      "></div>`,
      position: { x: 6, y: 6, width: W - 12, height: H - 12 },
      style: { zIndex: 5 },
    },

    // ─── Subtle inner gold frame line ──────────────────────────────────────
    {
      id: "border-inner-thin",
      type: "decoration",
      content: `<div style="
        width:${W - 26}px; height:${H - 26}px;
        border: 0.75px solid ${KINGDOM_WEDDING_COLORS.gold};
        border-radius: 0;
        opacity: 0.45;
      "></div>`,
      position: { x: 13, y: 13, width: W - 26, height: H - 26 },
      style: { zIndex: 5 },
    },

    // ─── Top emerald header bar ────────────────────────────────────────────
    {
      id: "header-bar",
      type: "decoration",
      content: `<div style="
        width: ${W - 36}px; height: 36px;
        background: ${KINGDOM_WEDDING_COLORS.emerald};
        border-radius: 0;
        display: flex; align-items: center; justify-content: center;
      "></div>`,
      position: { x: 18, y: 22, width: W - 36, height: 36 },
      style: { zIndex: 8 },
    },
    {
      id: "header-text",
      type: "decoration",
      content: `<div style="
        width:100%; height:100%;
        display:flex; align-items:center; justify-content:center;
        font-family:'Playfair Display', Georgia, serif;
        font-size:10px; font-weight:600;
        color:${KINGDOM_WEDDING_COLORS.goldLight};
        letter-spacing:3px; white-space:nowrap;
      ">✦  ADMISSION  ·  CARD  ·  RECEPTION  ✦</div>`,
      position: { x: 18, y: 22, width: W - 36, height: 36 },
      style: { zIndex: 9 },
    },

    // ─── Corner ornamental rosettes (gold, no emerald fill) ───────────────
    {
      id: "corner-tl",
      type: "decoration",
      content: `<div style="
        width:26px; height:26px; border-radius:50%;
        border: 1.5px solid ${KINGDOM_WEDDING_COLORS.gold};
        display:flex; align-items:center; justify-content:center;
        background: #FAF3E8;
        color: ${KINGDOM_WEDDING_COLORS.gold}; font-size:11px;
      ">✦</div>`,
      position: { x: 5, y: 5, width: 26, height: 26 },
      style: { zIndex: 10 },
    },
    {
      id: "corner-tr",
      type: "decoration",
      content: `<div style="
        width:26px; height:26px; border-radius:50%;
        border: 1.5px solid ${KINGDOM_WEDDING_COLORS.gold};
        display:flex; align-items:center; justify-content:center;
        background: #FAF3E8;
        color: ${KINGDOM_WEDDING_COLORS.gold}; font-size:11px;
      ">✦</div>`,
      position: { x: W - 31, y: 5, width: 26, height: 26 },
      style: { zIndex: 10 },
    },
    {
      id: "corner-bl",
      type: "decoration",
      content: `<div style="
        width:26px; height:26px; border-radius:50%;
        border: 1.5px solid ${KINGDOM_WEDDING_COLORS.gold};
        display:flex; align-items:center; justify-content:center;
        background: #FAF3E8;
        color: ${KINGDOM_WEDDING_COLORS.gold}; font-size:11px;
      ">✦</div>`,
      position: { x: 5, y: H - 31, width: 26, height: 26 },
      style: { zIndex: 10 },
    },
    {
      id: "corner-br",
      type: "decoration",
      content: `<div style="
        width:26px; height:26px; border-radius:50%;
        border: 1.5px solid ${KINGDOM_WEDDING_COLORS.gold};
        display:flex; align-items:center; justify-content:center;
        background: #FAF3E8;
        color: ${KINGDOM_WEDDING_COLORS.gold}; font-size:11px;
      ">✦</div>`,
      position: { x: W - 31, y: H - 31, width: 26, height: 26 },
      style: { zIndex: 10 },
    },

    // ─── Monogram medallion ───────────────────────────────────────────────
    {
      id: "monogram-svg",
      type: "decoration",
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="mg" cx="38%" cy="28%" r="72%">
            <stop offset="0%"   stop-color="#007A58"/>
            <stop offset="50%"  stop-color="#003D2A"/>
            <stop offset="100%" stop-color="#001510"/>
          </radialGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#F5DFA0"/>
            <stop offset="50%"  stop-color="${KINGDOM_WEDDING_COLORS.gold}"/>
            <stop offset="100%" stop-color="#A07820"/>
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.8"
                          flood-color="#001510" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Emerald fill -->
        <circle cx="50" cy="50" r="46" fill="url(#mg)"/>
        <!-- Outer gold ring -->
        <circle cx="50" cy="50" r="46"   fill="none" stroke="${KINGDOM_WEDDING_COLORS.gold}"      stroke-width="2.2"/>
        <!-- Inner bright ring -->
        <circle cx="50" cy="50" r="42.5" fill="none" stroke="${KINGDOM_WEDDING_COLORS.goldLight}" stroke-width="0.6" opacity="0.7"/>
        <!-- Dashed ornamental ring -->
        <circle cx="50" cy="50" r="38.5" fill="none" stroke="${KINGDOM_WEDDING_COLORS.gold}"
                stroke-width="0.4" stroke-dasharray="1.8 3" opacity="0.4"/>

        <!-- Cardinal dots -->
        <circle cx="50" cy="6"  r="1.3" fill="${KINGDOM_WEDDING_COLORS.gold}"/>
        <circle cx="50" cy="94" r="1.3" fill="${KINGDOM_WEDDING_COLORS.gold}"/>
        <circle cx="6"  cy="50" r="1.3" fill="${KINGDOM_WEDDING_COLORS.gold}"/>
        <circle cx="94" cy="50" r="1.3" fill="${KINGDOM_WEDDING_COLORS.gold}"/>

        <!-- "E" — Cormorant Garamond italic bold, fits cleanly -->
        <text x="30" y="62"
              font-family="'Cormorant Garamond', Georgia, serif"
              font-style="italic" font-weight="700"
              font-size="34"
              fill="url(#goldGrad)"
              text-anchor="middle"
              filter="url(#shadow)">E</text>

        <!-- Centre divider hairlines + dot -->
        <line x1="50" y1="30" x2="50" y2="70"
              stroke="${KINGDOM_WEDDING_COLORS.goldLight}" stroke-width="0.5" opacity="0.5"/>
        <circle cx="50" cy="50" r="2" fill="${KINGDOM_WEDDING_COLORS.gold}" opacity="0.8"/>

        <!-- "P" — Cormorant Garamond italic bold -->
        <text x="70" y="62"
              font-family="'Cormorant Garamond', Georgia, serif"
              font-style="italic" font-weight="700"
              font-size="34"
              fill="url(#goldGrad)"
              text-anchor="middle"
              filter="url(#shadow)">P</text>
      </svg>`,
      position: { x: W / 2 - 36, y: 62, width: 72, height: 72 },
      style: { zIndex: 12 },
    },

    // ─── Gold ornamental divider ───────────────────────────────────────────
    {
      id: "divider-1",
      type: "decoration",
      content: `<div style="
        width: 460px; height: 1px;
        background: linear-gradient(to right, transparent, ${KINGDOM_WEDDING_COLORS.gold} 20%, ${KINGDOM_WEDDING_COLORS.gold} 80%, transparent);
      "></div>`,
      position: { x: 70, y: 141, width: 460, height: 1 },
      style: { zIndex: 8 },
    },

    // ─── "KINGDOM WEDDING" ─────────────────────────────────────────────────
    {
      id: "label-kingdom",
      type: "text",
      content: "KINGDOM  WEDDING",
      position: { x: 40, y: 144, width: W - 80, height: 16 },
      style: {
        fontSize: 11,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: "600",
        color: KINGDOM_WEDDING_COLORS.gold,
        textAlign: "center",
        letterSpacing: "6px",
        zIndex: 9,
      },
    },

    // ─── "Wedding" calligraphic script — Great Vibes ───────────────────────
    {
      id: "script-wedding",
      type: "decoration",
      content: `<div style="
        font-family: 'Great Vibes', cursive;
        font-size: 48px;
        color: ${KINGDOM_WEDDING_COLORS.coffee};
        text-align: center;
        line-height: 1;
        text-shadow: 1px 1px 0 ${KINGDOM_WEDDING_COLORS.goldLight}, 2px 2px 6px rgba(62,39,35,0.12);
        width: 100%;
      ">Wedding</div>`,
      position: { x: 40, y: 166, width: W - 80, height: 54 },
      style: { zIndex: 9 },
    },

    // ─── "RECEPTION" subtitle ──────────────────────────────────────────────
    {
      id: "label-reception",
      type: "text",
      content: "—  R · E · C · E · P · T · I · O · N  —",
      position: { x: 40, y: 223, width: W - 80, height: 16 },
      style: {
        fontSize: 11,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: "600",
        color: KINGDOM_WEDDING_COLORS.coffeeMid,
        textAlign: "center",
        letterSpacing: "4px",
        zIndex: 9,
      },
    },

    // ─── Gold + rings ornament divider ────────────────────────────────────
    {
      id: "divider-rings",
      type: "decoration",
      content: `<div style="
        display:flex; align-items:center; justify-content:center; gap:10px;
        width:100%;
      ">
        <div style="flex:1; height:0.75px; background: linear-gradient(to right, transparent, ${KINGDOM_WEDDING_COLORS.gold});"></div>
        <div style="font-size:14px; color:${KINGDOM_WEDDING_COLORS.gold}; opacity:0.8;">💍</div>
        <div style="flex:1; height:0.75px; background: linear-gradient(to left, transparent, ${KINGDOM_WEDDING_COLORS.gold});"></div>
      </div>`,
      position: { x: 80, y: 242, width: 440, height: 16 },
      style: { zIndex: 9 },
    },

    // ─── Top names rule ────────────────────────────────────────────────────
    {
      id: "divider-names-top",
      type: "decoration",
      content: `<div style="width:100%; height:1px; background: linear-gradient(to right, transparent, ${KINGDOM_WEDDING_COLORS.gold} 25%, ${KINGDOM_WEDDING_COLORS.gold} 75%, transparent);"></div>`,
      position: { x: W / 2 - 155, y: 262, width: 310, height: 1 },
      style: { zIndex: 8 },
    },

    // ─── Groom name (stacked, centered) ───────────────────────────────────
    {
      id: "groom-name",
      type: "text",
      content: "DONGBO ENOCH KWATEH",
      position: { x: 40, y: 266, width: W - 80, height: 22 },
      style: {
        fontSize: 13,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: "700",
        color: KINGDOM_WEDDING_COLORS.coffee,
        textAlign: "center",
        letterSpacing: "2px",
        zIndex: 9,
      },
    },

    // ─── "&" connector — Great Vibes (large, gold, centered) ──────────────
    {
      id: "connector-and",
      type: "decoration",
      content: `<div style="
        font-family: 'Great Vibes', cursive;
        font-size: 36px;
        color: ${KINGDOM_WEDDING_COLORS.gold};
        text-align: center;
        line-height: 1;
        width: 100%;
        text-shadow: 1px 1px 4px rgba(62,39,35,0.18);
      ">&amp;</div>`,
      position: { x: 40, y: 290, width: W - 80, height: 40 },
      style: { zIndex: 9 },
    },

    // ─── Bride name (stacked, centered) ───────────────────────────────────
    {
      id: "bride-name",
      type: "text",
      content: "FERO PATIENCE",
      position: { x: 40, y: 332, width: W - 80, height: 22 },
      style: {
        fontSize: 13,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: "700",
        color: KINGDOM_WEDDING_COLORS.coffee,
        textAlign: "center",
        letterSpacing: "2px",
        zIndex: 9,
      },
    },

    // ─── Bottom names rule ─────────────────────────────────────────────────
    {
      id: "divider-names-bottom",
      type: "decoration",
      content: `<div style="width:100%; height:1px; background: linear-gradient(to right, transparent, ${KINGDOM_WEDDING_COLORS.gold} 25%, ${KINGDOM_WEDDING_COLORS.gold} 75%, transparent);"></div>`,
      position: { x: W / 2 - 155, y: 357, width: 310, height: 1 },
      style: { zIndex: 8 },
    },

    // ─── Emerald date bar ──────────────────────────────────────────────────
    {
      id: "date-bar-bg",
      type: "decoration",
      content: `<div style="
        width:${W - 80}px; height:42px;
        background: ${KINGDOM_WEDDING_COLORS.emerald};
        border-radius: 0;
        border-top: 1.5px solid ${KINGDOM_WEDDING_COLORS.goldLight};
        border-bottom: 1.5px solid ${KINGDOM_WEDDING_COLORS.goldLight};
      "></div>`,
      position: { x: 40, y: 364, width: W - 80, height: 42 },
      style: { zIndex: 8 },
    },
    {
      id: "date-text",
      type: "text",
      content: "Saturday · 30th May, 2026",
      position: { x: 40, y: 369, width: W - 80, height: 20 },
      style: {
        fontSize: 13,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: "600",
        color: KINGDOM_WEDDING_COLORS.goldLight,
        textAlign: "center",
        letterSpacing: "1px",
        zIndex: 10,
      },
    },
    {
      id: "venue-time-text",
      type: "text",
      content: "Hangzhou City  ·  2:00 PM",
      position: { x: 40, y: 388, width: W - 80, height: 16 },
      style: {
        fontSize: 11,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: "400",
        color: KINGDOM_WEDDING_COLORS.white,
        textAlign: "center",
        letterSpacing: "2px",
        zIndex: 10,
      },
    },

    // ─── Scripture verse — Cormorant Garamond italic ───────────────────────
    {
      id: "verse",
      type: "text",
      content:
        '"Therefore a man shall leave his father and his mother\nand hold fast to his wife, and they shall become one flesh."\n— Genesis 2:24',
      position: { x: 45, y: 408, width: W - 90, height: 62 },
      style: {
        fontSize: 13.5,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontStyle: "italic",
        color: KINGDOM_WEDDING_COLORS.coffeeMid,
        textAlign: "center",
        lineHeight: 1.55,
        zIndex: 9,
      },
    },

    // ─── Address ────────────────────────────────────────────────────────────
    {
      id: "address-text",
      type: "decoration",
      content: `<div style="
        font-family: Georgia, 'Noto Serif SC', serif;
        font-size: 11.5px;
        color: ${KINGDOM_WEDDING_COLORS.coffeeMid};
        text-align: center;
        letter-spacing: 0.8px;
        width: 100%;
      ">浙江省杭州市西湖区紫萱路18号</div>`,
      position: { x: 40, y: 472, width: W - 80, height: 18 },
      style: { zIndex: 9 },
    },

    // ─── RSVP block ────────────────────────────────────────────────────────
    {
      id: "rsvp-block",
      type: "decoration",
      content: `<div style="
        text-align: center;
        width: 100%;
      ">
        <div style="font-family:'Playfair Display',Georgia,serif; font-size:10px; font-weight:700; color:${KINGDOM_WEDDING_COLORS.gold}; letter-spacing:4px; margin-bottom:5px;">R · S · V · P</div>
        <div style="font-family:'Playfair Display',Georgia,serif; font-size:11px; color:${KINGDOM_WEDDING_COLORS.coffeeMid}; letter-spacing:0.5px;">+86 185 0683 2159  &nbsp;·&nbsp;  +86 195 5811 1273</div>
      </div>`,
      position: { x: 40, y: 493, width: W - 80, height: 34 },
      style: { zIndex: 9 },
    },

    // ─── Gold divider above guest section ─────────────────────────────────
    {
      id: "divider-guest",
      type: "decoration",
      content: `<div style="
        width: 360px; height: 1px;
        background: linear-gradient(to right, transparent, ${KINGDOM_WEDDING_COLORS.gold} 20%, ${KINGDOM_WEDDING_COLORS.gold} 80%, transparent);
      "></div>`,
      position: { x: W / 2 - 180, y: 533, width: 360, height: 1 },
      style: { zIndex: 8 },
    },

    // ─── "GUEST" label ─────────────────────────────────────────────────────
    {
      id: "recipient-label",
      type: "text",
      content: "GUEST",
      position: { x: 40, y: 541, width: W - 80, height: 14 },
      style: {
        fontSize: 8,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: "600",
        color: KINGDOM_WEDDING_COLORS.coffeeMid,
        textAlign: "center",
        letterSpacing: "3px",
        zIndex: 10,
      },
    },

    // ─── Blank handwriting line for guest name ─────────────────────────────
    {
      id: "guest-writing-line",
      type: "decoration",
      content: `<div style="
        display: flex;
        align-items: flex-end;
        height: 18px;
        width: 100%;
        padding-bottom: 1px;
      ">
        <div style="
          flex: 1;
          height: 1px;
          background: ${KINGDOM_WEDDING_COLORS.coffeeMid};
          opacity: 0.4;
        "></div>
      </div>`,
      position: { x: W / 2 - 100, y: 541, width: 200, height: 14 },
      style: { zIndex: 10 },
    },
  ],
};
