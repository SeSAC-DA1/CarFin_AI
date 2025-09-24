import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🗄️ RDS PostgreSQL vehicles 테이블 스키마 분석 시작...');

    // 🚀 실제 RDS PostgreSQL에서 vehicles 테이블 스키마 조회
    const schemaQuery = `
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'vehicles'
      ORDER BY ordinal_position;
    `;

    console.log(`📊 스키마 조회 쿼리: ${schemaQuery}`);
    const schemaResult = await query(schemaQuery);

    // 실제 차량 데이터 샘플도 함께 조회 (첫 번째 차량)
    const sampleQuery = `
      SELECT *
      FROM vehicles
      WHERE price > 0
      LIMIT 1
    `;

    console.log(`📊 샘플 데이터 쿼리: ${sampleQuery}`);
    const sampleResult = await query(sampleQuery);

    // 테이블 통계 정보
    const statsQuery = `
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT manufacturer) as unique_manufacturers,
        COUNT(DISTINCT model) as unique_models,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price::numeric) as avg_price
      FROM vehicles
      WHERE price > 0
    `;

    console.log(`📊 통계 쿼리: ${statsQuery}`);
    const statsResult = await query(statsQuery);

    const schemaInfo = {
      columns: schemaResult.rows,
      columnCount: schemaResult.rows.length,
      columnNames: schemaResult.rows.map(col => col.column_name)
    };

    const sampleData = sampleResult.rows[0] || null;
    const statistics = statsResult.rows[0] || null;

    console.log('✅ RDS vehicles 테이블 스키마 분석 완료:', {
      columns: schemaInfo.columnCount,
      sampleVehicle: sampleData?.vehicleid || 'none',
      totalRecords: statistics?.total_records || 0
    });

    return NextResponse.json({
      success: true,
      schema: schemaInfo,
      sampleData: sampleData,
      statistics: {
        totalRecords: parseInt(statistics?.total_records || 0),
        uniqueManufacturers: parseInt(statistics?.unique_manufacturers || 0),
        uniqueModels: parseInt(statistics?.unique_models || 0),
        priceRange: {
          min: parseInt(statistics?.min_price || 0),
          max: parseInt(statistics?.max_price || 0),
          avg: Math.round(parseFloat(statistics?.avg_price || 0))
        }
      },
      source: 'AWS RDS PostgreSQL',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ RDS 스키마 분석 오류:', error);

    // 구체적인 오류 정보 제공
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        success: false,
        error: 'AWS RDS PostgreSQL 연결 실패',
        details: 'RDS 인스턴스 상태를 확인하세요.',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    if (error.code === '42P01') {
      return NextResponse.json({
        success: false,
        error: 'vehicles 테이블을 찾을 수 없습니다.',
        details: '데이터베이스 스키마를 확인하세요.',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'RDS 스키마 분석 중 오류 발생',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}