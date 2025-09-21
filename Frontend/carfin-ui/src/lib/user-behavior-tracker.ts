'use client';

// 사용자 행동 패턴 추적 및 AI 학습 시스템

export interface UserInteraction {
  id: string;
  userId: string;
  timestamp: Date;
  action: 'view' | 'like' | 'dislike' | 'click' | 'scroll' | 'filter' | 'search' | 'save' | 'share';
  vehicleId?: number;
  vehicle?: VehicleDetails;
  context: {
    page: string;
    section: string;
    position: number;
    scrollDepth?: number;
    timeSpent?: number;
    sessionId: string;
  };
  metadata?: Record<string, any>;
}

export interface VehicleDetails {
  id: number;
  manufacturer: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  transmission: string;
  distance: number;
  color: string;
  bodyType: string;
  engineSize?: number;
  features: string[];
  location: string;
  condition: string;
  images: string[];
}

export interface UserPreferenceProfile {
  userId: string;
  demographics: {
    ageGroup?: string;
    gender?: string;
    location?: string;
    income?: string;
  };
  preferences: {
    brands: string[];
    priceRange: { min: number; max: number };
    fuelTypes: string[];
    bodyTypes: string[];
    colors: string[];
    transmissions: string[];
    features: string[];
    ageRange: { min: number; max: number };
    mileageRange: { min: number; max: number };
  };
  behaviorPatterns: {
    viewingTime: { average: number; pattern: string };
    clickFrequency: number;
    searchPatterns: string[];
    filterUsage: Record<string, number>;
    sessionDuration: { average: number };
    returnFrequency: string;
  };
  learningWeights: {
    brandImportance: number;
    priceImportance: number;
    ageImportance: number;
    mileageImportance: number;
    featureImportance: number;
    colorImportance: number;
    locationImportance: number;
  };
  updatedAt: Date;
}

