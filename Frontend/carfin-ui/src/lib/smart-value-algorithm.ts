/**
 * 🧠 슈퍼클로드 스마트 가성비 알고리즘
 * 가격대별 세분화된 가치 평가 시스템
 */

export interface ValueScoreMetrics {
  priceEfficiencyScore: number;    // 가격 효율성 (0-100)
  ageValueScore: number;           // 연식 대비 가치 (0-100)
  mileageValueScore: number;       // 주행거리 대비 가치 (0-100)
  brandPremiumScore: number;       // 브랜드 프리미엄 (0-100)
  overallValueScore: number;       // 종합 가성비 점수 (0-100)
  valueGrade: 'S' | 'A' | 'B' | 'C' | 'D';
}

interface PriceSegment {
  name: string;
  minPrice: number;
  maxPrice: number;
  category: 'economy' | 'compact' | 'midsize' | 'luxury' | 'premium';
  expectedMileageRange: [number, number];
  expectedAgeRange: [number, number];
}

// 🎯 가격대별 세분화된 세그먼트 정의
const PRICE_SEGMENTS: PriceSegment[] = [
  {
    name: '경차/초소형',
    minPrice: 800,
    maxPrice: 1500,
    category: 'economy',
    expectedMileageRange: [30000, 120000],
    expectedAgeRange: [3, 10]
  },
  {
    name: '소형차',
    minPrice: 1200,
    maxPrice: 2500,
    category: 'compact',
    expectedMileageRange: [20000, 100000],
    expectedAgeRange: [2, 8]
  },
  {
    name: '준중형차',
    minPrice: 2000,
    maxPrice: 4000,
    category: 'midsize',
    expectedMileageRange: [15000, 80000],
    expectedAgeRange: [1, 6]
  },
  {
    name: '중형차/대형차',
    minPrice: 3500,
    maxPrice: 7000,
    category: 'luxury',
    expectedMileageRange: [10000, 70000],
    expectedAgeRange: [1, 5]
  },
  {
    name: '프리미엄/수입차',
    minPrice: 5000,
    maxPrice: 50000,
    category: 'premium',
    expectedMileageRange: [5000, 60000],
    expectedAgeRange: [1, 7]
  }
];

// 🏆 브랜드별 프리미엄 점수
const BRAND_PREMIUM_SCORES: Record<string, number> = {
  // 프리미엄 수입차 (90-100점)
  '테슬라': 100,
  'BMW': 95,
  '벤츠': 95,
  '아우디': 92,
  '렉서스': 90,
  '포르쉐': 100,
  '제네시스': 88,

  // 중급 브랜드 (70-85점)
  '볼보': 85,
  '현대': 75,
  '기아': 75,
  '토요타': 80,
  '혼다': 78,
  '닛산': 72,
  '폭스바겐': 82,
  '마쓰다': 70,

  // 경제형 브랜드 (50-69점)
  '쉐보레': 65,
  '르노': 60,
  '삼성': 55,
  '쌍용': 50,
  '한국GM': 65,
  '대우': 50
};

/**
 * 🔍 차량이 속한 가격 세그먼트 식별
 */
export function identifyPriceSegment(price: number, cartype?: string): PriceSegment | null {
  // 차종 정보를 활용한 세그먼트 우선 판별
  if (cartype) {
    if (cartype.includes('경차') && price <= 2000) {
      return PRICE_SEGMENTS[0]; // 경차/초소형
    }
    if (cartype.includes('대형') || cartype.includes('프리미엄')) {
      return PRICE_SEGMENTS.find(s => s.category === 'luxury' || s.category === 'premium') || null;
    }
  }

  // 가격 기준으로 세그먼트 찾기
  return PRICE_SEGMENTS.find(segment =>
    price >= segment.minPrice && price <= segment.maxPrice
  ) || null;
}

/**
 * 💰 가격 효율성 점수 계산 (가격대 내에서의 상대적 위치)
 */
function calculatePriceEfficiencyScore(price: number, segment: PriceSegment): number {
  const priceRange = segment.maxPrice - segment.minPrice;
  const relativePosition = (price - segment.minPrice) / priceRange;

  // 가격대 중간 정도가 가장 효율적 (역U자 곡선)
  if (relativePosition <= 0.5) {
    return 60 + (relativePosition * 80); // 60-100점
  } else {
    return 100 - ((relativePosition - 0.5) * 60); // 100-70점
  }
}

/**
 * 📅 연식 대비 가치 점수 계산
 */
function calculateAgeValueScore(year: number, price: number, segment: PriceSegment): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  const [minExpectedAge, maxExpectedAge] = segment.expectedAgeRange;

  if (age <= minExpectedAge) {
    return 100; // 매우 새로운 차량
  } else if (age <= maxExpectedAge) {
    const ageProgress = (age - minExpectedAge) / (maxExpectedAge - minExpectedAge);
    return 100 - (ageProgress * 40); // 100점에서 60점까지 선형 감소
  } else {
    // 예상 연식 초과 시 추가 감점
    const overAge = age - maxExpectedAge;
    return Math.max(20, 60 - (overAge * 10)); // 최소 20점
  }
}

