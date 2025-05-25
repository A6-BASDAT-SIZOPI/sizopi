import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Mengizinkan semua hostname tanpa batasan
  },
};

export default nextConfig;