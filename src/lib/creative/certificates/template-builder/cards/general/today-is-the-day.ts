/**
 * Today Is The Day Template (General)
 */

import { CardTemplate } from "../../card-templates";
import { JICF_COLORS, FLORAL_DECORATIONS } from "../../card-templates";

export const todayIsTheDayTemplate: CardTemplate = {
  id: "today-is-the-day",
  name: "Today Is The Day",
  description: "Inspirational card celebrating today as a special day",
  category: "blessing",
  settings: {
    width: 500,
    height: 700,
    backgroundColor: JICF_COLORS.lightYellow,
  },
  elements: [
    // Background decoration
    {
      id: "bg-decoration-1",
      type: "decoration",
      content: FLORAL_DECORATIONS.floralBorder,
      position: { x: 25, y: 50, width: 450, height: 50 },
      style: {
        opacity: 0.5,
        zIndex: 1,
      },
    },
    // Main Title
    {
      id: "main-title",
      type: "text",
      content: "TODAY IS THE DAY",
      position: { x: 50, y: 50, width: 400, height: 50 },
      style: {
        fontSize: 36,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Subtitle
    {
      id: "subtitle",
      type: "text",
      content: "THE LORD HAS MADE",
      position: { x: 50, y: 120, width: 400, height: 30 },
      style: {
        fontSize: 20,
        fontFamily: "Georgia, serif",
        color: JICF_COLORS.blue,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Bible Verse
    {
      id: "bible-verse",
      type: "text",
      content: `"This is the day the Lord has made; 
let us rejoice and be glad in it."

- Psalm 118:24`,
      position: { x: 70, y: 200, width: 360, height: 150 },
      style: {
        fontSize: 22,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        color: JICF_COLORS.darkBlue,
        textAlign: "center",
        lineHeight: 1.6,
        zIndex: 10,
      },
    },
    // Recipient Name
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 50, y: 380, width: 400, height: 30 },
      style: {
        fontSize: 24,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Inspirational Message
    {
      id: "inspirational-message",
      type: "text",
      content: `Today is your day to shine! 
Embrace every moment with joy and gratitude.
God has wonderful plans for you.

May this day be filled with His blessings,
peace, and endless possibilities.`,
      position: { x: 70, y: 440, width: 360, height: 160 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
        lineHeight: 1.6,
        zIndex: 10,
      },
    },
    // Custom Message
    {
      id: "custom-message",
      type: "text",
      content: "{{customMessage}}",
      position: { x: 70, y: 620, width: 360, height: 50 },
      style: {
        fontSize: 14,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        color: JICF_COLORS.purple,
        textAlign: "center",
        lineHeight: 1.5,
        zIndex: 10,
      },
    },
    // Bottom decoration
    {
      id: "bg-decoration-2",
      type: "decoration",
      content: FLORAL_DECORATIONS.floralBorder,
      position: { x: 25, y: 600, width: 450, height: 50 },
      style: {
        opacity: 0.5,
        transform: "rotate(180deg)",
        zIndex: 1,
      },
    },
  ],
};
