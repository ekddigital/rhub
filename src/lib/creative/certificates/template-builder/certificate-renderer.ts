/**
 * Robust Certificate Rendering Utility
 * Supports multiple output formats (PDF, PNG, HTML) with flexible sizing
 * Enhanced for pixel-perfect rendering using html2canvas and puppeteer
 */

import jsPDF from "jspdf";
import puppeteer from "puppeteer";

export interface CertificateData {
  id: string;
  templateName: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientEmail: string;
  issueDate: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templateData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface TemplateElement {
  id: string;
  type: "text" | "image" | "shape" | "qr";
  content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
    fontFamily?: string;
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    padding?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export interface PageSettings {
  width: number;
  height: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  background?: {
    color?: string;
    border?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

// Certificate size presets from the builder
export const CERTIFICATE_PRESETS = {
  "landscape-a4": { width: 1122, height: 794 }, // A4 landscape at 96 DPI
  "portrait-a4": { width: 794, height: 1122 }, // A4 portrait at 96 DPI
  "standard-4-3": { width: 800, height: 600 }, // Standard 4:3 ratio
  "wide-5-3": { width: 1000, height: 600 }, // Wide 5:3 ratio
  square: { width: 600, height: 600 }, // Square format
  banner: { width: 1200, height: 400 }, // Banner format
  "letter-landscape": { width: 1056, height: 816 }, // US Letter landscape
  "letter-portrait": { width: 816, height: 1056 }, // US Letter portrait
};

export class CertificateRenderer {
  private certificate: CertificateData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private templateData: any;
  private elements: TemplateElement[];
  private pageSettings: PageSettings;

  constructor(certificate: CertificateData) {
    this.certificate = certificate;
    this.templateData = certificate.templateData;
    this.elements = this.templateData?.elements || [];
    this.pageSettings =
      this.templateData?.pageSettings || CERTIFICATE_PRESETS["standard-4-3"];

    // Ensure page settings have defaults
    this.pageSettings = {
      width: this.pageSettings.width || 800,
      height: this.pageSettings.height || 600,
      margin: this.pageSettings.margin || {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
      background: this.pageSettings.background || {
        color: "#ffffff",
        border: "2px solid #2563eb",
      },
    };
  }

  /**
   * Process template elements and replace placeholders
   */
  private processElements(): TemplateElement[] {
    const recipientName =
      `${this.certificate.recipientFirstName} ${this.certificate.recipientLastName}`.trim();
    const issueDate = new Date(this.certificate.issueDate).toLocaleDateString();

    return this.elements.map((element) => {
      if (element.type === "text" && element.content) {
        let content = element.content;

        // Replace various placeholder formats with styled content
        content = content
          // Double brace format (templates) - add underline styling
          .replace(
            /\{\{recipientName\}\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${recipientName}</span>`
          )
          .replace(
            /\{\{certificateId\}\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${this.certificate.id}</span>`
          )
          .replace(
            /\{\{issueDate\}\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${issueDate}</span>`
          )
          .replace(
            /\{\{issuerName\}\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">Hetawk</span>`
          )

          // Single brace format - add underline styling
          .replace(
            /\{recipientName\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${recipientName}</span>`
          )
          .replace(
            /\{certificateId\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${this.certificate.id}</span>`
          )
          .replace(
            /\{issueDate\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${issueDate}</span>`
          )
          .replace(
            /\{([^}]+)\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">$1</span>`
          ) // Handle any other braces

          // Handle specific name patterns
          .replace(
            /\{Enoch Kwateh Dongbo\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${recipientName}</span>`
          )

          // Plain text replacements
          .replace(
            /Sample Recipient/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${recipientName}</span>`
          )
          .replace(
            /System Administrator/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">Hetawk</span>`
          )

          // Date patterns
          .replace(
            /6\/13\/2025/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${issueDate}</span>`
          )
          .replace(
            /Date: 6\/13\/2025/g,
            `Date: <span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${issueDate}</span>`
          )

          // Certificate ID patterns
          .replace(
            /FOM-\d{4}-[A-Z]{3}-\d{4}-[A-Z0-9]{2}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${this.certificate.id}</span>`
          )

          // Issuer patterns
          .replace(
            /Authorized by: System Administrator/g,
            `Authorized by: <span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">Hetawk</span>`
          )
          .replace(
            /Issued by: System Administrator/g,
            `Issued by: <span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">Hetawk</span>`
          )
          .replace(
            /Baptized by: System Administrator/g,
            `Baptized by: <span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">Hetawk</span>`
          )

          // Clean up any remaining empty braces or malformed patterns
          .replace(/\{\s*\}/g, "") // Remove empty braces
          .replace(/\{[^}]*\}/g, (match) => {
            // If any braces remain, remove them and add underline to content
            const content = match.slice(1, -1).trim();
            return content
              ? `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${content}</span>`
              : "";
          });

        return { ...element, content };
      }
      return element;
    });
  }

  /**
   * Generate HTML representation of the certificate
   */
  generateHTML(): string {
    const processedElements = this.processElements();

    let elementsHtml = "";
    processedElements.forEach((element) => {
      const pos = element.position;
      const style = element.style;

      const baseStyle = `
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        width: ${pos.width}px;
        height: ${pos.height}px;
        font-size: ${style.fontSize || "14px"};
        color: ${style.color || "#000000"};
        font-weight: ${style.fontWeight || "normal"};
        text-align: ${style.textAlign || "left"};
        font-family: ${style.fontFamily || "serif"};
        ${
          style.backgroundColor
            ? `background-color: ${style.backgroundColor};`
            : ""
        }
        ${style.border ? `border: ${style.border};` : ""}
        ${style.borderRadius ? `border-radius: ${style.borderRadius};` : ""}
        ${style.padding ? `padding: ${style.padding};` : ""}
        overflow: hidden;
        word-wrap: break-word;
      `.trim();

      if (element.type === "text") {
        elementsHtml += `<div style="${baseStyle}">${element.content}</div>`;
      } else if (element.type === "image") {
        elementsHtml += `<img src="${element.content}" style="${baseStyle}" alt="Certificate element" />`;
      } else if (element.type === "shape") {
        elementsHtml += `<div style="${baseStyle}"></div>`;
      }
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Certificate - ${this.certificate.id}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: serif; 
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .certificate-container { 
            position: relative; 
            width: ${this.pageSettings.width}px; 
            height: ${this.pageSettings.height}px; 
            background: ${this.pageSettings.background?.color || "#ffffff"};
            ${
              this.pageSettings.background?.border
                ? `border: ${this.pageSettings.background.border};`
                : ""
            }
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin: 0 auto;
          }
          @media print {
            body { 
              padding: 0; 
              background: white;
              display: block;
            }
            .certificate-container {
              box-shadow: none;
              margin: 0;
            }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          ${elementsHtml}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate PDF using jsPDF with precise positioning
   */
  async generatePDF(): Promise<Buffer> {
    const processedElements = this.processElements();

    // Calculate PDF dimensions (jsPDF uses points: 1 inch = 72 points)
    const pdfWidth = this.pageSettings.width * 0.75; // Convert px to points (assuming 96 DPI)
    const pdfHeight = this.pageSettings.height * 0.75;

    const doc = new jsPDF({
      orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
      unit: "pt",
      format: [pdfWidth, pdfHeight],
    });

    // Set background
    if (
      this.pageSettings.background?.color &&
      this.pageSettings.background.color !== "#ffffff"
    ) {
      const bgColor = this.hexToRgb(this.pageSettings.background.color);
      if (bgColor) {
        doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
        doc.rect(0, 0, pdfWidth, pdfHeight, "F");
      }
    }

    // Add border if specified
    if (this.pageSettings.background?.border) {
      const borderWidth = this.pageSettings.background.borderWidth || 2;
      doc.setDrawColor(37, 99, 235); // Blue color
      doc.setLineWidth(borderWidth);
      doc.rect(
        borderWidth / 2,
        borderWidth / 2,
        pdfWidth - borderWidth,
        pdfHeight - borderWidth
      );
    }

    // Process each element
    for (const element of processedElements) {
      const x = element.position.x * 0.75; // Convert to points
      const y = element.position.y * 0.75;
      const width = element.position.width * 0.75;
      const height = element.position.height * 0.75;

      if (element.type === "text" && element.content) {
        // Set font properties with error handling
        console.log("Processing text element:", {
          id: element.id,
          fontSize: element.style?.fontSize,
          fontSizeType: typeof element.style?.fontSize,
          hasStyle: !!element.style,
        });

        const fontSize = this.extractNumber(element.style?.fontSize, 14) * 0.75; // Convert to points
        const fontWeight = element.style?.fontWeight || "normal";
        const color = element.style?.color || "#000000";
        const textAlign = element.style?.textAlign || "left";

        // Set text color
        const textColor = this.hexToRgb(color);
        if (textColor) {
          doc.setTextColor(textColor.r, textColor.g, textColor.b);
        }

        // Set font size and style
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", fontWeight === "bold" ? "bold" : "normal");

        // Add background if specified
        if (element.style?.backgroundColor) {
          const bgColor = this.hexToRgb(element.style.backgroundColor);
          if (bgColor) {
            doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
            doc.rect(x, y, width, height, "F");
          }
        }

        // Calculate text position based on alignment
        let textX = x;
        if (textAlign === "center") {
          textX = x + width / 2;
        } else if (textAlign === "right") {
          textX = x + width;
        }

        // Split text into lines and add to PDF
        // Strip HTML tags for PDF since it can't render HTML
        const cleanContent = element.content.replace(/<[^>]*>/g, "");
        const lines = doc.splitTextToSize(cleanContent, width - 10); // Leave some padding
        doc.text(lines, textX, y + fontSize + 5, {
          align: textAlign as "left" | "center" | "right",
          maxWidth: width - 10,
        });
      }
    }

    // Return PDF as buffer
    const pdfOutput = doc.output("arraybuffer");
    return Buffer.from(pdfOutput);
  }

  /**
   * Generate PNG using Puppeteer
   */
  async generatePNG(): Promise<Buffer> {
    const html = this.generateHTML();

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      // Set viewport to match certificate dimensions with some padding
      await page.setViewport({
        width: this.pageSettings.width + 40,
        height: this.pageSettings.height + 40,
        deviceScaleFactor: 2, // High DPI for better quality
      });

      await page.setContent(html, { waitUntil: "networkidle0" });

      // Take screenshot of the certificate container
      const element = await page.$(".certificate-container");
      if (!element) {
        throw new Error("Certificate container not found");
      }

      const screenshot = await element.screenshot({
        type: "png",
        omitBackground: false,
      });

      return screenshot as Buffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Helper method to convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Helper method to extract number from CSS values like "14px" or numeric values
   */
  private extractNumber(
    value: string | number | undefined,
    defaultValue: number
  ): number {
    if (!value) return defaultValue;

    // If it's already a number, return it
    if (typeof value === "number") return value;

    // If it's a string, extract the number part
    if (typeof value === "string") {
      const match = value.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : defaultValue;
    }

    // For any other type, return default
    return defaultValue;
  }
}
