// app/api/vehicle/analysis/[vehicleId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { VehicleAnalysisEngine } from '@/lib/analysis/VehicleAnalysisEngine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const resolvedParams = await params;
  console.log(`🔍 실제 차량 분석 요청: ${resolvedParams.vehicleId}`);

  try {
    const vehicleId = resolvedParams.vehicleId;

    console.log(`🔍 실제 차량 분석 시작: ${vehicleId}`);

    // 실제 VehicleAnalysisEngine 사용
    const analysisEngine = new VehicleAnalysisEngine();

    // vehicleId를 숫자로 변환 (실제 DB ID)
    const numericVehicleId = parseInt(vehicleId.replace(/\D/g, '')) || 1;

    const realAnalysis = await analysisEngine.analyzeVehicle(numericVehicleId);

    if (realAnalysis) {
      console.log(`✅ 실제 분석 완료: 종합 점수 ${realAnalysis.overallScore}점`);

      return NextResponse.json({
        success: true,
        vehicleInsight: {
          ...realAnalysis,
          analysisMetadata: {
            mode: 'production',
            analysisVersion: '1.0-real',
            dataSource: 'PostgreSQL RDS',
            timestamp: new Date().toISOString()
          }
        }
      });
    } else {
      throw new Error('실제 차량 분석 실패 - RDS 데이터베이스 연결 또는 분석 엔진 문제');
    }

  } catch (error) {
    console.error('❌ 실제 차량 분석 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '실제 차량 분석 중 오류 발생',
      message: '실제 RDS 데이터베이스 기반 분석만 지원됩니다'
    }, { status: 500 });
  }
}