// app/api/test/personalization/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { UserPreferenceAnalyzer } from '@/lib/ai/personalization/UserPreferenceAnalyzer';
import { PersonalizedRecommendationEngine } from '@/lib/ai/personalization/PersonalizedRecommendationEngine';

export async function GET(request: NextRequest) {
  console.log('🧪 개인화 추천 엔진 테스트 시작...');

  try {
    // 1. UserPreferenceAnalyzer 테스트
    const analyzer = UserPreferenceAnalyzer.getInstance();
    console.log('✅ UserPreferenceAnalyzer 인스턴스 생성 성공');

    // 테스트 대화 데이터
    const testMessages = [
      { id: '1', agent: 'user', content: '3000만원 이하로 연비 좋은 차 찾고 있어요', timestamp: new Date() },
      { id: '2', agent: 'system', content: '예산과 연비를 중시하시는군요!', timestamp: new Date() },
      { id: '3', agent: 'user', content: '안전성도 중요하고, 가족용으로 쓸 거라 공간도 넓었으면 좋겠어요', timestamp: new Date() },
      { id: '4', agent: 'user', content: '토요타나 혼다 브랜드 선호합니다', timestamp: new Date() }
    ];

    // 대화 인사이트 추출 테스트
    const conversationInsight = await analyzer.extractConversationInsights(testMessages);
    console.log('🔍 대화 인사이트 추출 결과:', {
      keywords: conversationInsight.keywords,
      sentiment: conversationInsight.sentiment,
      urgency: conversationInsight.urgency,
      decisionStage: conversationInsight.decisionStage,
      concerns: conversationInsight.concerns,
      priorities: conversationInsight.priorities
    });

    // 2. PersonalizedRecommendationEngine 테스트
    const engine = PersonalizedRecommendationEngine.getInstance();
    console.log('✅ PersonalizedRecommendationEngine 인스턴스 생성 성공');

    // 테스트 차량 데이터
    const testVehicles = [
      {
        vehicleid: 'test_1',
        manufacturer: 'toyota',
        model: 'camry',
        modelyear: 2022,
        price: 2800,
        distance: 25,
        location: '서울',
        fueltype: 'hybrid',
        displacement: 2000,
        suitabilityScore: 85,
        pros: ['높은 연비', '우수한 신뢰성'],
        cons: ['높은 가격']
      },
      {
        vehicleid: 'test_2',
        manufacturer: 'honda',
        model: 'accord',
        modelyear: 2021,
        price: 2600,
        distance: 45,
        location: '경기',
        fueltype: 'gasoline',
        displacement: 1500,
        suitabilityScore: 80,
        pros: ['좋은 가성비', '넓은 실내'],
        cons: ['보통 연비']
      },
      {
        vehicleid: 'test_3',
        manufacturer: 'bmw',
        model: '320i',
        modelyear: 2020,
        price: 3200,
        distance: 15,
        location: '서울',
        fueltype: 'gasoline',
        displacement: 2000,
        suitabilityScore: 75,
        pros: ['우수한 성능', '좋은 디자인'],
        cons: ['높은 유지비', '비싼 가격']
      }
    ];

    // 테스트 사용자 프로필 생성
    const testUserProfile = {
      userId: 'test_user_123',
      lastUpdated: new Date(),
      preferenceScores: {
        budgetSensitivity: 75,
        brandLoyalty: 60,
        fuelEfficiencyImportance: 85,
        spaceRequirement: 70,
        safetyPriority: 80,
        luxuryPreference: 30,
        technologyInterest: 50,
        reliabilityFocus: 90
      },
      detectedPatterns: {
        dominantPersona: 'working_mom',
        commonQuestionTypes: ['budget', 'fuel_efficiency', 'safety'],
        budgetRanges: [{ min: 2000, max: 3000, frequency: 3 }],
        preferredVehicleTypes: [
          { type: 'toyota', frequency: 4 },
          { type: 'honda', frequency: 2 }
        ],
        decisionFactors: [
          { factor: 'fuel_efficiency', importance: 0.85 },
          { factor: 'safety', importance: 0.80 },
          { factor: 'price', importance: 0.75 }
        ]
      },
      interactionHistory: {
        totalSessions: 5,
        totalQuestions: 12,
        averageSessionDuration: 480,
        satisfactionTrend: [85, 88, 92],
        lastInteractionDate: new Date()
      },
      personalizationSettings: {
        preferredCommunicationStyle: 'casual' as const,
        informationDetailLevel: 'detailed' as const,
        recommendationCount: 5,
        showTechnicalSpecs: true,
        prioritizeLocalDeals: false
      }
    };

    // 3. 개인화 점수 계산 테스트
    const personalizedScores = testVehicles.map(vehicle => {
      const personalizedScore = analyzer.calculatePersonalizedScore(
        vehicle,
        testUserProfile,
        conversationInsight
      );
      return {
        vehicle: `${vehicle.manufacturer} ${vehicle.model}`,
        originalScore: vehicle.suitabilityScore,
        personalizedScore,
        improvement: personalizedScore - vehicle.suitabilityScore
      };
    });

    console.log('🎯 개인화 점수 계산 결과:', personalizedScores);

    // 4. 추천 설명 생성 테스트
    const mockRecommendation = {
      vehicleId: 'test_1',
      originalScore: 85,
      personalizedScore: 95,
      scoreAdjustments: {
        preferenceBonus: 6,
        conversationBonus: 4,
        learningBonus: 0,
        personalityFit: 0
      },
      recommendationReason: '예산 효율성과 높은 신뢰성을 중시하는 고객님께 최적',
      personalizedInsights: ['예산 대비 15% 절약 가능', '연간 연료비 약 30만원 절약 예상'],
      confidenceLevel: 92
    };

    const explanation = engine.generateRecommendationExplanation(
      mockRecommendation,
      testUserProfile,
      conversationInsight
    );

    console.log('📝 추천 설명 생성 결과:', explanation);

    // 5. 학습 기능 테스트
    await engine.learnFromUserInteraction('test_user_123', 'test_1', 'like', 45);
    console.log('✅ 사용자 피드백 학습 테스트 완료');

    // 6. 성능 분석 테스트
    const performance = await engine.analyzeRecommendationPerformance('test_user_123');
    console.log('📊 추천 성능 분석 결과:', performance);

    return NextResponse.json({
      success: true,
      message: '개인화 추천 엔진 테스트 완료! 모든 기능이 정상 작동합니다.',
      results: {
        preferenceAnalyzer: 'OK',
        recommendationEngine: 'OK',
        conversationInsight: conversationInsight,
        personalizedScores: personalizedScores,
        recommendationExplanation: explanation,
        learningCapability: 'OK',
        performanceAnalysis: performance || 'OK (No historical data)'
      },
      testCoverage: {
        conversationInsightExtraction: true,
        personalizedScoring: true,
        recommendationExplanation: true,
        userFeedbackLearning: true,
        performanceAnalysis: true
      },
      insights: {
        topPreferences: [
          'reliabilityFocus (90점)',
          'fuelEfficiencyImportance (85점)',
          'safetyPriority (80점)'
        ],
        bestVehicleMatch: personalizedScores.reduce((best, current) =>
          current.personalizedScore > best.personalizedScore ? current : best
        ),
        improvementAverages: personalizedScores.reduce((sum, score) => sum + score.improvement, 0) / personalizedScores.length
      }
    });

  } catch (error) {
    console.error('❌ 개인화 엔진 테스트 실패:', error);
    return NextResponse.json({
      success: false,
      error: '개인화 엔진 테스트 중 오류 발생',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}