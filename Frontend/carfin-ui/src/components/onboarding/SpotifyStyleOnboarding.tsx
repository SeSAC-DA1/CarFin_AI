'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Car, Zap, Fuel, DollarSign, Heart, Star, Clock, Users,
  Sparkles, TrendingUp, Shield, Award, CheckCircle, ChevronRight,
  Play, Music, Volume2, SkipForward, ArrowRight, Target
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  type: 'single' | 'multiple' | 'budget' | 'usage';
  options: Array<{
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
  }>;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'brands',
    title: '어떤 브랜드를 좋아하시나요?',
    subtitle: '좋아하는 브랜드를 모두 선택해주세요',
    type: 'multiple',
    options: [
      {
        id: 'tesla',
        label: '테슬라',
        description: '혁신적인 전기차',
        icon: <Zap className="w-6 h-6" />,
        gradient: 'from-blue-500 to-purple-600'
      },
      {
        id: 'hyundai',
        label: '현대',
        description: '신뢰할 수 있는 국산차',
        icon: <Shield className="w-6 h-6" />,
        gradient: 'from-blue-600 to-indigo-600'
      },
      {
        id: 'kia',
        label: '기아',
        description: '세련된 디자인',
        icon: <Star className="w-6 h-6" />,
        gradient: 'from-red-500 to-pink-600'
      },
      {
        id: 'bmw',
        label: 'BMW',
        description: '프리미엄 드라이빙',
        icon: <Award className="w-6 h-6" />,
        gradient: 'from-gray-700 to-black'
      },
      {
        id: 'benz',
        label: '벤츠',
        description: '럭셔리의 상징',
        icon: <Star className="w-6 h-6" />,
        gradient: 'from-amber-500 to-yellow-600'
      },
      {
        id: 'audi',
        label: '아우디',
        description: '기술의 진보',
        icon: <TrendingUp className="w-6 h-6" />,
        gradient: 'from-red-600 to-red-700'
      },
      {
        id: 'genesis',
        label: '제네시스',
        description: '국산 프리미엄',
        icon: <Sparkles className="w-6 h-6" />,
        gradient: 'from-purple-600 to-indigo-700'
      },
      {
        id: 'lexus',
        label: '렉서스',
        description: '일본의 럭셔리',
        icon: <Heart className="w-6 h-6" />,
        gradient: 'from-emerald-500 to-green-600'
      }
    ]
  },
  {
    id: 'usage',
    title: '주로 어떤 용도로 사용하시나요?',
    subtitle: '가장 많이 사용할 목적을 선택해주세요',
    type: 'single',
    options: [
      {
        id: 'commute',
        label: '출퇴근용',
        description: '매일 규칙적인 운행',
        icon: <Clock className="w-6 h-6" />,
        gradient: 'from-blue-500 to-cyan-500'
      },
      {
        id: 'family',
        label: '가족용',
        description: '가족과 함께하는 여행',
        icon: <Users className="w-6 h-6" />,
        gradient: 'from-green-500 to-emerald-500'
      },
      {
        id: 'weekend',
        label: '주말 드라이브',
        description: '여가와 취미 활동',
        icon: <Heart className="w-6 h-6" />,
        gradient: 'from-pink-500 to-rose-500'
      },
      {
        id: 'business',
        label: '업무용',
        description: '비즈니스 미팅과 영업',
        icon: <Target className="w-6 h-6" />,
        gradient: 'from-gray-600 to-gray-800'
      }
    ]
  },
  {
    id: 'fuel',
    title: '어떤 연료 타입을 선호하시나요?',
    subtitle: '환경과 경제성을 고려해서 선택해주세요',
    type: 'multiple',
    options: [
      {
        id: 'electric',
        label: '전기차',
        description: '친환경 & 조용함',
        icon: <Zap className="w-6 h-6" />,
        gradient: 'from-green-400 to-emerald-500'
      },
      {
        id: 'hybrid',
        label: '하이브리드',
        description: '연비 + 실용성',
        icon: <Fuel className="w-6 h-6" />,
        gradient: 'from-blue-400 to-green-500'
      },
      {
        id: 'gasoline',
        label: '가솔린',
        description: '편의성 + 접근성',
        icon: <Car className="w-6 h-6" />,
        gradient: 'from-orange-400 to-red-500'
      },
      {
        id: 'diesel',
        label: '디젤',
        description: '높은 연비 + 토크',
        icon: <TrendingUp className="w-6 h-6" />,
        gradient: 'from-gray-600 to-black'
      }
    ]
  },
  {
    id: 'budget',
    title: '예산은 어느 정도 생각하고 계시나요?',
    subtitle: '편안하게 구매할 수 있는 범위를 선택해주세요',
    type: 'single',
    options: [
      {
        id: 'budget1',
        label: '1,000만원 이하',
        description: '경제적인 선택',
        icon: <DollarSign className="w-6 h-6" />,
        gradient: 'from-green-400 to-emerald-500'
      },
      {
        id: 'budget2',
        label: '1,000 - 2,500만원',
        description: '합리적인 범위',
        icon: <DollarSign className="w-6 h-6" />,
        gradient: 'from-blue-400 to-indigo-500'
      },
      {
        id: 'budget3',
        label: '2,500 - 5,000만원',
        description: '프리미엄 옵션',
        icon: <DollarSign className="w-6 h-6" />,
        gradient: 'from-purple-400 to-pink-500'
      },
      {
        id: 'budget4',
        label: '5,000만원 이상',
        description: '럭셔리 선택',
        icon: <DollarSign className="w-6 h-6" />,
        gradient: 'from-amber-400 to-orange-500'
      }
    ]
  }
];

