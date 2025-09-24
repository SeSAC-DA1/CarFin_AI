'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Car,
  DollarSign,
  FileText,
  ArrowRight,
  Sparkles,
  Clock
} from 'lucide-react';

interface AgentAnalysis {
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
}

interface MultiAgentResult {
  consultation_id: string;
  persona_summary: string;
  agents: AgentAnalysis[];
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

interface Props {
  personaContext: any;
  userProfile: any;
  onComplete: (result: MultiAgentResult) => void;
  onBack: () => void;
}

type AnalysisPhase = 'preparing' | 'vehicle_analysis' | 'finance_analysis' | 'review_analysis' | 'consensus' | 'completed';

export function MultiAgentMeeting({ personaContext, userProfile, onComplete, onBack }: Props) {
  const [currentPhase, setCurrentPhase] = useState<AnalysisPhase>('preparing');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MultiAgentResult | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentAnalysis | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isError, setIsError] = useState(false);
  const [discussionMessages, setDiscussionMessages] = useState<Array<{
    agent: string;
    emoji: string;
    message: string;
    timestamp: number;
  }>>([]);

  const agents = [
    {
      id: 'vehicle_expert',
      name: '김차량 전문가',
      emoji: '🚗',
      role: '자동차 기술 및 안전 전문가',
      color: 'var(--agent-vehicle)',
      bgClass: 'agent-vehicle-bg'
    },
    {
      id: 'finance_expert',
      name: '이금융 전문가',
      emoji: '💰',
      role: '자동차 금융 및 보험 전문가',
      color: 'var(--agent-finance)',
      bgClass: 'agent-finance-bg'
    },
    {
      id: 'review_expert',
      name: '박리뷰 전문가',
      emoji: '📝',
      role: '사용자 만족도 및 리뷰 전문가',
      color: 'var(--agent-review)',
      bgClass: 'agent-review-bg'
    }
  ];

  useEffect(() => {
    startConsultation();
  }, []);

