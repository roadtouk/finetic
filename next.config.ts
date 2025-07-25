import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: '.next',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
