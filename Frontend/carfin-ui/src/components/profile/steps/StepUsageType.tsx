'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Car,
  Users,
  Mountain,
  Briefcase,
  User,
  UserCheck,
  Users2,
  UsersRound
} from 'lucide-react';
import { UserProfileData } from '../UserProfileWizard';

interface Props {
  data: UserProfileData;
  onUpdate: (field: keyof UserProfileData, value: any) => void;
}

const usageOptions = [
  {
    id: 'commute' as const,
    title: '출퇴근용',
    description: '매일 회사와 집을 오가는 용도',
    icon: Car,
    color: 'bg-blue-600',
    examples: ['도심 주행', '연비 중시', '편안한 승차감']
  },
  {
    id: 'family' as const,
    title: '가족용',
    description: '가족과 함께 이용하는 용도',
    icon: Users,
    color: 'bg-green-600',
    examples: ['넓은 공간', '안전성', '짐 공간']
  },
  {
    id: 'leisure' as const,
    title: '레저/여행용',
    description: '주말 나들이, 여행 등의 용도',
    icon: Mountain,
    color: 'bg-purple-600',
    examples: ['긴 거리', '짐 수납', '승차감']
  },
  {
    id: 'business' as const,
    title: '업무용',
    description: '비즈니스, 영업 등의 용도',
    icon: Briefcase,
    color: 'bg-orange-600',
    examples: ['고급스러움', '신뢰성', '브랜드']
  }
];

const passengerOptions = [
  { value: 1, icon: User, label: '혼자' },
  { value: 2, icon: UserCheck, label: '2명 (부부)' },
  { value: 3, icon: Users2, label: '3명' },
  { value: 4, icon: Users, label: '4명 (가족)' },
  { value: 5, icon: UsersRound, label: '5명' },
  { value: 6, icon: UsersRound, label: '6명 이상' }
];

export function StepUsageType({ data, onUpdate }: Props) {
  const handleUsageSelect = (usage: UserProfileData['usage']) => {
    onUpdate('usage', usage);
  };

  const handlePassengerSelect = (passengers: number) => {
    onUpdate('passengers', passengers);
  };

  return (
    <div className="space-y-8">
      {/* 사용 목적 선택 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-white">🚗 주로 어떤 용도로 사용하시나요?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usageOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = data.usage === option.id;

            return (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'glass-card border-blue-500 bg-blue-500/20'
                    : 'glass-card border-gray-600/50 hover:border-gray-500'
                }`}
                onClick={() => handleUsageSelect(option.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`${option.color} p-3 rounded-lg flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-heading-md text-white mb-2">{option.title}</h4>
                      <p className="text-body-sm text-gray-300 mb-3">{option.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {option.examples.map((example, index) => (
                          <Badge
                            key={index}
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

      {/* 승차 인원 선택 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-white">👥 주로 몇 명이 타시나요?</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {passengerOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = data.passengers === option.value;

            return (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'glass-card border-green-500 bg-green-500/20'
                    : 'glass-card border-gray-600/50 hover:border-gray-500'
                }`}
                onClick={() => handlePassengerSelect(option.value)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${
                    isSelected ? 'text-green-400' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    isSelected ? 'text-green-300' : 'text-gray-300'
                  }`}>
                    {option.label}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 선택 결과 미리보기 */}
      {data.usage && (
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-heading-md text-blue-300 mb-2">💡 선택하신 내용</h4>
          <div className="text-gray-300">
            <p>
              <span className="text-white font-medium">
                {usageOptions.find(opt => opt.id === data.usage)?.title}
              </span>
              으로 주로
              <span className="text-white font-medium">{data.passengers}명</span>
              이 이용하시는군요!
            </p>
            <p className="text-sm text-gray-400 mt-1">
              이 정보를 바탕으로 적합한 차량 크기와 기능을 추천해드리겠습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}