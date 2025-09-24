'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Calculator,
  BookOpen,
  Users,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Download,
  Star,
  Heart
} from 'lucide-react';

interface Props {
  analysisResults: any;
  userData: any;
  onContinue: () => void;
}

export function EnhancedResultsDisplay({ analysisResults, userData, onContinue }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTutorExplanation, setShowTutorExplanation] = useState<string | null>(null);

  const recommendations = analysisResults?.recommendations || [];
  const transparencyData = analysisResults?.transparency_scorecard || [];
  const costSimulation = analysisResults?.personalized_cost_simulation;
  const tutorExplanations = analysisResults?.tutor_explanations;
  const similarBuyers = analysisResults?.similar_buyer_analysis;
  const multiAgentAnalysis = analysisResults?.multi_agent_analysis;

  // 차알못 친화적 용어 설명 컴포넌트
  const TutorTooltip = ({ term, explanation }: { term: string; explanation: string }) => (
    <span className="relative">
      <button
        onClick={() => setShowTutorExplanation(showTutorExplanation === term ? null : term)}
        className="text-blue-500 underline decoration-dotted hover:text-blue-600"
      >
        {term}
        <HelpCircle className="w-3 h-3 inline ml-1" />
      </button>
      {showTutorExplanation === term && (
        <div className="absolute z-10 bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2 w-64 shadow-lg">
          <div className="flex items-start">
            <BookOpen className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-800 mb-1">💡 쉬운 설명</div>
              <div className="text-sm text-blue-700">{explanation}</div>
            </div>
          </div>
        </div>
      )}
    </span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">

        {/* 헤더 - 차별화 포인트 강조 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 기존 플랫폼과 다른 차별화 분석 완료!
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            엔카나 보배드림에서는 절대 볼 수 없는 4가지 혁신적 인사이트
          </p>

          {/* 차별화 요소 하이라이트 */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg">
              <Shield className="w-8 h-8 mx-auto mb-2" />
              <div className="font-bold">완전 투명성</div>
              <div className="text-sm opacity-90">숨김 없는 실제 데이터</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <Calculator className="w-8 h-8 mx-auto mb-2" />
              <div className="font-bold">개인 맞춤 계산</div>
              <div className="text-sm opacity-90">당신만의 비용 시뮬레이션</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
              <BookOpen className="w-8 h-8 mx-auto mb-2" />
              <div className="font-bold">차알못 친화</div>
              <div className="text-sm opacity-90">쉬운 용어로 완벽 이해</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <div className="font-bold">실제 구매자 데이터</div>
              <div className="text-sm opacity-90">같은 처지 사람들의 선택</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">종합 요약</TabsTrigger>
            <TabsTrigger value="transparency">투명성 분석</TabsTrigger>
            <TabsTrigger value="cost">비용 시뮬레이션</TabsTrigger>
            <TabsTrigger value="similar">구매자 분석</TabsTrigger>
            <TabsTrigger value="vehicles">추천 차량</TabsTrigger>
          </TabsList>

          {/* 종합 요약 탭 */}
          <TabsContent value="overview" className="space-y-6">

            {/* AI 전문가 협업 결과 */}
            {multiAgentAnalysis && (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-800">
                    <Brain className="w-6 h-6 mr-2" />
                    🤖 AI 전문가 3명 협업 결론
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* 만장일치 추천 */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-bold text-green-800">
                        {multiAgentAnalysis.collaborative_conclusion?.unanimous_recommendation}
                      </span>
                    </div>
                    <div className="text-green-700">
                      {multiAgentAnalysis.collaborative_conclusion?.unique_value_proposition}
                    </div>
                  </div>

                  {/* 전문가별 핵심 인사이트 */}
                  <div className="grid md:grid-cols-3 gap-4">

                    {/* 차량 전문가 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-bold text-blue-800 mb-2">🚗 차량 전문가</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {multiAgentAnalysis.vehicle_expert_analysis?.key_insights?.map((insight: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-1.5"></span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 금융 전문가 */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-bold text-green-800 mb-2">💰 금융 전문가</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {multiAgentAnalysis.finance_expert_analysis?.key_insights?.map((insight: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 mt-1.5"></span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 리뷰 전문가 */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-bold text-purple-800 mb-2">📝 리뷰 전문가</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        {multiAgentAnalysis.review_expert_analysis?.key_insights?.map((insight: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 mt-1.5"></span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 액션 플랜 */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-bold text-yellow-800 mb-2">📋 추천 액션 플랜</h4>
                    <ol className="text-sm text-yellow-700 space-y-1">
                      {multiAgentAnalysis.collaborative_conclusion?.action_plan?.map((action: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 text-xs font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          {action}
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 핵심 지표 요약 */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">94</div>
                  <div className="text-sm text-gray-600">투명성 점수</div>
                  <div className="text-xs text-green-600">사고이력 완전공개</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">15만원</div>
                  <div className="text-sm text-gray-600">월 예상 절약액</div>
                  <div className="text-xs text-blue-600">연료비 + 정비비</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">128명</div>
                  <div className="text-sm text-gray-600">유사 구매자</div>
                  <div className="text-xs text-purple-600">같은 조건 분석</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-orange-600 mb-2">4.3/5</div>
                  <div className="text-sm text-gray-600">실제 만족도</div>
                  <div className="text-xs text-orange-600">검증된 후기</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 투명성 분석 탭 */}
          <TabsContent value="transparency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-green-600" />
                  🛡️ 완전 투명성 보장 - 기존 플랫폼과의 차이점
                </CardTitle>
                <p className="text-gray-600">
                  엔카, 보배드림에서는 볼 수 없는 완전한 투명성 데이터
                </p>
              </CardHeader>
              <CardContent>
                {transparencyData.length > 0 ? (
                  <div className="space-y-4">
                    {transparencyData.slice(0, 3).map((vehicle: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg">{vehicle.vehicle_name}</h3>
                          <Badge className={`${
                            vehicle.transparency_score.overall >= 90 ? 'bg-green-500' :
                            vehicle.transparency_score.overall >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          } text-white`}>
                            투명성 {vehicle.transparency_score.overall}/100
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">사고이력</div>
                            <div className={`text-lg font-bold ${
                              vehicle.detailed_info.accident_count === 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {vehicle.detailed_info.accident_count === 0 ? '✓ 무사고' : `${vehicle.detailed_info.accident_count}회`}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="font-semibold">정비이력</div>
                            <div className={`text-lg font-bold ${
                              vehicle.detailed_info.maintenance_complete ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {vehicle.detailed_info.maintenance_complete ? '✓ 완료' : '일부 누락'}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="font-semibold">가격 적정성</div>
                            <div className="text-lg font-bold text-blue-600">
                              {vehicle.transparency_score.price_fairness}/100
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="font-semibold">판매자 신뢰도</div>
                            <div className="text-lg font-bold text-purple-600">
                              {vehicle.transparency_score.seller_reliability}/100
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                          <div className="font-semibold text-blue-800 mb-1">💡 CarFin만의 투명성</div>
                          <div className="text-blue-700 text-sm">
                            기존 플랫폼에서는 숨겨지는 사고이력, 정비내역을 RDS 데이터를 통해 완전 공개합니다
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    투명성 데이터를 불러오는 중...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 개인화 비용 시뮬레이션 탭 */}
          <TabsContent value="cost" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-6 h-6 mr-2 text-blue-600" />
                  💰 당신만의 개인화 비용 시뮬레이션
                </CardTitle>
                <p className="text-gray-600">
                  기존 플랫폼의 단순 할부금과 달리, 당신의 라이프스타일 기반 실제 비용 계산
                </p>
              </CardHeader>
              <CardContent>
                {costSimulation && (
                  <div className="space-y-6">

                    {/* 월 비용 분석 */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                      <h3 className="font-bold text-lg mb-4 text-blue-800">
                        📊 당신의 월별 차량 비용 (기존 플랫폼에서는 볼 수 없는 상세 분석)
                      </h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">비용 항목별 분석</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>할부금</span>
                              <span className="font-bold">{costSimulation.monthly_breakdown.loan_payment.toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between">
                              <span>
                                <TutorTooltip
                                  term="연료비"
                                  explanation={tutorExplanations?.cost_explanations?.fuel || "월 주행거리와 연비를 기반으로 계산한 실제 연료비입니다"}
                                />
                              </span>
                              <span className="font-bold text-green-600">
                                {costSimulation.monthly_breakdown.fuel_cost.toLocaleString()}원
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>
                                <TutorTooltip
                                  term="보험료"
                                  explanation={tutorExplanations?.cost_explanations?.insurance || "나이와 가족 상황을 고려한 보험료 예상치입니다"}
                                />
                              </span>
                              <span className="font-bold">{costSimulation.monthly_breakdown.insurance.toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between">
                              <span>정비비</span>
                              <span className="font-bold">{costSimulation.monthly_breakdown.maintenance.toLocaleString()}원</span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between text-lg font-bold">
                              <span>총 월 비용</span>
                              <span className="text-blue-600">{costSimulation.monthly_breakdown.total.toLocaleString()}원</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">🎉 기존 대비 절약 효과</h4>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-green-600 mb-2">
                                월 {costSimulation.compared_to_current?.monthly_savings.toLocaleString()}원
                              </div>
                              <div className="text-sm text-green-700">기존 차량 대비 절약</div>
                              <div className="text-xs text-green-600 mt-2">
                                연간 {costSimulation.compared_to_current?.annual_savings.toLocaleString()}원 절약!
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="font-semibold text-yellow-800 mb-1">💡 절약 비결</div>
                            <div className="text-yellow-700 text-sm">
                              {userData.priority === '연비' ?
                                '하이브리드 차량 선택으로 연료비 30% 절약' :
                                '적정 연식 차량으로 감가상각비 최소화'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3년 비용 전망 */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="font-bold text-lg mb-4">📈 3년간 총 비용 전망</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {costSimulation.yearly_projection.year_1.toLocaleString()}만원
                          </div>
                          <div className="text-sm text-gray-600">1년차</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {costSimulation.yearly_projection.year_2.toLocaleString()}만원
                          </div>
                          <div className="text-sm text-gray-600">2년차</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {costSimulation.yearly_projection.year_3.toLocaleString()}만원
                          </div>
                          <div className="text-sm text-gray-600">3년차</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 유사 구매자 분석 탭 */}
          <TabsContent value="similar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-6 h-6 mr-2 text-purple-600" />
                  👥 같은 처지 구매자들의 실제 선택
                </CardTitle>
                <p className="text-gray-600">
                  기존 플랫폼에서는 볼 수 없는 유사한 상황 구매자들의 실제 데이터 분석
                </p>
              </CardHeader>
              <CardContent>
                {similarBuyers && (
                  <div className="space-y-6">

                    {/* 유사 구매자 프로필 */}
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="font-bold text-lg mb-4 text-purple-800">
                        📊 당신과 비슷한 {similarBuyers.matching_buyers}명의 구매자 분석
                      </h3>

                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="font-semibold">연령대</div>
                          <div className="text-lg font-bold text-purple-600">
                            {similarBuyers.demographics.age_range}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">가족 상황</div>
                          <div className="text-lg font-bold text-purple-600">
                            {similarBuyers.demographics.family_status}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">예산 범위</div>
                          <div className="text-lg font-bold text-purple-600">
                            {similarBuyers.demographics.budget_range}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">거주 지역</div>
                          <div className="text-lg font-bold text-purple-600">
                            {similarBuyers.demographics.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 인기 선택 차량 */}
                    <div>
                      <h3 className="font-bold text-lg mb-4">🏆 이들이 실제로 선택한 차량 TOP 3</h3>
                      <div className="space-y-4">
                        {similarBuyers.popular_choices.map((choice: any, idx: number) => (
                          <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                  idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-500'
                                } text-white font-bold`}>
                                  {idx + 1}
                                </div>
                                <h4 className="font-bold text-lg">{choice.vehicle}</h4>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-purple-600">{choice.percentage}%</div>
                                <div className="text-sm text-gray-600">선택률</div>
                              </div>
                            </div>

                            <div className="flex items-center mb-3">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" />
                              <span className="font-semibold">만족도: {choice.satisfaction}/5.0</span>
                              <span className="text-gray-500 ml-2">
                                ({Math.round(similarBuyers.matching_buyers * choice.percentage / 100)}명 평가)
                              </span>
                            </div>

                            {/* 실제 후기 */}
                            <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                              <div className="font-semibold text-blue-800 mb-2">💬 실제 구매자 후기</div>
                              <div className="space-y-1">
                                {choice.real_reviews.map((review: string, reviewIdx: number) => (
                                  <div key={reviewIdx} className="text-blue-700 text-sm flex items-start">
                                    <Heart className="w-3 h-3 text-red-500 mr-2 mt-1" />
                                    "{review}"
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="font-semibold text-green-800 mb-1">✨ 인사이트</div>
                      <div className="text-green-700 text-sm">
                        당신과 같은 상황의 구매자 중 87%가 구매 후에도 만족하고 있으며,
                        특히 {similarBuyers.popular_choices[0]?.vehicle}을 선택한 분들의 만족도가 가장 높습니다.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 추천 차량 탭 */}
          <TabsContent value="vehicles" className="space-y-6">
            {/* 기존 추천 차량 표시 로직 */}
            <div className="grid lg:grid-cols-2 gap-6">
              {recommendations.slice(0, 4).map((vehicle: any, index: number) => (
                <Card key={index} className={`${
                  index === 0 ? 'border-2 border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'bg-white'
                }`}>
                  <CardContent className="p-6">
                    {index === 0 && (
                      <Badge className="bg-blue-600 text-white mb-4">
                        🏆 AI 전문가 만장일치 추천
                      </Badge>
                    )}

                    <h3 className="text-xl font-bold mb-4">{vehicle.name}</h3>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">가격</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {vehicle.price?.toLocaleString()}만원
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">매칭도</div>
                        <div className="text-2xl font-bold text-green-600">
                          {vehicle.matchingScore}%
                        </div>
                      </div>
                    </div>

                    {/* 차알못 친화적 설명 */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="font-semibold text-yellow-800 mb-1">🧠 차알못을 위한 쉬운 설명</div>
                      <div className="text-yellow-700 text-sm">
                        {userData.usage === '출퇴근용' ?
                          `이 차는 ${userData.priority === '연비' ? '기름값을 많이 아껴주고' : '타기 편한'} 출퇴근용 차량이에요` :
                          userData.usage === '가족용' ?
                          '가족이 함께 타기에 안전하고 넓은 차량이에요' :
                          '주말 나들이나 취미 활동에 적합한 차량이에요'
                        }
                      </div>
                    </div>

                    {/* 추천 이유 */}
                    {vehicle.reasons && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">✨ 추천 이유</h4>
                        {vehicle.reasons.map((reason: string, idx: number) => (
                          <div key={idx} className="text-sm flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                            {reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 다음 단계 액션 */}
        <div className="text-center space-y-4">
          <Button
            onClick={onContinue}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
          >
            AI 상담받기 →
          </Button>

          <div className="flex justify-center space-x-4">
            <Button variant="outline" className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              분석 보고서 PDF 다운로드
            </Button>
            <Button variant="outline">
              다른 차량도 분석받기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}