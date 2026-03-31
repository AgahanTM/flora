import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
      {
        // S3 buckets
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        // S3 buckets (path-style)
        protocol: "https",
        hostname: "s3.*.amazonaws.com",
      },
      {
        // Cloudflare R2 / Images
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        // Cloudflare Images CDN
        protocol: "https",
        hostname: "imagedelivery.net",
      },
      {
        // General CDN catch-all for flora assets
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
