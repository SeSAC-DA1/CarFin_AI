'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Car,
  Calendar,
  MapPin,
  Fuel,
  Settings,
  Eye,
  Heart,
  Star,
  Zap
} from 'lucide-react';
import Image from 'next/image';

// 실제 RDS 차량 데이터 타입
interface Vehicle {
  vehicleid: number;
  carseq: number;
  vehicleno: string;
  platform: string;
  origin: string;
  cartype: string;
  manufacturer: string;
  model: string;
  generation?: string;
  trim?: string;
  fueltype: string;
  transmission: string;
  colorname: string;
  modelyear: number;
  firstregistrationdate: number;
  distance: number;
  price: number;
  originprice: number;
  selltype: string;
  location: string;
  detailurl: string;
  photo?: string;
  matchingScore?: number;
}

interface VehicleListProps {
  userProfile?: {
    budget: {
      min: number;
      max: number;
    };
    usage: string;
    priorities: string[];
  };
  showRecommendationReason?: boolean;
}

export function VehicleListComponent({ userProfile, showRecommendationReason = true }: VehicleListProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalVehicles: number;
    vehiclesPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);

  useEffect(() => {
    fetchRecommendedVehicles();
  }, [userProfile, currentPage]);

  const fetchRecommendedVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      // 실제 추천 API 호출 (Mock 없이)
      const response = await fetch('/api/recommendations-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: `user_${Date.now()}`,
          userProfile: userProfile || {
            usage: 'daily',
            budget: { min: 500, max: 3000 },
            priorities: ['economy', 'reliability']
          },
          page: currentPage,
          limit: 50
        }),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('🚗 실제 RDS 차량 데이터:', data);

      if (data.success && data.recommendations && data.recommendations.length > 0) {
        setVehicles(data.recommendations);
        setPagination(data.pagination);
      } else {
        throw new Error('추천 차량을 찾을 수 없습니다.');
      }

    } catch (error) {
      console.error('❌ 차량 데이터 로드 실패:', error);
      setError(error instanceof Error ? error.message : '차량 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}억`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}천만`;
    } else {
      return `${price}만원`;
    }
  };

  // 주행거리 포맷팅
  const formatDistance = (distance: number) => {
    if (distance >= 10000) {
      return `${(distance / 10000).toFixed(1)}만km`;
    } else {
      return `${distance.toLocaleString()}km`;
    }
  };

  // 차량 연식 계산
  const getCarAge = (year: number) => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    return age === 0 ? '신차급' : `${age}년차`;
  };

  // 추천 이유 생성
  const getRecommendationReason = (vehicle: Vehicle) => {
    const reasons = [];

    if (vehicle.matchingScore && vehicle.matchingScore > 85) {
      reasons.push('높은 매칭도');
    }

    const carAge = new Date().getFullYear() - vehicle.modelyear;
    if (carAge <= 3) {
      reasons.push('최신 모델');
    }

    if (vehicle.distance < 50000) {
      reasons.push('저주행');
    }

    if (vehicle.price < vehicle.originprice * 0.8) {
      reasons.push('가격 메리트');
    }

    if (vehicle.manufacturer === '현대' || vehicle.manufacturer === '기아') {
      reasons.push('국산 브랜드');
    }

    return reasons.length > 0 ? reasons : ['기본 추천'];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-display-sm text-white">🔍 실제 차량 데이터 로딩 중...</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardContent className="p-6">
                <div className="w-full h-48 bg-slate-600 rounded-lg mb-4"></div>
                <div className="h-6 bg-slate-600 rounded mb-2"></div>
                <div className="h-4 bg-slate-600 rounded mb-2"></div>
                <div className="h-4 bg-slate-600 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="glass-card border-red-500/50">
        <CardContent className="p-6 text-center">
          <div className="text-red-400 text-lg font-semibold mb-2">❌ 오류 발생</div>
          <div className="text-red-300 mb-4">{error}</div>
          <Button
            onClick={fetchRecommendedVehicles}
            className="cyber-button"
          >
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <div className="text-yellow-400 text-lg font-semibold mb-2">⚠️ 추천 차량 없음</div>
          <div className="text-yellow-300">현재 조건에 맞는 차량이 없습니다.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-display-md text-white mb-2">
          🚗 실제 추천 차량 ({vehicles.length}대)
        </h2>
        {pagination && (
          <div className="text-subtitle mb-2">
            전체 {pagination.totalVehicles.toLocaleString()}대 중 {pagination.currentPage}/{pagination.totalPages} 페이지
          </div>
        )}
        <p className="text-subtitle">
          RDS 데이터베이스에서 실시간으로 가져온 실제 매물입니다
        </p>
      </div>

      {/* 차량 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <Card
            key={vehicle.vehicleid}
            className="glass-card interactive-card hover:scale-105 transition-all duration-300"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {vehicle.matchingScore && (
                    <Badge className="bg-green-600 text-white badge-text">
                      매칭도 {vehicle.matchingScore}%
                    </Badge>
                  )}
                  <Badge className="bg-blue-600 text-white badge-text">
                    {vehicle.selltype}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>

              <CardTitle className="card-title text-white">
                {vehicle.manufacturer} {vehicle.model}
              </CardTitle>

              {vehicle.generation && (
                <p className="text-ai-description">
                  {vehicle.generation} {vehicle.trim}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 차량 이미지 (실제 엔카 이미지 - RDS 데이터 기반) */}
              <div className="relative w-full h-48 bg-slate-800 rounded-lg overflow-hidden group">
                {vehicle.photo ? (
                  <Image
                    src={`https://img.encar.com${vehicle.photo}1.jpg`}
                    alt={`${vehicle.manufacturer} ${vehicle.model} ${vehicle.modelyear}년식`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      // 다른 엔카 이미지 사이즈 시도
                      const currentSrc = (e.target as HTMLImageElement).src;
                      if (currentSrc.includes('1.jpg')) {
                        (e.target as HTMLImageElement).src = `https://img.encar.com${vehicle.photo}2.jpg`;
                      } else if (currentSrc.includes('2.jpg')) {
                        (e.target as HTMLImageElement).src = `https://img.encar.com${vehicle.photo}.jpg`;
                      } else {
                        (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
                      }
                    }}
                    priority={false}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 bg-gradient-to-br from-slate-700 to-slate-900">
                    <div className="text-center">
                      <Car className="w-16 h-16 mx-auto mb-2" />
                      <p className="text-sm">이미지 없음</p>
                    </div>
                  </div>
                )}

                {/* 할인율 배지 */}
                {vehicle.originprice > vehicle.price && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    {Math.round((1 - vehicle.price / vehicle.originprice) * 100)}% 할인
                  </div>
                )}

                {/* 매칭 점수 배지 */}
                {vehicle.matchingScore && vehicle.matchingScore > 80 && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    매칭 {vehicle.matchingScore}%
                  </div>
                )}

                {/* 가격 오버레이 */}
                <div className="absolute bottom-2 left-2 bg-black/90 text-white px-3 py-1 rounded-lg backdrop-blur-sm">
                  <div className="text-lg font-bold">{formatPrice(vehicle.price)}</div>
                  {vehicle.originprice > vehicle.price && (
                    <div className="text-xs text-gray-300 line-through">
                      {formatPrice(vehicle.originprice)}
                    </div>
                  )}
                </div>

                {/* 차량 번호 오버레이 */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {vehicle.vehicleno}
                </div>
              </div>

              {/* 차량 정보 (상세 스펙) */}
              <div className="space-y-3">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-200">{vehicle.modelyear}년 ({getCarAge(vehicle.modelyear)})</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-green-200">{formatDistance(vehicle.distance)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Fuel className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-200">{vehicle.fueltype}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Settings className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-200">{vehicle.transmission}</span>
                  </div>
                </div>

                {/* 추가 상세 정보 */}
                <div className="grid grid-cols-1 gap-2 text-xs bg-slate-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">차종:</span>
                    <span className="text-white font-medium">{vehicle.cartype}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">출고지:</span>
                    <span className="text-white">{vehicle.origin}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">플랫폼:</span>
                    <span className="text-white">{vehicle.platform}</span>
                  </div>
                  {vehicle.colorname && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">색상:</span>
                      <span className="text-white">{vehicle.colorname}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">판매방식:</span>
                    <span className="text-white">{vehicle.selltype}</span>
                  </div>
                  {vehicle.firstregistrationdate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">초도등록:</span>
                      <span className="text-white">{vehicle.firstregistrationdate}년</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 위치 */}
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="w-4 h-4 text-red-400" />
                <span className="text-red-200">{vehicle.location}</span>
                <span className="text-gray-400">• {vehicle.vehicleno}</span>
              </div>

              {/* 추천 이유 */}
              {showRecommendationReason && (
                <div className="flex flex-wrap gap-1">
                  {getRecommendationReason(vehicle).map((reason, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs border-yellow-500/50 text-yellow-300"
                    >
                      {reason}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 cyber-button"
                  onClick={() => window.open(vehicle.detailurl, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  상세보기
                </Button>
                <Button variant="outline" className="text-white border-white/20">
                  <Star className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-6">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrevPage}
            className="cyber-button"
          >
            ← 이전
          </Button>

          <div className="flex items-center gap-2 text-white">
            {/* 페이지 번호 표시 */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = pagination.currentPage <= 3
                ? i + 1
                : pagination.currentPage + i - 2;

              if (pageNum > pagination.totalPages) return null;

              return (
                <Button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  variant={pageNum === pagination.currentPage ? "default" : "outline"}
                  className={pageNum === pagination.currentPage
                    ? "bg-blue-600 text-white"
                    : "border-white/20 text-white hover:bg-white/10"
                  }
                  size="sm"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
            disabled={!pagination.hasNextPage}
            className="cyber-button"
          >
            다음 →
          </Button>
        </div>
      )}
    </div>
  );
}