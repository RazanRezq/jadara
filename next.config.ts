import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode in development to prevent duplicate server action calls
  reactStrictMode: false,

  // Keep Puppeteer out of the serverless function bundles — it's only loaded
  // lazily at runtime for Behance scraping (see urlContentExtractor.ts)
  serverExternalPackages: ["puppeteer", "puppeteer-core"],

  // Tree-shake heavy libraries so pages only ship the pieces they import
  experimental: {
    optimizePackageImports: [
      "recharts",
      "lucide-react",
      "framer-motion",
      "date-fns",
    ],
  },
};

export default nextConfig;
