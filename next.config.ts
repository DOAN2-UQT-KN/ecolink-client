import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    cacheComponents: true,
  },
  images: {
    domains: ["res.cloudinary.com"],
  },
};

export default nextConfig;
