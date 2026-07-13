/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  async redirects() {
    return [
      {
        source: "/components/form-field-wrapper",
        destination: "/components/form-field",
        permanent: true,
      },
      {
        source: "/components/accordion-item",
        destination: "/components/accordion",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/llms.txt", destination: "/llms-txt" },
      { source: "/llms-full.txt", destination: "/llms-full-txt" },
    ];
  },
};

module.exports = nextConfig;
