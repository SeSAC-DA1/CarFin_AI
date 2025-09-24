'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Car, MapPin, Calendar, Fuel, Settings, Palette, Eye, Link as LinkIcon, Shield, Star, TrendingUp, CreditCard, Target } from 'lucide-react';
import { VehicleImage } from '@/components/ui/VehicleImage';

interface VehicleDetail {
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

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.vehicleId as string;

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicleDetail = async () => {
      try {
        setLoading(true);
        console.log(`🚗 차량 상세 조회 시작: ${vehicleId}`);

        const response = await fetch(`/api/vehicles/${vehicleId}`);
        const data = await response.json();

        if (data.success) {
          setVehicle(data.vehicle);
          console.log('✅ 차량 상세 정보 로드 성공:', data.vehicle.manufacturer, data.vehicle.model);
        } else {
          setError(data.error || '차량 정보를 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('❌ 차량 상세 조회 오류:', err);
        setError('차량 정보 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchVehicleDetail();
    }
  }, [vehicleId]);

  // 등록일 포맷팅
  const formatRegistrationDate = (date: number) => {
    if (!date) return '정보 없음';
    const dateStr = date.toString();
    if (dateStr.length === 8) {
      return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    }
    return dateStr;
  };

  // 주행거리 포맷팅
  const formatDistance = (distance: number) => {
    if (!distance) return '정보 없음';
    return `${distance.toLocaleString()}km`;
  };

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    if (!price) return '가격 협의';
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}억원`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}천만원`;
    } else {
      return `${price}만원`;
    }
  };

  // 차량 타입별 아이콘 색상
  const getVehicleTypeColor = (cartype: string) => {
    const typeColors: Record<string, string> = {
      '경차': 'var(--expert-finance-bright)',
      '소형차': 'var(--expert-vehicle-bright)',
      '중형차': 'var(--expert-review-bright)',
      '대형차': 'var(--expert-orchestrator-bright)',
      'SUV': 'var(--expert-vehicle-bright)',
      '스포츠카': 'var(--expert-review-bright)',
      '화물차': 'var(--expert-finance-bright)',
    };
    return typeColors[cartype] || 'var(--expert-vehicle-bright)';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-slate-200 rounded-xl mb-6"></div>
            <div className="space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/2"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>

          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">차량 정보를 찾을 수 없습니다</h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              뒤로 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 차량 이미지 및 기본 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 차량 이미지 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="aspect-video relative">
                <VehicleImage
                  manufacturer={vehicle.manufacturer}
                  model={vehicle.model}
                  vehicleId={vehicle.vehicleid.toString()}
                  alt={`${vehicle.manufacturer} ${vehicle.model}`}
                  size="xl"
                  className="w-full h-full"
                />

                {/* 상단 배지들 */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <div
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: getVehicleTypeColor(vehicle.cartype) }}
                  >
                    {vehicle.cartype}
                  </div>
                  <div className="px-3 py-1 bg-slate-900/70 text-white rounded-full text-sm">
                    {vehicle.selltype}
                  </div>
                </div>

                {/* 가격 정보 */}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="text-2xl font-bold text-slate-900">
                    {formatPrice(vehicle.price)}
                  </div>
                  {vehicle.originprice && vehicle.originprice !== vehicle.price && (
                    <div className="text-sm text-slate-500 line-through">
                      {formatPrice(vehicle.originprice)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 차량 기본 정보 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: getVehicleTypeColor(vehicle.cartype) + '20' }}>
                  <Car className="w-5 h-5" style={{ color: getVehicleTypeColor(vehicle.cartype) }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {vehicle.manufacturer} {vehicle.model}
                  </h1>
                  <p className="text-slate-600">{vehicle.generation} {vehicle.trim}</p>
                </div>
              </div>

              {/* 상세 정보 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-500">년식</div>
                    <div className="font-semibold">{vehicle.modelyear}년</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-500">주행거리</div>
                    <div className="font-semibold">{formatDistance(vehicle.distance)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Fuel className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-500">연료</div>
                    <div className="font-semibold">{vehicle.fueltype}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Settings className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-500">변속기</div>
                    <div className="font-semibold">{vehicle.transmission}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Palette className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-500">색상</div>
                    <div className="font-semibold">{vehicle.colorname}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-500">지역</div>
                    <div className="font-semibold">{vehicle.location}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-500">최초등록</div>
                    <div className="font-semibold">{formatRegistrationDate(vehicle.firstregistrationdate)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Shield className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs text-slate-500">차량번호</div>
                    <div className="font-semibold">{vehicle.vehicleno}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: AI 분석 및 액션 */}
          <div className="space-y-6">
            {/* AI 전문가 분석 카드 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">AI 전문가 분석</h2>
              </div>

              <div className="space-y-4">
                {/* 김차량 전문가 */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--expert-vehicle-bright)' + '10' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--expert-vehicle-bright)' }}></div>
                    <span className="font-semibold text-slate-900">김차량 전문가</span>
                  </div>
                  <p className="text-sm text-slate-700">
                    {vehicle.modelyear}년식 {vehicle.manufacturer} {vehicle.model}은 {vehicle.distance > 100000 ? '고주행' : '저주행'} 차량으로,
                    {vehicle.fueltype}연료 특성상 연비 효율성이 {vehicle.fueltype === '가솔린' ? '준수' : '우수'}합니다.
                  </p>
                </div>

                {/* 이금융 전문가 */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--expert-finance-bright)' + '10' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--expert-finance-bright)' }}></div>
                    <span className="font-semibold text-slate-900">이금융 전문가</span>
                  </div>
                  <p className="text-sm text-slate-700">
                    현재 {formatPrice(vehicle.price)} 가격은 시세 대비
                    {vehicle.originprice && vehicle.price < vehicle.originprice ? '할인된' : '적정'} 수준입니다.
                    월 할부 시 약 {Math.round(vehicle.price * 10000 / 60 / 10000)}만원 예상됩니다.
                  </p>
                </div>

                {/* 박리뷰 전문가 */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--expert-review-bright)' + '10' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--expert-review-bright)' }}></div>
                    <span className="font-semibold text-slate-900">박리뷰 전문가</span>
                  </div>
                  <p className="text-sm text-slate-700">
                    {vehicle.manufacturer} {vehicle.model}은 {vehicle.cartype} 시장에서
                    {vehicle.manufacturer === '현대' || vehicle.manufacturer === '기아' ? '높은 신뢰도' : '브랜드 가치'}를
                    인정받고 있는 모델입니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              {/* 상세 매물 보기 */}
              {vehicle.detailurl && (
                <button
                  onClick={() => window.open(vehicle.detailurl, '_blank')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Eye className="w-5 h-5" />
                  원본 매물 상세보기
                </button>
              )}

              {/* 비교하기 */}
              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors">
                <Target className="w-5 h-5" />
                비슷한 차량 비교하기
              </button>

              {/* 금융 계산기 */}
              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl font-semibold transition-colors">
                <CreditCard className="w-5 h-5" />
                할부 계산기
              </button>
            </div>

            {/* 차량 정보 요약 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-slate-900 mb-4">매물 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">매물 ID</span>
                  <span className="font-medium">{vehicle.vehicleid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">플랫폼</span>
                  <span className="font-medium">{vehicle.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">차량 구분</span>
                  <span className="font-medium">{vehicle.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">매물 일련번호</span>
                  <span className="font-medium text-xs">{vehicle.carseq}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}