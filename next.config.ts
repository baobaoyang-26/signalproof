import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router at repo root — do not use static export (no output: "export").
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
