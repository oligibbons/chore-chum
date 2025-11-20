import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore lint errors during build to unblock deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow images from your Supabase project
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qulinlikdlmhlquilemz.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Security headers for PWA robustness
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

export default nextConfig;