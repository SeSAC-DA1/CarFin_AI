'use client';

import React, { useState, useEffect } from 'react';
import { Car, Gauge, MapPin, ExternalLink, Eye } from 'lucide-react';

interface VehicleRecommendation {
  manufacturer: string;
  model: string;
  modelyear: number;
  price: number;
  distance: number;
  location: string;
  fueltype: string;
  detailurl?: string;
  photo?: string;
  platform?: string;
  originprice?: number;
  suitabilityScore: number;
  rank: number;
  recommendationReason?: string;
}

interface SimpleVehicleCardProps {
  vehicle: VehicleRecommendation;
  rank: number;
  onDetailClick: () => void;
}

export default function SimpleVehicleCard({ vehicle, rank, onDetailClick }: SimpleVehicleCardProps) {
  const [imageError, setImageError] = useState(false);
  const [realVehicleImage, setRealVehicleImage] = useState<string | null>(null);

  const getRankConfig = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          gradient: 'from-yellow-400 to-orange-500',
          icon: '🥇',
          label: '1순위',
          badgeBg: 'bg-yellow-50',
          badgeText: 'text-yellow-800',
          border: 'border-yellow-300'
        };
      case 2:
        return {
          gradient: 'from-gray-400 to-gray-600',
          icon: '🥈',
          label: '2순위',
          badgeBg: 'bg-gray-50',
          badgeText: 'text-gray-800',
          border: 'border-gray-300'
        };
      case 3:
        return {
          gradient: 'from-orange-600 to-red-500',
          icon: '🥉',
          label: '3순위',
          badgeBg: 'bg-orange-50',
          badgeText: 'text-orange-800',
          border: 'border-orange-300'
        };
      default:
        return {
          gradient: 'from-blue-400 to-blue-600',
          icon: '⭐',
          label: '추천',
          badgeBg: 'bg-blue-50',
          badgeText: 'text-blue-800',
          border: 'border-blue-300'
        };
    }
  };

  const rankConfig = getRankConfig(rank);

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

  useEffect(() => {
    if (vehicle.photo) {
      const imageUrl = buildEncarImageUrl(vehicle.photo);
      setRealVehicleImage(imageUrl);
    }
  }, [vehicle.photo]);

  const handleDetailLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vehicle.detailurl) {
      window.open(vehicle.detailurl, '_blank');
    }
  };

  return (
    <div className="flex-shrink-0 w-72 bg-white rounded-xl border-2 border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group snap-start">
      {/* 순위 뱃지 */}
      <div className={`bg-gradient-to-r ${rankConfig.gradient} px-3 py-2 text-white relative`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{rankConfig.icon}</span>
            <span className="font-bold text-sm">{rankConfig.label} 추천</span>
          </div>
          <div className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-full">
            <span className="text-xs font-bold">⭐ {vehicle.suitabilityScore}</span>
          </div>
        </div>
      </div>

      {/* 차량 이미지 */}
      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {realVehicleImage && !imageError ? (
          <img
            src={`/api/proxy-image?url=${encodeURIComponent(realVehicleImage)}`}
            alt={`${vehicle.manufacturer} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Car className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700">{vehicle.manufacturer}</p>
              <p className="text-xs text-gray-500">{vehicle.model}</p>
            </div>
          </div>
        )}
      </div>

      {/* 차량 정보 */}
      <div className="p-3 space-y-2">
        {/* 차량명 */}
        <h3 className="font-bold text-gray-900 text-base truncate">
          {vehicle.manufacturer} {vehicle.model}
        </h3>

        {/* 스펙 정보 */}
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <span>📅</span>
              <span>{vehicle.modelyear}년</span>
            </span>
            <span className="flex items-center space-x-1">
              <Gauge className="w-3 h-3" />
              <span>{(vehicle.distance / 10000).toFixed(1)}만km</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <span>⛽</span>
              <span>{vehicle.fueltype}</span>
            </span>
            <span className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{vehicle.location}</span>
            </span>
          </div>
        </div>

        {/* 가격 */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {vehicle.price?.toLocaleString()}만원
              </div>
              {vehicle.originprice && vehicle.originprice > vehicle.price && (
                <div className="text-xs text-gray-500 line-through">
                  {vehicle.originprice.toLocaleString()}만원
                </div>
              )}
            </div>
            {vehicle.originprice && vehicle.originprice > vehicle.price && (
              <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                -{Math.round((1 - vehicle.price / vehicle.originprice) * 100)}%
              </div>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="pt-2 flex gap-2">
          {vehicle.detailurl && (
            <button
              onClick={handleDetailLinkClick}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center justify-center space-x-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>실매물</span>
            </button>
          )}
          <button
            onClick={onDetailClick}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-xs font-medium flex items-center justify-center space-x-1"
          >
            <Eye className="w-3 h-3" />
            <span>자세히</span>
          </button>
        </div>
      </div>
    </div>
  );
}
