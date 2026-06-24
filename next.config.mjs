/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevents build-time execution of server code that needs env vars
  experimental: {},
  // Suppress the DATABASE_URL missing warning during local builds
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://placeholder",
  },
}

export default nextConfig
