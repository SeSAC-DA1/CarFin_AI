'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { RealVehicleCard } from './RealVehicleCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMobile, useScrollOptimization } from '@/hooks/use-mobile';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  Car,
  DollarSign,
  Clock,
  Sparkles,
  Eye,
  Heart,
  ThumbsUp,
  ThumbsDown
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

interface OptimizedVehicleGridProps {
  userProfile?: any;
  onVehicleSelect?: (vehicleId: string) => void;
  onSelectionComplete?: (selections: any[]) => void;
  onRequestFinancing?: (vehicleId: string) => void;
  maxSelection?: number;
  enableVirtualization?: boolean;
  className?: string;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress: number;
}

interface FilterState {
  priceRange: [number, number];
  fuelTypes: string[];
  brands: string[];
  yearRange: [number, number];
  sortBy: 'price' | 'year' | 'distance' | 'match_score';
  sortOrder: 'asc' | 'desc';
}

// 스켈레톤 카드 컴포넌트 (메모화)
const VehicleCardSkeleton = memo(function VehicleCardSkeleton() {
  const { isMobile } = useMobile();

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden ${isMobile ? 'mx-2' : ''}`}>
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-24" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
          <Skeleton className={`h-9 ${isMobile ? 'w-full' : 'flex-1'}`} />
          <Skeleton className={`h-9 ${isMobile ? 'w-full' : 'w-20'}`} />
        </div>
      </div>
    </div>
  );
});

// 필터 바 컴포넌트 (메모화)
const FilterBar = memo(function FilterBar({
  filter,
  onFilterChange,
  onSort,
  vehicleCount
}: {
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  onSort: (sortBy: FilterState['sortBy'], sortOrder: FilterState['sortOrder']) => void;
  vehicleCount: number;
}) {
  const { isMobile } = useMobile();

  const handlePriceRangeChange = useCallback((min: number, max: number) => {
    onFilterChange({
      ...filter,
      priceRange: [min, max]
    });
  }, [filter, onFilterChange]);

  const handleSortChange = useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [FilterState['sortBy'], FilterState['sortOrder']];
    onSort(sortBy, sortOrder);
  }, [onSort]);

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border mb-6 ${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
      <div className={`flex items-center gap-4 ${isMobile ? 'flex-wrap' : ''}`}>
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">{vehicleCount}대</span>
        </div>

        {!isMobile && (
          <>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">
                {filter.priceRange[0]}만원 - {filter.priceRange[1]}만원
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">
                {filter.fuelTypes.length > 0 ? filter.fuelTypes.join(', ') : '모든 연료'}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <select
          value={`${filter.sortBy}-${filter.sortOrder}`}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="match_score-desc">추천순</option>
          <option value="price-asc">가격 낮은순</option>
          <option value="price-desc">가격 높은순</option>
          <option value="year-desc">최신순</option>
          <option value="distance-asc">주행거리 적은순</option>
        </select>

        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {isMobile ? '' : '필터'}
        </Button>
      </div>
    </div>
  );
});

// 상태 표시 컴포넌트
const StatusBar = memo(function StatusBar({
  selectedCount,
  maxSelection,
  onProceed
}: {
  selectedCount: number;
  maxSelection: number;
  onProceed?: () => void;
}) {
  const { isMobile } = useMobile();
  const isComplete = selectedCount >= 3; // 최소 3개 선택

  return (
    <div className={`sticky bottom-0 bg-white border-t p-4 shadow-lg ${isMobile ? 'px-6' : ''}`}>
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Heart className={`w-5 h-5 ${selectedCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            <span className="font-medium">
              선택된 차량: {selectedCount}/{maxSelection}
            </span>
          </div>

          {selectedCount > 0 && selectedCount < 3 && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              최소 3개 이상 선택
            </Badge>
          )}

          {isComplete && (
            <Badge className="bg-green-500 text-white">
              선택 완료!
            </Badge>
          )}
        </div>

        {isComplete && (
          <Button
            onClick={onProceed}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            size={isMobile ? 'default' : 'sm'}
          >
            <CheckCircle className="w-4 h-4" />
            다음 단계로
          </Button>
        )}
      </div>
    </div>
  );
});

