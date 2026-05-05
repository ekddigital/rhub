/**
 * JICF Graduation Card Templates
 */

import { CardTemplate } from "../types";
import { JICF_COLORS, FLORAL_DECORATIONS } from "./constants";

// Card Template 1: Graduation Blessing
export const gradBlessing: CardTemplate = {
  id: "jicf-grad-blessing",
  name: "Graduation Blessing Card",
  description: "Beautiful graduation blessing with floral design",
  category: "graduation",
  settings: {
    width: 500,
    height: 700,
    backgroundColor: JICF_COLORS.lightBlue,
  },
  elements: [
    // Background gradient
    {
      id: "background",
      type: "decoration",
      content: `<div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, ${JICF_COLORS.lightBlue} 0%, ${JICF_COLORS.white} 50%, ${JICF_COLORS.lightYellow} 100%);
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      "></div>`,
      position: { x: 0, y: 0, width: 500, height: 700 },
      style: { zIndex: 0 },
    },

    // Top floral decoration
    {
      id: "top-decoration",
      type: "decoration",
      content: FLORAL_DECORATIONS.elegantRoses,
      position: { x: 300, y: 20, width: 120, height: 120 },
      style: { opacity: 0.6, zIndex: 1 },
    },

    // JICF Logo
    {
      id: "jicf-logo",
      type: "image",
      content: "/JICF_LOGO1.png",
      position: { x: 200, y: 15, width: 100, height: 50 },
      style: { zIndex: 4 },
    },

    // Main title
    {
      id: "title",
      type: "text",
      content: "A Graduation Blessing",
      position: { x: 50, y: 140, width: 400, height: 60 },
      style: {
        fontSize: 28,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        lineHeight: 1.2,
        zIndex: 3,
      },
    },

    // Main blessing text
    {
      id: "blessing-text",
      type: "text",
      content: `May the Lord guide your every step
as you enter this exciting new season.
May your gifts make room for you,
your heart remain tender toward truth,
and your mind stay curious and bold.

Wherever you go, may you carry
Christ's love, peace, and wisdom.

This graduation is not your finish line—
it is your launching point.
Go forward in faith.`,
      position: { x: 50, y: 220, width: 400, height: 300 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
        lineHeight: 1.6,
        zIndex: 3,
      },
    },

    // Bottom message
    {
      id: "bottom-message",
      type: "text",
      content: `We are proud of you.
We are praying for you.`,
      position: { x: 50, y: 530, width: 400, height: 60 },
      style: {
        fontSize: 18,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        lineHeight: 1.4,
        zIndex: 3,
      },
    },

    // Congratulations
    {
      id: "congratulations",
      type: "text",
      content: "Congratulations, Graduate!",
      position: { x: 50, y: 600, width: 400, height: 40 },
      style: {
        fontSize: 24,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        zIndex: 3,
      },
    },

    // Church name
    {
      id: "church-name",
      type: "text",
      content: "Jinan International Christian Fellowship",
      position: { x: 50, y: 650, width: 400, height: 30 },
      style: {
        fontSize: 14,
        fontFamily: "Arial, sans-serif",
        color: JICF_COLORS.blue,
        textAlign: "center",
        zIndex: 3,
      },
    },

    // Bottom floral decoration
    {
      id: "bottom-decoration",
      type: "decoration",
      content: FLORAL_DECORATIONS.floralBorder,
      position: { x: 50, y: 550, width: 400, height: 40 },
      style: { opacity: 0.4, zIndex: 1 },
    },

    // Optional recipient name
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 50, y: 680, width: 400, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "Arial, sans-serif",
        fontWeight: "italic",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
        zIndex: 3,
      },
    },
  ],
};

