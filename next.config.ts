import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Fully dynamic social app — every page reads session + DB per request.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
