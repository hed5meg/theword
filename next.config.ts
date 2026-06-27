import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The seed content lives as Markdown read at build time. Trace these files so
  // they are bundled with any server function that might read them at runtime.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*", "./docs/**/*"],
  },
};

export default nextConfig;
