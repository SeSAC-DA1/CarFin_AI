'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { usePersonalizedLearning } from '@/hooks/usePersonalizedLearning';
import { userBehaviorTracker, VehicleDetails } from '@/lib/user-behavior-tracker';
import { Vehicle, VehicleFeedback } from '@/types';
import { AILearningMonitor } from '@/components/debug/AILearningMonitor';
import { LeaseVehicleFilter, LeaseFilterState } from '@/components/filters/LeaseVehicleFilter';
import {
  Heart, X, DollarSign, Star, Flame, Car, Fuel, Calendar, MapPin,
  TrendingUp, Zap, ArrowRight, Sparkles, Shield, Award, CheckCircle,
  Eye, ThumbsUp, ThumbsDown, ExternalLink, ChevronLeft, ChevronRight,
  Play, Clock, TrendingDown, Leaf, Crown, Target
} from 'lucide-react';

interface CategorySection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  apiFilters: Record<string, string>;
}

const CATEGORY_SECTIONS: CategorySection[] = [
  {
    id: 'recommended',
    title: '당신을 위한 추천',
    description: 'AI가 분석한 맞춤형 추천',
    icon: <Target className="w-5 h-5" />,
    gradient: 'from-purple-500 to-pink-500',
    apiFilters: { category: 'recommended' }
  },
  {
    id: 'budget',
    title: '가성비 TOP',
    description: '가격 대비 최고의 가치',
    icon: <DollarSign className="w-5 h-5" />,
    gradient: 'from-green-500 to-emerald-500',
    apiFilters: { minPrice: '1500', maxPrice: '8000', sortBy: 'value', valueScore: '75' }
  },
  {
    id: 'latest',
    title: '최신 등록 매물',
    description: '새롭게 등록된 신선한 매물',
    icon: <Clock className="w-5 h-5" />,
    gradient: 'from-blue-500 to-cyan-500',
    apiFilters: { sortBy: 'latest', minYear: '2020' }
  },
  {
    id: 'premium',
    title: '프리미엄 브랜드',
    description: 'BMW, 벤츠, 아우디, 렉서스',
    icon: <Crown className="w-5 h-5" />,
    gradient: 'from-amber-500 to-orange-500',
    apiFilters: { brands: 'BMW,벤츠,아우디,렉서스,제네시스', category: 'premium' }
  },
  {
    id: 'eco',
    title: '친환경 차량',
    description: '하이브리드 & 전기차',
    icon: <Leaf className="w-5 h-5" />,
    gradient: 'from-emerald-500 to-green-500',
    apiFilters: { fuelType: '하이브리드,전기', category: 'eco' }
  },
  {
    id: 'lowmileage',
    title: '저주행 차량',
    description: '5만km 이하 차량들',
    icon: <TrendingDown className="w-5 h-5" />,
    gradient: 'from-indigo-500 to-purple-500',
    apiFilters: { maxDistance: '50000', category: 'lowmileage' }
  }
];

interface HorizontalVehicleCardProps {
  vehicle: Vehicle;
  onFeedback: (vehicleId: string, feedbackType: VehicleFeedback['feedbackType']) => void;
  personalizedScore?: number;
}

