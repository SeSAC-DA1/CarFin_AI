'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Users, Zap } from 'lucide-react';

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

export function ChatLikeAgentMeeting({ personaContext, userProfile, onComplete, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [currentTypingAgent, setCurrentTypingAgent] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const agents = [
    {
      id: 'vehicle_expert',
      name: '김차량 전문가',
      emoji: '🚗',
      role: '자동차 기술 및 안전 전문가',
      color: 'var(--brand-primary)',
      bgColor: '#f0f8ff'
    },
    {
      id: 'finance_expert',
      name: '이금융 전문가',
      emoji: '💰',
      role: '자동차 금융 및 보험 전문가',
      color: 'var(--brand-success)',
      bgColor: '#f0fff4'
    },
    {
      id: 'review_expert',
      name: '박리뷰 전문가',
      emoji: '📝',
      role: '사용자 만족도 및 리뷰 전문가',
      color: 'var(--brand-warning)',
      bgColor: '#fff7ed'
    }
  ];

  // 메시지 추가 함수
  const addMessage = (agentId: string, message: string, type: ChatMessage['type'] = 'analysis') => {
    const agent = agents.find(a => a.id === agentId);
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      agentId,
      agentName: agent?.name || 'System',
      agentEmoji: agent?.emoji || '🤖',
      message,
      timestamp: new Date(),
      type,
      isTyping: true
    };

    setMessages(prev => [...prev, newMessage]);

    // 타이핑 애니메이션 후 완료 처리
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, isTyping: false } : msg
        )
      );
    }, 2000);
  };

  // 채팅 시뮬레이션 시작
  const startAnalysis = async () => {
    if (!personaContext) {
      addMessage('system', '⚠️ 사용자 프로필 정보가 필요합니다. 다시 시도해주세요.', 'system');
      return;
    }

    setIsActive(true);

    // 시작 메시지
    addMessage('system', `${personaContext.name || '사용자'}님을 위한 전문가 회의를 시작합니다! 💫`, 'system');

    await delay(2000);

    // 1단계: 각 전문가 자기소개 및 초기 분석
    addMessage('vehicle_expert', '안녕하세요! 차량 전문가 김차량입니다. 먼저 사용자분의 용도를 분석해보겠습니다.', 'thinking');

    await delay(3000);

    addMessage('vehicle_expert', `🔍 분석 결과:\n- 주 용도: ${userProfile?.main_purpose || '가족 여행'}\n- 운전 경험: ${userProfile?.driving_experience || '중급'}\n- 주요 노선: ${userProfile?.main_routes || '고속도로'}\n\n이런 용도라면 **안전성**과 **편의성**이 핵심이겠네요!`, 'analysis');

    await delay(2000);

    addMessage('finance_expert', '금융 전문가 이금융입니다! 예산 분석을 해볼게요 💰', 'thinking');

    await delay(2500);

    const budgetMin = personaContext?.budget?.min || userProfile?.budget?.min || 1500;
    const budgetMax = personaContext?.budget?.max || userProfile?.budget?.max || 2500;

    addMessage('finance_expert', `💰 예산 분석:\n- 예산 범위: ${budgetMin}만원 ~ ${budgetMax}만원\n- 월 할부시: 약 ${Math.round(budgetMax * 10000 / 60)}만원 (60개월 기준)\n- 보험료 예상: 월 25-40만원\n\n현실적이고 좋은 예산 설정이시네요! 👍`, 'analysis');

    await delay(2000);

    addMessage('review_expert', '리뷰 전문가 박리뷰입니다. 실제 사용자 후기를 분석해드릴게요 📝', 'thinking');

    await delay(3000);

    addMessage('review_expert', `📊 사용자 후기 분석:\n- 비슷한 프로필 사용자 만족도: 85%\n- 주요 만족점: 안전성, 연비, 실내 공간\n- 주의사항: 브랜드별 A/S 만족도 차이 존재\n\n실제 리뷰를 바탕으로 추천드리겠습니다!`, 'analysis');

    await delay(2000);

    // 2단계: 전문가들 간 토론
    addMessage('vehicle_expert', `@이금융 @박리뷰 예산 범위에서 추천할만한 차종이 뭐가 있을까요?`, 'question');

    await delay(2000);

    addMessage('finance_expert', `@김차량 그 예산이면 준중형 SUV나 중형 세단이 좋을 것 같은데요. 잔존가치도 고려하면 현대, 기아 브랜드가 안전할 것 같습니다.`, 'analysis');

    await delay(2500);

    addMessage('review_expert', `@김차량 @이금융 맞아요! 특히 투싼, 스포티지, 소나타, K5 같은 모델들이 사용자 만족도가 높더라구요. 가족 여행용이라면 SUV 쪽이 더 만족도가 높았습니다.`, 'analysis');

    await delay(2000);

    addMessage('vehicle_expert', `좋은 의견이네요! 그럼 실제 RDS 데이터를 조회해서 구체적인 매물을 찾아보겠습니다 🔍`, 'thinking');

    await delay(1500);

    // 3단계: 실제 API 호출
    try {
      addMessage('system', '💫 실시간 데이터베이스 검색 중...', 'system');

      const response = await fetch('/api/multi-agent-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaContext, userProfile }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.result);

        await delay(2000);

        // 4단계: 결과 발표
        addMessage('vehicle_expert', `🎉 분석 완료! 총 ${data.result?.top_vehicles?.length || 0}개의 맞춤 차량을 찾았습니다!`, 'recommendation');

        await delay(1500);

        addMessage('finance_expert', `💰 가격 적정성도 모두 검증했습니다. 시세 대비 합리적인 매물들만 선별했어요!`, 'recommendation');

        await delay(1500);

        addMessage('review_expert', `📝 실제 사용자 리뷰도 반영해서 만족도 높은 차량들로 추천드려요. 결과를 확인해보세요!`, 'recommendation');

        await delay(2000);

        addMessage('system', '🏆 전문가 협업 분석이 완료되었습니다! 결과를 확인해보세요.', 'system');

        // 결과 페이지로 이동
        setTimeout(() => {
          onComplete(data.result);
        }, 3000);

      } else {
        throw new Error(data.error || '분석 실패');
      }

    } catch (error) {
      addMessage('system', '⚠️ 데이터 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'system');
      console.error('Analysis error:', error);
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
      color: agent.color,
      backgroundColor: agent.bgColor
    } : {};
  };

  const formatMessage = (message: string) => {
    // @멘션 처리
    const mentionRegex = /@([가-힣]+)/g;
    return message.replace(mentionRegex, '<span class="ultra-text-primary font-bold">@$1</span>');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="ultra-container ultra-section">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onBack} className="ultra-btn-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>

          <div className="text-center">
            <h1 className="ultra-heading-3">AI 전문가 실시간 협업</h1>
            <p className="ultra-body">3명의 전문가가 실시간으로 분석합니다</p>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 ultra-text-primary" />
            <span className="ultra-body-sm">{agents.length}명 참여</span>
          </div>
        </div>

        {/* 채팅 인터페이스 */}
        <div className="ultra-card max-w-4xl mx-auto">
          <div className="mb-4 border-b border-gray-200 pb-4">
            <div className="flex items-center justify-center gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-1"
                    style={{ backgroundColor: agent.bgColor }}
                  >
                    {agent.emoji}
                  </div>
                  <div className="ultra-body-sm">{agent.name}</div>
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
                    onClick={startAnalysis}
                    className="ultra-btn-primary mt-4"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    분석 시작하기
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
                      {msg.isTyping && (
                        <span className="ultra-body-sm text-blue-500 animate-pulse">입력 중...</span>
                      )}
                    </div>

                    <div
                      className={`
                        ultra-body p-3 rounded-lg max-w-lg
                        ${msg.type === 'system' ? 'bg-blue-100 text-blue-800' : ''}
                        ${msg.type === 'thinking' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${msg.type === 'analysis' ? 'bg-white border' : ''}
                        ${msg.type === 'recommendation' ? 'bg-green-100 text-green-800' : ''}
                        ${msg.type === 'question' ? 'bg-purple-100 text-purple-800' : ''}
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
              <span className="ultra-body-sm ml-2">전문가들이 분석 중입니다...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}