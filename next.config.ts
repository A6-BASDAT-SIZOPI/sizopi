import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ Abaikan error ESLint saat build
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Abaikan error TypeScript seperti "any"
  },
};

export default nextConfig;
