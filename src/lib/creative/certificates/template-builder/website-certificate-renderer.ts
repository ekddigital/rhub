/**
 * Website-Based Certificate Renderer
 * Captures the exact visual appearance from the live website for pixel-perfect downloads
 */

import puppeteer from "puppeteer";

export interface CertificateData {
  id: string;
  templateName: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientEmail: string;
  issueDate: Date;
  templateData: unknown;
  [key: string]: unknown;
}

export class WebsiteCertificateRenderer {
  private certificate: CertificateData;
  private baseUrl: string;

  constructor(
    certificate: CertificateData,
    baseUrl: string = "http://localhost:3000"
  ) {
    this.certificate = certificate;
    this.baseUrl = baseUrl;
  }

  /**
   * Generate PDF by capturing the actual website preview
   */
  async generatePDF(): Promise<Buffer> {
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
        "--allow-running-insecure-content",
      ],
    });

    try {
      const page = await browser.newPage();

      // Set user agent to avoid bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Navigate to the certificate preview page
      const previewUrl = `${this.baseUrl}/admin/certificates/flexible-preview?certificateId=${this.certificate.id}`;
      console.log("Loading certificate preview URL:", previewUrl);

      await page.goto(previewUrl, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 30000,
      });

      // Wait for certificate to be fully loaded
      await page.waitForSelector(
        ".certificate-container, .certificate-preview",
        {
          timeout: 15000,
        }
      );

      // Add extra time for images, fonts, and styles to load
      await page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 3000))
      );

      // Wait for any images to load
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images, (img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
              img.addEventListener("load", resolve);
              img.addEventListener("error", reject);
            });
          })
        );
      });

      // Find the certificate container
      const certificateSelector =
        '.certificate-container, .certificate-preview, [class*="certificate"]';
      const element = await page.$(certificateSelector);

      if (!element) {
        // If we can't find a specific certificate container, try to capture the main content
        console.log(
          "Certificate container not found, trying main content area"
        );
        const mainContent = await page.$(
          'main, .certificate-display, [role="main"]'
        );
        if (mainContent) {
          // Get the bounding box to determine dimensions
          const boundingBox = await mainContent.boundingBox();
          if (boundingBox) {
            const pdfBuffer = await page.pdf({
              width: Math.max(boundingBox.width, 800),
              height: Math.max(boundingBox.height, 600),
              printBackground: true,
              margin: { top: 0, right: 0, bottom: 0, left: 0 },
              preferCSSPageSize: false,
            });
            return Buffer.from(pdfBuffer);
          }
        }
        throw new Error("Certificate element not found on page");
      }

      // Get the element's bounding box for precise dimensions
      const boundingBox = await element.boundingBox();

      if (!boundingBox) {
        throw new Error("Could not get certificate element dimensions");
      }

      console.log("Certificate dimensions:", boundingBox);

      // Generate PDF with exact dimensions of the certificate
      const pdfBuffer = await page.pdf({
        width: Math.max(boundingBox.width, 800),
        height: Math.max(boundingBox.height, 600),
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: false,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF from website:", error);
      throw new Error(
        `Failed to generate PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate PNG by capturing the actual website preview
   */
  async generatePNG(): Promise<Buffer> {
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
        "--allow-running-insecure-content",
      ],
    });

    try {
      const page = await browser.newPage();

      // Set user agent to avoid bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Set high-resolution viewport for crisp PNG rendering
      await page.setViewport({
        width: 1400,
        height: 1000,
        deviceScaleFactor: 2, // High DPI for crisp images
      });

      // Navigate to the certificate preview page
      const previewUrl = `${this.baseUrl}/admin/certificates/flexible-preview?certificateId=${this.certificate.id}`;
      console.log("Loading certificate preview URL:", previewUrl);

      await page.goto(previewUrl, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 30000,
      });

      // Wait for certificate to be fully loaded
      await page.waitForSelector(
        ".certificate-container, .certificate-preview",
        {
          timeout: 15000,
        }
      );

      // Add extra time for images, fonts, and styles to load
      await page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 3000))
      );

      // Wait for any images to load
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images, (img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
              img.addEventListener("load", resolve);
              img.addEventListener("error", reject);
            });
          })
        );
      });

      // Find and screenshot the certificate container
      const certificateSelector =
        '.certificate-container, .certificate-preview, [class*="certificate"]';
      const element = await page.$(certificateSelector);

      if (!element) {
        console.log(
          "Certificate container not found, trying full page screenshot"
        );
        // Fallback to full page screenshot
        const screenshot = await page.screenshot({
          type: "png",
          fullPage: false,
          clip: {
            x: 0,
            y: 100, // Skip header
            width: 1400,
            height: 800,
          },
        });
        return screenshot as Buffer;
      }

      console.log("Taking screenshot of certificate element");

      // Take high-quality screenshot of the certificate
      const screenshot = await element.screenshot({
        type: "png",
        omitBackground: false,
      });

      return screenshot as Buffer;
    } catch (error) {
      console.error("Error generating PNG from website:", error);
      throw new Error(
        `Failed to generate PNG: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      await browser.close();
    }
  }

  /**
   * Test if the preview URL is accessible
   */
  async testPreviewAccess(): Promise<boolean> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      const previewUrl = `${this.baseUrl}/admin/certificates/flexible-preview?certificateId=${this.certificate.id}`;

      const response = await page.goto(previewUrl, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      return response?.status() === 200;
    } catch (error) {
      console.error("Error testing preview access:", error);
      return false;
    } finally {
      await browser.close();
    }
  }
}
