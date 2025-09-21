import { Vehicle } from '@/types';
import { RealVehicleData } from '@/app/api/vehicles/route';

// 브랜드별 주요 특징 데이터베이스
const BRAND_FEATURES: Record<string, string[]> = {
  '현대': ['스마트센스', 'BlueLink', '10년보증'],
  '기아': ['UVO커넥트', '7년보증', '스마트키'],
  '제네시스': ['나파가죽', '프리미엄오디오', '에어서스펜션'],
  '삼성': ['르노테크닉', '안전시스템', '편의사양'],
  '쌍용': ['4WD시스템', '견고함', '실용성'],
  '한국GM': ['OnStar', '안전시스템', '스타일'],
  'BMW': ['런플랫타이어', '하만카돈', '무선충전'],
  '벤츠': ['에어매틱', '부르메스터', 'MBUX'],
  '아우디': ['콰트로', '버추얼콕핏', 'MMI'],
  '폭스바겐': ['TSI엔진', '안전시스템', '실용성'],
  '볼보': ['안전시스템', '스칸디나비아디자인', '친환경'],
  '테슬라': ['오토파일럿', '슈퍼차징', 'OTA업데이트'],
  '토요타': ['하이브리드', '신뢰성', 'TSS'],
  '렉서스': ['마크레빈슨', '세미아닐린가죽', 'LSS+'],
  '닛산': ['ProPILOT', 'CVT', '안전시스템'],
  '혼다': ['Honda SENSING', 'i-VTEC', '실용성'],
  '마쓰다': ['SKYACTIV', 'i-ACTIVSENSE', '디자인'],
  '스바루': ['AWD', 'EyeSight', '안전성'],
  '미츠비시': ['4WD', 'ASC', '내구성'],
  '인피니티': ['프리미엄', 'VQ엔진', '성능'],
  '포드': ['EcoBoost', 'SYNC', '성능'],
  '링컨': ['럭셔리', '프리미엄오디오', '편안함'],
  '쉐보레': ['MyLink', '성능', '스타일'],
  '캐딜락': ['럭셔리', 'CUE', '프리미엄'],
  '크라이슬러': ['Uconnect', '편안함', '스타일'],
  '지프': ['4WD', '오프로드', '견고함'],
  '푸조': ['디젤엔진', '유럽디자인', '편안함'],
  '시트로엥': ['편안함', '독특한디자인', '실용성'],
  '르노': ['디젤엔진', '안전시스템', '경제성']
};

// 연료타입별 평균 연비 (km/L)
const FUEL_EFFICIENCY: Record<string, { base: number; yearBonus: number }> = {
  '가솔린': { base: 11.5, yearBonus: 0.1 },
  '디젤': { base: 14.8, yearBonus: 0.15 },
  '하이브리드': { base: 17.2, yearBonus: 0.2 },
  '전기': { base: 0, yearBonus: 0 }, // 전기차는 연비 0
  'LPG': { base: 9.8, yearBonus: 0.05 },
  'CNG': { base: 12.1, yearBonus: 0.08 }
};

// 브랜드별 안전등급 (기본값)
const SAFETY_RATINGS: Record<string, number> = {
  '현대': 5, '기아': 5, '제네시스': 5, '테슬라': 5,
  'BMW': 5, '벤츠': 5, '아우디': 5, '볼보': 5,
  '토요타': 5, '렉서스': 5, '혼다': 4, '닛산': 4,
  '폭스바겐': 4, '마쓰다': 4, '스바루': 5, '포드': 4,
  '쉐보레': 4, '쌍용': 4, '삼성': 4, '한국GM': 4
};

// 색상 기본값 배열
const DEFAULT_COLORS = ['화이트', '블랙', '실버', '그레이', '블루', '레드'];

/**
 * RealVehicleData를 Vehicle 인터페이스로 변환
 */
export function transformVehicleData(realData: RealVehicleData): Vehicle {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - realData.modelyear;

  return {
    id: realData.vehicleid || `car_${Math.random().toString(36).substr(2, 9)}`,
    brand: realData.manufacturer || '현대',
    model: realData.model || '소나타',
    year: realData.modelyear || 2020,
    price: realData.price || 2500,
    mileage: realData.distance || 50000,
    fuel_type: realData.fueltype || '가솔린',
    body_type: realData.cartype || '세단',
    color: getRandomColor(),
    location: realData.location || '서울',
    images: realData.photo ? [realData.photo] : [generatePlaceholderImage(realData.manufacturer, realData.model)],
    features: generateFeatures(realData.manufacturer, realData.model),
    fuel_efficiency: estimateFuelEfficiency(realData.fueltype, realData.modelyear),
    safety_rating: getSafetyRating(realData.manufacturer),
    match_score: calculateInitialMatchScore(realData),
    description: generateDescription(realData),
    highlight: generateHighlight(realData, vehicleAge),
    detail_url: realData.detailurl // 엔카 상세보기 URL 매핑
  };
}

