import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  // Low-RAM machines: set NEXT_BUILD_CPUS (e.g. 2) before `npm run build`. Unset keeps Next's default.
  experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS) || undefined },
};

export default nextConfig;