class UserBehaviorTracker {
  private interactions: UserInteraction[] = [];
  private sessionId: string;
  private currentPage: string = '';
  private sessionStartTime: Date;
  private pageStartTime: Date;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    this.pageStartTime = new Date();
    this.loadStoredInteractions();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadStoredInteractions(): void {
    try {
      const stored = localStorage.getItem('userInteractions');
      if (stored) {
        this.interactions = JSON.parse(stored).map((i: any) => ({
          ...i,
          timestamp: new Date(i.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load stored interactions:', error);
    }
  }

  private saveInteractions(): void {
    try {
      // 최근 1000개 인터랙션만 저장 (성능 최적화)
      const recentInteractions = this.interactions.slice(-1000);
      localStorage.setItem('userInteractions', JSON.stringify(recentInteractions));
    } catch (error) {
      console.warn('Failed to save interactions:', error);
    }
  }

  setPage(page: string): void {
    this.currentPage = page;
    this.pageStartTime = new Date();
  }

  trackInteraction(
    action: UserInteraction['action'],
    userId: string,
    options: {
      vehicleId?: number;
      vehicle?: VehicleDetails;
      section?: string;
      position?: number;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const interaction: UserInteraction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: new Date(),
      action,
      vehicleId: options.vehicleId,
      vehicle: options.vehicle,
      context: {
        page: this.currentPage,
        section: options.section || 'unknown',
        position: options.position || 0,
        sessionId: this.sessionId,
        timeSpent: Date.now() - this.pageStartTime.getTime()
      },
      metadata: options.metadata
    };

    this.interactions.push(interaction);
    this.saveInteractions();

    // 실시간 AI 학습 트리거
    this.triggerLearning(interaction);
  }

  private triggerLearning(interaction: UserInteraction): void {
    // 백그라운드에서 AI 학습 로직 실행
    requestIdleCallback(() => {
      this.updateUserProfile(interaction);
    });
  }

  private updateUserProfile(interaction: UserInteraction): void {
    try {
      const profile = this.getUserProfile(interaction.userId);

      // 차량 관련 인터랙션일 때만 학습
      if (interaction.vehicle && ['like', 'view', 'click', 'save'].includes(interaction.action)) {
        this.learnFromVehicleInteraction(profile, interaction);
      }

      // 행동 패턴 업데이트
      this.updateBehaviorPatterns(profile, interaction);

      // 프로필 저장
      this.saveUserProfile(profile);
    } catch (error) {
      console.warn('Failed to update user profile:', error);
    }
  }

  private learnFromVehicleInteraction(profile: UserPreferenceProfile, interaction: UserInteraction): void {
    const vehicle = interaction.vehicle!;
    const weight = this.getActionWeight(interaction.action);

    // 브랜드 선호도 학습
    if (!profile.preferences.brands.includes(vehicle.manufacturer)) {
      profile.preferences.brands.push(vehicle.manufacturer);
    }

    // 가격 범위 조정
    this.adjustPriceRange(profile, vehicle.price, weight);

    // 연료 타입 학습
    if (!profile.preferences.fuelTypes.includes(vehicle.fuelType)) {
      profile.preferences.fuelTypes.push(vehicle.fuelType);
    }

    // 차체 타입 학습
    if (!profile.preferences.bodyTypes.includes(vehicle.bodyType)) {
      profile.preferences.bodyTypes.push(vehicle.bodyType);
    }

    // 색상 선호도
    if (vehicle.color && !profile.preferences.colors.includes(vehicle.color)) {
      profile.preferences.colors.push(vehicle.color);
    }

    // 변속기 타입
    if (!profile.preferences.transmissions.includes(vehicle.transmission)) {
      profile.preferences.transmissions.push(vehicle.transmission);
    }

    // 특징/옵션 학습
    vehicle.features.forEach(feature => {
      if (!profile.preferences.features.includes(feature)) {
        profile.preferences.features.push(feature);
      }
    });

    // 연식 범위 조정
    this.adjustAgeRange(profile, vehicle.year, weight);

    // 주행거리 범위 조정
    this.adjustMileageRange(profile, vehicle.distance, weight);

    // 학습 가중치 업데이트 (사용자가 어떤 요소를 중요하게 생각하는지)
    this.updateLearningWeights(profile, vehicle, interaction.action);
  }

  private getActionWeight(action: string): number {
    const weights = {
      'like': 1.0,
      'save': 0.9,
      'click': 0.7,
      'view': 0.3,
      'dislike': -0.5
    };
    return weights[action] || 0.1;
  }

  private adjustPriceRange(profile: UserPreferenceProfile, price: number, weight: number): void {
    const currentMin = profile.preferences.priceRange.min;
    const currentMax = profile.preferences.priceRange.max;

    if (weight > 0) {
      // 긍정적 반응일 때 범위 확장
      if (price < currentMin || currentMin === 0) {
        profile.preferences.priceRange.min = Math.max(0, price * 0.8);
      }
      if (price > currentMax) {
        profile.preferences.priceRange.max = price * 1.2;
      }
    }
  }

  private adjustAgeRange(profile: UserPreferenceProfile, year: number, weight: number): void {
    if (weight > 0) {
      const age = new Date().getFullYear() - year;
      if (age < profile.preferences.ageRange.min || profile.preferences.ageRange.min === 0) {
        profile.preferences.ageRange.min = Math.max(0, age - 2);
      }
      if (age > profile.preferences.ageRange.max || profile.preferences.ageRange.max === 0) {
        profile.preferences.ageRange.max = age + 3;
      }
    }
  }

  private adjustMileageRange(profile: UserPreferenceProfile, distance: number, weight: number): void {
    if (weight > 0) {
      if (distance < profile.preferences.mileageRange.min || profile.preferences.mileageRange.min === 0) {
        profile.preferences.mileageRange.min = 0;
      }
      if (distance > profile.preferences.mileageRange.max || profile.preferences.mileageRange.max === 0) {
        profile.preferences.mileageRange.max = distance * 1.5;
      }
    }
  }

  private updateLearningWeights(profile: UserPreferenceProfile, vehicle: VehicleDetails, action: string): void {
    const increment = this.getActionWeight(action) * 0.1;

    // 사용자가 반응한 차량의 특성에 따라 가중치 조정
    profile.learningWeights.brandImportance += increment;
    profile.learningWeights.priceImportance += increment;

    if (vehicle.year) profile.learningWeights.ageImportance += increment;
    if (vehicle.distance) profile.learningWeights.mileageImportance += increment;
    if (vehicle.features.length > 0) profile.learningWeights.featureImportance += increment;
    if (vehicle.color) profile.learningWeights.colorImportance += increment;
    if (vehicle.location) profile.learningWeights.locationImportance += increment;

    // 가중치 정규화 (0-1 범위)
    const weights = profile.learningWeights;
    const maxWeight = Math.max(...Object.values(weights));
    if (maxWeight > 0) {
      Object.keys(weights).forEach(key => {
        weights[key] = Math.min(1, weights[key] / maxWeight);
      });
    }
  }

  private updateBehaviorPatterns(profile: UserPreferenceProfile, interaction: UserInteraction): void {
    // 평균 페이지 체류 시간 업데이트
    if (interaction.context.timeSpent) {
      const currentAvg = profile.behaviorPatterns.viewingTime.average;
      profile.behaviorPatterns.viewingTime.average =
        (currentAvg + interaction.context.timeSpent) / 2;
    }

    // 클릭 빈도 업데이트
    if (interaction.action === 'click') {
      profile.behaviorPatterns.clickFrequency += 1;
    }

    // 필터 사용 패턴 업데이트
    if (interaction.action === 'filter' && interaction.metadata?.filterType) {
      const filterType = interaction.metadata.filterType;
      profile.behaviorPatterns.filterUsage[filterType] =
        (profile.behaviorPatterns.filterUsage[filterType] || 0) + 1;
    }
  }

  getUserProfile(userId: string): UserPreferenceProfile {
    try {
      const stored = localStorage.getItem(`userProfile_${userId}`);
      if (stored) {
        const profile = JSON.parse(stored);
        profile.updatedAt = new Date(profile.updatedAt);
        return profile;
      }
    } catch (error) {
      console.warn('Failed to load user profile:', error);
    }

    // 기본 프로필 생성
    return {
      userId,
      demographics: {},
      preferences: {
        brands: [],
        priceRange: { min: 0, max: 0 },
        fuelTypes: [],
        bodyTypes: [],
        colors: [],
        transmissions: [],
        features: [],
        ageRange: { min: 0, max: 0 },
        mileageRange: { min: 0, max: 0 }
      },
      behaviorPatterns: {
        viewingTime: { average: 0, pattern: 'unknown' },
        clickFrequency: 0,
        searchPatterns: [],
        filterUsage: {},
        sessionDuration: { average: 0 },
        returnFrequency: 'unknown'
      },
      learningWeights: {
        brandImportance: 0.2,
        priceImportance: 0.3,
        ageImportance: 0.15,
        mileageImportance: 0.15,
        featureImportance: 0.1,
        colorImportance: 0.05,
        locationImportance: 0.05
      },
      updatedAt: new Date()
    };
  }

  private saveUserProfile(profile: UserPreferenceProfile): void {
    try {
      profile.updatedAt = new Date();
      localStorage.setItem(`userProfile_${profile.userId}`, JSON.stringify(profile));
    } catch (error) {
      console.warn('Failed to save user profile:', error);
    }
  }

  // 개인화된 추천을 위한 점수 계산
  calculatePersonalizedScore(vehicle: VehicleDetails, userId: string): number {
    const profile = this.getUserProfile(userId);
    let score = 0;

    // 브랜드 매칭
    if (profile.preferences.brands.includes(vehicle.manufacturer)) {
      score += 20 * profile.learningWeights.brandImportance;
    }

    // 가격 범위 매칭
    const priceRange = profile.preferences.priceRange;
    if (priceRange.min > 0 && priceRange.max > 0) {
      if (vehicle.price >= priceRange.min && vehicle.price <= priceRange.max) {
        score += 25 * profile.learningWeights.priceImportance;
      } else {
        const deviation = Math.min(
          Math.abs(vehicle.price - priceRange.min),
          Math.abs(vehicle.price - priceRange.max)
        ) / ((priceRange.max - priceRange.min) || 1);
        score += Math.max(0, 25 - deviation * 10) * profile.learningWeights.priceImportance;
      }
    }

    // 연식 매칭
    const vehicleAge = new Date().getFullYear() - vehicle.year;
    const ageRange = profile.preferences.ageRange;
    if (ageRange.min > 0 && ageRange.max > 0) {
      if (vehicleAge >= ageRange.min && vehicleAge <= ageRange.max) {
        score += 15 * profile.learningWeights.ageImportance;
      }
    }

    // 주행거리 매칭
    const mileageRange = profile.preferences.mileageRange;
    if (mileageRange.max > 0) {
      if (vehicle.distance <= mileageRange.max) {
        score += 15 * profile.learningWeights.mileageImportance;
      }
    }

    // 연료 타입 매칭
    if (profile.preferences.fuelTypes.includes(vehicle.fuelType)) {
      score += 10;
    }

    // 특징/옵션 매칭
    const matchingFeatures = vehicle.features.filter(feature =>
      profile.preferences.features.includes(feature)
    );
    score += matchingFeatures.length * 2 * profile.learningWeights.featureImportance;

    // 색상 매칭
    if (vehicle.color && profile.preferences.colors.includes(vehicle.color)) {
      score += 5 * profile.learningWeights.colorImportance;
    }

    return Math.min(100, Math.max(0, score));
  }

  // 사용자 취향 분석 리포트 생성
  generateInsights(userId: string): any {
    const profile = this.getUserProfile(userId);
    const userInteractions = this.interactions.filter(i => i.userId === userId);

    return {
      profile,
      insights: {
        mostViewedBrands: this.getMostFrequent(userInteractions, 'vehicle.manufacturer'),
        preferredPriceRange: profile.preferences.priceRange,
        averageSessionTime: profile.behaviorPatterns.viewingTime.average,
        engagementLevel: this.calculateEngagementLevel(userInteractions),
        learningProgress: this.calculateLearningProgress(profile),
        recommendations: this.getPersonalizedRecommendations(userId)
      }
    };
  }

  private getMostFrequent(interactions: UserInteraction[], path: string): any[] {
    const counts = {};
    interactions.forEach(interaction => {
      const value = this.getNestedProperty(interaction, path);
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([key, count]) => ({ name: key, count }));
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private calculateEngagementLevel(interactions: UserInteraction[]): string {
    const totalInteractions = interactions.length;
    const positiveActions = interactions.filter(i =>
      ['like', 'save', 'click'].includes(i.action)
    ).length;

    const engagementRatio = totalInteractions > 0 ? positiveActions / totalInteractions : 0;

    if (engagementRatio > 0.7) return 'High';
    if (engagementRatio > 0.4) return 'Medium';
    return 'Low';
  }

  private calculateLearningProgress(profile: UserPreferenceProfile): number {
    const weights = Object.values(profile.learningWeights);
    const totalWeights = weights.reduce((sum, weight) => sum + weight, 0);
    const maxPossibleWeight = weights.length;

    return Math.round((totalWeights / maxPossibleWeight) * 100);
  }

  private getPersonalizedRecommendations(userId: string): string[] {
    const profile = this.getUserProfile(userId);
    const recommendations = [];

    if (profile.preferences.brands.length > 0) {
      recommendations.push(`브랜드 선호도가 높은 ${profile.preferences.brands.slice(0, 2).join(', ')} 차량을 더 추천드리겠습니다.`);
    }

    if (profile.preferences.priceRange.max > 0) {
      recommendations.push(`${(profile.preferences.priceRange.min/10000).toFixed(0)}-${(profile.preferences.priceRange.max/10000).toFixed(0)}만원 범위의 차량을 선호하시는군요.`);
    }

    if (profile.preferences.features.length > 0) {
      recommendations.push(`${profile.preferences.features.slice(0, 3).join(', ')} 기능이 있는 차량을 찾아드리겠습니다.`);
    }

    return recommendations;
  }

  // 세션 종료 시 호출
  endSession(): void {
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();
    // 세션 통계 저장
    try {
      const sessionStats = {
        sessionId: this.sessionId,
        duration: sessionDuration,
        interactions: this.interactions.filter(i => i.context.sessionId === this.sessionId).length,
        endTime: new Date()
      };

      const existingSessions = JSON.parse(localStorage.getItem('userSessions') || '[]');
      existingSessions.push(sessionStats);

      // 최근 50개 세션만 저장
      localStorage.setItem('userSessions', JSON.stringify(existingSessions.slice(-50)));
    } catch (error) {
      console.warn('Failed to save session stats:', error);
    }
  }
}

// 싱글톤 인스턴스
export const userBehaviorTracker = new UserBehaviorTracker();

// 페이지 변경 감지
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    userBehaviorTracker.endSession();
  });
}