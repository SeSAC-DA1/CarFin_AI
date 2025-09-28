// lib/ai/personalization/UserPreferenceAnalyzer.ts
import { redis } from '@/lib/redis';
import { A2ASession, DiscoveredNeed } from '@/lib/types/session';

export interface UserPreferenceProfile {
  userId: string;
  lastUpdated: Date;

  // 📊 선호도 점수 (0-100)
  preferenceScores: {
    budgetSensitivity: number;      // 가격 민감도
    brandLoyalty: number;           // 브랜드 충성도
    fuelEfficiencyImportance: number; // 연비 중요도
    spaceRequirement: number;       // 공간 필요도
    safetyPriority: number;         // 안전성 우선도
    luxuryPreference: number;       // 럭셔리 선호도
    technologyInterest: number;     // 기술 관심도
    reliabilityFocus: number;       // 신뢰성 중시도
  };

  // 🎯 감지된 패턴들
  detectedPatterns: {
    dominantPersona: string | null;           // 가장 자주 감지되는 페르소나
    commonQuestionTypes: string[];            // 자주 묻는 질문 유형
    budgetRanges: { min: number; max: number; frequency: number }[]; // 예산 범위 패턴
    preferredVehicleTypes: { type: string; frequency: number }[];     // 선호 차종
    decisionFactors: { factor: string; importance: number }[];        // 결정 요인
  };

  // 📈 학습 데이터
  interactionHistory: {
    totalSessions: number;
    totalQuestions: number;
    averageSessionDuration: number;
    satisfactionTrend: number[];
    lastInteractionDate: Date;
  };

  // 🎨 개인화 설정
  personalizationSettings: {
    preferredCommunicationStyle: 'formal' | 'casual' | 'technical';
    informationDetailLevel: 'basic' | 'detailed' | 'expert';
    recommendationCount: number;
    showTechnicalSpecs: boolean;
    prioritizeLocalDeals: boolean;
  };
}

export interface ConversationInsight {
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
  decisionStage: 'research' | 'comparison' | 'ready_to_buy';
  concerns: string[];
  priorities: string[];
}

export class UserPreferenceAnalyzer {
  private static instance: UserPreferenceAnalyzer;

  private constructor() {}

  static getInstance(): UserPreferenceAnalyzer {
    if (!UserPreferenceAnalyzer.instance) {
      UserPreferenceAnalyzer.instance = new UserPreferenceAnalyzer();
    }
    return UserPreferenceAnalyzer.instance;
  }

  /**
   * 사용자 선호도 프로필 생성/업데이트
   */
  async analyzeUserPreferences(userId: string, sessions: A2ASession[]): Promise<UserPreferenceProfile> {
    console.log(`🧠 사용자 선호도 분석 시작: ${userId}`);

    // 기존 프로필 로드
    let profile = await this.getUserProfile(userId);

    if (!profile) {
      profile = this.createInitialProfile(userId);
    }

    // 세션 데이터 분석
    const analysisResults = await this.analyzeSessionData(sessions);

    // 프로필 업데이트
    profile = this.updateProfile(profile, analysisResults);

    // 저장
    await this.saveUserProfile(profile);

    console.log(`✅ 선호도 분석 완료: ${userId}`);
    return profile;
  }

  /**
   * 대화 내용에서 인사이트 추출
   */
  async extractConversationInsights(messages: any[]): Promise<ConversationInsight> {
    const userMessages = messages.filter(msg => msg.agent === 'user');
    const allText = userMessages.map(msg => msg.content).join(' ');

    // 키워드 추출
    const keywords = this.extractKeywords(allText);

    // 감정 분석
    const sentiment = this.analyzeSentiment(allText);

    // 긴급도 분석
    const urgency = this.analyzeUrgency(allText);

    // 결정 단계 분석
    const decisionStage = this.analyzeDecisionStage(allText);

    // 우려사항 추출
    const concerns = this.extractConcerns(allText);

    // 우선순위 추출
    const priorities = this.extractPriorities(allText);

    return {
      keywords,
      sentiment,
      urgency,
      decisionStage,
      concerns,
      priorities
    };
  }

