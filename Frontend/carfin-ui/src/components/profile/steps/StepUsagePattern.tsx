'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Palmtree,
  Mountain,
  ShoppingCart,
  Baby,
  Calendar,
  CalendarDays,
  CalendarX,
  User,
  Users,
  Users2,
  UsersRound,
  Navigation,
  Building,
  Trees,
  Car,
  MapPin
} from 'lucide-react';
import { UserProfileData } from '../UserProfileWizard';

interface Props {
  data: UserProfileData;
  onUpdate: (field: keyof UserProfileData, value: any) => void;
}

const mainPurposes = [
  {
    id: 'commute' as const,
    title: '출퇴근용',
    description: '매일 회사 왔다갔다',
    icon: Briefcase,
    color: 'bg-blue-600',
    features: ['연비 중요', '편안한 시트', '정숙성'],
    scenarios: ['평일 매일 40분', '도심 주행', '혼자 이용']
  },
  {
    id: 'family_trips' as const,
    title: '가족 나들이',
    description: '온 가족이 함께 여행',
    icon: Users,
    color: 'bg-green-600',
    features: ['넓은 공간', '짐 수납', '안전성'],
    scenarios: ['주말 여행', '4-5명 탑승', '장거리 이동']
  },
  {
    id: 'weekend_leisure' as const,
    title: '주말 레저',
    description: '취미, 운동, 여가 활동',
    icon: Mountain,
    color: 'bg-purple-600',
    features: ['스포티함', '활동성', '실용성'],
    scenarios: ['골프장', '캠핑', '스포츠 장비']
  },
  {
    id: 'business' as const,
    title: '업무/영업용',
    description: '일 때문에 이곳저곳',
    icon: Building,
    color: 'bg-orange-600',
    features: ['고급스러움', '신뢰성', '연비'],
    scenarios: ['고객 미팅', '브랜드 이미지', '긴 운행']
  },
  {
    id: 'daily_errands' as const,
    title: '생활 용무',
    description: '마트, 병원, 학원 등',
    icon: ShoppingCart,
    color: 'bg-red-600',
    features: ['주차 편의', '연비', '편리성'],
    scenarios: ['근거리 이동', '아이 픽업', '장보기']
  }
];

const frequencies = [
  {
    id: 'daily' as const,
    title: '거의 매일',
    description: '주 5일 이상 사용',
    icon: Calendar,
    color: 'bg-red-600',
    impact: ['연비 매우 중요', '내구성 필수', '편의사양 중요']
  },
  {
    id: 'weekend_only' as const,
    title: '주말에만',
    description: '주 1-2회 정도',
    icon: CalendarDays,
    color: 'bg-blue-600',
    impact: ['연비보다 성능', '여가용 기능', '스타일 중시']
  },
  {
    id: 'occasionally' as const,
    title: '가끔씩',
    description: '월 몇 번 정도',
    icon: CalendarX,
    color: 'bg-green-600',
    impact: ['경제적 선택', '기본 기능', '유지비 고려']
  }
];

const passengerPatterns = [
  {
    id: 'alone' as const,
    title: '혼자서만',
    description: '95% 이상 혼자 탑승',
    icon: User,
    color: 'bg-blue-600',
    needs: ['컴팩트한 크기', '개인 공간', '연비 우선']
  },
  {
    id: 'couple' as const,
    title: '주로 2명',
    description: '커플, 부부 중심',
    icon: Users2,
    color: 'bg-pink-600',
    needs: ['적당한 크기', '승차감', '스타일']
  },
  {
    id: 'family_with_kids' as const,
    title: '가족 (아이 포함)',
    description: '아이들과 함께',
    icon: Baby,
    color: 'bg-green-600',
    needs: ['넓은 공간', '안전성', '편의사양']
  },
  {
    id: 'extended_family' as const,
    title: '대가족/친구들',
    description: '5명 이상 자주 탑승',
    icon: UsersRound,
    color: 'bg-orange-600',
    needs: ['대형차', '다인승', '공간 활용']
  }
];

const routeTypes = [
  {
    id: 'city_center' as const,
    title: '도심 중심',
    description: '시내, 좁은 길, 신호등 많음',
    icon: Building,
    color: 'bg-red-600',
    considerations: ['주차 편의성', '작은 크기', '연비', '조작 편의성']
  },
  {
    id: 'suburban' as const,
    title: '교외/신도시',
    description: '넓은 도로, 적당한 거리',
    icon: Trees,
    color: 'bg-green-600',
    considerations: ['균형잡힌 성능', '승차감', '공간', '연비']
  },
  {
    id: 'highway' as const,
    title: '고속도로 주행',
    description: '장거리, 고속 주행',
    icon: Car,
    color: 'bg-blue-600',
    considerations: ['안정성', '정숙성', '파워', '안전장치']
  },
  {
    id: 'mixed' as const,
    title: '복합 (다양함)',
    description: '도심+교외+고속도로',
    icon: MapPin,
    color: 'bg-purple-600',
    considerations: ['올라운드 성능', '적응성', '신뢰성', '편의성']
  }
];

