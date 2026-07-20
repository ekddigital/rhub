import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Next.js 16 defaults to Turbopack for both `next dev` and `next build`.
  // Keep an explicit empty config so any residual webpack-only knobs (none)
  // cannot trip the webpack-without-turbopack coexistence error.
  turbopack: {},
  // Typecheck runs via `npx tsc --noEmit` / `npm run verify` so the Next
  // build worker does not pay a second ~1GB heap spike (fatal on ~2GB VPS).
  typescript: {
    ignoreBuildErrors: true,
  },
  // Limit parallel work on memory-constrained VPS hosts (lpad deploy).
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    memoryBasedWorkersCount: true,
    staticGenerationMinPagesPerWorker: 25,
  },
  // Large hotel videos should not be pulled into the serverless/SSR trace graph.
  outputFileTracingExcludes: {
    "*": ["public/conf/assets/hotel/*.mp4", "public/conf/assets/**/*.mp4"],
  },
  serverExternalPackages: ["@resvg/resvg-js", "adm-zip"],
  allowedDevOrigins: ["192.168.195.241"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.assets.andgroupco.com",
      },
      {
        protocol: "https",
        hostname: "assets.andgroupco.com",
      },
    ],
  },
};

export default nextConfig;
