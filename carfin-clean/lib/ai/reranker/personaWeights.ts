// personaWeights.ts - 페르소나별 가중치 설정 시스템

import { PersonaWeights } from './types';
import { DemoPersona } from '@/lib/collaboration/PersonaDefinitions';

// 기본 가중치 (모든 페르소나의 베이스라인)
const DEFAULT_WEIGHTS: PersonaWeights = {
  semantic: 0.3,      // 의미론적 유사도
  price: 0.15,        // 가격 중요도
  fuelEfficiency: 0.1, // 연비 중요도
  safety: 0.15,       // 안전성 중요도
  space: 0.1,         // 공간 중요도
  brand: 0.05,        // 브랜드 중요도
  performance: 0.05,  // 성능 중요도
  luxury: 0.02,       // 고급스러움 중요도
  reliability: 0.1,   // 신뢰성 중요도
  technology: 0.03    // 기술 중요도
};

// 페르소나별 특화 가중치
export const PERSONA_WEIGHTS: Record<string, PersonaWeights> = {
  // 김지수 - 첫차 구매 불안감
  first_car_anxiety: {
    semantic: 0.25,
    price: 0.2,         // 예산 중시
    fuelEfficiency: 0.15, // 연비 걱정
    safety: 0.25,       // 안전성 최우선
    space: 0.05,        // 공간은 덜 중요
    brand: 0.15,        // 브랜드 신뢰성 중시
    performance: 0.02,  // 성능은 부담
    luxury: 0.01,       // 고급스러움은 부담
    reliability: 0.2,   // 신뢰성 매우 중요
    technology: 0.07    // 첨단 기술 관심
  },

  // 박수진 - 워킹맘 (가족우선)
  working_mom: {
    semantic: 0.2,
    price: 0.15,        // 가성비 중시
    fuelEfficiency: 0.15, // 경제성 중요
    safety: 0.3,        // 아이 안전 최우선
    space: 0.25,        // 넓은 공간 필요
    brand: 0.1,         // 브랜드보다 실용성
    performance: 0.02,  // 성능은 덜 중요
    luxury: 0.01,       // 고급스러움은 불필요
    reliability: 0.15,  // 고장나면 안됨
    technology: 0.07    // 편의기능 관심
  },

  // 김민준 - MZ 오피스워커
  mz_office_worker: {
    semantic: 0.3,
    price: 0.2,         // 가성비 중시
    fuelEfficiency: 0.15, // 출퇴근비 절약
    safety: 0.1,        // 기본적인 안전성
    space: 0.05,        // 혼자 타므로 덜 중요
    brand: 0.12,        // 브랜드 이미지 관심
    performance: 0.08,  // 약간의 성능 관심
    luxury: 0.05,       // 적당한 고급스러움
    reliability: 0.1,   // 신뢰성
    technology: 0.15    // 최신 기술 선호
  },

  // 이현우 - 캠핑 러버
  camping_lover: {
    semantic: 0.25,
    price: 0.1,         // 기능이 우선
    fuelEfficiency: 0.1, // 장거리 고려하지만 성능 우선
    safety: 0.15,       // 안전한 여행
    space: 0.3,         // 짐 적재공간 최우선
    brand: 0.05,        // 브랜드보다 기능
    performance: 0.2,   // 오프로드 성능 중요
    luxury: 0.02,       // 고급스러움은 불필요
    reliability: 0.15,  // 야외에서 고장나면 큰일
    technology: 0.08    // 실용적 기술 선호
  },

  // 정대철 - 대가족 아빠
  large_family_dad: {
    semantic: 0.2,
    price: 0.18,        // 경제성 중요
    fuelEfficiency: 0.2, // 유지비 절약
    safety: 0.25,       // 가족 안전
    space: 0.3,         // 대가족 공간 필수
    brand: 0.08,        // 브랜드보다 실용성
    performance: 0.02,  // 성능은 덜 중요
    luxury: 0.01,       // 고급스러움은 불필요
    reliability: 0.15,  // 가족 이동수단
    technology: 0.06    // 편의기능
  },

  // 김정훈 - CEO/임원
  ceo_executive: {
    semantic: 0.2,
    price: 0.05,        // 가격은 덜 중요
    fuelEfficiency: 0.05, // 연비는 덜 중요
    safety: 0.15,       // 기본적인 안전성
    space: 0.15,        // 골프백, 비즈니스 짐
    brand: 0.3,         // 브랜드 프리스티지 최우선
    performance: 0.15,  // 성능도 중요
    luxury: 0.25,       // 고급스러움 매우 중요
    reliability: 0.1,   // 신뢰성
    technology: 0.1     // 최신 기술
  }
};

