'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/design-system/layout/Container';
import { Button } from '@/components/ui/button';
import {
  Heart,
  X,
  DollarSign,
  Star,
  Flame,
  Car,
  Fuel,
  Calendar,
  MapPin,
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
  Shield,
  Award,
  CheckCircle,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import {
  Vehicle,
  VehicleFeedback,
  ModernVehicleGridProps
} from '@/types';
import { transformMultipleVehicles, recalculateMatchScore } from '@/lib/vehicle-utils';
import { RealVehicleData } from '@/app/api/vehicles/route';

export function ModernVehicleGrid({ userProfile, onSelectionComplete }: ModernVehicleGridProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleFeedbacks, setVehicleFeedbacks] = useState<Record<string, VehicleFeedback['feedbackType']>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [currentPhase, setCurrentPhase] = useState<'selection' | 'completed'>('selection');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚗 실제 차량 데이터 로딩 시작:', {
        userProfile: userProfile ? 'Present' : 'None',
        timestamp: new Date().toISOString()
      });

      // 사용자 프로필 기반 필터 파라미터 구성
      const params = new URLSearchParams();

      // 기본 필터 (더 관대한 범위로 설정)
      params.append('minPrice', '500');
      params.append('maxPrice', '8000');
      params.append('maxDistance', '200000');
      params.append('minYear', '2010');
      params.append('limit', '20');

      // 사용자 프로필 기반 추가 필터
      if (userProfile) {
        const budget = userProfile.budgetRange as { min: number; max: number } | undefined;
        if (budget) {
          params.set('minPrice', budget.min.toString());
          params.set('maxPrice', budget.max.toString());
        }

        const preferences = userProfile.preferences as string[] | undefined;
        if (preferences?.length) {
          const fuelTypes = preferences.filter(p =>
            ['가솔린', '디젤', '하이브리드', '전기', 'LPG'].includes(p)
          );
          if (fuelTypes.length > 0) {
            params.append('fuelType', fuelTypes[0]);
          }
        }

        const preferredBrand = userProfile.preferredBrand as string | undefined;
        if (preferredBrand) {
          params.append('manufacturer', preferredBrand);
        }
      }

      console.log('📊 API 요청 파라미터:', Object.fromEntries(params));

      // 실제 차량 데이터 API 호출
      const response = await fetch(`/api/vehicles?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const apiData = await response.json();
      console.log('✅ API 응답 받음:', {
        success: apiData.success,
        count: apiData.count,
        vehiclesLength: apiData.vehicles?.length || 0
      });

      if (!apiData.success) {
        throw new Error(apiData.error || '차량 데이터 로딩 실패');
      }

      // RealVehicleData를 Vehicle로 변환
      const realVehicleData: RealVehicleData[] = apiData.vehicles || [];
      let transformedVehicles = transformMultipleVehicles(realVehicleData);

      // 사용자 프로필 기반 매칭 점수 재계산
      if (userProfile) {
        transformedVehicles = transformedVehicles.map(vehicle =>
          recalculateMatchScore(vehicle, userProfile)
        );
      }

      // 매칭 점수순으로 정렬
      transformedVehicles.sort((a, b) => b.match_score - a.match_score);

      console.log('🎯 변환 완료:', {
        totalVehicles: transformedVehicles.length,
        topScores: transformedVehicles.slice(0, 3).map(v => ({
          brand: v.brand,
          model: v.model,
          score: v.match_score
        }))
      });

      setVehicles(transformedVehicles);

    } catch (error) {
      console.error('❌ 차량 데이터 로딩 오류:', error);
      setError(error instanceof Error ? error.message : '차량 데이터 로딩 중 오류가 발생했습니다');

      // 오류 발생 시 빈 배열로 설정
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleVehicleFeedback = (vehicleId: string, feedbackType: VehicleFeedback['feedbackType']) => {
    setVehicleFeedbacks(prev => ({
      ...prev,
      [vehicleId]: feedbackType
    }));
  };

  const getSelectedCount = () => {
    return Object.values(vehicleFeedbacks).filter(feedback =>
      feedback === 'love' || feedback === 'like'
    ).length;
  };

  const getFeedbackIcon = (feedbackType?: VehicleFeedback['feedbackType']) => {
    switch (feedbackType) {
      case 'love': return <Heart className="w-5 h-5 text-red-500" />;
      case 'like': return <ThumbsUp className="w-5 h-5 text-blue-500" />;
      case 'dislike': return <ThumbsDown className="w-5 h-5 text-gray-500" />;
      case 'expensive': return <DollarSign className="w-5 h-5 text-orange-500" />;
      default: return null;
    }
  };

  const getFeedbackColor = (feedbackType?: VehicleFeedback['feedbackType']) => {
    switch (feedbackType) {
      case 'love': return 'border-red-500 bg-red-50';
      case 'like': return 'border-blue-500 bg-blue-50';
      case 'dislike': return 'border-gray-400 bg-gray-50 opacity-60';
      case 'expensive': return 'border-orange-500 bg-orange-50';
      default: return 'border-gray-200 bg-white hover:border-gray-300';
    }
  };

  const handleComplete = () => {
    const feedbackArray: VehicleFeedback[] = Object.entries(vehicleFeedbacks).map(([vehicleId, feedbackType]) => ({
      vehicleId,
      feedbackType,
      timestamp: new Date()
    }));

    const likedVehicles = feedbackArray
      .filter(f => f.feedbackType === 'love' || f.feedbackType === 'like')
      .map(f => vehicles.find(v => v.id === f.vehicleId))
      .filter(Boolean) as Vehicle[];

    onSelectionComplete?.(likedVehicles.slice(0, 3), feedbackArray);
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Container size="md">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                마음에 드는 차량을 골라보세요
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                여러 차량을 한눈에 보면서 취향에 맞는 차량들을 선택해주세요.<br/>
                각 차량 카드 아래 버튼으로 선호도를 표시할 수 있어요.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-sm font-medium text-gray-900">정말 좋아요</div>
                <div className="text-xs text-gray-600">이런 차량 더 보고 싶어요</div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <ThumbsUp className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-sm font-medium text-gray-900">괜찮아요</div>
                <div className="text-xs text-gray-600">나쁘지 않네요</div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-sm font-medium text-gray-900">비싸요</div>
                <div className="text-xs text-gray-600">가격이 부담스러워요</div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <ThumbsDown className="w-6 h-6 text-gray-500" />
                </div>
                <div className="text-sm font-medium text-gray-900">별로예요</div>
                <div className="text-xs text-gray-600">취향이 아니에요</div>
              </div>
            </div>

            <Button
              variant="default"
              size="lg"
              onClick={() => setShowIntro(false)}
              icon={<Sparkles className="w-6 h-6" aria-hidden="true" />}
              className="shadow-xl shadow-purple-200"
              aria-label="차량 선택 과정 시작하기"
            >
              차량 선택 시작하기
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">차량 데이터 로딩 오류</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              loadVehicles();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">실제 차량 데이터를 불러오고 있어요</h2>
          <p className="text-gray-600">PostgreSQL에서 85,320개 차량 중 맞춤 추천을 준비중입니다...</p>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">조건에 맞는 차량이 없습니다</h2>
          <p className="text-gray-600 mb-4">검색 조건을 조정하거나 다시 시도해주세요</p>
          <Button
            onClick={() => loadVehicles()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            다시 검색
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 헤더 */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <Container>
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">차량 선호도 테스트</h1>
                  <p className="text-sm text-gray-600">마음에 드는 차량들을 선택해주세요</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">선택한 차량</div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-red-500">{getSelectedCount()}</span>
                  </div>
                </div>

                {getSelectedCount() >= 3 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleComplete}
                    icon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
                    aria-label="차량 선택 완료하고 다음 단계로 진행"
                  >
                    완료
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* 메인 콘텐츠 - 개선된 그리드 레이아웃 */}
      <Container>
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {vehicles.map((vehicle) => {
              const feedback = vehicleFeedbacks[vehicle.id];

              return (
                <div
                  key={vehicle.id}
                  className={`bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 border-2 ${getFeedbackColor(feedback)} hover:shadow-xl hover:scale-105`}
                >
                  {/* 하이라이트 배지 */}
                  {vehicle.highlight && (
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {vehicle.highlight}
                      </div>
                    </div>
                  )}

                  {/* 매치 점수 */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-bold text-green-600">{vehicle.match_score}%</span>
                    </div>
                  </div>

                  {/* 선택 상태 표시 */}
                  {feedback && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center">
                        {getFeedbackIcon(feedback)}
                      </div>
                    </div>
                  )}

                  {/* 차량 이미지 */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                    <Car className="w-16 h-16 text-gray-400" />
                  </div>

                  {/* 차량 정보 */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className="text-sm text-gray-600">{vehicle.year}년 • {vehicle.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600 mb-1">
                          {vehicle.price.toLocaleString()}만원
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span>{vehicle.safety_rating}.0</span>
                        </div>
                      </div>
                    </div>

                    {/* 핵심 스펙 */}
                    <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Fuel className="w-3 h-3" />
                        <span>{vehicle.fuel_type}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>{(vehicle.mileage / 10000).toFixed(1)}만km</span>
                      </div>
                      {vehicle.fuel_efficiency > 0 && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Zap className="w-3 h-3" />
                          <span>{vehicle.fuel_efficiency}km/L</span>
                        </div>
                      )}
                    </div>

                    {/* 주요 특징 태그 */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {vehicle.features.slice(0, 3).map((feature, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* 상세 설명 */}
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3 leading-relaxed">
                      {vehicle.description}
                    </p>

                    {/* 액션 버튼들 */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => handleVehicleFeedback(vehicle.id, 'dislike')}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          feedback === 'dislike'
                            ? 'border-gray-400 bg-gray-100'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        title="별로예요"
                      >
                        <ThumbsDown className="w-4 h-4 text-gray-500 mx-auto" />
                      </button>

                      <button
                        onClick={() => handleVehicleFeedback(vehicle.id, 'expensive')}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          feedback === 'expensive'
                            ? 'border-orange-400 bg-orange-100'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                        title="비싸요"
                      >
                        <DollarSign className="w-4 h-4 text-orange-500 mx-auto" />
                      </button>

                      <button
                        onClick={() => handleVehicleFeedback(vehicle.id, 'like')}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          feedback === 'like'
                            ? 'border-blue-400 bg-blue-100'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                        title="괜찮아요"
                      >
                        <ThumbsUp className="w-4 h-4 text-blue-500 mx-auto" />
                      </button>

                      <button
                        onClick={() => handleVehicleFeedback(vehicle.id, 'love')}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          feedback === 'love'
                            ? 'border-red-400 bg-red-100'
                            : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                        }`}
                        title="정말 좋아요"
                      >
                        <Heart className="w-4 h-4 text-red-500 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 하단 완료 버튼 */}
          {getSelectedCount() >= 3 && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
              <Button
                variant="default"
                size="lg"
                onClick={handleComplete}
                icon={<ArrowRight className="w-6 h-6" aria-hidden="true" />}
                className="shadow-2xl shadow-blue-300"
                aria-label={`${getSelectedCount()}개 차량 선택을 완료하고 분석 단계로 진행하기`}
              >
                {getSelectedCount()}개 차량 선택 완료
              </Button>
            </div>
          )}

          {/* 안내 메시지 */}
          {getSelectedCount() < 3 && (
            <div className="text-center mt-12">
              <p className="text-gray-600 text-lg">
                최소 3개 이상의 차량을 선택해주세요 ({getSelectedCount()}/3)
              </p>
              <p className="text-gray-500 text-sm mt-2">
                더 정확한 분석을 위해 다양한 차량에 반응을 보여주세요
              </p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}