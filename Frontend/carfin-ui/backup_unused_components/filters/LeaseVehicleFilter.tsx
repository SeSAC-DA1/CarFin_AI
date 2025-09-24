'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Car,
  Shield,
  AlertTriangle,
  CheckCircle,
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

export interface LeaseFilterState {
  showLeaseVehicles: boolean;
  showRegularVehicles: boolean;
  suspiciousOnly: boolean;
  priceRangeFilter: 'all' | 'low' | 'medium' | 'high';
  brandFilter: string[];
}

interface LeaseVehicleFilterProps {
  onFilterChange: (filters: LeaseFilterState) => void;
  leaseStats?: {
    totalVehicles: number;
    leaseVehicles: number;
    regularVehicles: number;
    suspiciousVehicles: number;
  };
  className?: string;
}

const LEASE_DETECTION_BRANDS = [
  'BMW', '메르세데스-벤츠', '아우디', '제네시스', '렉서스',
  '볼보', '재규어', '랜드로버', '포르쉐', '테슬라'
];

const PRICE_RANGES = {
  low: { label: '저가 (1-3천만원)', min: 100, max: 3000 },
  medium: { label: '중가 (3-7천만원)', min: 3000, max: 7000 },
  high: { label: '고가 (7천만원+)', min: 7000, max: 50000 }
};

export const LeaseVehicleFilter: React.FC<LeaseVehicleFilterProps> = ({
  onFilterChange,
  leaseStats = {
    totalVehicles: 0,
    leaseVehicles: 0,
    regularVehicles: 0,
    suspiciousVehicles: 0
  },
  className = ''
}) => {
  const [filters, setFilters] = useState<LeaseFilterState>({
    showLeaseVehicles: true,
    showRegularVehicles: true,
    suspiciousOnly: false,
    priceRangeFilter: 'all',
    brandFilter: []
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (newFilters: Partial<LeaseFilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleBrandToggle = (brand: string) => {
    const newBrandFilter = filters.brandFilter.includes(brand)
      ? filters.brandFilter.filter(b => b !== brand)
      : [...filters.brandFilter, brand];

    updateFilters({ brandFilter: newBrandFilter });
  };

  const resetFilters = () => {
    const defaultFilters: LeaseFilterState = {
      showLeaseVehicles: true,
      showRegularVehicles: true,
      suspiciousOnly: false,
      priceRangeFilter: 'all',
      brandFilter: []
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const leaseDetectionRate = leaseStats.totalVehicles > 0
    ? Math.round((leaseStats.leaseVehicles / leaseStats.totalVehicles) * 100)
    : 0;

  const suspiciousRate = leaseStats.totalVehicles > 0
    ? Math.round((leaseStats.suspiciousVehicles / leaseStats.totalVehicles) * 100)
    : 0;

  return (
    <Card className={`bg-gray-900/50 border-gray-700 ${className}`}>
      <CardContent className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Filter className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                🚀 리스/일반 매물 필터링
              </h3>
              <p className="text-sm text-gray-400">
                AWS PostgreSQL RDB 전용 고급 필터링
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-300 border-gray-600"
          >
            {isExpanded ? '간단히 보기' : '상세 설정'}
          </Button>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Car className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">전체 매물</span>
            </div>
            <div className="text-xl font-bold text-white">
              {leaseStats.totalVehicles.toLocaleString()}
            </div>
          </div>

          <div className="bg-orange-500/10 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">리스 매물</span>
            </div>
            <div className="text-xl font-bold text-orange-400">
              {leaseStats.leaseVehicles.toLocaleString()}
            </div>
            <div className="text-xs text-orange-300">
              {leaseDetectionRate}% 검출
            </div>
          </div>

          <div className="bg-green-500/10 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">일반 매물</span>
            </div>
            <div className="text-xl font-bold text-green-400">
              {leaseStats.regularVehicles.toLocaleString()}
            </div>
          </div>

          <div className="bg-red-500/10 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">의심 매물</span>
            </div>
            <div className="text-xl font-bold text-red-400">
              {leaseStats.suspiciousVehicles.toLocaleString()}
            </div>
            <div className="text-xs text-red-300">
              {suspiciousRate}% 의심
            </div>
          </div>
        </div>

        {/* 기본 필터 */}
        <div className="space-y-4">
          {/* 매물 유형 필터 */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              매물 유형 선택
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-white">리스 매물 표시</span>
                  <Badge variant="outline" className="text-orange-400 border-orange-400">
                    위험
                  </Badge>
                </div>
                <Switch
                  checked={filters.showLeaseVehicles}
                  onCheckedChange={(checked) => updateFilters({ showLeaseVehicles: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white">일반 매물 표시</span>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    안전
                  </Badge>
                </div>
                <Switch
                  checked={filters.showRegularVehicles}
                  onCheckedChange={(checked) => updateFilters({ showRegularVehicles: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-white">의심 매물만 표시</span>
                  <Badge variant="outline" className="text-red-400 border-red-400">
                    고위험
                  </Badge>
                </div>
                <Switch
                  checked={filters.suspiciousOnly}
                  onCheckedChange={(checked) => updateFilters({ suspiciousOnly: checked })}
                />
              </div>
            </div>
          </div>

          {/* 상세 필터 (확장시에만 표시) */}
          {isExpanded && (
            <>
              {/* 가격대별 필터 */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  리스 위험도별 가격 필터
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant={filters.priceRangeFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilters({ priceRangeFilter: 'all' })}
                    className="text-xs"
                  >
                    전체 가격
                  </Button>
                  <Button
                    variant={filters.priceRangeFilter === 'low' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilters({ priceRangeFilter: 'low' })}
                    className="text-xs text-red-400 border-red-400"
                  >
                    고위험 저가
                  </Button>
                  <Button
                    variant={filters.priceRangeFilter === 'medium' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilters({ priceRangeFilter: 'medium' })}
                    className="text-xs text-yellow-400 border-yellow-400"
                  >
                    중위험 중가
                  </Button>
                  <Button
                    variant={filters.priceRangeFilter === 'high' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilters({ priceRangeFilter: 'high' })}
                    className="text-xs text-green-400 border-green-400"
                  >
                    저위험 고가
                  </Button>
                </div>
              </div>

              {/* 브랜드별 필터 */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  리스 고위험 브랜드 필터
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {LEASE_DETECTION_BRANDS.map((brand) => (
                    <Button
                      key={brand}
                      variant={filters.brandFilter.includes(brand) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleBrandToggle(brand)}
                      className="text-xs"
                    >
                      {brand}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * 프리미엄 브랜드는 리스 가능성이 높습니다
                </p>
              </div>
            </>
          )}

          {/* 액션 버튼 */}
          <div className="flex space-x-3">
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
              className="flex-1 text-gray-300 border-gray-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              필터 초기화
            </Button>
            <Button
              onClick={() => {
                // 실시간 필터 적용 트리거
                onFilterChange(filters);
              }}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Search className="w-4 h-4 mr-2" />
              필터 적용
            </Button>
          </div>

          {/* 경고 메시지 */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300 font-medium">
                리스 매물 주의사항
              </span>
            </div>
            <p className="text-xs text-yellow-200 mt-2 leading-relaxed">
              • 리스 매물은 소유권 이전이 불가능할 수 있습니다<br/>
              • 잔존 리스료나 위약금이 발생할 수 있습니다<br/>
              • 구매 전 반드시 리스 상태를 확인하세요<br/>
              • AWS PostgreSQL에서 실시간으로 검증된 데이터입니다
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaseVehicleFilter;