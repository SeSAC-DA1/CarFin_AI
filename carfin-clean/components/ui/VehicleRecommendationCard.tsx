// VehicleRecommendationCard.tsx - 차량 추천 결과 미니 대시보드

import React, { useState } from 'react';
import { Car, DollarSign, Gauge, Calendar, MapPin, Fuel, Shield, Star, ThumbsUp, ThumbsDown, Lightbulb, Award, Users, Target, MessageSquare } from 'lucide-react';

interface VehicleRecommendation {
  manufacturer: string;
  model: string;
  modelyear: number;
  price: number;
  distance: number;
  location: string;
  fueltype: string;
  displacement?: number;
  color?: string;
  // AI 분석 결과
  recommendationReason: string;
  pros: string[];
  cons: string[];
  suitabilityScore: number; // 1-100점
  tcoCost?: number;
  imageUrl?: string;
  // 새로운 인사이트 필드들
  keyInsights?: string[]; // 핵심 인사이트
  vehicleFeatures?: string[]; // 차량 특장점
  uniqueOptions?: string[]; // 특징적인 옵션
  marketPerception?: string; // 시장에서의 인식
  userReviews?: string; // 실사용자 리뷰 요약
  brandStrength?: string; // 브랜드 강점
  targetCustomer?: string; // 타겟 고객층
}

interface VehicleRecommendationCardProps {
  vehicle: VehicleRecommendation;
  personaName?: string;
  rank: number; // 1st, 2nd, 3rd 추천
}

export default function VehicleRecommendationCard({ vehicle, personaName, rank }: VehicleRecommendationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-orange-500';
      case 2: return 'from-gray-400 to-gray-600';
      case 3: return 'from-orange-600 to-red-500';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '⭐';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mb-4">
      {/* 헤더 - 순위와 기본 정보 */}
      <div className={`bg-gradient-to-r ${getRankColor(rank)} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getRankIcon(rank)}</div>
            <div>
              <h3 className="text-xl font-bold">
                {vehicle.manufacturer} {vehicle.model}
              </h3>
              <p className="text-sm opacity-90">
                {vehicle.modelyear}년식 • {vehicle.location}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {vehicle.price?.toLocaleString()}만원
            </div>
            <div className="text-sm opacity-90">
              적합도 {vehicle.suitabilityScore}점
            </div>
          </div>
        </div>
      </div>

      {/* 차량 이미지 및 기본 스펙 - 확대된 레이아웃 */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 차량 이미지 */}
          <div className="lg:col-span-1">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              {vehicle.imageUrl ? (
                <img
                  src={vehicle.imageUrl}
                  alt={`${vehicle.manufacturer} ${vehicle.model}`}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <Car className="w-16 h-16 mx-auto mb-2" />
                  <p className="text-sm">차량 이미지</p>
                </div>
              )}
            </div>
          </div>

          {/* 핵심 스펙 및 정보 */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <Gauge className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">주행거리:</span>
                <span className="font-medium">{vehicle.distance?.toLocaleString()}km</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Fuel className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">연료:</span>
                <span className="font-medium">{vehicle.fueltype}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="text-gray-600">위치:</span>
                <span className="font-medium">{vehicle.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="text-gray-600">연식:</span>
                <span className="font-medium">{vehicle.modelyear}년</span>
              </div>
            </div>

            {/* AI 추천 이유 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <div className="text-xl">🤖</div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">
                    {personaName ? `${personaName}님에게 추천하는 이유` : 'AI 추천 이유'}
                  </h4>
                  <p className="text-sm text-blue-700">{vehicle.recommendationReason}</p>
                </div>
              </div>
            </div>

            {/* 핵심 인사이트 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 시장에서의 인식 */}
              {vehicle.marketPerception && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Target className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <h5 className="font-semibold text-purple-800 mb-2">시장 평가</h5>
                      <p className="text-sm text-purple-700">{vehicle.marketPerception}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 브랜드 강점 */}
              {vehicle.brandStrength && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Award className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <h5 className="font-semibold text-green-800 mb-2">브랜드 강점</h5>
                      <p className="text-sm text-green-700">{vehicle.brandStrength}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 핵심 인사이트 */}
            {vehicle.keyInsights && vehicle.keyInsights.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-5 h-5 text-orange-600 mt-1" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-orange-800 mb-3">핵심 인사이트</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {vehicle.keyInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <span className="text-orange-500 text-xs mt-1">●</span>
                          <span className="text-sm text-orange-700">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 간소화된 장단점 하이라이트 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">장점</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {vehicle.pros.slice(0, 2).map((pro, idx) => (
                    <li key={idx} className="flex items-start space-x-1">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                  {vehicle.pros.length > 2 && (
                    <li className="text-gray-400">+ {vehicle.pros.length - 2}개 더</li>
                  )}
                </ul>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">고려사항</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {vehicle.cons.slice(0, 2).map((con, idx) => (
                    <li key={idx} className="flex items-start space-x-1">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                  {vehicle.cons.length > 2 && (
                    <li className="text-gray-400">+ {vehicle.cons.length - 2}개 더</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 상세 정보 토글 버튼 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            {showDetails ? '간단히 보기' : '상세 정보 보기'}
          </button>
        </div>

        {/* 상세 정보 */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {/* 차량 특장점 및 옵션 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 차량 특장점 */}
              {vehicle.vehicleFeatures && vehicle.vehicleFeatures.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-5">
                  <h5 className="font-semibold text-blue-800 mb-4 flex items-center space-x-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    <span>이 차량의 특장점</span>
                  </h5>
                  <ul className="text-sm text-blue-700 space-y-2">
                    {vehicle.vehicleFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">▪</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 특별한 옵션 */}
              {vehicle.uniqueOptions && vehicle.uniqueOptions.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-5">
                  <h5 className="font-semibold text-purple-800 mb-4 flex items-center space-x-2">
                    <Star className="w-5 h-5 text-purple-600" />
                    <span>주목할 만한 옵션</span>
                  </h5>
                  <ul className="text-sm text-purple-700 space-y-2">
                    {vehicle.uniqueOptions.map((option, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-purple-500 mt-1">✦</span>
                        <span>{option}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 실사용자 리뷰 요약 */}
            {vehicle.userReviews && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 mb-6">
                <h5 className="font-semibold text-green-800 mb-3 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <span>실제 오너들의 평가</span>
                </h5>
                <p className="text-sm text-green-700 leading-relaxed">{vehicle.userReviews}</p>
              </div>
            )}

            {/* 타겟 고객층 */}
            {vehicle.targetCustomer && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-5 mb-6">
                <h5 className="font-semibold text-indigo-800 mb-3 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>이런 분께 특히 추천</span>
                </h5>
                <p className="text-sm text-indigo-700">{vehicle.targetCustomer}</p>
              </div>
            )}

            {/* 전체 장단점 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span>상세 장점</span>
                </h5>
                <ul className="text-sm text-gray-600 space-y-2">
                  {vehicle.pros.map((pro, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                  <span>고려해야 할 점</span>
                </h5>
                <ul className="text-sm text-gray-600 space-y-2">
                  {vehicle.cons.map((con, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-red-500 mt-1">!</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* TCO 정보 */}
            {vehicle.tcoCost && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>예상 총소유비용 (3년 기준)</span>
                </h5>
                <div className="text-2xl font-bold text-green-700">
                  {vehicle.tcoCost.toLocaleString()}만원
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  구매가 + 유지비 + 보험료 + 감가상각 포함 예상
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 액션 */}
      <div className="bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>실제 매물 데이터 기반 AI 분석</span>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
              관심 등록
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              상세 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}