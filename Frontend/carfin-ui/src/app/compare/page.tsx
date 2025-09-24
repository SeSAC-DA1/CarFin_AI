'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, Plus, X, Star, DollarSign, Fuel, Settings,
  Calendar, Gauge, Palette, MapPin, Zap, Scale, Eye, Sparkles,
  CheckCircle, AlertTriangle, TrendingUp, Award
} from 'lucide-react';
import { VehicleImage } from '@/components/ui/VehicleImage';

// 차량 데이터 인터페이스 (VehicleDetailPage와 동일)
interface VehicleData {
  vehicleid: number;
  carseq: number;
  vehicleno: string;
  platform: string;
  origin: string;
  cartype: string;
  manufacturer: string;
  model: string;
  generation: string;
  trim: string;
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
  photo: string;
}

// 검색 결과 인터페이스
interface SearchResult {
  vehicleid: string;
  manufacturer: string;
  model: string;
  price: number;
}

export default function VehicleComparisonPage() {
  const router = useRouter();
  const [compareVehicles, setCompareVehicles] = useState<VehicleData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // AI 전문가 브랜드 색상 계산
  const getExpertBrandColor = (manufacturer: string) => {
    const brandColors: Record<string, string> = {
      '현대': 'var(--expert-vehicle-bright)',
      '기아': 'var(--expert-finance-bright)',
      '제네시스': 'var(--expert-orchestrator-bright)',
      'BMW': 'var(--expert-review-bright)',
      '벤츠': 'var(--expert-vehicle-bright)',
      '아우디': 'var(--expert-finance-bright)',
      '토요타': 'var(--expert-review-bright)',
      '혼다': 'var(--expert-vehicle-bright)',
      '닛산': 'var(--expert-orchestrator-bright)',
      '폭스바겐': 'var(--expert-finance-bright)',
    };
    return brandColors[manufacturer] || 'var(--expert-vehicle-bright)';
  };

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}억`;
    }
    return `${price.toLocaleString()}만원`;
  };

  // 주행거리 포맷팅
  const formatDistance = (distance: number) => {
    return `${distance.toLocaleString()}km`;
  };

  // 차량 검색
  const searchVehicles = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // 실제로는 검색 API를 구현해야 하지만, 임시로 샘플 데이터 사용
      const mockResults: SearchResult[] = [
        { vehicleid: '1', manufacturer: '기아', model: '모닝 어반 (JA)', price: 990 },
        { vehicleid: '2', manufacturer: '현대', model: '아반떼 CN7', price: 1800 },
        { vehicleid: '3', manufacturer: 'BMW', model: '320d', price: 4500 },
        { vehicleid: '4', manufacturer: '제네시스', model: 'G70', price: 3800 },
        { vehicleid: '5', manufacturer: '벤츠', model: 'C클래스', price: 5200 },
      ].filter(vehicle =>
        vehicle.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(mockResults);
    } catch (error) {
      console.error('차량 검색 실패:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 차량 추가
  const addVehicleToComparison = async (vehicleId: string) => {
    if (compareVehicles.length >= 3) {
      alert('최대 3대까지만 비교할 수 있습니다.');
      return;
    }

    // 이미 추가된 차량인지 확인
    if (compareVehicles.some(v => v.vehicleid.toString() === vehicleId)) {
      alert('이미 비교 목록에 추가된 차량입니다.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`);
      const data = await response.json();

      if (data.success && data.vehicle) {
        setCompareVehicles(prev => [...prev, data.vehicle]);
        setSearchResults([]); // 검색 결과 초기화
        setSearchQuery('');
        console.log('✅ 비교 차량 추가:', data.vehicle.manufacturer, data.vehicle.model);
      } else {
        alert('차량 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ 차량 정보 로드 실패:', error);
      alert('차량 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 비교 목록에서 차량 제거
  const removeVehicleFromComparison = (vehicleId: number) => {
    setCompareVehicles(prev => prev.filter(v => v.vehicleid !== vehicleId));
  };

  // 비교 분석 생성
  const generateComparisonInsight = (vehicles: VehicleData[]) => {
    if (vehicles.length < 2) return null;

    const lowestPrice = Math.min(...vehicles.map(v => v.price));
    const highestPrice = Math.max(...vehicles.map(v => v.price));
    const lowestDistance = Math.min(...vehicles.map(v => v.distance));
    const newestYear = Math.max(...vehicles.map(v => v.modelyear));

    const cheapest = vehicles.find(v => v.price === lowestPrice);
    const mostExpensive = vehicles.find(v => v.price === highestPrice);
    const lowestMileage = vehicles.find(v => v.distance === lowestDistance);
    const newest = vehicles.find(v => v.modelyear === newestYear);

    return {
      cheapest,
      mostExpensive,
      lowestMileage,
      newest,
      priceRange: { min: lowestPrice, max: highestPrice },
      avgPrice: Math.round(vehicles.reduce((sum, v) => sum + v.price, 0) / vehicles.length)
    };
  };

  const insight = generateComparisonInsight(compareVehicles);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              뒤로가기
            </button>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Scale className="w-8 h-8 text-blue-600" />
              차량 비교
            </h1>
          </div>
          <div className="text-sm text-slate-500">
            {compareVehicles.length}/3 대 선택
          </div>
        </div>

        {/* 차량 검색 섹션 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            비교할 차량 추가
          </h2>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="제조사나 모델명으로 검색하세요... (예: 현대, 아반떄, BMW)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchVehicles()}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
            </div>
            <button
              onClick={searchVehicles}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
            >
              {isSearching ? '검색중...' : '검색'}
            </button>
          </div>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-semibold text-slate-700 mb-3">검색 결과</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map((result) => (
                  <div
                    key={result.vehicleid}
                    className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => addVehicleToComparison(result.vehicleid)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">
                          {result.manufacturer} {result.model}
                        </div>
                        <div className="text-blue-600 font-semibold">
                          {formatPrice(result.price)}
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 비교 차량 목록이 없을 때 */}
        {compareVehicles.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Scale className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-700 mb-2">비교할 차량을 추가해주세요</h2>
            <p className="text-slate-500 mb-6">
              위의 검색창에서 차량을 검색하여 최대 3대까지 비교할 수 있습니다.
            </p>
            <div className="flex justify-center space-x-4">
              <div className="text-sm text-slate-400">✨ 실시간 시세 비교</div>
              <div className="text-sm text-slate-400">🤖 AI 전문가 분석</div>
              <div className="text-sm text-slate-400">📊 상세 스펙 비교</div>
            </div>
          </div>
        )}

        {/* 차량 비교 테이블 */}
        {compareVehicles.length > 0 && (
          <div className="space-y-8">
            {/* AI 분석 인사이트 */}
            {insight && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                  AI 전문가 비교 분석
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {insight.cheapest && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mb-3">
                        💰
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">최저가 차량</h4>
                      <p className="text-sm text-slate-600 mb-2">
                        {insight.cheapest.manufacturer} {insight.cheapest.model}
                      </p>
                      <div className="text-green-700 font-semibold">
                        {formatPrice(insight.cheapest.price)}
                      </div>
                    </div>
                  )}

                  {insight.lowestMileage && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-3">
                        🚗
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">최저 주행거리</h4>
                      <p className="text-sm text-slate-600 mb-2">
                        {insight.lowestMileage.manufacturer} {insight.lowestMileage.model}
                      </p>
                      <div className="text-blue-700 font-semibold">
                        {formatDistance(insight.lowestMileage.distance)}
                      </div>
                    </div>
                  )}

                  {insight.newest && (
                    <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mb-3">
                        ✨
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">최신 연식</h4>
                      <p className="text-sm text-slate-600 mb-2">
                        {insight.newest.manufacturer} {insight.newest.model}
                      </p>
                      <div className="text-purple-700 font-semibold">
                        {insight.newest.modelyear}년
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mb-3">
                      📊
                    </div>
                    <h4 className="font-bold text-slate-800 mb-1">가격대 분석</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      평균 {formatPrice(insight.avgPrice)}
                    </p>
                    <div className="text-orange-700 font-semibold">
                      {formatPrice(insight.priceRange.min)} ~ {formatPrice(insight.priceRange.max)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 비교 테이블 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Award className="w-8 h-8" />
                  차량 상세 비교
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-slate-700">항목</th>
                      {compareVehicles.map((vehicle) => (
                        <th key={vehicle.vehicleid} className="px-6 py-4 text-center min-w-[280px]">
                          <div className="space-y-3">
                            {/* 차량 삭제 버튼 */}
                            <button
                              onClick={() => removeVehicleFromComparison(vehicle.vehicleid)}
                              className="absolute top-4 right-4 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center text-xs transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>

                            {/* 차량 이미지 */}
                            <VehicleImage
                              manufacturer={vehicle.manufacturer}
                              model={vehicle.model}
                              vehicleId={vehicle.vehicleid.toString()}
                              alt={`${vehicle.manufacturer} ${vehicle.model}`}
                              size="lg"
                              className="mx-auto shadow-lg"
                              useApi={true}
                            />

                            {/* 차량 기본 정보 */}
                            <div>
                              <div className="font-bold text-slate-800 text-lg">
                                {vehicle.manufacturer} {vehicle.model}
                              </div>
                              <div className="text-slate-600 text-sm">
                                {vehicle.generation} • {vehicle.trim}
                              </div>
                              <div className="text-2xl font-bold mt-2" style={{ color: getExpertBrandColor(vehicle.manufacturer) }}>
                                {formatPrice(vehicle.price)}
                              </div>
                            </div>

                            {/* 상세 정보 보기 버튼 */}
                            <button
                              onClick={() => router.push(`/vehicle/${vehicle.vehicleid}`)}
                              className="w-full mt-2 py-2 px-4 text-sm rounded-lg font-medium text-white transition-colors"
                              style={{ backgroundColor: getExpertBrandColor(vehicle.manufacturer) }}
                            >
                              <Eye className="w-4 h-4 inline mr-1" />
                              상세 정보
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {/* 가격 정보 */}
                    <tr className="border-t border-slate-200">
                      <td className="px-6 py-4 font-semibold text-slate-700 bg-slate-50">
                        <DollarSign className="w-5 h-5 inline mr-2" />
                        가격 정보
                      </td>
                      {compareVehicles.map((vehicle) => (
                        <td key={vehicle.vehicleid} className="px-6 py-4 text-center">
                          <div className="space-y-1">
                            <div className="text-xl font-bold text-green-600">
                              {formatPrice(vehicle.price)}
                            </div>
                            {vehicle.originprice && vehicle.originprice !== vehicle.price && (
                              <div className="text-sm text-slate-500 line-through">
                                원가: {formatPrice(vehicle.originprice)}
                              </div>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* 기본 사양 */}
                    <tr className="border-t border-slate-200">
                      <td className="px-6 py-4 font-semibold text-slate-700 bg-slate-50">
                        <Calendar className="w-5 h-5 inline mr-2" />
                        연식
                      </td>
                      {compareVehicles.map((vehicle) => (
                        <td key={vehicle.vehicleid} className="px-6 py-4 text-center font-medium">
                          {vehicle.modelyear}년
                        </td>
                      ))}
                    </tr>

                    <tr className="border-t border-slate-200">
                      <td className="px-6 py-4 font-semibold text-slate-700 bg-slate-50">
                        <Gauge className="w-5 h-5 inline mr-2" />
                        주행거리
                      </td>
                      {compareVehicles.map((vehicle) => (
                        <td key={vehicle.vehicleid} className="px-6 py-4 text-center font-medium">
                          {formatDistance(vehicle.distance)}
                        </td>
                      ))}
                    </tr>

                    <tr className="border-t border-slate-200">
                      <td className="px-6 py-4 font-semibold text-slate-700 bg-slate-50">
                        <Fuel className="w-5 h-5 inline mr-2" />
                        연료
                      </td>
                      {compareVehicles.map((vehicle) => (
                        <td key={vehicle.vehicleid} className="px-6 py-4 text-center font-medium">
                          {vehicle.fueltype}
                        </td>
                      ))}
                    </tr>

                    <tr className="border-t border-slate-200">
                      <td className="px-6 py-4 font-semibold text-slate-700 bg-slate-50">
                        <Settings className="w-5 h-5 inline mr-2" />
                        변속기
                      </td>
                      {compareVehicles.map((vehicle) => (
                        <td key={vehicle.vehicleid} className="px-6 py-4 text-center font-medium">
                          {vehicle.transmission}
                        </td>
                      ))}
                    </tr>

                    <tr className="border-t border-slate-200">
                      <td className="px-6 py-4 font-semibold text-slate-700 bg-slate-50">
                        <Palette className="w-5 h-5 inline mr-2" />
                        차량 색상
                      </td>
                      {compareVehicles.map((vehicle) => (
                        <td key={vehicle.vehicleid} className="px-6 py-4 text-center font-medium">
                          {vehicle.colorname}
                        </td>
                      ))}
                    </tr>

                    <tr className="border-t border-slate-200">
                      <td className="px-6 py-4 font-semibold text-slate-700 bg-slate-50">
                        <MapPin className="w-5 h-5 inline mr-2" />
                        지역
                      </td>
                      {compareVehicles.map((vehicle) => (
                        <td key={vehicle.vehicleid} className="px-6 py-4 text-center font-medium">
                          {vehicle.location}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}