import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,

  // Transpile packages from monorepo
  transpilePackages: [
    "@repo/ui",
    "@repo/database",
    "@repo/trpc",
    "@repo/auth",
    "@repo/utils",
  ],

  // Standalone output for Docker/Kamal deployment
  output: "standalone",
  outputFileTracingRoot: process.env.TURBO_ROOT,

  // Experimental features
  experimental: {
    // Enable Server Actions
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },

  // Disable telemetry
  typescript: {
    // Allow production builds even with type errors (for now)
    // ignoreBuildErrors: false,
  },
  eslint: {
    // Allow production builds even with ESLint errors (for now)
    // ignoreDuringBuilds: false,
  },
};

export default config;
