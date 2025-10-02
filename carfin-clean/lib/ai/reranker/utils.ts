// utils.ts - Reranker 유틸리티 함수들

import { VehicleItem, SimilarityScore, PersonaWeights } from './types';
import { DemoPersona } from '@/lib/collaboration/PersonaDefinitions';

// 코사인 유사도 계산
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('벡터 길이가 일치하지 않습니다');
  }

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

// 차량 설명 텍스트 생성
export function generateVehicleDescription(vehicle: VehicleItem): string {
  const parts = [
    vehicle.manufacturer,
    vehicle.model,
    `${vehicle.modelyear}년식`,
    vehicle.fueltype
  ];

  if (vehicle.displacement) {
    parts.push(`배기량 ${vehicle.displacement}cc`);
  }

  if (vehicle.color) {
    parts.push(`${vehicle.color}색상`);
  }

  const priceText = `가격 ${vehicle.price.toLocaleString()}만원`;
  parts.push(priceText);

  const distanceText = `주행거리 ${vehicle.distance.toLocaleString()}km`;
  parts.push(distanceText);

  return parts.join(' ');
}

// 사용자 쿼리 정규화 및 강화
export function enhanceUserQuery(query: string, persona?: DemoPersona): string {
  let enhanced = query.trim();

  // 페르소나별 컨텍스트 추가
  if (persona) {
    const contextMap: Record<string, string> = {
      first_car_anxiety: '첫차 구매자 안전한 신뢰할만한',
      working_mom: '가족용 안전한 넓은 실용적인',
      mz_office_worker: '출퇴근용 경제적인 스타일리시한',
      camping_lover: '캠핑용 넓은 오프로드 적재공간',
      large_family_dad: '대가족용 넓은 경제적인 안전한',
      ceo_executive: '고급 프리미엄 비즈니스용 브랜드'
    };

    const context = contextMap[persona.id];
    if (context) {
      enhanced = `${context} ${enhanced}`;
    }
  }

  return enhanced;
}

// 예산 적합도 점수 계산
export function calculateBudgetScore(vehiclePrice: number, budget: { min: number; max: number }): number {
  const { min, max } = budget;

  // 예산 범위 내에 있으면 1.0
  if (vehiclePrice >= min && vehiclePrice <= max) {
    return 1.0;
  }

  // 예산 초과 시 거리 기반 점수
  if (vehiclePrice > max) {
    const excess = vehiclePrice - max;
    const tolerance = max * 0.2; // 20% 초과까지 허용
    return Math.max(0, 1 - (excess / tolerance));
  }

  // 예산 미만 시 (더 저렴함) 높은 점수
  if (vehiclePrice < min) {
    return 1.0; // 더 저렴한 건 좋은 것
  }

  return 0.5;
}

// 연식 기반 점수 계산
export function calculateYearScore(modelYear: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - modelYear;

  if (age <= 3) return 1.0;      // 3년 이하는 최고점
  if (age <= 5) return 0.9;      // 5년 이하
  if (age <= 7) return 0.8;      // 7년 이하
  if (age <= 10) return 0.6;     // 10년 이하
  return Math.max(0.2, 1 - (age / 20)); // 그 이상은 점진적 감소
}

// 주행거리 기반 점수 계산
export function calculateMileageScore(distance: number): number {
  if (distance <= 30000) return 1.0;     // 3만km 이하는 최고점
  if (distance <= 50000) return 0.9;     // 5만km 이하
  if (distance <= 80000) return 0.8;     // 8만km 이하
  if (distance <= 120000) return 0.6;    // 12만km 이하
  return Math.max(0.2, 1 - (distance / 200000)); // 그 이상은 점진적 감소
}

// 브랜드 프리스티지 점수
export function calculateBrandScore(manufacturer: string): number {
  const luxuryBrands = ['BMW', '벤츠', 'Mercedes', '아우디', 'Audi', 'Lexus', '렉서스', 'Genesis', '제네시스'];
  const premiumBrands = ['현대', 'Hyundai', '기아', 'Kia', '토요타', 'Toyota', '혼다', 'Honda'];
  const standardBrands = ['쉐보레', 'Chevrolet', '르노삼성', 'Renault', '쌍용', 'SsangYong'];

  const brand = manufacturer.toLowerCase();

  if (luxuryBrands.some(luxury => brand.includes(luxury.toLowerCase()))) {
    return 1.0;
  }

  if (premiumBrands.some(premium => brand.includes(premium.toLowerCase()))) {
    return 0.8;
  }

  if (standardBrands.some(standard => brand.includes(standard.toLowerCase()))) {
    return 0.6;
  }

  return 0.5; // 기타 브랜드
}

