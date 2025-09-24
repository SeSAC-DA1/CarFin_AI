'use client';

import { useState } from 'react';
import { SimpleLanding } from '@/components/landing/SimpleLanding';
import { EmpatheticEntry } from '@/components/entry/EmpatheticEntry';
import { RealTimeAgentChat } from '@/components/analysis/RealTimeAgentChat';
import { DataDashboard } from '@/components/dashboard/DataDashboard';
import { UserProfileWizard } from '@/components/profile/UserProfileWizard';

type ServicePhase =
  | 'landing'           // 3초 랜딩
  | 'empathetic_entry'  // 공감형 상황 선택
  | 'smart_questions'   // 맞춤형 질문 (기존 UserProfileWizard 활용)
  | 'realtime_analysis' // 실시간 AI 분석 시각화
  | 'data_dashboard'    // 데이터 기반 분석 대시보드

interface UserJourneyData {
  entryType: 'beginner' | 'confused' | 'confident' | null;
  questions: string[];
  profileData: any;
  personaContext: any;
  analysisResult: any;
}

export function NewCarConsultant() {
  const [currentPhase, setCurrentPhase] = useState<ServicePhase>('landing');
  const [journeyData, setJourneyData] = useState<UserJourneyData>({
    entryType: null,
    questions: [],
    profileData: null,
    personaContext: null,
    analysisResult: null
  });

  // 1단계: 랜딩에서 시작하기
  const handleStartJourney = () => {
    setCurrentPhase('empathetic_entry');
  };

  // 2단계: 공감형 상황 선택
  const handleEntrySelection = (entryType: 'beginner' | 'confused' | 'confident', questions: string[]) => {
    setJourneyData(prev => ({
      ...prev,
      entryType,
      questions
    }));
    setCurrentPhase('smart_questions');
  };

  // 3단계: 스마트 질문 완료 (기존 UserProfileWizard 결과)
  const handleQuestionsComplete = (profileData: any, analysisResult: any) => {
    // analysisResult 전체 구조 확인
    console.log('🔍 NewCarConsultant - 받은 analysisResult 전체:', analysisResult);
    console.log('🔍 NewCarConsultant - analysisResult.personaAnalysis:', analysisResult?.personaAnalysis);
    console.log('🔍 NewCarConsultant - analysisResult.success:', analysisResult?.success);

    let personaContext = null;

    // 1순위: 성공적인 Gemini API 분석 결과 사용
    if (analysisResult?.success && analysisResult?.personaAnalysis) {
      const personaData = analysisResult.personaAnalysis;
      personaContext = {
        name: personaData.persona_profile?.name || '실용적 차량 구매자',
        key_characteristics: personaData.persona_profile?.key_characteristics || ['실용성 중시'],
        emphasis_points: personaData.recommendation_strategy?.emphasis_points || ['가성비', '실용성'],
        mandatory_features: personaData.vehicle_requirements?.mandatory_features || ['기본 안전장치'],
        budget: personaData.budget_analysis?.realistic_range || profileData?.budget || { min: 1000, max: 3000 },
        priorities: personaData.vehicle_requirements?.preferred_features || ['연비', '안전성'],
        usage: personaData.vehicle_requirements?.size_category || '준중형차'
      };
      console.log('✅ Gemini 분석 결과로 personaContext 생성:', personaContext);
    }

    // 2순위: API 실패시 fallbackPersona 사용
    else if (analysisResult?.fallbackPersona) {
      const fallbackData = analysisResult.fallbackPersona;
      personaContext = {
        name: fallbackData.persona_profile?.name || '실용적 차량 구매자',
        key_characteristics: fallbackData.persona_profile?.key_characteristics || ['실용성 중시'],
        emphasis_points: fallbackData.recommendation_strategy?.emphasis_points || ['가성비', '실용성'],
        mandatory_features: fallbackData.vehicle_requirements?.mandatory_features || ['기본 안전장치'],
        budget: fallbackData.budget_analysis?.realistic_range || profileData?.budget || { min: 1000, max: 3000 },
        priorities: fallbackData.vehicle_requirements?.preferred_features || ['연비', '안전성'],
        usage: fallbackData.vehicle_requirements?.size_category || '준중형차'
      };
      console.log('⚠️ Fallback 데이터로 personaContext 생성:', personaContext);
    }

    // 3순위: 완전 실패시 profileData만으로 기본 personaContext 생성
    else {
      console.log('🚨 API 완전 실패! profileData만으로 기본 personaContext 생성');

      // profileData 기반 기본 페르소나 생성
      const familyTypeNames = {
        'single': '혼자 사는 실용주의자',
        'newlywed': '신혼부부 알뜰족',
        'young_parent': '안전 중시 육아맘/파',
        'office_worker': '바쁜 직장인',
        'retiree': '여유로운 시니어'
      };

      const purposeFeatures = {
        'commute': ['연비 효율', '편안한 시트'],
        'family_trips': ['넓은 공간', '안전장치'],
        'weekend_leisure': ['트렁크 공간', '주행성능'],
        'business': ['품격 있는 외관', '정숙성'],
        'daily_errands': ['주차 편의', '실용성']
      };

      personaContext = {
        name: familyTypeNames[profileData?.family_type as keyof typeof familyTypeNames] || '실용적 차량 구매자',
        key_characteristics: ['실용성 중시', '신중한 결정', '가성비 고려'],
        emphasis_points: ['실용성', '가성비', '신뢰성'],
        mandatory_features: purposeFeatures[profileData?.main_purpose as keyof typeof purposeFeatures] || ['기본 안전장치', '연비 효율'],
        budget: profileData?.budget || { min: 1500, max: 2500 },
        priorities: ['안전성', '연비', '편의성'],
        usage: profileData?.typical_passengers === 'family_with_kids' ? 'SUV' : '준중형차'
      };
      console.log('🔧 ProfileData 기반 기본 personaContext 생성:', personaContext);
    }

    // personaContext가 null이면 절대 안됨 - 최종 안전장치
    if (!personaContext) {
      console.log('🚨 최종 안전장치 발동 - 하드코딩된 기본값 사용');
      personaContext = {
        name: '신중한 차량 구매자',
        key_characteristics: ['실용성 중시', '안전성 우선'],
        emphasis_points: ['가성비', '안전성', '신뢰성'],
        mandatory_features: ['기본 안전장치', '연비 효율', '주차 보조'],
        budget: { min: 1500, max: 2500 },
        priorities: ['안전성', '연비', '내구성'],
        usage: '준중형차'
      };
    }

    console.log('🏆 최종 personaContext:', personaContext);

    setJourneyData(prev => ({
      ...prev,
      profileData,
      personaContext,
      analysisResult
    }));
    setCurrentPhase('realtime_analysis');
  };

  // 4단계: 실시간 분석 완료
  const handleAnalysisComplete = (finalAnalysisResult: any) => {
    setJourneyData(prev => ({
      ...prev,
      analysisResult: finalAnalysisResult
    }));
    setCurrentPhase('data_dashboard');
  };

  // 데이터 대시보드에서는 딜러 연결 기능 제거 (데이터 기반 의사결정 지원에 집중)

  // 처음부터 다시 시작
  const handleStartOver = () => {
    setJourneyData({
      entryType: null,
      questions: [],
      profileData: null,
      personaContext: null,
      analysisResult: null
    });
    setCurrentPhase('landing');
  };

  // 뒤로가기 핸들러들
  const handleBackFromEntry = () => {
    setCurrentPhase('landing');
  };

  const handleBackFromQuestions = () => {
    setCurrentPhase('empathetic_entry');
  };

  const handleBackFromAnalysis = () => {
    setCurrentPhase('smart_questions');
  };

  const handleBackFromDashboard = () => {
    setCurrentPhase('realtime_analysis');
  };

  // 현재 단계에 따른 컴포넌트 렌더링
  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'landing':
        return (
          <SimpleLanding
            onStartJourney={handleStartJourney}
          />
        );

      case 'empathetic_entry':
        return (
          <EmpatheticEntry
            onSelectEntry={handleEntrySelection}
            onBack={handleBackFromEntry}
          />
        );

      case 'smart_questions':
        return (
          <UserProfileWizard
            onComplete={handleQuestionsComplete}
          />
        );

      case 'realtime_analysis':
        return (
          <RealTimeAgentChat
            personaContext={journeyData.personaContext}
            userProfile={journeyData.profileData}
            onComplete={handleAnalysisComplete}
            onBack={handleBackFromAnalysis}
          />
        );

      case 'data_dashboard':
        return (
          <DataDashboard
            result={journeyData.analysisResult}
            onStartOver={handleStartOver}
            onBack={handleBackFromDashboard}
          />
        );

      default:
        return (
          <SimpleLanding
            onStartJourney={handleStartJourney}
          />
        );
    }
  };

  return (
    <div className="min-h-screen">
      {/* 진행률 표시 (필요한 경우) */}
      {currentPhase !== 'landing' && (
        <div className="fixed top-4 left-4 z-50">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-white">
            {currentPhase === 'empathetic_entry' && '1/4 단계: 상황 선택'}
            {currentPhase === 'smart_questions' && '2/4 단계: 맞춤 질문'}
            {currentPhase === 'realtime_analysis' && '3/4 단계: AI 분석'}
            {currentPhase === 'data_dashboard' && '4/4 단계: 데이터 대시보드'}
          </div>
        </div>
      )}

      {/* 현재 단계 컴포넌트 */}
      {renderCurrentPhase()}

      {/* 개발자 디버그 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 text-xs text-white max-w-sm">
          <div className="space-y-1">
            <div><strong>현재 단계:</strong> {currentPhase}</div>
            <div><strong>진입 타입:</strong> {journeyData.entryType || '미설정'}</div>
            <div><strong>질문 수:</strong> {journeyData.questions.length}개</div>
            <div><strong>프로필:</strong> {journeyData.profileData ? '수집완료' : '미완료'}</div>
            <div><strong>페르소나:</strong> {journeyData.personaContext ? '분석완료' : '미완료'}</div>
            <div><strong>최종 분석:</strong> {journeyData.analysisResult ? '완료' : '미완료'}</div>
          </div>
        </div>
      )}
    </div>
  );
}