const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  skipWaiting: true,
  clientsClaim: true,
  customWorkerDir: "worker",
  fallbacks: { document: "/offline" },
  runtimeCaching: [
    {
      urlPattern: /^https?.*\/api\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 5 },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https?.*\.(js|css|woff2?|png|jpg|svg|ico)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    {
      urlPattern: /^https?.*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  async redirects() {
    return [
      { source: "/admin-v2", destination: "/admin", permanent: true },
      { source: "/admin-v2/:path*", destination: "/admin/:path*", permanent: true },
      { source: "/minha-area-v2", destination: "/minha-area", permanent: true },
      { source: "/minha-area-v2/:path*", destination: "/minha-area/:path*", permanent: true },
      { source: "/admin/form-ministerios", destination: "/admin/interesses", permanent: true },
      { source: "/admin/responsaveis", destination: "/admin/visitantes", permanent: true },
    ]
  },
};

module.exports = withPWA(nextConfig);
