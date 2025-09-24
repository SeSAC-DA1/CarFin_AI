'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Users,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Car,
  DollarSign,
  FileText,
  ArrowRight,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Target,
  Award,
  RefreshCcw,
  ExternalLink
} from 'lucide-react';
import { VehicleImage, getBrandColor } from '@/components/ui/VehicleImage';

interface MultiAgentResult {
  consultation_id: string;
  persona_summary: string;
  agents: Array<{
    agent_id: string;
    agent_name: string;
    agent_emoji: string;
    agent_role: string;
    analysis: {
      summary: string;
      key_findings: string[];
      recommendations: string[];
      concerns: string[];
      confidence_level: number;
    };
    vehicle_suggestions: Array<{
      vehicleid: string;
      manufacturer: string;
      model: string;
      price: number;
      reasoning: string;
      pros: string[];
      cons: string[];
    }>;
  }>;
  consensus: {
    agreed_points: string[];
    disagreed_points: string[];
    final_recommendations: string[];
    confidence_score: number;
  };
  top_vehicles: Array<{
    vehicleid: string;
    manufacturer: string;
    model: string;
    price: number;
    agent_votes: string[];
    final_score: number;
    reasoning: string;
  }>;
}

interface SmartOrchestratorResult {
  orchestrator_id: string;
  analysis_depth: 'enhanced';
  sequential_analysis: {
    thinking_steps: {
      step: number;
      focus: string;
      analysis: string;
      findings: string[];
    }[];
    enhanced_recommendations: {
      priority: number;
      recommendation: string;
      supporting_evidence: string[];
      confidence: number;
    }[];
  };
  final_verdict: {
    top_choice: any;
    decision_confidence: number;
  };
}

interface ExtendedResult extends MultiAgentResult {
  smartOrchestrator?: SmartOrchestratorResult;
}

interface Props {
  result: ExtendedResult;
  onStartOver: () => void;
  onBack: () => void;
}

