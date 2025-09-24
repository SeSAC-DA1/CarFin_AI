'use client';

import { useState, useEffect } from 'react';
import { Car } from 'lucide-react';
import { OnboardingPage } from '@/components/toss-style/OnboardingPage';
import { TossStyleHome } from '@/components/toss-style/TossStyleHome';
import { InputPhase } from '@/components/consultation/InputPhase';
import { AnalysisPhase } from '@/components/consultation/AnalysisPhase';
import { SuperClaudeConsultant } from '@/components/superclaude/SuperClaudeConsultant';
import { ModeSelector } from '@/components/ultimate/ModeSelector';
import { UserProfileWizard } from '@/components/profile/UserProfileWizard';
import { PersonaAnalysisResult } from '@/components/profile/PersonaAnalysisResult';

// Phase 정의 - 맞춤 분석 추가
type ConsultationPhase = 'onboarding' | 'welcome' | 'mode_selection' | 'profile_wizard' | 'persona_analysis' | 'input' | 'analysis' | 'superclaude' | 'results' | 'consultation';

interface UserData {
  category?: 'economy' | 'family' | 'hobby';
  usage?: string;
  budget?: string;
  priority?: string;
}

interface AnalysisResults {
  vehicleAnalysis?: any;
  financeAnalysis?: any;
  reviewAnalysis?: any;
  finalRecommendations?: any[];
}

