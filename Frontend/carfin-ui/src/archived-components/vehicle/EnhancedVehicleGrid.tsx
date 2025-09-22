'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RealVehicleCard } from './RealVehicleCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Sparkles
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

interface EnhancedVehicleGridProps {
  userProfile?: any;
  onVehicleSelect?: (vehicleId: string) => void;
  onRequestFinancing?: (vehicleId: string) => void;
  selectedVehicles?: string[];
  maxSelection?: number;
  enableFilters?: boolean;
  showLoadMore?: boolean;
}

interface LoadingState {
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
  errorMessage?: string;
}

interface FilterState {
  priceRange: [number, number];
  maxDistance: number;
  minYear: number;
  brands: string[];
  bodyTypes: string[];
  fuelTypes: string[];
}

export function EnhancedVehicleGrid({
  userProfile,
  onVehicleSelect,
  onRequestFinancing,
  selectedVehicles = [],
  maxSelection = 3,
  enableFilters = true,
  showLoadMore = true
}: EnhancedVehicleGridProps) {
  // State 관리
  const [vehicles, setVehicles] = useState<RealVehicleData[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<RealVehicleData[]>([]);
  const [displayedVehicles, setDisplayedVehicles] = useState<RealVehicleData[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isLoadingMore: false,
    hasError: false
  });

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [500, 10000],
    maxDistance: 150000,
    minYear: 2015,
    brands: [],
    bodyTypes: [],
    fuelTypes: []
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<'match_score' | 'price' | 'year' | 'distance'>('match_score');
  const [showFilters, setShowFilters] = useState(false);

  // 실제 차량 데이터 로드
  const loadVehicleData = useCallback(async (loadMore = false) => {
    if (loadMore) {
      setLoadingState(prev => ({ ...prev, isLoadingMore: true }));
    } else {
      setLoadingState(prev => ({ ...prev, isLoading: true, hasError: false }));
    }

    try {
      const params = new URLSearchParams({
        minPrice: filters.priceRange[0].toString(),
        maxPrice: filters.priceRange[1].toString(),
        maxDistance: filters.maxDistance.toString(),
        minYear: filters.minYear.toString(),
        limit: (loadMore ? (currentPage + 1) * itemsPerPage : itemsPerPage).toString()
      });

      const response = await fetch(`/api/vehicles?${params}`, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.vehicles) {
        const newVehicles = data.vehicles.map((vehicle: any) => ({
          ...vehicle,
          match_score: vehicle.match_score || Math.floor(Math.random() * 30) + 70 // 임시 매치 점수
        }));

        if (loadMore) {
          setVehicles(prev => [...prev, ...newVehicles]);
        } else {
          setVehicles(newVehicles);
          setCurrentPage(1);
        }

        console.log(`✅ 차량 데이터 로드 완료: ${newVehicles.length}개 (소스: ${data.source})`);
      } else {
        throw new Error(data.error || '차량 데이터 로드 실패');
      }

    } catch (error) {
      console.error('❌ 차량 데이터 로드 오류:', error);
      setLoadingState(prev => ({
        ...prev,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : '알 수 없는 오류'
      }));
    } finally {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false
      }));
    }
  }, [filters, currentPage, itemsPerPage]);

  // 필터링 및 정렬 로직
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...vehicles];

    // 브랜드 필터
    if (filters.brands.length > 0) {
      filtered = filtered.filter(v => filters.brands.includes(v.manufacturer));
    }

    // 차종 필터
    if (filters.bodyTypes.length > 0) {
      filtered = filtered.filter(v => filters.bodyTypes.includes(v.cartype));
    }

    // 연료 타입 필터
    if (filters.fuelTypes.length > 0) {
      filtered = filtered.filter(v => filters.fuelTypes.includes(v.fueltype));
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'match_score':
          return (b.match_score || 0) - (a.match_score || 0);
        case 'price':
          return a.price - b.price;
        case 'year':
          return b.modelyear - a.modelyear;
        case 'distance':
          return a.distance - b.distance;
        default:
          return 0;
      }
    });

    setFilteredVehicles(filtered);
    setDisplayedVehicles(filtered.slice(0, currentPage * itemsPerPage));
  }, [vehicles, filters, sortBy, currentPage, itemsPerPage]);

  // 초기 데이터 로드
  useEffect(() => {
    loadVehicleData();
  }, []);

  // 필터 변경 시 재필터링
  useEffect(() => {
    applyFiltersAndSort();
  }, [vehicles, filters, sortBy, currentPage, applyFiltersAndSort]);

  // 유니크 옵션들 계산
  const uniqueOptions = useMemo(() => {
    const brands = [...new Set(vehicles.map(v => v.manufacturer))].sort();
    const bodyTypes = [...new Set(vehicles.map(v => v.cartype))].sort();
    const fuelTypes = [...new Set(vehicles.map(v => v.fueltype))].sort();

    return { brands, bodyTypes, fuelTypes };
  }, [vehicles]);

  // 이벤트 핸들러들
  const handleVehicleSelect = useCallback((vehicleId: string) => {
    if (onVehicleSelect) {
      onVehicleSelect(vehicleId);
    }

    // 사용자 행동 추적
    fetch('/api/analytics/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'vehicle_select',
        vehicle_id: vehicleId,
        timestamp: new Date().toISOString(),
        user_id: userProfile?.id || 'anonymous'
      })
    }).catch(console.error);
  }, [onVehicleSelect, userProfile]);

  const handleRequestFinancing = useCallback((vehicleId: string) => {
    if (onRequestFinancing) {
      onRequestFinancing(vehicleId);
    }

    // 금융 상담 요청 추적
    fetch('/api/analytics/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'finance_request',
        vehicle_id: vehicleId,
        timestamp: new Date().toISOString(),
        user_id: userProfile?.id || 'anonymous'
      })
    }).catch(console.error);
  }, [onRequestFinancing, userProfile]);

  const handleLoadMore = useCallback(() => {
    if (!loadingState.isLoadingMore && displayedVehicles.length < filteredVehicles.length) {
      setCurrentPage(prev => prev + 1);
    }
  }, [loadingState.isLoadingMore, displayedVehicles.length, filteredVehicles.length]);

  // 로딩 스켈레톤
  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );

  // 에러 상태
  if (loadingState.hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-red-50 rounded-lg">
        <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">데이터 로드 오류</h3>
        <p className="text-red-600 mb-4 text-center">{loadingState.errorMessage}</p>
        <Button
          onClick={() => loadVehicleData()}
          className="bg-red-600 hover:bg-red-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              AI 추천 차량
            </h2>
          </div>

          {loadingState.isLoading ? (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
              <Clock className="w-3 h-3 mr-1" />
              로딩 중...
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              {filteredVehicles.length}대 발견
            </Badge>
          )}
        </div>

        {/* 상단 액션 버튼들 */}
        <div className="flex items-center gap-3">
          {enableFilters && (
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              필터
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          )}

          {/* 정렬 옵션 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="match_score">매칭도순</option>
            <option value="price">가격순</option>
            <option value="year">연식순</option>
            <option value="distance">주행거리순</option>
          </select>

          <Button
            onClick={() => loadVehicleData()}
            variant="outline"
            size="sm"
            disabled={loadingState.isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${loadingState.isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 필터 패널 (확장 가능) */}
      {showFilters && enableFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 브랜드 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">브랜드</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {uniqueOptions.brands.map(brand => (
                  <label key={brand} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, brands: [...prev.brands, brand] }));
                        } else {
                          setFilters(prev => ({ ...prev, brands: prev.brands.filter(b => b !== brand) }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 차종 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">차종</label>
              <div className="space-y-1">
                {uniqueOptions.bodyTypes.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.bodyTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, bodyTypes: [...prev.bodyTypes, type] }));
                        } else {
                          setFilters(prev => ({ ...prev, bodyTypes: prev.bodyTypes.filter(t => t !== type) }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 연료 타입 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">연료</label>
              <div className="space-y-1">
                {uniqueOptions.fuelTypes.map(fuel => (
                  <label key={fuel} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.fuelTypes.includes(fuel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, fuelTypes: [...prev.fuelTypes, fuel] }));
                        } else {
                          setFilters(prev => ({ ...prev, fuelTypes: prev.fuelTypes.filter(f => f !== fuel) }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{fuel}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 필터 초기화 */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({
                priceRange: [500, 10000],
                maxDistance: 150000,
                minYear: 2015,
                brands: [],
                bodyTypes: [],
                fuelTypes: []
              })}
            >
              필터 초기화
            </Button>
          </div>
        </div>
      )}

      {/* 선택된 차량 수 표시 */}
      {selectedVehicles.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              {selectedVehicles.length}/{maxSelection}대 선택됨
            </span>
          </div>
          {selectedVehicles.length >= maxSelection && (
            <Badge className="bg-blue-100 text-blue-800">
              선택 완료
            </Badge>
          )}
        </div>
      )}

      {/* 차량 그리드 */}
      {loadingState.isLoading ? renderLoadingSkeleton() : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedVehicles.map((vehicle) => (
            <RealVehicleCard
              key={vehicle.vehicleid}
              vehicle={vehicle}
              onVehicleSelect={handleVehicleSelect}
              onRequestFinancing={handleRequestFinancing}
              isSelected={selectedVehicles.includes(vehicle.vehicleid)}
              showMatchScore={true}
            />
          ))}
        </div>
      )}

      {/* 결과 없음 메시지 */}
      {!loadingState.isLoading && displayedVehicles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
          <Car className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">조건에 맞는 차량이 없습니다</h3>
          <p className="text-gray-500 mb-4">필터 조건을 조정해 보세요</p>
          <Button
            variant="outline"
            onClick={() => setFilters({
              priceRange: [500, 10000],
              maxDistance: 150000,
              minYear: 2015,
              brands: [],
              bodyTypes: [],
              fuelTypes: []
            })}
          >
            필터 초기화
          </Button>
        </div>
      )}

      {/* 더 보기 버튼 */}
      {showLoadMore && !loadingState.isLoading && displayedVehicles.length < filteredVehicles.length && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleLoadMore}
            disabled={loadingState.isLoadingMore}
            className="flex items-center gap-2"
          >
            {loadingState.isLoadingMore ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                로딩 중...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                더 많은 차량 보기 ({filteredVehicles.length - displayedVehicles.length}대 더)
              </>
            )}
          </Button>
        </div>
      )}

      {/* 통계 정보 */}
      {!loadingState.isLoading && displayedVehicles.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{filteredVehicles.length}</div>
              <div className="text-sm text-gray-600">총 차량 수</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(filteredVehicles.reduce((sum, v) => sum + (v.match_score || 0), 0) / filteredVehicles.length)}%
              </div>
              <div className="text-sm text-gray-600">평균 매칭도</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(filteredVehicles.reduce((sum, v) => sum + v.price, 0) / filteredVehicles.length / 100) / 10}천만원
              </div>
              <div className="text-sm text-gray-600">평균 가격</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(filteredVehicles.reduce((sum, v) => sum + (2025 - v.modelyear), 0) / filteredVehicles.length)}년
              </div>
              <div className="text-sm text-gray-600">평균 연식</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}