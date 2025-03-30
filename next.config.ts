import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable compression for all files including PDFs
  compress: true,
  
  // Configure headers for PDF files for better cross-browser caching
  async headers() {
    return [
      {
        // Match all PDF files in the public directory
        source: "/:path*.(pdf)",
        headers: [
          {
            key: "Cache-Control",
            // Cache PDFs for up to 1 month (2592000 seconds)
            value: "public, max-age=2592000, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/pdf",
          },
          {
            key: "Content-Disposition",
            value: "inline",
          },
          {
            // Cross-origin resource policy helps with browser compatibility
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      {
        // Match all JPG files in the public directory
        source: "/:path*.(jpg|jpeg)",
        headers: [
          {
            key: "Cache-Control",
            // Cache JPGs for up to 1 month (2592000 seconds)
            value: "public, max-age=2592000, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "image/jpeg",
          },
          {
            // Set attachment disposition for download support
            key: "Content-Disposition",
            value: "attachment",
          },
          {
            // Cross-origin resource policy helps with browser compatibility
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
