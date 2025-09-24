import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/db';

export async function GET() {
  try {
    console.log('🔍 데이터베이스 연결 성공 - 차량 데이터 분석 시작');

    // 연식별 통계
    const yearStats = await query(`
      SELECT modelyear, COUNT(*) as count
      FROM vehicles
      WHERE modelyear IS NOT NULL AND modelyear > 1990 AND modelyear < 2030
      GROUP BY modelyear
      ORDER BY modelyear DESC
      LIMIT 30
    `);

    // 가격대별 샘플 데이터
    const sampleData = await query(`
      SELECT vehicleid, manufacturer, model, modelyear, price, distance, cartype, fueltype
      FROM vehicles
      WHERE price BETWEEN 200 AND 300
        AND modelyear IS NOT NULL
        AND modelyear > 1990 AND modelyear < 2030
      ORDER BY modelyear DESC, price ASC
      LIMIT 20
    `);

    // 이상한 연식 데이터 확인
    const invalidYears = await query(`
      SELECT modelyear, COUNT(*) as count
      FROM vehicles
      WHERE modelyear > 2025 OR modelyear < 1990
      GROUP BY modelyear
      ORDER BY modelyear
    `);

    return NextResponse.json({
      success: true,
      data: {
        yearStats: yearStats?.rows?.map((stat: any) => ({
          year: stat.modelyear,
          count: parseInt(stat.count)
        })) || [],
        sampleVehicles: sampleData?.rows || [],
        invalidYears: invalidYears?.rows?.map((stat: any) => ({
          year: stat.modelyear,
          count: parseInt(stat.count)
        })) || []
      }
    });

  } catch (error: any) {
    console.error('🚨 데이터베이스 분석 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}