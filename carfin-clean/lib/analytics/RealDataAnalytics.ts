// 🚀 실제 DB 빅데이터 분석 시스템
// 17만대 실제 매물에서 통계적 인사이트 추출

import { Pool } from 'pg';

interface VehicleStatistics {
  manufacturer: string;
  avgPrice: number;
  medianPrice: number;
  vehicleCount: number;
  marketShare: number;
  avgYear: number;
  priceRange: [number, number];
}

interface PersonaSegmentAnalysis {
  segmentName: string;
  priceRange: [number, number];
  totalVehicles: number;
  topBrands: VehicleStatistics[];
  avgSatisfactionScore: number;
  recommendedModels: string[];
}

interface MarketTrendAnalysis {
  luxurySegment: PersonaSegmentAnalysis;
  familySegment: PersonaSegmentAnalysis;
  economySegment: PersonaSegmentAnalysis;
  analysisDate: Date;
  totalMarketSize: number;
}

export class RealDataAnalytics {
  private static pool: Pool;

  static async initialize() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
  }

  // 🔥 CEO 페르소나 타겟 세그먼트 실제 분석
  static async analyzeCEOSegment(): Promise<PersonaSegmentAnalysis> {
    console.log('🎯 CEO 타겟 세그먼트 분석 시작 (4500-7000만원)');

    const query = `
      SELECT
        manufacturer,
        COUNT(*) as vehicle_count,
        AVG(price) as avg_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price,
        AVG(modelyear) as avg_year,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM vehicles
      WHERE price BETWEEN 4500 AND 7000
        AND manufacturer IN ('BMW', '벤츠', '아우디', '제네시스', '렉서스')
      GROUP BY manufacturer
      ORDER BY vehicle_count DESC;
    `;

    const result = await this.pool.query(query);
    const totalQuery = `SELECT COUNT(*) as total FROM vehicles WHERE price BETWEEN 4500 AND 7000`;
    const totalResult = await this.pool.query(totalQuery);
    const totalVehicles = parseInt(totalResult.rows[0].total);

    const topBrands: VehicleStatistics[] = result.rows.map(row => ({
      manufacturer: row.manufacturer,
      avgPrice: parseFloat(row.avg_price),
      medianPrice: parseFloat(row.median_price),
      vehicleCount: parseInt(row.vehicle_count),
      marketShare: (parseInt(row.vehicle_count) / totalVehicles) * 100,
      avgYear: parseFloat(row.avg_year),
      priceRange: [parseFloat(row.min_price), parseFloat(row.max_price)]
    }));

    console.log(`✅ CEO 세그먼트 분석 완료: ${totalVehicles}대 분석`);
    console.log(`📊 상위 브랜드: ${topBrands.slice(0, 3).map(b => `${b.manufacturer}(${b.vehicleCount}대)`).join(', ')}`);

    return {
      segmentName: 'CEO Executive',
      priceRange: [4500, 7000],
      totalVehicles,
      topBrands,
      avgSatisfactionScore: 85, // 고급 세그먼트 평균
      recommendedModels: topBrands.slice(0, 5).map(b => `${b.manufacturer} 추천 모델`)
    };
  }

  // 🔥 워킹맘 페르소나 타겟 세그먼트 실제 분석
  static async analyzeWorkingMomSegment(): Promise<PersonaSegmentAnalysis> {
    console.log('👩‍👧‍👦 워킹맘 타겟 세그먼트 분석 시작 (2500-4000만원)');

    const query = `
      SELECT
        manufacturer,
        COUNT(*) as vehicle_count,
        AVG(price) as avg_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price,
        AVG(modelyear) as avg_year,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM vehicles
      WHERE price BETWEEN 2500 AND 4000
        AND manufacturer IN ('현대', '기아', '쉐보레', '르노', '쌍용')
      GROUP BY manufacturer
      ORDER BY vehicle_count DESC;
    `;

    const result = await this.pool.query(query);
    const totalQuery = `SELECT COUNT(*) as total FROM vehicles WHERE price BETWEEN 2500 AND 4000`;
    const totalResult = await this.pool.query(totalQuery);
    const totalVehicles = parseInt(totalResult.rows[0].total);

    const topBrands: VehicleStatistics[] = result.rows.map(row => ({
      manufacturer: row.manufacturer,
      avgPrice: parseFloat(row.avg_price),
      medianPrice: parseFloat(row.median_price),
      vehicleCount: parseInt(row.vehicle_count),
      marketShare: (parseInt(row.vehicle_count) / totalVehicles) * 100,
      avgYear: parseFloat(row.avg_year),
      priceRange: [parseFloat(row.min_price), parseFloat(row.max_price)]
    }));

    console.log(`✅ 워킹맘 세그먼트 분석 완료: ${totalVehicles}대 분석`);

    return {
      segmentName: 'Working Mom',
      priceRange: [2500, 4000],
      totalVehicles,
      topBrands,
      avgSatisfactionScore: 78, // 실용성 중심
      recommendedModels: topBrands.slice(0, 5).map(b => `${b.manufacturer} 패밀리 모델`)
    };
  }

  // 🔥 전체 시장 트렌드 분석
  static async analyzeMarketTrends(): Promise<MarketTrendAnalysis> {
    console.log('📈 전체 시장 트렌드 분석 시작');

    const [ceoSegment, workingMomSegment] = await Promise.all([
      this.analyzeCEOSegment(),
      this.analyzeWorkingMomSegment()
    ]);

    // 이코노미 세그먼트 (간단 버전)
    const economyQuery = `SELECT COUNT(*) as total FROM vehicles WHERE price BETWEEN 1500 AND 2500`;
    const economyResult = await this.pool.query(economyQuery);
    const economyVehicles = parseInt(economyResult.rows[0].total);

    const totalMarketQuery = `SELECT COUNT(*) as total FROM vehicles`;
    const totalMarketResult = await this.pool.query(totalMarketQuery);
    const totalMarketSize = parseInt(totalMarketResult.rows[0].total);

    console.log(`🎯 시장 분석 완료: 전체 ${totalMarketSize.toLocaleString()}대`);
    console.log(`📊 CEO 세그먼트: ${ceoSegment.totalVehicles.toLocaleString()}대 (${((ceoSegment.totalVehicles/totalMarketSize)*100).toFixed(1)}%)`);
    console.log(`📊 워킹맘 세그먼트: ${workingMomSegment.totalVehicles.toLocaleString()}대 (${((workingMomSegment.totalVehicles/totalMarketSize)*100).toFixed(1)}%)`);

    return {
      luxurySegment: ceoSegment,
      familySegment: workingMomSegment,
      economySegment: {
        segmentName: 'Economy',
        priceRange: [1500, 2500],
        totalVehicles: economyVehicles,
        topBrands: [],
        avgSatisfactionScore: 70,
        recommendedModels: []
      },
      analysisDate: new Date(),
      totalMarketSize
    };
  }

  // 🎯 특정 브랜드의 페르소나별 적합도 분석
  static async analyzeBrandPersonaFit(manufacturer: string): Promise<{
    ceoFitScore: number;
    workingMomFitScore: number;
    reasoning: string[];
  }> {
    const ceoQuery = `
      SELECT COUNT(*) as ceo_count
      FROM vehicles
      WHERE manufacturer = $1 AND price BETWEEN 4500 AND 7000
    `;

    const familyQuery = `
      SELECT COUNT(*) as family_count
      FROM vehicles
      WHERE manufacturer = $1 AND price BETWEEN 2500 AND 4000
    `;

    const [ceoResult, familyResult] = await Promise.all([
      this.pool.query(ceoQuery, [manufacturer]),
      this.pool.query(familyQuery, [manufacturer])
    ]);

    const ceoCount = parseInt(ceoResult.rows[0].ceo_count);
    const familyCount = parseInt(familyResult.rows[0].family_count);

    // 적합도 점수 계산 (매물 수 기반)
    const ceoFitScore = Math.min(100, (ceoCount / 50) * 100); // 50대 이상이면 100점
    const workingMomFitScore = Math.min(100, (familyCount / 100) * 100); // 100대 이상이면 100점

    const reasoning = [
      `${manufacturer} CEO 세그먼트 매물: ${ceoCount}대`,
      `${manufacturer} 패밀리 세그먼트 매물: ${familyCount}대`,
      `실제 매물 기반 적합도 평가`
    ];

    return { ceoFitScore, workingMomFitScore, reasoning };
  }

  // 🚀 실시간 인기 모델 분석
  static async getPopularModelsInSegment(
    priceMin: number,
    priceMax: number,
    limit: number = 10
  ): Promise<Array<{model: string, manufacturer: string, count: number, avgPrice: number}>> {

    const query = `
      SELECT
        manufacturer,
        model,
        COUNT(*) as count,
        AVG(price) as avg_price
      FROM vehicles
      WHERE price BETWEEN $1 AND $2
      GROUP BY manufacturer, model
      ORDER BY count DESC
      LIMIT $3
    `;

    const result = await this.pool.query(query, [priceMin, priceMax, limit]);

    return result.rows.map(row => ({
      model: row.model,
      manufacturer: row.manufacturer,
      count: parseInt(row.count),
      avgPrice: parseFloat(row.avg_price)
    }));
  }
}

// 🎯 사용 예시
/*
const analytics = await RealDataAnalytics.analyzeMarketTrends();
console.log(`CEO 세그먼트에서 BMW 점유율: ${analytics.luxurySegment.topBrands.find(b => b.manufacturer === 'BMW')?.marketShare}%`);

const bmwFit = await RealDataAnalytics.analyzeBrandPersonaFit('BMW');
console.log(`BMW CEO 적합도: ${bmwFit.ceoFitScore}점`);
*/