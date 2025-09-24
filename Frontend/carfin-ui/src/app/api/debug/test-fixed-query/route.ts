import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/db';

export async function GET() {
  try {
    console.log('🧪 수정된 쿼리 테스트 시작');

    // 수정된 차량 검색 쿼리 테스트 (200-300만원)
    const testQuery = `
      SELECT
        vehicleid, manufacturer, model, modelyear, price, distance,
        fueltype, cartype, transmission, trim, colorname, location,
        -- 가성비 점수: 연식대비 가격, 주행거리 고려
        CASE
          WHEN modelyear >= 2020 THEN 3
          WHEN modelyear >= 2018 THEN 2
          ELSE 1
        END +
        CASE
          WHEN distance < 50000 THEN 2
          WHEN distance < 100000 THEN 1
          ELSE 0
        END as value_score
      FROM vehicles
      WHERE price BETWEEN $1 AND $2
        AND price > 0
        AND distance IS NOT NULL
        AND distance < 150000
        AND modelyear IS NOT NULL
        AND modelyear >= 2000
        AND modelyear <= 2025  -- 미래 연식 제외
        AND cartype IN ('준중형', '중형', '소형', 'SUV', '경차')
        AND fueltype != '전기'  -- 전기차 제외로 일반 차량 우선
        AND manufacturer NOT IN ('기타 제조사', '기타')
      ORDER BY
        -- 🎯 페르소나별 우선순위 적용
        CASE
          WHEN cartype = '준중형' THEN 1  -- 신중한 실용주의자 선호
          WHEN cartype = '소형' THEN 2    -- 경제성 고려
          WHEN cartype = '경차' THEN 3    -- 연비 우선
          WHEN cartype = 'SUV' THEN 4     -- 안전성 고려
          ELSE 5
        END,
        value_score DESC,  -- 가성비 우선
        RANDOM()          -- 같은 조건일 때 다양성 확보
      LIMIT 20;
    `;

    const fixedResults = await query(testQuery, [200, 300]);

    // 차종별 통계도 확인
    const carTypeStats = await query(`
      SELECT cartype, COUNT(*) as count, AVG(price) as avg_price
      FROM vehicles
      WHERE price BETWEEN 200 AND 300
        AND price > 0
        AND distance IS NOT NULL
        AND distance < 150000
        AND modelyear IS NOT NULL
        AND modelyear >= 2000
        AND modelyear <= 2025
        AND fueltype != '전기'
        AND manufacturer NOT IN ('기타 제조사', '기타')
      GROUP BY cartype
      ORDER BY count DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        fixedResults: fixedResults?.rows || [],
        carTypeStats: carTypeStats?.rows || [],
        summary: {
          totalFound: fixedResults?.rows?.length || 0,
          avgPrice: fixedResults?.rows?.length > 0
            ? fixedResults.rows.reduce((sum: number, car: any) => sum + car.price, 0) / fixedResults.rows.length
            : 0,
          carTypes: [...new Set(fixedResults?.rows?.map((car: any) => car.cartype) || [])],
          manufacturers: [...new Set(fixedResults?.rows?.map((car: any) => car.manufacturer) || [])]
        }
      }
    });

  } catch (error: any) {
    console.error('🚨 테스트 쿼리 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}