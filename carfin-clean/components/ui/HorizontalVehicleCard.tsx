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

  const getVehicleImageUrl = (vehicle: any) => {
    const { manufacturer, model } = vehicle;

    // 차량 모델별 대표 이미지 매핑
    const vehicleImages: { [key: string]: string } = {
      // 현대 차량
      '현대_벨로스터': 'https://images.unsplash.com/photo-1549399447-d3e49c3b6c6d?w=400&h=300&fit=crop',
      '현대_아반떼': 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop',
      '현대_소나타': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
      '현대_투싼': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
      '현대_산타페': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      '현대_캐스퍼': 'https://images.unsplash.com/photo-1627634777217-c864268db30c?w=400&h=300&fit=crop',

      // 기아 차량
      '기아_K3': 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop',
      '기아_K5': 'https://images.unsplash.com/photo-1617814443181-2f9dcaaa6c37?w=400&h=300&fit=crop',
      '기아_스포티지': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
      '기아_쏘렌토': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      '기아_레이': 'https://images.unsplash.com/photo-1627634777217-c864268db30c?w=400&h=300&fit=crop',
      '기아_모닝': 'https://images.unsplash.com/photo-1627634777217-c864268db30c?w=400&h=300&fit=crop',

      // 벤츠 차량
      '벤츠_C-클래스': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
      '벤츠_E-클래스': 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop',
      '벤츠_S-클래스': 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop',

      // 아우디 차량
      '아우디_A3': 'https://images.unsplash.com/photo-1549399447-d3e49c3b6c6d?w=400&h=300&fit=crop',
      '아우디_A4': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
      '아우디_Q5': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',

      // BMW 차량
      'BMW_3시리즈': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
      'BMW_5시리즈': 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop',
      'BMW_X3': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
    };

    // 모델명 정규화 (공백, 특수문자 제거)
    const normalizedModel = model.replace(/[^\w가-힣]/g, '').replace(/\s+/g, '');
    const key = `${manufacturer}_${normalizedModel}`;

    // 직접 매칭
    if (vehicleImages[key]) {
      return vehicleImages[key];
    }

    // 부분 매칭 시도
    for (const [vehicleKey, imageUrl] of Object.entries(vehicleImages)) {
      if (vehicleKey.includes(manufacturer) &&
          (vehicleKey.toLowerCase().includes(normalizedModel.toLowerCase()) ||
           normalizedModel.toLowerCase().includes(vehicleKey.split('_')[1].toLowerCase()))) {
        return imageUrl;
      }
    }

    // 기본 이미지 (제조사별)
    const defaultImages: { [key: string]: string } = {
      '현대': 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop',
      '기아': 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop',
      '벤츠': 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop',
      '아우디': 'https://images.unsplash.com/photo-1549399447-d3e49c3b6c6d?w=400&h=300&fit=crop',
      'BMW': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
      '폭스바겐': 'https://images.unsplash.com/photo-1549399447-d3e49c3b6c6d?w=400&h=300&fit=crop',
      '쌍용': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
    };

    return defaultImages[manufacturer] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop';
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
                // 차량 모델별 대표 이미지 사용
                const imageUrl = getVehicleImageUrl(vehicle);

                return imageUrl && !imageError ? (
                  <img
                    src={imageUrl}
                    alt={`${vehicle.manufacturer} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.log('이미지 로딩 실패:', imageUrl);
                      setImageError(true);
                    }}
                    onLoad={() => {
                      console.log('이미지 로딩 성공:', imageUrl);
                    }}
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
                        <div className="text-xs text-red-400 mt-1">
                          <p>제조사: {vehicle.manufacturer}</p>
                          <p>모델: {vehicle.model}</p>
                          <p>대표이미지: {imageUrl}</p>
                          <p>플랫폼: {vehicle.platform || 'No platform'}</p>
                        </div>
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