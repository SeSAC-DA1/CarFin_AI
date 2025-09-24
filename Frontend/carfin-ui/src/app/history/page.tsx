'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, Filter, Calendar, Clock, Star, TrendingUp,
  Users, Car, DollarSign, Eye, RefreshCcw, Download, Share2,
  MoreVertical, Trash2, History, Award, BarChart3, Sparkles,
  CheckCircle, AlertTriangle, Target, Zap
} from 'lucide-react';
import { VehicleImage } from '@/components/ui/VehicleImage';

// 분석 이력 인터페이스
interface AnalysisHistory {
  id: string;
  consultation_id: string;
  created_at: string;
  persona_summary: string;
  confidence_score: number;
  agents_count: number;
  top_vehicles_count: number;
  status: 'completed' | 'in_progress' | 'failed';
  top_vehicles: Array<{
    vehicleid: string;
    manufacturer: string;
    model: string;
    price: number;
    final_score: number;
  }>;
  quick_summary: {
    budget_range: string;
    preferred_type: string;
    key_priorities: string[];
    recommended_action: string;
  };
  analytics: {
    analysis_time: number; // 분석 소요 시간 (초)
    agent_agreements: number; // 전문가 합의도
    unique_recommendations: number;
  };
}

export default function MyAnalysisHistoryPage() {
  const router = useRouter();
  const [histories, setHistories] = useState<AnalysisHistory[]>([]);
  const [filteredHistories, setFilteredHistories] = useState<AnalysisHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in_progress' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'vehicles'>('date');
  const [loading, setLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);

  // Mock 데이터 생성 (실제로는 API에서 가져와야 함)
  const generateMockHistories = (): AnalysisHistory[] => {
    return [
      {
        id: '1',
        consultation_id: 'CARFIN-2024-001',
        created_at: '2024-09-23T10:30:00Z',
        persona_summary: '20대 초보운전자, 시내 주행 위주, 연비 중시',
        confidence_score: 92,
        agents_count: 3,
        top_vehicles_count: 3,
        status: 'completed',
        top_vehicles: [
          { vehicleid: '1', manufacturer: '기아', model: '모닝 어반', price: 990, final_score: 3 },
          { vehicleid: '2', manufacturer: '현대', model: '아반떼', price: 1800, final_score: 2 },
          { vehicleid: '3', manufacturer: '토요타', model: '야리스', price: 1450, final_score: 2 },
        ],
        quick_summary: {
          budget_range: '1000-2000만원',
          preferred_type: '소형차',
          key_priorities: ['연비', '가격', '운전 편의성'],
          recommended_action: '기아 모닝 어반 시승 예약 추천'
        },
        analytics: {
          analysis_time: 45,
          agent_agreements: 87,
          unique_recommendations: 8
        }
      },
      {
        id: '2',
        consultation_id: 'CARFIN-2024-002',
        created_at: '2024-09-22T15:45:00Z',
        persona_summary: '가족용 SUV 찾는 30대 직장인, 안전성과 공간 중시',
        confidence_score: 88,
        agents_count: 3,
        top_vehicles_count: 3,
        status: 'completed',
        top_vehicles: [
          { vehicleid: '4', manufacturer: '현대', model: '투싼', price: 2800, final_score: 3 },
          { vehicleid: '5', manufacturer: '기아', model: '스포티지', price: 2650, final_score: 3 },
          { vehicleid: '6', manufacturer: 'BMW', model: 'X3', price: 5200, final_score: 1 },
        ],
        quick_summary: {
          budget_range: '2500-3500만원',
          preferred_type: 'SUV',
          key_priorities: ['안전성', '공간', '브랜드'],
          recommended_action: '현대 투싼 견적 문의 추천'
        },
        analytics: {
          analysis_time: 52,
          agent_agreements: 91,
          unique_recommendations: 12
        }
      },
      {
        id: '3',
        consultation_id: 'CARFIN-2024-003',
        created_at: '2024-09-20T09:15:00Z',
        persona_summary: '프리미엄 세단 선호하는 40대 경영진',
        confidence_score: 95,
        agents_count: 3,
        top_vehicles_count: 2,
        status: 'completed',
        top_vehicles: [
          { vehicleid: '7', manufacturer: '제네시스', model: 'G80', price: 5800, final_score: 3 },
          { vehicleid: '8', manufacturer: 'BMW', model: '530i', price: 6200, final_score: 2 },
        ],
        quick_summary: {
          budget_range: '5000만원 이상',
          preferred_type: '프리미엄 세단',
          key_priorities: ['브랜드', '성능', '럭셔리'],
          recommended_action: '제네시스 G80 시승 예약 추천'
        },
        analytics: {
          analysis_time: 38,
          agent_agreements: 94,
          unique_recommendations: 6
        }
      },
      {
        id: '4',
        consultation_id: 'CARFIN-2024-004',
        created_at: '2024-09-18T14:20:00Z',
        persona_summary: '전기차 관심 많은 환경의식 높은 30대',
        confidence_score: 83,
        agents_count: 3,
        top_vehicles_count: 3,
        status: 'in_progress',
        top_vehicles: [
          { vehicleid: '9', manufacturer: '현대', model: '아이오닉 5', price: 4200, final_score: 3 },
        ],
        quick_summary: {
          budget_range: '4000-5000만원',
          preferred_type: '전기차',
          key_priorities: ['친환경', '첨단기술', '충전 인프라'],
          recommended_action: '분석 진행 중...'
        },
        analytics: {
          analysis_time: 0,
          agent_agreements: 0,
          unique_recommendations: 0
        }
      }
    ];
  };

  useEffect(() => {
    // API 호출 시뮬레이션
    const fetchHistories = async () => {
      setLoading(true);
      try {
        // 실제로는 API 호출: const response = await fetch('/api/analysis-history');
        const mockData = generateMockHistories();
        setHistories(mockData);
        setFilteredHistories(mockData);
        console.log('✅ 분석 이력 로드 완료:', mockData.length, '건');
      } catch (error) {
        console.error('❌ 분석 이력 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistories();
  }, []);

  // 필터링 및 정렬
  useEffect(() => {
    let filtered = [...histories];

    // 상태 필터
    if (filterStatus !== 'all') {
      filtered = filtered.filter(h => h.status === filterStatus);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      filtered = filtered.filter(h =>
        h.persona_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.quick_summary.preferred_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.top_vehicles.some(v =>
          v.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.model.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.confidence_score - a.confidence_score;
        case 'vehicles':
          return b.top_vehicles_count - a.top_vehicles_count;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredHistories(filtered);
  }, [histories, searchQuery, filterStatus, sortBy]);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 상태 배지 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'in_progress':
        return '진행중';
      case 'failed':
        return '실패';
      default:
        return '알 수 없음';
    }
  };

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}억`;
    }
    return `${price.toLocaleString()}만원`;
  };

  // 통계 계산
  const getStats = () => {
    const completed = histories.filter(h => h.status === 'completed');
    return {
      totalAnalyses: histories.length,
      completedAnalyses: completed.length,
      avgConfidenceScore: completed.length > 0
        ? Math.round(completed.reduce((sum, h) => sum + h.confidence_score, 0) / completed.length)
        : 0,
      totalVehiclesAnalyzed: completed.reduce((sum, h) => sum + h.top_vehicles_count, 0),
      avgAnalysisTime: completed.length > 0
        ? Math.round(completed.reduce((sum, h) => sum + h.analytics.analysis_time, 0) / completed.length)
        : 0,
    };
  };

  const stats = getStats();

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-300 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-300 rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <History className="w-8 h-8 text-purple-600" />
              내 분석 이력
            </h1>
          </div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:scale-105 transition-transform"
          >
            <Sparkles className="w-5 h-5" />
            새 분석 시작
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-600">{stats.totalAnalyses}</div>
                <div className="text-sm text-slate-600">총 분석 횟수</div>
              </div>
              <BarChart3 className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.avgConfidenceScore}%</div>
                <div className="text-sm text-slate-600">평균 신뢰도</div>
              </div>
              <Target className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600">{stats.totalVehiclesAnalyzed}</div>
                <div className="text-sm text-slate-600">분석된 차량</div>
              </div>
              <Car className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-orange-600">{stats.avgAnalysisTime}초</div>
                <div className="text-sm text-slate-600">평균 분석 시간</div>
              </div>
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="분석 내역을 검색하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
            </div>

            {/* 상태 필터 */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">전체 상태</option>
              <option value="completed">완료</option>
              <option value="in_progress">진행중</option>
              <option value="failed">실패</option>
            </select>

            {/* 정렬 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="date">날짜순</option>
              <option value="score">신뢰도순</option>
              <option value="vehicles">차량수순</option>
            </select>
          </div>
        </div>

        {/* 분석 이력 목록 */}
        {filteredHistories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-700 mb-2">
              {histories.length === 0 ? '분석 이력이 없습니다' : '검색 결과가 없습니다'}
            </h2>
            <p className="text-slate-500 mb-6">
              {histories.length === 0
                ? 'CarFin AI와 함께 첫 번째 차량 분석을 시작해보세요!'
                : '다른 검색어나 필터를 시도해보세요.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:scale-105 transition-transform"
            >
              새 분석 시작하기
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredHistories.map((history) => (
              <div key={history.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-800">
                          {history.consultation_id}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(history.status)}`}>
                          {getStatusText(history.status)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(history.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          {history.confidence_score}%
                        </div>
                        <div className="text-xs text-slate-500">신뢰도</div>
                      </div>
                    </div>
                  </div>

                  {/* 페르소나 요약 */}
                  <div className="mb-4">
                    <p className="text-slate-700 bg-slate-50 rounded-lg p-3">
                      <Users className="w-4 h-4 inline mr-2" />
                      {history.persona_summary}
                    </p>
                  </div>

                  {/* 빠른 요약 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-blue-600 font-medium mb-1">예산 범위</div>
                      <div className="font-semibold text-blue-800">{history.quick_summary.budget_range}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-green-600 font-medium mb-1">선호 차종</div>
                      <div className="font-semibold text-green-800">{history.quick_summary.preferred_type}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-xs text-purple-600 font-medium mb-1">핵심 우선순위</div>
                      <div className="font-semibold text-purple-800">
                        {history.quick_summary.key_priorities.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="text-xs text-orange-600 font-medium mb-1">분석 시간</div>
                      <div className="font-semibold text-orange-800">{history.analytics.analysis_time}초</div>
                    </div>
                  </div>

                  {/* 추천 차량 (상위 3개) */}
                  {history.top_vehicles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        추천 차량
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {history.top_vehicles.slice(0, 3).map((vehicle, index) => (
                          <div
                            key={vehicle.vehicleid}
                            className="border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.push(`/vehicle/${vehicle.vehicleid}`)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                                <Car className="w-6 h-6 text-slate-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-slate-800 text-sm">
                                  {vehicle.manufacturer} {vehicle.model}
                                </div>
                                <div className="text-blue-600 font-semibold">
                                  {formatPrice(vehicle.price)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-yellow-600">
                                  #{index + 1}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {vehicle.final_score}/3
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {history.agents_count}명 전문가
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        {history.top_vehicles_count}대 추천
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {history.analytics.agent_agreements}% 합의도
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {history.status === 'completed' && (
                        <>
                          <button className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                            상세보기
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <RefreshCcw className="w-4 h-4" />
                            재분석
                          </button>
                        </>
                      )}
                      {history.status === 'in_progress' && (
                        <button className="flex items-center gap-1 px-3 py-1 text-sm text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                          <Clock className="w-4 h-4" />
                          진행상황
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 푸터 */}
        <div className="text-center py-8 mt-12">
          <p className="text-slate-500 mb-4">
            💡 더 나은 차량 선택을 위해 CarFin AI가 계속 학습하고 있습니다
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-slate-400">
            <span>📊 총 {stats.totalAnalyses}회 분석</span>
            <span>⭐ 평균 {stats.avgConfidenceScore}% 신뢰도</span>
            <span>🚗 {stats.totalVehiclesAnalyzed}대 차량 검토</span>
          </div>
        </div>
      </div>
    </div>
  );
}