// ReviewSentimentAnalyzer.ts - LLM 기반 리뷰 감성분석 시스템
// 실제 차량 리뷰 데이터를 분석하여 추천에 반영

import { GoogleGenerativeAI } from '@google/generative-ai';

interface VehicleReview {
  reviewId?: string;
  manufacturer: string;
  model: string;
  modelyear: number;
  reviewText: string;
  rating?: number;
  reviewDate?: Date;
  userId?: string;
}

interface SentimentAnalysisResult {
  vehicle: {
    manufacturer: string;
    model: string;
    modelyear: number;
  };
  overallSentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -100 to 100
  aspectSentiments: {
    performance: number;
    comfort: number;
    fuelEconomy: number;
    reliability: number;
    design: number;
    value: number;
  };
  keyPositives: string[];
  keyNegatives: string[];
  recommendationAdjustment: number; // -20 to +20 점수 조정
  summary: string;
  reviewCount: number;
  confidenceLevel: 'high' | 'medium' | 'low';
}

interface PersonaReviewPreference {
  priorityAspects: string[];
  sentimentWeight: number; // 감성 분석 가중치 (0.1 ~ 1.0)
  negativeImpactSensitivity: number; // 부정적 리뷰 민감도
}

export class ReviewSentimentAnalyzer {
  private genAI: GoogleGenerativeAI;
  private reviewCache: Map<string, SentimentAnalysisResult> = new Map();

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * 차량별 리뷰 감성분석 수행
   */
  async analyzeVehicleReviews(
    vehicles: any[],
    personaId?: string
  ): Promise<Map<string, SentimentAnalysisResult>> {
    console.log(`🔍 리뷰 감성분석 시작: ${vehicles.length}대 차량`);

    const results = new Map<string, SentimentAnalysisResult>();

    // 차량별로 배치 처리 (5대씩)
    const batchSize = 5;
    for (let i = 0; i < vehicles.length; i += batchSize) {
      const batch = vehicles.slice(i, i + batchSize);

      try {
        const batchResults = await this.processBatch(batch, personaId);
        batchResults.forEach((result, key) => {
          results.set(key, result);
        });
      } catch (error) {
        console.error(`🚨 배치 ${Math.floor(i/batchSize) + 1} 감성분석 실패:`, error);

        // 폴백: 기본 감성 점수 적용
        batch.forEach(vehicle => {
          const key = `${vehicle.manufacturer}_${vehicle.model}_${vehicle.modelyear}`;
          results.set(key, this.generateFallbackSentiment(vehicle));
        });
      }
    }

    console.log(`✅ 리뷰 감성분석 완료: ${results.size}대 처리됨`);
    return results;
  }

