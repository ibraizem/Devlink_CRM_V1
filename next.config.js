/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  images: { 
    unoptimized: true 
  },
  reactCompiler: true,
  experimental: {
    turbo: {
      resolveAlias: {
        '@': path.resolve(__dirname, '.'),
        '@/lib': path.resolve(__dirname, 'lib'),
        '@/components': path.resolve(__dirname, 'components'),
        '@/types': path.resolve(__dirname, 'types'),
      },
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/types': path.resolve(__dirname, 'types'),
    }
    return config
  },
}

module.exports = nextConfig
