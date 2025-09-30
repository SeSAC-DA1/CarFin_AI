// 🎯 실시간 차량 카운트 API

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

interface FilterCondition {
  type: 'carType' | 'priceRange' | 'fuelEfficiency' | 'brand' | 'features' | 'year' | 'mileage';
  label: string;
  value: string;
  sqlCondition?: string;
  priority: number;
}

// PostgreSQL 연결
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

export async function POST(request: NextRequest) {
  try {
    const { filters }: { filters: FilterCondition[] } = await request.json();

    console.log('📊 차량 카운트 요청:', filters);

    // 1. 전체 차량 수
    const totalQuery = 'SELECT COUNT(*) as total FROM vehicles WHERE "Status" = \'판매중\'';
    const totalResult = await pool.query(totalQuery);
    const totalVehicles = parseInt(totalResult.rows[0].total);

    // 2. 필터 적용된 차량 수
    let filteredCount = totalVehicles;
    const filterImpacts: Array<{
      filter: FilterCondition;
      beforeCount: number;
      afterCount: number;
      impact: number;
    }> = [];

    if (filters.length > 0) {
      // 각 필터의 개별 임팩트 계산
      let currentCount = totalVehicles;
      let whereConditions: string[] = [];

      for (const filter of filters) {
        const beforeCount = currentCount;

        // SQL 조건 생성
        const sqlCondition = generateSqlCondition(filter);
        whereConditions.push(sqlCondition);

        // 현재까지의 필터 조합으로 카운트
        const combinedWhere = whereConditions.join(' AND ');
        const query = `
          SELECT COUNT(*) as count
          FROM vehicles
          WHERE "Status" = '판매중' AND ${combinedWhere}
        `;

        const result = await pool.query(query);
        const afterCount = parseInt(result.rows[0].count);

        filterImpacts.push({
          filter,
          beforeCount,
          afterCount,
          impact: beforeCount - afterCount
        });

        currentCount = afterCount;
      }

      filteredCount = currentCount;
    }

    // 3. 응답 데이터
    const response = {
      totalVehicles,
      currentMatches: filteredCount,
      filterImpacts,
      reductionPercentage: ((totalVehicles - filteredCount) / totalVehicles * 100).toFixed(1),
      matchPercentage: (filteredCount / totalVehicles * 100).toFixed(1),
      timestamp: new Date().toISOString()
    };

    console.log('✅ 차량 카운트 완료:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 차량 카운트 실패:', error);

    return NextResponse.json({
      error: '차량 카운트 실패',
      details: error instanceof Error ? error.message : 'Unknown error',
      totalVehicles: 0,
      currentMatches: 0,
      filterImpacts: [],
      reductionPercentage: '0',
      matchPercentage: '0',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 🎯 필터 조건을 SQL WHERE 절로 변환
 */
function generateSqlCondition(condition: FilterCondition): string {
  switch (condition.type) {
    case 'carType':
      return `"CarType" = '${condition.value}'`;

    case 'brand':
      return `"Brand" ILIKE '%${condition.value}%'`;

    case 'priceRange':
      const priceRange = parsePriceRange(condition.value);
      return `"Price" BETWEEN ${priceRange.min} AND ${priceRange.max}`;

    case 'fuelEfficiency':
      const efficiency = parseFloat(condition.value.match(/\d+/)?.[0] || '0');
      return `"FuelEfficiency" >= ${efficiency}`;

    case 'year':
      const year = parseInt(condition.value.match(/\d{4}/)?.[0] || '0');
      return `"Year" >= ${year}`;

    case 'mileage':
      const mileage = parseInt(condition.value.replace(/[^\d]/g, '')) * 10000; // 만km -> km
      return `"Mileage" <= ${mileage}`;

    case 'features':
      return `"Options" ILIKE '%${condition.value}%'`;

    default:
      return '1=1'; // 무조건 true
  }
}

/**
 * 🎯 가격 범위 파싱
 */
function parsePriceRange(value: string): { min: number; max: number } {
  // "3000만원~5000만원" 형태 파싱
  const numbers = value.match(/\d+/g)?.map(n => parseInt(n) * 10000); // 만원 -> 원

  if (numbers && numbers.length >= 2) {
    return { min: numbers[0], max: numbers[1] };
  } else if (numbers && numbers.length === 1) {
    if (value.includes('이상')) {
      return { min: numbers[0], max: 999999999 };
    } else if (value.includes('이하')) {
      return { min: 0, max: numbers[0] };
    } else {
      // 단일 값인 경우 ±20% 범위
      const base = numbers[0];
      return { min: base * 0.8, max: base * 1.2 };
    }
  }

  return { min: 0, max: 999999999 };
}