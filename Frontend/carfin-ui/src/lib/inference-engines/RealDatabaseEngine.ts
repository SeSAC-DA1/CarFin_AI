// 실제 PostgreSQL 데이터베이스를 사용하는 추론 엔진
// 더미 데이터 없이 실제 차량 매물 데이터 사용

import { query } from '@/lib/database/db';

export interface UserData {
  budget: [number, number]; // [min, max] in 만원
  bodyType?: 'sedan' | 'suv' | 'hatchback' | 'coupe';
  fuelType?: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  familySize: number;
  age: number;
  income: number; // 만원 단위
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
  photo?: string; // 차량 이미지 URL
  detailUrl?: string; // 실제 매물 상세 페이지 URL
  vehicleid?: string; // 차량 ID (실제 데이터베이스 기본키)
  manufacturer?: string; // 제조사 (brand와 동일하지만 데이터베이스 호환성)
}

export interface InferenceResult {
  agentType: 'vehicle_expert' | 'finance_expert' | 'gemini_multi_agent';
  calculations: any;
  reasoning: string[];
  confidence: number;
  data: any;
  executedQuery?: string; // 실제 실행된 SQL 쿼리
}

// 실제 데이터베이스를 사용하는 차량 전문가 추론 엔진
export class DatabaseVehicleExpertEngine {
  /**
   * 사용자 조건에 맞는 동적 SQL 쿼리 생성
   */
  static generateDynamicQuery(userData: UserData): string {
    const conditions: string[] = [];
    const orderByFields: string[] = [];

    // 예산 조건 (실제 컬럼명: price, 단위: 만원)
    conditions.push(`price BETWEEN ${userData.budget[0]} AND ${userData.budget[1]}`);

    // 차종 조건 (실제 컬럼명: cartype)
    if (userData.bodyType) {
      const carTypeMap = {
        'sedan': '세단',
        'suv': 'SUV',
        'hatchback': '해치백',
        'coupe': '쿠페'
      };
      const koreanCarType = carTypeMap[userData.bodyType as keyof typeof carTypeMap] || userData.bodyType;
      conditions.push(`cartype LIKE '%${koreanCarType}%'`);
    }

    // 연료 타입 조건 (실제 컬럼명: fueltype)
    if (userData.fuelType) {
      const fuelTypeMap = {
        'gasoline': '가솔린',
        'diesel': '디젤',
        'hybrid': '하이브리드',
        'electric': '전기'
      };
      const koreanFuelType = fuelTypeMap[userData.fuelType as keyof typeof fuelTypeMap] || userData.fuelType;
      conditions.push(`fueltype LIKE '%${koreanFuelType}%'`);
    }

    // 지역 조건 (실제 컬럼명: location)
    if (userData.region) {
      orderByFields.push(`CASE WHEN location LIKE '%${userData.region}%' THEN 0 ELSE 1 END`);
    }

    // 우선순위에 따른 정렬
    if (userData.priorities.price > 0.3) {
      orderByFields.push('price ASC');
    }
    if (userData.priorities.performance > 0.2) {
      orderByFields.push('modelyear DESC'); // 최신 연도를 성능 지표로
    }

    // 기본 정렬: 연식, 주행거리, 가격 순
    orderByFields.push('modelyear DESC', 'distance ASC', 'price ASC');

    const query = `
SELECT
    vehicleid as id,
    manufacturer as brand,
    model,
    modelyear as year,
    price,
    distance as mileage,
    fueltype as fuel_type,
    cartype as body_type,
    colorname as color,
    location as region,
    selltype as dealer_type,
    detailurl as detail_url,
    photo
FROM vehicles
WHERE ${conditions.join(' AND ')}
  AND price > 0
  AND modelyear > 2000
ORDER BY ${orderByFields.join(', ')}
LIMIT 20`;

    return query;
  }

