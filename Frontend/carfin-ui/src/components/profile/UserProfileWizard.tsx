'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

// 단계별 컴포넌트들
import { StepLifeContext } from './steps/StepLifeContext';
import { StepUsagePattern } from './steps/StepUsagePattern';
import { StepConcerns } from './steps/StepConcerns';
import { StepBudgetReality } from './steps/StepBudgetReality';
import { PersonaAnalysisResult } from './PersonaAnalysisResult';

export interface UserProfileData {
  // 1단계: 나는 이런 사람이에요 (Life Context)
  family_type: 'single' | 'newlywed' | 'young_parent' | 'office_worker' | 'retiree' | '';
  housing: 'apartment_parking' | 'apartment_street' | 'house_garage' | 'house_street' | '';
  driving_experience: 'beginner' | 'intermediate' | 'expert' | '';

  // 2단계: 이렇게 쓸 거예요 (Usage Pattern)
  main_purpose: 'commute' | 'family_trips' | 'weekend_leisure' | 'business' | 'daily_errands' | '';
  frequency: 'daily' | 'weekend_only' | 'occasionally' | '';
  typical_passengers: 'alone' | 'couple' | 'family_with_kids' | 'extended_family' | '';
  main_routes: 'city_center' | 'suburban' | 'highway' | 'mixed' | '';

  // 3단계: 이런 게 걱정돼요 (Specific Concerns)
  main_concerns: string[]; // 동적으로 생성되는 걱정거리들
  priorities: ('safety' | 'convenience' | 'economy' | 'space' | 'reliability' | 'image')[];

  // 4단계: 현실적으로 이 정도예요 (Budget Reality)
  budget: {
    min: number;
    max: number;
  };
  budget_flexibility: 'strict' | 'somewhat_flexible' | 'very_flexible' | '';
}

interface Props {
  onComplete: (profileData: UserProfileData, personaAnalysis: any) => void;
}

export function UserProfileWizard({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<UserProfileData>({
    // 1단계: 나는 이런 사람이에요
    family_type: '',
    housing: '',
    driving_experience: '',

    // 2단계: 이렇게 쓸 거예요
    main_purpose: '',
    frequency: '',
    typical_passengers: '',
    main_routes: '',

    // 3단계: 이런 게 걱정돼요
    main_concerns: [],
    priorities: [],

    // 4단계: 현실적으로 이 정도예요
    budget: { min: 1000, max: 3000 },
    budget_flexibility: ''
  });

  const totalSteps = 4;
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
        return profileData.family_type !== '' && profileData.housing !== '' && profileData.driving_experience !== '';
      case 2:
        return profileData.main_purpose !== '' && profileData.frequency !== '' && profileData.typical_passengers !== '';
      case 3:
        return profileData.main_concerns.length > 0 && profileData.priorities.length > 0;
      case 4:
        return profileData.budget.min < profileData.budget.max && profileData.budget_flexibility !== '';
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
      console.log('🧠 맞춤 분석 시작:', profileData);

      // Gemini API를 통한 페르소나 분석
      const response = await fetch('/api/analyze-persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile: profileData
        }),
      });

      if (!response.ok) {
        throw new Error(`맞춤 분석 오류: ${response.status}`);
      }

      const analysisResult = await response.json();
      console.log('✅ 맞춤 분석 완료:', analysisResult);

      if (analysisResult.success) {
        // 분석 완료 후 결과 전달
        onComplete(profileData, analysisResult);
      } else {
        throw new Error(analysisResult.error || '맞춤 분석 실패');
      }

    } catch (error) {
      console.error('❌ 맞춤 분석 실패:', error);

      // 실패 시에도 기본 프로필로 진행
      onComplete(profileData, {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        fallbackUsed: true
      });
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return '👋 저는 이런 사람이에요';
      case 2: return '🚗 이렇게 쓸 거예요';
      case 3: return '😰 이런 게 걱정돼요';
      case 4: return '💰 현실적으로 이 정도예요';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return '나에 대해 간단히 알려주세요. 더 정확한 추천을 위해 필요해요';
      case 2: return '차를 주로 언제, 어떻게 사용할 계획인지 알려주세요';
      case 3: return '차를 선택할 때 가장 걱정되는 부분들을 선택해주세요';
      case 4: return '걱정거리를 확인했으니 현실적인 가격대를 정해보아요';
      default: return '';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepLifeContext
            data={profileData}
            onUpdate={updateProfileData}
          />
        );
      case 2:
        return (
          <StepUsagePattern
            data={profileData}
            onUpdate={updateProfileData}
          />
        );
      case 3:
        return (
          <StepConcerns
            data={profileData}
            onUpdate={updateProfileData}
          />
        );
      case 4:
        return (
          <StepBudgetReality
            data={profileData}
            onUpdate={updateProfileData}
          />
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
              <span className={currentStep === 1 ? 'text-green-600 font-semibold' : ''}>이런 사람</span>
              <span className={currentStep === 2 ? 'text-green-600 font-semibold' : ''}>이렇게 사용</span>
              <span className={currentStep === 3 ? 'text-green-600 font-semibold' : ''}>이런 걱정</span>
              <span className={currentStep === 4 ? 'text-green-600 font-semibold' : ''}>현실적 가격대</span>
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
                AI 분석 시작
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 현재 선택 요약 */}
      <Card className="carfin-glass-card">
        <CardContent className="p-4">
          <h3 className="text-heading-md text-slate-800 mb-3">💡 현재 선택 사항</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500">가족 형태:</span>
              <p className="text-slate-800 font-medium">
                {profileData.family_type ?
                  ({ single: '혼자살이', newlywed: '신혼부부', young_parent: '육아맘/파', office_worker: '직장인', retiree: '은퇴준비' }[profileData.family_type])
                  : '미선택'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">주 목적:</span>
              <p className="text-slate-800 font-medium">
                {profileData.main_purpose ?
                  ({ commute: '출퇴근', family_trips: '가족여행', weekend_leisure: '주말레저', business: '업무용', daily_errands: '생활용무' }[profileData.main_purpose])
                  : '미선택'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">걱정거리:</span>
              <p className="text-slate-800 font-medium">
                {profileData.main_concerns.length > 0 ? `${profileData.main_concerns.length}개 선택` : '미선택'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">가격대:</span>
              <p className="text-slate-800 font-medium">
                {currentStep >= 4 ? `${profileData.budget.min}~${profileData.budget.max}만원` : '아직 미정'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}