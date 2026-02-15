import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" } : {}),
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
