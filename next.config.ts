import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.jamendo.com",
      },
      {
        protocol: "https",
        hostname: "usercontent.jamendo.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  // Ensure server actions are enabled (they are default in next 15/16)
};

export default nextConfig;
