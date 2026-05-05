/**
 * Certificate Template Types
 */

type BackgroundConfig = {
  image?: string;
  color?: string;
  gradient?: string;
  opacity?: number;
  pattern?: string;
  [key: string]: string | number | undefined;
};

export interface CertificateElement {
  id: string;
  type: "text" | "image" | "shape" | "qr-code" | "rectangle" | "qr";
  content: string;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    color?: string;
    textAlign?: "left" | "center" | "right";
    letterSpacing?: string;
    lineHeight?: number;
    borderRadius?: string | number;
    backgroundColor?: string;
    border?: string;
    borderTop?: string;
    borderBottom?: string;
    borderLeft?: string;
    borderRight?: string;
    borderColor?: string;
    borderWidth?: number | string;
    borderStyle?: string;
    opacity?: number;
    rotation?: number;
    maxWidth?: number;
    textDecoration?: string;
    textDecorationColor?: string;
    textDecorationThickness?: string;
    textShadow?: string;
    objectFit?: string;
    background?: string;
    padding?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    filter?: string;
  };
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  organization: string;
  category: string;
  elements: CertificateElement[];
  pageSettings?: {
    width: number;
    height: number;
    orientation: "portrait" | "landscape";
    backgroundColor: string;
    backgroundImage?: string;
    margin?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    background?: string | BackgroundConfig; // Allow flexible background configurations
  };
  variables?: {
    [key: string]: {
      type: "text" | "number" | "date" | "image" | "select" | "textarea" | "qr";
      label: string;
      required?: boolean;
      placeholder?: string;
      defaultValue?: string | number;
      options?: string[];
      validation?: {
        minLength?: number;
        maxLength?: number;
        pattern?: string;
      };
    };
  };
}

export interface OrganizationColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  lightGray: string;
  darkGray: string;
  veryLightGray: string;
  white: string;
  primaryDeep?: string;
}

// Alias for compatibility
export type CertificateColors = OrganizationColors;
