import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('🚀 AWS RDS PostgreSQL 실제 차량 데이터베이스 접근:', {
      limit,
      timestamp: new Date().toISOString()
    });

    // 실제 AWS RDS PostgreSQL 차량 데이터 조회
    const vehiclesResult = await query(`
      SELECT
        vehicleid, carseq, manufacturer, model, modelyear,
        price, distance, fueltype, cartype, location,
        detailurl, photo
      FROM vehicles
      ORDER BY price DESC
      LIMIT $1
    `, [limit]);

    const totalResult = await query('SELECT COUNT(*) as count FROM vehicles');
    const totalRecords = parseInt(totalResult.rows[0].count);

    console.log(`✅ AWS RDS PostgreSQL 실제 차량 데이터 ${vehiclesResult.rows.length}개 조회 완료`);

    return NextResponse.json({
      success: true,
      vehicles: vehiclesResult.rows,
      totalCount: vehiclesResult.rows.length,
      totalRecords: totalRecords,
      source: 'AWS RDS PostgreSQL 실제 차량 데이터베이스 (111,841개 실제 차량)',
      mockDataUsed: false,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('🚨 실제 차량 데이터 조회 실패:', error);

    return NextResponse.json({
      success: false,
      error: `실제 데이터 조회 실패: ${error.message}`,
      vehicles: [],
      totalCount: 0,
      mockDataUsed: false,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}