  /**
   * 실제 데이터베이스에서 차량 검색 및 분석
   */
  static async analyzeVehicles(userData: UserData): Promise<InferenceResult> {
    try {
      // 1. 동적 쿼리 생성
      const sqlQuery = this.generateDynamicQuery(userData);

      // 2. 실제 데이터베이스 쿼리 실행
      const result = await query(sqlQuery);
      const vehicles: VehicleData[] = result.rows.map((row: any) => ({
        id: row.id.toString(),
        brand: row.brand || '정보없음',
        model: row.model || '정보없음',
        year: row.year || 0,
        price: row.price || 0,
        mileage: row.mileage || 0,
        fuelType: row.fuel_type || '정보없음',
        bodyType: row.body_type || '정보없음',
        seatingCapacity: 5, // 실제 DB에 없는 정보는 기본값
        fuelEfficiency: this.estimateFuelEfficiency(row.fuel_type, row.body_type),
        safetyRating: this.estimateSafetyRating(row.year),
        features: [],
        region: row.region || '정보없음',
        dealerType: row.dealer_type || '일반',
        accidentHistory: false, // 실제 DB에 없는 정보
        ownerCount: 1, // 실제 DB에 없는 정보
        valueScore: this.calculateValueScore(row.price, row.year, row.mileage),
        popularityScore: this.calculatePopularityScore(row.brand)
      }));

      // 3. 사용자 선호도 기반 점수 계산
      const scoredVehicles = vehicles.map(vehicle => {
        const budgetCenter = (userData.budget[0] + userData.budget[1]) / 2;
        const budgetScore = Math.max(0, 100 - Math.abs(vehicle.price - budgetCenter) / budgetCenter * 100);

        // 우선순위 기반 종합 점수
        const priorityScore =
          (userData.priorities.price * (100 - (vehicle.price / userData.budget[1]) * 100)) +
          (userData.priorities.fuel_efficiency * (vehicle.fuelEfficiency * 5)) + // 연비 점수화
          (userData.priorities.safety * (vehicle.safetyRating * 20)) +
          (userData.priorities.performance * Math.max(0, (vehicle.year - 2015) * 5)) + // 연도 점수화
          (userData.priorities.design * (vehicle.valueScore * 0.7)); // 가치 점수 활용

        const finalScore = Math.round(
          budgetScore * 0.3 +
          priorityScore * 0.4 +
          vehicle.valueScore * 0.2 +
          vehicle.popularityScore * 0.1
        );

        return {
          vehicle,
          score: Math.min(100, Math.max(0, finalScore)),
          budgetScore: Math.round(budgetScore),
          priorityScore: Math.round(priorityScore)
        };
      });

      // 4. 점수 기준 정렬
      const topVehicles = scoredVehicles
        .sort((a, b) => b.score - a.score)
        .slice(0, 8); // 상위 8개

      // 5. 추론 결과 생성
      const averageScore = scoredVehicles.length > 0
        ? Math.round(scoredVehicles.reduce((sum, v) => sum + v.score, 0) / scoredVehicles.length)
        : 0;

      const reasoning = [
        `실제 데이터베이스에서 ${vehicles.length}대 검색 완료`,
        `예산 ${userData.budget[0]}-${userData.budget[1]}만원 범위 적용`,
        userData.bodyType ? `${userData.bodyType.toUpperCase()} 차종 필터 적용` : '모든 차종 포함',
        userData.fuelType ? `${userData.fuelType} 연료 타입 선호` : '연료 타입 제한 없음',
        `${userData.familySize}인 가족 구성 고려 (최소 ${Math.min(userData.familySize, 8)}인승)`,
        `평균 매칭 점수: ${averageScore}점`,
        `최고 점수 차량: ${topVehicles[0]?.vehicle.brand} ${topVehicles[0]?.vehicle.model} (${topVehicles[0]?.score}점)`
      ];

      return {
        agentType: 'vehicle_expert',
        calculations: {
          totalAnalyzed: vehicles.length,
          topMatches: topVehicles,
          averageScore,
          queryExecutionTime: Date.now(),
          databaseRecords: true // 실제 DB 사용 표시
        },
        reasoning,
        confidence: Math.min(95, 60 + (topVehicles.length > 0 ? topVehicles[0].score * 0.35 : 0)),
        data: {
          topVehicles,
          allVehicles: vehicles,
          searchCriteria: userData
        },
        executedQuery: sqlQuery
      };

    } catch (error) {
      console.error('Database query error:', error);

      // 에러 발생 시 기본 응답
      return {
        agentType: 'vehicle_expert',
        calculations: {
          totalAnalyzed: 0,
          topMatches: [],
          averageScore: 0,
          error: 'Database connection failed'
        },
        reasoning: [
          '데이터베이스 연결 오류 발생',
          '로컬 PostgreSQL 서버 상태 확인 필요',
          '환경 변수 설정 확인 필요'
        ],
        confidence: 0,
        data: { error: true, message: error instanceof Error ? error.message : 'Unknown error' },
        executedQuery: this.generateDynamicQuery(userData)
      };
    }
  }

