// app/api/debug/db-test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request: NextRequest) {
  let pool: Pool | null = null;

  try {
    console.log('🔍 DB 연결 테스트 시작...');

    // 환경 변수 확인
    const requiredEnvs = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

    if (missingEnvs.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missing: missingEnvs,
        available: {
          DB_HOST: !!process.env.DB_HOST,
          DB_PORT: !!process.env.DB_PORT,
          DB_NAME: !!process.env.DB_NAME,
          DB_USER: !!process.env.DB_USER,
          DB_PASSWORD: !!process.env.DB_PASSWORD,
        }
      }, { status: 500 });
    }

    // 새로운 Pool 인스턴스 생성 (테스트용)
    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
        require: true,
      } : false,
      max: 1, // 테스트용이므로 1개만
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 5000,
    });

    console.log('📡 DB 연결 시도 중...');

    // 연결 테스트
    const client = await pool.connect();
    console.log('✅ DB 연결 성공!');

    // 간단한 쿼리 테스트
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ 쿼리 실행 성공!');

    client.release();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        currentTime: result.rows[0].current_time,
        postgresVersion: result.rows[0].postgres_version,
        connectionInfo: {
          host: process.env.DB_HOST?.replace(/(.{10}).*(.{10})/, '$1***$2'),
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER?.replace(/(.{5}).*(.{5})/, '$1***$2'),
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ DB 연결 실패:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code || 'UNKNOWN',
      errorDetails: {
        name: error.name,
        severity: error.severity,
        detail: error.detail,
        hint: error.hint,
      },
      connectionInfo: {
        host: process.env.DB_HOST?.replace(/(.{10}).*(.{10})/, '$1***$2') || 'undefined',
        port: process.env.DB_PORT || 'undefined',
        database: process.env.DB_NAME || 'undefined',
        user: process.env.DB_USER?.replace(/(.{5}).*(.{5})/, '$1***$2') || 'undefined',
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });

  } finally {
    if (pool) {
      await pool.end();
    }
  }
}