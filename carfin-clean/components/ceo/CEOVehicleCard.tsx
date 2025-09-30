'use client';

import { Crown, TrendingUp, Shield, Star, MapPin, Calendar, Gauge, Fuel, Award, ExternalLink } from 'lucide-react';

interface VehicleData {
  vehicleid: number;
  manufacturer: string;
  model: string;
  modelyear: number;
  price: number;
  distance: number;
  fueltype: string;
  cartype: string;
  location: string;
  colorname?: string;
  detailurl?: string;
  photo?: string;
  reranking_score?: number;
  reranking_reasoning?: string;
  personalized_insights?: string[];
  option_analysis?: {
    total_option_value: number;
    option_highlights: string[];
    missing_critical_options: string[];
    persona_fit_score: number;
    recommendation: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    value_justification: string[];
  };
}

interface CEOVehicleCardProps {
  vehicle: VehicleData;
  rank: number;
  isTopChoice?: boolean;
}

export default function CEOVehicleCard({ vehicle, rank, isTopChoice = false }: CEOVehicleCardProps) {
  // CEO 선호 브랜드 판정
  const isPremiumBrand = ['BMW', '벤츠', '아우디', '제네시스', '렉서스'].includes(vehicle.manufacturer);

  // 점수에 따른 등급 결정
  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'S급', color: 'text-yellow-500', bg: 'bg-gradient-to-r from-yellow-500 to-amber-500' };
    if (score >= 80) return { grade: 'A급', color: 'text-blue-500', bg: 'bg-gradient-to-r from-blue-500 to-indigo-500' };
    if (score >= 70) return { grade: 'B급', color: 'text-green-500', bg: 'bg-gradient-to-r from-green-500 to-emerald-500' };
    return { grade: 'C급', color: 'text-gray-500', bg: 'bg-gradient-to-r from-gray-500 to-slate-500' };
  };

  // 옵션 분석 결과에 따른 CEO 적합도
  const getCEOFitness = () => {
    const optionScore = vehicle.option_analysis?.total_option_value || 0;
    const rerankScore = vehicle.reranking_score || 0;
    const avgScore = (optionScore + rerankScore) / 2;

    if (avgScore >= 85) return { label: 'CEO 최적', color: 'text-yellow-600', icon: Crown };
    if (avgScore >= 70) return { label: 'CEO 적합', color: 'text-blue-600', icon: Star };
    return { label: 'CEO 검토', color: 'text-gray-600', icon: Shield };
  };

  const scoreGrade = getScoreGrade(vehicle.reranking_score || 0);
  const ceoFitness = getCEOFitness();
  const CEOIcon = ceoFitness.icon;

  return (
    <div className={`relative bg-white rounded-3xl shadow-2xl border ${
      isTopChoice
        ? 'border-yellow-400 ring-4 ring-yellow-400/20 bg-gradient-to-br from-yellow-50 to-amber-50'
        : isPremiumBrand
          ? 'border-blue-200 hover:border-blue-400'
          : 'border-gray-200 hover:border-gray-400'
    } transition-all duration-300 hover:shadow-3xl group`}>

      {/* 순위 배지 */}
      <div className="absolute -top-4 -left-4 z-10">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
          rank === 1 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
          rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
          rank === 3 ? 'bg-gradient-to-r from-amber-600 to-orange-600' :
          'bg-gradient-to-r from-blue-500 to-indigo-500'
        }`}>
          {rank}
        </div>
      </div>

      {/* TOP CHOICE 배지 */}
      {isTopChoice && (
        <div className="absolute -top-3 -right-3 z-10">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
            🏆 CEO 1순위
          </div>
        </div>
      )}

      {/* 프리미엄 브랜드 배지 */}
      {isPremiumBrand && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            <Crown className="w-3 h-3 inline mr-1" />
            프리미엄
          </div>
        </div>
      )}

      <div className="p-8">
        {/* 차량 기본 정보 */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {vehicle.manufacturer} {vehicle.model}
              </h3>
              <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${scoreGrade.bg}`}>
                {scoreGrade.grade}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-gray-600 mb-4">
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{vehicle.modelyear}년</span>
              </span>
              <span className="flex items-center space-x-1">
                <Gauge className="w-4 h-4" />
                <span>{vehicle.distance?.toLocaleString()}km</span>
              </span>
              <span className="flex items-center space-x-1">
                <Fuel className="w-4 h-4" />
                <span>{vehicle.fueltype}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{vehicle.location}</span>
              </span>
            </div>

            {/* 가격 */}
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {vehicle.price?.toLocaleString()}만원
            </div>

            {/* CEO 적합도 */}
            <div className="flex items-center space-x-2">
              <CEOIcon className={`w-5 h-5 ${ceoFitness.color}`} />
              <span className={`font-bold ${ceoFitness.color}`}>{ceoFitness.label}</span>
              {vehicle.reranking_score && (
                <span className="text-gray-500">({vehicle.reranking_score}점)</span>
              )}
            </div>
          </div>

          {/* 차량 이미지 (placeholder) */}
          <div className="w-32 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center ml-6">
            <span className="text-gray-400 text-sm text-center">
              {vehicle.manufacturer}<br />
              {vehicle.model}
            </span>
          </div>
        </div>

        {/* 옵션 분석 (있는 경우) */}
        {vehicle.option_analysis && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-blue-900 flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>CEO 맞춤 옵션 분석</span>
              </h4>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                vehicle.option_analysis.recommendation === 'EXCELLENT' ? 'bg-green-500 text-white' :
                vehicle.option_analysis.recommendation === 'GOOD' ? 'bg-blue-500 text-white' :
                vehicle.option_analysis.recommendation === 'AVERAGE' ? 'bg-yellow-500 text-white' :
                'bg-gray-500 text-white'
              }`}>
                {vehicle.option_analysis.recommendation}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700 font-medium">옵션 가치: {vehicle.option_analysis.total_option_value}점</p>
                <p className="text-blue-600">CEO 적합도: {vehicle.option_analysis.persona_fit_score}점</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">하이라이트: {vehicle.option_analysis.option_highlights.length}개</p>
                <p className="text-blue-600">누락 옵션: {vehicle.option_analysis.missing_critical_options.length}개</p>
              </div>
            </div>

            {/* 옵션 하이라이트 */}
            {vehicle.option_analysis.option_highlights.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-blue-600 font-medium mb-1">CEO 맞춤 옵션:</p>
                <div className="flex flex-wrap gap-2">
                  {vehicle.option_analysis.option_highlights.slice(0, 3).map((highlight, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {highlight.replace(/\(페르소나 적합도 \d+%\)/, '')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI 추천 이유 */}
        {vehicle.reranking_reasoning && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <span>AI 전문가 분석</span>
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">
              {vehicle.reranking_reasoning}
            </p>
          </div>
        )}

        {/* 맞춤 인사이트 */}
        {vehicle.personalized_insights && vehicle.personalized_insights.length > 0 && (
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>CEO 맞춤 인사이트</span>
            </h4>
            <div className="space-y-2">
              {vehicle.personalized_insights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex space-x-4">
          <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
            상세 정보 보기
          </button>

          {vehicle.detailurl && (
            <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-200 flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>원본 매물</span>
            </button>
          )}
        </div>

        {/* 비즈니스 가치 표시 (CEO 특화) */}
        {isPremiumBrand && (
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-2 text-purple-700">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">CEO 비즈니스 가치</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              고객 접대, 임원 위상, 비즈니스 미팅에 적합한 프리미엄 차량
            </p>
          </div>
        )}
      </div>
    </div>
  );
}