  /**
   * 배치 단위 감성분석 처리
   */
  private async processBatch(
    vehicles: any[],
    personaId?: string
  ): Promise<Map<string, SentimentAnalysisResult>> {

    // 실제 리뷰 데이터 시뮬레이션 (실제 구현시에는 DB에서 가져옴)
    const mockReviews = this.generateMockReviews(vehicles);

    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 3000,
      }
    });

    const vehicleList = vehicles.map((v, idx) =>
      `${idx + 1}. ${v.manufacturer} ${v.model} ${v.modelyear}년`
    ).join('\n');

    const reviewData = mockReviews.map(review =>
      `[${review.manufacturer} ${review.model}] "${review.reviewText}" (${review.rating}/5)`
    ).join('\n');

    const prompt = `당신은 CarFin AI의 리뷰 감성분석 전문가입니다. 다음 차량들의 사용자 리뷰를 분석하여 감성점수를 매겨주세요.

🚗 분석 대상 차량:
${vehicleList}

📝 실제 사용자 리뷰:
${reviewData}

${personaId ? `🎭 분석 관점: ${this.getPersonaReviewFocus(personaId)}` : ''}

각 차량에 대해 다음 JSON 형태로 감성분석 결과를 제공해주세요:

{
  "sentimentAnalysis": [
    {
      "vehicleIndex": 1,
      "overallSentiment": "positive",
      "sentimentScore": 75,
      "aspectScores": {
        "performance": 80,
        "comfort": 70,
        "fuelEconomy": 85,
        "reliability": 75,
        "design": 80,
        "value": 70
      },
      "keyPositives": ["연비가 정말 좋아요", "디자인이 세련돼요"],
      "keyNegatives": ["소음이 조금 있어요"],
      "recommendationAdjustment": 8,
      "summary": "전반적으로 만족도가 높은 차량",
      "reviewCount": 15,
      "confidenceLevel": "high"
    }
  ]
}

분석 기준:
1. 감성점수: -100(매우부정) ~ +100(매우긍정)
2. 측면별 점수: 0~100점
3. 추천조정: -20~+20점 (기존 추천점수에 가감)
4. 신뢰도: high(10+ 리뷰), medium(5-9), low(1-4)

반드시 유효한 JSON 형태로만 응답하세요.`;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    try {
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();

      // 빈 응답 검사
      if (!cleanedResponse || cleanedResponse.length < 10) {
        console.warn('⚠️ 감성분석 LLM 응답이 비어있음, 폴백 처리');
        throw new Error('빈 감성분석 LLM 응답');
      }

      const parsed = JSON.parse(cleanedResponse);

      const results = new Map<string, SentimentAnalysisResult>();

      parsed.sentimentAnalysis.forEach((analysis: any) => {
        const vehicleIndex = analysis.vehicleIndex - 1;
        const vehicle = vehicles[vehicleIndex];

        if (vehicle) {
          const key = `${vehicle.manufacturer}_${vehicle.model}_${vehicle.modelyear}`;

          results.set(key, {
            vehicle: {
              manufacturer: vehicle.manufacturer,
              model: vehicle.model,
              modelyear: vehicle.modelyear
            },
            overallSentiment: analysis.overallSentiment,
            sentimentScore: this.clampScore(analysis.sentimentScore, -100, 100),
            aspectSentiments: {
              performance: this.clampScore(analysis.aspectScores?.performance || 50, 0, 100),
              comfort: this.clampScore(analysis.aspectScores?.comfort || 50, 0, 100),
              fuelEconomy: this.clampScore(analysis.aspectScores?.fuelEconomy || 50, 0, 100),
              reliability: this.clampScore(analysis.aspectScores?.reliability || 50, 0, 100),
              design: this.clampScore(analysis.aspectScores?.design || 50, 0, 100),
              value: this.clampScore(analysis.aspectScores?.value || 50, 0, 100)
            },
            keyPositives: analysis.keyPositives || [],
            keyNegatives: analysis.keyNegatives || [],
            recommendationAdjustment: this.clampScore(analysis.recommendationAdjustment || 0, -20, 20),
            summary: analysis.summary || '감성분석 완료',
            reviewCount: analysis.reviewCount || 5,
            confidenceLevel: analysis.confidenceLevel || 'medium'
          });
        }
      });

      return results;

    } catch (parseError) {
      console.error('🚨 감성분석 응답 파싱 실패:', parseError);

      // 폴백 처리
      const fallbackResults = new Map<string, SentimentAnalysisResult>();
      vehicles.forEach(vehicle => {
        const key = `${vehicle.manufacturer}_${vehicle.model}_${vehicle.modelyear}`;
        fallbackResults.set(key, this.generateFallbackSentiment(vehicle));
      });

      return fallbackResults;
    }
  }

  /**
   * 페르소나별 리뷰 분석 관점 제공
   */
  private getPersonaReviewFocus(personaId: string): string {
    const focusMap: { [key: string]: string } = {
      'ceo_executive': 'CEO 관점에서 품격, 비즈니스 활용성, 골프백 수납성을 중점적으로 분석',
      'working_mom': '워킹맘 관점에서 아이 안전성, 편의성, 가족 활용도를 중점적으로 분석',
      'mz_office_worker': 'MZ세대 관점에서 디자인, 기술, 연비, 스타일을 중점적으로 분석',
      'camping_lover': '캠핑족 관점에서 공간 활용, 내구성, 오프로드 성능을 중점적으로 분석',
      'first_car_anxiety': '첫차 구매자 관점에서 안전성, 신뢰성, 운전 편의성을 중점적으로 분석'
    };

    return focusMap[personaId] || '일반적인 관점에서 종합적으로 분석';
  }

  /**
   * 실제 리뷰 데이터 시뮬레이션 (실제 구현시에는 DB 쿼리)
   */
  private generateMockReviews(vehicles: any[]): VehicleReview[] {
    const reviewTemplates = [
      // 긍정적 리뷰
      { text: "연비가 정말 좋아요! 시내 주행 14km/L 나와요", rating: 5 },
      { text: "디자인이 세련되고 실내 공간도 넓어서 만족해요", rating: 5 },
      { text: "운전하기 편하고 안전장치도 잘 되어있어요", rating: 4 },
      { text: "가성비 최고! 이 가격에 이 정도면 충분해요", rating: 4 },
      { text: "품질이 좋고 A/S도 잘 되어있어요", rating: 5 },

      // 중립적 리뷰
      { text: "전반적으로 무난해요. 특별히 나쁘지도 좋지도 않음", rating: 3 },
      { text: "기대했던 것보다는 조금 아쉽지만 쓸만해요", rating: 3 },
      { text: "가격 생각하면 적당한 수준인 것 같아요", rating: 3 },

      // 부정적 리뷰
      { text: "소음이 좀 있어요. 고속도로에서 특히 심함", rating: 2 },
      { text: "연비가 생각보다 안 좋아요. 광고와 다름", rating: 2 },
      { text: "실내 마감이 조금 아쉬워요", rating: 2 }
    ];

    const reviews: VehicleReview[] = [];

    vehicles.forEach(vehicle => {
      // 차량당 3-7개의 리뷰 생성
      const reviewCount = Math.floor(Math.random() * 5) + 3;

      for (let i = 0; i < reviewCount; i++) {
        const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
        reviews.push({
          manufacturer: vehicle.manufacturer,
          model: vehicle.model,
          modelyear: vehicle.modelyear,
          reviewText: template.text,
          rating: template.rating,
          reviewDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // 1년 내 랜덤
        });
      }
    });

    return reviews;
  }

  /**
   * 폴백 감성분석 결과 생성
   */
  private generateFallbackSentiment(vehicle: any): SentimentAnalysisResult {
    // 브랜드별 기본 감성 점수
    const brandSentiments: { [key: string]: number } = {
      '현대': 75, '기아': 73, '제네시스': 80, '벤츠': 85, 'BMW': 83,
      '아우디': 82, '렉서스': 88, '토요타': 85, '혼다': 82, '폴크스바겐': 75
    };

    const baseSentiment = brandSentiments[vehicle.manufacturer] || 70;
    const yearBonus = Math.max(0, (vehicle.modelyear - 2015) * 2); // 최신 연식 보너스

    return {
      vehicle: {
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        modelyear: vehicle.modelyear
      },
      overallSentiment: baseSentiment >= 75 ? 'positive' : baseSentiment >= 60 ? 'neutral' : 'negative',
      sentimentScore: Math.min(100, baseSentiment + yearBonus - 50), // -50~100 범위
      aspectSentiments: {
        performance: baseSentiment,
        comfort: baseSentiment + 5,
        fuelEconomy: baseSentiment - 5,
        reliability: baseSentiment + 10,
        design: baseSentiment,
        value: baseSentiment - 10
      },
      keyPositives: ['안정적인 브랜드', '무난한 성능'],
      keyNegatives: ['데이터 부족'],
      recommendationAdjustment: Math.round((baseSentiment - 70) / 5), // -4~+6 정도
      summary: `${vehicle.manufacturer} ${vehicle.model}에 대한 기본 감성 분석`,
      reviewCount: 3,
      confidenceLevel: 'low'
    };
  }

  /**
   * 점수 범위 제한 유틸리티
   */
  private clampScore(score: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, score));
  }

  /**
   * 감성분석 결과를 추천 점수에 반영
   */
  applySentimentToRecommendation(
    originalScore: number,
    sentiment: SentimentAnalysisResult,
    personaId?: string
  ): number {
    const personaPreferences = this.getPersonaReviewPreference(personaId || '');

    // 페르소나별 가중치 적용
    const sentimentWeight = personaPreferences.sentimentWeight;
    const adjustment = sentiment.recommendationAdjustment * sentimentWeight;

    // 부정적 리뷰에 대한 민감도 적용
    const negativeImpact = sentiment.overallSentiment === 'negative'
      ? personaPreferences.negativeImpactSensitivity * -5
      : 0;

    return Math.max(0, Math.min(100, originalScore + adjustment + negativeImpact));
  }

  /**
   * 페르소나별 리뷰 민감도 설정
   */
  private getPersonaReviewPreference(personaId: string): PersonaReviewPreference {
    const preferences: { [key: string]: PersonaReviewPreference } = {
      'ceo_executive': {
        priorityAspects: ['design', 'performance', 'value'],
        sentimentWeight: 0.7,
        negativeImpactSensitivity: 1.2 // CEO는 부정적 리뷰에 민감
      },
      'working_mom': {
        priorityAspects: ['reliability', 'comfort', 'value'],
        sentimentWeight: 0.9,
        negativeImpactSensitivity: 1.5 // 안전성 관련 부정적 리뷰에 매우 민감
      },
      'mz_office_worker': {
        priorityAspects: ['design', 'fuelEconomy', 'performance'],
        sentimentWeight: 0.8,
        negativeImpactSensitivity: 0.8 // 상대적으로 덜 민감
      },
      'first_car_anxiety': {
        priorityAspects: ['reliability', 'comfort', 'value'],
        sentimentWeight: 1.0,
        negativeImpactSensitivity: 2.0 // 첫차 구매자는 매우 민감
      }
    };

    return preferences[personaId] || {
      priorityAspects: ['performance', 'comfort', 'value'],
      sentimentWeight: 0.6,
      negativeImpactSensitivity: 1.0
    };
  }
}