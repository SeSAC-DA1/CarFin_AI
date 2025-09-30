import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🔧 한글 UTF-8 인코딩 보장
  serverExternalPackages: [],
  // Request body 크기 제한 증가 (한글 문자 처리)
  env: {
    FORCE_UTF8: 'true',
  },
  // 🚀 Vercel 배포 최적화
  serverExternalPackages: ['pg', 'redis'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '**',
      },
    ],
  },
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // node: 프로토콜 처리를 위한 alias 설정 (서버 사이드에서만)
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "node:crypto": "crypto",
      };
    } else {
      // 클라이언트 사이드에서는 fallback 설정
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "crypto": false,
        "node:crypto": false,
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        "node:crypto": false,
      };
    }

    return config;
  },
};

export default nextConfig;