/**
 * 🛣️ 주행거리 대비 가치 점수 계산
 */
function calculateMileageValueScore(mileage: number, year: number, segment: PriceSegment): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const expectedAnnualMileage = 15000; // 연간 1만5천km 기준
  const expectedMileage = age * expectedAnnualMileage;

  const [minExpectedMileage, maxExpectedMileage] = segment.expectedMileageRange;

  if (mileage <= expectedMileage * 0.7) {
    return 100; // 저주행
  } else if (mileage <= expectedMileage) {
    return 85; // 정상 주행
  } else if (mileage <= maxExpectedMileage) {
    const mileageProgress = (mileage - expectedMileage) / (maxExpectedMileage - expectedMileage);
    return 85 - (mileageProgress * 35); // 85점에서 50점까지
  } else {
    // 과주행 차량
    const overMileage = mileage - maxExpectedMileage;
    return Math.max(10, 50 - (overMileage / 10000 * 5)); // 최소 10점
  }
}

/**
 * 🏷️ 브랜드 프리미엄 점수 계산
 */
function calculateBrandPremiumScore(manufacturer: string): number {
  const brand = manufacturer.replace(/\(.*\)/g, '').trim(); // 괄호 내용 제거
  return BRAND_PREMIUM_SCORES[brand] || 60; // 기본 60점
}

/**
 * 🧮 종합 가성비 점수 계산
 */
export function calculateValueScore(vehicle: {
  price: number;
  modelyear: number;
  distance: number;
  manufacturer: string;
  cartype?: string;
}): ValueScoreMetrics {
  const segment = identifyPriceSegment(vehicle.price, vehicle.cartype);

  if (!segment) {
    // 세그먼트를 찾을 수 없는 경우 (너무 싸거나 비싼 차량)
    return {
      priceEfficiencyScore: 0,
      ageValueScore: 0,
      mileageValueScore: 0,
      brandPremiumScore: 0,
      overallValueScore: 0,
      valueGrade: 'D'
    };
  }

  const priceEfficiencyScore = calculatePriceEfficiencyScore(vehicle.price, segment);
  const ageValueScore = calculateAgeValueScore(vehicle.modelyear, vehicle.price, segment);
  const mileageValueScore = calculateMileageValueScore(vehicle.distance, vehicle.modelyear, segment);
  const brandPremiumScore = calculateBrandPremiumScore(vehicle.manufacturer);

  // 📊 가중 평균으로 종합 점수 계산
  const weights = {
    price: 0.3,      // 가격 효율성 30%
    age: 0.25,       // 연식 25%
    mileage: 0.25,   // 주행거리 25%
    brand: 0.2       // 브랜드 20%
  };

  const overallValueScore =
    priceEfficiencyScore * weights.price +
    ageValueScore * weights.age +
    mileageValueScore * weights.mileage +
    brandPremiumScore * weights.brand;

  // 🏅 등급 계산
  let valueGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  if (overallValueScore >= 90) valueGrade = 'S';
  else if (overallValueScore >= 80) valueGrade = 'A';
  else if (overallValueScore >= 70) valueGrade = 'B';
  else if (overallValueScore >= 60) valueGrade = 'C';
  else valueGrade = 'D';

  return {
    priceEfficiencyScore: Math.round(priceEfficiencyScore),
    ageValueScore: Math.round(ageValueScore),
    mileageValueScore: Math.round(mileageValueScore),
    brandPremiumScore: Math.round(brandPremiumScore),
    overallValueScore: Math.round(overallValueScore),
    valueGrade
  };
}

/**
 * 🎯 가성비 TOP 필터링 함수
 * 각 가격대에서 가성비 점수 상위 차량들만 선별
 */
export function filterTopValueVehicles(vehicles: any[], minValueScore: number = 75): any[] {
  return vehicles
    .map(vehicle => ({
      ...vehicle,
      valueMetrics: calculateValueScore({
        price: vehicle.price,
        modelyear: vehicle.modelyear || vehicle.year,
        distance: vehicle.distance || vehicle.mileage,
        manufacturer: vehicle.manufacturer || vehicle.brand,
        cartype: vehicle.cartype || vehicle.body_type
      })
    }))
    .filter(vehicle => vehicle.valueMetrics.overallValueScore >= minValueScore)
    .sort((a, b) => b.valueMetrics.overallValueScore - a.valueMetrics.overallValueScore);
}

/**
 * 📋 가성비 설명 생성
 */
export function generateValueExplanation(metrics: ValueScoreMetrics): string {
  const reasons = [];

  if (metrics.priceEfficiencyScore >= 80) {
    reasons.push("가격대 내 우수한 효율성");
  }
  if (metrics.ageValueScore >= 80) {
    reasons.push("연식 대비 좋은 가치");
  }
  if (metrics.mileageValueScore >= 80) {
    reasons.push("주행거리 대비 우수");
  }
  if (metrics.brandPremiumScore >= 80) {
    reasons.push("신뢰할 수 있는 브랜드");
  }

  return reasons.length > 0
    ? `${metrics.valueGrade}급 가성비 • ${reasons.join(" • ")}`
    : `${metrics.valueGrade}급 가성비`;
}