// 연료 타입 기반 점수 (환경성 고려)
export function calculateFuelTypeScore(fuelType: string): number {
  // NULL/undefined 처리
  if (!fuelType) return 0.5;

  const fuel = fuelType.toLowerCase();

  if (fuel.includes('전기') || fuel.includes('electric')) return 1.0;
  if (fuel.includes('하이브리드') || fuel.includes('hybrid')) return 0.9;
  if (fuel.includes('가솔린') || fuel.includes('gasoline')) return 0.7;
  if (fuel.includes('디젤') || fuel.includes('diesel')) return 0.6;
  if (fuel.includes('lpg')) return 0.8;

  return 0.5; // 기타
}

// 종합 특징 점수 계산
export function calculateFeatureScore(vehicle: VehicleItem): number {
  const yearScore = calculateYearScore(vehicle.modelyear);
  const mileageScore = calculateMileageScore(vehicle.distance);
  const brandScore = calculateBrandScore(vehicle.manufacturer);
  const fuelScore = calculateFuelTypeScore(vehicle.fueltype);

  // 가중 평균
  return (yearScore * 0.3 + mileageScore * 0.3 + brandScore * 0.2 + fuelScore * 0.2);
}

// 최종 유사도 점수 계산
export function calculateFinalScore(
  semanticScore: number,
  budgetScore: number,
  featureScore: number,
  weights: PersonaWeights
): SimilarityScore {
  const personaScore = featureScore; // 페르소나 매칭 점수로 특징 점수 사용

  const finalScore = (
    semanticScore * weights.semantic +
    budgetScore * (weights.price + weights.fuelEfficiency) +
    personaScore * (weights.safety + weights.space + weights.brand + weights.performance + weights.luxury + weights.reliability + weights.technology)
  );

  return {
    semantic: semanticScore,
    persona: personaScore,
    budget: budgetScore,
    feature: featureScore,
    final: Math.min(1.0, Math.max(0.0, finalScore))
  };
}

// 다양성 보장을 위한 점수 조정
export function applyDiversityBoost(
  vehicles: VehicleItem[],
  scores: SimilarityScore[],
  diversityFactor: number = 0.1
): SimilarityScore[] {
  if (diversityFactor === 0 || vehicles.length <= 1) {
    return scores;
  }

  const adjustedScores = [...scores];
  const seenBrands = new Set<string>();
  const seenFuelTypes = new Set<string>();

  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    let diversityBoost = 0;

    // 브랜드 다양성
    if (!seenBrands.has(vehicle.manufacturer)) {
      diversityBoost += diversityFactor;
      seenBrands.add(vehicle.manufacturer);
    }

    // 연료 타입 다양성
    if (!seenFuelTypes.has(vehicle.fueltype)) {
      diversityBoost += diversityFactor * 0.5;
      seenFuelTypes.add(vehicle.fueltype);
    }

    // 최종 점수에 다양성 보너스 적용
    adjustedScores[i] = {
      ...adjustedScores[i],
      final: Math.min(1.0, adjustedScores[i].final + diversityBoost)
    };
  }

  return adjustedScores;
}

// 설명 생성을 위한 키워드 추출
export function extractKeywords(text: string): string[] {
  const keywords = [
    '경제적', '저렴', '가성비', '연비', '경제성',
    '안전', '안전성', '믿을만한', '신뢰',
    '넓은', '공간', '큰', '적재', '수납',
    '고급', '프리미엄', '럭셔리', '브랜드',
    '성능', '빠른', '파워', '스포츠',
    '캠핑', '오프로드', '레저', '아웃도어',
    '가족', '아이', '아기', '육아',
    '출퇴근', '도심', '시내', '주차'
  ];

  return keywords.filter(keyword => text.includes(keyword));
}

// 로깅 및 디버깅
export function logRerankingProcess(
  query: string,
  vehicleCount: number,
  topScores: SimilarityScore[],
  processingTime: number
): void {
  console.log('🔄 Reranking Process:');
  console.log(`📝 Query: ${query}`);
  console.log(`🚗 Vehicles processed: ${vehicleCount}`);
  console.log(`⏱️ Processing time: ${processingTime.toFixed(2)}ms`);
  console.log(`🏆 Top 3 scores:`, topScores.slice(0, 3));
}