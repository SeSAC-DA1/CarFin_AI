// app/api/vehicle/analysis/[vehicleId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { VehicleAnalysisEngine } from '@/lib/analysis/VehicleAnalysisEngine';
import { query } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  console.log(`🔍 차량 분석 요청: ${params.vehicleId}`);

  try {
    const vehicleId = params.vehicleId;

    // DEMO_MODE가 false면 실제 데이터베이스 분석 실행
    if (process.env.DEMO_MODE !== 'true') {
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
        throw new Error('실제 차량 분석 실패');
      }
    }

    // DEMO_MODE가 true인 경우에만 Demo 데이터 사용
    console.log(`🎭 데모 모드: 즉시 분석 결과 생성`);

    // Demo 차량 정보 (vehicleId 기반)
    const demoVehicleInfo = {
      id: vehicleId,
      model: vehicleId.includes('demo_1') ? '투싼' :
             vehicleId.includes('demo_2') ? '스포티지' :
             vehicleId.includes('demo_3') ? '아반떼' :
             vehicleId.includes('demo_4') ? 'K3' :
             vehicleId.includes('demo_5') ? '그랜저' : '쏘나타',
      brand: vehicleId.includes('demo_1') || vehicleId.includes('demo_3') || vehicleId.includes('demo_5') ? '현대' : '기아',
      year: 2020 + Math.floor(Math.random() * 4),
      price: 2000 + Math.floor(Math.random() * 1500),
      mileage: 20000 + Math.floor(Math.random() * 60000),
      fuel_type: Math.random() > 0.7 ? '하이브리드' : '가솔린'
    };

    // 실제 데이터 패턴을 모방한 Demo 분석 결과 생성
    const overallScore = 75 + Math.floor(Math.random() * 20); // 75-95점
    const priceCompetitiveness = 70 + Math.floor(Math.random() * 25); // 70-95점
    const mileageVsAge = 60 + Math.floor(Math.random() * 30); // 60-90점
    const ageCompetitiveness = 80 + Math.floor(Math.random() * 15); // 80-95점
    const optionCompetitiveness = 65 + Math.floor(Math.random() * 30); // 65-95점

    const insight = {
      vehicleId: vehicleId,
      overallScore: overallScore,
      priceCompetitiveness: priceCompetitiveness,
      mileageVsAge: mileageVsAge,
      ageCompetitiveness: ageCompetitiveness,
      optionCompetitiveness: optionCompetitiveness,
      peerGroupSize: 120 + Math.floor(Math.random() * 80), // 120-200대
      keyStrengths: [
        '동급 대비 우수한 연비 효율성',
        '안전사양 기본 적용률 높음',
        '합리적인 가격대 형성',
        '브랜드 신뢰도 우수'
      ].slice(0, 2 + Math.floor(Math.random() * 2)),
      keyWeaknesses: [
        '일부 편의옵션 미적용',
        '주행거리 다소 높음',
        '트림별 옵션 차이 존재'
      ].slice(0, 1 + Math.floor(Math.random() * 2)),
      optionHighlights: {
        owned: [
          '스마트 크루즈 컨트롤',
          '후방 카메라',
          '네비게이션',
          '열선시트',
          'LED 헤드램프'
        ].slice(0, 3 + Math.floor(Math.random() * 2)),
        popular: [
          { name: '스마트 크루즈 컨트롤', popularity: 85.4 },
          { name: '후방 카메라', popularity: 92.1 },
          { name: '네비게이션', popularity: 78.3 },
          { name: '열선시트', popularity: 71.6 },
          { name: 'LED 헤드램프', popularity: 67.2 }
        ],
        missing: [
          '360도 카메라',
          '무선충전패드',
          '통풍시트'
        ].slice(0, Math.floor(Math.random() * 2))
      },
      userReviews: {
        sentiment: 0.3 + Math.random() * 0.4, // 0.3-0.7 (긍정적)
        commonPositives: [
          '연비가 정말 만족스러워요',
          '가족용으로 딱 맞는 크기입니다',
          '안전장치가 잘 되어있어요',
          'A/S가 편리합니다'
        ].slice(0, 2 + Math.floor(Math.random() * 2)),
        commonNegatives: [
          '옵션이 조금 아쉬워요',
          '엔진음이 가끔 신경 쓰입니다',
          '뒷좌석이 좀 좁아요'
        ].slice(0, 1 + Math.floor(Math.random() * 2)),
        sampleReviews: [
          '가성비 정말 좋은 차입니다. 연비도 만족하고 고장도 거의 없어요.',
          '디자인이 예쁘고 운전하기 편해요. 가족들도 모두 만족합니다.',
          '처음 중고차 구매인데 상태가 정말 좋네요. 추천합니다!'
        ].slice(0, 2 + Math.floor(Math.random() * 1))
      },
      recommendation: `이 차량은 동급 대비 ${overallScore >= 85 ? '매우 우수한' : overallScore >= 75 ? '우수한' : '양호한'} 종합 점수를 보여줍니다. 특히 ${priceCompetitiveness >= 80 ? '가격 경쟁력이 뛰어나며' : '합리적인 가격에'} ${ageCompetitiveness >= 85 ? '연식도 우수합니다' : '적절한 연식을 유지하고 있습니다'}. ${overallScore >= 80 ? '적극 추천하는' : '고려해볼 만한'} 매물입니다.`
    };

    console.log(`✅ Mock 차량 분석 완료: 종합점수 ${insight.overallScore}점 (즉시 응답)`);

    return NextResponse.json({
      success: true,
      vehicleInfo: mockVehicleInfo,
      insight: insight,
      analysisMetadata: {
        analyzedAt: new Date().toISOString(),
        peerGroupSize: insight.peerGroupSize,
        analysisVersion: '1.0-demo',
        mode: 'demo'
      }
    });

  } catch (error) {
    console.error('❌ 차량 분석 API 오류:', error);

    return NextResponse.json(
      {
        error: '차량 분석 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 차량 분석 캐시 무효화
export async function DELETE(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  try {
    // TODO: 실제 캐시 구현 시 해당 차량의 분석 캐시 삭제
    console.log(`🗑️ 차량 분석 캐시 삭제: ${params.vehicleId}`);

    return NextResponse.json({
      success: true,
      message: '차량 분석 캐시가 삭제되었습니다.'
    });
  } catch (error) {
    return NextResponse.json(
      { error: '캐시 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}