import type { NextConfig } from "next";

// DEMO_STATIC builds a crawlable copy served under /tweak/demo on GitHub Pages.
const demo = process.env.DEMO_STATIC === "1";

const nextConfig: NextConfig = {
  // Fully dynamic social app — every page reads session + DB per request.
  cacheComponents: false,
  ...(demo
    ? { basePath: "/tweak/demo", trailingSlash: true, distDir: ".next-demo" }
    : {}),
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
