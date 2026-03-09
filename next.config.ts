import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/static-app-shell",
        },
        {
          source: "/trash",
          destination: "/static-app-shell",
        },
        {
          source: "/settings",
          destination: "/static-app-shell",
        },
        {
          source: "/folder/:path*",
          destination: "/static-app-shell",
        },
      ],
    };
  },
};

export default nextConfig;
