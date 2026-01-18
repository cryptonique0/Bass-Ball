import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '*.web3.storage',
      },
    ],
  },
  webpack: (config) => {
    config.externals = [
      ...config.externals,
      {
        'utf-8-validate': 'utf-8-validate',
        bufferutil: 'bufferutil',
      },
    ];
    return config;
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  // Enable turbopack for faster development
  experimental: {
    turbopack: true,
  },
};

export default nextConfig;