export function DataDashboard({ result, onStartOver, onBack }: Props) {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const router = useRouter();

  const formatPrice = (price: number): string => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}억 ${((price % 10000) / 1000).toFixed(0)}천만원`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}천만원`;
    } else {
      return `${price}만원`;
    }
  };

  const getAgentColor = (agentId: string): string => {
    const colorMap: Record<string, string> = {
      'vehicle_expert': 'agent-vehicle-bg text-slate-800 border-0',
      'finance_expert': 'agent-finance-bg text-slate-800 border-0',
      'review_expert': 'agent-review-bg text-slate-800 border-0'
    };
    return colorMap[agentId] || 'bg-slate-200 text-slate-800 border-0';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-white';
    if (score >= 70) return 'text-white';
    if (score >= 50) return 'text-white';
    return 'text-white';
  };

  const getScoreGradient = (score: number): string => {
    if (score >= 85) return 'var(--carfin-gradient-finance)';
    if (score >= 70) return 'var(--carfin-gradient-vehicle)';
    if (score >= 50) return 'var(--carfin-gradient-review)';
    return 'var(--carfin-gradient-orchestrator)';
  };

  return (
    <div className="min-h-screen carfin-gradient-bg p-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 헤더 - 완료 축하 */}
        <div className="text-center space-y-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-slate-300 text-slate-800 hover:bg-slate-100"
          >
            ← 전문가 회의 다시보기
          </Button>

          <div className="carfin-glass-card p-8">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 text-yellow-500 mr-3" />
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              🎉 {result.smartOrchestrator ? 'AI 고도화 분석' : '전문가 분석'} 완료!
            </h1>
            <p className="text-xl text-slate-600 mb-4">
              {result.smartOrchestrator ?
                'Smart Agent Orchestrator가 3명의 전문가 의견을 종합 분석했습니다' :
                '3명의 AI 전문가가 신중히 분석한 결과입니다'
              }
            </p>

            {result.smartOrchestrator && (
              <div className="mb-6 p-4 agent-orchestrator-bg rounded-lg border-l-4" style={{ borderLeftColor: 'var(--expert-orchestrator-bright)' }}>
                <div className="flex items-center justify-center mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-2 text-white font-bold shadow-lg"
                    style={{ background: 'var(--carfin-gradient-orchestrator)' }}
                  >
                    <span className="text-sm">🧠</span>
                  </div>
                  <span className="text-slate-800 font-bold">Smart Agent Orchestrator 고도화 분석</span>
                </div>
                <p className="text-sm text-slate-700 text-center mb-3">
                  Sequential Thinking 기술을 활용한 멀티 에이전트 결과 종합 분석
                </p>
                <div className="text-center space-y-2">
                  <Badge
                    className="text-white font-bold border-0 px-4 py-1"
                    style={{ background: 'var(--carfin-gradient-orchestrator)' }}
                  >
                    분석 신뢰도: {result.smartOrchestrator.final_verdict?.decision_confidence || 85}%
                  </Badge>
                  <div className="text-xs font-semibold" style={{ color: 'var(--expert-orchestrator-dark)' }}>
                    {result.smartOrchestrator.sequential_analysis?.thinking_steps?.length || 0}단계 심층 분석 수행
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-center items-center space-x-6">
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${getScoreColor(result.consensus.confidence_score)} px-4 py-2 rounded-lg shadow-lg`}
                  style={{ background: getScoreGradient(result.consensus.confidence_score) }}
                >
                  {result.consensus.confidence_score}%
                </div>
                <div className="text-sm text-slate-600 mt-2">종합 신뢰도</div>
              </div>
              <div className="text-center">
                <div
                  className="text-3xl font-bold text-white px-4 py-2 rounded-lg shadow-lg"
                  style={{ background: 'var(--carfin-gradient-vehicle)' }}
                >
                  {result.top_vehicles.length}
                </div>
                <div className="text-sm text-slate-600 mt-2">추천 차량</div>
              </div>
              <div className="text-center">
                <div
                  className="text-3xl font-bold text-white px-4 py-2 rounded-lg shadow-lg"
                  style={{ background: 'var(--carfin-gradient-finance)' }}
                >
                  {result.consensus.agreed_points.length}
                </div>
                <div className="text-sm text-slate-600 mt-2">합의 포인트</div>
              </div>
            </div>
          </div>
        </div>

        {/* TOP 추천 차량들 */}
        <Card className="carfin-glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Trophy className="w-6 h-6 text-yellow-500" />
              🏆 TOP 추천 차량
            </CardTitle>
            <p className="text-slate-600">전문가들이 엄선한 맞춤 차량입니다</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {result.top_vehicles.slice(0, 3).map((vehicle, index) => (
                <Card
                  key={vehicle.vehicleid}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedVehicle === vehicle.vehicleid
                      ? 'ring-4 ring-green-400 bg-green-50'
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedVehicle(
                    selectedVehicle === vehicle.vehicleid ? null : vehicle.vehicleid
                  )}
                >
                  <CardContent className="p-6">
                    {/* 순위 배지 */}
                    <div className="flex justify-between items-start mb-4">
                      <Badge
                        className="text-white font-bold border-0 px-3 py-1 shadow-lg"
                        style={{
                          background: index === 0 ? 'var(--carfin-gradient-finance)' :
                                     index === 1 ? 'var(--carfin-gradient-vehicle)' :
                                     'var(--carfin-gradient-review)'
                        }}
                      >
                        #{index + 1}
                      </Badge>
                      <div className="text-right">
                        <div
                          className="text-2xl font-bold text-white px-3 py-1 rounded-lg shadow-lg"
                          style={{ background: 'var(--carfin-gradient-finance)' }}
                        >
                          {vehicle.final_score}/3
                        </div>
                        <div className="text-xs text-slate-600 mt-1">전문가 점수</div>
                      </div>
                    </div>

                    {/* 차량 정보 */}
                    <div className="text-center space-y-3">
                      <VehicleImage
                        alt={`${vehicle.manufacturer} ${vehicle.model}`}
                        manufacturer={vehicle.manufacturer}
                        model={vehicle.model}
                        vehicleId={vehicle.vehicleid}
                        size="lg"
                        useApi={true}
                        className="mx-auto shadow-lg border-2 border-slate-300 hover:border-blue-400 transition-colors duration-300"
                      />
                      <h3 className="text-xl font-bold text-slate-800">
                        {vehicle.manufacturer} {vehicle.model}
                      </h3>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(vehicle.price)}
                      </div>

                      {/* 전문가 투표 */}
                      <div className="flex justify-center space-x-1">
                        {vehicle.agent_votes.map((emoji, idx) => (
                          <span key={idx} className="text-2xl">{emoji}</span>
                        ))}
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-2">
                        {vehicle.reasoning}
                      </p>

                      {selectedVehicle === vehicle.vehicleid && (
                        <div className="mt-4 space-y-2">
                          <Button
                            size="sm"
                            className="w-full text-white font-bold py-2 shadow-lg hover:scale-105 transition-all duration-300 border-0"
                            style={{ background: 'var(--carfin-gradient-vehicle)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/vehicle/${vehicle.vehicleid}`);
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            상세 정보 보기
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 전문가 의견 요약 */}
          <Card className="carfin-glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Users className="w-5 h-5" />
                🧑‍💼 전문가 의견 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {result.agents.map((agent) => (
                <div key={agent.agent_id} className="border-l-4 border-gray-200 pl-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{agent.agent_emoji}</span>
                    <span className="font-semibold text-slate-800">{agent.agent_name}</span>
                    <Badge className={`ml-2 ${getAgentColor(agent.agent_id)}`}>
                      {agent.analysis.confidence_level}% 신뢰도
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    {agent.analysis.summary}
                  </p>
                  <div className="text-xs text-slate-500">
                    <span className="font-medium">핵심:</span> {agent.analysis.key_findings.slice(0, 2).join(', ')}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 합의/불일치 사항 */}
          <Card className="carfin-glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Target className="w-5 h-5" />
                🎯 전문가 합의 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* 합의 사항 */}
              <div>
                <div className="flex items-center mb-3">
                  <ThumbsUp className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-semibold text-slate-800">✅ 공통 의견</h4>
                </div>
                <div className="space-y-2">
                  {result.consensus.agreed_points.map((point, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 불일치 사항 */}
              {result.consensus.disagreed_points.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <h4 className="font-semibold text-slate-800">⚡ 의견 차이</h4>
                  </div>
                  <div className="space-y-2">
                    {result.consensus.disagreed_points.map((point, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 개인 인사이트 & 액션 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 개인 페르소나 */}
          <Card className="carfin-glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Award className="w-5 h-5" />
                👤 당신의 프로필
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-slate-600">
                  {result.persona_summary}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 최종 추천 */}
          <Card className="carfin-glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Sparkles className="w-5 h-5" />
                💡 최종 조언
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {result.consensus.final_recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 액션 버튼들 */}
          <Card className="carfin-glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <TrendingUp className="w-5 h-5" />
                🚀 다음 단계
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button
                className="w-full text-white font-bold py-3 shadow-lg hover:scale-105 transition-all duration-300 border-0"
                style={{ background: 'var(--carfin-gradient-vehicle)' }}
              >
                <Car className="w-4 h-4 mr-2" />
                시승 예약하기
              </Button>
              <Button
                className="w-full text-white font-bold py-3 shadow-lg hover:scale-105 transition-all duration-300 border-0"
                style={{ background: 'var(--carfin-gradient-finance)' }}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                견적 문의하기
              </Button>
              <Button
                onClick={onStartOver}
                className="w-full text-white font-bold py-3 shadow-lg hover:scale-105 transition-all duration-300 border-0"
                style={{ background: 'var(--carfin-gradient-orchestrator)' }}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                다시 상담받기
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 푸터 */}
        <div className="text-center py-8">
          <p className="text-slate-600 mb-2">
            🎊 CarFin AI와 함께한 스마트한 차량 선택을 축하합니다!
          </p>
          <p className="text-sm text-slate-500">
            전문가 상담 ID: {result.consultation_id}
          </p>
        </div>
      </div>
    </div>
  );
}