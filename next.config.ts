import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["@resvg/resvg-js", "adm-zip"],
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
