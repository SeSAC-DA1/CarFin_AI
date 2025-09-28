// CEOLuxuryFilter.ts - CEO 페르소나 전용 고급차 필터링 시스템

import { VehicleItem } from './types';
import { DemoPersona } from '@/lib/collaboration/PersonaDefinitions';

export interface LuxuryFilterCriteria {
  minPrice: number;
  maxAge: number; // 연식 제한 (년)
  maxMileage: number; // 최대 주행거리
  allowedBrands: string[];
  requiredFeatures?: string[];
  priceSegment: 'premium' | 'luxury' | 'ultra_luxury';
}

export interface LuxuryFilterResult {
  filteredVehicles: VehicleItem[];
  filterStats: {
    originalCount: number;
    filteredCount: number;
    removedCount: number;
    filterReasons: Record<string, number>;
  };
  luxuryScore: number; // 0-1 점수
}

export class CEOLuxuryFilter {
  // 럭셔리 브랜드 계층 구조
  private static readonly LUXURY_BRANDS = {
    ultra_luxury: [
      'Bentley', '벤틀리', 'Rolls-Royce', '롤스로이스', 'Lamborghini', '람보르기니',
      'Ferrari', '페라리', 'McLaren', '맥라렌', 'Bugatti', '부가티',
      'Maserati', '마세라티', 'Aston Martin', '애스턴 마틴'
    ],
    luxury: [
      'Mercedes', '벤츠', 'Mercedes-Benz', 'BMW', 'Audi', '아우디',
      'Lexus', '렉서스', 'Porsche', '포르쉐', 'Jaguar', '재규어',
      'Land Rover', '랜드로버', 'Volvo', '볼보', 'Genesis', '제네시스',
      'Cadillac', '캐딜락', 'Lincoln', '링컨', 'Infiniti', '인피니티',
      'Acura', '아큐라', 'Tesla', '테슬라'
    ],
    premium: [
      'Hyundai', '현대', 'Kia', '기아', 'Toyota', '토요타',
      'Honda', '혼다', 'Nissan', '닛산', 'Mazda', '마즈다',
      'Subaru', '스바루', 'Volkswagen', '폭스바겐'
    ]
  };

  // CEO 세부 분류별 필터 기준
  private static readonly CEO_FILTER_CRITERIA: Record<string, LuxuryFilterCriteria> = {
    // 대기업 CEO - 최고급 선호
    large_corp_ceo: {
      minPrice: 8000, // 8천만원 이상
      maxAge: 3, // 3년 이내
      maxMileage: 30000, // 3만km 이하
      allowedBrands: [...CEOLuxuryFilter.LUXURY_BRANDS.ultra_luxury, ...CEOLuxuryFilter.LUXURY_BRANDS.luxury],
      priceSegment: 'ultra_luxury',
      requiredFeatures: ['풀옵션', '최신기술', '프리미엄']
    },

    // 중견기업 CEO - 고급차 선호
    mid_corp_ceo: {
      minPrice: 5000, // 5천만원 이상
      maxAge: 5, // 5년 이내
      maxMileage: 50000, // 5만km 이하
      allowedBrands: CEOLuxuryFilter.LUXURY_BRANDS.luxury,
      priceSegment: 'luxury',
      requiredFeatures: ['고급옵션', '비즈니스']
    },

    // 스타트업 CEO - 프리미엄 선호
    startup_ceo: {
      minPrice: 3000, // 3천만원 이상
      maxAge: 7, // 7년 이내
      maxMileage: 80000, // 8만km 이하
      allowedBrands: [...CEOLuxuryFilter.LUXURY_BRANDS.luxury, ...CEOLuxuryFilter.LUXURY_BRANDS.premium],
      priceSegment: 'premium',
      requiredFeatures: ['스타일리시', '젊은감각']
    },

    // 기본 CEO (김정훈님 기본 설정)
    default_ceo: {
      minPrice: 4000, // 4천만원 이상
      maxAge: 5, // 5년 이내
      maxMileage: 60000, // 6만km 이하
      allowedBrands: CEOLuxuryFilter.LUXURY_BRANDS.luxury,
      priceSegment: 'luxury',
      requiredFeatures: ['비즈니스', '프리미엄']
    }
  };

