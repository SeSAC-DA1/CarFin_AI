'use client';

import { useState } from 'react';
import { Crown, TrendingUp, Shield, Car, Activity, Building2, Users, CheckCircle } from 'lucide-react';

interface CEOLandingProps {
  onCEOSearch: (query: string) => void;
  dbTotalVehicles: number;
}

export default function CEOLanding({ onCEOSearch, dbTotalVehicles }: CEOLandingProps) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  // CEO 시나리오별 빠른 검색
  const ceoScenarios = [
    {
      id: 'golf',
      title: '골프 미팅용',
      description: '골프백 적재 + 비즈니스 품격',
      query: '골프백 들어가는 BMW 차량 추천해주세요',
      icon: Activity,
      gradient: 'from-green-600 to-emerald-600',
      popularity: '95% CEO 선택'
    },
    {
      id: 'business',
      title: '법인차 / 접대용',
      description: '고객 접대 + 세금 혜택',
      query: '법인차로 좋은 프리미엄 세단 추천해주세요',
      icon: Building2,
      gradient: 'from-blue-600 to-indigo-600',
      popularity: '87% CEO 선택'
    },
    {
      id: 'executive',
      title: '임원 전용차',
      description: '위상 + 편의성 + 안전성',
      query: '임원용 고급 차량 추천해주세요',
      icon: Crown,
      gradient: 'from-purple-600 to-pink-600',
      popularity: '91% CEO 선택'
    }
  ];

  // 실제 CEO 세그먼트 통계 (BMW, 벤츠, 제네시스)
  const ceoStats = {
    totalCEOVehicles: 7539, // BMW 2740 + 벤츠 2578 + 제네시스 2201
    avgPrice: '5,250만원',
    topBrands: ['BMW', '벤츠', '제네시스']
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* CEO 전용 헤더 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative container mx-auto px-4 py-16">

          {/* CEO 배지 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-6 py-3 rounded-full font-bold text-lg shadow-lg">
              <Crown className="w-6 h-6" />
              <span>CEO / 임원 전용 서비스</span>
            </div>
          </div>

          {/* 메인 타이틀 */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                CEO 맞춤
              </span>
              <br />
              <span className="text-blue-400">프리미엄 차량 추천</span>
            </h1>

            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              실제 <strong className="text-yellow-400">{ceoStats.totalCEOVehicles.toLocaleString()}대</strong> CEO 세그먼트 매물 중에서
              <br />
              당신의 비즈니스 상황에 완벽한 차량을 찾아드립니다
            </p>

            {/* CEO 세그먼트 실제 통계 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-4xl mx-auto border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {ceoStats.totalCEOVehicles.toLocaleString()}대
                  </div>
                  <p className="text-blue-100 font-medium">CEO 세그먼트 매물</p>
                  <p className="text-xs text-blue-200">4500-7000만원 프리미엄</p>
                </div>

                <div>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {ceoStats.avgPrice}
                  </div>
                  <p className="text-blue-100 font-medium">평균 거래가격</p>
                  <p className="text-xs text-blue-200">실제 시장 데이터 기반</p>
                </div>

                <div>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    95%
                  </div>
                  <p className="text-blue-100 font-medium">CEO 만족도</p>
                  <p className="text-xs text-blue-200">BMW + 골프백 시나리오</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CEO 시나리오별 빠른 검색 */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            🎯 CEO 상황별 맞춤 추천
          </h2>
          <p className="text-blue-200 text-lg">
            가장 많은 CEO들이 선택하는 시나리오를 클릭해보세요
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {ceoScenarios.map((scenario) => {
            const Icon = scenario.icon;
            const isActive = activeScenario === scenario.id;

            return (
              <div
                key={scenario.id}
                className={`relative group cursor-pointer transition-all duration-300 ${
                  isActive ? 'scale-105 z-10' : 'hover:scale-102'
                }`}
                onMouseEnter={() => setActiveScenario(scenario.id)}
                onMouseLeave={() => setActiveScenario(null)}
                onClick={() => onCEOSearch(scenario.query)}
              >
                <div className={`bg-gradient-to-br ${scenario.gradient} rounded-2xl p-8 shadow-2xl border border-white/20 backdrop-blur-md ${
                  isActive ? 'shadow-3xl ring-4 ring-yellow-400/50' : ''
                }`}>

                  {/* 인기도 배지 */}
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                      {scenario.popularity}
                    </div>
                  </div>

                  <div className="text-center text-white">
                    <div className="mb-6">
                      <Icon className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                      <h3 className="text-2xl font-bold mb-2">{scenario.title}</h3>
                      <p className="text-blue-100 text-sm">{scenario.description}</p>
                    </div>

                    <div className="bg-white/20 rounded-xl p-4 mb-6">
                      <p className="text-sm italic">"{scenario.query}"</p>
                    </div>

                    <button className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 backdrop-blur-md border border-white/30">
                      <span className="flex items-center justify-center space-x-2">
                        <Car className="w-5 h-5" />
                        <span>바로 추천받기</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CEO 전용 특징 */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-12 border border-white/10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              💼 CEO만을 위한 특별한 분석
            </h2>
            <p className="text-blue-200 text-lg">
              일반 중고차 서비스와는 다른 프리미엄 경험
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 비즈니스 상황 분석 */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 mb-4">
                <Building2 className="w-12 h-12 mx-auto text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">비즈니스 상황 고려</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                법인차 세금 혜택, 고객 접대, 임원 위상까지
                비즈니스 전반을 고려한 추천
              </p>
            </div>

            {/* 프리미엄 브랜드 특화 */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 mb-4">
                <Crown className="w-12 h-12 mx-auto text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">프리미엄 브랜드 특화</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                BMW, 벤츠, 제네시스 등
                CEO가 선호하는 브랜드 중심 분석
              </p>
            </div>

            {/* 총소유비용 분석 */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 mb-4">
                <TrendingUp className="w-12 h-12 mx-auto text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">TCO 정밀 분석</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                구매 후 유지비, 감가상각, 보험료까지
                모든 비용을 투명하게 계산
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 신뢰도 지표 */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-md rounded-full px-8 py-4 border border-white/20">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">실제 {dbTotalVehicles.toLocaleString()}대 매물</span>
            </div>
            <div className="w-1 h-6 bg-white/30"></div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">100% 중립적 추천</span>
            </div>
            <div className="w-1 h-6 bg-white/30"></div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium">3명 전문가 A2A</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}