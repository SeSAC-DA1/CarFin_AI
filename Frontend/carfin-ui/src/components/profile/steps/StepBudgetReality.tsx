'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Calculator,
  Lightbulb,
  Target,
  ArrowRight,
  Info
} from 'lucide-react';
import { UserProfileData } from '../UserProfileWizard';

interface Props {
  data: UserProfileData;
  onUpdate: (field: keyof UserProfileData, value: any) => void;
}

interface RequiredFeature {
  name: string;
  reason: string;
  priceImpact: number; // 만원 단위 추가 비용
  essential: boolean;
}

interface BudgetRange {
  min: number;
  max: number;
  description: string;
  vehicleTypes: string[];
  tradeoffs: string[];
}

const flexibilityLevels = [
  {
    id: 'strict' as const,
    title: '딱 이 예산이에요',
    description: '더 이상은 어려워요',
    color: 'bg-red-600',
    impact: '기능을 포기하거나 중고차 고려'
  },
  {
    id: 'somewhat_flexible' as const,
    title: '조금은 늘릴 수 있어요',
    description: '+500만원 정도까지',
    color: 'bg-yellow-600',
    impact: '필수 기능은 확보 가능'
  },
  {
    id: 'very_flexible' as const,
    title: '필요하면 더 쓸 수 있어요',
    description: '좋은 차라면 투자할 의향',
    color: 'bg-green-600',
    impact: '원하는 모든 기능 확보'
  }
];

