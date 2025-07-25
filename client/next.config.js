/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Note: For development, use PORT=8001 in .env.local or npm run dev -- -p 8001
  // The server config below is mainly for production builds
  server: {
    port: process.env.PORT || 8001,
  },
};

module.exports = nextConfig;
