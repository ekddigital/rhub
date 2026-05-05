/**
 * JICF Invitation Card Templates
 */

import { CardTemplate } from "../types";
import { JICF_COLORS } from "./constants";

// Celebration Invitation Template
export const celebrationInvite: CardTemplate = {
  id: "jicf-celebration-invite",
  name: "JICF Graduates Celebration Invitation",
  description:
    "Beautiful invitation card for the JICF Graduates Celebration event",
  category: "invitation",
  settings: {
    width: 500,
    height: 800,
    backgroundColor: JICF_COLORS.lightBlue,
  },
  elements: [
    // Elegant background gradient
    {
      id: "background-gradient",
      type: "decoration",
      content: `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #fdf2e9 0%, #faf0e6 25%, #f0f8ff 50%, #e6f3ff 75%, #ddeeff 100%); border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);"></div>`,
      position: { x: 0, y: 0, width: 500, height: 800 },
      style: { zIndex: 1 },
    },

    // Decorative border
    {
      id: "decorative-border",
      type: "decoration",
      content: `<div style="position: absolute; top: 15px; left: 15px; width: calc(100% - 30px); height: calc(100% - 30px); border: 3px solid ${JICF_COLORS.gold}; border-radius: 15px; background: linear-gradient(45deg, transparent 30%, rgba(237, 28, 36, 0.05) 50%, transparent 70%);"></div>`,
      position: { x: 0, y: 0, width: 500, height: 700 },
      style: { zIndex: 2 },
    },

    // Top floral decoration with celebration theme
    {
      id: "celebration-flowers",
      type: "decoration",
      content: `<svg viewBox="0 0 400 120" style="width: 100%; height: 100%;">
        <g opacity="0.8">
          <!-- Central celebration bouquet -->
          <g transform="translate(200,60)">
            <!-- Large celebration flower -->
            <circle cx="0" cy="0" r="20" fill="${JICF_COLORS.red}" opacity="0.3"/>
            <circle cx="0" cy="0" r="15" fill="${JICF_COLORS.red}" opacity="0.6"/>
            <circle cx="0" cy="0" r="10" fill="${JICF_COLORS.red}" opacity="0.9"/>
            <!-- Celebration rays -->
            <path d="M0,-20 L5,-35 L-5,-35 Z" fill="${JICF_COLORS.yellow}" opacity="0.7"/>
            <path d="M20,0 L35,5 L35,-5 Z" fill="${JICF_COLORS.yellow}" opacity="0.7"/>
            <path d="M0,20 L5,35 L-5,35 Z" fill="${JICF_COLORS.yellow}" opacity="0.7"/>
            <path d="M-20,0 L-35,5 L-35,-5 Z" fill="${JICF_COLORS.yellow}" opacity="0.7"/>
          </g>
          
          <!-- Side celebration flowers -->
          <g transform="translate(120,40)">
            <circle cx="0" cy="0" r="12" fill="${JICF_COLORS.blue}" opacity="0.7"/>
            <circle cx="0" cy="0" r="8" fill="${JICF_COLORS.blue}" opacity="0.9"/>
            <path d="M0,-12 Q6,-18 12,-12 Q6,-6 0,-12" fill="${JICF_COLORS.yellow}" opacity="0.8"/>
          </g>
          
          <g transform="translate(280,40)">
            <circle cx="0" cy="0" r="12" fill="${JICF_COLORS.purple}" opacity="0.7"/>
            <circle cx="0" cy="0" r="8" fill="${JICF_COLORS.purple}" opacity="0.9"/>
            <path d="M0,-12 Q-6,-18 -12,-12 Q-6,-6 0,-12" fill="${JICF_COLORS.yellow}" opacity="0.8"/>
          </g>
          
          <!-- Festive leaves and stems -->
          <path d="M200,80 Q150,100 120,90" stroke="#4caf50" stroke-width="2" fill="none" opacity="0.6"/>
          <path d="M200,80 Q250,100 280,90" stroke="#4caf50" stroke-width="2" fill="none" opacity="0.6"/>
          <ellipse cx="160" cy="85" rx="6" ry="12" fill="#4caf50" opacity="0.6" transform="rotate(-20 160 85)"/>
          <ellipse cx="240" cy="85" rx="6" ry="12" fill="#4caf50" opacity="0.6" transform="rotate(20 240 85)"/>
          
          <!-- Celebration confetti -->
          <circle cx="100" cy="20" r="3" fill="${JICF_COLORS.yellow}" opacity="0.8"/>
          <circle cx="300" cy="30" r="2" fill="${JICF_COLORS.red}" opacity="0.8"/>
          <circle cx="80" cy="80" r="2" fill="${JICF_COLORS.blue}" opacity="0.8"/>
          <circle cx="320" cy="70" r="3" fill="${JICF_COLORS.purple}" opacity="0.8"/>
          <rect x="110" y="15" width="3" height="3" fill="${JICF_COLORS.gold}" opacity="0.8" transform="rotate(45 110 15)"/>
          <rect x="290" y="25" width="4" height="4" fill="${JICF_COLORS.green}" opacity="0.8" transform="rotate(45 290 25)"/>
        </g>
      </svg>`,
      position: { x: 50, y: 40, width: 400, height: 120 },
      style: { zIndex: 3 },
    },

    // JICF Logo
    {
      id: "jicf-logo",
      type: "image",
      content: "/JICF_LOGO1.png",
      position: { x: 200, y: 180, width: 100, height: 100 },
      style: {
        borderRadius: "50%",
        border: `3px solid ${JICF_COLORS.gold}`,
        opacity: 0.95,
        zIndex: 4,
      },
    },

    // Main invitation title
    {
      id: "invitation-title",
      type: "text",
      content: "You're Invited!",
      position: { x: 50, y: 300, width: 400, height: 50 },
      style: {
        fontSize: 36,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        letterSpacing: "2px",
        zIndex: 4,
      },
    },

    // Event title
    {
      id: "event-title",
      type: "text",
      content: "JICF GRADUATES CELEBRATION",
      position: { x: 50, y: 360, width: 400, height: 40 },
      style: {
        fontSize: 24,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        letterSpacing: "1px",
        zIndex: 4,
      },
    },

    // Date and time
    {
      id: "event-datetime",
      type: "text",
      content:
        "Sunday, June 15, 2025\nService starts at 2:50 PM PROMPTLY\nChurch doors open at 2:30 PM",
      position: { x: 50, y: 420, width: 400, height: 80 },
      style: {
        fontSize: 18,
        fontFamily: "Georgia, serif",
        fontWeight: "600",
        color: JICF_COLORS.purple,
        textAlign: "center",
        lineHeight: 1.3,
        zIndex: 4,
      },
    },

    // Invitation message
    {
      id: "invitation-message",
      type: "text",
      content:
        "Join us as we celebrate our amazing graduates!\nBring your family and friends.\nLet's make this a memorable celebration together!\n\nDon't forget - Invite others to come!",
      position: { x: 50, y: 520, width: 400, height: 100 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        fontWeight: "normal",
        color: JICF_COLORS.darkBlue,
        textAlign: "center",
        lineHeight: 1.5,
        fontStyle: "italic",
        zIndex: 4,
      },
    },

    // Reminder note
    {
      id: "reminder-note",
      type: "text",
      content:
        "⚠️ REMINDER: Please arrive on time!\nInvite others to join this special celebration!",
      position: { x: 50, y: 640, width: 400, height: 50 },
      style: {
        fontSize: 14,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        lineHeight: 1.3,
        zIndex: 4,
      },
    },

    // Bottom decorative elements
    {
      id: "bottom-decoration",
      type: "decoration",
      content:
        '<svg viewBox="0 0 400 80" style="width: 100%; height: 100%;"><g opacity="0.7"><path d="M50,40 Q200,20 350,40" stroke="' +
        JICF_COLORS.gold +
        '" stroke-width="3" fill="none"/><path d="M50,40 Q200,60 350,40" stroke="' +
        JICF_COLORS.gold +
        '" stroke-width="3" fill="none"/></g></svg>',
      position: { x: 50, y: 710, width: 400, height: 80 },
      style: { zIndex: 3 },
    },

    // Optional custom message
    {
      id: "custom-message",
      type: "text",
      content: "{{customMessage}}",
      position: { x: 50, y: 700, width: 400, height: 30 },
      style: {
        fontSize: 12,
        fontFamily: "Georgia, serif",
        fontWeight: "italic",
        color: JICF_COLORS.gold,
        textAlign: "center",
        zIndex: 4,
      },
    },
  ],
};