// Card Template 2: Biblical Verse (Upside Down)
export const biblicalVerse: CardTemplate = {
  id: "jicf-biblical-verse",
  name: "Biblical Verse Card (Upside Down)",
  description:
    "Beautiful card with upside down biblical text and floral design",
  category: "graduation",
  settings: {
    width: 500,
    height: 700,
    backgroundColor: JICF_COLORS.lightRed,
  },
  elements: [
    // Background gradient
    {
      id: "background",
      type: "decoration",
      content: `<div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, ${JICF_COLORS.lightRed} 0%, ${JICF_COLORS.white} 50%, ${JICF_COLORS.lightYellow} 100%);
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      "></div>`,
      position: { x: 0, y: 0, width: 500, height: 700 },
      style: { zIndex: 0 },
    },

    // Top corner roses
    {
      id: "top-left-rose",
      type: "decoration",
      content: FLORAL_DECORATIONS.roseCorner,
      position: { x: 20, y: 20, width: 80, height: 80 },
      style: { opacity: 0.7, zIndex: 1 },
    },

    {
      id: "top-right-rose",
      type: "decoration",
      content: FLORAL_DECORATIONS.roseCorner,
      position: { x: 400, y: 20, width: 80, height: 80 },
      style: { opacity: 0.7, zIndex: 1, transform: "rotate(90deg)" },
    },

    // Church logo
    {
      id: "church-logo",
      type: "image",
      content: "/JICF_LOGO1.png",
      position: { x: 210, y: 30, width: 80, height: 80 },
      style: { zIndex: 2 },
    },

    // Congratulations at top
    {
      id: "congratulations",
      type: "text",
      content: "Congratulations, Graduate!",
      position: { x: 50, y: 130, width: 400, height: 40 },
      style: {
        fontSize: 24,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        zIndex: 3,
      },
    },

    // Subtitle
    {
      id: "subtitle",
      type: "text",
      content: '"Not the End, But the Beginning"',
      position: { x: 50, y: 180, width: 400, height: 30 },
      style: {
        fontSize: 18,
        fontFamily: "Georgia, serif",
        fontWeight: "italic",
        color: JICF_COLORS.blue,
        textAlign: "center",
        zIndex: 3,
      },
    },

    // Regular Bible verse
    {
      id: "bible-verse",
      type: "text",
      content: `"For I know the plans I have for you,"
declares the Lord...
— Jeremiah 29:11`,
      position: { x: 50, y: 230, width: 400, height: 80 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
        lineHeight: 1.5,
        zIndex: 3,
      },
    },

    // Upside down inspirational text
    {
      id: "upside-text",
      type: "text",
      content: `Being confident of this,
that he who began a good work in you
will carry it on to completion
until the day of Christ Jesus.
— Philippians 1:6`,
      position: { x: 50, y: 350, width: 400, height: 120 },
      style: {
        fontSize: 14,
        fontFamily: "Georgia, serif",
        color: JICF_COLORS.blue,
        textAlign: "center",
        lineHeight: 1.4,
        transform: "rotate(180deg)",
        zIndex: 3,
      },
    },

    // Church name
    {
      id: "church-name",
      type: "text",
      content: "Jinan International Christian Fellowship",
      position: { x: 50, y: 500, width: 400, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        zIndex: 3,
      },
    },

    // Bottom corner roses
    {
      id: "bottom-left-rose",
      type: "decoration",
      content: FLORAL_DECORATIONS.roseCorner,
      position: { x: 20, y: 600, width: 80, height: 80 },
      style: { opacity: 0.7, zIndex: 1, transform: "rotate(270deg)" },
    },

    {
      id: "bottom-right-rose",
      type: "decoration",
      content: FLORAL_DECORATIONS.roseCorner,
      position: { x: 400, y: 600, width: 80, height: 80 },
      style: { opacity: 0.7, zIndex: 1, transform: "rotate(180deg)" },
    },

    // Optional recipient name
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 50, y: 680, width: 400, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "Arial, sans-serif",
        fontWeight: "italic",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
        zIndex: 3,
      },
    },
  ],
};

// Card Template 3: Elegant Roses Design
export const elegantRoses: CardTemplate = {
  id: "jicf-elegant-roses",
  name: "Elegant Roses Graduation Card",
  description: "Sophisticated design with beautiful roses and gold accents",
  category: "graduation",
  settings: {
    width: 500,
    height: 700,
    backgroundColor: JICF_COLORS.white,
  },
  elements: [
    // Elegant background
    {
      id: "background",
      type: "decoration",
      content: `<div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 50%, #e8f4f8 100%);
        border: 3px solid ${JICF_COLORS.gold};
        border-radius: 25px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.15);
      "></div>`,
      position: { x: 0, y: 0, width: 500, height: 700 },
      style: { zIndex: 0 },
    },

    // Large central rose arrangement
    {
      id: "central-roses",
      type: "decoration",
      content: FLORAL_DECORATIONS.elegantRoses,
      position: { x: 150, y: 80, width: 200, height: 200 },
      style: { opacity: 0.8, zIndex: 1 },
    },

    // Church logo with gold frame
    {
      id: "church-logo",
      type: "image",
      content: "/JICF_LOGO1.png",
      position: { x: 210, y: 30, width: 80, height: 80 },
      style: {
        zIndex: 2,
        border: `2px solid ${JICF_COLORS.gold}`,
        borderRadius: "50%",
        padding: "5px",
      },
    },

    // Elegant title with gold accent
    {
      id: "title",
      type: "text",
      content: "GRADUATION BLESSING",
      position: { x: 50, y: 300, width: 400, height: 50 },
      style: {
        fontSize: 26,
        fontFamily: "Times New Roman, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        letterSpacing: "2px",
        zIndex: 3,
      },
    },

    // Elegant blessing message
    {
      id: "blessing-message",
      type: "text",
      content: `May God's grace guide your journey ahead.
May His wisdom illuminate your path,
and His love sustain you always.

You have been equipped for greatness.
Step boldly into your destiny.`,
      position: { x: 60, y: 370, width: 380, height: 140 },
      style: {
        fontSize: 16,
        fontFamily: "Times New Roman, serif",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
        lineHeight: 1.6,
        fontStyle: "italic",
        zIndex: 3,
      },
    },

    // Congratulations with gold color
    {
      id: "congratulations",
      type: "text",
      content: "Congratulations, Graduate!",
      position: { x: 50, y: 530, width: 400, height: 40 },
      style: {
        fontSize: 24,
        fontFamily: "Times New Roman, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        zIndex: 3,
      },
    },

    // Church name in elegant style
    {
      id: "church-name",
      type: "text",
      content: "JINAN INTERNATIONAL CHRISTIAN FELLOWSHIP",
      position: { x: 50, y: 590, width: 400, height: 30 },
      style: {
        fontSize: 12,
        fontFamily: "Times New Roman, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        letterSpacing: "1px",
        zIndex: 3,
      },
    },

    // Decorative gold line
    {
      id: "decorative-line",
      type: "decoration",
      content: `<div style="
        width: 200px;
        height: 2px;
        background: linear-gradient(to right, transparent, ${JICF_COLORS.gold}, transparent);
        margin: 0 auto;
      "></div>`,
      position: { x: 150, y: 580, width: 200, height: 2 },
      style: { zIndex: 2 },
    },

    // Optional recipient name in elegant style
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 50, y: 640, width: 400, height: 25 },
      style: {
        fontSize: 14,
        fontFamily: "Times New Roman, serif",
        fontWeight: "italic",
        color: JICF_COLORS.gold,
        textAlign: "center",
        zIndex: 3,
      },
    },
  ],
};