  /**
   * 개인화된 추천 점수 계산
   */
  calculatePersonalizedScore(
    vehicle: any,
    profile: UserPreferenceProfile,
    conversationInsight: ConversationInsight
  ): number {
    let baseScore = vehicle.suitabilityScore || 80;
    let personalizedScore = baseScore;

    // 🎯 선호도 기반 점수 조정

    // 가격 민감도 조정
    if (profile.preferenceScores.budgetSensitivity > 70) {
      const priceRatio = vehicle.price / (vehicle.budget?.max || vehicle.price);
      if (priceRatio < 0.8) personalizedScore += 10; // 예산 대비 저렴하면 가산점
      if (priceRatio > 0.95) personalizedScore -= 5;  // 예산 상한에 가까우면 감점
    }

    // 연비 중요도 조정
    if (profile.preferenceScores.fuelEfficiencyImportance > 60) {
      if (vehicle.fueltype === 'hybrid' || vehicle.fueltype === 'electric') {
        personalizedScore += 8;
      }
      if (vehicle.displacement && vehicle.displacement < 1600) {
        personalizedScore += 5; // 소형 엔진 가산점
      }
    }

    // 브랜드 충성도 반영
    if (profile.preferenceScores.brandLoyalty > 50) {
      const preferredBrands = profile.detectedPatterns.preferredVehicleTypes
        .filter(t => t.frequency > 2)
        .map(t => t.type);

      if (preferredBrands.includes(vehicle.manufacturer)) {
        personalizedScore += 7;
      }
    }

    // 안전성 우선도 반영
    if (profile.preferenceScores.safetyPriority > 70) {
      const safetyBrands = ['volvo', 'subaru', 'toyota', 'lexus'];
      if (safetyBrands.includes(vehicle.manufacturer.toLowerCase())) {
        personalizedScore += 6;
      }
    }

    // 🗣️ 대화 인사이트 기반 조정

    // 긴급도가 높으면 즉시 구매 가능한 차량 우대
    if (conversationInsight.urgency === 'high') {
      if (vehicle.distance < 50) personalizedScore += 5; // 가까운 매물 우대
    }

    // 우려사항 기반 조정
    if (conversationInsight.concerns.includes('reliability')) {
      const reliableBrands = ['toyota', 'honda', 'lexus', 'mazda'];
      if (reliableBrands.includes(vehicle.manufacturer.toLowerCase())) {
        personalizedScore += 8;
      }
    }

    if (conversationInsight.concerns.includes('maintenance')) {
      const lowMaintenanceBrands = ['toyota', 'honda', 'hyundai', 'kia'];
      if (lowMaintenanceBrands.includes(vehicle.manufacturer.toLowerCase())) {
        personalizedScore += 6;
      }
    }

    // 결정 단계별 조정
    if (conversationInsight.decisionStage === 'ready_to_buy') {
      // 구매 준비 단계에서는 실용성 우선
      if (vehicle.modelyear >= new Date().getFullYear() - 3) {
        personalizedScore += 5; // 최신 연식 우대
      }
    }

    return Math.min(Math.max(personalizedScore, 0), 100);
  }

  /**
   * 사용자별 추천 개선 학습
   */
  async learnFromUserFeedback(
    userId: string,
    recommendedVehicles: any[],
    userFeedback: { vehicleId: string; action: 'liked' | 'disliked' | 'inquired' | 'ignored' }[]
  ): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return;

    console.log(`📚 사용자 피드백 학습: ${userId} (${userFeedback.length}개 피드백)`);

    // 피드백 분석하여 선호도 점수 조정
    for (const feedback of userFeedback) {
      const vehicle = recommendedVehicles.find(v => v.id === feedback.vehicleId);
      if (!vehicle) continue;

      const adjustment = this.calculatePreferenceAdjustment(vehicle, feedback.action);
      this.adjustPreferenceScores(profile, adjustment);
    }