export function StepUsagePattern({ data, onUpdate }: Props) {
  const handlePurposeSelect = (purpose: UserProfileData['main_purpose']) => {
    onUpdate('main_purpose', purpose);
  };

  const handleFrequencySelect = (frequency: UserProfileData['frequency']) => {
    onUpdate('frequency', frequency);
  };

  const handlePassengerSelect = (passengers: UserProfileData['typical_passengers']) => {
    onUpdate('typical_passengers', passengers);
  };

  const handleRouteSelect = (route: UserProfileData['main_routes']) => {
    onUpdate('main_routes', route);
  };

  return (
    <div className="space-y-8">
      {/* 주 사용 목적 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-gray-900">🎯 주로 어떤 목적으로 사용하시나요?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainPurposes.map((purpose) => {
            const Icon = purpose.icon;
            const isSelected = data.main_purpose === purpose.id;

            return (
              <Card
                key={purpose.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'carfin-glass-card border-blue-500 bg-blue-500/20'
                    : 'carfin-glass-card border-slate-300 hover:border-green-300'
                }`}
                onClick={() => handlePurposeSelect(purpose.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className={`${purpose.color} p-2 rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-heading-md text-gray-900">{purpose.title}</h4>
                        <p className="text-body-sm text-gray-600">{purpose.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 font-medium">중요 기능:</p>
                      <div className="flex flex-wrap gap-1">
                        {purpose.features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-slate-300 text-gray-700"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 font-medium">예상 시나리오:</p>
                      <div className="text-xs text-gray-600">
                        {purpose.scenarios.join(' • ')}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex justify-center pt-2">
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

      {/* 사용 빈도 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-gray-900">📅 얼마나 자주 사용하시나요?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {frequencies.map((freq) => {
            const Icon = freq.icon;
            const isSelected = data.frequency === freq.id;

            return (
              <Card
                key={freq.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'carfin-glass-card border-green-500 bg-green-500/20'
                    : 'carfin-glass-card border-slate-300 hover:border-green-300'
                }`}
                onClick={() => handleFrequencySelect(freq.id)}
              >
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className={`${freq.color} p-3 rounded-lg mx-auto w-fit`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-heading-md text-gray-900">{freq.title}</h4>
                    <p className="text-body-sm text-gray-600">{freq.description}</p>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 font-medium">영향:</p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {freq.impact.map((item, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-slate-300 text-gray-700"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
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

      {/* 승차 패턴 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-gray-900">👥 주로 몇 명이 타시나요?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {passengerPatterns.map((pattern) => {
            const Icon = pattern.icon;
            const isSelected = data.typical_passengers === pattern.id;

            return (
              <Card
                key={pattern.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'carfin-glass-card border-purple-500 bg-purple-500/20'
                    : 'carfin-glass-card border-slate-300 hover:border-green-300'
                }`}
                onClick={() => handlePassengerSelect(pattern.id)}
              >
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className={`${pattern.color} p-3 rounded-lg mx-auto w-fit`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-heading-md text-gray-900">{pattern.title}</h4>
                    <p className="text-body-sm text-gray-600">{pattern.description}</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {pattern.needs.map((need, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs border-slate-300 text-gray-700"
                        >
                          {need}
                        </Badge>
                      ))}
                    </div>
                    {isSelected && (
                      <div className="flex justify-center">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
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

      {/* 주요 경로 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-gray-900">🛣️ 주로 어떤 길을 다니시나요?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {routeTypes.map((route) => {
            const Icon = route.icon;
            const isSelected = data.main_routes === route.id;

            return (
              <Card
                key={route.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'carfin-glass-card border-yellow-500 bg-yellow-500/20'
                    : 'carfin-glass-card border-slate-300 hover:border-green-300'
                }`}
                onClick={() => handleRouteSelect(route.id)}
              >
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className={`${route.color} p-3 rounded-lg mx-auto w-fit`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-heading-md text-gray-900">{route.title}</h4>
                    <p className="text-body-sm text-gray-600">{route.description}</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {route.considerations.slice(0, 2).map((consideration, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs border-slate-300 text-gray-700"
                        >
                          {consideration}
                        </Badge>
                      ))}
                    </div>
                    {isSelected && (
                      <div className="flex justify-center">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
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

      {/* 사용 패턴 요약 */}
      {data.main_purpose && data.frequency && data.typical_passengers && data.main_routes && (
        <div className="bg-slate-50 rounded-lg p-6 space-y-3">
          <h4 className="text-heading-md text-green-600">🎯 사용 패턴 요약</h4>
          <div className="text-gray-700 space-y-2">
            <p>
              <span className="text-gray-900 font-medium">
                {mainPurposes.find(p => p.id === data.main_purpose)?.title}
              </span>
              으로
              <span className="text-gray-900 font-medium">
                {frequencies.find(f => f.id === data.frequency)?.title}
              </span>
              사용하시고,
            </p>
            <p>
              <span className="text-gray-900 font-medium">
                {passengerPatterns.find(p => p.id === data.typical_passengers)?.title}
              </span>
              탑승하며
              <span className="text-gray-900 font-medium">
                {routeTypes.find(r => r.id === data.main_routes)?.title}
              </span>
              을 주로 다니시는군요!
            </p>
            <p className="text-sm text-gray-600">
              이 패턴에 맞는 최적의 차량 기능들을 다음 단계에서 확인해보세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}