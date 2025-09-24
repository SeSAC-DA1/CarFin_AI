'use client';

import { useState } from 'react';
import { SimpleLanding } from '@/components/landing/SimpleLanding';
import { PersonaDiscovery, PersonaAnalysisResult } from '@/components/persona/PersonaDiscovery';
import { RealTimeAgentChat } from '@/components/analysis/RealTimeAgentChat';
import { DataDashboard } from '@/components/dashboard/DataDashboard';
import { UserProfileWizard } from '@/components/profile/UserProfileWizard';

type ServicePhase =
  | 'landing'           // 3초 랜딩
  | 'persona_discovery' // 페르소나 발견 (새로운 5문항 시스템)
  | 'smart_questions'   // 맞춤형 질문 (간소화된 UserProfileWizard)
  | 'realtime_analysis' // 실시간 AI 분석 시각화
  | 'data_dashboard'    // 데이터 기반 분석 대시보드

interface UserJourneyData {
  personaAnalysis: PersonaAnalysisResult | null;
  profileData: any;
  personaContext: any;
  analysisResult: any;
}

export function NewCarConsultant() {
  const [currentPhase, setCurrentPhase] = useState<ServicePhase>('landing');
  const [journeyData, setJourneyData] = useState<UserJourneyData>({
    personaAnalysis: null,
    profileData: null,
    personaContext: null,
    analysisResult: null
  });

  // 1단계: 랜딩에서 시작하기
  const handleStartJourney = () => {
    setCurrentPhase('persona_discovery');
  };

  // 2단계: 페르소나 분석 완료
  const handlePersonaComplete = (personaAnalysis: PersonaAnalysisResult) => {
    setJourneyData(prev => ({
      ...prev,
      personaAnalysis
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

    // 1순위: PersonaDiscovery 분석 결과 사용
    if (journeyData.personaAnalysis) {
      const personaAnalysis = journeyData.personaAnalysis;
      const primaryPersona = personaAnalysis.primaryPersona;

      // PersonaType을 기반으로 personaContext 생성
      const personaTypeMap = {
        cautious_pragmatist: {
          name: '신중한 실용주의자',
          key_characteristics: ['가성비 중시', '신중한 결정', '안정성 추구'],
          emphasis_points: ['가성비', '안정성', '실용성'],
          mandatory_features: ['기본 안전장치', '연비 효율', 'A/S 편의성'],
          priorities: ['연비', '안전성', '내구성'],
          usage: '준중형차'
        },
        safety_family_focused: {
          name: '안전 중심 가족형',
          key_characteristics: ['안전성 최우선', '가족 중심', '신뢰성 추구'],
          emphasis_points: ['안전성', '가족 편의', '신뢰성'],
          mandatory_features: ['고급 안전장치', '넓은 공간', '차선유지보조'],
          priorities: ['안전성', '공간성', '편의성'],
          usage: 'SUV'
        },
        prestige_oriented: {
          name: '품격 추구형',
          key_characteristics: ['브랜드 중시', '이미지 추구', '품질 우선'],
          emphasis_points: ['브랜드 가치', '품격', '완성도'],
          mandatory_features: ['프리미엄 인테리어', '고급 옵션', '브랜드 신뢰성'],
          priorities: ['브랜드', '품질', '이미지'],
          usage: '대형차'
        },
        economic_rationalist: {
          name: '경제적 합리주의자',
          key_characteristics: ['경제성 추구', '효율성 중시', '합리적 선택'],
          emphasis_points: ['경제성', '효율성', '유지비'],
          mandatory_features: ['우수한 연비', '저렴한 유지비', '기본 기능'],
          priorities: ['연비', '가격', '유지비'],
          usage: '경차'
        },
        lifestyle_focused: {
          name: '라이프스타일 중시형',
          key_characteristics: ['디자인 중시', '개성 표현', '트렌드 민감'],
          emphasis_points: ['디자인', '개성', '스타일'],
          mandatory_features: ['세련된 디자인', '최신 기술', '개성적 컬러'],
          priorities: ['디자인', '기술', '스타일'],
          usage: '준중형차'
        },
        performance_oriented: {
          name: '성능 지향형',
          key_characteristics: ['성능 우선', '드라이빙 즐거움', '기술 관심'],
          emphasis_points: ['성능', '주행감', '기술력'],
          mandatory_features: ['우수한 성능', '스포티한 디자인', '고급 기술'],
          priorities: ['성능', '주행성', '기술'],
          usage: '쿠페'
        },
        eco_conscious: {
          name: '환경 의식형',
          key_characteristics: ['친환경 중시', '최신 기술', '지속가능성'],
          emphasis_points: ['친환경', '혁신 기술', '지속가능성'],
          mandatory_features: ['친환경 연료', '최신 기술', '에너지 효율'],
          priorities: ['친환경', '기술', '효율성'],
          usage: '하이브리드'
        },
        comfort_seeking: {
          name: '편의 추구형',
          key_characteristics: ['편안함 추구', '서비스 중시', '편의성 우선'],
          emphasis_points: ['편안함', '서비스', '편의성'],
          mandatory_features: ['편의 기능', '승차감', '서비스 품질'],
          priorities: ['편의성', '승차감', '서비스'],
          usage: '대형차'
        }
      };

      const personaInfo = personaTypeMap[primaryPersona];
      personaContext = {
        ...personaInfo,
        budget: profileData?.budget || { min: 1500, max: 2500 },
        matchScore: personaAnalysis.matchScore,
        personaType: primaryPersona
      };
      console.log('✅ PersonaDiscovery 분석 결과로 personaContext 생성:', personaContext);
    }

    // 2순위: 성공적인 Gemini API 분석 결과 사용
    else if (analysisResult?.success && analysisResult?.personaAnalysis) {
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
      personaAnalysis: null,
      profileData: null,
      personaContext: null,
      analysisResult: null
    });
    setCurrentPhase('landing');
  };

  // 뒤로가기 핸들러들
  const handleBackFromPersona = () => {
    setCurrentPhase('landing');
  };

  const handleBackFromQuestions = () => {
    setCurrentPhase('persona_discovery');
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

      case 'persona_discovery':
        return (
          <PersonaDiscovery
            onComplete={handlePersonaComplete}
            onBack={handleBackFromPersona}
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
            {currentPhase === 'persona_discovery' && '1/4 단계: 페르소나 분석'}
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
            <div><strong>페르소나 분석:</strong> {journeyData.personaAnalysis?.primaryPersona || '미완료'}</div>
            <div><strong>매칭도:</strong> {journeyData.personaAnalysis?.matchScore || 0}%</div>
            <div><strong>프로필:</strong> {journeyData.profileData ? '수집완료' : '미완료'}</div>
            <div><strong>페르소나 컨텍스트:</strong> {journeyData.personaContext ? '분석완료' : '미완료'}</div>
            <div><strong>최종 분석:</strong> {journeyData.analysisResult ? '완료' : '미완료'}</div>
          </div>
        </div>
      )}
    </div>
  );
}