  const startConsultation = async () => {
    try {
      // 준비 단계
      setCurrentPhase('preparing');
      setProgress(10);
      await simulateDelay(1500);

      addMessage('system', '🤖', `${personaContext.name}님을 위한 전문가 회의를 시작합니다.`);

      // 각 전문가 분석 단계별 시뮬레이션
      const phases: AnalysisPhase[] = ['vehicle_analysis', 'finance_analysis', 'review_analysis'];

      for (let i = 0; i < phases.length; i++) {
        setCurrentPhase(phases[i]);
        setProgress(20 + (i * 25));

        const agent = agents[i];
        addMessage(agent.id, agent.emoji, `안녕하세요! ${agent.role}로서 분석을 시작하겠습니다.`);

        await simulateDelay(2000);
        addMessage(agent.id, agent.emoji, `${personaContext.name} 페르소나에 맞는 차량을 검토 중입니다...`);

        await simulateDelay(1500);
      }

      // 실제 API 호출
      setCurrentPhase('consensus');
      setProgress(85);
      addMessage('system', '⚡', '전문가들이 의견을 종합하고 있습니다...');

      // 디버깅용 로그
      console.log('🔍 API 호출 전 personaContext 확인:', personaContext);
      console.log('🔍 API 호출 전 userProfile 확인:', userProfile);

      const response = await fetch('/api/multi-agent-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaContext,
          userProfile
        }),
      });

      if (!response.ok) {
        throw new Error(`상담 실패: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        setCurrentPhase('completed');
        setProgress(100);

        addMessage('system', '✅', '전문가 상담이 완료되었습니다!');

        // 2초 후 결과 전달
        setTimeout(() => {
          onComplete(data.result);
        }, 2000);
      } else {
        throw new Error(data.error || '상담 처리 실패');
      }

    } catch (error) {
      console.error('❌ 멀티 에이전트 상담 실패:', error);

      if (retryCount < 2) {
        // 최대 2회 재시도
        setRetryCount(prev => prev + 1);
        addMessage('system', '⚠️', `전문가 상담 중 오류가 발생했습니다. (${retryCount + 1}/3 시도)`);
        addMessage('system', '🔄', '실제 데이터베이스 연결을 다시 시도합니다...');

        setCurrentPhase('preparing');
        setProgress(0);

        setTimeout(() => {
          startConsultation();
        }, 3000);
      } else {
        // 3회 실패 시 사용자에게 옵션 제공
        setIsError(true);
        addMessage('system', '❌', '데이터베이스 연결에 문제가 있습니다.');
        addMessage('system', '🔧', '네트워크 상태를 확인하고 다시 시도해주세요.');
      }
    }
  };

  const addMessage = (agent: string, emoji: string, message: string) => {
    setDiscussionMessages(prev => [...prev, {
      agent,
      emoji,
      message,
      timestamp: Date.now()
    }]);
  };

  const simulateDelay = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // 🚨 REMOVED: generateFallbackResult() - 절대 Mock 데이터 사용 금지!

  const getPhaseTitle = (phase: AnalysisPhase): string => {
    const titles = {
      'preparing': '🤖 전문가 회의 준비 중...',
      'vehicle_analysis': '🚗 차량 기술 분석 중...',
      'finance_analysis': '💰 금융 조건 분석 중...',
      'review_analysis': '📝 사용자 만족도 분석 중...',
      'consensus': '⚡ 전문가 의견 통합 중...',
      'completed': '✅ 전문가 상담 완료!'
    };
    return titles[phase];
  };

  const getCurrentAgentInfo = () => {
    const agentMap = {
      'vehicle_analysis': agents[0],
      'finance_analysis': agents[1],
      'review_analysis': agents[2]
    };
    return agentMap[currentPhase as keyof typeof agentMap];
  };

  return (
    <div className="min-h-screen carfin-gradient-bg p-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 헤더 */}
        <div className="text-center space-y-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-slate-300 text-slate-800 hover:bg-slate-100"
          >
            ← 이전으로
          </Button>

          <h1 className="text-4xl font-bold text-slate-800">
            🏆 AI 전문가 3인 협업 상담
          </h1>
          <p className="text-xl text-slate-600">
            <strong>{personaContext.name}</strong>님을 위한 맞춤 분석이 진행됩니다
          </p>
        </div>

        {/* 진행률 */}
        <Card className="carfin-glass-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">{getPhaseTitle(currentPhase)}</h2>
                <Badge className="bg-green-600/20 text-green-700 border-green-500/50">
                  {progress}%
                </Badge>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* 전문가 패널 */}
        <div className="grid md:grid-cols-3 gap-6">
          {agents.map((agent, index) => {
            const isActive = getCurrentAgentInfo()?.id === agent.id;
            const isCompleted = progress > 20 + (index * 25);

            return (
              <Card key={agent.id} className={`carfin-glass-card ${agent.bgClass} ${isActive ? 'ring-4 ring-green-400' : ''} transition-all duration-300`}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="agent-avatar mx-auto">
                    <span className="text-3xl">{agent.emoji}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{agent.name}</h3>
                    <p className="text-sm text-slate-600">{agent.role}</p>
                  </div>

                  {isCompleted && (
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-semibold">분석 완료</span>
                    </div>
                  )}

                  {isActive && (
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-sm text-blue-600 font-semibold">분석 중...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 실시간 토론 */}
        <Card className="carfin-glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <MessageSquare className="w-5 h-5" />
              실시간 전문가 토론
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {discussionMessages.map((msg, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-slate-100/50 rounded-lg">
                  <div className="text-xl">{msg.emoji}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-700">
                      {msg.agent === 'system' ? 'CarFin AI' : agents.find(a => a.id === msg.agent)?.name || msg.agent}
                    </div>
                    <div className="text-slate-600">{msg.message}</div>
                  </div>
                </div>
              ))}

              {discussionMessages.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  💭 전문가들의 토론이 곧 시작됩니다...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 에러 발생 시 재시도 옵션 */}
        {isError && (
          <Card className="carfin-glass-card border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                연결 문제 발생
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="text-center text-slate-600">
                <p>실제 데이터베이스 연결에 문제가 있습니다.</p>
                <p className="text-sm mt-2">네트워크 상태를 확인하고 다시 시도해주세요.</p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setIsError(false);
                    setRetryCount(0);
                    setDiscussionMessages([]);
                    startConsultation();
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border-slate-300 text-slate-600"
                >
                  이전으로 돌아가기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 결과 미리보기 */}
        {result && currentPhase === 'completed' && (
          <Card className="carfin-glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Sparkles className="w-5 h-5" />
                상담 결과 미리보기
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.consensus.confidence_score}%</div>
                  <div className="text-sm text-slate-600">전문가 신뢰도</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.consensus.agreed_points.length}</div>
                  <div className="text-sm text-slate-600">합의된 포인트</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{result.top_vehicles.length}</div>
                  <div className="text-sm text-slate-600">추천 차량</div>
                </div>
              </div>

              <div className="text-center mt-6">
                <p className="text-slate-600 mb-4">
                  🎉 전문가 상담이 성공적으로 완료되었습니다!
                </p>
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">결과 페이지로 자동 이동 중...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}