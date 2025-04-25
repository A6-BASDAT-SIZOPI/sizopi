import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["upload.wikimedia.org", "encrypted-tbn0.gstatic.com"], // Tambahkan domain di sini
  },
};

export default nextConfig;