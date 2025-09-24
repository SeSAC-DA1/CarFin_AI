import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { vehicleId } = await params;

    if (!vehicleId) {
      return NextResponse.json({
        success: false,
        error: '차량 ID가 필요합니다.',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    console.log(`🚗 개별 차량 상세 조회 시작: ${vehicleId}`);

    // 🚀 실제 RDS PostgreSQL에서 차량 상세 정보 조회
    const vehicleQuery = `
      SELECT *
      FROM vehicles
      WHERE vehicleid = $1
      LIMIT 1
    `;

    console.log(`📊 실행 쿼리: ${vehicleQuery}`, [vehicleId]);
    const result = await query(vehicleQuery, [vehicleId]);

    if (result.rows.length === 0) {
      console.log(`⚠️ 차량을 찾을 수 없음: ${vehicleId}`);
      return NextResponse.json({
        success: false,
        error: '해당 차량 정보를 찾을 수 없습니다.',
        vehicleId,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    const vehicleData = result.rows[0];
    console.log(`✅ 차량 정보 조회 성공:`, {
      vehicleId: vehicleData.vehicleid,
      manufacturer: vehicleData.manufacturer,
      model: vehicleData.model,
      price: vehicleData.price,
      columns: Object.keys(vehicleData).length
    });

    // 🏷️ 실제 데이터베이스 스키마 정보 로깅 (개발용)
    console.log(`🗄️ 실제 DB 스키마 (${Object.keys(vehicleData).length}개 컬럼):`,
      Object.keys(vehicleData).join(', ')
    );

    return NextResponse.json({
      success: true,
      vehicle: vehicleData,
      schema: {
        totalColumns: Object.keys(vehicleData).length,
        columnNames: Object.keys(vehicleData)
      },
      source: 'AWS RDS PostgreSQL',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 차량 상세 정보 조회 오류:', error);

    // RDS 연결 실패시 명확한 에러 메시지
    if (error.code === 'ECONNREFUSED') {
      const awaitedParams = await params;
      return NextResponse.json({
        success: false,
        error: 'AWS RDS PostgreSQL 연결에 실패했습니다. 네트워크를 확인해주세요.',
        vehicleId: awaitedParams.vehicleId,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const awaitedParams = await params;
    return NextResponse.json({
      success: false,
      error: '차량 정보 조회 중 오류가 발생했습니다.',
      vehicleId: awaitedParams.vehicleId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST 요청으로 여러 차량 ID에 대한 일괄 조회
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { vehicleIds } = await request.json();

    if (!vehicleIds || !Array.isArray(vehicleIds)) {
      return NextResponse.json({
        success: false,
        error: '차량 ID 배열이 필요합니다.',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    console.log(`🚗 일괄 차량 상세 조회 시작: ${vehicleIds.length}개`);

    // 🚀 실제 RDS PostgreSQL에서 여러 차량 조회
    const placeholders = vehicleIds.map((_, index) => `$${index + 1}`).join(',');
    const vehiclesQuery = `
      SELECT *
      FROM vehicles
      WHERE vehicleid IN (${placeholders})
    `;

    console.log(`📊 일괄 조회 쿼리: ${vehiclesQuery}`, vehicleIds);
    const result = await query(vehiclesQuery, vehicleIds);

    console.log(`✅ 일괄 차량 조회 성공: ${result.rows.length}개 / 요청 ${vehicleIds.length}개`);

    return NextResponse.json({
      success: true,
      vehicles: result.rows,
      count: result.rows.length,
      requested: vehicleIds.length,
      source: 'AWS RDS PostgreSQL',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 일괄 차량 조회 오류:', error);

    return NextResponse.json({
      success: false,
      error: '일괄 차량 조회 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}