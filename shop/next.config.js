/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.bltnm.store'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.bltnm.store',
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = nextConfig;
