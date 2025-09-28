// HorizontalVehicleCard.tsx - 가로형 차량 추천 카드

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Car, DollarSign, Gauge, Calendar, MapPin, Fuel, Shield, Star, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';

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

interface HorizontalVehicleCardProps {
  vehicle: VehicleRecommendation;
  personaName?: string;
  rank: number;
}

export default function HorizontalVehicleCard({ vehicle, personaName, rank }: HorizontalVehicleCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [realVehicleImage, setRealVehicleImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

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
      console.log('🔍 차량 이미지 크롤링 시작:', detailUrl);

      const response = await fetch(`/api/get-vehicle-image?detailUrl=${encodeURIComponent(detailUrl)}`);
      const data = await response.json();

      if (data.success && data.primaryImage) {
        console.log('✅ 실제 매물 이미지 발견:', data.primaryImage);
        return data.primaryImage;
      } else {
        console.log('❌ 실제 매물 이미지 없음:', data.error);
        return null;
      }
    } catch (error) {
      console.error('🚨 이미지 크롤링 실패:', error);
      return null;
    } finally {
      setImageLoading(false);
    }
  };

  // 엔카 이미지 URL 생성 함수
  const buildEncarImageUrl = (photoPath: string) => {
    if (photoPath.startsWith('http')) return photoPath;

    // 엔카 이미지 서버 패턴 매칭
    const encarImageServers = [
      'https://img1.encar.com',
      'https://img2.encar.com',
      'https://img3.encar.com',
      'https://img4.encar.com'
    ];

    // 랜덤 서버 선택 (로드 밸런싱)
    const randomServer = encarImageServers[Math.floor(Math.random() * encarImageServers.length)];

    // 경로 정리
    const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    return `${randomServer}${cleanPath}`;
  };

  // 컴포넌트 마운트 시 실제 매물 이미지 가져오기
  useEffect(() => {
    // 1순위: 데이터베이스의 photo 필드 사용 (완전한 URL 또는 경로)
    if (vehicle.photo) {
      const imageUrl = buildEncarImageUrl(vehicle.photo);
      console.log('📸 Using database photo:', imageUrl);
      setRealVehicleImage(imageUrl);
      return;
    }

    // 2순위: detailurl이 있으면 크롤링 시도
    if (vehicle.detailurl && !realVehicleImage) {
      console.log('🔍 Attempting to crawl images from:', vehicle.detailurl);
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] overflow-hidden w-full h-fit group">
      {/* 헤더 - 순위와 기본 정보 */}
      <div className={`bg-gradient-to-r ${getRankColor(rank)} p-4 text-white relative overflow-hidden`}>
        {/* 배경 패턴 */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)'}}></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getRankIcon(rank)}</div>
            <div>
              <h3 className="text-xl font-bold">
                {vehicle.manufacturer} {vehicle.model}
              </h3>
              <p className="text-sm opacity-90">
                {vehicle.modelyear}년식 • {vehicle.location}
                {vehicle.platform && (
                  <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                    {getPlatformName(vehicle.platform)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right relative z-10">
            <div className="text-2xl font-bold flex items-center justify-end space-x-2">
              <span>{vehicle.price?.toLocaleString()}만원</span>
              {vehicle.originprice && vehicle.originprice > vehicle.price && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  -{Math.round((1 - vehicle.price / vehicle.originprice) * 100)}%
                </span>
              )}
            </div>
            {vehicle.originprice && vehicle.originprice > vehicle.price && (
              <div className="text-sm opacity-75 line-through">
                {vehicle.originprice.toLocaleString()}만원
              </div>
            )}
            <div className="text-sm opacity-90 flex items-center justify-end space-x-1 mt-1">
              <div className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-full">
                <Star className="w-3 h-3 fill-current" />
                <span className="font-bold">{vehicle.suitabilityScore}</span>
                <span className="text-xs opacity-75">점</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 컴팩트 메인 섹션 */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 mb-3">
          {/* 차량 이미지 */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden relative group-hover:shadow-lg transition-shadow duration-300">
              {(() => {
                // 실제 매물 이미지가 있으면 사용, 없으면 로딩 중이거나 플레이스홀더 표시
                if (realVehicleImage && !imageError) {
                  return (
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(realVehicleImage)}`}
                      alt={`${vehicle.manufacturer} ${vehicle.model} 실제 매물 사진`}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      onError={() => {
                        console.log('실제 매물 이미지 로딩 실패:', realVehicleImage);
                        // 첫 번째 실패시 직접 URL로 재시도
                        if (!realVehicleImage.includes('proxy-image')) {
                          console.log('🔄 Direct URL 재시도:', realVehicleImage);
                          const img = new (globalThis as any).Image();
                          img.onload = () => {
                            console.log('✅ Direct URL 성공');
                            setRealVehicleImage(realVehicleImage + '?direct=true');
                          };
                          img.onerror = () => {
                            console.log('❌ Direct URL도 실패');
                            setImageError(true);
                          };
                          img.src = realVehicleImage;
                        } else {
                          setImageError(true);
                        }
                      }}
                      onLoad={() => {
                        console.log('✅ 실제 매물 이미지 로딩 성공:', realVehicleImage);
                        setImageLoading(false);
                      }}
                    />
                  );
                } else {
                  return (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        {imageLoading ? (
                          <>
                            <div className="w-8 h-8 mx-auto mb-2 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-sm">실제 매물 이미지 로딩 중...</p>
                          </>
                        ) : imageError ? (
                          <>
                            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                              <Car className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">{vehicle.manufacturer} {vehicle.model}</p>
                            <p className="text-xs text-gray-500 mt-1">{vehicle.modelyear}년식 • {vehicle.fueltype}</p>
                            <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {vehicle.platform ? getPlatformName(vehicle.platform) : '엔카'} 실제 매물
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-gray-300 to-gray-500 rounded-lg flex items-center justify-center">
                              <Car className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">실제 매물 이미지</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {vehicle.platform ? getPlatformName(vehicle.platform) : '엔카'} 제공
                            </p>
                          </>
                        )}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-blue-400 mt-2 space-y-1">
                            <p>매물URL: {vehicle.detailurl ? '✓' : '✗'}</p>
                            <p>DB photo: {vehicle.photo ? '✓' : '✗'}</p>
                            <p>실제이미지: {realVehicleImage ? '✓' : '✗'}</p>
                            <p>로딩상태: {imageLoading ? '로딩중' : '완료'}</p>
                            <p>에러상태: {imageError ? '에러' : '정상'}</p>
                            {vehicle.photo && (
                              <p className="text-xs text-green-400">Photo: {vehicle.photo.substring(0, 50)}...</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>

          {/* 핵심 정보 */}
          <div className="flex-1">
            {/* AI 한줄 요약 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2">
                <div className="text-lg">🤖</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">
                    {personaName ? `${personaName}님께 추천` : 'AI 추천'}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">{vehicle.recommendationReason.slice(0, 60)}...</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-700">{vehicle.suitabilityScore}</div>
                  <div className="text-xs text-blue-500">점</div>
                </div>
              </div>
            </div>

            {/* 핵심 스펙 한줄 */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <Gauge className="w-3 h-3" />
                  <span>{vehicle.distance?.toLocaleString()}km</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Fuel className="w-3 h-3" />
                  <span>{vehicle.fueltype}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{vehicle.modelyear}년</span>
                </span>
              </div>
              <span className="flex items-center space-x-1 text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{vehicle.location}</span>
              </span>
            </div>

            {/* TCO 요약 + 액션 버튼 */}
            <div className="flex items-center justify-between">
              {vehicle.tcoCost && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-lg p-2 flex-1 mr-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-sm font-bold text-gray-800">{vehicle.tcoCost.toLocaleString()}만원</div>
                      <div className="text-xs text-gray-600">3년 총 비용</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                {vehicle.detailurl && (
                  <button
                    onClick={handleDetailClick}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                  >
                    실제매물
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-xs font-medium"
                >
                  {showDetails ? '접기' : '더보기'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 상세 정보 토글 */}
      {showDetails && (
        <div className="mx-6 mb-6 pt-6 border-t border-gray-200 animate-in slide-in-from-top-4 fade-in-0 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 전체 장단점 */}
              <div>
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span>상세 장점</span>
                </h5>
                <ul className="text-sm text-gray-600 space-y-2">
                  {vehicle.pros.map((pro, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="break-words">{pro}</span>
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
                      <span className="break-words">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* TCO 통계 정보 */}
            {vehicle.tcoBreakdown && vehicle.statisticalInsight && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>📊 통계 기반 TCO 분석</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* 3년 총비용 */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-blue-600 font-medium">3년 총 소유비용</div>
                    <div className="text-lg font-bold text-blue-800">
                      {Math.round(vehicle.tcoBreakdown.totalTCO / 10000).toLocaleString()}만원
                    </div>
                    <div className="text-xs text-blue-600">
                      월평균 {Math.round(vehicle.tcoBreakdown.monthlyAverage).toLocaleString()}만원
                    </div>
                  </div>

                  {/* 감가상각 */}
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-xs text-orange-600 font-medium">감가상각비</div>
                    <div className="text-lg font-bold text-orange-800">
                      {Math.round(vehicle.tcoBreakdown.depreciationCost / 10000).toLocaleString()}만원
                    </div>
                    <div className="text-xs text-orange-600">
                      {vehicle.statisticalInsight.depreciationTrend === 'stable' ? '📈 안정적' :
                       vehicle.statisticalInsight.depreciationTrend === 'declining' ? '📉 하락세' : '📊 변동성'}
                    </div>
                  </div>

                  {/* 유지비 */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-green-600 font-medium">유지관리비</div>
                    <div className="text-lg font-bold text-green-800">
                      {Math.round((vehicle.tcoBreakdown.maintenanceCost + vehicle.tcoBreakdown.fuelCost) / 10000).toLocaleString()}만원
                    </div>
                    <div className="text-xs text-green-600">
                      정비비 + 연료비 3년
                    </div>
                  </div>
                </div>

                {/* 통계적 인사이트 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium text-gray-600">시장 포지션</div>
                    <div className={`font-bold ${
                      vehicle.statisticalInsight.marketPosition === 'undervalued' ? 'text-green-600' :
                      vehicle.statisticalInsight.marketPosition === 'fair' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {vehicle.statisticalInsight.marketPosition === 'undervalued' ? '💎 저평가' :
                       vehicle.statisticalInsight.marketPosition === 'fair' ? '⚖️ 적정가' : '⚠️ 고평가'}
                    </div>
                  </div>

                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium text-gray-600">신뢰성</div>
                    <div className={`font-bold ${
                      vehicle.statisticalInsight.reliabilityRank === 'excellent' ? 'text-green-600' :
                      vehicle.statisticalInsight.reliabilityRank === 'good' ? 'text-blue-600' :
                      vehicle.statisticalInsight.reliabilityRank === 'average' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {vehicle.statisticalInsight.reliabilityRank === 'excellent' ? '⭐ 최우수' :
                       vehicle.statisticalInsight.reliabilityRank === 'good' ? '👍 우수' :
                       vehicle.statisticalInsight.reliabilityRank === 'average' ? '📊 보통' : '⚠️ 주의'}
                    </div>
                  </div>

                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium text-gray-600">연비 등급</div>
                    <div className={`font-bold ${
                      vehicle.statisticalInsight.fuelEconomyRank === 'excellent' ? 'text-green-600' :
                      vehicle.statisticalInsight.fuelEconomyRank === 'good' ? 'text-blue-600' :
                      vehicle.statisticalInsight.fuelEconomyRank === 'average' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {vehicle.statisticalInsight.fuelEconomyRank === 'excellent' ? '⛽ 최우수' :
                       vehicle.statisticalInsight.fuelEconomyRank === 'good' ? '🚗 우수' :
                       vehicle.statisticalInsight.fuelEconomyRank === 'average' ? '📊 보통' : '⚠️ 개선'}
                    </div>
                  </div>

                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium text-gray-600">비용 등급</div>
                    <div className={`font-bold ${
                      vehicle.statisticalInsight.totalCostRank === 'budget' ? 'text-green-600' :
                      vehicle.statisticalInsight.totalCostRank === 'mid-range' ? 'text-blue-600' :
                      vehicle.statisticalInsight.totalCostRank === 'premium' ? 'text-purple-600' : 'text-red-600'
                    }`}>
                      {vehicle.statisticalInsight.totalCostRank === 'budget' ? '💰 경제형' :
                       vehicle.statisticalInsight.totalCostRank === 'mid-range' ? '🎯 중급형' :
                       vehicle.statisticalInsight.totalCostRank === 'premium' ? '👑 프리미엄' : '💎 럭셔리'}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* 하단 정보 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-blue-100 rounded">
                <Shield className="w-3 h-3 text-blue-600" />
              </div>
              <span className="font-medium">실제 {getPlatformName(vehicle.platform || '')} 매물 데이터</span>
            </div>
            {vehicle.platform && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">실시간 연동</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 flex items-center space-x-2">
            <span>AI 분석 완료</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span className="font-medium text-blue-600">적합도 {vehicle.suitabilityScore}점</span>
          </div>
        </div>
      </div>
    </div>
  );
}