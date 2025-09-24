'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Sparkles, Banknote, Users, ParkingSquare } from 'lucide-react';

export interface UserProfileData {
  // 차알못 친화적 3단계 데이터
  budget: {
    min: number;
    max: number;
  };
  usage_purpose: 'commute' | 'weekend_trips' | 'special_occasions' | 'all_purpose' | '';
  priority: 'safety' | 'economy' | 'comfort' | 'style' | '';

  // 레거시 호환성을 위한 기본값들 (API 연동용)
  family_type: 'single' | 'newlywed' | 'young_parent' | 'office_worker' | 'retiree' | '';
  main_purpose: 'commute' | 'family_trips' | 'weekend_leisure' | 'business' | 'daily_errands' | '';
  typical_passengers: 'alone' | 'couple' | 'family_with_kids' | 'extended_family' | '';
  housing: 'apartment_parking' | 'apartment_street' | 'house_garage' | 'house_street' | '';
}

interface Props {
  onComplete: (profileData: UserProfileData, personaAnalysis: any) => void;
}

export function UserProfileWizard({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<UserProfileData>({
    budget: { min: 1000, max: 3000 },
    usage_purpose: '',
    priority: '',
    // 레거시 호환성
    family_type: '',
    main_purpose: '',
    typical_passengers: '',
    housing: ''
  });

  const totalSteps = 3; // 4단계 → 3단계로 간소화
  const progress = (currentStep / totalSteps) * 100;

  const updateProfileData = (field: keyof UserProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return profileData.budget.min > 0 && profileData.budget.max > profileData.budget.min;
      case 2:
        return profileData.usage_purpose !== '';
      case 3:
        return profileData.priority !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleAnalyzePersona = async () => {
    try {
      console.log('🧠 간소화된 맞춤 분석 시작:', profileData);

      // 레거시 API 호환성을 위한 데이터 매핑
      const mappedProfileData = {
        ...profileData,
        // usage_purpose → legacy 필드들로 변환
        family_type: profileData.usage_purpose === 'commute' ? 'office_worker' :
                    profileData.usage_purpose === 'weekend_trips' ? 'young_parent' :
                    profileData.usage_purpose === 'special_occasions' ? 'newlywed' : 'single',
        main_purpose: profileData.usage_purpose === 'commute' ? 'commute' :
                     profileData.usage_purpose === 'weekend_trips' ? 'family_trips' :
                     profileData.usage_purpose === 'special_occasions' ? 'weekend_leisure' : 'daily_errands',
        typical_passengers: profileData.usage_purpose === 'commute' ? 'alone' :
                           profileData.usage_purpose === 'weekend_trips' ? 'family_with_kids' :
                           profileData.usage_purpose === 'special_occasions' ? 'couple' : 'alone',
        // priority → legacy housing 추론 (안전/편안=넓은곳, 경제/스타일=어디든)
        housing: (profileData.priority === 'safety' || profileData.priority === 'comfort') ?
                'apartment_parking' : 'apartment_street',
        // 기타 필수 필드들 기본값
        driving_experience: 'intermediate',
        frequency: profileData.usage_purpose === 'commute' ? 'daily' : 'weekend_only',
        main_routes: profileData.usage_purpose === 'commute' ? 'city_center' : 'mixed',
        main_concerns: profileData.priority === 'safety' ? ['safety'] :
                      profileData.priority === 'economy' ? ['economy'] : ['safety', 'economy'],
        priorities: profileData.priority === 'safety' ? ['safety', 'reliability'] :
                   profileData.priority === 'economy' ? ['economy', 'convenience'] :
                   profileData.priority === 'comfort' ? ['convenience', 'space'] :
                   ['image', 'convenience'],
        budget_flexibility: 'somewhat_flexible'
      };

      // Gemini API를 통한 페르소나 분석
      const response = await fetch('/api/analyze-persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile: mappedProfileData
        }),
      });

      if (!response.ok) {
        throw new Error(`맞춤 분석 오류: ${response.status}`);
      }

      const analysisResult = await response.json();
      console.log('✅ 간소화된 맞춤 분석 완료:', analysisResult);

      if (analysisResult.success) {
        onComplete(mappedProfileData, analysisResult);
      } else {
        throw new Error(analysisResult.error || '맞춤 분석 실패');
      }

    } catch (error) {
      console.error('❌ 맞춤 분석 실패:', error);

      // 실패 시에도 기본 프로필로 진행
      onComplete(profileData, {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        fallbackUsed: true,
        // 간단한 fallback persona
        fallbackPersona: {
          persona_profile: {
            name: profileData.usage_purpose === 'commute' ? '출퇴근 실용주의자' :
                  profileData.usage_purpose === 'weekend_trips' ? '가족 여행족' :
                  profileData.usage_purpose === 'special_occasions' ? '스타일 중시형' : '생활 밀착형',
            key_characteristics: profileData.priority === 'safety' ? ['안전 최우선', '신중한 선택'] :
                                profileData.priority === 'economy' ? ['가성비 중시', '경제적 선택'] :
                                profileData.priority === 'comfort' ? ['편안함 추구', '품질 중시'] :
                                ['스타일 중시', '개성 표현']
          },
          recommendation_strategy: {
            emphasis_points: profileData.priority === 'safety' ? ['안전성', '신뢰성'] :
                            profileData.priority === 'economy' ? ['가성비', '경제성'] :
                            profileData.priority === 'comfort' ? ['편안함', '품질'] :
                            ['디자인', '브랜드']
          },
          vehicle_requirements: {
            mandatory_features: profileData.priority === 'safety' ? ['고급 안전장치', '충돌 안전성'] :
                               profileData.priority === 'economy' ? ['우수한 연비', '저렴한 유지비'] :
                               profileData.priority === 'comfort' ? ['편안한 시트', '정숙성'] :
                               ['세련된 디자인', '프리미엄 인테리어'],
            preferred_features: [profileData.priority || '안전성', '연비'],
            size_category: profileData.usage_purpose === 'weekend_trips' ? 'SUV' :
                          profileData.usage_purpose === 'special_occasions' ? '쿠페' : '준중형차'
          },
          budget_analysis: {
            realistic_range: profileData.budget
          }
        }
      });
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return '💰 월 얼마까지 쓸 수 있어요?';
      case 2: return '🎯 주로 언제 차를 쓸 예정이에요?';
      case 3: return '❤️ 가장 중요하게 생각하는 건?';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return '💳 할부 포함해서 월 얼마까지 가능한지 알려주세요 (보통 월급의 20-30%가 적당해요)';
      case 2: return '🚗 언제 주로 쓸지 알면 딱 맞는 차를 추천해드릴 수 있어요';
      case 3: return '💭 차에서 가장 중요하게 생각하는 가치를 선택해주세요';
      default: return '';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => updateProfileData('budget', { min: 100, max: 200 })}
                className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105 ${
                  profileData.budget.min === 100 && profileData.budget.max === 200
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <Banknote className="w-6 h-6 text-green-600 mr-2" />
                  <span className="text-lg font-semibold">100-200만원</span>
                </div>
                <p className="text-sm text-slate-600">💚 알뜰하게 (경차, 소형차)</p>
              </button>

              <button
                onClick={() => updateProfileData('budget', { min: 200, max: 300 })}
                className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105 ${
                  profileData.budget.min === 200 && profileData.budget.max === 300
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <Banknote className="w-6 h-6 text-blue-600 mr-2" />
                  <span className="text-lg font-semibold">200-300만원</span>
                </div>
                <p className="text-sm text-slate-600">💙 적당하게 (준중형차)</p>
              </button>

              <button
                onClick={() => updateProfileData('budget', { min: 300, max: 500 })}
                className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105 ${
                  profileData.budget.min === 300 && profileData.budget.max === 500
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <Banknote className="w-6 h-6 text-purple-600 mr-2" />
                  <span className="text-lg font-semibold">300-500만원</span>
                </div>
                <p className="text-sm text-slate-600">💜 넉넉하게 (중형차, SUV)</p>
              </button>

              <button
                onClick={() => updateProfileData('budget', { min: 500, max: 1000 })}
                className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105 ${
                  profileData.budget.min === 500 && profileData.budget.max === 1000
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <Banknote className="w-6 h-6 text-amber-600 mr-2" />
                  <span className="text-lg font-semibold">500만원 이상</span>
                </div>
                <p className="text-sm text-slate-600">🧡 여유있게 (대형차, 프리미엄)</p>
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => updateProfileData('usage_purpose', 'commute')}
                className={`p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                  profileData.usage_purpose === 'commute'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-3xl mb-2">🌅</div>
                <h3 className="text-lg font-semibold">매일 출퇴근</h3>
                <p className="text-sm text-slate-600">연비 좋고 편한 차</p>
                <div className="mt-2 text-xs text-slate-500">→ 경제성 + 편안함</div>
              </button>

              <button
                onClick={() => updateProfileData('usage_purpose', 'weekend_trips')}
                className={`p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                  profileData.usage_purpose === 'weekend_trips'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-3xl mb-2">🌄</div>
                <h3 className="text-lg font-semibold">주말 나들이/여행</h3>
                <p className="text-sm text-slate-600">공간 넓고 안전한 차</p>
                <div className="mt-2 text-xs text-slate-500">→ 안전성 + 공간성</div>
              </button>

              <button
                onClick={() => updateProfileData('usage_purpose', 'special_occasions')}
                className={`p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                  profileData.usage_purpose === 'special_occasions'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-3xl mb-2">💕</div>
                <h3 className="text-lg font-semibold">데이트/특별한 날</h3>
                <p className="text-sm text-slate-600">스타일리시한 차</p>
                <div className="mt-2 text-xs text-slate-500">→ 디자인 + 브랜드</div>
              </button>

              <button
                onClick={() => updateProfileData('usage_purpose', 'all_purpose')}
                className={`p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                  profileData.usage_purpose === 'all_purpose'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-3xl mb-2">🏠</div>
                <h3 className="text-lg font-semibold">생활 전반 다용도</h3>
                <p className="text-sm text-slate-600">무난하고 실용적인 차</p>
                <div className="mt-2 text-xs text-slate-500">→ 실용성 + 무난함</div>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => updateProfileData('priority', 'safety')}
                className={`p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                  profileData.priority === 'safety'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-3xl mb-2">🛡️</div>
                <h3 className="text-lg font-semibold mb-2">안전하게</h3>
                <p className="text-sm text-slate-600">사고 걱정 없이</p>
                <div className="mt-2 text-xs text-slate-500">→ 고급 안전장치, 충돌 안전성</div>
              </button>

              <button
                onClick={() => updateProfileData('priority', 'economy')}
                className={`p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                  profileData.priority === 'economy'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-3xl mb-2">💰</div>
                <h3 className="text-lg font-semibold mb-2">경제적으로</h3>
                <p className="text-sm text-slate-600">기름값, 수리비 절약</p>
                <div className="mt-2 text-xs text-slate-500">→ 우수한 연비, 저렴한 유지비</div>
              </button>

              <button
                onClick={() => updateProfileData('priority', 'comfort')}
                className={`p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                  profileData.priority === 'comfort'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-3xl mb-2">😌</div>
                <h3 className="text-lg font-semibold mb-2">편안하게</h3>
                <p className="text-sm text-slate-600">승차감, 조용함, 넓음</p>
                <div className="mt-2 text-xs text-slate-500">→ 편안한 시트, 정숙성</div>
              </button>

              <button
                onClick={() => updateProfileData('priority', 'style')}
                className={`p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                  profileData.priority === 'style'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-3xl mb-2">😎</div>
                <h3 className="text-lg font-semibold mb-2">멋있게</h3>
                <p className="text-sm text-slate-600">디자인, 브랜드, 남들 시선</p>
                <div className="mt-2 text-xs text-slate-500">→ 세련된 디자인, 프리미엄</div>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 진행률 표시 */}
      <Card className="carfin-glass-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-heading-lg text-slate-800">AI 맞춤 차량 분석</h2>
              <span className="text-body-sm text-green-700">{currentStep}/{totalSteps} 단계</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-slate-500">
              <span className={currentStep === 1 ? 'text-green-600 font-semibold' : ''}>💰 예산</span>
              <span className={currentStep === 2 ? 'text-green-600 font-semibold' : ''}>🎯 용도</span>
              <span className={currentStep === 3 ? 'text-green-600 font-semibold' : ''}>❤️ 가치관</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 메인 컨텐츠 */}
      <Card className="carfin-glass-card">
        <CardHeader>
          <CardTitle className="text-display-sm text-slate-800">
            {getStepTitle()}
          </CardTitle>
          <p className="text-subtitle text-slate-600">
            {getStepDescription()}
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* 단계 완료 격려 메시지 */}
          {canProceed() && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-lg">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-green-800">
                  {currentStep === 1 && '👏 좋아요! 예산이 명확해졌어요'}
                  {currentStep === 2 && '🎯 완벽해요! 사용 목적을 파악했어요'}
                  {currentStep === 3 && '🏆 준비 완료! 이제 맞춤 추천을 받을 수 있어요'}
                </h3>
              </div>
              <p className="text-sm text-green-700 text-center">
                {currentStep === 1 && '예산에 맞는 최적의 차량들을 찾아드릴게요'}
                {currentStep === 2 && '사용 목적에 딱 맞는 차량을 추천해드릴게요'}
                {currentStep === 3 && '모든 조건이 완벽합니다. 전문가 분석을 시작하세요!'}
              </p>
            </div>
          )}

          {renderStepContent()}

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between pt-6 border-t border-slate-200">
            <Button
              onClick={handlePrev}
              disabled={currentStep === 1}
              variant="outline"
              className="border-slate-300 text-slate-800 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              이전
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-2 px-6 font-semibold rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
              >
                다음
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleAnalyzePersona}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-2 px-6 font-semibold rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                전문가 분석 받기
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 현재 선택 요약 */}
      <Card className="carfin-glass-card">
        <CardContent className="p-4">
          <h3 className="text-heading-md text-slate-800 mb-3">💡 현재 선택 사항</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">예산:</span>
              <p className="text-slate-800 font-medium">
                {profileData.budget.min > 0 ? `${profileData.budget.min}-${profileData.budget.max}만원` : '미선택'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">주 용도:</span>
              <p className="text-slate-800 font-medium">
                {profileData.usage_purpose ?
                  ({ commute: '출퇴근용', weekend_trips: '나들이/여행', special_occasions: '데이트/특별한날', all_purpose: '생활 다용도' }[profileData.usage_purpose])
                  : '미선택'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">중요 가치:</span>
              <p className="text-slate-800 font-medium">
                {profileData.priority ?
                  ({ safety: '안전하게', economy: '경제적으로', comfort: '편안하게', style: '멋있게' }[profileData.priority])
                  : '미선택'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}