'use client';

import React, { useState, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VehicleImage } from '@/components/ui/optimized-image';
import { useMobile, useTouchGesture } from '@/hooks/use-mobile';
import {
  Heart,
  Car,
  Fuel,
  Gauge,
  Calendar,
  MapPin,
  DollarSign,
  Star,
  ExternalLink,
  Camera,
  MessageCircle,
  ThumbsUp,
  Share2
} from 'lucide-react';

interface RealVehicleData {
  vehicleid: string;
  manufacturer: string;
  model: string;
  modelyear: number;
  price: number;
  distance: number;
  fueltype: string;
  cartype: string;
  location: string;
  detailurl?: string;
  photo?: string;
  match_score?: number;
  recommendation_reason?: string;
}

interface RealVehicleCardProps {
  vehicle: RealVehicleData;
  onVehicleSelect?: (vehicleId: string) => void;
  onRequestFinancing?: (vehicleId: string) => void;
  isSelected?: boolean;
  showMatchScore?: boolean;
}

const RealVehicleCard = memo(function RealVehicleCard({
  vehicle,
  onVehicleSelect,
  onRequestFinancing,
  isSelected = false,
  showMatchScore = true
}: RealVehicleCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { isMobile, touchSupported } = useMobile();
  const { touchState, touchHandlers } = useTouchGesture();

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}억원`;
    }
    return `${price.toLocaleString()}만원`;
  };

  // 주행거리 포맷팅
  const formatDistance = (distance: number) => {
    if (distance >= 10000) {
      return `${(distance / 10000).toFixed(1)}만km`;
    }
    return `${distance.toLocaleString()}km`;
  };

  // 연식 계산
  const getVehicleAge = () => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - vehicle.modelyear;
    return age;
  };

  // 매치 점수에 따른 배지 색상
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const handleCardClick = useCallback(() => {
    if (onVehicleSelect) {
      onVehicleSelect(vehicle.vehicleid);
    }
  }, [onVehicleSelect, vehicle.vehicleid]);

  const handleLikeClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);

    // 햅틱 피드백 (모바일)
    if (touchSupported && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [isLiked, touchSupported]);

  const handleFinanceClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (onRequestFinancing) {
      onRequestFinancing(vehicle.vehicleid);
    }
  }, [onRequestFinancing, vehicle.vehicleid]);

  // 터치 이벤트 처리
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsPressed(true);
    touchHandlers.onTouchStart(e);
  }, [touchHandlers]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsPressed(false);
    touchHandlers.onTouchEnd();

    // 스와이프 제스처가 아닌 경우에만 클릭 처리
    if (Math.abs(touchState.deltaX) < 10 && Math.abs(touchState.deltaY) < 10) {
      handleCardClick();
    }
  }, [touchHandlers, touchState, handleCardClick]);

  const handleMouseDown = useCallback(() => {
    if (!touchSupported) setIsPressed(true);
  }, [touchSupported]);

  const handleMouseUp = useCallback(() => {
    if (!touchSupported) setIsPressed(false);
  }, [touchSupported]);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <div
      className={`
        group relative bg-white rounded-xl shadow-md transition-all duration-300 cursor-pointer overflow-hidden
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isPressed ? 'scale-[0.98] shadow-lg' : 'hover:shadow-xl hover:scale-[1.02]'}
        ${isMobile ? 'active:scale-[0.98]' : ''}
        transform select-none
      `}
      onClick={!touchSupported ? handleCardClick : undefined}
      onTouchStart={touchSupported ? handleTouchStart : undefined}
      onTouchEnd={touchSupported ? handleTouchEnd : undefined}
      onTouchMove={touchSupported ? touchHandlers.onTouchMove : undefined}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* 이미지 섹션 */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <VehicleImage
          vehicleId={vehicle.vehicleid}
          src={vehicle.photo}
          manufacturer={vehicle.manufacturer}
          model={vehicle.model}
          vehicleType={vehicle.cartype}
          className="h-full transition-transform duration-300 group-hover:scale-110"
          priority={false}
        />

        {/* 오버레이 액션 버튼들 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />

        {/* 상단 배지들 */}
        <div className="absolute top-3 left-3 flex gap-2">
          {showMatchScore && vehicle.match_score && (
            <Badge className={`${getMatchScoreColor(vehicle.match_score)} text-white px-2 py-1 text-xs font-bold`}>
              매칭 {vehicle.match_score}%
            </Badge>
          )}
          {getVehicleAge() <= 3 && (
            <Badge className="bg-green-600 text-white px-2 py-1 text-xs">
              최신
            </Badge>
          )}
        </div>

        {/* 상단 우측 액션 */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={handleLikeClick}
            onTouchEnd={handleLikeClick}
            className={`
              p-2 rounded-full transition-all duration-200 backdrop-blur-sm
              ${isMobile ? 'p-3' : 'p-2'} ${/* 모바일에서 터치 영역 확대 */}
              ${isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'}
              active:scale-90 transform
            `}
          >
            <Heart className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* 하단 정보 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="text-white">
            <h3 className="text-lg font-bold truncate">
              {vehicle.manufacturer} {vehicle.model}
            </h3>
            <p className="text-sm opacity-90">
              {vehicle.modelyear}년 • {vehicle.cartype}
            </p>
          </div>
        </div>
      </div>

      {/* 차량 정보 섹션 */}
      <div className="p-4 space-y-3">
        {/* 가격 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-xl font-bold text-green-600">
              {formatPrice(vehicle.price)}
            </span>
          </div>
          {vehicle.recommendation_reason && (
            <Badge variant="outline" className="text-xs">
              {vehicle.recommendation_reason}
            </Badge>
          )}
        </div>

        {/* 주요 정보 그리드 */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">{formatDistance(vehicle.distance)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-orange-600" />
            <span className="text-gray-600">{vehicle.fueltype}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-gray-600">{getVehicleAge()}년차</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <span className="text-gray-600">{vehicle.location}</span>
          </div>
        </div>

        {/* 추천 이유 (있는 경우) */}
        {vehicle.recommendation_reason && (
          <div className="bg-blue-50 p-2 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <Star className="w-4 h-4" />
              {vehicle.recommendation_reason}
            </p>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className={`flex gap-2 pt-2 ${isMobile ? 'flex-col space-y-2' : ''}`}>
          <Button
            onClick={handleFinanceClick}
            onTouchEnd={handleFinanceClick}
            className={`
              ${isMobile ? 'w-full' : 'flex-1'}
              bg-blue-600 hover:bg-blue-700 text-white
              ${isMobile ? 'h-12 text-base' : 'h-9 text-sm'}
              active:scale-95 transform transition-transform
            `}
            size={isMobile ? 'default' : 'sm'}
          >
            <MessageCircle className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
            금융상담
          </Button>

          <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
            {vehicle.detailurl && (
              <Button
                variant="outline"
                size={isMobile ? 'default' : 'sm'}
                className={`
                  ${isMobile ? 'flex-1 h-12' : 'h-9'}
                  active:scale-95 transform transition-transform
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(vehicle.detailurl, '_blank');
                }}
              >
                <ExternalLink className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
                {isMobile && <span className="ml-2">상세보기</span>}
              </Button>
            )}

            <Button
              variant="outline"
              size={isMobile ? 'default' : 'sm'}
              className={`
                ${isMobile ? 'flex-1 h-12' : 'h-9'}
                active:scale-95 transform transition-transform
              `}
              onClick={(e) => {
                e.stopPropagation();
                // 공유 기능 구현
                if (navigator.share && isMobile) {
                  navigator.share({
                    title: `${vehicle.manufacturer} ${vehicle.model}`,
                    text: `${vehicle.modelyear}년 ${vehicle.manufacturer} ${vehicle.model} - ${formatPrice(vehicle.price)}`,
                    url: vehicle.detailurl || window.location.href,
                  });
                }
              }}
            >
              <Share2 className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
              {isMobile && <span className="ml-2">공유</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* 선택 표시 */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
          <div className="bg-blue-500 text-white p-2 rounded-full">
            <ThumbsUp className="w-6 h-6" />
          </div>
        </div>
      )}
    </div>
  );
});

export { RealVehicleCard };