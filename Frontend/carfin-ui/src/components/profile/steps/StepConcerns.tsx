'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Shield,
  Fuel,
  ParkingCircle,
  Baby,
  DollarSign,
  Wrench,
  Users,
  Navigation,
  Truck,
  Car,
  Heart,
  CheckCircle,
  X
} from 'lucide-react';
import { UserProfileData } from '../UserProfileWizard';

interface Props {
  data: UserProfileData;
  onUpdate: (field: keyof UserProfileData, value: any) => void;
}

interface Concern {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  category: 'safety' | 'convenience' | 'economy' | 'space' | 'reliability' | 'image';
  relevance: number; // 0-100, 사용자 프로필에 따른 관련성
}

// 기본 걱정거리들
const baseConcerns: Omit<Concern, 'relevance'>[] = [
  {
    id: 'parking_difficulty',
    title: '주차할 때 부딪힐까 봐 걱정돼요',
    description: '좁은 주차공간에서 차 다루기 어려울까요?',
    icon: ParkingCircle,
    color: 'bg-red-600',
    category: 'convenience'
  },
  {
    id: 'child_safety',
    title: '아이들 안전이 걱정돼요',
    description: '카시트 설치, 문 끼임, 안전벨트 등',
    icon: Baby,
    color: 'bg-green-600',
    category: 'safety'
  },
  {
    id: 'fuel_cost',
    title: '기름값이 너무 많이 나올까 봐요',
    description: '연비 나빠서 유지비 부담되면 어쩌죠?',
    icon: Fuel,
    color: 'bg-yellow-600',
    category: 'economy'
  },
  {
    id: 'space_insufficient',
    title: '공간이 부족할까 봐요',
    description: '사람도 짐도 다 들어갈까요?',
    icon: Users,
    color: 'bg-blue-600',
    category: 'space'
  },
  {
    id: 'breakdown_risk',
    title: '고장이 자주 날까 봐 걱정돼요',
    description: '수리비, A/S, 신뢰성 문제',
    icon: Wrench,
    color: 'bg-orange-600',
    category: 'reliability'
  },
  {
    id: 'driving_difficulty',
    title: '운전하기 어려울까 봐요',
    description: '차가 너무 크거나 조작이 복잡하면?',
    icon: Navigation,
    color: 'bg-purple-600',
    category: 'convenience'
  },
  {
    id: 'high_maintenance',
    title: '유지비가 너무 많이 들까 봐요',
    description: '보험료, 세금, 부품비까지 생각하면...',
    icon: DollarSign,
    color: 'bg-red-600',
    category: 'economy'
  },
  {
    id: 'image_concern',
    title: '남들이 어떻게 생각할까요?',
    description: '너무 촌스럽거나 과시용으로 보일까 봐',
    icon: Heart,
    color: 'bg-pink-600',
    category: 'image'
  },
  {
    id: 'night_safety',
    title: '밤에 운전하기 무서워요',
    description: '조명, 시야, 안전 기능이 걱정돼요',
    icon: Shield,
    color: 'bg-indigo-600',
    category: 'safety'
  },
  {
    id: 'loading_unloading',
    title: '짐 싣고 내리기 힘들까요?',
    description: '트렁크 높이, 문 크기 등이 걱정돼요',
    icon: Truck,
    color: 'bg-gray-600',
    category: 'convenience'
  }
];

const priorities = [
  {
    id: 'safety' as const,
    title: '안전성',
    description: '나와 가족의 안전이 최우선',
    icon: Shield,
    color: 'bg-green-600'
  },
  {
    id: 'convenience' as const,
    title: '편의성',
    description: '사용하기 편하고 간편해야 함',
    icon: CheckCircle,
    color: 'bg-blue-600'
  },
  {
    id: 'economy' as const,
    title: '경제성',
    description: '구매비용과 유지비가 합리적',
    icon: DollarSign,
    color: 'bg-yellow-600'
  },
  {
    id: 'space' as const,
    title: '공간성',
    description: '사람과 짐을 충분히 수용',
    icon: Users,
    color: 'bg-purple-600'
  },
  {
    id: 'reliability' as const,
    title: '신뢰성',
    description: '고장 없이 오래 사용하고 싶음',
    icon: Wrench,
    color: 'bg-orange-600'
  },
  {
    id: 'image' as const,
    title: '이미지',
    description: '스타일과 브랜드가 중요함',
    icon: Heart,
    color: 'bg-pink-600'
  }
];

