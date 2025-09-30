// CompactVehicleCard.tsx - 사용자 비교 최적화 차량 카드

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Car, DollarSign, Gauge, Calendar, MapPin, Fuel, Shield, Star, ThumbsUp, ThumbsDown, ExternalLink, Eye, Award, TrendingUp } from 'lucide-react';

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
  // 실제 매물 정보
  detailurl?: string;
  photo?: string;
  platform?: string;
  originprice?: number;
  // AI 분석 결과
  recommendationReason: string;
  pros: string[];
  cons: string[];
  suitabilityScore: number;
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
  imageUrl?: string;
  rank: number;
}

interface CompactVehicleCardProps {
  vehicle: VehicleRecommendation;
  personaName?: string;
  rank: number;
}

export default function CompactVehicleCard({ vehicle, personaName, rank }: CompactVehicleCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [realVehicleImage, setRealVehicleImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const getRankConfig = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          color: 'from-yellow-400 to-orange-500',
          textColor: 'text-yellow-800',
          bgColor: 'bg-yellow-50',
          icon: '🥇',
          label: '1순위 추천',
          borderColor: 'border-yellow-300'
        };
      case 2:
        return {
          color: 'from-gray-400 to-gray-600',
          textColor: 'text-gray-800',
          bgColor: 'bg-gray-50',
          icon: '🥈',
          label: '2순위 추천',
          borderColor: 'border-gray-300'
        };
      case 3:
        return {
          color: 'from-orange-600 to-red-500',
          textColor: 'text-orange-800',
          bgColor: 'bg-orange-50',
          icon: '🥉',
          label: '3순위 추천',
          borderColor: 'border-orange-300'
        };
      default:
        return {
          color: 'from-blue-400 to-blue-600',
          textColor: 'text-blue-800',
          bgColor: 'bg-blue-50',
          icon: '⭐',
          label: '추천 차량',
          borderColor: 'border-blue-300'
        };
    }
  };

  const rankConfig = getRankConfig(rank);

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'encar': return '엔카';
      case 'kbchachacha': return 'KB차차차';
      default: return platform;
    }
  };

  // 실제 엔카 매물 이미지를 가져오는 함수
  const fetchRealVehicleImage = async (detailUrl: string) => {
    if (!detailUrl) return null;

    try {
      setImageLoading(true);
      const response = await fetch(`/api/get-vehicle-image?detailUrl=${encodeURIComponent(detailUrl)}`);
      const data = await response.json();

      if (data.success && data.primaryImage) {
        return data.primaryImage;
      } else {
        return null;
      }
    } catch (error) {
      console.error('이미지 크롤링 실패:', error);
      return null;
    } finally {
      setImageLoading(false);
    }
  };

  // 엔카 이미지 URL 생성 함수
  const buildEncarImageUrl = (photoPath: string) => {
    if (photoPath.startsWith('http')) return photoPath;

    const encarImageServers = [
      'https://img1.encar.com',
      'https://img2.encar.com',
      'https://img3.encar.com',
      'https://img4.encar.com'
    ];

    const randomServer = encarImageServers[Math.floor(Math.random() * encarImageServers.length)];
    const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    return `${randomServer}${cleanPath}`;
  };

  // 컴포넌트 마운트 시 실제 매물 이미지 가져오기
  useEffect(() => {
    if (vehicle.photo) {
      const imageUrl = buildEncarImageUrl(vehicle.photo);
      setRealVehicleImage(imageUrl);
      return;
    }

    if (vehicle.detailurl && !realVehicleImage) {
      fetchRealVehicleImage(vehicle.detailurl).then(imageUrl => {
        if (imageUrl) {
          setRealVehicleImage(imageUrl);
        }
      });
    }
  }, [vehicle.detailurl, vehicle.photo, realVehicleImage]);

  const handleDetailClick = () => {
    if (vehicle.detailurl) {
      window.open(vehicle.detailurl, '_blank');
    }
  };

  return (
    <div className={`bg-white rounded-xl border-2 ${rankConfig.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}>
      {/* 랭킹 헤더 */}
      <div className={`bg-gradient-to-r ${rankConfig.color} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{rankConfig.icon}</div>
            <div>
              <div className="text-lg font-bold">{rankConfig.label}</div>
              <div className="text-sm opacity-90">{personaName}님 맞춤 추천</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-2xl font-bold">{vehicle.suitabilityScore}</span>
              <span className="text-sm opacity-75">점</span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="p-5">
        <div className="flex gap-5">
          {/* 차량 이미지 */}
          <div className="w-48 h-32 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
              {(() => {
                if (realVehicleImage && !imageError) {
                  return (
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(realVehicleImage)}`}
                      alt={`${vehicle.manufacturer} ${vehicle.model} 실제 매물 사진`}
                      className="w-full h-full object-cover"
                      onError={() => {
                        if (!realVehicleImage.includes('proxy-image')) {
                          const img = new (globalThis as any).Image();
                          img.onload = () => setRealVehicleImage(realVehicleImage + '?direct=true');
                          img.onerror = () => setImageError(true);
                          img.src = realVehicleImage;
                        } else {
                          setImageError(true);
                        }
                      }}
                      onLoad={() => setImageLoading(false)}
                    />
                  );
                } else {
                  return (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        {imageLoading ? (
                          <>
                            <div className="w-6 h-6 mx-auto mb-2 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-xs">로딩중...</p>
                          </>
                        ) : (
                          <>
                            <Car className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-xs font-medium text-gray-600">{vehicle.manufacturer}</p>
                            <p className="text-xs text-gray-500">{vehicle.model}</p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>

          {/* 차량 정보 */}
          <div className="flex-1">
            {/* 차량명과 가격 */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {vehicle.manufacturer} {vehicle.model}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {vehicle.modelyear}년식 • {vehicle.color} • {vehicle.location}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-700 flex items-center space-x-1">
                  <span>{vehicle.price?.toLocaleString()}</span>
                  <span className="text-lg">만원</span>
                </div>
                {vehicle.originprice && vehicle.originprice > vehicle.price && (
                  <div className="text-sm text-gray-500 line-through">
                    {vehicle.originprice.toLocaleString()}만원
                  </div>
                )}
                {vehicle.tcoCost && (
                  <div className="text-xs text-green-600 mt-1">
                    3년 총비용 {vehicle.tcoCost.toLocaleString()}만원
                  </div>
                )}
              </div>
            </div>

            {/* 핵심 스펙 */}
            <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
              <div className="flex items-center space-x-1 text-gray-600">
                <Gauge className="w-4 h-4" />
                <span>{vehicle.distance?.toLocaleString()}km</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Fuel className="w-4 h-4" />
                <span>{vehicle.fueltype}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{vehicle.location}</span>
              </div>
            </div>

            {/* AI 추천 이유 */}
            <div className={`${rankConfig.bgColor} border ${rankConfig.borderColor} rounded-lg p-3 mb-3`}>
              <div className="flex items-start space-x-2">
                <div className="text-lg">🤖</div>
                <div>
                  <p className={`text-sm font-medium ${rankConfig.textColor} mb-1`}>
                    {personaName}님께 {rank}순위로 추천하는 이유
                  </p>
                  <p className="text-sm text-gray-700">
                    {vehicle.recommendationReason}
                  </p>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-2">
              {vehicle.detailurl && (
                <button
                  onClick={handleDetailClick}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>실제매물 보기</span>
                </button>
              )}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>{showDetails ? '접기' : '상세보기'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 상세 정보 토글 */}
        {showDetails && (
          <div className="mt-5 pt-5 border-t border-gray-200 animate-in slide-in-from-top-4 fade-in-0 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 장점 */}
              <div>
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span>주요 장점</span>
                </h5>
                <ul className="text-sm text-gray-600 space-y-2">
                  {vehicle.pros.slice(0, 3).map((pro, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1 text-xs">✓</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 고려사항 */}
              <div>
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <ThumbsDown className="w-4 h-4 text-orange-600" />
                  <span>고려사항</span>
                </h5>
                <ul className="text-sm text-gray-600 space-y-2">
                  {vehicle.cons.slice(0, 3).map((con, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-orange-500 mt-1 text-xs">!</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 통계 정보 */}
            {vehicle.statisticalInsight && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-600 mb-1">시장포지션</div>
                  <div className={`text-sm font-bold ${
                    vehicle.statisticalInsight.marketPosition === 'undervalued' ? 'text-green-600' :
                    vehicle.statisticalInsight.marketPosition === 'fair' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {vehicle.statisticalInsight.marketPosition === 'undervalued' ? '💎 저평가' :
                     vehicle.statisticalInsight.marketPosition === 'fair' ? '⚖️ 적정가' : '⚠️ 고평가'}
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-600 mb-1">신뢰성</div>
                  <div className={`text-sm font-bold ${
                    vehicle.statisticalInsight.reliabilityRank === 'excellent' ? 'text-green-600' :
                    vehicle.statisticalInsight.reliabilityRank === 'good' ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {vehicle.statisticalInsight.reliabilityRank === 'excellent' ? '⭐ 최우수' :
                     vehicle.statisticalInsight.reliabilityRank === 'good' ? '👍 우수' : '📊 보통'}
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-600 mb-1">연비등급</div>
                  <div className={`text-sm font-bold ${
                    vehicle.statisticalInsight.fuelEconomyRank === 'excellent' ? 'text-green-600' :
                    vehicle.statisticalInsight.fuelEconomyRank === 'good' ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {vehicle.statisticalInsight.fuelEconomyRank === 'excellent' ? '⛽ 최우수' :
                     vehicle.statisticalInsight.fuelEconomyRank === 'good' ? '🚗 우수' : '📊 보통'}
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-600 mb-1">비용등급</div>
                  <div className={`text-sm font-bold ${
                    vehicle.statisticalInsight.totalCostRank === 'budget' ? 'text-green-600' :
                    vehicle.statisticalInsight.totalCostRank === 'mid-range' ? 'text-blue-600' : 'text-purple-600'
                  }`}>
                    {vehicle.statisticalInsight.totalCostRank === 'budget' ? '💰 경제형' :
                     vehicle.statisticalInsight.totalCostRank === 'mid-range' ? '🎯 중급형' : '👑 프리미엄'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 정보 */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3 text-blue-600" />
              <span className="font-medium">실제 {getPlatformName(vehicle.platform || 'encar')} 매물</span>
            </div>
            {vehicle.platform && (
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">실시간 연동</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span>AI 분석 완료</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span className="font-medium text-blue-600">적합도 {vehicle.suitabilityScore}점</span>
          </div>
        </div>
      </div>
    </div>
  );
}