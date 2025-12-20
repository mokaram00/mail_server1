import type { NextConfig } from "next";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.bltnm.store",
        pathname: "/uploads/**",
      },
    ],
  },
};


export default nextConfig;