/**
 * 브랜드/모델 기반 특징 생성
 */
export function generateFeatures(manufacturer: string, model: string): string[] {
  const brandFeatures = BRAND_FEATURES[manufacturer] || ['편의사양', '안전시스템', '경제성'];

  // 모델명 기반 추가 특징
  const modelFeatures: string[] = [];

  if (model?.includes('하이브리드') || model?.includes('HEV')) {
    modelFeatures.push('하이브리드시스템');
  }
  if (model?.includes('터보') || model?.includes('T-GDI')) {
    modelFeatures.push('터보엔진');
  }
  if (model?.includes('AWD') || model?.includes('4WD')) {
    modelFeatures.push('4륜구동');
  }
  if (model?.includes('프리미엄') || model?.includes('럭셔리')) {
    modelFeatures.push('프리미엄옵션');
  }

  return [...brandFeatures.slice(0, 2), ...modelFeatures].slice(0, 3);
}

/**
 * 연료타입과 연식 기반 연비 추정
 */
export function estimateFuelEfficiency(fueltype: string, modelyear: number): number {
  const currentYear = new Date().getFullYear();
  const efficiencyData = FUEL_EFFICIENCY[fueltype] || FUEL_EFFICIENCY['가솔린'];

  if (fueltype === '전기') return 0; // 전기차는 연비 대신 전비

  const yearsFromBase = Math.max(0, modelyear - 2015); // 2015년 기준
  const efficiency = efficiencyData.base + (yearsFromBase * efficiencyData.yearBonus);

  return Math.round(efficiency * 10) / 10; // 소수점 첫째자리 반올림
}

/**
 * 브랜드 기반 안전등급 반환
 */
export function getSafetyRating(manufacturer: string): number {
  return SAFETY_RATINGS[manufacturer] || 4;
}

/**
 * 랜덤 색상 반환
 */
function getRandomColor(): string {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
}

/**
 * 플레이스홀더 이미지 URL 생성
 */
function generatePlaceholderImage(manufacturer: string, model: string): string {
  const encodedText = encodeURIComponent(`${manufacturer} ${model}`);
  return `https://via.placeholder.com/400x300/f8fafc/64748b?text=${encodedText}`;
}

/**
 * 초기 매칭 점수 계산 (단순 버전)
 */
function calculateInitialMatchScore(vehicle: RealVehicleData): number {
  let score = 70; // 기본 점수

  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicle.modelyear;

  // 연식 보너스 (새로울수록 높은 점수)
  if (vehicleAge <= 1) score += 15;
  else if (vehicleAge <= 3) score += 10;
  else if (vehicleAge <= 5) score += 5;
  else score -= Math.min(vehicleAge - 5, 10);

  // 주행거리 보너스 (적을수록 높은 점수)
  if (vehicle.distance <= 30000) score += 10;
  else if (vehicle.distance <= 80000) score += 5;
  else if (vehicle.distance >= 150000) score -= 5;

  // 가격대별 조정
  if (vehicle.price >= 3000 && vehicle.price <= 6000) score += 5; // 중간 가격대

  // 브랜드 프리미엄
  const premiumBrands = ['테슬라', 'BMW', '벤츠', '아우디', '렉서스', '제네시스'];
  if (premiumBrands.includes(vehicle.manufacturer)) score += 8;

  return Math.min(Math.max(score, 50), 98); // 50-98 범위로 제한
}

/**
 * 차량 설명 생성
 */
