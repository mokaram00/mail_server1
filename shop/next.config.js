import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [ 'api.bltnm.store'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.bltnm.store',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