  // 골프 관련 추가 필터
  private static readonly GOLF_SPECIFIC_CRITERIA = {
    preferredTypes: ['세단', 'SUV', '왜건'], // 골프백 적재 가능
    minTrunkSpace: 400, // 최소 트런크 용량 (L)
    preferredFeatures: ['넓은트런크', '골프백', '레저', '스포츠']
  };

  /**
   * CEO 페르소나에 따른 럭셔리 차량 필터링
   */
  static filterLuxuryVehicles(
    vehicles: VehicleItem[],
    persona: DemoPersona,
    userQuery: string = '',
    ceoType: 'large_corp_ceo' | 'mid_corp_ceo' | 'startup_ceo' | 'default_ceo' = 'default_ceo'
  ): LuxuryFilterResult {

    const criteria = this.CEO_FILTER_CRITERIA[ceoType];
    const isGolfQuery = this.isGolfRelatedQuery(userQuery);
    const filterReasons: Record<string, number> = {};

    console.log(`🎯 CEO 럭셔리 필터 적용: ${ceoType} (${isGolfQuery ? '골프 쿼리' : '일반 쿼리'})`);
    console.log(`💎 필터 기준: 최소 ${criteria.minPrice}만원, ${criteria.maxAge}년 이내, ${criteria.maxMileage}km 이하`);

    const filteredVehicles = vehicles.filter(vehicle => {
      // 1. 브랜드 필터링
      if (!this.isBrandAllowed(vehicle.manufacturer, criteria.allowedBrands)) {
        filterReasons['non_luxury_brand'] = (filterReasons['non_luxury_brand'] || 0) + 1;
        return false;
      }

      // 2. 가격 필터링
      if (vehicle.price < criteria.minPrice) {
        filterReasons['below_min_price'] = (filterReasons['below_min_price'] || 0) + 1;
        return false;
      }

      // 3. 연식 필터링
      const currentYear = new Date().getFullYear();
      const vehicleAge = currentYear - vehicle.modelyear;
      if (vehicleAge > criteria.maxAge) {
        filterReasons['too_old'] = (filterReasons['too_old'] || 0) + 1;
        return false;
      }

      // 4. 주행거리 필터링
      if (vehicle.distance > criteria.maxMileage) {
        filterReasons['high_mileage'] = (filterReasons['high_mileage'] || 0) + 1;
        return false;
      }

      // 5. 골프 관련 추가 필터 (골프 쿼리인 경우)
      if (isGolfQuery && !this.isGolfFriendly(vehicle)) {
        filterReasons['not_golf_friendly'] = (filterReasons['not_golf_friendly'] || 0) + 1;
        return false;
      }

      return true;
    });

    // 럭셔리 점수 계산
    const luxuryScore = this.calculateLuxuryScore(filteredVehicles, criteria);

    const result: LuxuryFilterResult = {
      filteredVehicles,
      filterStats: {
        originalCount: vehicles.length,
        filteredCount: filteredVehicles.length,
        removedCount: vehicles.length - filteredVehicles.length,
        filterReasons
      },
      luxuryScore
    };

    console.log(`📊 필터링 결과: ${vehicles.length}대 → ${filteredVehicles.length}대 (럭셔리 점수: ${Math.round(luxuryScore * 100)}%)`);

    return result;
  }

  /**
   * 브랜드가 허용된 럭셔리 브랜드인지 확인
   */
  private static isBrandAllowed(manufacturer: string, allowedBrands: string[]): boolean {
    const normalizedManufacturer = manufacturer.toLowerCase().trim();
    return allowedBrands.some(brand =>
      normalizedManufacturer.includes(brand.toLowerCase()) ||
      brand.toLowerCase().includes(normalizedManufacturer)
    );
  }

  /**
   * 골프 관련 쿼리인지 판단
   */
  private static isGolfRelatedQuery(query: string): boolean {
    const golfKeywords = ['골프', 'golf', '라운딩', '라운드', '골프백', '골프장', '레저', '스포츠'];
    const normalizedQuery = query.toLowerCase();
    return golfKeywords.some(keyword => normalizedQuery.includes(keyword));
  }

