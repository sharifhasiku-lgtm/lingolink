import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "localhost",
    "127.0.0.1",
  ],
  experimental: {
    proxyTimeout: 600000, // 10 minutes — allows long dubbing jobs
  },
};

export default nextConfig;