export function UltimateCarConsultant() {
  const [currentPhase, setCurrentPhase] = useState<ConsultationPhase>('onboarding');
  const [progress, setProgress] = useState(0);
  const [userData, setUserData] = useState<UserData>({});
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'basic' | 'superclaude' | 'persona'>('basic');
  const [personaAnalysisResult, setPersonaAnalysisResult] = useState<any>(null);

  // Phase별 진행률 계산
  const getProgressForPhase = (phase: ConsultationPhase): number => {
    switch (phase) {
      case 'onboarding': return 0;
      case 'welcome': return 10;
      case 'mode_selection': return 20;
      case 'profile_wizard': return 35;
      case 'persona_analysis': return 50;
      case 'input': return 30;
      case 'analysis': return 60;
      case 'superclaude': return 60;
      case 'results': return 85;
      case 'consultation': return 100;
      default: return 0;
    }
  };

  useEffect(() => {
    setProgress(getProgressForPhase(currentPhase));
  }, [currentPhase]);

  // 온보딩 완료 핸들러
  const handleOnboardingComplete = () => {
    setCurrentPhase('welcome');
  };

  // 모드 선택 핸들러
  const handleModeSelection = (mode: 'basic' | 'superclaude' | 'persona') => {
    setAnalysisMode(mode);
    if (mode === 'superclaude') {
      setCurrentPhase('superclaude');
    } else if (mode === 'persona') {
      setCurrentPhase('profile_wizard');
    } else {
      setCurrentPhase('input');
    }
  };

  // 토스 스타일 카테고리 선택 핸들러
  const handleCategorySelected = (category: 'economy' | 'family' | 'hobby') => {
    // 카테고리별 자동 데이터 설정
    const categoryData: UserData = {
      category,
      usage: category === 'economy' ? '출퇴근용' :
             category === 'family' ? '가족용' : '레저용',
      budget: category === 'economy' ? '150-300만원' :
              category === 'family' ? '300-500만원' : '500만원 이상',
      priority: category === 'economy' ? '연비' :
                category === 'family' ? '안전성' : '디자인'
    };

    setUserData(categoryData);
    setCurrentPhase('mode_selection');
  };

  // 사용자 데이터 수집 완료 핸들러 (기존 방식)
  const handleDataCollected = (data: UserData) => {
    setUserData(data);
    setCurrentPhase('mode_selection');
  };

  // 분석 시작 핸들러 (모드별)
  const handleStartAnalysis = () => {
    if (analysisMode === 'superclaude') {
      setCurrentPhase('superclaude');
    } else {
      setCurrentPhase('analysis');
      setIsLoading(true);
      startAIAnalysis();
    }
  };

  // SuperClaude 완료 핸들러
  const handleSuperClaudeComplete = () => {
    setCurrentPhase('consultation');
  };

  // 페르소나 분석 완료 핸들러
  const handlePersonaAnalysisComplete = (profileData: any, personaAnalysis: any) => {
    console.log('🎯 맞춤 분석 완료:', { profileData, personaAnalysis });
    setPersonaAnalysisResult(personaAnalysis);
    setCurrentPhase('persona_analysis');
  };

  // 맞춤 추천 시작 핸들러
  const handleStartPersonaRecommendation = async (mappedProfile: any) => {
    console.log('🚀 맞춤 추천 시작:', mappedProfile);
    setIsLoading(true);
    setCurrentPhase('analysis');

    try {
      const response = await fetch('/api/recommendations-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: `persona_${Date.now()}`,
          userProfile: mappedProfile,
          analysisType: 'persona_based',
          includeFinanceAnalysis: true,
          includeReviewAnalysis: true
        })
      });

      if (!response.ok) {
        throw new Error('맞춤 추천 시스템 오류');
      }

      const data = await response.json();
      console.log('✅ 맞춤 추천 결과:', data);

      setAnalysisResults({
        vehicleAnalysis: {
          score: data.overallScore || 94,
          recommendations: data.recommendations?.map((vehicle: any) => ({
            name: vehicle.name,
            manufacturer: vehicle.manufacturer,
            model: vehicle.model,
            price: vehicle.price,
            year: vehicle.year,
            score: vehicle.matchingScore,
            mileage: vehicle.mileage,
            features: vehicle.features,
            safety_rating: vehicle.safety_rating,
            fuel_efficiency: vehicle.fuel_efficiency,
            image_url: vehicle.image_url,
            reasons: vehicle.reasons
          })) || []
        },
        financeAnalysis: data.financeAnalysis,
        reviewAnalysis: data.reviewAnalysis
      });

      setCurrentPhase('results');
    } catch (error) {
      console.error('🚨 맞춤 추천 오류:', error);
      setAnalysisResults({
        vehicleAnalysis: {
          score: 0,
          recommendations: []
        },
        financeAnalysis: {
          error: '맞춤 추천 시스템 오류 발생'
        },
        reviewAnalysis: {
          error: '리뷰 분석 오류 발생'
        }
      });
      setCurrentPhase('results');
    } finally {
      setIsLoading(false);
    }
  };

  // AI 분석 완료 핸들러
  const handleAnalysisComplete = () => {
    setCurrentPhase('results');
  };

  // 실제 AI 분석 API 호출 (Mock 데이터 없음!)
  const startAIAnalysis = async () => {
    try {
      console.log('🚀 실제 추천 API 호출 시작:', userData);

      const response = await fetch('/api/recommendations-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: `consultation_${Date.now()}`,
          userProfile: {
            usage: userData.usage,
            budget: userData.budget,
            priority: userData.priority,
            age: 30,
            preferences: {
              fuelType: userData.priority === '연비' ? 'hybrid' : 'gasoline',
              safetyPriority: userData.priority === '안전성',
              designPriority: userData.priority === '디자인',
              brandPriority: userData.priority === '브랜드'
            }
          },
          analysisType: 'comprehensive',
          includeFinanceAnalysis: true,
          includeReviewAnalysis: true
        })
      });

      if (!response.ok) {
        throw new Error('실제 추천 API 호출 실패');
      }

      const data = await response.json();

      console.log('✅ 실제 추천 결과 받음:', data);

      // 실제 API 응답을 UI에 맞게 변환
      setAnalysisResults({
        vehicleAnalysis: {
          score: data.overallScore || 94,
          recommendations: data.recommendations?.map((vehicle: any) => ({
            name: vehicle.name,
            manufacturer: vehicle.manufacturer,
            model: vehicle.model,
            price: vehicle.price,
            year: vehicle.year,
            score: vehicle.matchingScore,
            mileage: vehicle.mileage,
            features: vehicle.features,
            safety_rating: vehicle.safety_rating,
            fuel_efficiency: vehicle.fuel_efficiency,
            image_url: vehicle.image_url,
            reasons: vehicle.reasons
          })) || []
        },
        financeAnalysis: data.financeAnalysis,
        reviewAnalysis: data.reviewAnalysis
      });

    } catch (error) {
      console.error('🚨 실제 추천 API 오류:', error);

      // 오류 발생 시에도 Mock 데이터 사용 금지!
      setAnalysisResults({
        vehicleAnalysis: {
          score: 0,
          recommendations: []
        },
        financeAnalysis: {
          error: '추천 시스템 오류 발생'
        },
        reviewAnalysis: {
          error: '리뷰 분석 오류 발생'
        }
      });
    }
  };

  // Simplified Phase 렌더링
  return (
    <div className="relative">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-black z-50">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-1000 shadow-lg"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Navigation header (except for onboarding and welcome) */}
      {currentPhase !== 'onboarding' && currentPhase !== 'welcome' && (
        <div className="fixed top-4 left-4 right-4 z-40">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg px-6 py-3 shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg">CarFin AI</div>
                  <div className="text-gray-400 text-sm">
                    {currentPhase === 'profile_wizard' && 'AI 맞춤 분석'}
                    {currentPhase === 'persona_analysis' && 'AI 분석 결과'}
                    {currentPhase === 'input' && 'Personal Information'}
                    {currentPhase === 'analysis' && 'AI 전문 분석'}
                    {currentPhase === 'results' && 'Analysis Results'}
                    {currentPhase === 'consultation' && 'AI 전문 상담'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-red-400 text-sm font-semibold">{Math.round(progress)}% Complete</div>
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase content */}
      <div className={currentPhase !== 'onboarding' && currentPhase !== 'welcome' ? 'pt-24' : 'pt-1'}>
        {currentPhase === 'onboarding' && (
          <OnboardingPage onStartService={handleOnboardingComplete} />
        )}
        {currentPhase === 'welcome' && (
          <TossStyleHome onCategorySelect={handleCategorySelected} userName="반가워요" />
        )}
        {currentPhase === 'mode_selection' && (
          <ModeSelector onSelectMode={handleModeSelection} />
        )}
        {currentPhase === 'superclaude' && (
          <SuperClaudeConsultant userData={userData} onComplete={handleSuperClaudeComplete} />
        )}
        {currentPhase === 'profile_wizard' && (
          <UserProfileWizard onComplete={handlePersonaAnalysisComplete} />
        )}
        {currentPhase === 'persona_analysis' && personaAnalysisResult && (
          <PersonaAnalysisResult
            analysisResult={personaAnalysisResult}
            onStartRecommendation={handleStartPersonaRecommendation}
          />
        )}
        {currentPhase === 'input' && (
          <InputPhase
            onDataCollected={handleDataCollected}
            onPrevious={() => setCurrentPhase('welcome')}
          />
        )}
        {currentPhase === 'analysis' && (
          <AnalysisPhase
            userData={userData}
            onAnalysisComplete={handleAnalysisComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            isTossStyleMatching={!!userData.category}
          />
        )}
        {currentPhase === 'results' && (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
            <div className="max-w-6xl mx-auto">
              {/* 헤더 */}
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">🎉 전문 분석 완료</h2>
                <p className="text-xl text-gray-700 mb-4">
                  {userData.usage} 용도, {userData.budget} 예산, {userData.priority} 우선순위 기반 실제 데이터 분석
                </p>
                <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 rounded-full px-6 py-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-semibold">실제 데이터 분석 완료 (Mock 없음)</span>
                </div>
              </div>

              {/* 추천 차량 목록 */}
              {analysisResults.vehicleAnalysis?.recommendations && analysisResults.vehicleAnalysis.recommendations.length > 0 ? (
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  {analysisResults.vehicleAnalysis.recommendations.slice(0, 4).map((vehicle: any, index: number) => (
                    <div key={index} className={`bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg border-2 ${
                      index === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                    }`}>
                      {index === 0 && (
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold inline-block mb-4">
                          🏆 BEST MATCH
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{vehicle.name}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>연식: {vehicle.year}년</div>
                            <div>주행거리: {vehicle.mileage?.toLocaleString()}km</div>
                            <div>연비: {vehicle.fuel_efficiency}km/L</div>
                            <div>안전등급: {vehicle.safety_rating}성급</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            {vehicle.price?.toLocaleString()}만원
                          </div>
                          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                            매칭도: {vehicle.score}%
                          </div>
                        </div>
                      </div>

                      {/* 추천 이유 */}
                      {vehicle.reasons && vehicle.reasons.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-800 mb-2">✨ 추천 이유</h4>
                          <div className="space-y-1">
                            {vehicle.reasons.map((reason: string, idx: number) => (
                              <div key={idx} className="text-sm text-gray-600 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                {reason}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 주요 옵션 */}
                      {vehicle.features && vehicle.features.length > 0 && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-semibold text-gray-800 mb-2">🔧 주요 옵션</h4>
                          <div className="flex flex-wrap gap-2">
                            {vehicle.features.slice(0, 4).map((feature: string, idx: number) => (
                              <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-lg text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">분석 진행 중...</h3>
                  <p className="text-gray-600">실제 차량 데이터를 분석하고 있습니다.</p>
                </div>
              )}

              {/* 금융 & 리뷰 분석 */}
              {analysisResults.financeAnalysis && (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* 금융 분석 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-green-800 mb-4">💰 금융 분석</h3>
                    {analysisResults.financeAnalysis.error ? (
                      <p className="text-red-600">{analysisResults.financeAnalysis.error}</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="font-semibold text-green-800 mb-1">
                            {analysisResults.financeAnalysis.bestLoan}
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            월 {analysisResults.financeAnalysis.monthlyPayment?.toLocaleString()}원
                          </div>
                          <div className="text-sm text-green-700">
                            3년 후 예상가: {analysisResults.financeAnalysis.predictedValue?.toLocaleString()}만원
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 리뷰 분석 */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-purple-800 mb-4">📝 사용자 리뷰</h3>
                    {analysisResults.reviewAnalysis?.error ? (
                      <p className="text-red-600">{analysisResults.reviewAnalysis.error}</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600">
                            {analysisResults.reviewAnalysis?.satisfaction}/5.0
                          </div>
                          <div className="text-sm text-gray-600">
                            {analysisResults.reviewAnalysis?.reviewCount}명 분석
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="font-semibold text-green-700 text-sm mb-1">👍 만족 요소</div>
                            {analysisResults.reviewAnalysis?.positiveAspects?.map((aspect: string, idx: number) => (
                              <div key={idx} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs mb-1">
                                {aspect}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 다음 단계 버튼 */}
              <div className="text-center">
                <button
                  onClick={() => setCurrentPhase('consultation')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105"
                >
                  AI 전문 상담받기 →
                </button>
              </div>
            </div>
          </div>
        )}
        {currentPhase === 'consultation' && (
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">AI 전문 상담</h2>
              <p className="text-xl text-gray-700">추가 상담이 필요하시면 문의해주세요!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
