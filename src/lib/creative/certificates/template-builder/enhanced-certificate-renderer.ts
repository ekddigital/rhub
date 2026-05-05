/**
 * Enhanced Certificate Rendering Utility
 * Provides pixel-perfect rendering using Puppeteer for both PDF and PNG output
 */

import puppeteer from "puppeteer";

export interface CertificateData {
  id: string;
  templateName: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientEmail: string;
  issueDate: Date;
  templateData: TemplateData;
  [key: string]: unknown;
}

export interface TemplateData {
  elements: TemplateElement[];
  pageSettings: PageSettings;
  [key: string]: unknown;
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
    [key: string]: unknown;
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

export class EnhancedCertificateRenderer {
  private certificate: CertificateData;
  private templateData: TemplateData;
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
   * Process template elements and replace placeholders with rich content
   */
  private processElements(): TemplateElement[] {
    const recipientName =
      `${this.certificate.recipientFirstName} ${this.certificate.recipientLastName}`.trim();
    const issueDate = new Date(this.certificate.issueDate).toLocaleDateString();

    return this.elements.map((element) => {
      if (element.type === "text" && element.content) {
        let content = element.content;

        // Enhanced placeholder replacement with rich styling
        content = content
          // Double brace format (templates) - add elegant underline styling
          .replace(
            /\{\{recipientName\}\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${recipientName}</span>`
          )
          .replace(
            /\{\{certificateId\}\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${this.certificate.id}</span>`
          )
          .replace(
            /\{\{issueDate\}\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${issueDate}</span>`
          )
          .replace(
            /\{\{issuerName\}\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">Hetawk</span>`
          )

          // Single brace format - add elegant underline styling
          .replace(
            /\{recipientName\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${recipientName}</span>`
          )
          .replace(
            /\{certificateId\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${this.certificate.id}</span>`
          )
          .replace(
            /\{issueDate\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${issueDate}</span>`
          )
          .replace(
            /\{([^}]+)\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">$1</span>`
          )

          // Handle specific name patterns
          .replace(
            /\{Enoch Kwateh Dongbo\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${recipientName}</span>`
          )

          // Plain text replacements with styling
          .replace(
            /Sample Recipient/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${recipientName}</span>`
          )
          .replace(
            /System Administrator/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">Hetawk</span>`
          )

          // Date patterns
          .replace(
            /6\/13\/2025/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${issueDate}</span>`
          )
          .replace(
            /Date: 6\/13\/2025/g,
            `Date: <span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${issueDate}</span>`
          )

          // Certificate ID patterns
          .replace(
            /FOM-\d{4}-[A-Z]{3}-\d{4}-[A-Z0-9]{2}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${this.certificate.id}</span>`
          )

          // Issuer patterns
          .replace(
            /Authorized by: System Administrator/g,
            `Authorized by: <span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">Hetawk</span>`
          )
          .replace(
            /Issued by: System Administrator/g,
            `Issued by: <span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">Hetawk</span>`
          )
          .replace(
            /Baptized by: System Administrator/g,
            `Baptized by: <span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">Hetawk</span>`
          )

          // Clean up any remaining empty braces
          .replace(/\{\s*\}/g, "")
          .replace(/\{\{[^}]*\}\}/g, "");

        return {
          ...element,
          content,
        };
      }

      return element;
    });
  }

  /**
   * Convert style object to CSS string with enhanced support
   */
  private styleToCSS(style: Record<string, unknown> = {}): string {
    const cssRules: string[] = [];

    // Handle all possible style properties
    Object.entries(style).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      cssRules.push(`${cssKey}: ${value}`);
    });

    return cssRules.join("; ");
  }

  /**
   * Generate pixel-perfect HTML for rendering
   */
  private generateHTML(): string {
    const processedElements = this.processElements();

    // Generate elements HTML with enhanced positioning and styling
    let elementsHtml = "";
    processedElements.forEach((element) => {
      const elementStyle = {
        position: "absolute",
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.position.width}px`,
        height: `${element.position.height}px`,
        ...element.style,
        // Ensure text doesn't overflow
        overflow: "hidden",
        wordWrap: "break-word",
        display: "flex",
        alignItems: "center",
        justifyContent:
          element.style?.textAlign === "center"
            ? "center"
            : element.style?.textAlign === "right"
            ? "flex-end"
            : "flex-start",
      };

      const baseStyle = this.styleToCSS(elementStyle);

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate - ${this.certificate.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;600;700&family=Arial:wght@400;600;700&family=Serif:wght@400;600;700&display=swap');
          
          * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
          }
          
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Times New Roman', serif; 
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
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
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            margin: 0;
            overflow: hidden;
          }
          
          .certificate-container * {
            font-family: inherit;
          }
          
          @media print {
            body { 
              padding: 0; 
              background: white;
              display: block;
              min-height: auto;
            }
            .certificate-container {
              box-shadow: none;
              margin: 0;
              page-break-inside: avoid;
            }
          }
          
          @page {
            size: ${this.pageSettings.width}px ${this.pageSettings.height}px;
            margin: 0;
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
   * Generate PDF using enhanced Puppeteer rendering for pixel-perfect output
   */
  async generatePDF(): Promise<Buffer> {
    const html = this.generateHTML();

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    });

    try {
      const page = await browser.newPage();

      // Set high-resolution viewport for better quality
      await page.setViewport({
        width: this.pageSettings.width + 100,
        height: this.pageSettings.height + 100,
        deviceScaleFactor: 2, // High DPI
      });

      // Set content and wait for all resources to load
      await page.setContent(html, {
        waitUntil: ["networkidle0", "domcontentloaded"],
      });

      // Add delay to ensure fonts and styles are fully loaded
      await page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 2000))
      );

      // Generate PDF with precise dimensions
      const pdfBuffer = await page.pdf({
        width: `${this.pageSettings.width}px`,
        height: `${this.pageSettings.height}px`,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: true,
        format: undefined, // Use custom width/height
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate PNG using enhanced Puppeteer rendering for pixel-perfect output
   */
  async generatePNG(): Promise<Buffer> {
    const html = this.generateHTML();

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    });

    try {
      const page = await browser.newPage();

      // Set very high-resolution viewport for crisp PNG rendering
      await page.setViewport({
        width: this.pageSettings.width + 100,
        height: this.pageSettings.height + 100,
        deviceScaleFactor: 3, // Very high DPI for PNG
      });

      // Set content and wait for all resources to load
      await page.setContent(html, {
        waitUntil: ["networkidle0", "domcontentloaded"],
      });

      // Add delay to ensure fonts and styles are fully loaded
      await page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 2000))
      );

      // Take high-quality screenshot of the certificate container
      const element = await page.$(".certificate-container");
      if (!element) {
        throw new Error("Certificate container not found");
      }

      const screenshot = await element.screenshot({
        type: "png",
        omitBackground: false,
        captureBeyondViewport: false,
      });

      return screenshot as Buffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate HTML content for preview (same as used for PDF/PNG generation)
   */
  generateHTMLPreview(): string {
    return this.generateHTML();
  }
}
