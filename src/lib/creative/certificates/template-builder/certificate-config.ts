/**
 * Production Configuration for Certificate Generation
 *
 * This file contains production-specific configurations for PDF/PNG generation
 * that can be adjusted based on the deployment environment.
 */

import fs from "fs";

// Puppeteer configuration for production environments
export const PUPPETEER_CONFIG = {
  // Chrome executable paths for different environments
  CHROME_PATHS: {
    // Common Chrome paths on Linux servers
    linux: [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/opt/google/chrome/chrome",
    ],
    // Common Chrome paths on Alpine Linux (often used in Docker)
    alpine: ["/usr/bin/chromium-browser", "/usr/bin/chromium"],
    // Windows paths (if running on Windows server)
    windows: [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ],
  },

  // Production-optimized Puppeteer launch arguments
  PRODUCTION_ARGS: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-web-security",
    "--allow-running-insecure-content",
    "--disable-features=VizDisplayCompositor",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--single-process",
    "--disable-background-networking",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-breakpad",
    "--disable-client-side-phishing-detection",
    "--disable-component-extensions-with-background-pages",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-hang-monitor",
    "--disable-ipc-flooding-protection",
    "--disable-popup-blocking",
    "--disable-prompt-on-repost",
    "--disable-renderer-backgrounding",
    "--disable-sync",
    "--disable-translate",
    "--metrics-recording-only",
    "--safebrowsing-disable-auto-update",
    "--enable-automation",
    "--password-store=basic",
    "--use-mock-keychain",
    "--disable-blink-features=AutomationControlled",
    "--force-color-profile=srgb",
    "--memory-pressure-off",
    "--max_old_space_size=4096",
    "--ignore-certificate-errors-spki-list",
    "--ignore-certificate-errors",
    "--ignore-ssl-errors",
    "--allow-cross-origin-auth-prompt",
    "--disable-3d-apis",
    "--disable-accelerated-mjpeg-decode",
    "--disable-accelerated-video-decode",
    "--disable-app-list-dismiss-on-blur",
    "--disable-background-mode",
  ],

  // Memory and performance settings
  PERFORMANCE: {
    timeout: 60000, // 60 seconds timeout
    viewport: {
      deviceScaleFactor: 2, // Reduced from 3.5 to save memory
    },
    waitTime: 3000, // Wait time for assets to load
  },
};

/**
 * Get the appropriate Chrome executable path for the current environment
 */
export function getChromeExecutablePath(): string | undefined {
  // Check if explicitly set via environment variable
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // Auto-detect based on platform
  const platform = process.platform;

  if (platform === "linux") {
    // Try to find Chrome in common Linux paths
    for (const path of PUPPETEER_CONFIG.CHROME_PATHS.linux) {
      try {
        if (fs.existsSync(path)) {
          return path;
        }
      } catch {
        continue;
      }
    }

    // Check if running in Alpine Linux (common in Docker)
    try {
      const osRelease = fs.readFileSync("/etc/os-release", "utf8");
      if (osRelease.includes("Alpine")) {
        for (const path of PUPPETEER_CONFIG.CHROME_PATHS.alpine) {
          if (fs.existsSync(path)) {
            return path;
          }
        }
      }
    } catch {
      // Ignore error, continue with default paths
    }
  } else if (platform === "win32") {
    for (const path of PUPPETEER_CONFIG.CHROME_PATHS.windows) {
      try {
        if (fs.existsSync(path)) {
          return path;
        }
      } catch {
        continue;
      }
    }
  }

  // Return undefined to use Puppeteer's bundled Chromium
  return undefined;
}

/**
 * Check if certificate generation should be disabled based on environment
 */
export function shouldDisableCertificateGeneration(): boolean {
  // Disable if explicitly set
  if (process.env.DISABLE_CERTIFICATE_GENERATION === "true") {
    return true;
  }

  // In production, try to use bundled Chromium if no system Chrome is found
  // Only disable if Puppeteer itself is not available
  return false;
}

/**
 * Get environment-specific configuration
 */
export function getCertificateConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const chromeExecutable = getChromeExecutablePath();

  return {
    isProduction,
    chromeExecutable,
    disabled: shouldDisableCertificateGeneration(),
    puppeteerArgs: PUPPETEER_CONFIG.PRODUCTION_ARGS,
    timeout: PUPPETEER_CONFIG.PERFORMANCE.timeout,
    viewport: PUPPETEER_CONFIG.PERFORMANCE.viewport,
    waitTime: PUPPETEER_CONFIG.PERFORMANCE.waitTime,
  };
}