export function generateDescription(vehicle: RealVehicleData): string {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicle.modelyear;
  const kmText = `${Math.round(vehicle.distance / 10000)}만km`;

  // 브랜드별 특징
  const brandDescriptions: Record<string, string> = {
    '현대': '신뢰성 높은 국산차로 A/S와 부품 수급이 원활합니다.',
    '기아': '세련된 디자인과 실용성을 겸비한 인기 모델입니다.',
    '제네시스': '국산 프리미엄 브랜드로 고급스러운 옵션과 편안한 승차감을 제공합니다.',
    'BMW': '독일 프리미엄 브랜드로 뛰어난 주행성능과 브랜드 가치를 자랑합니다.',
    '벤츠': '세계 최고급 브랜드로 탁월한 품질과 고급스러움을 경험할 수 있습니다.',
    '테슬라': '혁신적인 전기차 기술과 자율주행 기능으로 미래형 드라이빙을 제공합니다.',
    '토요타': '일본의 대표 브랜드로 뛰어난 내구성과 경제성을 자랑합니다.',
    '렉서스': '일본 최고급 브랜드로 조용하고 부드러운 승차감이 특징입니다.'
  };

  const brandDesc = brandDescriptions[vehicle.manufacturer] || '검증된 품질과 성능을 제공하는 신뢰할 수 있는 차량입니다.';

  // 연료타입별 추가 설명
  const fuelDescriptions: Record<string, string> = {
    '전기': '친환경적이며 연료비 부담이 적어 경제적입니다.',
    '하이브리드': '연비가 뛰어나 경제적이며 환경친화적입니다.',
    '디젤': '높은 연비와 강한 토크로 장거리 운행에 적합합니다.',
    '가솔린': '정비가 용이하고 연료 공급이 편리합니다.'
  };

  const fuelDesc = fuelDescriptions[vehicle.fueltype] || '';

  // 상태 설명
  let conditionDesc = '';
  if (vehicleAge <= 2 && vehicle.distance <= 50000) {
    conditionDesc = '신차급 컨디션으로 ';
  } else if (vehicleAge <= 5 && vehicle.distance <= 100000) {
    conditionDesc = '양호한 상태로 ';
  }

  return `${conditionDesc}${brandDesc} ${vehicle.modelyear}년식 ${kmText} 주행으로 ${fuelDesc} 합리적인 가격에 만나보실 수 있습니다.`;
}

/**
 * 하이라이트 라벨 생성
 */
export function generateHighlight(vehicle: RealVehicleData, vehicleAge: number): string | undefined {
  // 신차급 (2년 이하, 3만km 이하)
  if (vehicleAge <= 2 && vehicle.distance <= 30000) {
    return '✨ 신차급';
  }

  // 저주행 (5년 이하, 5만km 이하)
  if (vehicleAge <= 5 && vehicle.distance <= 50000) {
    return '🎯 저주행';
  }

  // 가성비 (100만km당 50만원 이하)
  const pricePerKm = vehicle.price / (vehicle.distance / 10000);
  if (pricePerKm <= 50) {
    return '💰 가성비';
  }

  // 프리미엄 브랜드
  const premiumBrands = ['테슬라', 'BMW', '벤츠', '아우디', '렉서스', '제네시스'];
  if (premiumBrands.includes(vehicle.manufacturer)) {
    return '👑 프리미엄';
  }

  // 전기차/하이브리드
  if (vehicle.fueltype === '전기') {
    return '⚡ 전기차';
  }
  if (vehicle.fueltype === '하이브리드') {
    return '🔋 하이브리드';
  }

  return undefined;
}

/**
 * 다중 차량 데이터 변환
 */
export function transformMultipleVehicles(realDataArray: RealVehicleData[]): Vehicle[] {
  return realDataArray.map(transformVehicleData);
}

/**
 * 사용자 프로필 기반 매칭 점수 재계산
 */
export function recalculateMatchScore(
  vehicle: Vehicle,
  userProfile?: Record<string, unknown>
): Vehicle {
  if (!userProfile) return vehicle;

  let adjustedScore = vehicle.match_score;

  // 예산 범위 매칭
  const budgetRange = userProfile.budgetRange as { min: number; max: number } | undefined;
  if (budgetRange) {
    if (vehicle.price >= budgetRange.min && vehicle.price <= budgetRange.max) {
      adjustedScore += 10;
    } else if (vehicle.price > budgetRange.max) {
      adjustedScore -= Math.min((vehicle.price - budgetRange.max) / 100, 15);
    }
  }

  // 연료타입 선호도
  const fuelPreference = userProfile.preferences as string[] | undefined;
  if (fuelPreference?.includes(vehicle.fuel_type)) {
    adjustedScore += 8;
  }

  // 브랜드 선호도
  const brandPreference = userProfile.preferredBrand as string | undefined;
  if (brandPreference && vehicle.brand.includes(brandPreference)) {
    adjustedScore += 12;
  }

  return {
    ...vehicle,
    match_score: Math.min(Math.max(Math.round(adjustedScore), 50), 98)
  };
}