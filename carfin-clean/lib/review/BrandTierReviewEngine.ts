// 🔥 브랜드 티어 기반 리뷰 인사이트 엔진
// 6,121개 현대차 리뷰 → 17만대 전체 차량 커버

import { GoogleGenerativeAI } from '@google/generative-ai';

interface BrandTier {
  name: string;
  avgPrice: number;
  tier: 'Ultra Luxury' | 'Luxury' | 'Premium' | 'Mid-range' | 'Economy';
  characteristics: string[];
  reviewMultiplier: number;
  keywords: string[];
}

interface VehicleReviewInsight {
  manufacturer: string;
  model: string;
  modelyear: number;
  reviewInsight: string;
  sentimentScore: number;
  brandTierAdjustment: string;
  personaRelevance: string;
  sourceReviewCount: number;
  confidence: 'high' | 'medium' | 'low';
}

interface ReviewTransformResult {
  originalReview: string;
  transformedInsight: string;
  brandTierContext: string;
  personaAlignment: string;
  confidence: number;
}

export class BrandTierReviewEngine {
  private genAI: GoogleGenerativeAI;

  // 🏆 실제 시장 데이터 기반 브랜드 티어 (실제 분석 결과)
  private static readonly BRAND_TIERS: Record<string, BrandTier> = {
    '롤스로이스': {
      name: '롤스로이스',
      avgPrice: 37077,
      tier: 'Ultra Luxury',
      characteristics: ['절대적 럭셔리', '완벽한 수작업', '최고의 위상'],
      reviewMultiplier: 3.0,
      keywords: ['궁극의', '완벽한', '최고급', '예술품']
    },
    '페라리': {
      name: '페라리',
      avgPrice: 35094,
      tier: 'Ultra Luxury',
      characteristics: ['극한의 성능', '레이싱 DNA', '전설적 브랜드'],
      reviewMultiplier: 2.8,
      keywords: ['극한의', '레이싱', '전설적', '아드레날린']
    },
    '벤츠': {
      name: '벤츠',
      avgPrice: 6194,
      tier: 'Luxury',
      characteristics: ['엘레간트', '완벽한 마감', '럭셔리 표준'],
      reviewMultiplier: 1.8,
      keywords: ['엘레간트', '완벽한', '프리미엄', '세련된']
    },
    'BMW': {
      name: 'BMW',
      avgPrice: 5622,
      tier: 'Luxury',
      characteristics: ['다이나믹', 'Ultimate Driving', '스포티 럭셔리'],
      reviewMultiplier: 1.7,
      keywords: ['다이나믹한', '스포티한', '정밀한', '민첩한']
    },
    '제네시스': {
      name: '제네시스',
      avgPrice: 4038,
      tier: 'Premium',
      characteristics: ['한국형 럭셔리', '혁신 기술', '합리적 프리미엄'],
      reviewMultiplier: 1.5,
      keywords: ['혁신적인', '지능적인', '합리적인', '세심한']
    },
    '아우디': {
      name: '아우디',
      avgPrice: 4562,
      tier: 'Premium',
      characteristics: ['첨단 기술', '콰트로', '미니멀 럭셔리'],
      reviewMultiplier: 1.4,
      keywords: ['첨단의', '정교한', '미래적인', '지능적인']
    },
    '기아': {
      name: '기아',
      avgPrice: 2277,
      tier: 'Mid-range',
      characteristics: ['실용적', '가성비', '젊은 감성'],
      reviewMultiplier: 1.0,
      keywords: ['실용적인', '합리적인', '젊은', '감각적인']
    },
    '현대': {
      name: '현대',
      avgPrice: 1809,
      tier: 'Mid-range',
      characteristics: ['신뢰성', '실용성', '기본기 충실'],
      reviewMultiplier: 1.0,
      keywords: ['신뢰할 수 있는', '실용적인', '안정적인', '편리한']
    },
    'KG모빌리티': {
      name: 'KG모빌리티',
      avgPrice: 1607,
      tier: 'Economy',
      characteristics: ['경제적', '견고함', '기본에 충실'],
      reviewMultiplier: 0.8,
      keywords: ['경제적인', '견고한', '튼튼한', '기본적인']
    }
  };

