/**
 * General Card Templates
 * Templates that can be used across organizations
 */

import { CardTemplate } from "../types";

// General color scheme
const GENERAL_COLORS = {
  primary: "#1f2937",
  secondary: "#374151",
  accent: "#3b82f6",
  white: "#ffffff",
  lightGray: "#f8f9fa",
  darkGray: "#343a40",
};

// Simple graduation blessing template
export const generalGradBlessing: CardTemplate = {
  id: "general-grad-blessing",
  name: "General Graduation Blessing",
  description:
    "A simple graduation blessing card that can be customized for any organization",
  category: "graduation",
  settings: {
    width: 500,
    height: 700,
    backgroundColor: GENERAL_COLORS.white,
  },
  elements: [
    {
      id: "title",
      type: "text",
      content: "Congratulations Graduate!",
      position: { x: 50, y: 100, width: 400, height: 60 },
      style: {
        fontSize: 28,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: GENERAL_COLORS.primary,
        textAlign: "center",
        zIndex: 1,
      },
    },
    {
      id: "blessing",
      type: "text",
      content:
        "May this achievement be the beginning of many great accomplishments to come. Wishing you continued success in all your future endeavors.",
      position: { x: 50, y: 200, width: 400, height: 200 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        color: GENERAL_COLORS.secondary,
        textAlign: "center",
        lineHeight: 1.6,
        zIndex: 1,
      },
    },
    {
      id: "organization-name",
      type: "text",
      content: "{{organizationName}}",
      position: { x: 50, y: 450, width: 400, height: 30 },
      style: {
        fontSize: 14,
        fontFamily: "Arial, sans-serif",
        color: GENERAL_COLORS.accent,
        textAlign: "center",
        zIndex: 1,
      },
    },
  ],
};
