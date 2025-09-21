'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Vehicle, VehicleFeedback, UserInteraction } from '@/types';
import { userBehaviorTracker, VehicleDetails } from '@/lib/user-behavior-tracker';

interface PersonalizedLearningState {
  preferences: Record<string, number>; // 속성별 선호도 점수 (-1 ~ 1)
  patterns: {
    priceRange: [number, number];
    preferredBrands: string[];
    fuelTypePreference: Record<string, number>;
    bodyTypePreference: Record<string, number>;
    featureImportance: Record<string, number>;
  };
  sessionData: {
    viewedVehicles: string[];
    interactionCount: number;
    sessionStartTime: number;
    lastActiveTime: number;
  };
}

interface LearningMetrics {
  accuracy: number;
  confidence: number;
  improvementRate: number;
  sessionQuality: number;
}

export function usePersonalizedLearning(userId?: string) {
  const [learningState, setLearningState] = useState<PersonalizedLearningState>({
    preferences: {},
    patterns: {
      priceRange: [1000, 8000],
      preferredBrands: [],
      fuelTypePreference: {},
      bodyTypePreference: {},
      featureImportance: {},
    },
    sessionData: {
      viewedVehicles: [],
      interactionCount: 0,
      sessionStartTime: Date.now(),
      lastActiveTime: Date.now(),
    },
  });

  const [metrics, setMetrics] = useState<LearningMetrics>({
    accuracy: 0.7,
    confidence: 0.5,
    improvementRate: 0,
    sessionQuality: 0,
  });

  const feedbackHistory = useRef<VehicleFeedback[]>([]);
  const interactionBuffer = useRef<UserInteraction[]>([]);
  const learningStateRef = useRef(learningState);

  // 📊 실시간 학습 알고리즘 (행동 추적 통합)
  const updatePreferences = useCallback((vehicle: Vehicle, feedback: VehicleFeedback['feedbackType']) => {
    const feedbackScore = {
      'love': 1.0,
      'like': 0.6,
      'maybe': 0.2,
      'dislike': -0.6,
      'expensive': -0.3, // 가격 관련 피드백
    }[feedback] || 0;

    console.log('🧠 AI Learning:', {
      vehicle: `${vehicle.brand} ${vehicle.model}`,
      feedback,
      score: feedbackScore,
      price: vehicle.price,
      fuelType: vehicle.fuel_type,
    });

    // 🔥 새로운 행동 추적 시스템 통합
    const vehicleDetails: VehicleDetails = {
      id: parseInt(vehicle.id) || 0,
      manufacturer: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      price: vehicle.price || 0,
      fuelType: vehicle.fuel_type || '',
      transmission: vehicle.transmission || '자동',
      distance: vehicle.mileage || 0,
      color: vehicle.color || '',
      bodyType: vehicle.body_type || '',
      engineSize: vehicle.engine_size,
      features: vehicle.features || [],
      location: vehicle.location || '',
      condition: vehicle.condition || '매우 좋음',
      images: vehicle.images || []
    };

    // 고급 행동 추적 시스템에 피드백 전송
    userBehaviorTracker.trackInteraction(
      feedback === 'love' || feedback === 'like' ? 'like' :
      feedback === 'dislike' ? 'dislike' : 'view',
      userId || 'guest',
      {
        vehicleId: parseInt(vehicle.id) || 0,
        vehicle: vehicleDetails,
        section: 'recommendation_grid',
        metadata: {
          feedbackType: feedback,
          feedbackScore,
          sessionPhase: 'vehicle_evaluation'
        }
      }
    );

    setLearningState(prev => {
      const newState = { ...prev };

      // 1. 브랜드 선호도 학습
      const brandKey = `brand_${vehicle.brand}`;
      newState.preferences[brandKey] = (newState.preferences[brandKey] || 0) + feedbackScore * 0.3;

      // 2. 가격 범위 학습
      if (feedback === 'expensive') {
        // 비싸다고 하면 상한선을 조정
        newState.patterns.priceRange[1] = Math.min(
          newState.patterns.priceRange[1],
          vehicle.price * 0.9
        );
      } else if (feedbackScore > 0.5) {
        // 긍정적 피드백이면 가격 범위 확장
        newState.patterns.priceRange[0] = Math.min(newState.patterns.priceRange[0], vehicle.price * 0.8);
        newState.patterns.priceRange[1] = Math.max(newState.patterns.priceRange[1], vehicle.price * 1.2);
      }

      // 3. 연료 타입 선호도 학습
      const fuelKey = vehicle.fuel_type;
      newState.patterns.fuelTypePreference[fuelKey] =
        (newState.patterns.fuelTypePreference[fuelKey] || 0) + feedbackScore * 0.4;

      // 4. 차종 선호도 학습
      const bodyKey = vehicle.body_type;
      newState.patterns.bodyTypePreference[bodyKey] =
        (newState.patterns.bodyTypePreference[bodyKey] || 0) + feedbackScore * 0.4;

      // 5. 특징 중요도 학습
      (vehicle.features || []).forEach(feature => {
        newState.patterns.featureImportance[feature] =
          (newState.patterns.featureImportance[feature] || 0) + feedbackScore * 0.2;
      });

      // 6. 선호 브랜드 업데이트
      if (feedbackScore > 0.5 && !newState.patterns.preferredBrands.includes(vehicle.brand)) {
        newState.patterns.preferredBrands.push(vehicle.brand);
      } else if (feedbackScore < -0.5) {
        newState.patterns.preferredBrands = newState.patterns.preferredBrands.filter(b => b !== vehicle.brand);
      }

      // 7. 세션 데이터 업데이트
      newState.sessionData.interactionCount++;
      newState.sessionData.lastActiveTime = Date.now();
      if (!newState.sessionData.viewedVehicles.includes(vehicle.id)) {
        newState.sessionData.viewedVehicles.push(vehicle.id);
      }

      return newState;
    });

    // 피드백 히스토리 저장
    feedbackHistory.current.push({
      vehicleId: vehicle.id,
      feedbackType: feedback,
      timestamp: new Date(),
    });

    // 학습 메트릭 업데이트
    updateMetrics();
  }, []);

  // 📈 학습 메트릭 업데이트
  const updateMetrics = useCallback(() => {
    const recentFeedbacks = feedbackHistory.current.slice(-10);
    if (recentFeedbacks.length === 0) return;

    const positiveCount = recentFeedbacks.filter(f =>
      ['love', 'like'].includes(f.feedbackType)
    ).length;

    const sessionDuration = Date.now() - learningState.sessionData.sessionStartTime;
    const avgInteractionTime = sessionDuration / Math.max(learningState.sessionData.interactionCount, 1);

    setMetrics(prev => ({
      accuracy: Math.min(0.95, 0.5 + (positiveCount / recentFeedbacks.length) * 0.5),
      confidence: Math.min(0.9, 0.3 + (learningState.sessionData.interactionCount / 20) * 0.6),
      improvementRate: Math.max(0, (positiveCount - 3) / 7),
      sessionQuality: Math.min(1, (learningState.sessionData.viewedVehicles.length / 10) *
                      (avgInteractionTime > 5000 ? 1 : avgInteractionTime / 5000)),
    }));
  }, [learningState.sessionData]);

  // 🎯 개인화된 차량 점수 계산 (고급 AI 통합)
  const calculatePersonalizedScore = useCallback((vehicle: Vehicle): number => {
    const baseScore = vehicle.match_score || 70;

    // 🧠 새로운 행동 추적 시스템의 개인화 점수
    const vehicleDetails: VehicleDetails = {
      id: parseInt(vehicle.id) || 0,
      manufacturer: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      price: vehicle.price || 0,
      fuelType: vehicle.fuel_type || '',
      transmission: vehicle.transmission || '자동',
      distance: vehicle.mileage || 0,
      color: vehicle.color || '',
      bodyType: vehicle.body_type || '',
      engineSize: vehicle.engine_size,
      features: vehicle.features || [],
      location: vehicle.location || '',
      condition: vehicle.condition || '매우 좋음',
      images: vehicle.images || []
    };

    const behaviorScore = userBehaviorTracker.calculatePersonalizedScore(vehicleDetails, userId || 'guest');

    // 기존 학습 시스템 점수 계산
    let legacyScore = baseScore;

    // 브랜드 선호도 적용
    const brandScore = learningState.preferences[`brand_${vehicle.brand}`] || 0;
    legacyScore += brandScore * 15;

    // 가격 범위 적합도
    const [minPrice, maxPrice] = learningState.patterns.priceRange;
    if (vehicle.price >= minPrice && vehicle.price <= maxPrice) {
      legacyScore += 10;
    } else if (vehicle.price > maxPrice) {
      legacyScore -= Math.min(20, (vehicle.price - maxPrice) / 100);
    }

    // 연료 타입 선호도
    const fuelScore = learningState.patterns.fuelTypePreference[vehicle.fuel_type] || 0;
    legacyScore += fuelScore * 10;

    // 차종 선호도
    const bodyScore = learningState.patterns.bodyTypePreference[vehicle.body_type] || 0;
    legacyScore += bodyScore * 8;

    // 특징 중요도
    const featureScore = (vehicle.features || []).reduce((sum, feature) => {
      return sum + (learningState.patterns.featureImportance[feature] || 0);
    }, 0);
    legacyScore += featureScore * 5;

    // 🔥 하이브리드 스코어링: 신규 AI + 기존 학습 융합
    const confidenceWeight = 0.3 + (metrics.confidence * 0.7);
    const hybridScore = (behaviorScore * 0.6) + (legacyScore * 0.4);
    const finalScore = (hybridScore * confidenceWeight) + (baseScore * (1 - confidenceWeight));

    console.log('🎯 Hybrid AI Scoring:', {
      vehicle: `${vehicle.brand} ${vehicle.model}`,
      behaviorScore: Math.round(behaviorScore),
      legacyScore: Math.round(legacyScore),
      hybridScore: Math.round(hybridScore),
      finalScore: Math.round(finalScore),
      confidence: Math.round(metrics.confidence * 100) + '%'
    });

    return Math.min(Math.max(Math.round(finalScore), 50), 98);
  }, [learningState, metrics.confidence, userId]);

  // 📱 사용자 인터랙션 추적
  const trackInteraction = useCallback((interaction: Omit<UserInteraction, 'id' | 'timestamp'>) => {
    const fullInteraction: UserInteraction = {
      ...interaction,
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    interactionBuffer.current.push(fullInteraction);

    // 버퍼가 10개 이상이면 일괄 처리
    if (interactionBuffer.current.length >= 10) {
      processInteractionBatch();
    }
  }, []);

  // 배치 처리로 성능 최적화
  const processInteractionBatch = useCallback(() => {
    const interactions = interactionBuffer.current.splice(0);

    // 비동기로 백엔드에 전송 (여기서는 로컬 저장소)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('carfin_interactions') || '[]';
      const existingInteractions = JSON.parse(stored);
      localStorage.setItem('carfin_interactions',
        JSON.stringify([...existingInteractions, ...interactions])
      );
    }

    console.log('📊 Batch processed:', interactions.length, 'interactions');
  }, []);

  // 🔄 학습 상태 초기화 (세션 시작시)
  const initializeLearning = useCallback(() => {
    if (typeof window !== 'undefined') {
      const storedState = localStorage.getItem(`carfin_learning_${userId || 'guest'}`);
      if (storedState) {
        try {
          const parsedState = JSON.parse(storedState);
          setLearningState({
            ...parsedState,
            sessionData: {
              ...parsedState.sessionData,
              sessionStartTime: Date.now(),
              lastActiveTime: Date.now(),
            },
          });
        } catch (error) {
          console.warn('Failed to load learning state:', error);
        }
      }
    }
  }, [userId]);

  // 💾 학습 상태 저장 (세션 종료시)
  const saveLearningState = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`carfin_learning_${userId || 'guest'}`,
        JSON.stringify(learningState)
      );

      // 남은 인터랙션 처리
      if (interactionBuffer.current.length > 0) {
        processInteractionBatch();
      }
    }
  }, [learningState, userId, processInteractionBatch]);

  // 🎨 학습 상태 시각화용 데이터
  const getLearningInsights = useCallback(() => {
    const topBrands = Object.entries(learningState.patterns.fuelTypePreference)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([fuel, score]) => ({ fuel, score: Math.round(score * 100) }));

    const topFeatures = Object.entries(learningState.patterns.featureImportance)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([feature, score]) => ({ feature, score: Math.round(score * 100) }));

    return {
      metrics,
      preferences: {
        priceRange: learningState.patterns.priceRange,
        topFuelTypes: topBrands,
        topFeatures,
        preferredBrands: learningState.patterns.preferredBrands,
      },
      sessionStats: {
        viewedCount: learningState.sessionData.viewedVehicles.length,
        interactionCount: learningState.sessionData.interactionCount,
        sessionDuration: Date.now() - learningState.sessionData.sessionStartTime,
      },
    };
  }, [learningState, metrics]);

  // 컴포넌트 마운트시 초기화 (한 번만 실행)
  useEffect(() => {
    let mounted = true;

    const initialize = () => {
      if (!mounted) return;

      if (typeof window !== 'undefined') {
        const storedState = localStorage.getItem(`carfin_learning_${userId || 'guest'}`);
        if (storedState) {
          try {
            const parsedState = JSON.parse(storedState);
            setLearningState({
              ...parsedState,
              sessionData: {
                ...parsedState.sessionData,
                sessionStartTime: Date.now(),
                lastActiveTime: Date.now(),
              },
            });
          } catch (error) {
            console.warn('Failed to load learning state:', error);
          }
        }
      }
    };

    initialize();

    // 페이지 종료시 저장
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`carfin_learning_${userId || 'guest'}`,
          JSON.stringify(learningStateRef.current)
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // 마지막 저장
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  // learningState 변경 시 ref 업데이트
  useEffect(() => {
    learningStateRef.current = learningState;
  }, [learningState]);

  // 30초마다 자동 저장 (throttled)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`carfin_learning_${userId || 'guest'}`,
            JSON.stringify(learningStateRef.current)
          );
          console.log('🔄 Auto-saved learning state');
        } catch (error) {
          console.warn('Failed to auto-save learning state:', error);
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return {
    // 상태
    learningState,
    metrics,

    // 함수
    updatePreferences,
    calculatePersonalizedScore,
    trackInteraction,
    getLearningInsights,

    // 유틸리티
    initializeLearning,
    saveLearningState,
  };
}