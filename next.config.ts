import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js 16: explicitly set turbopack project root to fix prerender bug
  turbopack: {
    root: path.join(__dirname),
  },
}

export default nextConfig
