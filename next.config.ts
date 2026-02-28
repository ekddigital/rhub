import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    // Pin the workspace root to this project so Next.js doesn't get
    // confused by the parent-directory lockfile.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
