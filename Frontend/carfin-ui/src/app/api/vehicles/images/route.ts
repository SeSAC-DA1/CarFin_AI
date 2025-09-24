import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manufacturer = searchParams.get('manufacturer');
    const model = searchParams.get('model');
    const vehicleId = searchParams.get('vehicleId');
    const cartype = searchParams.get('cartype') || 'sedan';

    console.log(`🚗 차량 이미지 요청: manufacturer=${manufacturer}, model=${model}, vehicleId=${vehicleId}, cartype=${cartype}`);

    // 🎨 브랜드별 색상 매핑
    const brandColors: Record<string, string> = {
      '현대': '1e40af',      // 파란색
      '기아': '059669',      // 초록색
      '제네시스': '7c3aed',  // 보라색
      'BMW': '0f172a',       // 검정색
      '벤츠': '4b5563',      // 회색
      '아우디': '64748b',    // 청회색
      '토요타': 'dc2626',    // 빨간색
      '혼다': 'f97316',      // 주황색
      '닛산': '0891b2',      // 하늘색
      '폭스바겐': '065f46',  // 녹색
      '쉐보레': 'fbbf24',    // 노란색
      '렉서스': '581c87',    // 진보라색
      '인피니티': 'be185d',  // 분홍색
      '볼보': '374151',      // 진회색
      '미쓰비시': 'e11d48',  // 빨간색
      '스바루': '10b981',    // 녹색
      '마쓰다': 'f59e0b',    // 주황색
    };

    // 🚗 차종별 아이콘/텍스트 매핑
    const vehicleTypeIcons: Record<string, string> = {
      'SUV': '🚙',
      '세단': '🚗',
      '해치백': '🚕',
      '쿠페': '🏎️',
      '왜건': '🚐',
      'MPV': '🚌',
      '트럭': '🚚',
      '컨버터블': '🏎️',
      '경차': '🚗',
      '준중형': '🚗',
      '중형': '🚗',
      '대형': '🚗',
    };

    // 동적 이미지 URL 생성
    let imageUrl = '';
    let displayText = '';
    let brandColor = '6b7280'; // 기본 회색

    if (manufacturer && model) {
      // 브랜드 색상 결정
      brandColor = brandColors[manufacturer] || '6b7280';

      // 차종 아이콘 결정
      const typeIcon = vehicleTypeIcons[cartype] || vehicleTypeIcons['세단'] || '🚗';

      // 표시할 텍스트 구성
      displayText = `${typeIcon}+${encodeURIComponent(manufacturer)}+${encodeURIComponent(model)}`;

      // 고품질 placeholder 이미지 URL 생성
      imageUrl = `https://via.placeholder.com/400x250/${brandColor}/ffffff?text=${displayText}`;

      console.log(`✅ 이미지 생성: ${manufacturer} ${model} -> ${brandColor}`);
    } else if (vehicleId) {
      // vehicleId만 있는 경우 기본 이미지
      displayText = `🚗+Vehicle+${vehicleId}`;
      imageUrl = `https://via.placeholder.com/400x250/6b7280/ffffff?text=${displayText}`;

      console.log(`⚠️ vehicleId만으로 이미지 생성: ${vehicleId}`);
    }

    if (imageUrl) {
      console.log(`🚗 차량 이미지 제공: ${manufacturer} ${model} -> ${imageUrl}`);

      return NextResponse.json({
        success: true,
        imageUrl,
        manufacturer,
        model,
        vehicleId,
        cartype,
        brandColor: `#${brandColor}`,
        displayText: decodeURIComponent(displayText),
        message: '차량 이미지가 성공적으로 생성되었습니다.',
        isPlaceholder: true,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`⚠️ 차량 정보 부족으로 기본 이미지 제공`);

      // 기본 플레이스홀더 이미지
      const defaultImageUrl = 'https://via.placeholder.com/400x250/e5e7eb/6b7280?text=🚗+Vehicle+Image';

      return NextResponse.json({
        success: true,
        imageUrl: defaultImageUrl,
        manufacturer,
        model,
        vehicleId,
        message: '기본 차량 이미지를 제공합니다.',
        isPlaceholder: true,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('차량 이미지 API 오류:', error);

    return NextResponse.json({
      success: false,
      error: '차량 이미지 조회 중 오류가 발생했습니다.',
      imageUrl: 'https://via.placeholder.com/400x300/ef4444/ffffff?text=Image+Error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST 요청으로 여러 차량의 이미지를 한번에 조회
export async function POST(request: NextRequest) {
  try {
    const { vehicles } = await request.json();

    if (!vehicles || !Array.isArray(vehicles)) {
      return NextResponse.json({
        success: false,
        error: '차량 정보 배열이 필요합니다.',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const vehicleImages = vehicles.map((vehicle: any) => {
      const imageKey = `${vehicle.manufacturer || ''}_${vehicle.model || ''}`;

      // 간단한 이미지 매핑 (실제로는 데이터베이스에서 조회)
      const imageUrl = `https://via.placeholder.com/400x300/3b82f6/ffffff?text=${encodeURIComponent(vehicle.manufacturer + ' ' + vehicle.model)}`;

      return {
        vehicleId: vehicle.vehicleId || vehicle.id,
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        imageUrl,
        isPlaceholder: true
      };
    });

    console.log(`🚗 일괄 차량 이미지 제공: ${vehicles.length}대 차량`);

    return NextResponse.json({
      success: true,
      vehicles: vehicleImages,
      count: vehicleImages.length,
      message: `${vehicleImages.length}개 차량 이미지가 성공적으로 조회되었습니다.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('차량 이미지 일괄 조회 오류:', error);

    return NextResponse.json({
      success: false,
      error: '차량 이미지 일괄 조회 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}