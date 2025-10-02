'use client';

import React, { useState } from 'react';
import { X, Car, DollarSign, Gauge, Calendar, MapPin, Fuel, ExternalLink, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, Star, Award, Shield, Clock } from 'lucide-react';

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
  detailurl?: string;
  photo?: string;
  platform?: string;
  originprice?: number;
  recommendationReason: string;
  pros: string[];
  cons: string[];
  suitabilityScore: number;
  reviewInsight?: {
    insight: string;
    sentimentScore: number;
    brandTierAdjustment: string;
    personaRelevance: string;
    sourceReviewCount: number;
    confidence: 'high' | 'medium' | 'low';
  };
  tcoCost?: number;
  tcoBreakdown?: {
    initialCost: number;
    depreciationCost: number;
    maintenanceCost: number;
    fuelCost: number;
    insuranceCost: number;
    totalTCO: number;
    monthlyAverage: number;
    costPerKm: number;
  };
  statisticalInsight?: {
    depreciationTrend: 'stable' | 'declining' | 'volatile';
    marketPosition: 'undervalued' | 'fair' | 'overvalued';
    reliabilityRank: 'excellent' | 'good' | 'average' | 'below_average';
    fuelEconomyRank: 'excellent' | 'good' | 'average' | 'poor';
    totalCostRank: 'budget' | 'mid-range' | 'premium' | 'luxury';
  };
  rank: number;
}

interface VehicleDetailModalProps {
  vehicle: VehicleRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  personaName?: string;
}

