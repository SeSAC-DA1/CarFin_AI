'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Car
} from 'lucide-react';
import { SpotifyStyleOnboarding } from '@/components/onboarding/SpotifyStyleOnboarding';
import { ModernLandingPage } from '@/components/landing/ModernLandingPage';
import { CoreThreeAgentChat } from '@/components/chat/CoreThreeAgentChat';
import { AICollaborationMeeting } from '@/components/ai-visualization/AICollaborationMeeting';
import { NetflixStyleRecommendation } from '@/components/vehicle/NetflixStyleRecommendation';
import { EnhancedAnalysisDashboard } from '@/components/analysis/EnhancedAnalysisDashboard';
import { FinanceConsultation } from '@/components/finance/FinanceConsultation';
import { ApiHealthCheck } from '@/components/debug/ApiHealthCheck';
import {
  UIUserProfile,
  AppPhase,
  Vehicle,
  VehicleFeedback
} from '@/types';
import {
  mapOnboardingToUserData,
  fetchRealVehicleData,
  generateUserQuery
} from '@/lib/utils/dataMapping';
import { UserData, VehicleData } from '@/lib/utils/dataMapping';

export default function CarFinPage() {
  const [userProfile, setUserProfile] = useState<UIUserProfile | null>(null);
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('landing'); // 🚀 울트라띵크 모드: 전체 서비스 흐름 시작
  const [collectedData, setCollectedData] = useState<Record<string, unknown>>({});
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [userFeedback, setUserFeedback] = useState<VehicleFeedback[]>([]);

  // 실제 추론 엔진용 데이터
  const [realUserData, setRealUserData] = useState<UserData | null>(null);
  const [vehicleDatabase, setVehicleDatabase] = useState<VehicleData[]>([]);
  useEffect(() => {
    // 🚀 메인 페이지 진입시 기본 데이터 설정
    const initializeDefaultData = async () => {
      const defaultProfile: UIUserProfile = {
        user_id: `demo_${Date.now()}`,
        name: 'Demo User',
        preferences: ['hyundai'],
        guest: false
      };

      const defaultPreferences = {
        brands: ['hyundai'],
        usage: '일반 용도',
        fuel: ['gasoline'],
        budget: 'budget2'
      };

      const userData = mapOnboardingToUserData(defaultPreferences);
      const vehicles = await fetchRealVehicleData(userData);

      setUserProfile(defaultProfile);
      setRealUserData(userData);
      setVehicleDatabase(vehicles);
    };

    initializeDefaultData();
  }, []);

  const handleOnboardingComplete = async (preferences: any) => {
    const profile: UIUserProfile = {
      user_id: `user_${Date.now()}`,
      name: 'CarFin User',
      preferences: preferences.brands,
      guest: false
    };
    setUserProfile(profile);
    setCollectedData(preferences);

    // 🚀 실제 추론 엔진용 데이터 변환
    const userData = mapOnboardingToUserData(preferences);

    // ✨ 실제 데이터베이스에서 차량 데이터 가져오기
    const vehicles = await fetchRealVehicleData(userData);

    setRealUserData(userData);
    setVehicleDatabase(vehicles);
    setCurrentPhase('ai-collaboration'); // AI 협업 단계로 이동
  };

  const handleSkip = async () => {
    setUserProfile({
      user_id: `guest_${Date.now()}`,
      name: 'Guest',
      guest: true
    });

    // 🚀 게스트용 기본 데이터 생성
    const defaultPreferences = {
      brands: ['hyundai'],
      usage: '일반 용도',
      fuel: ['gasoline'],
      budget: 'budget2'
    };

    const userData = mapOnboardingToUserData(defaultPreferences);

    // ✨ 실제 데이터베이스에서 차량 데이터 가져오기
    const vehicles = await fetchRealVehicleData(userData);

    setRealUserData(userData);
    setVehicleDatabase(vehicles);
    setCurrentPhase('ai-collaboration'); // AI 협업 단계로 이동
  };

  const handleChatComplete = (data: Record<string, unknown>) => {
    setCollectedData(data);
    setCurrentPhase('grid');
  };

  const handleAICollaborationComplete = (result: any) => {
    // AI 협업 결과를 저장하고 차량 선택 단계로 이동
    setCollectedData(prev => ({
      ...prev,
      aiCollaborationResult: result
    }));
    setCurrentPhase('grid');
  };

  const handleVehicleSelection = (vehicles: Vehicle[], feedback: VehicleFeedback[]) => {
    // 첫 번째 차량을 선택된 차량으로 설정
    setSelectedVehicle(vehicles[0] || null);
    setUserFeedback(feedback);
    setCurrentPhase('analysis');
  };

  const handleAnalysisComplete = () => {
    setCurrentPhase('finance');
  };

  const handleFinanceComplete = () => {
    // 🚀 울트라띵크 모드: 서비스 완료 처리
    setCurrentPhase('service-complete');
  };

  const handleBackToVehicles = () => {
    setCurrentPhase('grid');
  };

  // 모던 랜딩 페이지
  if (currentPhase === 'landing') {
    return (
      <div>
        <ModernLandingPage onGetStarted={() => setCurrentPhase('signup')} />
        {/* 개발자용 API 상태 체크 */}
        <div className="fixed bottom-4 right-4 z-50">
          <ApiHealthCheck />
        </div>
      </div>
    );
  }

  // Spotify 스타일 온보딩
  if (currentPhase === 'signup') {
    return <SpotifyStyleOnboarding onComplete={handleOnboardingComplete} />;
  }

  // AI 협업 시각화 단계
  if (currentPhase === 'ai-collaboration') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* 배경 애니메이션 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-6xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
                🤖 멀티 AI 에이전트 협업 추천
              </h1>
              <p className="text-xl text-gray-300 mb-2">
                {userProfile?.name || 'Guest'}님만을 위한 맞춤 차량 분석
              </p>
              <p className="text-lg text-gray-400">
                차량전문가 • 금융분석가 • 리뷰분석가가 실시간 협업 중
              </p>
            </div>

            <AICollaborationMeeting
              isActive={true}
              onCollaborationComplete={handleAICollaborationComplete}
              userQuery={realUserData ? generateUserQuery(realUserData) : '적정 예산으로 일반 용도 차량 찾고 있어요'}
              userData={realUserData}
              vehicleData={vehicleDatabase}
              className="mb-8"
            />
          </div>
        </div>
      </div>
    );
  }

  // 채팅 단계
  if (currentPhase === 'chat') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              AI 상담사와 대화하기
            </h1>
            <p className="text-gray-600">
              {userProfile?.name}님의 이상적인 중고차를 찾기 위해 몇 가지 질문드릴게요
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <CoreThreeAgentChat
              userProfile={userProfile}
              onRecommendationComplete={handleChatComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  // 차량 선택 단계 - 넷플릭스 스타일 추천
  if (currentPhase === 'grid') {
    return <NetflixStyleRecommendation onVehicleSelection={handleVehicleSelection} />;
  }

  // 분석 대시보드 단계
  if (currentPhase === 'analysis') {
    return (
      <EnhancedAnalysisDashboard
        selectedVehicles={selectedVehicle ? [selectedVehicle] : []}
        userFeedback={userFeedback}
        onProceedToFinance={handleAnalysisComplete}
        onSelectDifferentVehicle={handleBackToVehicles}
      />
    );
  }

  // 금융 상담 단계
  if (currentPhase === 'finance') {
    return (
      <FinanceConsultation
        selectedVehicle={selectedVehicle}
        userProfile={userProfile}
        onConsultationComplete={handleFinanceComplete}
      />
    );
  }

  // 🎉 서비스 완료 화면
  if (currentPhase === 'service-complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="text-4xl">🎉</div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            축하합니다! 🚗
          </h1>

          <p className="text-xl text-gray-700 mb-8">
            멀티 AI 에이전트 협업 추천이 성공적으로 완료되었습니다
          </p>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">AI 에이전트 협업 결과</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚗</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">차량전문가 분석</h3>
                <p className="text-sm text-gray-600">85,320대 데이터 기반 하이브리드 추천시스템으로 최적 매물 발굴</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">금융분석가 상담</h3>
                <p className="text-sm text-gray-600">TCO 계산 및 감가상각 예측으로 맞춤 금융 솔루션 제공</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">리뷰분석가 검증</h3>
                <p className="text-sm text-gray-600">KoBERT 감정분석으로 실제 사용자 만족도 및 브랜드 신뢰도 평가</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">실시간 협업</h3>
                <p className="text-sm text-gray-600">WebSocket 기반 투명한 AI 분석 과정 실시간 시각화</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setCurrentPhase('landing')}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 mr-4"
            >
              🏠 처음부터 다시 시작
            </Button>

            <Button
              onClick={() => setCurrentPhase('grid')}
              size="lg"
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
            >
              🚗 다른 차량 찾기
            </Button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>🤖 멀티 AI 에이전트 협업 시스템으로 구현된 CarFin AI</p>
            <p>실시간 WebSocket + 85,320대 실제 데이터 + 3개 전문 AI 협업</p>
          </div>
        </div>
      </div>
    );
  }

  // 기본 예외 처리
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Car
            className="w-8 h-8 text-blue-600"
            aria-hidden="true"
            role="img"
          />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          예상치 못한 오류가 발생했습니다
        </h2>
        <p className="text-gray-600 mb-6">
          메인 페이지로 돌아가서 다시 시도해주세요
        </p>
        <Button
          onClick={() => setCurrentPhase('landing')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          aria-label="메인 페이지로 돌아가기"
        >
          메인으로 돌아가기
        </Button>
      </div>
    </div>
  );
}