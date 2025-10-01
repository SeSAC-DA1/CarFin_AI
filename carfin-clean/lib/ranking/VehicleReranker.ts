// VehicleReranker.ts - 2단계 리랭킹 시스템
// 1차: 기본 유사도 기반 필터링 (database.ts)
// 2차: LLM 기반 페르소나 맞춤 개인화 리랭킹 + 리뷰 감성분석 통합

import { GoogleGenerativeAI } from '@google/generative-ai';
import { VehicleOptionAnalyzer } from '@/lib/valuation/VehicleOptionAnalyzer';

interface VehicleForRanking {
  vehicle_id?: string;
  manufacturer: string;
  model: string;
  modelyear: number;
  price: number;
  distance: number;
  fueltype: string;
  cartype: string;
  location: string;
  color?: string;
  options?: string; // 차량 옵션 정보
  [key: string]: any;
}

interface PersonaProfile {
  id: string;
  name: string;
  priorities: string[];
  budget: { min: number; max: number };
  situation: string;
  realConcerns: string[];
}

interface RerankingResult {
  vehicle: VehicleForRanking;
  score: number;
  reasoning: string;
  personalizedInsights: string[];
  optionAnalysis?: {
    totalOptionValue: number;
    optionHighlights: string[];
    missingCriticalOptions: string[];
    personaFitScore: number;
    recommendation: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    valueJustification: string[];
  };
  tcoAnalysis?: {
    averageTCO: number;
    bestValueVehicle: string;
    costRange: string;
  };
  // 🔥 리뷰 인사이트 추가
  reviewInsight?: {
    insight: string;
    sentimentScore: number;
    brandTierAdjustment: string;
    personaRelevance: string;
    sourceReviewCount: number;
    confidence: 'high' | 'medium' | 'low';
  };
}

export class VehicleReranker {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * 2단계 리랭킹 시스템의 핵심 메서드 (차량 옵션 분석 + 페르소나 맞춤)
   * 1차 필터링된 차량들을 페르소나별 맞춤 개인화 + 실제 옵션 데이터 분석으로 재정렬
   */
  async rerankVehicles(
    vehicles: VehicleForRanking[],
    persona: PersonaProfile,
    userContext: string
  ): Promise<RerankingResult[]> {
    console.log(`🎯 2단계 리랭킹 시작: ${vehicles.length}대 → 페르소나 "${persona.name}" 맞춤 분석 + 옵션 분석`);

    if (vehicles.length === 0) {
      return [];
    }

    // 🎭 LLM 기반 페르소나 리랭킹 + 옵션 분석
    console.log(`🎭 페르소나 맞춤 리랭킹 + 옵션 분석 수행 중...`);
    const batchSize = 5; // 한 번에 5대씩 분석
    const batches = this.createBatches(vehicles, batchSize);
    const allResults: RerankingResult[] = [];

    for (let i = 0; i < batches.length; i++) {
      console.log(`📊 배치 ${i + 1}/${batches.length} 처리 중...`);

      try {
        const batchResults = await this.processBatch(
          batches[i],
          persona,
          userContext,
          i === 0 // 첫 번째 배치에서만 전체 분석
        );
        allResults.push(...batchResults);
      } catch (error) {
        console.error(`❌ 배치 ${i + 1} 처리 실패:`, error);
        // 실패한 배치는 기본 점수로 폴백
        const fallbackResults = batches[i].map((vehicle, idx) => ({
          vehicle,
          score: 50 + (batches[i].length - idx) * 5, // 기본 점수
          reasoning: `기본 분석: ${vehicle.manufacturer} ${vehicle.model}은 ${persona.name}님의 기본 조건에 부합합니다.`,
          personalizedInsights: [
            `💰 예산 ${persona.budget.min}-${persona.budget.max}만원 범위에 적합`,
            `🚗 ${vehicle.cartype} ${vehicle.fueltype} 차량`,
            `📍 ${vehicle.location} 소재`
          ]
        }));
        allResults.push(...fallbackResults);
      }
    }

    // 최종 점수 기준 정렬 및 상위 15대 선별
    const finalResults = allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    console.log(`✅ 2단계 리랭킹 완료: ${finalResults.length}대 최종 선별`);
    return finalResults;
  }