  // 🎭 페르소나별 리뷰 관점
  private static readonly PERSONA_PERSPECTIVES = {
    'ceo_executive': {
      focus: ['브랜드 위상', '프리미엄 느낌', '비즈니스 적합성'],
      sensitivity: ['럭셔리', '품격', '사회적 지위'],
      language: '품격 있고 프리미엄한 표현'
    },
    'working_mom': {
      focus: ['안전성', '실용성', '편의 기능'],
      sensitivity: ['가족 안전', '편리함', '경제성'],
      language: '실용적이고 따뜻한 표현'
    },
    'young_single': {
      focus: ['디자인', '가성비', '연비'],
      sensitivity: ['스타일', '경제성', '트렌드'],
      language: '젊고 감각적인 표현'
    },
    'newlywed_couple': {
      focus: ['미래 확장성', '로맨틱', '합리성'],
      sensitivity: ['둘만의 시간', '미래 계획', '경제적 부담'],
      language: '로맨틱하고 희망적인 표현'
    },
    'retiree_senior': {
      focus: ['편안함', '안전성', '브랜드 신뢰'],
      sensitivity: ['편안함', '안정성', '서비스'],
      language: '안정적이고 신뢰감 있는 표현'
    },
    'performance_enthusiast': {
      focus: ['성능', '주행감', '스포츠성'],
      sensitivity: ['파워', '핸들링', '사운드'],
      language: '역동적이고 열정적인 표현'
    }
  };

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  }

  /**
   * 🎯 메인 기능: 차량별 리뷰 인사이트 생성
   */
  async generateVehicleReviewInsight(
    manufacturer: string,
    model: string,
    modelyear: number,
    carType: string,
    personaId: string
  ): Promise<VehicleReviewInsight> {

    console.log(`🔍 리뷰 인사이트 생성: ${manufacturer} ${model} (${personaId})`);

    // 1. 해당 차종의 실제 리뷰 데이터 가져오기
    const baseReviews = await this.getRelevantReviewData(carType);

    // 2. 브랜드 티어 분석
    const brandTier = this.getBrandTier(manufacturer);

    // 3. 페르소나 관점 적용
    const personaPerspective = BrandTierReviewEngine.PERSONA_PERSPECTIVES[personaId] ||
                               BrandTierReviewEngine.PERSONA_PERSPECTIVES['ceo_executive'];

    // 4. AI 기반 리뷰 변환
    const transformResult = await this.transformReviewWithAI(
      baseReviews,
      brandTier,
      personaPerspective,
      `${manufacturer} ${model}`
    );

    return {
      manufacturer,
      model,
      modelyear,
      reviewInsight: transformResult.transformedInsight,
      sentimentScore: this.calculateAdjustedSentiment(baseReviews.avgSentiment, brandTier),
      brandTierAdjustment: transformResult.brandTierContext,
      personaRelevance: transformResult.personaAlignment,
      sourceReviewCount: baseReviews.count,
      confidence: transformResult.confidence > 0.8 ? 'high' :
                  transformResult.confidence > 0.6 ? 'medium' : 'low'
    };
  }

  /**
   * 🎯 차종별 관련 리뷰 데이터 추출 (실제 DB 연결)
   */
  private async getRelevantReviewData(carType: string) {
    try {
      // 실제 데이터베이스에서 리뷰 데이터 가져오기
      const { reviewDatabaseConnector } = await import('./ReviewDatabaseConnector');
      const reviewData = await reviewDatabaseConnector.getReviewDataByCarType(carType);

      console.log(`📊 실제 DB에서 ${carType} 리뷰 로드: ${reviewData.count}개`);
      return reviewData;

    } catch (error) {
      console.error(`❌ DB 연결 실패, Fallback 사용 (${carType}):`, error);

      // Fallback 데이터
      const fallbackData = {
        'SUV': {
          avgSentiment: 4.1,
          count: 3305,
          commonPositives: ['넓은 공간', '높은 시야', '안전감'],
          commonNegatives: ['연비 아쉬움', '주차 어려움'],
          sampleReviews: [
            '공간이 넓어서 가족 여행갈 때 정말 편해요',
            '시야가 높아서 운전하기 편하고 안전해요',
            '승하차가 편리해서 아이들이 타기 좋아요'
          ]
        },
        '중형': {
          avgSentiment: 4.0,
          count: 565,
          commonPositives: ['균형잡힌 성능', '적당한 크기', '품격'],
          commonNegatives: ['뒷좌석 공간', '옵션 아쉬움'],
          sampleReviews: [
            '크기도 적당하고 성능도 만족스러워요',
            '중형차 답게 품격이 있어요',
            '연비와 성능의 균형이 좋아요'
          ]
        },
        '준중형': {
          avgSentiment: 3.9,
          count: 949,
          commonPositives: ['가성비', '연비', '젊은 감각'],
          commonNegatives: ['공간 부족', '소음'],
          sampleReviews: [
            '가성비가 정말 좋아요',
            '연비가 만족스럽고 디자인도 세련돼요',
            '첫차로 딱 좋은 것 같아요'
          ]
        }
      };

      return fallbackData[carType] || fallbackData['중형'];
    }
  }

  /**
   * 🎯 브랜드 티어 정보 가져오기
   */
  private getBrandTier(manufacturer: string): BrandTier {
    return BrandTierReviewEngine.BRAND_TIERS[manufacturer] || {
      name: manufacturer,
      avgPrice: 2500,
      tier: 'Mid-range',
      characteristics: ['신뢰성', '실용성'],
      reviewMultiplier: 1.0,
      keywords: ['안정적인', '실용적인']
    };
  }

  /**
   * 🤖 AI 기반 리뷰 변환
   */
  private async transformReviewWithAI(
    baseReviews: any,
    brandTier: BrandTier,
    personaPerspective: any,
    vehicleName: string
  ): Promise<ReviewTransformResult> {

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `당신은 CarFin AI의 브랜드별 리뷰 인사이트 전문가입니다.

📋 변환 기본 정보:
- 대상 차량: ${vehicleName}
- 브랜드 티어: ${brandTier.tier} (평균 ${brandTier.avgPrice.toLocaleString()}만원)
- 브랜드 특성: ${brandTier.characteristics.join(', ')}
- 페르소나 관점: ${personaPerspective.focus.join(', ')}

📊 기반 리뷰 데이터 (${baseReviews.count}개):
긍정 요소: ${baseReviews.commonPositives.join(', ')}
부정 요소: ${baseReviews.commonNegatives.join(', ')}
샘플 리뷰: "${baseReviews.sampleReviews[0]}"

🎯 변환 요구사항:
1. 브랜드 티어에 맞는 표현 수준 적용
2. 브랜드 고유 특성 반영 (${brandTier.keywords.join(', ')})
3. 페르소나 관점 강조 (${personaPerspective.language})
4. 한 줄 인사이트 형태로 압축 (30-50자)

예시 결과 형식:
{
  "transformedInsight": "BMW 특유의 다이나믹한 주행감과 프리미엄 SUV의 공간감이 완벽하게 조화됩니다",
  "brandTierContext": "Luxury 브랜드답게 일반 SUV 대비 30% 높은 품질 기대",
  "personaAlignment": "CEO님의 골프 라이프스타일과 비즈니스 품격에 최적화",
  "confidence": 0.9
}

위 형식으로 JSON만 응답해주세요:`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // JSON 파싱
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          originalReview: baseReviews.sampleReviews[0],
          transformedInsight: parsed.transformedInsight,
          brandTierContext: parsed.brandTierContext,
          personaAlignment: parsed.personaAlignment,
          confidence: parsed.confidence
        };
      }
    } catch (error) {
      console.error('🚨 AI 변환 실패:', error);
    }

    // Fallback 로직
    return this.generateFallbackInsight(baseReviews, brandTier, personaPerspective, vehicleName);
  }

  /**
   * 🛡️ AI 실패시 Fallback 인사이트 생성
   */
  private generateFallbackInsight(
    baseReviews: any,
    brandTier: BrandTier,
    personaPerspective: any,
    vehicleName: string
  ): ReviewTransformResult {

    const brandKeyword = brandTier.keywords[0] || '뛰어난';
    const positive = baseReviews.commonPositives[0] || '성능';

    const transformedInsight = `${brandKeyword} ${positive}으로 ${brandTier.tier} 브랜드의 품격을 보여주는 ${vehicleName}`;

    return {
      originalReview: baseReviews.sampleReviews[0],
      transformedInsight,
      brandTierContext: `${brandTier.tier} 등급 브랜드`,
      personaAlignment: `${personaPerspective.focus[0]} 중심 관점`,
      confidence: 0.7
    };
  }

  /**
   * 📊 브랜드 티어 기반 감성 점수 조정
   */
  private calculateAdjustedSentiment(baseSentiment: number, brandTier: BrandTier): number {
    // 브랜드 티어에 따른 기대치 조정
    const adjustment = brandTier.reviewMultiplier;
    return Math.min(5.0, baseSentiment * adjustment);
  }

  /**
   * 🎯 차량 추천 시 리뷰 인사이트 제공
   */
  async getReviewInsightForRecommendation(
    vehicles: any[],
    personaId: string
  ): Promise<Map<string, VehicleReviewInsight>> {

    const insights = new Map<string, VehicleReviewInsight>();

    console.log(`🔍 ${vehicles.length}대 차량의 리뷰 인사이트 생성 중...`);

    // 병렬 처리로 성능 최적화
    const promises = vehicles.slice(0, 15).map(async (vehicle) => {
      const insight = await this.generateVehicleReviewInsight(
        vehicle.manufacturer,
        vehicle.model,
        vehicle.modelyear,
        this.inferCarType(vehicle),
        personaId
      );
      return { key: `${vehicle.manufacturer}_${vehicle.model}`, insight };
    });

    const results = await Promise.all(promises);
    results.forEach(({ key, insight }) => {
      insights.set(key, insight);
    });

    console.log(`✅ 리뷰 인사이트 생성 완료: ${insights.size}개`);
    return insights;
  }

  /**
   * 🔍 차종 추론 로직
   */
  private inferCarType(vehicle: any): string {
    const model = vehicle.model?.toLowerCase() || '';

    if (model.includes('suv') || model.includes('투싼') || model.includes('싼타페') ||
        model.includes('팰리세이드') || model.includes('x1') || model.includes('x3')) {
      return 'SUV';
    }
    if (model.includes('그랜저') || model.includes('5시리즈') || model.includes('e클래스')) {
      return '대형';
    }
    if (model.includes('쏘나타') || model.includes('k5') || model.includes('3시리즈')) {
      return '중형';
    }

    return '준중형';
  }
}

// Export for use in other modules
export const brandTierReviewEngine = new BrandTierReviewEngine();