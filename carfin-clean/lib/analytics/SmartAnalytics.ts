// 🚀 실제 매물 기반 스마트 분석 시스템
// 기존 searchVehicles 활용한 현실적 접근법

import { searchVehicles } from '@/lib/database';

interface PersonaMarketAnalysis {
  persona: string;
  priceRange: [number, number];
  sampleSize: number;
  topBrands: Array<{ brand: string; count: number; avgPrice: number }>;
  avgYear: number;
  priceDistribution: { min: number; max: number; avg: number };
  marketInsights: string[];
}

interface VehicleDistribution {
  manufacturer: string;
  count: number;
  avgPrice: number;
  avgYear: number;
  marketShare: number;
}

export class SmartAnalytics {

  // 🎯 CEO 페르소나 시장 분석 (실제 매물 기반)
  static async analyzeCEOMarket(): Promise<PersonaMarketAnalysis> {
    console.log('🎯 CEO 시장 분석 시작 (4500-7000만원 실제 매물)');

    // 실제 CEO 타겟 매물 검색
    const ceoVehicles = await searchVehicles(
      { min: 4500, max: 7000 },
      undefined,
      undefined,
      { id: 'ceo_executive', priorities: ['골프백 수납', '브랜드 프리스티지'] } as any
    );

    console.log(`📊 CEO 세그먼트 실제 매물: ${ceoVehicles.length.toLocaleString()}대 발견`);

    // 브랜드별 분포 계산
    const brandDistribution = this.calculateBrandDistribution(ceoVehicles);
    const topBrands = Object.entries(brandDistribution)
      .map(([brand, data]) => ({
        brand,
        count: data.count,
        avgPrice: Math.round(data.totalPrice / data.count),
        marketShare: (data.count / ceoVehicles.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 가격 및 연식 통계
    const priceStats = this.calculatePriceStats(ceoVehicles);
    const avgYear = ceoVehicles.reduce((sum, v) => sum + v.modelyear, 0) / ceoVehicles.length;

    // 시장 인사이트 생성
    const marketInsights = [
      `실제 매물 ${ceoVehicles.length.toLocaleString()}대 분석 결과`,
      `최다 브랜드: ${topBrands[0]?.brand} (${topBrands[0]?.count}대, ${topBrands[0]?.marketShare.toFixed(1)}%)`,
      `평균 가격: ${Math.round(priceStats.avg).toLocaleString()}만원`,
      `평균 연식: ${Math.round(avgYear)}년`,
      `${topBrands[0]?.brand}와 ${topBrands[1]?.brand}가 CEO 선호 브랜드 1,2위`
    ];

    return {
      persona: 'CEO Executive',
      priceRange: [4500, 7000],
      sampleSize: ceoVehicles.length,
      topBrands: topBrands.map(b => ({ brand: b.brand, count: b.count, avgPrice: b.avgPrice })),
      avgYear: Math.round(avgYear),
      priceDistribution: priceStats,
      marketInsights
    };
  }

  // 👩‍👧‍👦 워킹맘 페르소나 시장 분석
  static async analyzeWorkingMomMarket(): Promise<PersonaMarketAnalysis> {
    console.log('👩‍👧‍👦 워킹맘 시장 분석 시작 (2500-4000만원 실제 매물)');

    const workingMomVehicles = await searchVehicles(
      { min: 2500, max: 4000 },
      undefined,
      undefined,
      { id: 'working_mom', priorities: ['아이 안전성', '편의성'] } as any
    );

    console.log(`📊 워킹맘 세그먼트 실제 매물: ${workingMomVehicles.length.toLocaleString()}대 발견`);

    const brandDistribution = this.calculateBrandDistribution(workingMomVehicles);
    const topBrands = Object.entries(brandDistribution)
      .map(([brand, data]) => ({
        brand,
        count: data.count,
        avgPrice: Math.round(data.totalPrice / data.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const priceStats = this.calculatePriceStats(workingMomVehicles);
    const avgYear = workingMomVehicles.reduce((sum, v) => sum + v.modelyear, 0) / workingMomVehicles.length;

    const marketInsights = [
      `실제 매물 ${workingMomVehicles.length.toLocaleString()}대 분석 결과`,
      `최다 브랜드: ${topBrands[0]?.brand} (${topBrands[0]?.count}대)`,
      `가성비 중심 세그먼트: 평균 ${Math.round(priceStats.avg).toLocaleString()}만원`,
      `실용성 우선: ${topBrands[0]?.brand}, ${topBrands[1]?.brand} 선호`
    ];

    return {
      persona: 'Working Mom',
      priceRange: [2500, 4000],
      sampleSize: workingMomVehicles.length,
      topBrands: topBrands.map(b => ({ brand: b.brand, count: b.count, avgPrice: b.avgPrice })),
      avgYear: Math.round(avgYear),
      priceDistribution: priceStats,
      marketInsights
    };
  }

  // 🔥 브랜드별 페르소나 적합도 실제 계산
  static async calculateBrandPersonaFit(brand: string): Promise<{
    ceoFitScore: number;
    workingMomFitScore: number;
    evidences: string[];
    confidence: number;
  }> {

    console.log(`🔍 ${brand} 브랜드 페르소나 적합도 분석`);

    // CEO 세그먼트에서 해당 브랜드 매물 검색
    const ceoVehicles = await searchVehicles({ min: 4500, max: 7000 });
    const ceoBrandVehicles = ceoVehicles.filter(v => v.manufacturer === brand);

    // 워킹맘 세그먼트에서 해당 브랜드 매물 검색
    const workingMomVehicles = await searchVehicles({ min: 2500, max: 4000 });
    const workingMomBrandVehicles = workingMomVehicles.filter(v => v.manufacturer === brand);

    // 적합도 점수 계산 (실제 매물 수 기반)
    const ceoFitScore = Math.min(100, (ceoBrandVehicles.length / Math.max(1, ceoVehicles.length * 0.1)) * 100);
    const workingMomFitScore = Math.min(100, (workingMomBrandVehicles.length / Math.max(1, workingMomVehicles.length * 0.1)) * 100);

    const evidences = [
      `${brand} CEO 세그먼트 매물: ${ceoBrandVehicles.length}대 / 전체 ${ceoVehicles.length}대`,
      `${brand} 워킹맘 세그먼트 매물: ${workingMomBrandVehicles.length}대 / 전체 ${workingMomVehicles.length}대`,
      `실제 매물 분포 기반 적합도 계산`,
      ceoBrandVehicles.length > 0 ? `CEO 평균가: ${Math.round(ceoBrandVehicles.reduce((sum, v) => sum + v.price, 0) / ceoBrandVehicles.length).toLocaleString()}만원` : '',
      workingMomBrandVehicles.length > 0 ? `워킹맘 평균가: ${Math.round(workingMomBrandVehicles.reduce((sum, v) => sum + v.price, 0) / workingMomBrandVehicles.length).toLocaleString()}만원` : ''
    ].filter(Boolean);

    const confidence = Math.min(95, (ceoBrandVehicles.length + workingMomBrandVehicles.length) * 2);

    return {
      ceoFitScore: Math.round(ceoFitScore),
      workingMomFitScore: Math.round(workingMomFitScore),
      evidences,
      confidence: Math.round(confidence)
    };
  }

  // 🔥 실시간 인기 모델 분석
  static async getPopularModelsInSegment(
    priceMin: number,
    priceMax: number
  ): Promise<Array<{model: string, manufacturer: string, count: number, avgPrice: number}>> {

    const vehicles = await searchVehicles({ min: priceMin, max: priceMax });

    const modelCount: { [key: string]: { count: number; totalPrice: number } } = {};

    vehicles.forEach(vehicle => {
      const key = `${vehicle.manufacturer}_${vehicle.model}`;
      if (!modelCount[key]) {
        modelCount[key] = { count: 0, totalPrice: 0 };
      }
      modelCount[key].count++;
      modelCount[key].totalPrice += vehicle.price;
    });

    return Object.entries(modelCount)
      .map(([key, data]) => {
        const [manufacturer, model] = key.split('_');
        return {
          model,
          manufacturer,
          count: data.count,
          avgPrice: Math.round(data.totalPrice / data.count)
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // 유틸리티 함수들
  private static calculateBrandDistribution(vehicles: any[]): { [brand: string]: { count: number; totalPrice: number } } {
    const distribution: { [brand: string]: { count: number; totalPrice: number } } = {};

    vehicles.forEach(vehicle => {
      if (!distribution[vehicle.manufacturer]) {
        distribution[vehicle.manufacturer] = { count: 0, totalPrice: 0 };
      }
      distribution[vehicle.manufacturer].count++;
      distribution[vehicle.manufacturer].totalPrice += vehicle.price;
    });

    return distribution;
  }

  private static calculatePriceStats(vehicles: any[]): { min: number; max: number; avg: number } {
    if (vehicles.length === 0) return { min: 0, max: 0, avg: 0 };

    const prices = vehicles.map(v => v.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((sum, price) => sum + price, 0) / prices.length
    };
  }
}

// 🎯 즉시 활용 가능한 분석 함수들
export const quickAnalyze = {
  async ceoSegment() {
    return await SmartAnalytics.analyzeCEOMarket();
  },

  async workingMomSegment() {
    return await SmartAnalytics.analyzeWorkingMomMarket();
  },

  async bmwFit() {
    return await SmartAnalytics.calculateBrandPersonaFit('BMW');
  }
};