'use client';

import { useState, useEffect } from 'react';
import { Brain, Lightbulb, Search, CheckCircle, Clock, MessageSquare, Car, Users } from 'lucide-react';

interface ThinkingStep {
  id: string;
  type: 'analysis' | 'search' | 'reasoning' | 'decision' | 'collaboration';
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  timestamp: Date;
  details?: string;
  agent?: 'concierge' | 'needs_analyst' | 'data_analyst' | 'system';
}

interface GPTThinkingUIProps {
  isVisible: boolean;
  currentMessage?: string;
  isProcessing: boolean;
  agentCollaboration?: {
    currentAgent?: string;
    step?: string;
    progress?: number;
  };
}

export default function GPTThinkingUI({
  isVisible,
  currentMessage,
  isProcessing,
  agentCollaboration
}: GPTThinkingUIProps) {
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // 실제 AI 협업 과정을 시뮬레이션하는 단계들
  const generateThinkingSteps = (message: string): ThinkingStep[] => {
    const now = new Date();

    return [
      {
        id: '1',
        type: 'analysis',
        content: '사용자의 질문을 분석하고 숨겨진 니즈를 파악합니다',
        status: 'pending',
        timestamp: now,
        details: `"${message?.substring(0, 50)}..." 에서 핵심 요구사항 추출 중`,
        agent: 'needs_analyst'
      },
      {
        id: '2',
        type: 'collaboration',
        content: '3명의 전문가 에이전트 간 협업 패턴을 결정합니다',
        status: 'pending',
        timestamp: new Date(now.getTime() + 1000),
        details: '컨시어지 → 니즈분석 → 데이터분석 순서로 A2A 협업 시작',
        agent: 'system'
      },
      {
        id: '3',
        type: 'search',
        content: '실시간 데이터베이스에서 관련 차량 정보를 검색합니다',
        status: 'pending',
        timestamp: new Date(now.getTime() + 2000),
        details: '117,564대 실제 매물에서 조건에 맞는 차량 필터링 중',
        agent: 'data_analyst'
      },
      {
        id: '4',
        type: 'reasoning',
        content: '각 에이전트의 전문성을 바탕으로 심층 분석을 수행합니다',
        status: 'pending',
        timestamp: new Date(now.getTime() + 3000),
        details: '니즈 매칭도, TCO 분석, 가성비 평가 등 다각도 검토',
        agent: 'concierge'
      },
      {
        id: '5',
        type: 'decision',
        content: '최종 추천 결과를 종합하고 응답을 생성합니다',
        status: 'pending',
        timestamp: new Date(now.getTime() + 4000),
        details: '3개 에이전트의 분석 결과를 통합하여 최적 솔루션 도출',
        agent: 'system'
      }
    ];
  };

  // 메시지가 변경될 때 새로운 thinking 프로세스 시작
  useEffect(() => {
    if (currentMessage && isProcessing) {
      const steps = generateThinkingSteps(currentMessage);
      setThinkingSteps(steps);
      setCurrentStepIndex(0);
    }
  }, [currentMessage, isProcessing]);

  // 단계별 진행 시뮬레이션
  useEffect(() => {
    if (!isProcessing || thinkingSteps.length === 0) return;

    const interval = setInterval(() => {
      setThinkingSteps(prev => {
        const updated = [...prev];
        const currentStep = updated[currentStepIndex];

        if (currentStep && currentStep.status === 'pending') {
          currentStep.status = 'in_progress';
          return updated;
        }

        if (currentStep && currentStep.status === 'in_progress') {
          currentStep.status = 'completed';
          if (currentStepIndex < thinkingSteps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
          }
          return updated;
        }

        return prev;
      });
    }, 1500); // 1.5초마다 다음 단계로

    return () => clearInterval(interval);
  }, [isProcessing, currentStepIndex, thinkingSteps.length]);

  // 에이전트별 아이콘 및 색상
  const getAgentInfo = (agent?: string) => {
    switch (agent) {
      case 'concierge':
        return { icon: Users, color: 'blue', name: '컨시어지 매니저' };
      case 'needs_analyst':
        return { icon: Brain, color: 'purple', name: '니즈 분석 전문가' };
      case 'data_analyst':
        return { icon: Search, color: 'green', name: '데이터 분석 전문가' };
      default:
        return { icon: MessageSquare, color: 'gray', name: 'AI 시스템' };
    }
  };

  // 상태별 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6 mb-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">🧠 GPT Thinking Process</h3>
          <p className="text-sm text-slate-600">
            AI 에이전트들의 실시간 협업 과정을 보여드려요
          </p>
        </div>
        {isProcessing && (
          <div className="ml-auto">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              처리 중...
            </div>
          </div>
        )}
      </div>

      {/* 현재 에이전트 협업 상태 */}
      {agentCollaboration?.currentAgent && (
        <div className="bg-white rounded-lg p-4 mb-4 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">현재 협업 단계</div>
              <div className="text-sm text-slate-600">
                {agentCollaboration.currentAgent} • {agentCollaboration.step}
              </div>
            </div>
          </div>
          {agentCollaboration.progress && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${agentCollaboration.progress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* 생각 과정 단계들 */}
      <div className="space-y-4">
        {thinkingSteps.map((step, index) => {
          const agentInfo = getAgentInfo(step.agent);
          const AgentIcon = agentInfo.icon;

          return (
            <div
              key={step.id}
              className={`relative flex gap-4 p-4 rounded-lg border transition-all duration-300 ${
                step.status === 'completed'
                  ? 'bg-green-50 border-green-200'
                  : step.status === 'in_progress'
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* 연결선 */}
              {index < thinkingSteps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-300"></div>
              )}

              {/* 상태 아이콘 */}
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(step.status)}
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 bg-${agentInfo.color}-100 rounded-lg flex items-center justify-center`}>
                    <AgentIcon className={`w-3 h-3 text-${agentInfo.color}-600`} />
                  </div>
                  <span className={`text-xs font-medium text-${agentInfo.color}-700 uppercase tracking-wide`}>
                    {agentInfo.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {step.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>

                <div className="text-sm font-medium text-slate-800 mb-1">
                  {step.content}
                </div>

                {step.details && (
                  <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200">
                    💭 {step.details}
                  </div>
                )}

                {/* 진행 중일 때 추가 효과 */}
                {step.status === 'in_progress' && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span>처리 중...</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 요약 정보 */}
      {isProcessing && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">실시간 AI 협업:</span>
            <span>3개 전문 에이전트가 117,564대 실제 매물을 분석하여 최적의 답변을 준비 중입니다</span>
          </div>
        </div>
      )}
    </div>
  );
}