export default function VehicleDetailModal({ vehicle, isOpen, onClose, personaName }: VehicleDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [realVehicleImage, setRealVehicleImage] = useState<string | null>(null);

  const buildEncarImageUrl = (photoPath: string) => {
    if (photoPath.startsWith('http')) return photoPath;
    const encarImageServers = ['https://img1.encar.com', 'https://img2.encar.com', 'https://img3.encar.com', 'https://img4.encar.com'];
    const randomServer = encarImageServers[Math.floor(Math.random() * encarImageServers.length)];
    const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    return `${randomServer}${cleanPath}`;
  };

  React.useEffect(() => {
    if (vehicle?.photo) {
      setRealVehicleImage(buildEncarImageUrl(vehicle.photo));
    }
  }, [vehicle?.photo]);

  if (!isOpen || !vehicle) return null;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '⭐';
    }
  };

  const getPlatformName = (platform?: string) => {
    switch (platform) {
      case 'encar': return '엔카';
      case 'kbchachacha': return 'KB차차차';
      default: return platform || '엔카';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full h-[95vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* 헤더 - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{getRankIcon(vehicle.rank)}</div>
            <div>
              <h2 className="text-2xl font-bold">
                {vehicle.manufacturer} {vehicle.model}
              </h2>
              <p className="text-sm opacity-90">
                {vehicle.modelyear}년식 • {vehicle.fueltype} • {vehicle.location}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 메인 컨텐츠 - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* 차량 기본 정보 섹션 */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex gap-6">
              {/* 차량 이미지 */}
              <div className="w-80 flex-shrink-0">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                  {realVehicleImage && !imageError ? (
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(realVehicleImage)}`}
                      alt={`${vehicle.manufacturer} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Car className="w-16 h-16 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium text-gray-700">{vehicle.manufacturer} {vehicle.model}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 핵심 정보 */}
              <div className="flex-1 space-y-4">
                {/* 가격 및 적합도 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border-2 border-blue-200">
                    <div className="text-sm text-gray-600 mb-1">실매물 가격</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {vehicle.price?.toLocaleString()}만원
                    </div>
                    {vehicle.originprice && vehicle.originprice > vehicle.price && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-sm text-gray-500 line-through">{vehicle.originprice.toLocaleString()}만원</span>
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                          -{Math.round((1 - vehicle.price / vehicle.originprice) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-xl border-2 border-purple-200">
                    <div className="text-sm text-purple-700 mb-1">AI 적합도 점수</div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-8 h-8 text-yellow-500 fill-current" />
                      <span className="text-3xl font-bold text-purple-700">{vehicle.suitabilityScore}</span>
                      <span className="text-lg text-purple-600">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* 주요 스펙 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                    <Gauge className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <div className="text-xs text-gray-600">주행거리</div>
                    <div className="font-bold text-gray-900">{vehicle.distance?.toLocaleString()}km</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <div className="text-xs text-gray-600">연식</div>
                    <div className="font-bold text-gray-900">{vehicle.modelyear}년</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                    <Fuel className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                    <div className="text-xs text-gray-600">연료</div>
                    <div className="font-bold text-gray-900">{vehicle.fueltype}</div>
                  </div>
                </div>

                {/* AI 추천 이유 */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="text-lg">🤖</div>
                    <span className="text-sm font-bold text-blue-800">
                      {personaName ? `${personaName}님께 추천하는 이유` : 'AI 추천 이유'}
                    </span>
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed">{vehicle.recommendationReason}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Layout: TCO & Statistics */}
          <div className="p-6 grid grid-cols-2 gap-6 border-b border-gray-200">
            {/* Left Column: TCO 분석 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                <span>3년 총 소유비용 (TCO)</span>
              </h3>

              {vehicle.tcoBreakdown ? (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                      <div className="text-base text-blue-700 mb-1">3년 총 비용</div>
                      <div className="text-3xl font-bold text-blue-900">
                        {Math.round(vehicle.tcoBreakdown.totalTCO / 10000).toLocaleString()}만원
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                      <div className="text-base text-green-700 mb-1">월평균 비용</div>
                      <div className="text-3xl font-bold text-green-900">
                        {Math.round(vehicle.tcoBreakdown.monthlyAverage).toLocaleString()}만원
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                      <div className="text-base text-purple-700 mb-1">km당 비용</div>
                      <div className="text-3xl font-bold text-purple-900">
                        {Math.round(vehicle.tcoBreakdown.costPerKm)}원
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4 text-lg">비용 구성 상세</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-base text-gray-700">구매 비용</span>
                        <span className="font-bold text-gray-900 text-lg">{Math.round(vehicle.tcoBreakdown.initialCost / 10000).toLocaleString()}만원</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-base text-gray-700">감가상각비</span>
                        <span className="font-bold text-orange-600 text-lg">{Math.round(vehicle.tcoBreakdown.depreciationCost / 10000).toLocaleString()}만원</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-base text-gray-700">정비/유지비</span>
                        <span className="font-bold text-blue-600 text-lg">{Math.round(vehicle.tcoBreakdown.maintenanceCost / 10000).toLocaleString()}만원</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-base text-gray-700">연료비</span>
                        <span className="font-bold text-green-600 text-lg">{Math.round(vehicle.tcoBreakdown.fuelCost / 10000).toLocaleString()}만원</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-base text-gray-700">보험료</span>
                        <span className="font-bold text-purple-600 text-lg">{Math.round(vehicle.tcoBreakdown.insuranceCost / 10000).toLocaleString()}만원</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gray-100 p-6 rounded-xl text-center text-gray-600">
                  TCO 데이터가 없습니다
                </div>
              )}
            </div>

            {/* Right Column: 통계 인사이트 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <span>통계 기반 인사이트</span>
              </h3>

              {vehicle.statisticalInsight ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                      <span className="font-semibold text-gray-800 text-lg">감가상각 트렌드</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      vehicle.statisticalInsight.depreciationTrend === 'stable' ? 'text-green-600' :
                      vehicle.statisticalInsight.depreciationTrend === 'declining' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {vehicle.statisticalInsight.depreciationTrend === 'stable' ? '📈 안정적' :
                       vehicle.statisticalInsight.depreciationTrend === 'declining' ? '📉 하락세' : '📊 변동성 높음'}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Award className="w-6 h-6 text-blue-600" />
                      <span className="font-semibold text-gray-800 text-lg">시장 포지션</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      vehicle.statisticalInsight.marketPosition === 'undervalued' ? 'text-green-600' :
                      vehicle.statisticalInsight.marketPosition === 'fair' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {vehicle.statisticalInsight.marketPosition === 'undervalued' ? '💎 저평가 (가성비 우수)' :
                       vehicle.statisticalInsight.marketPosition === 'fair' ? '⚖️ 적정가' : '⚠️ 고평가'}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Shield className="w-6 h-6 text-green-600" />
                      <span className="font-semibold text-gray-800 text-lg">신뢰성 등급</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      vehicle.statisticalInsight.reliabilityRank === 'excellent' ? 'text-green-600' :
                      vehicle.statisticalInsight.reliabilityRank === 'good' ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {vehicle.statisticalInsight.reliabilityRank === 'excellent' ? '⭐ 최우수' :
                       vehicle.statisticalInsight.reliabilityRank === 'good' ? '👍 우수' : '📊 보통'}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Fuel className="w-6 h-6 text-blue-600" />
                      <span className="font-semibold text-gray-800 text-lg">연비 등급</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      vehicle.statisticalInsight.fuelEconomyRank === 'excellent' ? 'text-green-600' :
                      vehicle.statisticalInsight.fuelEconomyRank === 'good' ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {vehicle.statisticalInsight.fuelEconomyRank === 'excellent' ? '⛽ 최우수' :
                       vehicle.statisticalInsight.fuelEconomyRank === 'good' ? '🚗 우수' : '📊 보통'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 p-6 rounded-xl text-center text-gray-600">
                  통계 데이터가 없습니다
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: Pros & Cons Side-by-Side */}
          <div className="p-6 grid grid-cols-2 gap-6">
            {/* 장점 */}
            <div>
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center space-x-2">
                <ThumbsUp className="w-6 h-6" />
                <span>주요 장점</span>
              </h3>
              <ul className="space-y-3">
                {vehicle.pros.map((pro, idx) => (
                  <li key={idx} className="flex items-start space-x-3 bg-green-50 p-4 rounded-lg border border-green-200">
                    <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                    <span className="text-gray-800 text-base leading-relaxed">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 단점 */}
            <div>
              <h3 className="text-xl font-bold text-orange-700 mb-4 flex items-center space-x-2">
                <ThumbsDown className="w-6 h-6" />
                <span>고려할 점</span>
              </h3>
              <ul className="space-y-3">
                {vehicle.cons.map((con, idx) => (
                  <li key={idx} className="flex items-start space-x-3 bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <span className="text-orange-600 text-xl flex-shrink-0">!</span>
                    <span className="text-gray-800 text-base leading-relaxed">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Review Insight Section (if available) */}
          {vehicle.reviewInsight && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <span>💬</span>
                <span>사용자 리뷰 분석</span>
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <p className="text-gray-800 leading-relaxed mb-4 text-base">{vehicle.reviewInsight.insight}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="font-semibold text-gray-700 text-base">감성 점수</div>
                    <div className="text-2xl font-bold text-blue-600">{vehicle.reviewInsight.sentimentScore}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700 text-base">분석 리뷰 수</div>
                    <div className="text-2xl font-bold text-green-600">{vehicle.reviewInsight.sourceReviewCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700 text-base">신뢰도</div>
                    <div className={`text-2xl font-bold ${
                      vehicle.reviewInsight.confidence === 'high' ? 'text-green-600' :
                      vehicle.reviewInsight.confidence === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                    }`}>
                      {vehicle.reviewInsight.confidence === 'high' ? '높음' :
                       vehicle.reviewInsight.confidence === 'medium' ? '보통' : '낮음'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 - Fixed */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-4 flex-shrink-0">
          {vehicle.detailurl && (
            <a
              href={vehicle.detailurl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold text-center flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <ExternalLink className="w-5 h-5" />
              <span>{getPlatformName(vehicle.platform)} 실제 매물 보러가기</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-bold"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
