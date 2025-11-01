/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    allowedDevOrigins: [
      "http://localhost:3000",    // local dev
      "https://voice.zenxai.io",  // your external domain
    ],
  },
};

module.exports = nextConfig;
