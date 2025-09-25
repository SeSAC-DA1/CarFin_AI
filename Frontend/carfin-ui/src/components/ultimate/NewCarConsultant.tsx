'use client';

import { useState } from 'react';
import { SimpleLanding } from '@/components/landing/SimpleLanding';
import { PersonaDiscovery, EmotionalPersonaAnalysisResult } from '@/components/persona/PersonaDiscovery';
import { SimpleAgentConsultation } from '@/components/analysis/SimpleAgentConsultation';
import { DataDashboard } from '@/components/dashboard/DataDashboard';
import { UserProfileWizard } from '@/components/profile/UserProfileWizard';

type ServicePhase =
  | 'landing'              // 간단한 환영 메시지
  | 'agent_consultation'   // Agent 1이 3가지 질문 + 4-Agent 즉시 협업
  | 'recommendation_result' // 추천 결과 + 구매 연결

interface UserJourneyData {
  basicAnswers: {
    usage?: string;
    budget?: { min: number; max: number };
    familyType?: string;
  };
  analysisResult: any;
}

export function NewCarConsultant() {
  const [currentPhase, setCurrentPhase] = useState<ServicePhase>('landing');
  const [journeyData, setJourneyData] = useState<UserJourneyData>({
    basicAnswers: {},
    analysisResult: null
  });

  // 1단계: 랜딩에서 Agent 1과 바로 상담 시작
  const handleStartJourney = () => {
    setCurrentPhase('agent_consultation');
  };

  // 2단계: Agent 1의 3가지 기본 질문 완료
  const handleBasicQuestionsComplete = (basicAnswers: any) => {
    setJourneyData(prev => ({
      ...prev,
      basicAnswers
    }));
    // 바로 4-Agent 협업 시작 (사용자는 대기)
  };

  // 3단계: 4-Agent 협업 분석 완료 후 추천 결과 표시
  const handleAnalysisComplete = (analysisResult: any) => {
    setJourneyData(prev => ({
      ...prev,
      analysisResult
    }));
    setCurrentPhase('recommendation_result');
  };


  // 처음부터 다시 시작
  const handleStartOver = () => {
    setJourneyData({
      basicAnswers: {},
      analysisResult: null
    });
    setCurrentPhase('landing');
  };

  // 뒤로가기 핸들러들
  const handleBackFromConsultation = () => {
    setCurrentPhase('landing');
  };

  const handleBackFromResult = () => {
    setCurrentPhase('agent_consultation');
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

      case 'agent_consultation':
        return (
          <SimpleAgentConsultation
            basicAnswers={journeyData.basicAnswers}
            onComplete={handleAnalysisComplete}
            onBack={handleBackFromConsultation}
            onBasicQuestionsComplete={handleBasicQuestionsComplete}
          />
        );

      case 'recommendation_result':
        return (
          <DataDashboard
            result={journeyData.analysisResult}
            onStartOver={handleStartOver}
            onBack={handleBackFromResult}
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
      {/* 진행률 표시 (README 기준 단순화) */}
      {currentPhase !== 'landing' && (
        <div className="fixed top-4 left-4 z-50">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-white">
            {currentPhase === 'agent_consultation' && '1/2 단계: AI 전문가 상담'}
            {currentPhase === 'recommendation_result' && '2/2 단계: 맞춤 추천 결과'}
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
            <div><strong>기본 답변:</strong> {Object.keys(journeyData.basicAnswers).length > 0 ? '수집완료' : '미완료'}</div>
            <div><strong>분석 결과:</strong> {journeyData.analysisResult ? '완료' : '미완료'}</div>
            <div><strong>README.md 기준 플로우:</strong> ✅</div>
          </div>
        </div>
      )}
    </div>
  );
}