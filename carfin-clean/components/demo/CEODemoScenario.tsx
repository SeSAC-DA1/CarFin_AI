'use client';

import { useState } from 'react';
import { ChevronRight, Building, Calculator, Car, Crown, TrendingUp } from 'lucide-react';

interface CEODemoScenarioProps {
  onStartDemo: (demoQuestion: string) => void;
  isVisible: boolean;
}

export default function CEODemoScenario({ onStartDemo, isVisible }: CEODemoScenarioProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const demoScenarios = [
    {
      id: 'simple_bmw_golf',
      title: 'BMW 골프백 차량 추천',
      description: '간단명료한 CEO 질문 시연',
      icon: <Car className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-600',
      question: 'BMW 골프백 들어가는 차량 추천해주세요',
      highlights: ['🚗 BMW 브랜드 추천', '⛳ 골프백 수납 공간', '💼 CEO 페르소나 감지', '🎯 간단한 질문으로 시작']
    },
    {
      id: 'golf_business_premium',
      title: '골프백 수납 + 비즈니스 품격',
      description: '접대골프와 거래처 미팅을 위한 최적 조합',
      icon: <Car className="w-5 h-5" />,
      color: 'from-green-500 to-emerald-600',
      question: 'IT 중소기업 대표 김정훈입니다. 주 2회 접대골프를 치는데 골프백 2개가 여유롭게 들어가야 하고, 거래처 사장님들과의 비즈니스 미팅에서도 품격을 잃지 않을 프리미엄 브랜드 차량을 찾고 있어요. BMW X3나 벤츠 GLC 정도를 생각하는데, 법인차로 등록해서 세금혜택도 받으면서 예산 6000만원 내외로 가능할까요?',
      highlights: ['⛳ 골프백 2개 수납 확인', '🏢 독일 프리미엄 브랜드', '💼 거래처 미팅 품격', '💰 법인차 절세 혜택']
    },
    {
      id: 'brand_tax_comprehensive',
      title: '브랜드 + 절세 + 골프 종합 전략',
      description: 'CEO 3대 관심사 완벽 솔루션',
      icon: <Crown className="w-5 h-5" />,
      color: 'from-purple-500 to-violet-600',
      question: '연매출 150억 중소기업 CEO입니다. 회사 이미지도 중요하고 절세도 놓칠 수 없어요. 벤츠 E클래스나 BMW 5시리즈급 세단으로 법인차 등록이 가능한지, 그리고 트렁크에 골프백이 충분히 들어가는지 궁금해요. 감가상각이나 리스, 렌탈 중에서 어떤 방식이 세금 면에서 가장 유리한지도 알고 싶습니다.',
      highlights: ['👑 E급/5시리즈 프리미엄', '🧮 감가상각 최적화', '⛳ 골프백 적재 확인', '📊 리스vs구매 비교']
    },
    {
      id: 'ceo_complete_solution',
      title: 'CEO 맞춤 올인원 솔루션',
      description: '골프+브랜드+절세 완벽 매칭',
      icon: <Building className="w-5 h-5" />,
      color: 'from-blue-500 to-indigo-600',
      question: 'IT 업계 CEO로서 모든 조건을 만족하는 차량을 찾고 있습니다. 1) 골프백 2개 + 골프화 + 캐디백까지 여유롭게 들어가야 하고, 2) 거래처 대표들과 동급 이상의 브랜드 (벤츠, BMW, 아우디), 3) 법인차 등록으로 최대한 절세 효과를 보고 싶어요. 4) 연식은 3년 이내, 5) 총 예산 7000만원 이하로 이 모든 조건을 만족하는 최적의 선택지를 추천해주세요.',
      highlights: ['🎯 5가지 조건 종합 분석', '⛳ 골프 장비 완벽 수납', '💎 프리미엄 브랜드 매칭', '💰 최대 절세 전략', '📅 3년 이내 연식']
    }
  ];

  const handleScenarioSelect = (scenario: typeof demoScenarios[0]) => {
    setSelectedScenario(scenario.id);
    setTimeout(() => {
      onStartDemo(scenario.question);
    }, 500);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200 shadow-lg mb-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl mb-4">
          <Building className="w-6 h-6" />
          <h3 className="text-lg font-bold">CEO 페르소나 데모 시나리오</h3>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
          실제 CEO가 중고차를 구매할 때 겪는 <strong>복합적 의사결정 과정</strong>을 체험해보세요.
          <br />
          골프, 비즈니스, 절세 효과를 모두 고려한 <strong>전문가급 상담</strong>을 제공합니다.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {demoScenarios.map((scenario, index) => (
          <div
            key={scenario.id}
            className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
              selectedScenario === scenario.id
                ? 'scale-105 ring-4 ring-blue-200'
                : 'hover:shadow-xl'
            }`}
            onClick={() => handleScenarioSelect(scenario)}
          >
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm h-full">
              {/* 시나리오 헤더 */}
              <div className={`bg-gradient-to-r ${scenario.color} text-white p-3 rounded-lg mb-4 flex items-center gap-3`}>
                {scenario.icon}
                <div>
                  <h4 className="font-bold text-sm">{scenario.title}</h4>
                  <p className="text-xs opacity-90">{scenario.description}</p>
                </div>
              </div>

              {/* 핵심 특징 */}
              <div className="space-y-2 mb-4">
                {scenario.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              {/* 액션 버튼 */}
              <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                selectedScenario === scenario.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}>
                <span className="text-sm font-medium text-gray-700">
                  {selectedScenario === scenario.id ? '시작하는 중...' : '시나리오 시작'}
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform ${
                  selectedScenario === scenario.id ? 'animate-pulse text-blue-600' : 'text-gray-400'
                }`} />
              </div>
            </div>

            {/* 시나리오 번호 */}
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <Calculator className="w-4 h-4" />
          <span>각 시나리오는 실제 CEO의 복합적 니즈를 반영한 전문가 상담입니다</span>
        </div>
      </div>

      {/* CEO 페르소나 정보 카드 - 강화된 버전 */}
      <div className="mt-6 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            👔
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-bold text-gray-900 text-lg">김정훈 CEO</h4>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">44세</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">IT업계</span>
            </div>
            <p className="text-sm text-gray-700 mb-4 font-medium">
              IT 중소기업 대표 | 직원 120명 | 연매출 150억 | 골프 핸디캡 18
            </p>

            {/* 복합 니즈 상세 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="bg-white px-3 py-2 rounded-lg border border-green-200 shadow-sm">
                <div className="font-bold text-green-700 flex items-center gap-1">
                  💰 예산
                </div>
                <div className="text-gray-700 mt-1">6,000만원</div>
                <div className="text-gray-500 text-xs">±1,000만원</div>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg border border-blue-200 shadow-sm">
                <div className="font-bold text-blue-700 flex items-center gap-1">
                  ⛳ 골프
                </div>
                <div className="text-gray-700 mt-1">주 2회</div>
                <div className="text-gray-500 text-xs">골프백 2개</div>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg border border-purple-200 shadow-sm">
                <div className="font-bold text-purple-700 flex items-center gap-1">
                  🏆 브랜드
                </div>
                <div className="text-gray-700 mt-1">독일차</div>
                <div className="text-gray-500 text-xs">벤츠/BMW</div>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg border border-orange-200 shadow-sm">
                <div className="font-bold text-orange-700 flex items-center gap-1">
                  📊 절세
                </div>
                <div className="text-gray-700 mt-1">법인차</div>
                <div className="text-gray-500 text-xs">감가상각</div>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg border border-indigo-200 shadow-sm">
                <div className="font-bold text-indigo-700 flex items-center gap-1">
                  🤝 미팅
                </div>
                <div className="text-gray-700 mt-1">월 10회</div>
                <div className="text-gray-500 text-xs">거래처 접대</div>
              </div>
            </div>

            {/* CEO 고민 사항 */}
            <div className="mt-4 p-3 bg-white/60 rounded-lg border border-amber-100">
              <div className="text-xs font-medium text-amber-800 mb-2">💭 CEO의 고민</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• "골프백 2개가 들어가면서도 비즈니스 미팅에서 체면을 살릴 수 있을까?"</div>
                <div>• "법인차로 등록해서 세금 혜택을 최대한 받고 싶은데..."</div>
                <div>• "거래처 사장님들도 벤츠나 BMW를 타시는데 너무 차이나면 곤란해"</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}