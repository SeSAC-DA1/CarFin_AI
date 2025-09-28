'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Car, Sparkles, TrendingUp } from 'lucide-react';

interface VehicleRecommendationSummaryProps {
  analysisComplete: boolean;
  vehicleCount?: number;
  expertCount?: number;
  analysisTime?: number;
  onViewRecommendations?: () => void;
  onViewAnalysisProcess?: () => void;
}

export default function VehicleRecommendationSummary({
  analysisComplete,
  vehicleCount = 3,
  expertCount = 3,
  analysisTime = 2.5,
  onViewRecommendations,
  onViewAnalysisProcess
}: VehicleRecommendationSummaryProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!analysisComplete) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200 mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              AI 전문가팀이 분석 중... 🚀
            </h3>
            <p className="text-sm text-gray-600">
              117,564대 매물에서 고객님께 완벽한 차량을 찾고 있어요
            </p>
          </div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200 mb-4">
      {/* 메인 결과 섹션 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              ✨ 고객님을 위한 차량 추천이 완료되었습니다!
            </h3>
            <p className="text-sm text-gray-600">
              {expertCount}명의 AI 전문가가 {analysisTime}초 만에 최고의 차량 {vehicleCount}대를 선별했어요
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-green-600">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm font-medium">분석 완료</span>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex items-center space-x-3 mb-4">
        <button
          onClick={onViewRecommendations}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          🏆 추천 차량 {vehicleCount}대 보기
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center space-x-2"
        >
          <span>분석 과정</span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* 상세 분석 과정 (토글) */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-100">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">컨시어지 매니저</span>
              </div>
              <p className="text-xs text-gray-600">전체 프로세스 관리 및 고객 니즈 파악</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-100">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">니즈 분석 전문가</span>
              </div>
              <p className="text-xs text-gray-600">라이프스타일 및 숨은 요구사항 분석</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-100">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">데이터 분석 전문가</span>
              </div>
              <p className="text-xs text-gray-600">117,564대 매물 데이터 분석 및 가성비 산출</p>
            </div>
          </div>

          {onViewAnalysisProcess && (
            <div className="mt-4">
              <button
                onClick={onViewAnalysisProcess}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
              >
                🔍 상세 분석 리포트 보기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 핵심 인사이트 미리보기 */}
      <div className="bg-white bg-opacity-50 p-3 rounded-lg mt-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="font-medium">핵심 인사이트:</span>
          <span>고객님의 예산 범위에서 최고의 가성비와 안전성을 동시에 만족하는 차량들을 엄선했습니다</span>
        </div>
      </div>
    </div>
  );
}