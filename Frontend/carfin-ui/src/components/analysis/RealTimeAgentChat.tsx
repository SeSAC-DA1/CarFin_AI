'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Zap } from 'lucide-react';

interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  message: string;
  timestamp: Date;
  type: 'thinking' | 'analysis' | 'recommendation' | 'question' | 'system';
  isTyping?: boolean;
}

interface Props {
  personaContext: any;
  userProfile: any;
  onComplete: (result: any) => void;
  onBack: () => void;
}

export function RealTimeAgentChat({ personaContext, userProfile, onComplete, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const agents = [
    {
      id: 'vehicle_expert',
      name: '김차량 전문가',
      emoji: '🚗',
      role: '자동차 기술 및 안전 전문가',
      color: 'var(--expert-vehicle-bright)',
      bgColor: 'rgba(59, 130, 246, 0.15)',
      gradient: 'var(--carfin-gradient-vehicle)'
    },
    {
      id: 'finance_expert',
      name: '이금융 전문가',
      emoji: '💰',
      role: '자동차 금융 및 보험 전문가',
      color: 'var(--expert-finance-bright)',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      gradient: 'var(--carfin-gradient-finance)'
    },
    {
      id: 'review_expert',
      name: '박리뷰 전문가',
      emoji: '📝',
      role: '사용자 만족도 및 리뷰 전문가',
      color: 'var(--expert-review-bright)',
      bgColor: 'rgba(249, 115, 22, 0.15)',
      gradient: 'var(--carfin-gradient-review)'
    }
  ];

  // 메시지 추가 함수
  const addMessage = (agentId: string, message: string, type: ChatMessage['type'] = 'analysis') => {
    const agent = agents.find(a => a.id === agentId) || { name: 'System', emoji: '🤖' };
    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      agentId,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      message,
      timestamp: new Date(),
      type,
      isTyping: false
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  // 실시간 분석 시작
  const startRealAnalysis = async () => {
    // 엄격한 데이터 검증
    if (!personaContext || !personaContext.name || !personaContext.budget) {
      addMessage('system', '⚠️ 사용자 프로필 정보가 부족합니다. 이전 단계로 돌아가서 다시 진행해주세요.', 'system');
      return;
    }

    // 실제 데이터 검증
    if (!personaContext.budget.min || !personaContext.budget.max) {
      addMessage('system', '⚠️ 예산 정보가 필요합니다. 프로필 설정을 다시 확인해주세요.', 'system');
      return;
    }

    setIsActive(true);
    addMessage('system', `${personaContext.name || '사용자'}님을 위한 전문가 회의를 시작합니다! 💫`, 'system');
    await delay(1500);

    // 각 전문가 간단한 인사
    addMessage('vehicle_expert', '안녕하세요! 차량 전문가입니다. 지금 분석 시작할게요 🚗', 'thinking');
    await delay(1000);
    addMessage('finance_expert', '금융 전문가입니다. 예산 분석 진행하겠습니다 💰', 'thinking');
    await delay(1000);
    addMessage('review_expert', '리뷰 전문가입니다. 사용자 만족도를 분석해보겠습니다 📝', 'thinking');
    await delay(1500);

    // 실제 API 호출
    addMessage('system', '💫 RDS 데이터베이스에서 실시간 매물 검색 중...', 'system');

    console.log('🔍 RealTimeAgentChat - personaContext 확인:', personaContext);
    console.log('🔍 RealTimeAgentChat - userProfile 확인:', userProfile);

    const requestData = { personaContext, userProfile };
    console.log('🔍 RealTimeAgentChat - 전송 데이터:', requestData);

    try {
      const response = await fetch('/api/multi-agent-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('📊 API 응답:', data);

      if (data.success && data.result) {
        setAnalysisResult(data.result);
        await delay(2000);

        // 실제 분석 결과를 바탕으로 대화 생성
        if (data.result.agents && data.result.agents.length > 0) {
          // 각 전문가 분석 결과 표시
          for (const agentAnalysis of data.result.agents) {
            await delay(1500);

            const agentId = agentAnalysis.agent_id;
            const summary = agentAnalysis.analysis?.summary || '분석을 완료했습니다.';

            addMessage(agentId, summary, 'analysis');
            await delay(1000);

            // 주요 발견사항이 있으면 추가 표시
            if (agentAnalysis.analysis?.key_findings?.length > 0) {
              const findings = agentAnalysis.analysis.key_findings.slice(0, 2).join('\n- ');
              addMessage(agentId, `주요 발견사항:\n- ${findings}`, 'recommendation');
              await delay(1500);
            }
          }

          // 전문가 간 토론 시뮬레이션
          await delay(1000);
          addMessage('vehicle_expert', '@이금융 @박리뷰 어떻게 보시나요? 의견 좀 들려주세요', 'question');
          await delay(1500);

          if (data.result.consensus?.agreed_points?.length > 0) {
            const agreement = data.result.consensus.agreed_points[0];
            addMessage('finance_expert', `@김차량 동감합니다! ${agreement}`, 'analysis');
            await delay(1500);
            addMessage('review_expert', '@김차량 @이금융 저도 같은 의견이에요. 사용자 만족도 측면에서도 좋을 것 같습니다.', 'analysis');
          }

          await delay(2000);

          // 최종 결과 발표
          const vehicleCount = data.result.top_vehicles?.length || 0;
          const confidenceScore = data.result.consensus?.confidence_score || 70;

          addMessage('vehicle_expert', `🎉 분석 완료! 총 ${vehicleCount}개의 맞춤 차량을 찾았습니다!`, 'recommendation');
          await delay(1000);
          addMessage('finance_expert', `💰 신뢰도 ${confidenceScore}%의 분석 결과입니다. 예산에 맞는 좋은 매물들이에요!`, 'recommendation');
          await delay(1000);
          addMessage('review_expert', `📝 실제 사용자 리뷰도 반영했습니다. 만족하실 것 같아요!`, 'recommendation');

        } else {
          // 분석 결과가 없는 경우
          await delay(1500);
          addMessage('vehicle_expert', '죄송합니다. 현재 조건에 맞는 매물을 찾기 어렵네요 😅', 'thinking');
          await delay(1000);
          addMessage('finance_expert', '예산 범위를 조금 넓히시거나 조건을 완화해보시는 건 어떨까요?', 'analysis');
          await delay(1000);
          addMessage('review_expert', '다른 검색 조건으로 다시 시도해보시길 추천드려요!', 'recommendation');
        }

        await delay(2000);
        addMessage('system', '🏆 전문가 협업 분석이 완료되었습니다! 결과를 확인해보세요.', 'system');

        // 🧠 Smart Agent Orchestrator 단계 추가
        await delay(2000);
        addMessage('system', '🧠 Smart Agent Orchestrator를 활용한 고도화된 분석을 시작합니다...', 'system');

        try {
          const smartResponse = await fetch('/api/smart-agent-consultation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              multiAgentResult: data.result,
              personaContext,
              userProfile
            }),
          });

          const smartData = await smartResponse.json();
          console.log('🧠 Smart Orchestrator 결과:', smartData);

          if (smartData.success) {
            await delay(1500);
            addMessage('system', '🎯 Sequential Thinking 기반 심층 분석 완료!', 'system');
            await delay(1000);
            addMessage('vehicle_expert', '와, 이제 더 정교한 분석이 가능하네요!', 'analysis');
            await delay(1000);
            addMessage('finance_expert', 'Smart Orchestrator가 우리 의견을 종합해서 더 나은 결론을 도출했어요', 'analysis');
            await delay(1000);
            addMessage('review_expert', '단순한 합의가 아닌 진짜 깊이 있는 분석이군요!', 'analysis');

            // Smart Orchestrator 결과를 최종 결과로 사용
            setTimeout(() => {
              onComplete({
                ...data.result,
                smartOrchestrator: smartData.result
              });
            }, 3000);
          } else {
            // Smart Orchestrator 실패시 기본 결과 사용
            setTimeout(() => {
              onComplete(data.result);
            }, 3000);
          }
        } catch (error) {
          console.error('Smart Orchestrator 오류:', error);
          // 오류시 기본 결과 사용
          setTimeout(() => {
            onComplete(data.result);
          }, 3000);
        }

      } else {
        throw new Error(data.error || '분석 실패');
      }

    } catch (error) {
      console.error('❌ 분석 오류:', error);
      await delay(1000);
      addMessage('system', '⚠️ 데이터 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'system');
      await delay(2000);
      addMessage('vehicle_expert', '서버 연결에 문제가 있는 것 같네요. 다시 시도해보시겠어요?', 'thinking');
    }
  };

  // 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getAgentStyle = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? {
      background: agent.gradient,
      color: 'white',
      boxShadow: `0 2px 8px ${agent.bgColor}`
    } : {
      backgroundColor: '#6b7280',
      color: 'white'
    };
  };

  const formatMessage = (message: string) => {
    const mentionRegex = /@([가-힣]+)/g;
    return message.replace(mentionRegex, '<span class="ultra-text-primary font-bold">@$1</span>');
  };

  return (
    <div className="min-h-screen carfin-gradient-bg">
      <div className="ultra-container ultra-section">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onBack} className="ultra-btn-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>

          <div className="text-center">
            <h1 className="ultra-heading-3">AI 전문가 실시간 협업</h1>
            <p className="ultra-body">3명의 전문가가 실제 데이터를 분석합니다</p>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 ultra-text-primary" />
            <span className="ultra-body-sm">{agents.length}명 참여</span>
          </div>
        </div>

        {/* 디버깅 정보 */}
        {personaContext && (
          <div className="ultra-card mb-4 bg-blue-50">
            <div className="ultra-body-sm">
              <strong>분석 대상:</strong> {personaContext.name || '사용자'} |
              <strong>예산:</strong> {personaContext.budget?.min || 0}만원 ~ {personaContext.budget?.max || 0}만원
            </div>
          </div>
        )}

        {/* 채팅 인터페이스 */}
        <div className="ultra-card max-w-4xl mx-auto">
          <div className="mb-4 border-b border-gray-200 pb-4">
            <div className="flex items-center justify-center gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-1 font-bold text-white shadow-lg hover:scale-105 transition-transform duration-300"
                    style={{ background: agent.gradient }}
                  >
                    {agent.emoji}
                  </div>
                  <div className="ultra-body-sm font-semibold text-slate-800">{agent.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 채팅 메시지 영역 */}
          <div
            ref={chatContainerRef}
            className="h-96 overflow-y-auto space-y-3 mb-4 p-4 bg-gray-50 rounded-lg"
          >
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="ultra-body text-gray-500">전문가들이 대기 중입니다...</p>
                {!isActive && (
                  <Button
                    onClick={startRealAnalysis}
                    className="mt-4 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition-all duration-300"
                    style={{ background: 'var(--carfin-gradient-orchestrator)' }}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    실제 분석 시작하기
                  </Button>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-3 items-start">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={getAgentStyle(msg.agentId)}
                  >
                    {msg.agentEmoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="ultra-body-sm font-bold">{msg.agentName}</span>
                      <span className="ultra-body-sm text-gray-500">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    <div
                      className={`
                        ultra-body p-3 rounded-lg max-w-lg
                        ${msg.type === 'system' ? 'agent-orchestrator-bg text-slate-800 border border-purple-200' : ''}
                        ${msg.type === 'thinking' ? 'agent-vehicle-bg text-slate-800 border border-blue-200' : ''}
                        ${msg.type === 'analysis' ? 'carfin-glass-card' : ''}
                        ${msg.type === 'recommendation' ? 'agent-finance-bg text-slate-800 border border-green-200' : ''}
                        ${msg.type === 'question' ? 'agent-review-bg text-slate-800 border border-orange-200' : ''}
                      `}
                      dangerouslySetInnerHTML={{
                        __html: formatMessage(msg.message).replace(/\n/g, '<br/>')
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 하단 상태 */}
          {isActive && !analysisResult && (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <span className="ultra-body-sm ml-2">실제 데이터 분석 중...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}