export function StepBudgetReality({ data, onUpdate }: Props) {
  const [requiredFeatures, setRequiredFeatures] = useState<RequiredFeature[]>([]);
  const [suggestedBudget, setSuggestedBudget] = useState<BudgetRange>({ min: 2000, max: 3500, description: '', vehicleTypes: [], tradeoffs: [] });
  const [customBudget, setCustomBudget] = useState([data.budget.min, data.budget.max]);

  // 걱정거리를 바탕으로 필요한 기능 분석
  useEffect(() => {
    const analyzeRequiredFeatures = (): RequiredFeature[] => {
      const features: RequiredFeature[] = [];

      data.main_concerns.forEach(concern => {
        switch (concern) {
          case 'parking_difficulty':
            features.push(
              { name: '후방 카메라', reason: '주차 시 안전 확인', priceImpact: 300, essential: true },
              { name: '주차 보조 시스템', reason: '자동 조향 지원', priceImpact: 800, essential: false },
              { name: '작은 차체', reason: '주차 공간 확보', priceImpact: -500, essential: true }
            );
            break;
          case 'child_safety':
            features.push(
              { name: '자동 긴급제동', reason: '돌발 상황 대응', priceImpact: 600, essential: true },
              { name: 'ISOFIX 카시트 고정', reason: '카시트 안전 설치', priceImpact: 200, essential: true },
              { name: '차일드락', reason: '문 임의 개방 방지', priceImpact: 100, essential: true },
              { name: '에어백 다수', reason: '충돌 시 보호', priceImpact: 400, essential: true }
            );
            break;
          case 'fuel_cost':
            features.push(
              { name: '하이브리드 엔진', reason: '연비 개선 (20km/L 이상)', priceImpact: 800, essential: false },
              { name: '소형/경차', reason: '기본 연비 우수', priceImpact: -800, essential: false },
              { name: '연비 표시 시스템', reason: '경제 운전 유도', priceImpact: 150, essential: false }
            );
            break;
          case 'space_insufficient':
            features.push(
              { name: '3열 시트 (7인승)', reason: '다인승 확보', priceImpact: 1200, essential: false },
              { name: '넓은 트렁크', reason: '짐 수납 공간', priceImpact: 400, essential: true },
              { name: 'SUV/MPV 차체', reason: '실내 공간 최대화', priceImpact: 1000, essential: false }
            );
            break;
          case 'breakdown_risk':
            features.push(
              { name: '국산 브랜드', reason: 'A/S 접근성', priceImpact: -300, essential: false },
              { name: '긴 품질보증', reason: '무상수리 연장', priceImpact: 200, essential: true },
              { name: '최신 연식', reason: '고장 가능성 최소화', priceImpact: 800, essential: false }
            );
            break;
          case 'driving_difficulty':
            features.push(
              { name: '컴팩트한 크기', reason: '조작과 시야 확보', priceImpact: -600, essential: true },
              { name: '전자식 파킹브레이크', reason: '조작 편의성', priceImpact: 300, essential: false },
              { name: '차선 유지 보조', reason: '운전 부담 감소', priceImpact: 500, essential: false }
            );
            break;
          case 'high_maintenance':
            features.push(
              { name: '경차/소형차', reason: '보험료, 세금 절약', priceImpact: -700, essential: false },
              { name: '국산차', reason: '부품비, 정비비 절약', priceImpact: -400, essential: false },
              { name: '연비 우수 차량', reason: '연료비 절약', priceImpact: -200, essential: true }
            );
            break;
          case 'image_concern':
            features.push(
              { name: '준중형 이상', reason: '적당한 크기감', priceImpact: 800, essential: false },
              { name: '브랜드 명성', reason: '인지도 있는 브랜드', priceImpact: 600, essential: false },
              { name: '최신 디자인', reason: '트렌디한 외관', priceImpact: 400, essential: false }
            );
            break;
          case 'night_safety':
            features.push(
              { name: 'LED 헤드램프', reason: '야간 시야 확보', priceImpact: 400, essential: true },
              { name: '어댑티브 크루즈', reason: '야간 운전 보조', priceImpact: 700, essential: false },
              { name: '사각지대 경고', reason: '차선 변경 안전', priceImpact: 500, essential: false }
            );
            break;
          case 'loading_unloading':
            features.push(
              { name: '낮은 로딩플로어', reason: '짐 적재 편의', priceImpact: 300, essential: true },
              { name: '전동 트렁크', reason: '자동 개폐', priceImpact: 600, essential: false },
              { name: '넓은 문 개방각', reason: '승하차 편의', priceImpact: 200, essential: true }
            );
            break;
        }
      });

      // 중복 제거 및 정렬
      const uniqueFeatures = features.reduce((acc, feature) => {
        const existing = acc.find(f => f.name === feature.name);
        if (!existing) {
          acc.push(feature);
        }
        return acc;
      }, [] as RequiredFeature[]);

      return uniqueFeatures.sort((a, b) => (b.essential ? 1 : 0) - (a.essential ? 1 : 0));
    };

    setRequiredFeatures(analyzeRequiredFeatures());
  }, [data.main_concerns]);

  // 필요 기능을 바탕으로 예산 범위 제안
  useEffect(() => {
    const calculateSuggestedBudget = (): BudgetRange => {
      let baseBudget = 2500; // 기본 예산
      let totalImpact = 0;

      // 필수 기능들의 비용 영향 계산
      requiredFeatures.forEach(feature => {
        if (feature.essential) {
          totalImpact += feature.priceImpact;
        } else {
          totalImpact += feature.priceImpact * 0.5; // 선택 기능은 50% 가중치
        }
      });

      const adjustedBudget = baseBudget + totalImpact;
      const min = Math.max(Math.round(adjustedBudget * 0.8), 1000);
      const max = Math.round(adjustedBudget * 1.3);

      // 차량 타입 결정
      let vehicleTypes: string[] = [];
      let description = '';
      let tradeoffs: string[] = [];

      if (max <= 2000) {
        vehicleTypes = ['경차', '소형차', '중고 준중형'];
        description = '경제적 선택';
        tradeoffs = ['최신 편의사양 제한', '공간 절약 필요'];
      } else if (max <= 3500) {
        vehicleTypes = ['준중형차', '소형 SUV', '하이브리드'];
        description = '합리적 선택';
        tradeoffs = ['고급 옵션 일부 포기', '브랜드 선택 제한'];
      } else if (max <= 5000) {
        vehicleTypes = ['중형차', 'SUV', '프리미엄 브랜드'];
        description = '여유로운 선택';
        tradeoffs = ['원하는 기능 대부분 확보'];
      } else {
        vehicleTypes = ['대형차', '고급 SUV', '수입차'];
        description = '프리미엄 선택';
        tradeoffs = ['모든 원하는 기능 확보 가능'];
      }

      return {
        min,
        max,
        description,
        vehicleTypes,
        tradeoffs
      };
    };

    if (requiredFeatures.length > 0) {
      const suggested = calculateSuggestedBudget();
      setSuggestedBudget(suggested);
      setCustomBudget([suggested.min, suggested.max]);
      onUpdate('budget', { min: suggested.min, max: suggested.max });
    }
  }, [requiredFeatures]);

  const handleFlexibilitySelect = (flexibility: UserProfileData['budget_flexibility']) => {
    onUpdate('budget_flexibility', flexibility);
  };

  const handleCustomBudgetChange = (values: number[]) => {
    setCustomBudget(values);
    onUpdate('budget', { min: values[0], max: values[1] });
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}억`;
    } else {
      return `${price.toLocaleString()}만원`;
    }
  };

  const calculateMonthlyPayment = (price: number) => {
    const principal = price * 10000;
    const monthlyRate = 0.045 / 12;
    const months = 60;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
                   (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment / 10000);
  };

  return (
    <div className="space-y-8">
      {/* 필요 기능 분석 결과 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-gray-900">🔍 갱정 해결을 위한 필요 기능</h3>
        <p className="text-body-sm text-gray-600">
          선택하신 걱정거리들을 해결하려면 이런 기능들이 필요해요
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requiredFeatures.slice(0, 8).map((feature, index) => (
            <Card key={index} className="carfin-glass-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-heading-sm text-gray-900">{feature.name}</h4>
                      {feature.essential && (
                        <Badge className="bg-red-600 text-white text-xs">필수</Badge>
                      )}
                    </div>
                    <p className="text-body-sm text-gray-600 mb-2">{feature.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      feature.priceImpact > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {feature.priceImpact > 0 ? '+' : ''}{feature.priceImpact}만원
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 제안 예산 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-gray-900">💰 제안 예산 범위</h3>

        <Card className="carfin-glass-card border-blue-500/50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Lightbulb className="w-6 h-6 text-yellow-400" />
                <h4 className="text-heading-lg text-gray-900">추천 예산</h4>
              </div>

              <div className="text-display-sm text-blue-300">
                {formatPrice(suggestedBudget.min)} ~ {formatPrice(suggestedBudget.max)}
              </div>

              <p className="text-body-lg text-gray-600">{suggestedBudget.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-body-sm text-gray-600 mb-2">추천 차량 타입</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {suggestedBudget.vehicleTypes.map((type, index) => (
                      <Badge
                        key={index}
                        className="bg-blue-600/20 text-blue-300 border-blue-500/50"
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-body-sm text-gray-600 mb-2">예상 월 납입금</p>
                  <p className="text-heading-lg text-gray-900">
                    {calculateMonthlyPayment((suggestedBudget.min + suggestedBudget.max) / 2)}만원
                  </p>
                  <p className="text-xs text-gray-600">(60개월 4.5% 기준)</p>
                </div>

                <div className="text-center">
                  <p className="text-body-sm text-gray-600 mb-2">타협점</p>
                  <div className="space-y-1">
                    {suggestedBudget.tradeoffs.slice(0, 2).map((tradeoff, index) => (
                      <p key={index} className="text-xs text-gray-600">{tradeoff}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 예산 조정 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-gray-900">🎚️ 예산 조정</h3>

        <Card className="carfin-glass-card">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">실제 예산 범위</span>
                <span className="text-blue-300 font-bold">
                  {formatPrice(customBudget[0])} ~ {formatPrice(customBudget[1])}
                </span>
              </div>

              <Slider
                value={customBudget}
                onValueChange={handleCustomBudgetChange}
                min={500}
                max={8000}
                step={100}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-gray-600">
                <span>500만원</span>
                <span>3,000만원</span>
                <span>8,000만원</span>
              </div>
            </div>

            {/* 예산 차이 분석 */}
            {(customBudget[1] < suggestedBudget.min || customBudget[0] > suggestedBudget.max) && (
              <div className="bg-yellow-800/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-medium mb-1">예산 조정 필요</p>
                    {customBudget[1] < suggestedBudget.min ? (
                      <p className="text-yellow-200 text-sm">
                        걱정거리 해결을 위해서는 예산을 {formatPrice(suggestedBudget.min - customBudget[1])} 더 늘리시거나,
                        일부 기능을 포기하셔야 할 수 있어요.
                      </p>
                    ) : (
                      <p className="text-yellow-200 text-sm">
                        충분한 예산으로 원하는 모든 기능을 확보하실 수 있어요!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 예산 유연성 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-gray-900">🤔 예산 유연성은 어떠세요?</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {flexibilityLevels.map((level) => {
            const isSelected = data.budget_flexibility === level.id;

            return (
              <Card
                key={level.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'carfin-glass-card border-green-500 bg-green-500/20'
                    : 'carfin-glass-card border-slate-300 hover:border-green-300'
                }`}
                onClick={() => handleFlexibilitySelect(level.id)}
              >
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className={`${level.color} p-3 rounded-lg mx-auto w-fit`}>
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-heading-md text-gray-900">{level.title}</h4>
                    <p className="text-body-sm text-gray-600">{level.description}</p>
                    <p className="text-xs text-gray-600">{level.impact}</p>

                    {isSelected && (
                      <div className="flex justify-center">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 최종 요약 */}
      {data.budget_flexibility && (
        <div className="bg-slate-50 rounded-lg p-6 space-y-4">
          <h4 className="text-heading-md text-green-600">🎯 예산 분석 완료!</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">확정 예산 범위:</p>
              <p className="text-heading-lg text-gray-900">
                {formatPrice(customBudget[0])} ~ {formatPrice(customBudget[1])}
              </p>
              <p className="text-sm text-gray-600">
                (월 {calculateMonthlyPayment(customBudget[1])}만원 이하)
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">예산 유연성:</p>
              <p className="text-heading-lg text-gray-900">
                {flexibilityLevels.find(l => l.id === data.budget_flexibility)?.title}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            이제 모든 정보가 준비되었습니다! AI가 분석하여 최적의 차량을 추천해드릴게요.
          </p>
        </div>
      )}
    </div>
  );
}