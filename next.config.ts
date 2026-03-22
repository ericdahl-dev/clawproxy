import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['100.67.45.56', '127.0.0.1'],
};

export default nextConfig;
