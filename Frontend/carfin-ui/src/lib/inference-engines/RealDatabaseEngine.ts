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

    // 기본 조건: 판매 가능한 차량만
    conditions.push('v.is_available = true');

    // 예산 조건
    conditions.push(`v.price BETWEEN ${userData.budget[0]} AND ${userData.budget[1]}`);

    // 차종 조건
    if (userData.bodyType) {
      conditions.push(`v.body_type = '${userData.bodyType}'`);
    }

    // 연료 타입 조건
    if (userData.fuelType) {
      conditions.push(`v.fuel_type = '${userData.fuelType}'`);
    }

    // 가족 구성에 따른 좌석 수 (최소 조건)
    const minSeats = userData.familySize <= 2 ? 2 : Math.min(userData.familySize, 8);
    conditions.push(`v.seating_capacity >= ${minSeats}`);

    // 지역 선호도 (같은 지역 우선, 다른 지역도 포함)
    if (userData.region) {
      orderByFields.push(`CASE WHEN v.region = '${userData.region}' THEN 0 ELSE 1 END`);
    }

    // 우선순위에 따른 정렬
    if (userData.priorities.safety > 0.3) {
      orderByFields.push('v.safety_rating DESC');
    }
    if (userData.priorities.fuel_efficiency > 0.3) {
      orderByFields.push('v.fuel_efficiency DESC');
    }
    if (userData.priorities.price > 0.3) {
      orderByFields.push('v.price ASC');
    }
    if (userData.priorities.performance > 0.2) {
      orderByFields.push('v.year DESC'); // 최신 연도를 성능 지표로
    }

    // 기본 정렬: 가성비 점수와 인기도 점수
    orderByFields.push('v.value_score DESC', 'v.popularity_score DESC');

    const query = `
SELECT
    v.id,
    b.name as brand,
    m.name as model,
    v.year,
    v.price,
    v.mileage,
    v.fuel_type,
    v.body_type,
    v.seating_capacity,
    v.fuel_efficiency,
    v.safety_rating,
    v.features,
    v.region,
    v.dealer_type,
    v.accident_history,
    v.owner_count,
    v.value_score,
    v.popularity_score,
    v.views_count
FROM vehicles v
JOIN brands b ON v.brand_id = b.id
JOIN models m ON v.model_id = m.id
WHERE ${conditions.join(' AND ')}
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
        brand: row.brand,
        model: row.model,
        year: row.year,
        price: row.price,
        mileage: row.mileage,
        fuelType: row.fuel_type,
        bodyType: row.body_type,
        seatingCapacity: row.seating_capacity,
        fuelEfficiency: row.fuel_efficiency || 0,
        safetyRating: row.safety_rating || 0,
        features: Array.isArray(row.features) ? row.features : [],
        region: row.region,
        dealerType: row.dealer_type,
        accidentHistory: row.accident_history || false,
        ownerCount: row.owner_count || 1,
        valueScore: row.value_score || 50,
        popularityScore: row.popularity_score || 50
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
          v.*,
          b.name as brand_name,
          m.name as model_name
        FROM vehicles v
        JOIN brands b ON v.brand_id = b.id
        JOIN models m ON v.model_id = m.id
        WHERE v.id = $1 AND v.is_available = true
      `;

      const result = await query(sqlQuery, [vehicleId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        brand: row.brand_name,
        model: row.model_name,
        year: row.year,
        price: row.price,
        mileage: row.mileage,
        fuelType: row.fuel_type,
        bodyType: row.body_type,
        seatingCapacity: row.seating_capacity,
        fuelEfficiency: row.fuel_efficiency || 0,
        safetyRating: row.safety_rating || 0,
        features: Array.isArray(row.features) ? row.features : [],
        region: row.region,
        dealerType: row.dealer_type,
        accidentHistory: row.accident_history || false,
        ownerCount: row.owner_count || 1,
        valueScore: row.value_score || 50,
        popularityScore: row.popularity_score || 50
      };
    } catch (error) {
      console.error('Vehicle details query error:', error);
      return null;
    }
  }

  /**
   * 차량 조회수 증가 (인기도 관리)
   */
  static async incrementViewCount(vehicleId: string): Promise<void> {
    try {
      await query(
        'UPDATE vehicles SET views_count = views_count + 1 WHERE id = $1',
        [vehicleId]
      );
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
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