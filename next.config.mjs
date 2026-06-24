/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://placeholder",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
