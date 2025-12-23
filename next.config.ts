import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode in development to prevent duplicate server action calls
  reactStrictMode: false,

  // Optional: Enable strict mode only in production if needed
  // reactStrictMode: process.env.NODE_ENV === "production",
};

export default nextConfig;
