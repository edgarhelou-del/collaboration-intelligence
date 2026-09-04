/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Served under kolabestudio.com/radar. basePath makes Next.js prefix every
  // route, internal <Link>, and asset (/radar/_next/...) automatically, so the
  // app works both directly (collaboration-intelligence.vercel.app/radar) and
  // when proxied from the main site.
  basePath: "/radar",
  // With a basePath, the true domain root ("/") no longer maps to any page, so
  // direct access and the v0 preview (which load "/") would 404. Redirect the
  // bare root to /radar. `basePath: false` makes `source` match the real domain
  // root instead of being auto-prefixed with /radar.
  async redirects() {
    return [
      { source: "/", destination: "/radar", basePath: false, permanent: false },
    ];
  },
};

export default nextConfig;
