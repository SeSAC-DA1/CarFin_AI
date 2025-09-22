// 온보딩 데이터를 실제 추론 엔진 데이터로 변환하는 매핑 함수들
// API 라우트를 통해 데이터베이스에 접근

// 타입 정의만 import (실제 함수 호출은 동적 import 사용)
export interface UserData {
  budget: [number, number];
  bodyType?: 'sedan' | 'suv' | 'hatchback' | 'coupe';
  fuelType?: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  familySize: number;
  age: number;
  income: number;
  region: string;
  priorities: {
    price: number;
    fuel_efficiency: number;
    safety: number;
    performance: number;
    design: number;
  };
  creditScore?: number;
}

export interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  bodyType: string;
  seatingCapacity: number;
  fuelEfficiency: number;
  safetyRating: number;
  features: string[];
  region: string;
  dealerType: string;
  accidentHistory: boolean;
  ownerCount: number;
  valueScore: number;
  popularityScore: number;
}

// 온보딩에서 수집되는 데이터 타입
interface OnboardingPreferences {
  brands: string[];
  usage: string;
  fuel: string[];
  budget: string;
}

/**
 * 온보딩 데이터를 UserData 타입으로 변환
 * 실제 추론 엔진이 사용할 수 있는 정형화된 데이터로 매핑
 */
export function mapOnboardingToUserData(
  preferences: OnboardingPreferences,
  collectedData: Record<string, unknown> = {}
): UserData {
  // 예산 문자열을 숫자 범위로 변환
  const budgetMapping: Record<string, [number, number]> = {
    'budget1': [1000, 2000],    // 1천-2천만원
    'budget2': [2000, 3500],    // 2천-3천5백만원
    'budget3': [3500, 5000],    // 3천5백-5천만원
    'budget4': [5000, 10000],   // 5천만원 이상
  };

  // 연료 타입 매핑
  const fuelMapping: Record<string, 'gasoline' | 'diesel' | 'hybrid' | 'electric'> = {
    'gasoline': 'gasoline',
    'diesel': 'diesel',
    'hybrid': 'hybrid',
    'electric': 'electric',
    'tesla': 'electric'  // 테슬라 선택시 전기차
  };

  // 용도에 따른 차종 추론
  const getBodyTypeFromUsage = (usage: string): 'sedan' | 'suv' | 'hatchback' | 'coupe' | undefined => {
    if (usage?.includes('가족')) return 'suv';
    if (usage?.includes('출퇴근')) return 'sedan';
    if (usage?.includes('도심')) return 'hatchback';
    if (usage?.includes('스포츠')) return 'coupe';
    return undefined;
  };

  // 브랜드 선호도에 따른 우선순위 계산
  const calculatePriorities = (brands: string[]) => {
    const priorities = {
      price: 0.4,           // 기본값
      fuel_efficiency: 0.3,
      safety: 0.2,
      performance: 0.05,
      design: 0.05
    };

    // 브랜드별 우선순위 조정
    if (brands.includes('tesla')) {
      priorities.performance += 0.15;
      priorities.design += 0.1;
      priorities.price -= 0.1;
    }

    if (brands.includes('hyundai') || brands.includes('kia')) {
      priorities.safety += 0.1;
      priorities.price += 0.05;
    }

    if (brands.includes('bmw') || brands.includes('mercedes')) {
      priorities.performance += 0.1;
      priorities.design += 0.1;
      priorities.price -= 0.15;
    }

    // 연료 효율성 선호도
    if (preferences.fuel.includes('hybrid') || preferences.fuel.includes('electric')) {
      priorities.fuel_efficiency += 0.15;
      priorities.price -= 0.1;
    }

    return priorities;
  };

  // 예산에 따른 소득 추정 (일반적으로 차량 가격은 연소득의 1/3 수준)
  const budgetRange = budgetMapping[preferences.budget] || [3000, 5000];
  const estimatedIncome = Math.round((budgetRange[0] + budgetRange[1]) / 2 * 3);

  return {
    budget: budgetRange,
    bodyType: getBodyTypeFromUsage(preferences.usage),
    fuelType: preferences.fuel.length > 0 ? fuelMapping[preferences.fuel[0]] : undefined,
    familySize: preferences.usage?.includes('가족') ? 4 : 2,  // 용도에서 추론
    age: 35,                    // 기본값 (향후 온보딩에서 수집 가능)
    income: estimatedIncome,    // 예산에서 추정
    region: '서울',             // 기본값
    priorities: calculatePriorities(preferences.brands),
    creditScore: estimatedIncome >= 6000 ? 750 : 650  // 소득에 따른 신용점수 추정
  };
}

/**
 * 실제 데이터베이스에서 차량 데이터를 가져오는 함수
 * API 라우트를 통해 서버에서 데이터베이스 쿼리 실행
 */
export async function fetchRealVehicleData(userData: UserData): Promise<VehicleData[]> {
  try {
    // 🚀 울트라띵크 모드: PostgreSQL 전용 API 라우트
    const { searchVehicles } = await import('@/lib/api/vehicleApi');
    const vehicles = await searchVehicles(userData);

    return vehicles;
  } catch (error) {
    console.error('🚨 AWS PostgreSQL RDS 연결 실패 - 백업 데이터 사용 금지:', error);

    // 🚀 울트라띵크 모드: 백업 데이터 완전 제거
    // "무조건 실제 postgre aws rdb에 있는 데이터만" 사용
    const { handleDatabaseConnectionFailure } = await import('@/lib/api/vehicleApi');
    return handleDatabaseConnectionFailure(error);
  }
}

/**
 * 사용자 쿼리 문자열 생성 (기존 호환성 유지)
 */
export function generateUserQuery(userData: UserData): string {
  const budget = `${userData.budget[0]}-${userData.budget[1]}만원`;
  const purpose = userData.bodyType ? `${userData.bodyType} 차종` : '적정 차량';
  const family = userData.familySize >= 4 ? `${userData.familySize}인 가족용` : '개인용';

  return `${budget} 예산으로 ${family} ${purpose} 찾고 있어요`;
}