// Today is the Day Template
export const todayIsTheDay: CardTemplate = {
  id: "jicf-today-celebration",
  name: "Today is the Day - JICF Celebration",
  description:
    "Exciting celebration day card for the day of the JICF Graduates Celebration",
  category: "invitation",
  settings: {
    width: 500,
    height: 750,
    backgroundColor: JICF_COLORS.lightYellow,
  },
  elements: [
    // Vibrant background with celebration theme
    {
      id: "celebration-background",
      type: "decoration",
      content: `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(45deg, #fff3e0 0%, #ffe0b2 25%, #ffcc02 50%, #ff8f00 75%, #e65100 100%); border-radius: 25px; box-shadow: 0 25px 50px rgba(0,0,0,0.15);"></div>`,
      position: { x: 0, y: 0, width: 500, height: 750 },
      style: { zIndex: 1 },
    },

    // Celebration burst border
    {
      id: "celebration-border",
      type: "decoration",
      content: `<div style="position: absolute; top: 20px; left: 20px; width: calc(100% - 40px); height: calc(100% - 40px); border: 4px solid ${JICF_COLORS.red}; border-radius: 20px; background: linear-gradient(135deg, transparent 20%, rgba(255, 215, 0, 0.1) 50%, transparent 80%);"></div>`,
      position: { x: 0, y: 0, width: 500, height: 750 },
      style: { zIndex: 2 },
    },

    // JICF Logo
    {
      id: "jicf-logo-today",
      type: "image",
      content: "/JICF_LOGO1.png",
      position: { x: 200, y: 150, width: 100, height: 100 },
      style: {
        borderRadius: "50%",
        border: `4px solid ${JICF_COLORS.gold}`,
        opacity: 0.95,
        zIndex: 4,
      },
    },

    // Main "Today is the Day" title
    {
      id: "today-title",
      type: "text",
      content: "TODAY IS THE DAY!",
      position: { x: 50, y: 270, width: 400, height: 50 },
      style: {
        fontSize: 32,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        letterSpacing: "3px",
        zIndex: 4,
      },
    },

    // Event title
    {
      id: "event-title-today",
      type: "text",
      content: "JICF GRADUATES CELEBRATION",
      position: { x: 50, y: 330, width: 400, height: 40 },
      style: {
        fontSize: 22,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        letterSpacing: "1px",
        zIndex: 4,
      },
    },

    // Service time reminder
    {
      id: "service-time-today",
      type: "text",
      content: "Service starts at 2:50 PM\nDoors open at 2:30 PM",
      position: { x: 50, y: 380, width: 400, height: 60 },
      style: {
        fontSize: 18,
        fontFamily: "Georgia, serif",
        fontWeight: "600",
        color: JICF_COLORS.purple,
        textAlign: "center",
        lineHeight: 1.4,
        zIndex: 4,
      },
    },

    // Dinner announcement
    {
      id: "dinner-announcement",
      type: "text",
      content:
        "🍽️ DINNER TIME AFTER SERVICE! 🍽️\nDon't miss out on the celebration feast!\nStay for fellowship and delicious food!",
      position: { x: 50, y: 460, width: 400, height: 80 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.darkBlue,
        textAlign: "center",
        lineHeight: 1.4,
        zIndex: 4,
      },
    },

    // Celebration message
    {
      id: "celebration-message-today",
      type: "text",
      content:
        "This is our moment to celebrate!\nCome with joy and thanksgiving.\nLet's honor our amazing graduates together!",
      position: { x: 50, y: 560, width: 400, height: 70 },
      style: {
        fontSize: 15,
        fontFamily: "Georgia, serif",
        fontWeight: "normal",
        color: JICF_COLORS.darkBlue,
        textAlign: "center",
        lineHeight: 1.5,
        fontStyle: "italic",
        zIndex: 4,
      },
    },

    // Final reminder
    {
      id: "final-reminder",
      type: "text",
      content: "🎉 See you there! 🎉",
      position: { x: 50, y: 650, width: 400, height: 30 },
      style: {
        fontSize: 20,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        zIndex: 4,
      },
    },

    // Optional custom message
    {
      id: "custom-message-today",
      type: "text",
      content: "{{customMessage}}",
      position: { x: 50, y: 680, width: 400, height: 30 },
      style: {
        fontSize: 12,
        fontFamily: "Georgia, serif",
        fontWeight: "italic",
        color: JICF_COLORS.gold,
        textAlign: "center",
        zIndex: 4,
      },
    },
  ],
};