  /**
   * 배치 단위로 차량 분석 처리 (옵션 분석 + 페르소나 맞춤)
   */
  private async processBatch(
    vehicles: VehicleForRanking[],
    persona: PersonaProfile,
    userContext: string,
    isFirstBatch: boolean
  ): Promise<RerankingResult[]> {
    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 2000, // 출력 제한으로 속도 향상
      }
    });

    // 🚗 차량 옵션 분석 수행
    const optionAnalysisResults = new Map<string, any>();
    for (const vehicle of vehicles) {
      try {
        if (vehicle.options) {
          const vehicleOptions = vehicle.options.split(',').map(opt => opt.trim());
          const optionAnalysis = VehicleOptionAnalyzer.analyzeVehicleOptions(vehicleOptions, persona.id);
          const key = `${vehicle.manufacturer}_${vehicle.model}_${vehicle.modelyear}`;
          optionAnalysisResults.set(key, optionAnalysis);
        }
      } catch (error) {
        console.warn(`⚠️ 옵션 분석 실패: ${vehicle.manufacturer} ${vehicle.model}`, error);
      }
    }

    // 🔥 리뷰 인사이트 분석 수행
    const reviewInsightResults = new Map<string, any>();
    try {
      const { brandTierReviewEngine } = await import('@/lib/review/BrandTierReviewEngine');
      console.log(`💬 ${vehicles.length}대 차량의 리뷰 인사이트 생성 중...`);

      for (const vehicle of vehicles) {
        try {
          const reviewInsight = await brandTierReviewEngine.generateVehicleReviewInsight(
            vehicle.manufacturer,
            vehicle.model,
            vehicle.modelyear,
            vehicle.cartype,
            persona.id
          );
          const key = `${vehicle.manufacturer}_${vehicle.model}_${vehicle.modelyear}`;
          reviewInsightResults.set(key, {
            insight: reviewInsight.reviewInsight,
            sentimentScore: reviewInsight.sentimentScore,
            brandTierAdjustment: reviewInsight.brandTierAdjustment,
            personaRelevance: reviewInsight.personaRelevance,
            sourceReviewCount: reviewInsight.sourceReviewCount,
            confidence: reviewInsight.confidence
          });
        } catch (error) {
          console.warn(`⚠️ 리뷰 인사이트 생성 실패: ${vehicle.manufacturer} ${vehicle.model}`, error);
        }
      }

      console.log(`✅ 리뷰 인사이트 생성 완료: ${reviewInsightResults.size}개`);
    } catch (error) {
      console.error('❌ 리뷰 인사이트 시스템 로드 실패:', error);
    }

    const vehicleList = vehicles.map((v, idx) => {
      const key = `${v.manufacturer}_${v.model}_${v.modelyear}`;
      const optionAnalysis = optionAnalysisResults.get(key);
      const reviewInsight = reviewInsightResults.get(key);

      const optionInfo = optionAnalysis
        ? ` [옵션가치: ${optionAnalysis.totalOptionValue}점, ${optionAnalysis.recommendation}]`
        : '';

      const reviewInfo = reviewInsight
        ? ` [리뷰: "${reviewInsight.insight}" (신뢰도: ${reviewInsight.confidence}, 평점: ${reviewInsight.sentimentScore.toFixed(1)})]`
        : '';

      return `${idx + 1}. ${v.manufacturer} ${v.model} ${v.modelyear}년 - ${v.price?.toLocaleString()}만원 (${v.distance?.toLocaleString()}km) [${v.fueltype}]${optionInfo}${reviewInfo}`;
    }).join('\n');

    // 종합 분석 요약 생성
    const analysisSubSummary = [];

    if (optionAnalysisResults.size > 0) {
      analysisSubSummary.push(`🚗 차량 옵션 분석:\n${Array.from(optionAnalysisResults.entries()).map(([key, analysis]) => {
        const [manufacturer, model] = key.split('_');
        return `- ${manufacturer} ${model}: 옵션가치 ${analysis.totalOptionValue}점 (${analysis.recommendation}), 하이라이트: ${analysis.optionHighlights.length}개`;
      }).join('\n')}`);
    }

    if (reviewInsightResults.size > 0) {
      analysisSubSummary.push(`💬 리뷰 인사이트 분석:\n${Array.from(reviewInsightResults.entries()).map(([key, review]) => {
        const [manufacturer, model] = key.split('_');
        return `- ${manufacturer} ${model}: "${review.insight}" (${review.sourceReviewCount}개 리뷰 기반, ${review.confidence} 신뢰도)`;
      }).join('\n')}`);
    }

    const comprehensiveSummary = analysisSubSummary.length > 0
      ? `\n${analysisSubSummary.join('\n\n')}\n`
      : '';

    const prompt = `당신은 CarFin AI의 전문 차량 평가사입니다. 다음 차량들을 "${persona.name}" 페르소나에 맞춰 개인화 점수를 매겨주세요.

📋 페르소나 프로필:
- 이름: ${persona.name}
- 상황: ${persona.situation}
- 우선순위: ${persona.priorities.join(', ')}
- 예산: ${persona.budget.min}-${persona.budget.max}만원
- 주요 고민: ${persona.realConcerns.slice(0, 3).join(', ')}

🚗 분석 대상 차량:
${vehicleList}${comprehensiveSummary}

🎯 사용자 요청: "${userContext}"

각 차량을 다음 기준으로 평가하여 JSON 형태로 응답해주세요:

{
  "rankings": [
    {
      "vehicleIndex": 1,
      "score": 85,
      "reasoning": "이 차량이 ${persona.name}님에게 적합한 구체적 이유",
      "insights": ["💡 핵심 장점1", "💡 핵심 장점2", "💡 핵심 장점3"]
    }
  ]
}

평가 기준:
1. 페르소나 우선순위 부합도 (35%)
2. 차량 옵션 가치 분석 (25%)
3. 예산 대비 가성비 (20%)
4. 실제 고민 해결 정도 (15%)
5. 상황적 적합성 (5%)

🚗 차량 옵션 분석 활용 가이드:
- 옵션가치 점수(0-100): 페르소나 맞춤 옵션 보유 정도
- EXCELLENT(85+): 페르소나에 최적화된 옵션 구성 (높은 점수)
- GOOD(70-84): 적절한 옵션 보유 (중간 점수)
- AVERAGE(50-69): 기본적 옵션만 보유 (기본 점수)
- POOR(50미만): 중요 옵션 부족 (낮은 점수)

💡 실제 통계 데이터 활용:
- 실제 RDS 매물 데이터 기반 옵션 인기도
- 타이어 공기압센서(99.6%), 에어백(사이드)(98.8%) 등 실제 보급률
- CEO 페르소나 특화 옵션 가중치 적용

점수 범위: 0-100점 (80점 이상: 강력 추천, 60-79점: 추천, 40-59점: 보통, 40점 미만: 비추천)

반드시 JSON 형태로만 응답하세요.`;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    try {
      // JSON 파싱 및 결과 매핑
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();

      // 빈 응답 검사 - 폴백으로 처리
      if (!cleanedResponse || cleanedResponse.length < 10) {
        console.warn('⚠️ LLM 응답이 비어있음, 폴백 처리');
        return this.generateBatchFallback(vehicles);
      }

      const parsed = JSON.parse(cleanedResponse);

      return parsed.rankings.map((ranking: any) => {
        const vehicleIndex = ranking.vehicleIndex - 1;
        const vehicle = vehicles[vehicleIndex];

        if (!vehicle) {
          throw new Error(`Invalid vehicle index: ${ranking.vehicleIndex}`);
        }

        // 옵션 분석 및 리뷰 인사이트 결과 포함
        const key = `${vehicle.manufacturer}_${vehicle.model}_${vehicle.modelyear}`;
        const optionAnalysis = optionAnalysisResults.get(key);
        const reviewInsight = reviewInsightResults.get(key);

        return {
          vehicle,
          score: Math.max(0, Math.min(100, ranking.score)), // 0-100 범위 보장
          reasoning: ranking.reasoning || `${vehicle.manufacturer} ${vehicle.model}은 ${persona.name}님께 적합합니다.`,
          personalizedInsights: ranking.insights || [
            `🚗 ${vehicle.manufacturer} ${vehicle.model} ${vehicle.modelyear}년식`,
            `💰 ${vehicle.price?.toLocaleString()}만원 (예산 내)`,
            `⛽ ${vehicle.fueltype} ${vehicle.cartype}`
          ],
          optionAnalysis: optionAnalysis ? {
            totalOptionValue: optionAnalysis.totalOptionValue,
            optionHighlights: optionAnalysis.optionHighlights,
            missingCriticalOptions: optionAnalysis.missingCriticalOptions,
            personaFitScore: optionAnalysis.personaFitScore,
            recommendation: optionAnalysis.recommendation,
            valueJustification: optionAnalysis.valueJustification
          } : undefined,
          reviewInsight: reviewInsight ? {
            insight: reviewInsight.insight,
            sentimentScore: reviewInsight.sentimentScore,
            brandTierAdjustment: reviewInsight.brandTierAdjustment,
            personaRelevance: reviewInsight.personaRelevance,
            sourceReviewCount: reviewInsight.sourceReviewCount,
            confidence: reviewInsight.confidence
          } : undefined
        };
      });

    } catch (parseError) {
      console.error('🚨 LLM 응답 파싱 실패, 폴백 처리:', parseError);

      // 파싱 실패 시 폴백: 간단한 규칙 기반 점수
      return vehicles.map((vehicle, idx) => {
        const budgetScore = this.calculateBudgetScore(vehicle.price, persona.budget);
        const brandScore = this.calculateBrandScore(vehicle.manufacturer, persona);
        const baseScore = Math.round((budgetScore + brandScore) / 2);

        return {
          vehicle,
          score: baseScore + (vehicles.length - idx) * 2, // 순서 가산점
          reasoning: `${vehicle.manufacturer} ${vehicle.model}은 예산 및 브랜드 선호도 분석 결과 ${persona.name}님께 적합합니다.`,
          personalizedInsights: [
            `💰 예산 적합도: ${budgetScore}점`,
            `🏷️ 브랜드 매칭: ${brandScore}점`,
            `🚗 ${vehicle.cartype} ${vehicle.fueltype} 차량`
          ]
        };
      });
    }
  }

  /**
   * 예산 적합도 점수 계산
   */
  private calculateBudgetScore(price: number, budget: { min: number; max: number }): number {
    if (price < budget.min) return 70; // 예산 미달
    if (price > budget.max) return 40; // 예산 초과

    // 예산 범위 내에서의 점수 (중간값에 가까울수록 높은 점수)
    const midPoint = (budget.min + budget.max) / 2;
    const range = budget.max - budget.min;
    const deviation = Math.abs(price - midPoint);

    return Math.round(100 - (deviation / range) * 30);
  }

  /**
   * 브랜드 선호도 점수 계산
   */
  private calculateBrandScore(manufacturer: string, persona: PersonaProfile): number {
    const brandScores: { [key: string]: { [key: string]: number } } = {
      'ceo_executive': {
        '벤츠': 95, 'BMW': 95, '아우디': 90, '제네시스': 85, '렉서스': 80,
        '현대': 70, '기아': 70, '볼보': 75, '인피니티': 65
      },
      'mz_office_worker': {
        'BMW': 90, '벤츠': 85, '아우디': 85, '제네시스': 80, '테슬라': 95,
        '현대': 75, '기아': 75, '포르쉐': 85, '볼보': 70
      },
      'working_mom': {
        '현대': 90, '기아': 90, '제네시스': 75, '볼보': 85, 'BMW': 70,
        '벤츠': 65, '아우디': 65, '토요타': 80, '혼다': 75
      },
      'camping_lover': {
        '현대': 85, '기아': 85, '제네시스': 75, '쌍용': 80, 'BMW': 70,
        '벤츠': 70, '아우디': 70, '지프': 90, '랜드로버': 85
      }
    };

    const personaScores = brandScores[persona.id] || {};
    return personaScores[manufacturer] || 60; // 기본 점수
  }

  /**
   * 배치 생성 유틸리티
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 백업 리랭킹 시스템 (LLM 실패 시)
   */
  async fallbackReranking(
    vehicles: VehicleForRanking[],
    persona: PersonaProfile
  ): Promise<RerankingResult[]> {
    console.log('🔄 백업 리랭킹 시스템 활성화');

    return vehicles.map((vehicle, index) => {
      const budgetScore = this.calculateBudgetScore(vehicle.price, persona.budget);
      const brandScore = this.calculateBrandScore(vehicle.manufacturer, persona);
      const yearScore = Math.max(0, 100 - (2024 - vehicle.modelyear) * 5); // 연식 점수

      const finalScore = Math.round(
        budgetScore * 0.4 +
        brandScore * 0.35 +
        yearScore * 0.25
      );

      return {
        vehicle,
        score: finalScore,
        reasoning: `규칙 기반 분석으로 ${vehicle.manufacturer} ${vehicle.model}을 ${persona.name}님께 추천합니다.`,
        personalizedInsights: [
          `💰 예산 적합도: ${budgetScore}점`,
          `🏷️ 브랜드 적합도: ${brandScore}점`,
          `📅 연식: ${vehicle.modelyear}년 (${yearScore}점)`
        ]
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * 배치 폴백 생성 (LLM 응답 실패시)
   */
  private generateBatchFallback(vehicles: VehicleForRanking[]): RerankingResult[] {
    // 임시 페르소나 사용 (기본값)
    const defaultPersona = {
      name: 'Default',
      budget: { min: 1000, max: 8000 },
      priorities: []
    } as PersonaProfile;

    console.log(`🔄 배치 폴백 생성: ${vehicles.length}대 처리`);

    return vehicles.map((vehicle, index) => {
      const baseScore = 50 + (Math.random() * 30); // 50-80 기본 점수
      const yearBonus = Math.max(0, (vehicle.modelyear - 2015) * 2);
      const finalScore = Math.min(100, Math.round(baseScore + yearBonus));

      return {
        vehicle,
        score: finalScore,
        reasoning: `폴백 분석으로 ${vehicle.manufacturer} ${vehicle.model}을 추천합니다.`,
        personalizedInsights: [
          `📊 기본 점수: ${Math.round(baseScore)}점`,
          `📅 연식 보너스: ${yearBonus}점`,
          `🔄 폴백 모드 적용`
        ]
      };
    }).sort((a, b) => b.score - a.score);
  }
}