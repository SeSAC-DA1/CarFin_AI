'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Heart,
  Baby,
  Briefcase,
  Home,
  Building,
  Warehouse,
  Car,
  Award,
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import { UserProfileData } from '../UserProfileWizard';

interface Props {
  data: UserProfileData;
  onUpdate: (field: keyof UserProfileData, value: any) => void;
}

const familyTypes = [
  {
    id: 'single' as const,
    title: '혼자 살아요',
    description: '나 혼자만의 시간, 자유로운 라이프',
    icon: User,
    color: 'bg-blue-600',
    examples: ['자유로운 스케줄', '개인 취향 중시', '효율적 이동']
  },
  {
    id: 'newlywed' as const,
    title: '신혼부부예요',
    description: '둘만의 시간, 앞으로의 계획',
    icon: Heart,
    color: 'bg-pink-600',
    examples: ['데이트 드라이브', '여행 계획', '미래 준비']
  },
  {
    id: 'young_parent' as const,
    title: '육아맘/파예요',
    description: '아이와 함께, 안전이 최우선',
    icon: Baby,
    color: 'bg-green-600',
    examples: ['카시트', '안전성', '넉넉한 공간']
  },
  {
    id: 'office_worker' as const,
    title: '직장인이에요',
    description: '바쁜 일상, 실용적인 선택',
    icon: Briefcase,
    color: 'bg-orange-600',
    examples: ['출퇴근 편의', '연비', '신뢰성']
  },
  {
    id: 'retiree' as const,
    title: '은퇴준비 중이에요',
    description: '여유로운 생활, 편안함 추구',
    icon: Home,
    color: 'bg-purple-600',
    examples: ['편안한 승차감', '안정성', '여행']
  }
];

const housingTypes = [
  {
    id: 'apartment_parking' as const,
    title: '아파트 (지하주차장)',
    description: '넓은 주차공간, 큰 차도 OK',
    icon: Building,
    color: 'bg-blue-600',
    constraints: ['공간 제약 없음', '대형차 가능']
  },
  {
    id: 'apartment_street' as const,
    title: '아파트 (노상주차)',
    description: '길가 주차, 크기 고려 필요',
    icon: Car,
    color: 'bg-yellow-600',
    constraints: ['주차 난이도 고려', '중형차 선호']
  },
  {
    id: 'house_garage' as const,
    title: '주택 (차고 있음)',
    description: '전용 주차공간, 자유로운 선택',
    icon: Warehouse,
    color: 'bg-green-600',
    constraints: ['크기 제약 적음', '원하는 차량']
  },
  {
    id: 'house_street' as const,
    title: '주택 (길가주차)',
    description: '골목길 주차, 작은 차가 편해요',
    icon: Home,
    color: 'bg-red-600',
    constraints: ['소형차 선호', '주차 편의성']
  }
];

const experienceLevels = [
  {
    id: 'beginner' as const,
    title: '초보 운전자',
    description: '운전한지 얼마 안 됐어요',
    icon: HelpCircle,
    color: 'bg-red-600',
    features: ['작고 다루기 쉬운', '안전장치 풍부', '주차 보조']
  },
  {
    id: 'intermediate' as const,
    title: '보통 운전자',
    description: '어느 정도 익숙해요',
    icon: CheckCircle,
    color: 'bg-blue-600',
    features: ['적당한 크기', '기본 편의사양', '균형잡힌 성능']
  },
  {
    id: 'expert' as const,
    title: '숙련 운전자',
    description: '운전에 자신 있어요',
    icon: Award,
    color: 'bg-green-600',
    features: ['큰 차도 OK', '성능 중시', '다양한 선택지']
  }
];

export function StepLifeContext({ data, onUpdate }: Props) {
  const handleFamilyTypeSelect = (type: UserProfileData['family_type']) => {
    onUpdate('family_type', type);
  };

  const handleHousingSelect = (housing: UserProfileData['housing']) => {
    onUpdate('housing', housing);
  };

  const handleExperienceSelect = (experience: UserProfileData['driving_experience']) => {
    onUpdate('driving_experience', experience);
  };

  return (
    <div className="space-y-8">
      {/* 가족 형태 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-white">👨‍👩‍👧‍👦 가족 구성은 어떻게 되세요?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = data.family_type === type.id;

            return (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'carfin-glass-card border-blue-500 bg-blue-500/20'
                    : 'carfin-glass-card border-slate-300 hover:border-green-300'
                }`}
                onClick={() => handleFamilyTypeSelect(type.id)}
              >
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className={`${type.color} p-3 rounded-lg mx-auto w-fit`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-heading-md text-white">{type.title}</h4>
                    <p className="text-body-sm text-gray-300">{type.description}</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {type.examples.map((example, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs border-gray-500/50 text-gray-300"
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                    {isSelected && (
                      <div className="flex justify-center">
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

      {/* 주거 환경 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-white">🏠 어디서 주차하세요?</h3>
        <p className="text-body-sm text-gray-300">주차 환경에 따라 차량 크기 추천이 달라져요</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {housingTypes.map((housing) => {
            const Icon = housing.icon;
            const isSelected = data.housing === housing.id;

            return (
              <Card
                key={housing.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'carfin-glass-card border-green-500 bg-green-500/20'
                    : 'carfin-glass-card border-slate-300 hover:border-green-300'
                }`}
                onClick={() => handleHousingSelect(housing.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`${housing.color} p-3 rounded-lg flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-heading-md text-white mb-1">{housing.title}</h4>
                      <p className="text-body-sm text-gray-300 mb-3">{housing.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {housing.constraints.map((constraint, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-gray-500/50 text-gray-300"
                          >
                            {constraint}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
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

      {/* 운전 경험 */}
      <div className="space-y-4">
        <h3 className="text-heading-lg text-white">🚗 운전 실력은 어느 정도예요?</h3>
        <p className="text-body-sm text-gray-300">운전 경험에 따라 적합한 차량을 추천해드릴게요</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {experienceLevels.map((level) => {
            const Icon = level.icon;
            const isSelected = data.driving_experience === level.id;

            return (
              <Card
                key={level.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'carfin-glass-card border-purple-500 bg-purple-500/20'
                    : 'carfin-glass-card border-slate-300 hover:border-green-300'
                }`}
                onClick={() => handleExperienceSelect(level.id)}
              >
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className={`${level.color} p-3 rounded-lg mx-auto w-fit`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-heading-md text-white">{level.title}</h4>
                    <p className="text-body-sm text-gray-300">{level.description}</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {level.features.map((feature, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs border-gray-500/50 text-gray-300"
                        >
                          {feature}
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

      {/* 선택 결과 미리보기 */}
      {data.family_type && data.housing && data.driving_experience && (
        <div className="bg-slate-800/50 rounded-lg p-6 space-y-3">
          <h4 className="text-heading-md text-blue-300">💡 이런 분이시군요!</h4>
          <div className="text-gray-300 space-y-2">
            <p>
              <span className="text-white font-medium">
                {familyTypes.find(t => t.id === data.family_type)?.title}
              </span>
              이시고,
              <span className="text-white font-medium">
                {housingTypes.find(h => h.id === data.housing)?.title}
              </span>
              에서 주차하시며,
              <span className="text-white font-medium">
                {experienceLevels.find(e => e.id === data.driving_experience)?.title}
              </span>
              이시네요.
            </p>
            <p className="text-sm text-gray-400">
              이 정보를 바탕으로 가장 적합한 차량들을 추천해드리겠습니다!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}