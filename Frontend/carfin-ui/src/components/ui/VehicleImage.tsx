'use client';

import { useState, useEffect } from 'react';
import { Car } from 'lucide-react';

interface VehicleImageProps {
  src?: string;
  alt: string;
  manufacturer?: string;
  model?: string;
  vehicleId?: string;
  cartype?: string; // 차종 정보 추가
  className?: string;
  fallbackClassName?: string;
  showPlaceholder?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  useApi?: boolean; // API를 통해 이미지를 동적으로 가져올지 여부
}

export function VehicleImage({
  src,
  alt,
  manufacturer = '',
  model = '',
  vehicleId,
  cartype,
  className = '',
  fallbackClassName = '',
  showPlaceholder = true,
  size = 'md',
  useApi = true
}: VehicleImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [dynamicImageSrc, setDynamicImageSrc] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-36'
  };

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  // API를 통한 동적 이미지 로드
  useEffect(() => {
    const fetchVehicleImage = async () => {
      if (!useApi || src) return; // 이미 src가 있거나 API 사용하지 않을 경우 스킵

      if (!manufacturer && !model && !vehicleId) return;

      try {
        const params = new URLSearchParams();
        if (manufacturer) params.append('manufacturer', manufacturer);
        if (model) params.append('model', model);
        if (vehicleId) params.append('vehicleId', vehicleId);
        if (cartype) params.append('cartype', cartype);

        const response = await fetch(`/api/vehicles/images?${params}`);
        const data = await response.json();

        if (data.success && data.imageUrl) {
          setDynamicImageSrc(data.imageUrl);
          console.log(`🚗 동적 이미지 로드 성공: ${manufacturer} ${model}`);
        }
      } catch (error) {
        console.error('차량 이미지 API 호출 실패:', error);
        setImageError(true);
      }
    };

    fetchVehicleImage();
  }, [manufacturer, model, vehicleId, cartype, src, useApi]);

  // 실제 사용할 이미지 소스 결정
  const finalImageSrc = src || dynamicImageSrc;

  // 이미지가 없거나 에러가 발생한 경우 플레이스홀더 표시
  if (!finalImageSrc || imageError) {
    if (!showPlaceholder) {
      return null;
    }

    return (
      <div className={`
        ${sizeClasses[size]}
        bg-gradient-to-br from-slate-100 to-slate-200
        rounded-lg
        flex items-center justify-center
        border border-slate-300
        ${fallbackClassName}
        ${className}
      `}>
        <div className="text-center">
          <Car className={`${iconSizeClasses[size]} text-slate-400 mx-auto mb-1`} />
          {(size === 'lg' || size === 'xl') && (
            <div className="text-xs text-slate-500 font-medium">
              {manufacturer} {model}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative overflow-hidden rounded-lg ${className}`}>
      {imageLoading && showPlaceholder && (
        <div className={`
          absolute inset-0
          bg-gradient-to-br from-slate-100 to-slate-200
          flex items-center justify-center
          animate-pulse
        `}>
          <Car className={`${iconSizeClasses[size]} text-slate-400`} />
        </div>
      )}

      <img
        src={finalImageSrc}
        alt={alt}
        className={`
          w-full h-full object-cover
          transition-opacity duration-300
          ${imageLoading ? 'opacity-0' : 'opacity-100'}
        `}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />

      {/* 이미지 오버레이 - 브랜드 정보 */}
      {!imageLoading && !imageError && (size === 'lg' || size === 'xl') && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="text-white text-xs font-medium truncate">
            {manufacturer} {model}
          </div>
        </div>
      )}
    </div>
  );
}

// 차량 이미지 플레이스홀더 생성 유틸리티
export function generateVehicleImageUrl(manufacturer: string, model: string, year?: number): string {
  const cleanManufacturer = manufacturer.toLowerCase().replace(/\s+/g, '');
  const cleanModel = model.toLowerCase().replace(/\s+/g, '');
  const yearSuffix = year ? `_${year}` : '';
  return `/images/cars/${cleanManufacturer}_${cleanModel}${yearSuffix}.jpg`;
}

// 브랜드별 대표 색상 반환
export function getBrandColor(manufacturer: string): string {
  const brandColors: Record<string, string> = {
    '현대': 'var(--expert-vehicle-bright)',
    '기아': 'var(--expert-finance-bright)',
    '제네시스': 'var(--expert-orchestrator-bright)',
    'BMW': 'var(--expert-review-bright)',
    '벤츠': 'var(--expert-vehicle-bright)',
    '아우디': 'var(--expert-finance-bright)',
    '토요타': 'var(--expert-review-bright)',
    '혼다': 'var(--expert-vehicle-bright)',
    '닛산': 'var(--expert-orchestrator-bright)',
    '폭스바겐': 'var(--expert-finance-bright)'
  };

  return brandColors[manufacturer] || 'var(--expert-vehicle-bright)';
}