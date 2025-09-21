'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Maximize2, Play, X } from 'lucide-react';

interface OptimizedImageProps {
  src: string | string[];
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  showRetry?: boolean;
  priority?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  onLoad?: () => void;
  onError?: () => void;
  enableGallery?: boolean;
  autoPlay?: boolean;
  showThumbnails?: boolean;
  quality?: number;
}

interface FallbackImageOptions {
  vehicleType?: 'sedan' | 'suv' | 'hatchback' | 'coupe' | 'truck' | 'electric';
  manufacturer?: string;
  color?: 'white' | 'black' | 'silver' | 'blue' | 'red';
}

// 고품질 차량 이미지 풀
const VEHICLE_FALLBACK_IMAGES = {
  sedan: [
    'https://images.unsplash.com/photo-1494976688016-a3dc3d0b10e5?w=800&h=600&fit=crop&auto=format&q=85', // 흰색 세단
    'https://images.unsplash.com/photo-1549924231-f129b911e442?w=800&h=600&fit=crop&auto=format&q=85', // 현대 소나타
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&auto=format&q=85', // 기아 차량
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&auto=format&q=85', // BMW 세단
  ],
  suv: [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&auto=format&q=85', // SUV
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop&auto=format&q=85', // 현대 SUV
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&auto=format&q=85', // 검은 SUV
  ],
  electric: [
    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop&auto=format&q=85', // 테슬라
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=600&fit=crop&auto=format&q=85', // 전기차
  ],
  hatchback: [
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop&auto=format&q=85', // 해치백
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=600&fit=crop&auto=format&q=85', // 소형차
  ],
  coupe: [
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop&auto=format&q=85', // 스포츠카
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&auto=format&q=85', // 쿠페
  ],
  truck: [
    'https://images.unsplash.com/photo-1558618047-85c1c2e4cd5c?w=800&h=600&fit=crop&auto=format&q=85', // 트럭
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop&auto=format&q=85', // 픽업트럭
  ],
  default: [
    'https://images.unsplash.com/photo-1494976688016-a3dc3d0b10e5?w=800&h=600&fit=crop&auto=format&q=85',
    'https://images.unsplash.com/photo-1549924231-f129b911e442?w=800&h=600&fit=crop&auto=format&q=85',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&auto=format&q=85',
  ]
};

