/**
 * PDF generation service for certificates
 */

import puppeteer from "puppeteer";
import {
  generateCertificateHTML,
  CertificateRenderOptions,
} from "@/lib/creative/certificates/html-export/renderer";

export interface PDFGenerationOptions {
  format?: "A4" | "A3" | "Letter" | "Legal";
  orientation?: "portrait" | "landscape";
  quality?: number;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

/**
 * Generate PDF from certificate HTML
 */
export async function generateCertificatePDF(
  certificateOptions: CertificateRenderOptions,
  pdfOptions: PDFGenerationOptions = {}
): Promise<Buffer> {
  let browser;

  try {
    // Generate HTML from template
    const html = generateCertificateHTML(certificateOptions);

    // Launch puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for images to load
    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"],
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: pdfOptions.format || "A4",
      landscape: pdfOptions.orientation === "landscape",
      printBackground: true,
      margin: pdfOptions.margin || {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
      ...pdfOptions,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate certificate PDF");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate PNG image from certificate HTML
 */
export async function generateCertificatePNG(
  certificateOptions: CertificateRenderOptions,
  imageOptions: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<Buffer> {
  let browser;

  try {
    // Generate HTML from template
    const html = generateCertificateHTML(certificateOptions);

    // Launch puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set viewport size
    await page.setViewport({
      width:
        imageOptions.width ||
        certificateOptions.templateData.pageSettings.width,
      height:
        imageOptions.height ||
        certificateOptions.templateData.pageSettings.height,
    });

    // Set content and wait for images to load
    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"],
    });

    // Generate screenshot
    const imageBuffer = await page.screenshot({
      type: "png",
      fullPage: true,
      omitBackground: false,
    });

    return Buffer.from(imageBuffer);
  } catch (error) {
    console.error("Error generating PNG:", error);
    throw new Error("Failed to generate certificate image");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Upload certificate file to EKD Assets storage
 */
export async function uploadCertificateFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  try {
    // Convert buffer to File object
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    // Import EKD Assets API functions dynamically to avoid server-side issues
    const { ekdAssetsAPI } = await import("@/lib/creative/shims/lib/ekd-assets-api");

    // Upload to EKD Assets with certificates folder
    const uploadResult = await ekdAssetsAPI.uploadAsset(file, {
      folder: "certificates",
      public_id: `certificates/${Date.now()}_${filename.replace(/\s+/g, "_")}`,
      asset_type: mimeType.startsWith("image/") ? "image" : "raw",
      tags: ["certificate", "generated"],
    });

    return uploadResult.secure_url || uploadResult.url;
  } catch (error) {
    console.error("Error uploading certificate file:", error);

    // Fallback: Save to local public directory for development
    if (process.env.NODE_ENV === "development") {
      const fs = await import("fs/promises");
      const path = await import("path");

      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "certificates"
      );
      await fs.mkdir(uploadsDir, { recursive: true });

      const filepath = path.join(uploadsDir, filename);
      await fs.writeFile(filepath, buffer);

      return `/uploads/certificates/${filename}`;
    }

    throw new Error("Failed to upload certificate file");
  }
}

/**
 * Complete certificate generation workflow
 */
export async function generateAndUploadCertificate(
  certificateOptions: CertificateRenderOptions,
  certificateId: string
): Promise<{
  pdfUrl: string;
  imageUrl: string;
}> {
  try {
    // Generate PDF and PNG
    const [pdfBuffer, pngBuffer] = await Promise.all([
      generateCertificatePDF(certificateOptions),
      generateCertificatePNG(certificateOptions),
    ]);

    // Upload files
    const [pdfUrl, imageUrl] = await Promise.all([
      uploadCertificateFile(
        pdfBuffer,
        `certificate-${certificateId}.pdf`,
        "application/pdf"
      ),
      uploadCertificateFile(
        pngBuffer,
        `certificate-${certificateId}.png`,
        "image/png"
      ),
    ]);

    return { pdfUrl, imageUrl };
  } catch (error) {
    console.error("Error in certificate generation workflow:", error);
    throw new Error("Failed to generate and upload certificate");
  }
}
