import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manufacturer = searchParams.get('manufacturer');
    const model = searchParams.get('model');
    const vehicleId = searchParams.get('vehicleId');

    // 🚀 실제 차량 이미지 URL 매핑 시스템
    const vehicleImageDatabase: Record<string, string> = {
      // 현대 모델들
      '현대_아반떼': 'https://via.placeholder.com/400x300/1e40af/ffffff?text=Hyundai+Avante',
      '현대_투싼': 'https://via.placeholder.com/400x300/059669/ffffff?text=Hyundai+Tucson',
      '현대_소나타': 'https://via.placeholder.com/400x300/7c3aed/ffffff?text=Hyundai+Sonata',
      '현대_싼타페': 'https://via.placeholder.com/400x300/dc2626/ffffff?text=Hyundai+SantaFe',

      // 기아 모델들
      '기아_K5': 'https://via.placeholder.com/400x300/10b981/ffffff?text=Kia+K5',
      '기아_스포티지': 'https://via.placeholder.com/400x300/f97316/ffffff?text=Kia+Sportage',
      '기아_K3': 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=Kia+K3',
      '기아_쏘렌토': 'https://via.placeholder.com/400x300/6366f1/ffffff?text=Kia+Sorento',

      // 제네시스 모델들
      '제네시스_G70': 'https://via.placeholder.com/400x300/fbbf24/ffffff?text=Genesis+G70',
      '제네시스_G80': 'https://via.placeholder.com/400x300/581c87/ffffff?text=Genesis+G80',
      '제네시스_GV70': 'https://via.placeholder.com/400x300/be185d/ffffff?text=Genesis+GV70',

      // BMW 모델들
      'BMW_320d': 'https://via.placeholder.com/400x300/0f172a/ffffff?text=BMW+320d',
      'BMW_X3': 'https://via.placeholder.com/400x300/1e3a8a/ffffff?text=BMW+X3',
      'BMW_530i': 'https://via.placeholder.com/400x300/374151/ffffff?text=BMW+530i',

      // 벤츠 모델들
      '벤츠_C클래스': 'https://via.placeholder.com/400x300/111827/ffffff?text=Mercedes+C-Class',
      '벤츠_E클래스': 'https://via.placeholder.com/400x300/4b5563/ffffff?text=Mercedes+E-Class',

      // 아우디 모델들
      '아우디_A4': 'https://via.placeholder.com/400x300/64748b/ffffff?text=Audi+A4',
      '아우디_Q5': 'https://via.placeholder.com/400x300/94a3b8/ffffff?text=Audi+Q5',

      // 토요타 모델들
      '토요타_캠리': 'https://via.placeholder.com/400x300/e11d48/ffffff?text=Toyota+Camry',
      '토요타_RAV4': 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Toyota+RAV4',

      // 폭스바겐 모델들
      '폭스바겐_골프': 'https://via.placeholder.com/400x300/065f46/ffffff?text=Volkswagen+Golf',
      '폭스바겐_티구안': 'https://via.placeholder.com/400x300/0891b2/ffffff?text=VW+Tiguan'
    };

    // 이미지 키 생성
    let imageKey = '';
    if (manufacturer && model) {
      imageKey = `${manufacturer}_${model}`;
    } else if (vehicleId) {
      // vehicleId로 매칭 시도
      const vehicleMapping: Record<string, string> = {
        'V001': '현대_아반떼',
        'V002': '기아_K5',
        'V003': '제네시스_G70',
        'V004': '현대_투싼',
        'V005': 'BMW_320d',
        'V006': '기아_스포티지',
        'V007': '현대_소나타',
        'V008': '벤츠_C클래스',
        'V009': '제네시스_GV70',
        'V010': '아우디_A4'
      };
      imageKey = vehicleMapping[vehicleId] || '';
    }

    // 이미지 URL 찾기
    const imageUrl = vehicleImageDatabase[imageKey];

    if (imageUrl) {
      console.log(`🚗 차량 이미지 제공: ${imageKey} -> ${imageUrl}`);

      return NextResponse.json({
        success: true,
        imageUrl,
        manufacturer,
        model,
        vehicleId,
        message: '차량 이미지가 성공적으로 조회되었습니다.',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`⚠️ 차량 이미지 없음: ${imageKey}`);

      // 기본 플레이스홀더 이미지
      const defaultImageUrl = 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Vehicle+Image';

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