export function getVehicleFallbackImage(
  vehicleId: string | number,
  options: FallbackImageOptions = {}
): string {
  const { vehicleType = 'sedan', manufacturer } = options;

  // 차량 타입별 이미지 선택
  let imagePool = VEHICLE_FALLBACK_IMAGES[vehicleType] || VEHICLE_FALLBACK_IMAGES.default;

  // 제조사별 최적화
  if (manufacturer) {
    const brandLower = manufacturer.toLowerCase();
    if (brandLower.includes('tesla')) {
      imagePool = VEHICLE_FALLBACK_IMAGES.electric;
    } else if (brandLower.includes('bmw') || brandLower.includes('mercedes') || brandLower.includes('audi')) {
      imagePool = VEHICLE_FALLBACK_IMAGES.sedan.filter(url => url.includes('bmw') || url.includes('555215695'));
    } else if (brandLower.includes('hyundai') || brandLower.includes('kia') || brandLower.includes('현대') || brandLower.includes('기아')) {
      imagePool = VEHICLE_FALLBACK_IMAGES.sedan.filter(url => url.includes('549924231') || url.includes('552519507'));
    }
  }

  // 차량 ID를 기반으로 일관성 있는 이미지 선택
  const idString = String(vehicleId || 'default');
  const hash = idString.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return imagePool[hash % imagePool.length];
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackSrc,
  showRetry = true,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  placeholder = 'empty',
  onLoad,
  onError,
  enableGallery = false,
  autoPlay = false,
  showThumbnails = false,
  quality = 85,
}: OptimizedImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error' | 'retrying'>('loading');
  const imageSrc = Array.isArray(src) ? src[0] : src;
  const [currentSrc, setCurrentSrc] = useState(imageSrc);
  const [retryCount, setRetryCount] = useState(0);

  // 디버깅 로그 추가
  console.log('🖼️ OptimizedImage 컴포넌트:', {
    src,
    fallbackSrc,
    currentSrc,
    imageState,
    retryCount,
    alt
  });

  const handleImageLoad = useCallback(() => {
    console.log('✅ 이미지 로딩 성공:', currentSrc);
    setImageState('loaded');
    onLoad?.();
  }, [onLoad, currentSrc]);

  const handleImageError = useCallback(() => {
    console.warn(`❌ 이미지 로딩 실패: ${currentSrc}`);

    if (retryCount === 0 && fallbackSrc) {
      // 첫 번째 실패 시 fallback 이미지 시도
      console.log('🔄 폴백 이미지로 재시도:', fallbackSrc);
      setCurrentSrc(fallbackSrc);
      setRetryCount(1);
      setImageState('retrying');
    } else {
      setImageState('error');
      onError?.();
    }
  }, [currentSrc, fallbackSrc, retryCount, onError]);

  const handleRetry = useCallback(() => {
    setImageState('loading');
    setCurrentSrc(imageSrc);
    setRetryCount(0);
  }, [imageSrc]);

  // 임시: 바로 이미지 표시 (로딩 상태 건너뛰기)
  return (
    <div className={`relative ${className}`}>
      <Image
        src={currentSrc}
        alt={alt}
        width={width || 800}
        height={height || 600}
        className="w-full h-full object-cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
        priority={priority}
        sizes={sizes}
        placeholder={placeholder}
        quality={quality}
        unoptimized={false}
      />

      {/* 로딩 오버레이 */}
      {imageState === 'loading' || imageState === 'retrying' ? (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="text-xs">
              {imageState === 'retrying' ? '재시도 중...' : '이미지 로딩 중...'}
            </span>
          </div>
        </div>
      ) : null}

      {/* 에러 오버레이 */}
      {imageState === 'error' ? (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500 p-4">
            <Camera className="w-8 h-8" />
            <div className="text-center">
              <p className="text-sm font-medium">이미지를 불러올 수 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">차량 사진이 준비 중입니다</p>
            </div>
            {showRetry && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                다시 시도
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* 로딩 완료 표시 (개발용) */}
      {process.env.NODE_ENV === 'development' && retryCount > 0 && (
        <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs px-1 rounded">
          Fallback
        </div>
      )}
    </div>
  );
}

// 차량 카드용 최적화된 이미지 컴포넌트
export function VehicleImage({
  vehicleId,
  src,
  manufacturer,
  model,
  vehicleType,
  className = 'w-full h-48',
  priority = false,
  enableGallery = true,
  autoPlay = false,
  showThumbnails = false,
  quality = 90,
}: {
  vehicleId: string;
  src?: string | string[];
  manufacturer: string;
  model: string;
  vehicleType?: string;
  className?: string;
  priority?: boolean;
  enableGallery?: boolean;
  autoPlay?: boolean;
  showThumbnails?: boolean;
  quality?: number;
}) {
  // 차량 타입 매핑
  const getVehicleTypeFromModel = (model: string): FallbackImageOptions['vehicleType'] => {
    const modelLower = model.toLowerCase();
    if (modelLower.includes('suv') || modelLower.includes('sorento') || modelLower.includes('tucson')) return 'suv';
    if (modelLower.includes('coupe') || modelLower.includes('genesis')) return 'coupe';
    if (modelLower.includes('truck')) return 'truck';
    if (modelLower.includes('tesla') || modelLower.includes('ioniq') || modelLower.includes('ev')) return 'electric';
    if (modelLower.includes('hatch')) return 'hatchback';
    return 'sedan';
  };

  const detectedVehicleType = vehicleType || getVehicleTypeFromModel(model);
  const fallbackSrc = getVehicleFallbackImage(vehicleId, {
    vehicleType: detectedVehicleType as FallbackImageOptions['vehicleType'],
    manufacturer
  });

  // 다중 이미지 처리
  const imageArray = Array.isArray(src) ? src : src ? [src] : [fallbackSrc];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [showFullGallery, setShowFullGallery] = useState(false);

  // 자동 재생 기능
  useEffect(() => {
    if (isAutoPlaying && imageArray.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imageArray.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, imageArray.length]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageArray.length);
    setIsAutoPlaying(false);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageArray.length) % imageArray.length);
    setIsAutoPlaying(false);
  };

  const currentSrc = imageArray[currentImageIndex] || fallbackSrc;

  // 디버깅 로그 추가
  console.log('🖼️ VehicleImage 컴포넌트:', {
    vehicleId,
    originalSrc: src,
    manufacturer,
    model,
    detectedVehicleType,
    fallbackSrc,
    finalSrc: src || fallbackSrc
  });

  if (enableGallery && imageArray.length > 1) {
    return (
      <div className={`relative group ${className}`}>
        <OptimizedImage
          src={currentSrc}
          alt={`${manufacturer} ${model} - 이미지 ${currentImageIndex + 1}/${imageArray.length}`}
          fallbackSrc={fallbackSrc}
          className="w-full h-full"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          showRetry={true}
          quality={quality}
        />

        {/* 이미진 내비게이션 컴트롤 */}
        {imageArray.length > 1 && (
          <>
            {/* 이전/다음 버튼 */}
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="이전 이미지"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="다음 이미지"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* 이미지 카운터 */}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {currentImageIndex + 1} / {imageArray.length}
            </div>

            {/* 자동재생 컴트롤 */}
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title={isAutoPlaying ? '자동재생 중지' : '자동재생 시작'}
            >
              <Play className={`w-3 h-3 ${isAutoPlaying ? 'text-green-400' : 'text-white'}`} />
            </button>

            {/* 확대보기 버튼 */}
            <button
              onClick={() => setShowFullGallery(true)}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="전체보기"
            >
              <Maximize2 className="w-3 h-3" />
            </button>

            {/* 도트 인디케이터 */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {imageArray.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    setIsAutoPlaying(false);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* 풀스크린 갤러리 모달 */}
        {showFullGallery && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              <OptimizedImage
                src={currentSrc}
                alt={`${manufacturer} ${model} - 풀스크린`}
                fallbackSrc={fallbackSrc}
                className="max-w-full max-h-full object-contain"
                priority={true}
                quality={95}
              />

              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowFullGallery(false)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>

              {/* 내비게이션 */}
              {imageArray.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* 썸네일 그리드 */}
              {showThumbnails && imageArray.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg">
                  {imageArray.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-16 h-12 rounded overflow-hidden border-2 ${
                        index === currentImageIndex ? 'border-white' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`썸네일 ${index + 1}`}
                        width={64}
                        height={48}
                        className="w-full h-full object-cover"
                        quality={60}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 단일 이미지 모드
  return (
    <OptimizedImage
      src={currentSrc}
      alt={`${manufacturer} ${model}`}
      fallbackSrc={fallbackSrc}
      className={className}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      showRetry={true}
      quality={quality}
    />
  );
}