export function StepConcerns({ data, onUpdate }: Props) {
  const [relevantConcerns, setRelevantConcerns] = useState<Concern[]>([]);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(data.main_concerns || []);
  const [selectedPriorities, setSelectedPriorities] = useState<UserProfileData['priorities']>(data.priorities || []);

  // 사용자 프로필에 따른 걱정거리 관련성 계산
  useEffect(() => {
    const calculateRelevance = (concern: Omit<Concern, 'relevance'>): number => {
      let relevance = 50; // 기본값

      // 가족 형태에 따른 가중치
      if (data.family_type === 'young_parent' && concern.id === 'child_safety') relevance += 40;
      if (data.family_type === 'single' && concern.id === 'space_insufficient') relevance -= 20;
      if (data.family_type === 'newlywed' && concern.id === 'image_concern') relevance += 20;
      if (data.family_type === 'retiree' && concern.id === 'breakdown_risk') relevance += 30;

      // 주거환경에 따른 가중치
      if (data.housing?.includes('street') && concern.id === 'parking_difficulty') relevance += 35;
      if (data.housing?.includes('apartment') && concern.id === 'driving_difficulty') relevance += 15;

      // 운전경험에 따른 가중치
      if (data.driving_experience === 'beginner') {
        if (concern.id === 'parking_difficulty') relevance += 30;
        if (concern.id === 'driving_difficulty') relevance += 25;
      }

      // 사용목적에 따른 가중치
      if (data.main_purpose === 'family_trips' && concern.id === 'space_insufficient') relevance += 25;
      if (data.main_purpose === 'commute' && concern.id === 'fuel_cost') relevance += 30;
      if (data.main_purpose === 'business' && concern.id === 'image_concern') relevance += 25;

      // 사용빈도에 따른 가중치
      if (data.frequency === 'daily') {
        if (concern.id === 'fuel_cost') relevance += 20;
        if (concern.id === 'breakdown_risk') relevance += 15;
      }

      // 탑승패턴에 따른 가중치
      if (data.typical_passengers === 'family_with_kids' && concern.id === 'child_safety') relevance += 35;
      if (data.typical_passengers === 'alone' && concern.id === 'space_insufficient') relevance -= 25;

      return Math.min(Math.max(relevance, 0), 100);
    };

    const concernsWithRelevance = baseConcerns.map(concern => ({
      ...concern,
      relevance: calculateRelevance(concern)
    }));

    // 관련성 높은 순으로 정렬하고 상위 8개 선택
    const sortedConcerns = concernsWithRelevance
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 8);

    setRelevantConcerns(sortedConcerns);
  }, [data]);

  const handleConcernToggle = (concernId: string) => {
    const newConcerns = selectedConcerns.includes(concernId)
      ? selectedConcerns.filter(id => id !== concernId)
      : [...selectedConcerns, concernId];

    setSelectedConcerns(newConcerns);
    onUpdate('main_concerns', newConcerns);
  };

  const handlePriorityToggle = (priority: UserProfileData['priorities'][0]) => {
    const newPriorities = selectedPriorities.includes(priority)
      ? selectedPriorities.filter(p => p !== priority)
      : [...selectedPriorities, priority];

    setSelectedPriorities(newPriorities);
    onUpdate('priorities', newPriorities);
  };

  const getSelectedConcernTitles = () => {
    return relevantConcerns
      .filter(concern => selectedConcerns.includes(concern.id))
      .map(concern => concern.title);
  };

  return (
    <div className="space-y-8">
      {/* 맞춤형 걱정거리 */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-heading-lg text-gray-900">😰 이런 게 걱정되시지 않나요?</h3>
          <p className="text-body-sm text-gray-600">
            앞서 선택하신 내용을 바탕으로 예상 걱정거리들을 준비했어요
          </p>
          <p className="text-xs text-green-600">
            해당되는 걱정거리들을 모두 선택해주세요 (복수 선택 가능)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relevantConcerns.map((concern) => {
            const Icon = concern.icon;
            const isSelected = selectedConcerns.includes(concern.id);

            return (
              <Card
                key={concern.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'carfin-glass-card border-red-500 bg-red-500/20'
                    : 'carfin-glass-card border-slate-300 hover:border-green-300'
                }`}
                onClick={() => handleConcernToggle(concern.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`${concern.color} p-3 rounded-lg flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-heading-md text-gray-900 mb-1">{concern.title}</h4>
                      <p className="text-body-sm text-gray-600 mb-2">{concern.description}</p>

                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-xs border-slate-300 text-gray-700"
                        >
                          관련도 {concern.relevance}%
                        </Badge>

                        {isSelected ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-5 h-5 text-red-400" />
                            <span className="text-xs text-red-600">선택됨</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600">클릭하여 선택</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 우선순위 선택 */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-heading-lg text-gray-900">⭐ 그중에서도 가장 중요한 것은?</h3>
          <p className="text-body-sm text-gray-600">
            선택하신 걱정거리들을 해결하는 데 가장 중요한 요소들을 고르세요
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {priorities.map((priority) => {
            const Icon = priority.icon;
            const isSelected = selectedPriorities.includes(priority.id);

            return (
              <Card
                key={priority.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'carfin-glass-card border-green-500 bg-green-500/20'
                    : 'carfin-glass-card border-slate-300 hover:border-green-300'
                }`}
                onClick={() => handlePriorityToggle(priority.id)}
              >
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className={`${priority.color} p-3 rounded-lg mx-auto w-fit`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-heading-md text-gray-900">{priority.title}</h4>
                    <p className="text-body-sm text-gray-600">{priority.description}</p>

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

      {/* 선택 결과 요약 */}
      {selectedConcerns.length > 0 && selectedPriorities.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-6 space-y-4">
          <h4 className="text-heading-md text-green-600">💡 걱정거리 요약</h4>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-2">선택한 걱정거리:</p>
              <div className="flex flex-wrap gap-2">
                {getSelectedConcernTitles().map((title, index) => (
                  <Badge
                    key={index}
                    className="bg-red-600/20 text-red-300 border-red-500/50"
                  >
                    {title}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">중요 우선순위:</p>
              <div className="flex flex-wrap gap-2">
                {selectedPriorities.map((priority) => {
                  const priorityData = priorities.find(p => p.id === priority);
                  return (
                    <Badge
                      key={priority}
                      className="bg-green-600/20 text-green-300 border-green-500/50"
                    >
                      {priorityData?.title}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            이제 이런 걱정들을 해결할 수 있는 차량과 예산을 확인해보세요!
          </p>
        </div>
      )}
    </div>
  );
}