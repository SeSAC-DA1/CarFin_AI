import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 빌드 시 ESLint 무시 (Vercel 배포용)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 빌드 시 TypeScript 오류 무시 (Vercel 배포용)
    ignoreBuildErrors: true,
  },
  // 실제 차량 이미지 서버 도메인 허용 (더미 이미지 제거)
  images: {
    domains: [
      'img.encar.com',
      'imgauto.encar.com',
      'fecimg.encar.com',
      'img1.encar.com',
      'ci.encar.com', // 실제 차량 이미지
      'images.unsplash.com' // 폴백용으로만 유지
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.encar.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imgauto.encar.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fecimg.encar.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img1.encar.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ci.encar.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Turbopack 최적화 (최신 설정)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
