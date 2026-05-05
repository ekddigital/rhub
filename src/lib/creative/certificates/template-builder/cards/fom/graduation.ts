/**
 * FOM Graduation Templates
 * (Placeholder - to be filled with FOM-specific templates)
 */

import { CardTemplate } from "../types";
import { FOM_COLORS } from "./constants";

// Placeholder template - to be implemented
export const fomSampleGrad: CardTemplate = {
  id: "fom-sample-grad",
  name: "FOM Sample Graduation Card",
  description: "Sample graduation card for FOM",
  category: "graduation",
  settings: {
    width: 500,
    height: 700,
    backgroundColor: FOM_COLORS.white,
  },
  elements: [
    {
      id: "placeholder-title",
      type: "text",
      content: "FOM Graduation Template",
      position: { x: 50, y: 100, width: 400, height: 50 },
      style: {
        fontSize: 24,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: FOM_COLORS.primary,
        textAlign: "center",
        zIndex: 1,
      },
    },
    {
      id: "placeholder-note",
      type: "text",
      content:
        "This is a placeholder template.\nFOM-specific templates to be added.",
      position: { x: 50, y: 200, width: 400, height: 100 },
      style: {
        fontSize: 16,
        fontFamily: "Arial, sans-serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
        lineHeight: 1.5,
        zIndex: 1,
      },
    },
  ],
};
