// VehicleReranker.ts - 2단계 리랭킹 시스템
// 1차: 기본 유사도 기반 필터링 (database.ts)
// 2차: LLM 기반 페르소나 맞춤 개인화 리랭킹 + 리뷰 감성분석 통합

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReviewSentimentAnalyzer } from '@/lib/sentiment/ReviewSentimentAnalyzer';

interface VehicleForRanking {
  vehicleid?: string;
  manufacturer: string;
  model: string;
  modelyear: number;
  price: number;
  distance: number;
  fueltype: string;
  cartype: string;
  location: string;
  color?: string;
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
  tcoAnalysis?: {
    averageTCO: number;
    bestValueVehicle: string;
    costRange: string;
  };
}

export class VehicleReranker {
  private genAI: GoogleGenerativeAI;
  private sentimentAnalyzer: ReviewSentimentAnalyzer;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.sentimentAnalyzer = new ReviewSentimentAnalyzer(apiKey);
  }

  /**
   * 2단계 리랭킹 시스템의 핵심 메서드 (리뷰 감성분석 통합)
   * 1차 필터링된 차량들을 페르소나별 맞춤 개인화 + 리뷰 감성분석으로 재정렬
   */
  async rerankVehicles(
    vehicles: VehicleForRanking[],
    persona: PersonaProfile,
    userContext: string
  ): Promise<RerankingResult[]> {
    console.log(`🎯 2단계 리랭킹 시작: ${vehicles.length}대 → 페르소나 "${persona.name}" 맞춤 분석 + 리뷰 감성분석`);

    if (vehicles.length === 0) {
      return [];
    }

    // 🔍 리뷰 감성분석 먼저 수행
    console.log(`💭 1단계: 리뷰 감성분석 수행 중...`);
    let sentimentResults: Map<string, any> = new Map();

    try {
      sentimentResults = await this.sentimentAnalyzer.analyzeVehicleReviews(vehicles, persona.id);
      console.log(`✅ 리뷰 감성분석 완료: ${sentimentResults.size}대 분석됨`);
    } catch (sentimentError) {
      console.error('⚠️ 리뷰 감성분석 실패, 기본 점수 사용:', sentimentError);
    }

    // 🎭 LLM 기반 페르소나 리랭킹
    console.log(`🎭 2단계: 페르소나 맞춤 리랭킹 수행 중...`);
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
          i === 0, // 첫 번째 배치에서만 전체 분석
          sentimentResults // 리뷰 감성분석 결과 전달
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
   * 배치 단위로 차량 분석 처리 (리뷰 감성분석 통합)
   */
  private async processBatch(
    vehicles: VehicleForRanking[],
    persona: PersonaProfile,
    userContext: string,
    isFirstBatch: boolean,
    sentimentResults?: Map<string, any>
  ): Promise<RerankingResult[]> {
    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 2000, // 출력 제한으로 속도 향상
      }
    });

    const vehicleList = vehicles.map((v, idx) => {
      const key = `${v.manufacturer}_${v.model}_${v.modelyear}`;
      const sentiment = sentimentResults?.get(key);
      const sentimentInfo = sentiment
        ? ` [감성점수: ${sentiment.sentimentScore}/100, 리뷰: ${sentiment.reviewCount}개]`
        : '';
      return `${idx + 1}. ${v.manufacturer} ${v.model} ${v.modelyear}년 - ${v.price?.toLocaleString()}만원 (${v.distance?.toLocaleString()}km) [${v.fueltype}]${sentimentInfo}`;
    }).join('\n');

    // 감성분석 요약 생성
    const sentimentSummary = sentimentResults && sentimentResults.size > 0
      ? `\n💭 리뷰 감성분석 요약:\n${Array.from(sentimentResults.entries()).map(([key, sentiment]) => {
          const [manufacturer, model] = key.split('_');
          return `- ${manufacturer} ${model}: ${sentiment.overallSentiment} (${sentiment.sentimentScore}점, ${sentiment.reviewCount}개 리뷰)`;
        }).join('\n')}\n`
      : '';

    const prompt = `당신은 CarFin AI의 전문 차량 평가사입니다. 다음 차량들을 "${persona.name}" 페르소나에 맞춰 개인화 점수를 매겨주세요.

📋 페르소나 프로필:
- 이름: ${persona.name}
- 상황: ${persona.situation}
- 우선순위: ${persona.priorities.join(', ')}
- 예산: ${persona.budget.min}-${persona.budget.max}만원
- 주요 고민: ${persona.realConcerns.slice(0, 3).join(', ')}

🚗 분석 대상 차량:
${vehicleList}${sentimentSummary}

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
2. 예산 대비 가성비 (25%)
3. 리뷰 감성분석 점수 반영 (20%)
4. 실제 고민 해결 정도 (15%)
5. 상황적 적합성 (5%)

💡 리뷰 감성분석 활용 가이드:
- 감성점수가 높을수록 실제 사용자 만족도가 높음
- 리뷰 개수가 많을수록 신뢰도 증가
- 부정적 감성(negative)인 경우 점수 차감 고려

점수 범위: 0-100점 (80점 이상: 강력 추천, 60-79점: 추천, 40-59점: 보통, 40점 미만: 비추천)

반드시 JSON 형태로만 응답하세요.`;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    try {
      // JSON 파싱 및 결과 매핑
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();

      // 빈 응답 검사
      if (!cleanedResponse || cleanedResponse.length < 10) {
        console.warn('⚠️ LLM 응답이 비어있음, 폴백 처리');
        throw new Error('빈 LLM 응답');
      }

      const parsed = JSON.parse(cleanedResponse);

      return parsed.rankings.map((ranking: any) => {
        const vehicleIndex = ranking.vehicleIndex - 1;
        const vehicle = vehicles[vehicleIndex];

        if (!vehicle) {
          throw new Error(`Invalid vehicle index: ${ranking.vehicleIndex}`);
        }

        return {
          vehicle,
          score: Math.max(0, Math.min(100, ranking.score)), // 0-100 범위 보장
          reasoning: ranking.reasoning || `${vehicle.manufacturer} ${vehicle.model}은 ${persona.name}님께 적합합니다.`,
          personalizedInsights: ranking.insights || [
            `🚗 ${vehicle.manufacturer} ${vehicle.model} ${vehicle.modelyear}년식`,
            `💰 ${vehicle.price?.toLocaleString()}만원 (예산 내)`,
            `⛽ ${vehicle.fueltype} ${vehicle.cartype}`
          ]
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
}