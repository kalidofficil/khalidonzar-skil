import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Loads UI text from messages/<locale>.json (see src/i18n/request.ts).
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Cache Components is off on purpose: every page in a CRM is private,
  // per-user and must always show fresh data, so pages simply render on each
  // request. Next.js plans to turn it on by default in v17; we'll revisit then.
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

export default withNextIntl(nextConfig);
