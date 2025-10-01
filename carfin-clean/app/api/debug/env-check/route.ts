import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 환경변수 확인 (값은 보안상 마스킹)
    const envCheck = {
      // PostgreSQL 환경변수
      DB_HOST: process.env.DB_HOST ? '✅ 설정됨' : '❌ 누락',
      DB_PORT: process.env.DB_PORT ? '✅ 설정됨' : '❌ 누락',
      DB_NAME: process.env.DB_NAME ? '✅ 설정됨' : '❌ 누락',
      DB_USER: process.env.DB_USER ? '✅ 설정됨' : '❌ 누락',
      DB_PASSWORD: process.env.DB_PASSWORD ? '✅ 설정됨' : '❌ 누락',

      // Redis 환경변수
      REDIS_HOST: process.env.REDIS_HOST ? '✅ 설정됨' : '❌ 누락',
      REDIS_PORT: process.env.REDIS_PORT ? '✅ 설정됨' : '❌ 누락',
      REDIS_TLS: process.env.REDIS_TLS ? '✅ 설정됨' : '❌ 누락',

      // AI 환경변수
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ 설정됨' : '❌ 누락',
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? '⚠️ 중복 설정됨' : '❌ 누락',

      // 기타 환경변수
      NODE_ENV: process.env.NODE_ENV || '❌ 누락',
      AI_DEMO_MODE: process.env.AI_DEMO_MODE ? '✅ 설정됨' : '❌ 누락',
    };

    // 값 일부 확인 (보안상 앞 3글자만)
    const valueCheck = {
      DB_HOST_PREFIX: process.env.DB_HOST?.substring(0, 10) + '...',
      REDIS_HOST_PREFIX: process.env.REDIS_HOST?.substring(0, 15) + '...',
      NODE_ENV_VALUE: process.env.NODE_ENV,
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: 'production',
      envCheck,
      valueCheck
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: '환경변수 확인 실패',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}