import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    // vehicles 테이블의 컬럼 정보 조회
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'vehicles'
      ORDER BY ordinal_position;
    `;

    const result = await query(schemaQuery);

    // 샘플 데이터도 함께 조회
    const sampleQuery = `
      SELECT * FROM vehicles
      WHERE price > 0 AND price < 5000
      LIMIT 3;
    `;

    const sampleResult = await query(sampleQuery);

    return NextResponse.json({
      success: true,
      schema: result.rows,
      sampleData: sampleResult.rows,
      message: 'Database schema retrieved successfully'
    });

  } catch (error) {
    console.error('Database schema error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}