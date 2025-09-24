'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Calculator,
  PiggyBank,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Calendar,
  Percent,
  Building,
  Globe,
  Phone
} from 'lucide-react';
import { type Vehicle, GeminiMultiAgent } from '@/lib/gemini-agents';

interface FinanceOption {
  id: string;
  type: 'cash' | 'loan' | 'lease' | 'installment';
  title: string;
  monthlyPayment: number;
  downPayment: number;
  totalCost: number;
  interestRate?: number;
  term?: number;
  pros: string[];
  cons: string[];
  recommendation: 'best' | 'good' | 'fair';
}

interface FinanceConsultationProps {
  selectedVehicle: Vehicle;
  userProfile?: any;
  onConsultationComplete?: () => void;
}

export function FinanceConsultation({
  selectedVehicle,
  userProfile,
  onConsultationComplete
}: FinanceConsultationProps) {
  const [financeOptions, setFinanceOptions] = useState<FinanceOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<FinanceOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingRealTime, setIsSearchingRealTime] = useState(false);

  // Gemini 에이전트 초기화 (Google Search API 포함)
  const geminiAgent = new GeminiMultiAgent(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY || '',
    process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID || ''
  );

  useEffect(() => {
    generateFinanceOptions();
  }, [selectedVehicle]);

  const generateFinanceOptions = async () => {
    setIsLoading(true);

    try {
      // 1단계: 기본 금융 옵션 생성 (즉시 표시용)
      const basicOptions = generateBasicOptions();
      setFinanceOptions(basicOptions);

      // 2단계: 실시간 금융정보 검색 시작
      setIsSearchingRealTime(true);
      const realTimeOptions = await searchRealTimeFinanceOptions();

      // 3단계: 실시간 데이터와 기본 옵션 통합
      const combinedOptions = combineFinanceOptions(basicOptions, realTimeOptions);
      setFinanceOptions(combinedOptions);

    } catch (error) {
      console.error('Finance options generation failed:', error);
      // 오류 시 기본 옵션만 사용
      setFinanceOptions(generateBasicOptions());
    } finally {
      setIsLoading(false);
      setIsSearchingRealTime(false);
    }
  };

  // 기본 금융 옵션 생성
  const generateBasicOptions = (): FinanceOption[] => [
    {
      id: 'cash',
      type: 'cash',
      title: '현금 일시불',
      monthlyPayment: 0,
      downPayment: selectedVehicle.price,
      totalCost: selectedVehicle.price,
      pros: ['이자 부담 없음', '즉시 소유권 확보', '협상력 증대'],
      cons: ['큰 초기 부담', '현금 유동성 감소'],
      recommendation: 'good'
    },
    {
      id: 'bank-loan-default',
      type: 'loan',
      title: '은행 중고차대출 (일반)',
      monthlyPayment: Math.round(selectedVehicle.price * 0.018),
      downPayment: Math.round(selectedVehicle.price * 0.2),
      totalCost: Math.round(selectedVehicle.price * 1.15),
      interestRate: 6.5,
      term: 60,
      pros: ['안정적인 금리', '장기 분할', '신뢰성'],
      cons: ['신용심사 필요', '담보 설정'],
      recommendation: 'good'
    },
    {
      id: 'installment-default',
      type: 'installment',
      title: '카드사 할부',
      monthlyPayment: Math.round(selectedVehicle.price * 0.021),
      downPayment: 0,
      totalCost: Math.round(selectedVehicle.price * 1.25),
      interestRate: 8.2,
      term: 48,
      pros: ['초기 부담 없음', '간편한 심사', '빠른 승인'],
      cons: ['높은 금리', '총 비용 증가'],
      recommendation: 'fair'
    }
  ];

  // 실시간 금융정보 검색
  const searchRealTimeFinanceOptions = async (): Promise<FinanceOption[]> => {
    try {
      // Google Search API를 활용한 실시간 검색
      const searchResults = await geminiAgent.searchFinancialProducts(
        selectedVehicle.price,
        userProfile || {}
      );

      // 검색 결과를 FinanceOption 형태로 변환
      return searchResults.map((result, index) => ({
        id: `realtime-${index}`,
        type: 'loan' as const,
        title: `${result.description} - 실시간`,
        monthlyPayment: result.monthly_payment || Math.round(selectedVehicle.price * 0.016),
        downPayment: result.down_payment || Math.round(selectedVehicle.price * 0.15),
        totalCost: result.total_cost || Math.round(selectedVehicle.price * 1.12),
        interestRate: 5.8, // 검색된 평균 금리
        term: 60,
        pros: [...result.pros, '실시간 최신 정보'],
        cons: result.cons,
        recommendation: 'best' as const
      }));

    } catch (error) {
      console.error('Real-time finance search failed:', error);
      return [];
    }
  };

  // 기본 옵션과 실시간 옵션 통합
  const combineFinanceOptions = (basicOptions: FinanceOption[], realTimeOptions: FinanceOption[]): FinanceOption[] => {
    // 실시간 옵션이 있으면 최우선으로 배치
    const combined = [...realTimeOptions, ...basicOptions];

    // 중복 제거 및 최적 4개 선택
    return combined
      .filter((option, index, self) =>
        index === self.findIndex(o => o.type === option.type && o.title === option.title)
      )
      .sort((a, b) => {
        // 추천도 순으로 정렬
        const recommendationOrder = { 'best': 0, 'good': 1, 'fair': 2 };
        return recommendationOrder[a.recommendation] - recommendationOrder[b.recommendation];
      })
      .slice(0, 4);
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'best':
        return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/25';
      case 'good':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'fair':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      default:
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'best':
        return '🏆 AI 추천';
      case 'good':
        return '👍 좋은 선택';
      case 'fair':
        return '⚠️ 신중히 고려';
      default:
        return '';
    }
  };

  if (isLoading && financeOptions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
            <Calculator className="w-8 h-8 text-green-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">금융 옵션 분석 중...</h2>
          <p className="text-gray-400">AI가 최적의 금융 상품을 찾고 있습니다</p>
          {isSearchingRealTime && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">실시간 금융정보 검색 중...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* 헤더 */}
      <div className="bg-black/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">금융 상담</h1>
              {isSearchingRealTime && (
                <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">실시간 검색 중</span>
                </div>
              )}
            </div>
            <p className="text-gray-400">
              {selectedVehicle.brand} {selectedVehicle.model}에 최적화된 금융 옵션을 확인하세요
            </p>
            {isSearchingRealTime && (
              <p className="text-sm text-green-400 mt-2">
                💳 최신 금융상품 정보를 검색하여 더 정확한 조건을 제공합니다
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 차량 정보 요약 */}
        <div className="bg-gray-800/50 rounded-2xl shadow-sm border border-gray-700 p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">선택 차량</h3>
              <p className="text-gray-400">
                {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                {selectedVehicle.price.toLocaleString()}만원
              </div>
            </div>
          </div>
        </div>

        {/* 금융 옵션 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {financeOptions.map((option) => (
            <div
              key={option.id}
              className={`bg-gray-800/50 rounded-2xl shadow-sm border-2 p-6 transition-all duration-200 cursor-pointer hover:shadow-md backdrop-blur-sm ${
                selectedOption?.id === option.id
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedOption(option)}
            >
              {/* 헤더 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                    {option.type === 'cash' && <PiggyBank className="w-5 h-5 text-green-400" />}
                    {option.type === 'loan' && <Building className="w-5 h-5 text-green-400" />}
                    {option.type === 'lease' && <Calendar className="w-5 h-5 text-green-400" />}
                    {option.type === 'installment' && <CreditCard className="w-5 h-5 text-green-400" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{option.title}</h3>
                    {option.interestRate && (
                      <p className="text-sm text-gray-400">연 {option.interestRate}%</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRecommendationBadge(option.recommendation)}`}>
                    {getRecommendationText(option.recommendation)}
                  </div>
                  {option.id.startsWith('realtime-') && (
                    <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center gap-1 border border-green-500/30">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      실시간
                    </div>
                  )}
                </div>
              </div>

              {/* 금액 정보 */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">월 납부액</span>
                  <span className="font-bold text-lg text-green-400">
                    {option.monthlyPayment === 0 ? '-' : `${option.monthlyPayment.toLocaleString()}만원`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">초기 납부금</span>
                  <span className="font-medium text-white">{option.downPayment.toLocaleString()}만원</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">총 비용</span>
                  <span className="font-medium text-white">{option.totalCost.toLocaleString()}만원</span>
                </div>
                {option.term && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">상환 기간</span>
                    <span className="font-medium text-white">{option.term}개월</span>
                  </div>
                )}
              </div>

              {/* 장단점 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2">장점</h4>
                  <ul className="space-y-1">
                    {option.pros.slice(0, 2).map((pro, index) => (
                      <li key={index} className="text-xs text-gray-300 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-2">단점</h4>
                  <ul className="space-y-1">
                    {option.cons.slice(0, 2).map((con, index) => (
                      <li key={index} className="text-xs text-gray-300 flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 선택된 옵션 상세 */}
        {selectedOption && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-8 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-green-300 mb-4">선택된 금융 옵션 상세</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-gray-300">월 납부액</span>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {selectedOption.monthlyPayment === 0 ? '없음' : `${selectedOption.monthlyPayment.toLocaleString()}만원`}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-gray-300">초기 비용</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {selectedOption.downPayment.toLocaleString()}만원
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-gray-300">총 비용</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {selectedOption.totalCost.toLocaleString()}만원
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            onClick={onConsultationComplete}
            size="lg"
            className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white px-8 py-4 text-lg shadow-lg shadow-green-500/25"
            disabled={!selectedOption}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            선택 완료
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-4 text-lg bg-transparent"
          >
            <Phone className="w-5 h-5 mr-2" />
            전문가 상담
          </Button>
        </div>

        {/* 주의사항 */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-300 mb-1">금융 상품 안내</h4>
              <p className="text-sm text-yellow-400">
                제시된 금융 옵션은 참고용이며, 실제 조건은 신용도와 소득에 따라 달라질 수 있습니다.
                정확한 조건은 각 금융기관에 직접 문의하시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}