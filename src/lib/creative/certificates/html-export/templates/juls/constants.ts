/**
 * JULS (Jinan Union of Liberian Students) Certificate Constants
 * Brand colors, fonts, and organizational information
 */

export const JULS_COLORS = {
  // Primary colors for JULS
  red: "#ff0000",
  blue: "#100c66",
  white: "#ffffff",

  // Derived colors for gradients and accents
  lightRed: "#ff6666",
  darkBlue: "#0a0540",
  lightBlue: "#4040a0",

  // Standard colors
  black: "#000000",
  gold: "#d4af37",

  // Primary designation
  primary: "#100c66",
  secondary: "#ff0000",
  accent: "#4040a0", // Using lightBlue as accent
  text: "#333333",
  lightGray: "#f3f4f6",
  darkGray: "#333333",
  veryLightGray: "#f9fafb",
  primaryDeep: "#0a0540", // Using darkBlue
} as const;

export const JULS_FONTS = {
  primary: "Georgia, serif",
  secondary: "Times New Roman, serif",
  script: "Dancing Script, cursive",
  modern: "Montserrat, sans-serif",
  heading: "Georgia, serif",
  elegant: "Times New Roman, serif",
} as const;

export const JULS_ORG_INFO = {
  name: "Jinan Union of Liberian Students",
  shortName: "JULS",
  description: "Developing Tomorrow's Leaders Today",
  mission:
    "Empowering young minds through comprehensive leadership development and educational excellence",
  established: "2010",
  website: "https://juls.org",
  contact: {
    email: "info@juls.org",
    phone: "+1 (555) 123-4567",
    address: "123 Education Drive, Leadership City, LC 12345",
  },
  leadership: {
    director: "Dr. Jennifer Martinez",
    coordinatorTitle: "Program Director",
    coordinatorName: "Michael Thompson",
  },
} as const;
