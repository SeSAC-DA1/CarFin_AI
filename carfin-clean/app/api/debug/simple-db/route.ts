import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request: NextRequest) {
  let pool: Pool | null = null;

  try {
    console.log('🔍 간단한 DB 연결 테스트 시작...');

    // PostgreSQL 연결 정보 확인
    const dbConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10000,
    };

    console.log('🔧 DB 설정:', {
      host: dbConfig.host?.substring(0, 10) + '...',
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      hasPassword: !!dbConfig.password
    });

    // 연결 시도
    pool = new Pool(dbConfig);

    console.log('📡 DB 연결 시도 중...');
    const client = await pool.connect();

    console.log('✅ DB 연결 성공! 쿼리 실행 중...');
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');

    client.release();

    console.log('🎉 DB 쿼리 성공!');

    return NextResponse.json({
      success: true,
      message: '데이터베이스 연결 성공!',
      data: {
        currentTime: result.rows[0].current_time,
        dbVersion: result.rows[0].db_version,
        host: process.env.DB_HOST?.substring(0, 15) + '...',
        database: process.env.DB_NAME
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ DB 연결 실패:', error.message);
    console.error('❌ Error code:', error.code);

    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: {
        message: error.message,
        code: error.code,
        host: process.env.DB_HOST?.substring(0, 15) + '...',
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        hasPassword: !!process.env.DB_PASSWORD
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });

  } finally {
    if (pool) {
      await pool.end();
    }
  }
}