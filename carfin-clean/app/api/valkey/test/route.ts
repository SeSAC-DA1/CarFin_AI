// app/api/valkey/test/route.ts
import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    // Valkey 연결 테스트
    const isAvailable = await redis.testConnection();

    if (isAvailable) {
      // 테스트 데이터 저장 및 조회
      const testKey = 'valkey_test_' + Date.now();
      const testData = {
        message: 'CarFin Valkey 연결 성공!',
        timestamp: new Date().toISOString(),
        performance: 'AWS ElastiCache Valkey 정상 작동'
      };

      // 데이터 저장 (30초 TTL)
      await redis.cacheVehicleSearch(testKey, [testData]);

      // 데이터 조회
      const cached = await redis.getCachedVehicleSearch(testKey);

      return NextResponse.json({
        status: 'success',
        message: 'Valkey 연결 성공',
        data: {
          connected: true,
          testResult: cached?.[0] || null,
          environment: process.env.NODE_ENV,
          host: process.env.REDIS_HOST || 'localhost'
        }
      });

    } else {
      return NextResponse.json({
        status: 'warning',
        message: 'Valkey 연결 실패 - 로컬 캐시로 동작 중',
        data: {
          connected: false,
          fallback: true,
          environment: process.env.NODE_ENV,
          host: process.env.REDIS_HOST || 'localhost'
        }
      });
    }

  } catch (error) {
    console.error('Valkey 테스트 에러:', error);

    return NextResponse.json({
      status: 'error',
      message: 'Valkey 테스트 중 에러 발생',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        connected: false,
        environment: process.env.NODE_ENV,
        host: process.env.REDIS_HOST || 'localhost'
      }
    }, { status: 500 });
  }
}