  /**
   * 골프 친화적인 차량인지 확인
   */
  private static isGolfFriendly(vehicle: VehicleItem): boolean {
    // 세단, SUV, 왜건은 골프백 적재에 유리
    const friendlyTypes = ['세단', 'sedan', 'suv', '왜건', 'wagon', '스테이션왜건'];
    const modelName = (vehicle.model || '').toLowerCase();

    // 모델명에서 차종 추론
    const isFriendlyType = friendlyTypes.some(type => modelName.includes(type));

    // 대형차일수록 골프 친화적
    const isLargeVehicle = vehicle.displacement && vehicle.displacement >= 2000;

    return isFriendlyType || isLargeVehicle || false;
  }

  /**
   * 차량들의 럭셔리 점수 계산
   */
  private static calculateLuxuryScore(vehicles: VehicleItem[], criteria: LuxuryFilterCriteria): number {
    if (vehicles.length === 0) return 0;

    let totalScore = 0;

    vehicles.forEach(vehicle => {
      let vehicleScore = 0;

      // 브랜드 점수 (40%)
      vehicleScore += this.getBrandLuxuryScore(vehicle.manufacturer) * 0.4;

      // 가격 점수 (30%)
      const priceScore = Math.min(1, (vehicle.price - criteria.minPrice) / (criteria.minPrice * 2));
      vehicleScore += priceScore * 0.3;

      // 연식 점수 (20%)
      const currentYear = new Date().getFullYear();
      const ageScore = Math.max(0, 1 - (currentYear - vehicle.modelyear) / criteria.maxAge);
      vehicleScore += ageScore * 0.2;

      // 주행거리 점수 (10%)
      const mileageScore = Math.max(0, 1 - vehicle.distance / criteria.maxMileage);
      vehicleScore += mileageScore * 0.1;

      totalScore += vehicleScore;
    });

    return totalScore / vehicles.length;
  }

  /**
   * 브랜드별 럭셔리 점수 반환
   */
  private static getBrandLuxuryScore(manufacturer: string): number {
    const normalizedBrand = manufacturer.toLowerCase();

    // 울트라 럭셔리
    if (this.LUXURY_BRANDS.ultra_luxury.some(brand =>
      normalizedBrand.includes(brand.toLowerCase()))) {
      return 1.0;
    }

    // 럭셔리
    if (this.LUXURY_BRANDS.luxury.some(brand =>
      normalizedBrand.includes(brand.toLowerCase()))) {
      return 0.8;
    }

    // 프리미엄
    if (this.LUXURY_BRANDS.premium.some(brand =>
      normalizedBrand.includes(brand.toLowerCase()))) {
      return 0.6;
    }

    return 0.3; // 기타 브랜드
  }

  /**
   * CEO 타입 자동 감지 (추가 기능)
   */
  static detectCEOType(persona: DemoPersona, budget: { min: number; max: number }): 'large_corp_ceo' | 'mid_corp_ceo' | 'startup_ceo' | 'default_ceo' {
    const avgBudget = (budget.min + budget.max) / 2;

    if (avgBudget >= 8000) return 'large_corp_ceo';
    if (avgBudget >= 5000) return 'mid_corp_ceo';
    if (avgBudget >= 3000) return 'startup_ceo';
    return 'default_ceo';
  }

  /**
   * 필터링 통계 로깅
   */
  static logFilterStats(result: LuxuryFilterResult): void {
    console.log('📈 CEO 럭셔리 필터 통계:');
    console.log(`📊 필터링 비율: ${Math.round((result.filterStats.filteredCount / result.filterStats.originalCount) * 100)}%`);
    console.log(`💎 럭셔리 점수: ${Math.round(result.luxuryScore * 100)}%`);

    if (Object.keys(result.filterStats.filterReasons).length > 0) {
      console.log('🚫 제외 사유:');
      Object.entries(result.filterStats.filterReasons).forEach(([reason, count]) => {
        const reasonMap: Record<string, string> = {
          'non_luxury_brand': '럭셔리 브랜드 아님',
          'below_min_price': '최소 가격 미달',
          'too_old': '연식 오래됨',
          'high_mileage': '주행거리 과다',
          'not_golf_friendly': '골프 부적합'
        };
        console.log(`   ${reasonMap[reason] || reason}: ${count}대`);
      });
    }
  }
}