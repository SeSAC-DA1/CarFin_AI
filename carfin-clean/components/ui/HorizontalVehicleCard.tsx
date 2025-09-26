// HorizontalVehicleCard.tsx - 가로형 차량 추천 카드

import React, { useState } from 'react';
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

  const getCompleteImageUrl = (photo: string, platform: string) => {
    if (!photo) return '';

    // 이미 완전한 URL인 경우
    if (photo.startsWith('http')) return photo;

    // 플랫폼별 베이스 URL 추가
    switch (platform) {
      case 'encar':
        return `https://img1.encar.com${photo}01.jpg`;
      case 'kbchachacha':
        return `https://img.kbchachacha.com${photo}`;
      default:
        return photo;
    }
  };

  const handleDetailClick = () => {
    if (vehicle.detailurl) {
      window.open(vehicle.detailurl, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mb-4 w-full flex flex-col">
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
                {vehicle.platform && (
                  <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                    {getPlatformName(vehicle.platform)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {vehicle.price?.toLocaleString()}만원
            </div>
            {vehicle.originprice && vehicle.originprice > vehicle.price && (
              <div className="text-sm opacity-75 line-through">
                {vehicle.originprice.toLocaleString()}만원
              </div>
            )}
            <div className="text-sm opacity-90">
              적합도 {vehicle.suitabilityScore}점
            </div>
          </div>
        </div>
      </div>

      {/* 상단: 이미지 + 핵심 스펙 */}
      <div className="p-6">
        <div className="flex gap-6 mb-6">
          {/* 차량 이미지 */}
          <div className="w-80 flex-shrink-0">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden relative">
              {(() => {
                const imageUrl = vehicle.photo
                  ? getCompleteImageUrl(vehicle.photo, vehicle.platform || 'encar')
                  : vehicle.imageUrl;

                return imageUrl && !imageError ? (
                  <Image
                    src={imageUrl}
                    alt={`${vehicle.manufacturer} ${vehicle.model}`}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                    unoptimized={true}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Car className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">실제 차량 이미지</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {vehicle.platform && getPlatformName(vehicle.platform)} 제공
                      </p>
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-red-400 mt-1">
                          Debug: {vehicle.photo || 'No photo'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 핵심 스펙 */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-3">
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
          </div>
        </div>

        {/* 하단: 추천 이유 및 분석 */}
        <div className="space-y-6">

          {/* AI 추천 이유 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <div className="text-xl">🤖</div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">
                  {personaName ? `${personaName}님에게 추천하는 이유` : 'AI 추천 이유'}
                </h4>
                <p className="text-sm text-blue-700 leading-relaxed">{vehicle.recommendationReason}</p>
              </div>
            </div>
          </div>

          {/* 장단점 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <ThumbsUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">장점</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-2">
                {vehicle.pros.slice(0, 3).map((pro, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                    <span className="break-words leading-relaxed">{pro}</span>
                  </li>
                ))}
                {vehicle.pros.length > 3 && (
                  <li className="text-gray-400 ml-4 text-xs">+ {vehicle.pros.length - 3}개 더</li>
                )}
              </ul>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <ThumbsDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">고려사항</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-2">
                {vehicle.cons.slice(0, 3).map((con, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
                    <span className="break-words leading-relaxed">{con}</span>
                  </li>
                ))}
                {vehicle.cons.length > 3 && (
                  <li className="text-gray-400 ml-4 text-xs">+ {vehicle.cons.length - 3}개 더</li>
                )}
              </ul>
            </div>
          </div>

          {/* TCO 정보와 액션 버튼 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {vehicle.tcoCost && (
              <div className="bg-green-50 rounded-lg p-3 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">예상 3년 TCO</span>
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    {vehicle.tcoCost.toLocaleString()}만원
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {vehicle.detailurl && (
                <button
                  onClick={handleDetailClick}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>실제 매물 보기</span>
                </button>
              )}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium whitespace-nowrap"
              >
                {showDetails ? '간단히 보기' : '상세 분석 보기'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 정보 토글 */}
      {showDetails && (
        <div className="mx-6 mb-6 pt-6 border-t border-gray-200">
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
        </div>
      )}

      {/* 하단 정보 */}
      <div className="bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>실제 {getPlatformName(vehicle.platform || '')} 매물 데이터</span>
            </div>
            {vehicle.platform && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>실시간 연동</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400">
            AI 분석 완료 • 적합도 {vehicle.suitabilityScore}점
          </div>
        </div>
      </div>
    </div>
  );
}