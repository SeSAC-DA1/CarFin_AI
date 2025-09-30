'use client';

import { useState } from 'react';
import { Crown, TrendingUp, Shield, Star, MapPin, Calendar, Gauge, Fuel, Award, ExternalLink, Car, Lightbulb, ThumbsUp, ThumbsDown } from 'lucide-react';

// 실제 차량 데이터 구조 (데이터베이스에서 오는 형태)
interface VehicleData {
  vehicleid: string | number;
  manufacturer: string;
  model: string;
  modelyear: number;
  price: number;
  distance: number;
  fueltype: string;
  cartype?: string;
  location: string;
  colorname?: string;
  detailurl?: string;
  photo?: string;
  // AI 분석 결과
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

interface VehicleRecommendationCardProps {
  vehicle: VehicleData;
  rank: number;
  personaName?: string;
}

export default function VehicleRecommendationCard({ vehicle, rank, personaName }: VehicleRecommendationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // 순위에 따른 색상 및 아이콘
  const getRankConfig = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-500',
          textColor: 'text-yellow-600',
          icon: '🥇',
          label: '최고 추천'
        };
      case 2:
        return {
          bgColor: 'bg-gradient-to-r from-gray-400 to-gray-500',
          textColor: 'text-gray-600',
          icon: '🥈',
          label: '2순위 추천'
        };
      case 3:
        return {
          bgColor: 'bg-gradient-to-r from-amber-600 to-orange-600',
          textColor: 'text-orange-600',
          icon: '🥉',
          label: '3순위 추천'
        };
      default:
        return {
          bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          textColor: 'text-blue-600',
          icon: '⭐',
          label: `${rank}순위`
        };
    }
  };

  // 점수에 따른 등급
  const getScoreGrade = (score?: number) => {
    if (!score) return { grade: '평가중', color: 'text-gray-500', bg: 'bg-gray-400' };
    if (score >= 90) return { grade: 'S급', color: 'text-yellow-600', bg: 'bg-gradient-to-r from-yellow-500 to-amber-500' };
    if (score >= 80) return { grade: 'A급', color: 'text-blue-600', bg: 'bg-gradient-to-r from-blue-500 to-indigo-500' };
    if (score >= 70) return { grade: 'B급', color: 'text-green-600', bg: 'bg-gradient-to-r from-green-500 to-emerald-500' };
    return { grade: 'C급', color: 'text-gray-600', bg: 'bg-gradient-to-r from-gray-500 to-slate-500' };
  };

  // 프리미엄 브랜드 판정
  const isPremiumBrand = ['BMW', '벤츠', '아우디', '제네시스', '렉서스', '볼보', '재규어', '랜드로버', '포르쉐'].includes(vehicle.manufacturer);

  const rankConfig = getRankConfig(rank);
  const scoreGrade = getScoreGrade(vehicle.reranking_score);

  return (
    <div className={`bg-white rounded-2xl shadow-lg border overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl ${
      rank === 1 ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-gray-200'
    }`}>

      {/* 헤더 - 순위와 기본 정보 */}
      <div className={`${rankConfig.bgColor} p-6 text-white relative`}>
        {/* 순위 배지 */}
        <div className="absolute -top-3 -left-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg">
            {rankConfig.icon}
          </div>
        </div>

        {/* 프리미엄 브랜드 배지 */}
        {isPremiumBrand && (
          <div className="absolute top-4 right-4">
            <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
              <Crown className="w-3 h-3 inline mr-1" />
              프리미엄
            </div>
          </div>
        )}

        <div className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">
                {vehicle.manufacturer} {vehicle.model}
              </h3>
              <div className="flex items-center space-x-4 text-sm opacity-90 mb-3">
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
              <div className="text-3xl font-bold">
                {vehicle.price?.toLocaleString()}만원
              </div>
            </div>

            {/* 평가 점수 */}
            {vehicle.reranking_score && (
              <div className="text-right">
                <div className={`px-4 py-2 rounded-full text-sm font-bold text-white ${scoreGrade.bg} mb-2`}>
                  {scoreGrade.grade}
                </div>
                <div className="text-lg font-bold">
                  {vehicle.reranking_score}점
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 차량 이미지 영역 */}
      <div className="p-6">
        <div className="flex items-center space-x-6 mb-6">
          {/* 차량 이미지 */}
          <div className="w-48 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
            {vehicle.photo ? (
              <img
                src={vehicle.photo}
                alt={`${vehicle.manufacturer} ${vehicle.model}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`text-center text-gray-500 ${vehicle.photo ? 'hidden' : ''}`}>
              <Car className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">{vehicle.manufacturer}<br />{vehicle.model}</p>
            </div>
          </div>

          {/* 추천 이유 */}
          <div className="flex-1">
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>{personaName ? `${personaName}님에게 추천하는 이유` : 'AI 추천 분석'}</span>
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                {vehicle.reranking_reasoning || '이 차량은 고객님의 요구사항을 종합적으로 분석한 결과 최적의 선택으로 판단됩니다.'}
              </p>
            </div>
          </div>
        </div>

        {/* 옵션 분석 결과 */}
        {vehicle.option_analysis && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-purple-900 flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>옵션 가치 분석</span>
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

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-purple-700 font-medium">옵션 가치: {vehicle.option_analysis.total_option_value}점</p>
                <p className="text-purple-600">맞춤 적합도: {vehicle.option_analysis.persona_fit_score}점</p>
              </div>
              <div>
                <p className="text-purple-700 font-medium">하이라이트: {vehicle.option_analysis.option_highlights.length}개</p>
                <p className="text-purple-600">누락 옵션: {vehicle.option_analysis.missing_critical_options.length}개</p>
              </div>
            </div>

            {/* 주요 옵션 하이라이트 */}
            {vehicle.option_analysis.option_highlights.length > 0 && (
              <div>
                <p className="text-sm text-purple-700 font-medium mb-2">주요 옵션:</p>
                <div className="flex flex-wrap gap-2">
                  {vehicle.option_analysis.option_highlights.slice(0, 4).map((highlight, idx) => (
                    <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs">
                      {highlight.replace(/\(페르소나 적합도 \d+%\)/, '')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 맞춤 인사이트 */}
        {vehicle.personalized_insights && vehicle.personalized_insights.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6 border border-yellow-200">
            <h4 className="font-bold text-orange-900 mb-3 flex items-center space-x-2">
              <Lightbulb className="w-5 h-5" />
              <span>맞춤 인사이트</span>
            </h4>
            <div className="space-y-3">
              {vehicle.personalized_insights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-orange-800">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex space-x-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {showDetails ? '간단히 보기' : '상세 정보 보기'}
          </button>

          {vehicle.detailurl && (
            <a
              href={vehicle.detailurl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-200 flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>원본 매물</span>
            </a>
          )}
        </div>

        {/* 상세 정보 (토글) */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 차량 기본 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <Car className="w-4 h-4" />
                  <span>차량 정보</span>
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">차량번호:</span>
                    <span className="font-medium">{vehicle.vehicleid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">차종:</span>
                    <span className="font-medium">{vehicle.cartype || '정보 없음'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">색상:</span>
                    <span className="font-medium">{vehicle.colorname || '정보 없음'}</span>
                  </div>
                </div>
              </div>

              {/* AI 분석 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-semibold text-blue-800 mb-3 flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>AI 분석 결과</span>
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600">추천 순위:</span>
                    <span className="font-medium text-blue-800">{rank}순위</span>
                  </div>
                  {vehicle.reranking_score && (
                    <div className="flex justify-between">
                      <span className="text-blue-600">적합도 점수:</span>
                      <span className="font-medium text-blue-800">{vehicle.reranking_score}점</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-blue-600">분석 등급:</span>
                    <span className={`font-medium ${scoreGrade.color}`}>{scoreGrade.grade}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 가치 정당화 (옵션 분석이 있는 경우) */}
            {vehicle.option_analysis?.value_justification && vehicle.option_analysis.value_justification.length > 0 && (
              <div className="mt-6 bg-green-50 rounded-lg p-4">
                <h5 className="font-semibold text-green-800 mb-3 flex items-center space-x-2">
                  <ThumbsUp className="w-4 h-4" />
                  <span>가치 정당화</span>
                </h5>
                <ul className="space-y-2">
                  {vehicle.option_analysis.value_justification.map((justification, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-green-700">{justification}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 누락 옵션 (있는 경우) */}
            {vehicle.option_analysis?.missing_critical_options && vehicle.option_analysis.missing_critical_options.length > 0 && (
              <div className="mt-4 bg-red-50 rounded-lg p-4">
                <h5 className="font-semibold text-red-800 mb-3 flex items-center space-x-2">
                  <ThumbsDown className="w-4 h-4" />
                  <span>아쉬운 점</span>
                </h5>
                <ul className="space-y-2">
                  {vehicle.option_analysis.missing_critical_options.map((missing, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm">
                      <span className="text-red-500 mt-1">!</span>
                      <span className="text-red-700">{missing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 정보 */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Shield className="w-4 h-4" />
            <span>실제 매물 데이터 기반 AI 분석</span>
          </div>
          <div className={`font-medium ${rankConfig.textColor}`}>
            {rankConfig.label}
          </div>
        </div>
      </div>
    </div>
  );
}