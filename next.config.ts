import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone only for Docker production build (NEXT_STANDALONE=true)
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
