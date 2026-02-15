import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin workspace root so Next does not infer parent dir when multiple lockfiles exist
  outputFileTracingRoot: path.join(__dirname),
  // Enable standalone only for Docker production build (NEXT_STANDALONE=true)
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" as const } : {}),
  // Netlify production install skips devDependencies; skip ESLint during build to avoid requiring eslint in prod deps
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
