import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.interjudaica.com',
        port: '',
        search: '',
      },
    ],
  },
  allowedDevOrigins: ['interjudaica.com'],
};

console.info(JSON.stringify(nextConfig))
export default nextConfig;
