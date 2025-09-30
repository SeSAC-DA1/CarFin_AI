'use client';

import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Filter, Database, Zap } from 'lucide-react';

interface FilterCondition {
  type: 'carType' | 'priceRange' | 'fuelEfficiency' | 'brand' | 'features';
  label: string;
  value: string;
  impact: number; // 필터링으로 제거된 차량 수
}

interface StatusPanelProps {
  totalVehicles: number;
  currentMatches: number;
  activeFilters: FilterCondition[];
  isProcessing: boolean;
  lastUpdate?: Date;
}

export default function RealTimeStatusPanel({
  totalVehicles,
  currentMatches,
  activeFilters,
  isProcessing,
  lastUpdate = new Date()
}: StatusPanelProps) {
  const [animatedCount, setAnimatedCount] = useState(currentMatches);

  // 카운트 애니메이션
  useEffect(() => {
    if (currentMatches !== animatedCount) {
      const duration = 1000; // 1초
      const steps = 30;
      const stepValue = (currentMatches - animatedCount) / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        if (step >= steps) {
          setAnimatedCount(currentMatches);
          clearInterval(timer);
        } else {
          setAnimatedCount(prev => Math.round(prev + stepValue));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [currentMatches, animatedCount]);

  const reductionPercentage = ((totalVehicles - currentMatches) / totalVehicles * 100).toFixed(1);
  const matchPercentage = (currentMatches / totalVehicles * 100).toFixed(1);

  return (
    <div className="w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-600" />
          <span>실시간 상황판</span>
        </h3>
        {isProcessing && (
          <div className="flex items-center space-x-1">
            <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span className="text-xs text-yellow-600">분석중</span>
          </div>
        )}
      </div>

      {/* 현재 매칭 상황 */}
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-4 border border-blue-200">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-700 mb-1">
            {animatedCount.toLocaleString()}대
          </div>
          <div className="text-sm text-gray-600 mb-2">현재 조건 매칭</div>
          <div className="flex items-center justify-center space-x-4 text-xs">
            <span className="flex items-center space-x-1">
              <TrendingDown className="w-3 h-3 text-red-500" />
              <span className="text-red-600">{reductionPercentage}% 필터링</span>
            </span>
            <span className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-600">{matchPercentage}% 매칭</span>
            </span>
          </div>
        </div>
      </div>

      {/* 전체 데이터 현황 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-700">
            {totalVehicles.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">전체 매물</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-700">
            {activeFilters.length}
          </div>
          <div className="text-xs text-gray-600">활성 조건</div>
        </div>
      </div>

      {/* 실시간 필터 변화 */}
      {activeFilters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">적용된 조건</span>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 rounded-md p-2"
              >
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700">
                    {filter.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {filter.value}
                  </div>
                </div>
                <div className="text-xs text-red-600 font-medium">
                  -{filter.impact.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 프로세스 인사이트 */}
      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
        <div className="text-xs font-medium text-yellow-800 mb-1">
          💡 AI 분석 인사이트
        </div>
        <div className="text-xs text-yellow-700">
          {currentMatches > 1000
            ? "조건을 더 구체화하면 정확한 추천이 가능해요"
            : currentMatches > 100
            ? "좋은 범위입니다! 맞춤 분석을 진행할게요"
            : currentMatches > 10
            ? "완벽한 범위! 최고의 매물들을 찾았어요"
            : "조건이 너무 까다로울 수 있어요. 범위를 넓혀보시겠어요?"
          }
        </div>
      </div>

      {/* 마지막 업데이트 */}
      <div className="text-xs text-gray-500 text-center border-t border-gray-100 pt-3">
        마지막 업데이트: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
}