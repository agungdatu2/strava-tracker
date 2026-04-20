import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.strava.com" },
      { protocol: "https", hostname: "dgalywyr863hv.cloudfront.net" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Izinkan semua hostname untuk development
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? [process.env.VERCEL_PROJECT_PRODUCTION_URL]
          : []),
        ...(process.env.NEXTAUTH_URL
          ? [new URL(process.env.NEXTAUTH_URL).host]
          : []),
      ],
    },
  },
};

export default nextConfig;
