/**
 * JULS Graduation Templates
 * (Placeholder - to be filled with JULS-specific templates)
 */

import { CardTemplate } from "../types";
import { JULS_COLORS } from "./constants";

// Placeholder template - to be implemented
export const julsSampleGrad: CardTemplate = {
  id: "juls-sample-grad",
  name: "JULS Sample Graduation Card",
  description: "Sample graduation card for JULS",
  category: "graduation",
  settings: {
    width: 500,
    height: 700,
    backgroundColor: JULS_COLORS.white,
  },
  elements: [
    {
      id: "placeholder-title",
      type: "text",
      content: "JULS Graduation Template",
      position: { x: 50, y: 100, width: 400, height: 50 },
      style: {
        fontSize: 24,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JULS_COLORS.primary,
        textAlign: "center",
        zIndex: 1,
      },
    },
    {
      id: "placeholder-note",
      type: "text",
      content:
        "This is a placeholder template.\nJULS-specific templates to be added.",
      position: { x: 50, y: 200, width: 400, height: 100 },
      style: {
        fontSize: 16,
        fontFamily: "Arial, sans-serif",
        color: JULS_COLORS.darkGray,
        textAlign: "center",
        lineHeight: 1.5,
        zIndex: 1,
      },
    },
  ],
};
