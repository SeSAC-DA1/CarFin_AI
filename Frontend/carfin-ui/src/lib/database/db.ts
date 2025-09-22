// 실제 PostgreSQL 데이터베이스 연결 및 쿼리 클래스
import { Pool, PoolClient } from 'pg';

// 데이터베이스 연결 설정
const dbConfig = {
  // AWS RDS PostgreSQL 설정
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'carfin_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',

  // AWS RDS SSL 설정 (개발환경에서도 SSL 필요할 수 있음)
  ssl: process.env.DB_HOST?.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false,

  // 연결 풀 설정
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // 타임아웃 늘림
};

// 연결 풀 생성
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig);

    // 연결 에러 핸들링
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });
  }
  return pool;
}

// 데이터베이스 쿼리 실행 함수
export async function query(text: string, params?: any[]): Promise<any> {
  const pool = getPool();

  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // 개발환경에서만 쿼리 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query:', {
        text: text.length > 100 ? text.substring(0, 100) + '...' : text,
        duration: `${duration}ms`,
        rows: result.rows.length
      });
    }

    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// 트랜잭션 실행 함수
export async function transaction(callback: (client: PoolClient) => Promise<any>): Promise<any> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 데이터베이스 연결 테스트 함수
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// 연결 종료 (앱 종료 시 호출)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}