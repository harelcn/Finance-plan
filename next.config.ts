import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // Screens (visited or prefetched) stay in the browser's router cache for 5 minutes, so even a
    // first tap is instant. Saving anything in the app clears it right away.
    staleTimes: { dynamic: 300, static: 300 },
  },
};

export default nextConfig;
