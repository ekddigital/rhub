import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Typecheck runs via `npx tsc --noEmit` / `npm run verify` so the Next
  // build worker does not pay a second ~1GB heap spike (fatal on ~2GB VPS).
  typescript: {
    ignoreBuildErrors: true,
  },
  // Limit parallel build workers on memory-constrained VPS hosts (lpad deploy).
  // Keep heap modest (~2GB RAM): high max-old-space-size fights the OS and gets SIGKILL.
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    memoryBasedWorkersCount: true,
    webpackMemoryOptimizations: true,
    staticGenerationMinPagesPerWorker: 25,
  },
  // Large hotel videos should not be pulled into the serverless/SSR trace graph.
  outputFileTracingExcludes: {
    "*": [
      "public/conf/assets/hotel/*.mp4",
      "public/conf/assets/**/*.mp4",
    ],
  },
  webpack: (config) => {
    config.parallelism = 1;
    return config;
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
