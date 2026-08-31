/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Served under kolabestudio.com/radar. basePath makes Next.js prefix every
  // route, internal <Link>, and asset (/radar/_next/...) automatically, so the
  // app works both directly (collaboration-intelligence.vercel.app/radar) and
  // when proxied from the main site.
  basePath: "/radar",
};

export default nextConfig;