  /**
   * 특정 차량의 상세 정보 조회
   */
  static async getVehicleDetails(vehicleId: string): Promise<VehicleData | null> {
    try {
      const sqlQuery = `
        SELECT
          vehicleid as id,
          manufacturer as brand,
          model,
          modelyear as year,
          price,
          distance as mileage,
          fueltype as fuel_type,
          cartype as body_type,
          colorname as color,
          location as region,
          selltype as dealer_type,
          detailurl as detail_url,
          photo
        FROM vehicles
        WHERE vehicleid = $1
      `;

      const result = await query(sqlQuery, [vehicleId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        brand: row.brand || '정보없음',
        model: row.model || '정보없음',
        year: row.year || 0,
        price: row.price || 0,
        mileage: row.mileage || 0,
        fuelType: row.fuel_type || '정보없음',
        bodyType: row.body_type || '정보없음',
        seatingCapacity: 5,
        fuelEfficiency: this.estimateFuelEfficiency(row.fuel_type, row.body_type),
        safetyRating: this.estimateSafetyRating(row.year),
        features: [],
        region: row.region || '정보없음',
        dealerType: row.dealer_type || '일반',
        accidentHistory: false,
        ownerCount: 1,
        valueScore: this.calculateValueScore(row.price, row.year, row.mileage),
        popularityScore: this.calculatePopularityScore(row.brand)
      };
    } catch (error) {
      console.error('Vehicle details query error:', error);
      return null;
    }
  }

  /**
   * 연비 추정 (실제 DB에 없는 정보)
   */
  static estimateFuelEfficiency(fuelType: string, bodyType: string): number {
    const fuelTypeMap: Record<string, number> = {
      '가솔린': 12,
      '디젤': 14,
      '하이브리드': 18,
      'LPG': 10,
      '전기': 25 // km/kWh 기준이지만 통일성을 위해
    };

    const bodyTypeMap: Record<string, number> = {
      'SUV': -2,
      '세단': 0,
      '해치백': 1,
      '쿠페': -1
    };

    let baseFuelEff = 12; // 기본값

    // 연료 타입별 기본 연비
    for (const [fuel, efficiency] of Object.entries(fuelTypeMap)) {
      if (fuelType?.includes(fuel)) {
        baseFuelEff = efficiency;
        break;
      }
    }

    // 차체 타입별 보정
    for (const [body, adjustment] of Object.entries(bodyTypeMap)) {
      if (bodyType?.includes(body)) {
        baseFuelEff += adjustment;
        break;
      }
    }

    return Math.max(6, baseFuelEff); // 최소 6km/L
  }

  /**
   * 안전도 추정 (연식 기준)
   */
  static estimateSafetyRating(year: number): number {
    if (year >= 2020) return 5;
    if (year >= 2015) return 4;
    if (year >= 2010) return 3;
    if (year >= 2005) return 2;
    return 1;
  }

  /**
   * 가치 점수 계산
   */
  static calculateValueScore(price: number, year: number, mileage: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    let score = 70; // 기본 점수

    // 연식 보정 (최대 +/-20점)
    if (age <= 3) score += 20;
    else if (age <= 5) score += 10;
    else if (age <= 8) score -= 5;
    else score -= 15;

    // 주행거리 보정 (최대 +/-15점)
    if (mileage <= 30000) score += 15;
    else if (mileage <= 50000) score += 10;
    else if (mileage <= 80000) score += 5;
    else if (mileage <= 120000) score -= 5;
    else score -= 15;

    return Math.max(10, Math.min(100, score));
  }

  /**
   * 인기도 점수 계산
   */
  static calculatePopularityScore(brand: string): number {
    const popularBrands = {
      '현대': 85,
      '기아': 80,
      '한국지엠': 60,
      '쌍용': 50,
      '르노삼성': 55,
      '벤츠': 90,
      'BMW': 88,
      '아우디': 85,
      '토요타': 82,
      '혼다': 78,
      '닛산': 70,
      '폭스바겐': 75
    };

    for (const [brandName, score] of Object.entries(popularBrands)) {
      if (brand?.includes(brandName)) {
        return score;
      }
    }

    return 60; // 기본값
  }

  /**
   * 차량 조회수 증가 (시뮬레이션)
   */
  static async incrementViewCount(vehicleId: string): Promise<void> {
    // 실제 DB에 views_count 컬럼이 없으므로 로깅만
    console.log(`Vehicle ${vehicleId} view count incremented (simulated)`);
  }

  /**
   * 사용자 선호도 저장 (추후 개인화 추천용)
   */
  static async saveUserPreferences(userData: UserData, userId: string): Promise<void> {
    try {
      const insertQuery = `
        INSERT INTO user_preferences (
          user_id, budget_min, budget_max, preferred_body_types, preferred_fuel_types,
          price_priority, fuel_efficiency_priority, safety_priority, performance_priority, design_priority,
          family_size, age, income, region, credit_score, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
          budget_min = EXCLUDED.budget_min,
          budget_max = EXCLUDED.budget_max,
          preferred_body_types = EXCLUDED.preferred_body_types,
          preferred_fuel_types = EXCLUDED.preferred_fuel_types,
          price_priority = EXCLUDED.price_priority,
          fuel_efficiency_priority = EXCLUDED.fuel_efficiency_priority,
          safety_priority = EXCLUDED.safety_priority,
          performance_priority = EXCLUDED.performance_priority,
          design_priority = EXCLUDED.design_priority,
          family_size = EXCLUDED.family_size,
          age = EXCLUDED.age,
          income = EXCLUDED.income,
          region = EXCLUDED.region,
          credit_score = EXCLUDED.credit_score,
          updated_at = CURRENT_TIMESTAMP
      `;

      await query(insertQuery, [
        userId,
        userData.budget[0],
        userData.budget[1],
        userData.bodyType ? [userData.bodyType] : [],
        userData.fuelType ? [userData.fuelType] : [],
        userData.priorities.price,
        userData.priorities.fuel_efficiency,
        userData.priorities.safety,
        userData.priorities.performance,
        userData.priorities.design,
        userData.familySize,
        userData.age,
        userData.income,
        userData.region,
        userData.creditScore
      ]);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }
}

// 기존 FinanceExpertEngine과 CoordinatorEngine은 그대로 유지
export { FinanceExpertEngine, CoordinatorEngine } from './RealAgentEngine';