// 가중치 정규화 함수
function normalizeWeights(weights: PersonaWeights): PersonaWeights {
  const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
  const normalized: PersonaWeights = {} as PersonaWeights;

  for (const [key, value] of Object.entries(weights)) {
    normalized[key as keyof PersonaWeights] = value / total;
  }

  return normalized;
}

// 페르소나별 가중치 조회
export function getPersonaWeights(persona?: DemoPersona): PersonaWeights {
  if (!persona || !PERSONA_WEIGHTS[persona.id]) {
    return normalizeWeights(DEFAULT_WEIGHTS);
  }

  return normalizeWeights(PERSONA_WEIGHTS[persona.id]);
}

// 동적 가중치 조정 (사용자 선호도 기반)
export function adjustWeightsForPreferences(
  baseWeights: PersonaWeights,
  preferences: {
    prioritizeBudget?: boolean;
    prioritizeSafety?: boolean;
    prioritizeSpace?: boolean;
    prioritizeBrand?: boolean;
    prioritizePerformance?: boolean;
  }
): PersonaWeights {
  const adjusted = { ...baseWeights };
  const adjustmentFactor = 0.1;

  if (preferences.prioritizeBudget) {
    adjusted.price += adjustmentFactor;
    adjusted.fuelEfficiency += adjustmentFactor * 0.5;
  }

  if (preferences.prioritizeSafety) {
    adjusted.safety += adjustmentFactor;
    adjusted.reliability += adjustmentFactor * 0.5;
  }

  if (preferences.prioritizeSpace) {
    adjusted.space += adjustmentFactor;
  }

  if (preferences.prioritizeBrand) {
    adjusted.brand += adjustmentFactor;
    adjusted.luxury += adjustmentFactor * 0.3;
  }

  if (preferences.prioritizePerformance) {
    adjusted.performance += adjustmentFactor;
    adjusted.technology += adjustmentFactor * 0.3;
  }

  return normalizeWeights(adjusted);
}

// 가중치 기반 설명 생성
export function explainWeights(weights: PersonaWeights, persona?: DemoPersona): string {
  const topFactors = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key);

  const factorNames: Record<string, string> = {
    semantic: '검색 관련성',
    price: '가격 경쟁력',
    fuelEfficiency: '연비 효율성',
    safety: '안전성',
    space: '공간 활용성',
    brand: '브랜드 가치',
    performance: '주행 성능',
    luxury: '고급스러움',
    reliability: '신뢰성',
    technology: '기술 사양'
  };

  const personaContext = persona ? `${persona.name}님의 특성을 고려하여` : '일반적인 기준으로';
  const topThree = topFactors.map(factor => factorNames[factor]).join(', ');

  return `${personaContext} ${topThree}을 중점적으로 고려하여 순위를 결정했습니다.`;
}

// 디버깅용 가중치 출력
export function debugWeights(persona?: DemoPersona): void {
  const weights = getPersonaWeights(persona);
  console.log(`🎯 ${persona?.name || 'Default'} 페르소나 가중치:`, weights);
  console.log('📊 설명:', explainWeights(weights, persona));
}