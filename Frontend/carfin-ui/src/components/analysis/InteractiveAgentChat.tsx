'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Zap, Send, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  message: string;
  timestamp: Date;
  type: 'thinking' | 'analysis' | 'recommendation' | 'question' | 'system' | 'user' | 'user_input';
  isTyping?: boolean;
}

interface Props {
  basicAnswers: any;
  onComplete: (result: any) => void;
  onBack: () => void;
  onBasicQuestionsComplete: (answers: any) => void;
}

// 🤖 실제 4-Agent 시스템 정의 (README.md 기준)
const REAL_AGENTS = [
  {
    id: 'guide_teacher',
    name: 'Agent 1: 차알못 가이드 선생님',
    emoji: '👨‍🏫',
    role: '차량 기초 교육 + 첫 차 추천 전문가',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    systemPrompt: `당신은 차량에 대해 전혀 모르는 사용자를 위한 친절한 가이드 선생님입니다.

    핵심 역할:
    - 차량 기초 용어를 쉽게 설명 ("준중형이 뭐에요?" 같은 질문에 친절하게 답변)
    - 첫차로 적합한 모델 추천 (신뢰성, A/S, 보험료 고려)
    - 중고차 구매 시 주의사항 안내
    - 차알못도 이해할 수 있는 단계별 학습 가이드 제공

    말하는 방식:
    - 친근하고 인내심 많은 선생님 스타일
    - "괜찮아요! 차 모르는 게 당연해요. 차근차근 설명해드릴게요 😊"
    - 중고차 특성을 강조: "중고차는 같은 모델이라도 관리 상태가 다르니까 더 신중해야 해요!"

    응답은 한국어로 하되, 100자 이내로 간결하게 작성하세요.`
  },
  {
    id: 'needs_detective',
    name: 'Agent 2: 숨은 니즈 탐정',
    emoji: '🔍',
    role: '라이프스타일 분석 + 숨은 니즈 발굴 전문가',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    systemPrompt: `당신은 사용자의 라이프스타일을 분석해서 본인도 모르는 진짜 니즈를 발굴하는 예리한 탐정입니다.

    핵심 역할:
    - 사용자 라이프스타일 분석으로 숨은 니즈 발굴
    - 골프족, 차박족, 대가족 등 니치 특성 파악
    - 협업 필터링 활용: "비슷한 분들이 실제로 선택한 모델들"
    - "당신도 몰랐던 진짜 필요한 기능" 제안

    협업 필터링 활용 예시:
    - "47세 골프 좋아하시는 분들이 실제로 많이 선택한 모델들이에요!"
    - "비슷한 분들 데이터를 보니 이런 차들을 선호하시더라고요 🔍"

    말하는 방식:
    - 예리하고 통찰력 있는 탐정 스타일
    - 구체적인 데이터와 근거 제시

    응답은 한국어로 하되, 120자 이내로 간결하게 작성하세요.`
  },
  {
    id: 'price_analyzer',
    name: 'Agent 3: 가격 분석가 + 중고차 품질 전문가',
    emoji: '💰',
    role: 'TCO 계산 + 중고차 개별 품질 진단 전문가',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    systemPrompt: `당신은 가격 분석과 중고차 개별 품질 진단을 담당하는 꼼꼼한 회계사입니다.

    핵심 역할:
    - TCO (총 소유비용) 상세 계산
    - 중고차 개별 매물 품질 점수 산출
    - 시세 대비 가성비 분석
    - 3년 후 잔가 예측으로 실제 부담액 계산
    - "숨은 보석" 매물 발굴

    중고차 특화 분석 예시:
    - "같은 2019년 아반떼라도 이 매물은 특별해요!"
    - "무사고에 정기점검도 충실하고, 시세보다 300만원 저렴한 숨은 보석이에요 💎"

    말하는 방식:
    - 꼼꼼하고 정확한 회계사 스타일
    - 구체적인 숫자와 계산 근거 제시

    응답은 한국어로 하되, 120자 이내로 간결하게 작성하세요.`
  },
  {
    id: 'success_coach',
    name: 'Agent 4: 구매 성공 코치',
    emoji: '🏆',
    role: '구매 성공률 최대화 + 실전 지원 전문가',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    systemPrompt: `당신은 구매 성공률을 최대화하고 실전 지원을 담당하는 열정적인 코치입니다.

    핵심 역할:
    - 유사 고객 구매 성공 사례 분석
    - 구매 확률 기반 최종 추천
    - 중고차 현장 체크리스트 제공
    - 딜러 협상 전략 및 사후 관리

    실전 지원 예시:
    - "비슷한 또래 첫차 구매자 847명 중 812명이 이런 매물로 성공했어요!"
    - "중고차니까 현장에서 이것들만 체크하시면 완벽해요 📋"

    말하는 방식:
    - 열정적이고 결과 중심적인 코치 스타일
    - 성공률, 만족도 등 구체적 수치 제시

    응답은 한국어로 하되, 120자 이내로 간결하게 작성하세요.`
  }
];

