import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Keep page-data collection within the memory available to local verification
  // and the staging Render instance. Next otherwise detects all host CPUs.
  experimental: {
    cpus: 2,
  },
};

export default nextConfig;
