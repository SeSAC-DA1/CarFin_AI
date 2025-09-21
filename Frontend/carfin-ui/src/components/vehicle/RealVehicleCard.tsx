'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export function RealVehicleCard({
  vehicle,
  onVehicleSelect,
  onRequestFinancing,
  isSelected = false,
  showMatchScore = true
}: RealVehicleCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // 이미지 URL 처리
  const getImageUrl = () => {
    if (vehicle.photo && !imageError) {
      return vehicle.photo;
    }

    // 폴백 이미지 - Unsplash에서 차량 관련 이미지
    const fallbackImages = [
      'https://images.unsplash.com/photo-1494976688016-a3dc3d0b10e5?w=400&h=300&fit=crop&auto=format&q=80', // 흰색 세단
      'https://images.unsplash.com/photo-1549924231-f129b911e442?w=400&h=300&fit=crop&auto=format&q=80', // 현대 소나타
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop&auto=format&q=80', // 기아 차량
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop&auto=format&q=80', // BMW
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop&auto=format&q=80', // 테슬라
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop&auto=format&q=80', // SUV
    ];

    // 차량 ID를 기반으로 일관성 있는 이미지 선택
    const hash = vehicle.vehicleid.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return fallbackImages[hash % fallbackImages.length];
  };

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

  const handleCardClick = () => {
    if (onVehicleSelect) {
      onVehicleSelect(vehicle.vehicleid);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleFinanceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestFinancing) {
      onRequestFinancing(vehicle.vehicleid);
    }
  };

  return (
    <div
      className={`
        group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        hover:scale-[1.02] transform
      `}
      onClick={handleCardClick}
    >
      {/* 이미지 섹션 */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <Image
          src={getImageUrl()}
          alt={`${vehicle.manufacturer} ${vehicle.model}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          onError={() => setImageError(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
            className={`
              p-2 rounded-full transition-all duration-200 backdrop-blur-sm
              ${isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'}
            `}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
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
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleFinanceClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            금융상담
          </Button>

          {vehicle.detailurl && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(vehicle.detailurl, '_blank');
              }}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // 공유 기능 구현
            }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
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
}