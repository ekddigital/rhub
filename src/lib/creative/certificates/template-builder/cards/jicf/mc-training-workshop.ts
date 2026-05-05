/**
 * JICF MC Training Workshop Promotional Flyer
 * A beautiful promotional flyer for the MC Training Workshop event
 */

import { CardTemplate } from "../types";
import { JICF_COLORS } from "./constants";

export const jicfMCTrainingWorkshop: CardTemplate = {
  id: "jicf-mc-training-workshop",
  name: "MC Training Workshop Flyer",
  description:
    "Promotional flyer for JICF MC Training Workshop with guest speaker - optimized for social media",
  category: "invitation",
  elements: [
    // JICF Logo
    {
      id: "jicf-logo",
      type: "image",
      content: "/JICF_LOGO1.png",
      position: { x: 50, y: 20, width: 120, height: 120 },
      style: {
        borderRadius: "10px",
      },
    }, // Main Header
    {
      id: "jicf-header",
      type: "text",
      content: "JINAN INTERNATIONAL\nCHRISTIAN FELLOWSHIP (JICF)",
      position: { x: 50, y: 30, width: 700, height: 70 },
      style: {
        fontSize: 22,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.white,
        textAlign: "center",
        lineHeight: 1.2,
      },
    },

    // MC Department subtitle
    {
      id: "mc-department",
      type: "text",
      content: "MC DEPARTMENT",
      position: { x: 50, y: 100, width: 700, height: 30 },
      style: {
        fontSize: 18,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.yellow,
        textAlign: "center",
        letterSpacing: "2px",
      },
    }, // Main Event Title
    {
      id: "event-title",
      type: "text",
      content: "MC TRAINING\nWORKSHOP",
      position: { x: 50, y: 140, width: 700, height: 80 },
      style: {
        fontSize: 36,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.white,
        textAlign: "center",
        lineHeight: 1.1,
      },
    }, // Speaker photo container background
    {
      id: "photo-container",
      type: "decoration",
      content: "",
      position: { x: 250, y: 180, width: 300, height: 300 },
      style: {
        borderRadius: "20px",
        border: `4px solid ${JICF_COLORS.yellow}`,
      },
    },

    // Speaker photo - smaller for square format
    {
      id: "speaker-photo",
      type: "image",
      content: "/jicf/Nelly.png",
      position: { x: 260, y: 190, width: 280, height: 280 },
      style: {
        borderRadius: "15px",
      },
    }, // Featured Speaker label
    {
      id: "speaker-label",
      type: "text",
      content: "FEATURED SPEAKER",
      position: { x: 50, y: 490, width: 700, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.yellow,
        textAlign: "center",
        letterSpacing: "1px",
      },
    },

    // Speaker name
    {
      id: "speaker-name",
      type: "text",
      content: "Mrs. Uchenwoke Ogochukwu Nneka",
      position: { x: 50, y: 520, width: 700, height: 30 },
      style: {
        fontSize: 20,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.white,
        textAlign: "center",
      },
    }, // Event details background
    {
      id: "details-background",
      type: "decoration",
      content: "",
      position: { x: 40, y: 570, width: 720, height: 160 },
      style: {
        border: `3px solid ${JICF_COLORS.yellow}`,
        opacity: 0.95,
      },
    },

    // Zoom logo
    {
      id: "zoom-logo",
      type: "text",
      content: "🔗 ZOOM",
      position: { x: 320, y: 550, width: 160, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        textAlign: "center",
        color: JICF_COLORS.white,
        border: `2px solid ${JICF_COLORS.yellow}`,
        borderRadius: "8px",
        padding: "6px",
      },
    }, // Date and time
    {
      id: "event-date",
      type: "text",
      content:
        "📅 SUNDAY, JUNE 22ND, 2025\n🕒 8:00 PM Beijing Time\n📹 JOIN US ON ZOOM",
      position: { x: 60, y: 590, width: 680, height: 75 },
      style: {
        fontSize: 18,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.white,
        textAlign: "center",
        lineHeight: 1.4,
      },
    }, // Workshop description
    {
      id: "workshop-description",
      type: "text",
      content:
        "Join us for an interactive and Spirit-led time of learning\nand encouragement for current and aspiring MCs\n\n🎯 NO REGISTRATION REQUIRED - JUST JOIN!",
      position: { x: 60, y: 670, width: 680, height: 60 },
      style: {
        fontSize: 14,
        fontFamily: "Georgia, serif",
        color: JICF_COLORS.white,
        textAlign: "center",
        lineHeight: 1.3,
        fontStyle: "italic",
      },
    }, // Contact information    // Contact information
    {
      id: "contact-info",
      type: "text",
      content: "For Zoom link: Contact JICF MC Department | Coordinator: Ouita",
      position: { x: 50, y: 740, width: 700, height: 25 },
      style: {
        fontSize: 12,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.yellow,
        textAlign: "center",
      },
    },

    // Decorative elements
    {
      id: "decorative-stars-left",
      type: "decoration",
      content: "✨",
      position: { x: 120, y: 160, width: 50, height: 50 },
      style: {
        fontSize: 35,
        color: JICF_COLORS.yellow,
        textAlign: "center",
      },
    },

    {
      id: "decorative-stars-right",
      type: "decoration",
      content: "✨",
      position: { x: 630, y: 160, width: 50, height: 50 },
      style: {
        fontSize: 35,
        color: JICF_COLORS.yellow,
        textAlign: "center",
      },
    },

    // Additional decorative crosses
    {
      id: "decorative-cross-left",
      type: "decoration",
      content: "✞",
      position: { x: 80, y: 700, width: 40, height: 40 },
      style: {
        fontSize: 28,
        color: JICF_COLORS.yellow,
        textAlign: "center",
      },
    },

    {
      id: "decorative-cross-right",
      type: "decoration",
      content: "✞",
      position: { x: 680, y: 700, width: 40, height: 40 },
      style: {
        fontSize: 28,
        color: JICF_COLORS.yellow,
        textAlign: "center",
      },
    }, // Bottom decorative border
    {
      id: "bottom-border",
      type: "decoration",
      content: "",
      position: { x: 50, y: 790, width: 700, height: 4 },
      style: {
        border: `4px solid ${JICF_COLORS.yellow}`,
      },
    },
  ],
  settings: {
    width: 800,
    height: 800, // Square format for social media
    backgroundColor: JICF_COLORS.darkBlue,
    backgroundImage: `linear-gradient(45deg, ${JICF_COLORS.darkBlue} 0%, ${JICF_COLORS.blue} 50%, ${JICF_COLORS.darkBlue} 100%)`,
  },
};
