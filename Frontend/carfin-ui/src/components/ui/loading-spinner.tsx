'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, Car, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'car' | 'electric';
  className?: string;
  message?: string;
  progress?: number;
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  className?: string;
  animated?: boolean;
}

// 기본 스피너
export const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className,
  message,
  progress
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const renderSpinner = () => {
    const baseClass = cn(sizeClasses[size], 'animate-spin', className);

    switch (variant) {
      case 'dots':
        return <LoadingDots size={size} className={className} />;
      case 'pulse':
        return (
          <div className={cn('animate-pulse bg-blue-500 rounded-full', sizeClasses[size], className)} />
        );
      case 'car':
        return <Car className={cn(baseClass, 'text-blue-600')} />;
      case 'electric':
        return <Zap className={cn(baseClass, 'text-green-600')} />;
      default:
        return <Loader2 className={cn(baseClass, 'text-blue-600')} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {renderSpinner()}
      {message && (
        <p className="text-sm text-gray-600 text-center">{message}</p>
      )}
      {progress !== undefined && (
        <ProgressBar progress={progress} showPercentage className="w-48" />
      )}
    </div>
  );
});

// 점 애니메이션 로더
export const LoadingDots = memo(function LoadingDots({
  size = 'md',
  className
}: LoadingDotsProps) {
  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-blue-600 rounded-full animate-pulse',
            dotSizes[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
});

// 진행률 바
export const ProgressBar = memo(function ProgressBar({
  progress,
  showPercentage = true,
  className,
  animated = true
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {showPercentage && (
          <span className="text-xs text-gray-600">{Math.round(clampedProgress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600',
            animated && 'transition-all duration-300 ease-out'
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
});

// 스켈레톤 로더
export const SkeletonLoader = memo(function SkeletonLoader({
  className,
  lines = 3,
  showAvatar = false
}: {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
}) {
  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-24" />
            <div className="h-3 bg-gray-300 rounded w-16" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 bg-gray-300 rounded',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
});

// 차량 특화 로딩 컴포넌트
export const VehicleLoadingCard = memo(function VehicleLoadingCard() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      {/* 이미지 영역 */}
      <div className="h-48 bg-gray-300 relative">
        <div className="absolute top-3 left-3">
          <div className="w-16 h-6 bg-gray-400 rounded-full" />
        </div>
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 bg-gray-400 rounded-full" />
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="h-6 bg-gray-400 rounded mb-2" />
          <div className="h-4 bg-gray-400 rounded w-3/4" />
        </div>
      </div>

      {/* 내용 영역 */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-300 rounded w-24" />
          <div className="h-4 bg-gray-300 rounded w-16" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded" />
          ))}
        </div>

        <div className="flex gap-2">
          <div className="h-9 bg-gray-300 rounded flex-1" />
          <div className="h-9 bg-gray-300 rounded w-20" />
          <div className="h-9 bg-gray-300 rounded w-20" />
        </div>
      </div>
    </div>
  );
});

// 전체 페이지 로딩 오버레이
export const PageLoadingOverlay = memo(function PageLoadingOverlay({
  message = '로딩 중...',
  progress,
  variant = 'default'
}: {
  message?: string;
  progress?: number;
  variant?: LoadingSpinnerProps['variant'];
}) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full mx-4">
        <LoadingSpinner
          size="lg"
          variant={variant}
          message={message}
          progress={progress}
        />
      </div>
    </div>
  );
});

// 인라인 로딩 (버튼, 입력 필드 등)
export const InlineLoading = memo(function InlineLoading({
  size = 'sm',
  className
}: {
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <Loader2 className={cn(
      'animate-spin',
      size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
      className
    )} />
  );
});