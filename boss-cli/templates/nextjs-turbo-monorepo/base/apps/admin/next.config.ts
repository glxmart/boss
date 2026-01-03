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
};

export default config;