interface UserPreferences {
  brands: string[];
  usage: string;
  fuel: string[];
  budget: string;
}

interface SpotifyStyleOnboardingProps {
  onComplete: (preferences: UserPreferences) => void;
}

export const SpotifyStyleOnboarding: React.FC<SpotifyStyleOnboardingProps> = ({
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    brands: [],
    usage: '',
    fuel: [],
    budget: ''
  });
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleOptionToggle = (optionId: string) => {
    if (currentStepData.type === 'single') {
      setSelectedOptions([optionId]);
    } else {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleNext = () => {
    // 현재 단계의 선택사항을 preferences에 저장
    const stepData = { ...preferences };

    switch (currentStepData.id) {
      case 'brands':
        stepData.brands = selectedOptions;
        break;
      case 'usage':
        stepData.usage = selectedOptions[0] || '';
        break;
      case 'fuel':
        stepData.fuel = selectedOptions;
        break;
      case 'budget':
        stepData.budget = selectedOptions[0] || '';
        break;
    }

    setPreferences(stepData);

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOptions([]);
    } else {
      // 온보딩 완료
      onComplete(stepData);
    }
  };

  const canProceed = selectedOptions.length > 0;

  // 현재 단계의 이전 선택사항 복원
  useEffect(() => {
    switch (currentStepData.id) {
      case 'brands':
        setSelectedOptions(preferences.brands);
        break;
      case 'usage':
        setSelectedOptions(preferences.usage ? [preferences.usage] : []);
        break;
      case 'fuel':
        setSelectedOptions(preferences.fuel);
        break;
      case 'budget':
        setSelectedOptions(preferences.budget ? [preferences.budget] : []);
        break;
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Spotify 스타일 헤더 */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">CarFin</span>
        </div>

        <div className="flex items-center space-x-4">
          <Progress value={progress} className="w-48" />
          <span className="text-sm text-gray-400">
            {currentStep + 1} / {ONBOARDING_STEPS.length}
          </span>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* 타이틀 섹션 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {currentStepData.title}
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {currentStepData.subtitle}
          </p>
        </div>

        {/* 옵션 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {currentStepData.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id);

            return (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  isSelected
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400 shadow-lg shadow-green-500/25'
                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'
                }`}
                onClick={() => handleOptionToggle(option.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-r ${option.gradient}`}>
                    {option.icon}
                  </div>

                  <h3 className="font-semibold mb-2 text-white">
                    {option.label}
                  </h3>

                  <p className="text-sm text-gray-400 mb-4">
                    {option.description}
                  </p>

                  {isSelected && (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            이전
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">
              {currentStepData.type === 'multiple' ? '여러 개 선택 가능' : '하나만 선택'}
            </p>
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
              canProceed
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? (
              <>
                완료하기
                <Play className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* 선택된 옵션 요약 (마지막 단계에서만) */}
        {currentStep === ONBOARDING_STEPS.length - 1 && (
          <div className="mt-12 p-6 bg-gray-800/30 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-center">🎯 당신의 취향</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">선호 브랜드:</span>
                <span className="ml-2 text-green-400">{preferences.brands.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-400">사용 목적:</span>
                <span className="ml-2 text-green-400">{preferences.usage}</span>
              </div>
              <div>
                <span className="text-gray-400">연료 타입:</span>
                <span className="ml-2 text-green-400">{preferences.fuel.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-400">예산:</span>
                <span className="ml-2 text-green-400">{
                  currentStepData.options.find(opt => opt.id === preferences.budget)?.label
                }</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyStyleOnboarding;