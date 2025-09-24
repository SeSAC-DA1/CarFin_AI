'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Calculator,
  TrendingUp,
  Wallet,
  CreditCard,
  Banknote
} from 'lucide-react';
import { UserProfileData } from '../UserProfileWizard';

interface Props {
  data: UserProfileData;
  onUpdate: (field: keyof UserProfileData, value: any) => void;
}

const budgetPresets = [
  {
    range: { min: 500, max: 1500 },
    label: '~1,500만원',
    description: '경차, 소형차',
    icon: Wallet,
    color: 'bg-green-600',
    examples: ['경차', '소형 해치백', '중고차']
  },
  {
    range: { min: 1500, max: 3000 },
    label: '1,500~3,000만원',
    description: '중형차, 준중형',
    icon: CreditCard,
    color: 'bg-blue-600',
    examples: ['아반떼', '쏘나타', 'K5']
  },
  {
    range: { min: 3000, max: 5000 },
    label: '3,000~5,000만원',
    description: '준대형, SUV',
    icon: Banknote,
    color: 'bg-purple-600',
    examples: ['그랜저', '팰리세이드', '쏘렌토']
  },
  {
    range: { min: 5000, max: 8000 },
    label: '5,000~8,000만원',
    description: '대형차, 프리미엄',
    icon: DollarSign,
    color: 'bg-orange-600',
    examples: ['제네시스', 'BMW', '벤츠']
  }
];

export function StepBudgetRange({ data, onUpdate }: Props) {
  const [customMode, setCustomMode] = useState(false);

  const handlePresetSelect = (preset: { min: number; max: number }) => {
    onUpdate('budget', preset);
    setCustomMode(false);
  };

  const handleCustomBudget = (values: number[]) => {
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
    // 60개월 4.5% 이자율 기준 월 납입금 계산
    const principal = price * 10000;
    const monthlyRate = 0.045 / 12;
    const months = 60;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
                   (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment / 10000);
  };

  return (
    <div className="space-y-8">
      {/* 예산 프리셋 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-white">💰 예산 범위를 선택해주세요</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetPresets.map((preset, index) => {
            const Icon = preset.icon;
            const isSelected = !customMode &&
              data.budget.min === preset.range.min &&
              data.budget.max === preset.range.max;

            return (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'glass-card border-blue-500 bg-blue-500/20'
                    : 'glass-card border-gray-600/50 hover:border-gray-500'
                }`}
                onClick={() => handlePresetSelect(preset.range)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`${preset.color} p-3 rounded-lg flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-heading-md text-white mb-1">{preset.label}</h4>
                      <p className="text-body-sm text-gray-300 mb-3">{preset.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {preset.examples.map((example, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs border-gray-500/50 text-gray-300"
                          >
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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

      {/* 커스텀 예산 설정 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-heading-lg text-white">🎯 직접 설정하기</h3>
          <Button
            onClick={() => setCustomMode(!customMode)}
            variant={customMode ? "default" : "outline"}
            className={customMode ? "cyber-button" : "border-white/20 text-white hover:bg-white/10"}
          >
            <Calculator className="w-4 h-4 mr-1" />
            {customMode ? '프리셋으로 돌아가기' : '직접 설정'}
          </Button>
        </div>

        {customMode && (
          <Card className="glass-card">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">예산 범위</span>
                  <span className="text-blue-300 font-bold">
                    {formatPrice(data.budget.min)} ~ {formatPrice(data.budget.max)}
                  </span>
                </div>

                <Slider
                  value={[data.budget.min, data.budget.max]}
                  onValueChange={handleCustomBudget}
                  min={500}
                  max={10000}
                  step={100}
                  className="w-full"
                />

                <div className="flex justify-between text-xs text-gray-400">
                  <span>500만원</span>
                  <span>5,000만원</span>
                  <span>1억원</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 금융 정보 */}
      <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
        <h4 className="text-heading-md text-blue-300 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          💡 예상 금융 정보
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">평균 차량가</p>
            <p className="text-white font-bold text-lg">
              {formatPrice((data.budget.min + data.budget.max) / 2)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm">예상 월 납입금</p>
            <p className="text-white font-bold text-lg">
              {calculateMonthlyPayment((data.budget.min + data.budget.max) / 2)}만원
            </p>
            <p className="text-xs text-gray-400">(60개월 4.5% 기준)</p>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm">차량 등급</p>
            <p className="text-white font-bold text-lg">
              {data.budget.max <= 1500 ? '경/소형' :
               data.budget.max <= 3000 ? '중형' :
               data.budget.max <= 5000 ? '준대형/SUV' : '대형/프리미엄'}
            </p>
          </div>
        </div>

        <div className="text-center text-sm text-gray-400">
          💡 실제 대출 조건은 개인 신용도에 따라 달라질 수 있습니다
        </div>
      </div>
    </div>
  );
}