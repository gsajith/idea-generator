import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off on purpose: every page here is live data for one signed-in user,
  // so there's nothing to prerender, and it would force a Suspense boundary around each read.
  reactCompiler: true,
  // Next.js would otherwise write its agent rules into AGENTS.md; this repo keeps them in CLAUDE.md.
  agentRules: false,
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
