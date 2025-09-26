import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img1.encar.com',
        port: '',
        pathname: '/carpicture**',
      },
      {
        protocol: 'https',
        hostname: 'img.kbchachacha.com',
        port: '',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
