/**
 * Shared types and interfaces for card templates
 */

export interface CardElement {
  id: string;
  type: "text" | "image" | "decoration";
  content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    color?: string;
    textAlign?: "left" | "center" | "right";
    lineHeight?: number;
    letterSpacing?: string;
    transform?: string;
    opacity?: number;
    zIndex?: number;
    border?: string;
    borderRadius?: string;
    padding?: string;
    display?: string;
  };
}

export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  category: "graduation" | "appreciation" | "blessing" | "invitation";
  elements: CardElement[];
  settings: {
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage?: string;
  };
}
