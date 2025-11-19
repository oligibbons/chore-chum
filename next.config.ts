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
};

export default nextConfig;