export function InteractiveAgentChat({ personaContext, userProfile, onComplete, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [userInput, setUserInput] = useState('');
  const [isUserInputMode, setIsUserInputMode] = useState(false);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 실제 Gemini API 호출 함수
  const callGeminiAgent = async (agentId: string, prompt: string, userContext: any) => {
    try {
      const agent = REAL_AGENTS.find(a => a.id === agentId);
      if (!agent) throw new Error(`Agent ${agentId} not found`);

      const response = await fetch('/api/multi-agent-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          systemPrompt: agent.systemPrompt,
          userPrompt: prompt,
          personaContext,
          userProfile,
          userContext
        })
      });

      if (!response.ok) throw new Error('Failed to call agent API');

      const data = await response.json();
      return data.response || "분석 중이에요...";
    } catch (error) {
      console.error(`Agent ${agentId} API call failed:`, error);
      return `${agentId} 분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.`;
    }
  };

  // 메시지 추가 함수
  const addMessage = (agentId: string, message: string, type: ChatMessage['type'] = 'analysis') => {
    const agent = REAL_AGENTS.find(a => a.id === agentId) || { name: 'System', emoji: '🤖' };
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

  // 사용자 메시지 추가
  const addUserMessage = (message: string) => {
    addMessage('user', message, 'user_input');
    setUserInput('');
  };

  // 실제 Multi-Agent 협업 분석 시작
  const startRealMultiAgentAnalysis = async () => {
    if (!personaContext?.name || !personaContext?.budget) {
      addMessage('system', '⚠️ 사용자 프로필 정보가 부족합니다. 이전 단계로 돌아가서 다시 진행해주세요.', 'system');
      return;
    }

    setIsActive(true);

    // 🎬 4-Agent 회의 시작
    addMessage('system', `📋 4명의 AI 전문가가 ${personaContext.name}님의 완벽한 첫차를 위해 실시간 협업을 시작합니다!`, 'system');
    await delay(1000);

    addMessage('system', '💡 차알못 TIP: 4명이 각자 전문 분야에서 실제 AI 분석으로 완벽한 추천을 만들어드려요!', 'system');
    await delay(1500);

    // 1단계: Agent 1이 친근하게 시작 (실제 AI 호출)
    const userContextForAI = {
      personaName: personaContext.name,
      budget: `${personaContext.budget.min}-${personaContext.budget.max}만원`,
      priorities: personaContext.priorities,
      usage: personaContext.usage
    };

    try {
      addMessage('guide_teacher', '분석 중이에요...', 'thinking');

      const agent1Response = await callGeminiAgent(
        'guide_teacher',
        `사용자 정보: ${JSON.stringify(userContextForAI)}. 첫차 구매자에게 친근하게 인사하고 기본 조건을 정리해주세요.`,
        userContextForAI
      );

      // 이전 "분석 중" 메시지 제거하고 실제 응답 추가
      setMessages(prev => prev.slice(0, -1));
      addMessage('guide_teacher', agent1Response, 'analysis');
      await delay(2000);

      // 2단계: Agent 2가 니즈 분석 (실제 AI 호출)
      addMessage('needs_detective', '라이프스타일 분석 중...', 'thinking');

      const agent2Response = await callGeminiAgent(
        'needs_detective',
        `사용자 정보: ${JSON.stringify(userContextForAI)}. 이 사용자의 숨은 니즈를 분석하고 비슷한 고객 데이터를 언급해주세요.`,
        userContextForAI
      );

      setMessages(prev => prev.slice(0, -1));
      addMessage('needs_detective', agent2Response, 'analysis');
      await delay(2000);

      // 3단계: 사용자 질문 받기 모드 활성화
      addMessage('system', '💬 궁금한 점이 있으시면 언제든 질문해주세요! (예: "연비가 중요한가요?", "안전성은 어떤가요?")', 'system');
      setIsUserInputMode(true);

      // 4단계: Agent 3과 4가 병렬로 분석
      setTimeout(async () => {
        const [agent3Response, agent4Response] = await Promise.all([
          callGeminiAgent(
            'price_analyzer',
            `사용자 정보: ${JSON.stringify(userContextForAI)}. 예산 기준으로 TCO 분석하고 숨은 보석 매물 개념을 설명해주세요.`,
            userContextForAI
          ),
          callGeminiAgent(
            'success_coach',
            `사용자 정보: ${JSON.stringify(userContextForAI)}. 비슷한 고객의 구매 성공률 데이터를 제시하고 격려해주세요.`,
            userContextForAI
          )
        ]);

        addMessage('price_analyzer', agent3Response, 'analysis');
        await delay(1500);
        addMessage('success_coach', agent4Response, 'recommendation');

        // 분석 완료
        setCurrentAnalysisStep(1);

        setTimeout(() => {
          addMessage('system', '🎉 4-Agent 실시간 협업 분석 완료! 맞춤 추천 결과를 확인하세요!', 'system');
          // 실제 분석 결과 생성
          const finalResult = {
            success: true,
            consultation_id: Date.now().toString(),
            agents_analysis: {
              guide_teacher: agent1Response,
              needs_detective: agent2Response,
              price_analyzer: agent3Response,
              success_coach: agent4Response
            },
            persona_context: personaContext,
            user_profile: userProfile
          };
          setAnalysisResult(finalResult);
          onComplete(finalResult);
        }, 3000);
      }, 5000);

    } catch (error) {
      console.error('Multi-Agent analysis failed:', error);
      addMessage('system', '❌ AI 분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.', 'system');
    }
  };

  // 사용자 질문 처리 (실제 AI 응답)
  const handleUserQuestion = async (question: string) => {
    if (!question.trim()) return;

    addUserMessage(question);

    // 가장 적절한 Agent가 응답하도록 라우팅
    const questionLower = question.toLowerCase();
    let selectedAgent = 'guide_teacher'; // 기본값

    if (questionLower.includes('가격') || questionLower.includes('돈') || questionLower.includes('비용') || questionLower.includes('연비')) {
      selectedAgent = 'price_analyzer';
    } else if (questionLower.includes('추천') || questionLower.includes('어떤') || questionLower.includes('니즈')) {
      selectedAgent = 'needs_detective';
    } else if (questionLower.includes('성공') || questionLower.includes('확률') || questionLower.includes('만족')) {
      selectedAgent = 'success_coach';
    }

    try {
      addMessage(selectedAgent, '질문 분석 중...', 'thinking');

      const response = await callGeminiAgent(
        selectedAgent,
        `사용자 질문: "${question}". 이 질문에 대해 당신의 전문 분야 관점에서 답변해주세요. 사용자 컨텍스트: ${JSON.stringify(personaContext)}`,
        { userQuestion: question, personaContext }
      );

      setMessages(prev => prev.slice(0, -1));
      addMessage(selectedAgent, response, 'analysis');
    } catch (error) {
      setMessages(prev => prev.slice(0, -1));
      addMessage(selectedAgent, '죄송해요, 일시적인 오류가 발생했습니다. 다시 질문해주세요.', 'analysis');
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 컴포넌트 마운트 시 자동 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      startRealMultiAgentAnalysis();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            이전으로
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Users className="w-5 h-5 text-blue-600" />
              실시간 4-Agent 협업 분석
            </div>
            {isActive && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Zap className="w-4 h-4 animate-pulse" />
                AI 분석 중...
              </div>
            )}
          </div>
          <div className="w-20" /> {/* 균형을 위한 스페이서 */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 왼쪽: Agent 프로필 카드들 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                AI 전문가 팀
              </h3>
              <div className="space-y-3">
                {REAL_AGENTS.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-all"
                    style={{ borderLeftColor: agent.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{agent.emoji}</span>
                      <div>
                        <div className="font-medium text-sm text-gray-900 leading-tight">
                          {agent.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed">
                      {agent.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 가운데: 실시간 채팅 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border shadow-sm">
              {/* 채팅 헤더 */}
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  실시간 AI 전문가 회의실
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  4명의 AI가 실시간으로 협업하며 분석합니다
                </p>
              </div>

              {/* 채팅 메시지 */}
              <div
                ref={chatContainerRef}
                className="h-[500px] overflow-y-auto p-4 space-y-4"
              >
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{message.agentEmoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {message.agentName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`p-3 rounded-lg text-sm leading-relaxed ${
                        message.type === 'system'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : message.type === 'user_input'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-gray-50 text-gray-800'
                      }`}>
                        {message.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 사용자 입력 */}
              {isUserInputMode && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex gap-2">
                    <Input
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="AI 전문가들에게 궁금한 점을 질문해보세요..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUserQuestion(userInput);
                        }
                      }}
                    />
                    <Button
                      onClick={() => handleUserQuestion(userInput)}
                      disabled={!userInput.trim()}
                      className="flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      질문
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    예시: "연비가 중요한가요?", "안전성은 어떤가요?", "가성비 좋은 모델은?"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 실시간 분석 현황 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">분석 현황</h3>
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">진행률</span>
                      <span className="text-sm text-gray-500">
                        {currentAnalysisStep === 0 ? '25%' : '100%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: currentAnalysisStep === 0 ? '25%' : '100%' }}
                      />
                    </div>
                  </div>

                  {personaContext && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">분석 대상</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>페르소나: {personaContext.name}</div>
                        <div>예산: {personaContext.budget?.min}-{personaContext.budget?.max}만원</div>
                        <div>우선순위: {personaContext.priorities?.slice(0, 2).join(', ')}</div>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">실시간 기능</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        실제 AI API 연동
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        사용자 질문 응답
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        111,841건 실제 매물 연동
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}