import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "passes-omaha-love-dogs.trycloudflare.com",
    "*.trycloudflare.com",
    "localhost",
    "192.168.1.7",
  ],
};

export default nextConfig;