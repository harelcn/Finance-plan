import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // Keep visited screens in the browser's router cache so going back and forth is instant.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
