/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // During migration we keep existing ESLint config; don't block builds on legacy files.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Keep behavior predictable during migration.
    optimizePackageImports: [],
  },
  async redirects() {
    return [
      { source: '/my-projects', destination: '/dashboard/projects', permanent: false },
      { source: '/my-projects/new', destination: '/dashboard/projects/new', permanent: false },
      { source: '/my-projects/:id', destination: '/dashboard/projects/:id', permanent: false },
      { source: '/applications', destination: '/dashboard/applications', permanent: false },
    ];
  },
};

export default nextConfig;