    // 학습된 프로필 저장
    await this.saveUserProfile(profile);
    console.log(`✅ 학습 완료: ${userId}`);
  }

  // ==================== Private Methods ====================

  private createInitialProfile(userId: string): UserPreferenceProfile {
    return {
      userId,
      lastUpdated: new Date(),
      preferenceScores: {
        budgetSensitivity: 50,
        brandLoyalty: 30,
        fuelEfficiencyImportance: 50,
        spaceRequirement: 50,
        safetyPriority: 60,
        luxuryPreference: 30,
        technologyInterest: 40,
        reliabilityFocus: 70
      },
      detectedPatterns: {
        dominantPersona: null,
        commonQuestionTypes: [],
        budgetRanges: [],
        preferredVehicleTypes: [],
        decisionFactors: []
      },
      interactionHistory: {
        totalSessions: 0,
        totalQuestions: 0,
        averageSessionDuration: 0,
        satisfactionTrend: [],
        lastInteractionDate: new Date()
      },
      personalizationSettings: {
        preferredCommunicationStyle: 'casual',
        informationDetailLevel: 'detailed',
        recommendationCount: 5,
        showTechnicalSpecs: true,
        prioritizeLocalDeals: false
      }
    };
  }

  private async analyzeSessionData(sessions: A2ASession[]): Promise<any> {
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionCount, 0);
    const avgSatisfaction = sessions.reduce((sum, s) => sum + s.satisfactionLevel, 0) / sessions.length;

    // 페르소나 패턴 분석
    const personaCount: { [key: string]: number } = {};
    sessions.forEach(session => {
      if (session.metadata.personaDetected) {
        personaCount[session.metadata.personaDetected] =
          (personaCount[session.metadata.personaDetected] || 0) + 1;
      }
    });

    const dominantPersona = Object.entries(personaCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    // 예산 패턴 분석
    const budgetRanges = sessions
      .filter(s => s.metadata.budgetRange)
      .map(s => s.metadata.budgetRange)
      .reduce((acc: any[], range: any) => {
        const existing = acc.find(r => r.min === range.min && r.max === range.max);
        if (existing) {
          existing.frequency++;
        } else {
          acc.push({ ...range, frequency: 1 });
        }
        return acc;
      }, []);

    return {
      totalQuestions,
      avgSatisfaction,
      dominantPersona,
      budgetRanges,
      sessionCount: sessions.length
    };
  }

  private updateProfile(profile: UserPreferenceProfile, analysisResults: any): UserPreferenceProfile {
    // 상호작용 기록 업데이트
    profile.interactionHistory.totalSessions += analysisResults.sessionCount;
    profile.interactionHistory.totalQuestions += analysisResults.totalQuestions;
    profile.interactionHistory.satisfactionTrend.push(analysisResults.avgSatisfaction);
    profile.interactionHistory.lastInteractionDate = new Date();

    // 만족도 트렌드는 최근 10개만 유지
    if (profile.interactionHistory.satisfactionTrend.length > 10) {
      profile.interactionHistory.satisfactionTrend =
        profile.interactionHistory.satisfactionTrend.slice(-10);
    }

    // 패턴 업데이트
    if (analysisResults.dominantPersona) {
      profile.detectedPatterns.dominantPersona = analysisResults.dominantPersona;
    }

    profile.detectedPatterns.budgetRanges = analysisResults.budgetRanges;
    profile.lastUpdated = new Date();

    return profile;
  }

  private extractKeywords(text: string): string[] {
    const keywordPatterns = {
      '연비': ['연비', '기름값', '연료비', '경제성'],
      '안전': ['안전', '에어백', '안전성', '사고'],
      '공간': ['공간', '넓은', '적재', '수납', '짐'],
      '가격': ['가격', '비용', '저렴', '싸게', '예산'],
      '브랜드': ['브랜드', '제조사', '회사', '메이커'],
      '신뢰성': ['신뢰', '고장', '내구성', '오래'],
      '디자인': ['디자인', '외관', '스타일', '예쁜'],
      '성능': ['성능', '힘', '가속', '파워']
    };

    const foundKeywords: string[] = [];
    const lowerText = text.toLowerCase();

    for (const [category, patterns] of Object.entries(keywordPatterns)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        foundKeywords.push(category);
      }
    }

    return foundKeywords;
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['좋은', '만족', '괜찮', '추천', '감사'];
    const negativeWords = ['싫어', '불만', '문제', '걱정', '안좋'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private analyzeUrgency(text: string): 'low' | 'medium' | 'high' {
    const urgentWords = ['급해', '빨리', '당장', '즉시', '오늘', '내일'];
    const mediumWords = ['이번주', '빠른', '서둘러'];

    const lowerText = text.toLowerCase();

    if (urgentWords.some(word => lowerText.includes(word))) return 'high';
    if (mediumWords.some(word => lowerText.includes(word))) return 'medium';
    return 'low';
  }

  private analyzeDecisionStage(text: string): 'research' | 'comparison' | 'ready_to_buy' {
    const researchWords = ['알아보', '정보', '궁금', '어떤지'];
    const comparisonWords = ['비교', '차이', '어떤게', '대신'];
    const buyingWords = ['구매', '사고싶', '계약', '결정'];

    const lowerText = text.toLowerCase();

    if (buyingWords.some(word => lowerText.includes(word))) return 'ready_to_buy';
    if (comparisonWords.some(word => lowerText.includes(word))) return 'comparison';
    return 'research';
  }

  private extractConcerns(text: string): string[] {
    const concernPatterns = {
      'reliability': ['고장', '신뢰성', '내구성', 'A/S'],
      'maintenance': ['정비', '수리', '관리', '유지비'],
      'safety': ['안전', '사고', '위험'],
      'fuel_cost': ['기름값', '연비', '연료비'],
      'resale': ['중고', '리세일', '재판매']
    };

    const concerns: string[] = [];
    const lowerText = text.toLowerCase();

    for (const [concern, patterns] of Object.entries(concernPatterns)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        concerns.push(concern);
      }
    }

    return concerns;
  }

  private extractPriorities(text: string): string[] {
    const priorityPatterns = {
      'price': ['가격', '저렴', '싸게', '예산'],
      'fuel_efficiency': ['연비', '경제성'],
      'space': ['공간', '넓은', '적재'],
      'safety': ['안전', '안전성'],
      'brand': ['브랜드', '제조사'],
      'year': ['연식', '최신', '새로운']
    };

    const priorities: string[] = [];
    const lowerText = text.toLowerCase();

    for (const [priority, patterns] of Object.entries(priorityPatterns)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        priorities.push(priority);
      }
    }

    return priorities;
  }

  private calculatePreferenceAdjustment(vehicle: any, action: string): any {
    const adjustment: any = {};

    switch (action) {
      case 'liked':
        if (vehicle.price < 3000) adjustment.budgetSensitivity = 5;
        if (vehicle.fueltype === 'hybrid') adjustment.fuelEfficiencyImportance = 3;
        adjustment.reliabilityFocus = 2;
        break;
      case 'disliked':
        if (vehicle.price > 5000) adjustment.budgetSensitivity = 3;
        adjustment.reliabilityFocus = -1;
        break;
      case 'inquired':
        adjustment.reliabilityFocus = 1;
        break;
    }

    return adjustment;
  }

  private adjustPreferenceScores(profile: UserPreferenceProfile, adjustment: any): void {
    for (const [key, value] of Object.entries(adjustment)) {
      if (key in profile.preferenceScores) {
        const currentScore = (profile.preferenceScores as any)[key];
        (profile.preferenceScores as any)[key] = Math.min(Math.max(currentScore + value, 0), 100);
      }
    }
  }

  private async getUserProfile(userId: string): Promise<UserPreferenceProfile | null> {
    try {
      const cached = await redis.getUserPreference(`profile:${userId}`);
      return cached ? cached : null;
    } catch (error) {
      console.error('❌ 사용자 프로필 조회 실패:', error);
      return null;
    }
  }

  private async saveUserProfile(profile: UserPreferenceProfile): Promise<void> {
    try {
      await redis.cacheUserPreference(`profile:${profile.userId}`, profile);
      console.log(`💾 사용자 프로필 저장: ${profile.userId}`);
    } catch (error) {
      console.error('❌ 사용자 프로필 저장 실패:', error);
    }
  }
}