export const OptimizedVehicleGrid = memo(function OptimizedVehicleGrid({
  userProfile,
  onVehicleSelect,
  onSelectionComplete,
  onRequestFinancing,
  maxSelection = 10,
  enableVirtualization = true,
  className = ''
}: OptimizedVehicleGridProps) {
  const { isMobile, isTablet } = useMobile();
  const { isScrolling } = useScrollOptimization();

  // 상태 관리
  const [vehicles, setVehicles] = useState<RealVehicleData[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
    progress: 0
  });

  // 필터 상태
  const [filter, setFilter] = useState<FilterState>({
    priceRange: [500, 8000],
    fuelTypes: [],
    brands: [],
    yearRange: [2015, 2024],
    sortBy: 'match_score',
    sortOrder: 'desc'
  });

  // 데이터 로딩
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, isLoading: true, progress: 0 }));

    try {
      setLoadingState(prev => ({ ...prev, progress: 30 }));

      const params = new URLSearchParams({
        minPrice: filter.priceRange[0].toString(),
        maxPrice: filter.priceRange[1].toString(),
        minYear: filter.yearRange[0].toString(),
        limit: '20'
      });

      const response = await fetch(`/api/vehicles?${params}`);
      setLoadingState(prev => ({ ...prev, progress: 70 }));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setLoadingState(prev => ({ ...prev, progress: 90 }));

      if (data.success && data.vehicles) {
        setVehicles(data.vehicles);
        setLoadingState({
          isLoading: false,
          error: null,
          progress: 100
        });
      } else {
        throw new Error(data.error || '차량 데이터를 불러올 수 없습니다');
      }
    } catch (error) {
      console.error('차량 로딩 실패:', error);
      setLoadingState({
        isLoading: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        progress: 0
      });
    }
  }, [filter.priceRange, filter.yearRange]);

  // 필터링 및 정렬된 차량 목록 (메모화)
  const filteredAndSortedVehicles = useMemo(() => {
    let result = [...vehicles];

    // 연료 타입 필터
    if (filter.fuelTypes.length > 0) {
      result = result.filter(v => filter.fuelTypes.includes(v.fueltype));
    }

    // 브랜드 필터
    if (filter.brands.length > 0) {
      result = result.filter(v => filter.brands.includes(v.manufacturer));
    }

    // 정렬
    result.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (filter.sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'year':
          aValue = a.modelyear;
          bValue = b.modelyear;
          break;
        case 'distance':
          aValue = a.distance;
          bValue = b.distance;
          break;
        case 'match_score':
          aValue = a.match_score || 0;
          bValue = b.match_score || 0;
          break;
        default:
          return 0;
      }

      return filter.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [vehicles, filter]);

  // 차량 선택 핸들러
  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else if (newSet.size < maxSelection) {
        newSet.add(vehicleId);
      }
      return newSet;
    });

    onVehicleSelect?.(vehicleId);
  }, [maxSelection, onVehicleSelect]);

  // 완료 처리
  const handleProceed = useCallback(() => {
    const selectedVehicleData = filteredAndSortedVehicles.filter(v =>
      selectedVehicles.has(v.vehicleid)
    );
    onSelectionComplete?.(selectedVehicleData);
  }, [filteredAndSortedVehicles, selectedVehicles, onSelectionComplete]);

  // 그리드 컬럼 계산
  const gridColumns = useMemo(() => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  }, [isMobile, isTablet]);

  // 로딩 상태
  if (loadingState.isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg font-medium">차량 데이터를 불러오는 중...</span>
          </div>
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingState.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">{loadingState.progress}% 완료</p>
        </div>

        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1 px-4' : isTablet ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <VehicleCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (loadingState.error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">차량 데이터를 불러올 수 없습니다</h3>
        <p className="text-gray-600 mb-6">{loadingState.error}</p>
        <Button onClick={loadVehicles} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 필터 바 */}
      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        onSort={(sortBy, sortOrder) => setFilter(prev => ({ ...prev, sortBy, sortOrder }))}
        vehicleCount={filteredAndSortedVehicles.length}
      />

      {/* 차량 그리드 */}
      <div className={`
        grid gap-6
        ${isMobile ? 'grid-cols-1 px-4' : isTablet ? 'grid-cols-2' : 'grid-cols-3'}
        ${isScrolling ? 'pointer-events-none' : ''}
      `}>
        {filteredAndSortedVehicles.map((vehicle) => (
          <RealVehicleCard
            key={vehicle.vehicleid}
            vehicle={vehicle}
            onVehicleSelect={handleVehicleSelect}
            onRequestFinancing={onRequestFinancing}
            isSelected={selectedVehicles.has(vehicle.vehicleid)}
            showMatchScore={true}
          />
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredAndSortedVehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">조건에 맞는 차량이 없습니다</h3>
          <p className="text-gray-600">필터 조건을 조정해보세요</p>
        </div>
      )}

      {/* 상태 바 */}
      <StatusBar
        selectedCount={selectedVehicles.size}
        maxSelection={maxSelection}
        onProceed={selectedVehicles.size >= 3 ? handleProceed : undefined}
      />
    </div>
  );
});