const HorizontalVehicleCard: React.FC<HorizontalVehicleCardProps> = ({
  vehicle,
  onFeedback,
  personalizedScore
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleQuickFeedback = (e: React.MouseEvent, feedbackType: VehicleFeedback['feedbackType']) => {
    e.stopPropagation();

    // 🔥 고급 행동 추적: 피드백 액션
    const vehicleDetails: VehicleDetails = {
      id: parseInt(vehicle.id) || 0,
      manufacturer: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      price: vehicle.price || 0,
      fuelType: vehicle.fuel_type || '',
      transmission: vehicle.transmission || '자동',
      distance: vehicle.mileage || 0,
      color: vehicle.color || '',
      bodyType: vehicle.body_type || '',
      engineSize: vehicle.engine_size,
      features: vehicle.features || [],
      location: vehicle.location || '',
      condition: vehicle.condition || '매우 좋음',
      images: vehicle.images || []
    };

    userBehaviorTracker.trackInteraction(
      feedbackType === 'love' || feedbackType === 'like' ? 'like' :
      feedbackType === 'dislike' ? 'dislike' : 'view',
      'guest', // TODO: 실제 사용자 ID로 변경
      {
        vehicleId: parseInt(vehicle.id) || 0,
        vehicle: vehicleDetails,
        section: 'vehicle_card',
        position: 0, // TODO: 카드 위치 전달
        metadata: {
          feedbackType,
          cardPosition: 'grid',
          sessionPhase: 'feedback_collection',
          personalizedScore: personalizedScore || 0
        }
      }
    );

    onFeedback(vehicle.id, feedbackType);
  };

  const handleCardClick = () => {
    // 🔥 고급 행동 추적: 차량 카드 클릭
    const vehicleDetails: VehicleDetails = {
      id: parseInt(vehicle.id) || 0,
      manufacturer: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      price: vehicle.price || 0,
      fuelType: vehicle.fuel_type || '',
      transmission: vehicle.transmission || '자동',
      distance: vehicle.mileage || 0,
      color: vehicle.color || '',
      bodyType: vehicle.body_type || '',
      engineSize: vehicle.engine_size,
      features: vehicle.features || [],
      location: vehicle.location || '',
      condition: vehicle.condition || '매우 좋음',
      images: vehicle.images || []
    };

    userBehaviorTracker.trackInteraction(
      'click',
      'guest',
      {
        vehicleId: parseInt(vehicle.id) || 0,
        vehicle: vehicleDetails,
        section: 'vehicle_card',
        metadata: {
          clickType: 'card_detail',
          personalizedScore: personalizedScore || 0,
          hasImages: (vehicle.images?.length || 0) > 0,
          priceRange: vehicle.price > 5000 ? 'premium' : vehicle.price > 2000 ? 'mid' : 'budget'
        }
      }
    );
  };

  return (
    <Card
      className="flex-shrink-0 w-80 bg-gray-900/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="relative">
          {/* 이미지 섹션 */}
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            {vehicle.images && vehicle.images.length > 0 ? (
              <OptimizedImage
                src={vehicle.images[0]}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                width={320}
                height={192}
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <Car className="w-16 h-16 text-gray-600" />
              </div>
            )}

            {/* 호버 오버레이 */}
            {isHovered && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/40"
                  onClick={(e) => handleQuickFeedback(e, 'love')}
                >
                  <Heart className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-blue-500/20 border-blue-400 text-blue-300 hover:bg-blue-500/40"
                  onClick={(e) => handleQuickFeedback(e, 'like')}
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-gray-500/20 border-gray-400 text-gray-300 hover:bg-gray-500/40"
                  onClick={(e) => handleQuickFeedback(e, 'dislike')}
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* 하이라이트 배지 */}
            {vehicle.highlight && (
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full">
                  {vehicle.highlight}
                </span>
              </div>
            )}

            {/* 🧠 AI 멀티 에이전트 분석 점수 */}
            <div className="absolute top-2 right-2">
              <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-green-400">
                AI {personalizedScore || vehicle.match_score}점
              </div>
              {/* 멀티 에이전트 분석 상세 정보 (호버시 표시) */}
              {vehicle.agent_scores && (
                <div className="absolute top-full right-0 mt-1 bg-black/90 backdrop-blur-sm rounded-lg p-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 min-w-[150px]">
                  <div className="font-semibold mb-1">3개 AI 에이전트 분석</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-blue-300">차량전문:</span>
                      <span>{vehicle.agent_scores.vehicle_expert}점</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-300">금융전문:</span>
                      <span>{vehicle.agent_scores.finance_expert}점</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-300">제미나이:</span>
                      <span>{vehicle.agent_scores.gemini_multi_agent}점</span>
                    </div>
                    <div className="border-t border-gray-600 pt-1 mt-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-yellow-300">종합점수:</span>
                        <span className="text-green-400">{vehicle.agent_scores.final_score}점</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 정보 섹션 */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-sm text-gray-400">{vehicle.year}년</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-400">
                  {vehicle.price.toLocaleString()}만원
                </div>
              </div>
            </div>

            {/* 빠른 정보 */}
            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
              <span className="flex items-center">
                <Car className="w-3 h-3 mr-1" />
                {Math.round(vehicle.mileage / 10000)}만km
              </span>
              <span className="flex items-center">
                <Fuel className="w-3 h-3 mr-1" />
                {vehicle.fuel_type}
              </span>
              <span className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {vehicle.location}
              </span>
            </div>

            {/* 🧠 AI 추천 이유 */}
            {vehicle.recommendation_reason && (
              <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3 h-3 text-blue-400 flex-shrink-0" />
                  <span className="text-xs text-blue-300 leading-relaxed">
                    {vehicle.recommendation_reason}
                  </span>
                </div>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex space-x-2">
              {vehicle.detail_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(vehicle.detail_url, '_blank');
                  }}
                  className="flex-1 text-blue-400 border-blue-400/50 hover:bg-blue-500/20"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  상세보기
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleQuickFeedback(e, 'maybe')}
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                <Eye className="w-3 h-3 mr-1" />
                관심
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface VehicleSectionProps {
  section: CategorySection;
  onVehicleFeedback: (vehicleId: string, feedbackType: VehicleFeedback['feedbackType']) => void;
  calculatePersonalizedScore: (vehicle: Vehicle) => number;
}

const VehicleSection: React.FC<VehicleSectionProps> = ({
  section,
  onVehicleFeedback,
  calculatePersonalizedScore
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          limit: '50', // 더 많은 매물 표시
          ...section.apiFilters
        });

        const response = await fetch(`/api/vehicles?${params}`);
        if (!response.ok) throw new Error('차량 데이터 조회 실패');

        const data = await response.json();
        if (data.success && data.vehicles) {
          // API 데이터를 Vehicle 인터페이스에 맞게 변환
          const transformedVehicles = data.vehicles.map((vehicle: any) => ({
            id: vehicle.vehicleid || vehicle.id,
            brand: vehicle.manufacturer || vehicle.brand,
            model: vehicle.model,
            year: vehicle.modelyear || vehicle.year,
            price: vehicle.price,
            mileage: vehicle.distance || vehicle.mileage,
            fuel_type: vehicle.fueltype || vehicle.fuel_type,
            body_type: vehicle.cartype || vehicle.body_type,
            color: '화이트', // 기본값
            location: vehicle.location,
            images: vehicle.photo ? [vehicle.photo] : [],
            features: [], // 기본값 빈 배열
            fuel_efficiency: 12.5, // 기본값
            safety_rating: 5, // 기본값
            match_score: vehicle.match_score || 85,
            description: vehicle.recommendation_reason || '',
            highlight: undefined,
            detail_url: vehicle.detailurl || vehicle.detail_url
          }));
          setVehicles(transformedVehicles);
        } else {
          setError('차량 데이터가 없습니다');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [section.apiFilters]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // 카드 width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${section.gradient}`}>
            {section.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{section.title}</h2>
            <p className="text-sm text-gray-400">{section.description}</p>
          </div>
        </div>
        <div className="flex space-x-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80 h-80 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || vehicles.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${section.gradient}`}>
            {section.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{section.title}</h2>
            <p className="text-sm text-gray-400">{section.description}</p>
          </div>
        </div>
        <div className="text-gray-400 text-center py-8">
          {error || '이 카테고리의 차량이 없습니다'}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${section.gradient}`}>
            {section.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{section.title}</h2>
            <p className="text-sm text-gray-400">{section.description}</p>
          </div>
        </div>

        {/* 스크롤 컨트롤 */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 차량 카드 가로 스크롤 */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {vehicles.map((vehicle) => (
            <HorizontalVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onFeedback={onVehicleFeedback}
              personalizedScore={calculatePersonalizedScore(vehicle)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface NetflixStyleRecommendationProps {
  onVehicleSelection?: (vehicles: Vehicle[], feedback: VehicleFeedback[]) => void;
}

export const NetflixStyleRecommendation: React.FC<NetflixStyleRecommendationProps> = ({
  onVehicleSelection
}) => {
  const {
    updatePreferences,
    calculatePersonalizedScore,
    getLearningInsights
  } = usePersonalizedLearning();

  const [heroVehicle, setHeroVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [userFeedback, setUserFeedback] = useState<VehicleFeedback[]>([]);

  // 🚀 울트라띵크 모드: 리스/일반 매물 필터링 상태
  const [leaseFilterState, setLeaseFilterState] = useState<LeaseFilterState>({
    showLeaseVehicles: true,
    showRegularVehicles: true,
    suspiciousOnly: false,
    priceRangeFilter: 'all',
    brandFilter: []
  });

  // 리스 매물 통계 (임시 데이터, 실제로는 API에서 가져와야 함)
  const [leaseStats, setLeaseStats] = useState({
    totalVehicles: 0,
    leaseVehicles: 0,
    regularVehicles: 0,
    suspiciousVehicles: 0
  });

  const handleVehicleFeedback = (vehicleId: string, feedbackType: VehicleFeedback['feedbackType']) => {
    console.log('🧠 AI 학습 시작:', { vehicleId, feedbackType });

    // 피드백 저장
    const newFeedback: VehicleFeedback = {
      vehicleId,
      feedbackType,
      timestamp: new Date()
    };

    setUserFeedback(prev => [...prev.filter(f => f.vehicleId !== vehicleId), newFeedback]);

    // 관심 있는 차량들을 선택된 차량으로 추가
    if (feedbackType === 'love' || feedbackType === 'like' || feedbackType === 'maybe') {
      // 실제 차량 데이터를 찾아서 추가 (현재 표시된 차량들에서 검색)
      const foundVehicle = vehicles.find(v => v.id === vehicleId);

      if (foundVehicle) {
        setSelectedVehicles(prev => {
          const exists = prev.find(v => v.id === vehicleId);
          if (!exists) {
            return [...prev, foundVehicle];
          }
          return prev;
        });
      } else {
        console.warn(`차량 ID ${vehicleId}를 찾을 수 없습니다.`);
      }
    } else if (feedbackType === 'dislike') {
      // 싫어하는 차량은 선택에서 제거
      setSelectedVehicles(prev => prev.filter(v => v.id !== vehicleId));
    }

    try {
      updatePreferences(mockVehicle, feedbackType);
      console.log('✅ AI 학습 완료:', { vehicleId, feedbackType });

      // 사용자에게 피드백 확인
      const feedbackMessages = {
        'love': '❤️ 관심 등록되었습니다!',
        'like': '👍 좋아요!',
        'maybe': '🤔 관심 목록에 추가되었습니다',
        'dislike': '👎 취향이 반영되었습니다',
        'expensive': '💰 가격 피드백이 반영되었습니다'
      };

      // 간단한 토스트 메시지 (나중에 Toast 컴포넌트로 교체)
      console.log(feedbackMessages[feedbackType] || '피드백이 등록되었습니다');

    } catch (error) {
      console.error('❌ AI 학습 오류:', error);
    }
  };

  // 히어로 차량 로드 (추천 차량 중 첫 번째)
  useEffect(() => {
    const fetchHeroVehicle = async () => {
      try {
        const response = await fetch('/api/vehicles?limit=1&category=hero');
        if (response.ok) {
          const data = await response.json();
          if (data.vehicles && data.vehicles.length > 0) {
            setHeroVehicle(data.vehicles[0]);
          }
        }
      } catch (error) {
        console.error('히어로 차량 로드 실패:', error);
      }
    };

    fetchHeroVehicle();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 히어로 섹션 */}
      {heroVehicle && heroVehicle.images && heroVehicle.images.length > 0 && (
        <div className="relative h-96 mb-8 overflow-hidden">
          <OptimizedImage
            src={heroVehicle.images[0]}
            alt={`${heroVehicle.brand} ${heroVehicle.model}`}
            className="w-full h-full object-cover"
            width={1920}
            height={384}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent">
            <div className="container mx-auto px-6 h-full flex items-center">
              <div className="max-w-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">Today's Pick</span>
                </div>
                <h1 className="text-4xl font-bold mb-4">
                  {heroVehicle.brand} {heroVehicle.model}
                </h1>
                <p className="text-gray-300 mb-6 text-lg">
                  {heroVehicle.description}
                </p>
                <div className="flex space-x-4">
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-gray-200"
                    onClick={() => heroVehicle.detail_url && window.open(heroVehicle.detail_url, '_blank')}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    상세 보기
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/20"
                    onClick={() => handleVehicleFeedback(heroVehicle.id, 'love')}
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    관심 등록
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 울트라띵크 모드: 리스/일반 매물 필터링 */}
      <div className="container mx-auto px-6 mb-8">
        <LeaseVehicleFilter
          onFilterChange={setLeaseFilterState}
          leaseStats={leaseStats}
          className="mb-6"
        />
      </div>

      {/* 카테고리별 섹션들 */}
      <div className="container mx-auto px-6">
        {CATEGORY_SECTIONS.map((section) => (
          <VehicleSection
            key={section.id}
            section={section}
            onVehicleFeedback={handleVehicleFeedback}
            calculatePersonalizedScore={calculatePersonalizedScore}
          />
        ))}
      </div>

      {/* 🔥 AI 학습 모니터 */}
      <AILearningMonitor userId="guest" />

      {/* 상담 받기 플로팅 버튼 */}
      {(selectedVehicles.length > 0 || userFeedback.length > 0) && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => {
              if (onVehicleSelection) {
                onVehicleSelection(selectedVehicles, userFeedback);
              }
            }}
          >
            <Target className="w-5 h-5 mr-2" />
            상담 받기 ({selectedVehicles.length}대)
          </Button>
        </div>
      )}
    </div>
  );
};

export default NetflixStyleRecommendation;