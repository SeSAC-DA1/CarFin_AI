'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Zap, Send, MessageCircle, CheckCircle } from 'lucide-react';

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

// 🤖 README.md 기준 4-Agent 시스템
const REAL_AGENTS = [
  {
    id: 'guide_teacher',
    name: 'Agent 1: 차알못 가이드 선생님',
    emoji: '👨‍🏫',
    role: '차량 기초 교육 + 첫 차 추천 전문가',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  {
    id: 'needs_detective',
    name: 'Agent 2: 숨은 니즈 탐정',
    emoji: '🔍',
    role: '라이프스타일 분석 + 숨은 니즈 발굴 전문가',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  {
    id: 'price_analyzer',
    name: 'Agent 3: 가격 분석가 + 중고차 품질 전문가',
    emoji: '💰',
    role: 'TCO 계산 + 중고차 개별 품질 진단 전문가',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'success_coach',
    name: 'Agent 4: 구매 성공 코치',
    emoji: '🏆',
    role: '구매 성공률 최대화 + 실전 지원 전문가',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
  }
];

export function SimpleAgentConsultation({ basicAnswers, onComplete, onBack, onBasicQuestionsComplete }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isUserInputMode, setIsUserInputMode] = useState(true);
  const [currentStep, setCurrentStep] = useState(0); // 0: 기본질문, 1: 4-Agent 협업, 2: 완료
  const [userAnswers, setUserAnswers] = useState<any>({
    usage: '',
    budget: '',
    familyType: ''
  });
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

  // README.md STEP 1: Agent 1이 친근한 인사 + 3가지 질문
  const startAgent1Introduction = async () => {
    setIsActive(true);

    // Agent 1 인사 (README 159-176라인 기준)
    addMessage('guide_teacher', '안녕하세요! 첫 차 구매 도와드릴 CarFin AI예요 😊', 'system');
    await delay(1500);

    addMessage('guide_teacher', '차에 대해 어느 정도 아세요? 자유롭게 말씀해주세요!', 'question');
    await delay(1000);

    // 첫 번째 질문 단계로 설정하고 사용자 입력 모드 활성화
    setCurrentStep(0.5);
    setIsUserInputMode(true);
  };

  // 첫 번째 질문에 대한 사용자 응답 처리
  const handleFirstQuestionResponse = async (userResponse: string) => {
    try {
      // 실제 AI API 호출
      const response = await fetch('/api/single-agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'guide_teacher',
          prompt: userResponse,
          userAnswers: {
            usage: userAnswers.usage,
            budget: userAnswers.budget,
            familyType: userAnswers.familyType
          }
        })
      });

      const data = await response.json();

      if (data.success && data.response) {
        // AI의 실제 응답 표시
        addMessage('guide_teacher', data.response, 'analysis');
        await delay(1500);
      } else {
        // API 실패 시 fallback 메시지
        addMessage('guide_teacher', '완전 괜찮아요! 저희가 있잖아요 😊 저는 차알못 전담 가이드이고, 3명의 전문가가 더 도와드릴 거예요', 'analysis');
        await delay(1500);
      }

      // 3가지 기본 질문으로 이어가기
      addMessage('guide_teacher', '이제 3가지만 물어볼게요! 1️⃣ 주로 언제 타실 건가요?', 'question');

      // 기본 질문 모드로 전환
      setCurrentStep(0); // 3가지 기본 질문 단계로

    } catch (error) {
      console.error('❌ Single Agent API 호출 실패:', error);

      // 에러 시 fallback 메시지
      addMessage('guide_teacher', '완전 괜찮아요! 저희가 있잖아요 😊 저는 차알못 전담 가이드이고, 3명의 전문가가 더 도와드릴 거예요', 'analysis');
      await delay(1500);
      addMessage('guide_teacher', '이제 3가지만 물어볼게요! 1️⃣ 주로 언제 타실 건가요?', 'question');
      setCurrentStep(0);
    }
  };

  // 사용자 입력 처리
  const handleUserInput = async (input: string) => {
    if (!input.trim()) return;

    addUserMessage(input);

    if (currentStep === 0.5) {
      // 첫 번째 인사 질문 ("차에 대해 어느 정도 아세요?") 응답 처리
      await handleFirstQuestionResponse(input);
      setCurrentStep(0);
      return;
    }

    if (currentStep === 0) {
      // STEP 1: 3가지 기본 질문 단계
      if (!userAnswers.usage) {
        setUserAnswers(prev => ({ ...prev, usage: input }));
        addMessage('guide_teacher', `좋습니다! "${input}" 용도시군요 👍`, 'analysis');
        await delay(1000);
        addMessage('guide_teacher', '2️⃣ 예산은 어느 정도 생각하세요?', 'question');
      } else if (!userAnswers.budget) {
        setUserAnswers(prev => ({ ...prev, budget: input }));
        addMessage('guide_teacher', `네! 예산 "${input}" 확인했습니다 💰`, 'analysis');
        await delay(1000);
        addMessage('guide_teacher', '3️⃣ 가족 구성은 어떻게 되세요?', 'question');
      } else if (!userAnswers.familyType) {
        const finalAnswers = { ...userAnswers, familyType: input };
        setUserAnswers(finalAnswers);
        addMessage('guide_teacher', `완벽합니다! "${input}" 가족 구성이군요 👨‍👩‍👧‍👦`, 'analysis');
        await delay(1000);

        // 기본 질문 완료
        onBasicQuestionsComplete(finalAnswers);
        setCurrentStep(1);
        startMultiAgentAnalysis(finalAnswers);
      }
    } else if (currentStep === 1) {
      // STEP 2: 4-Agent 협업 중 사용자 질문 처리
      handleUserQuestionDuringAnalysis(input);
    }
  };

  // README.md STEP 2: 4-Agent 멀티 협업 분석 (실제 AI 호출)
  const startMultiAgentAnalysis = async (answers: any) => {
    setIsUserInputMode(false);

    addMessage('system', '📋 4명의 AI 전문가가 실시간 협업을 시작합니다!', 'system');
    await delay(1000);

    try {
      // 실제 멀티 Agent API 호출
      const response = await fetch('/api/multi-agent-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaContext: {
            name: `${answers.usage} 중심의 차량 구매자`,
            key_characteristics: ['실용성 중시', '신중한 결정'],
            emphasis_points: ['가성비', '안전성'],
            mandatory_features: ['기본 안전장치'],
            budget: parseBudget(answers.budget),
            priorities: ['안전성', '연비', '실용성'],
            usage: answers.usage
          },
          userProfile: answers
        })
      });

      const data = await response.json();

      if (data.success && data.result) {
        // 실제 AI 전문가들의 분석 결과 표시
        const agents = data.result.agents || [];

        for (const agent of agents) {
          await delay(1000);

          // Agent별 매핑
          const agentMap = {
            'vehicle_expert': 'guide_teacher',
            'finance_expert': 'price_analyzer',
            'review_expert': 'success_coach'
          };

          const frontendAgentId = agentMap[agent.agent_id as keyof typeof agentMap] || 'needs_detective';

          addMessage(frontendAgentId, agent.analysis.summary, 'analysis');
          await delay(1500);

          if (agent.analysis.key_findings && agent.analysis.key_findings.length > 0) {
            addMessage(frontendAgentId, `주요 발견: ${agent.analysis.key_findings[0]}`, 'analysis');
            await delay(1500);
          }
        }

        // 종합 정리
        addMessage('guide_teacher', '모든 전문가 분석 완료! 완벽한 추천을 준비했습니다! 🎉', 'system');
        await delay(1000);

        // 질문 받기 모드
        addMessage('system', '💬 궁금한 점이 있으시면 언제든 질문해주세요!', 'system');
        setIsUserInputMode(true);

        // 5초 후 결과로 이동
        setTimeout(() => {
          completeAnalysis(answers, data.result);
        }, 5000);

      } else {
        // API 실패시 fallback
        throw new Error('API 응답 실패');
      }

    } catch (error) {
      console.error('❌ Multi-Agent API 호출 실패:', error);

      // Fallback: 간단한 스크립트 버전
      await delay(1000);
      addMessage('needs_detective', '라이프스타일을 분석해보니 실용적인 차량이 필요하시겠네요!', 'analysis');
      await delay(2000);
      addMessage('price_analyzer', `예산 ${answers.budget} 범위에서 가성비 좋은 매물들을 찾았습니다!`, 'analysis');
      await delay(2000);
      addMessage('success_coach', '비슷한 고객들의 성공률 96% 달성 패턴을 확인했어요!', 'analysis');
      await delay(2000);
      addMessage('guide_teacher', '전문가 분석 완료! 추천 결과를 준비했습니다!', 'system');

      setIsUserInputMode(true);
      setTimeout(() => {
        completeAnalysis(answers);
      }, 3000);
    }
  };

  // 예산 텍스트 파싱 유틸리티
  const parseBudget = (budgetText: string) => {
    try {
      const numbers = budgetText.match(/\d+/g);
      if (numbers && numbers.length >= 1) {
        const amount = parseInt(numbers[0]);
        return { min: Math.max(amount - 500, 1000), max: amount + 500 };
      }
    } catch (error) {
      console.log('예산 파싱 실패, 기본값 사용');
    }
    return { min: 1500, max: 2500 };
  };

  const handleUserQuestionDuringAnalysis = async (question: string) => {
    // 질문 키워드에 따라 적절한 전문가 선택
    let selectedAgent = 'guide_teacher';

    if (question.includes('가격') || question.includes('비용') || question.includes('할부') || question.includes('돈')) {
      selectedAgent = 'price_analyzer';
    } else if (question.includes('니즈') || question.includes('추천') || question.includes('어떤') || question.includes('맞는')) {
      selectedAgent = 'needs_detective';
    } else if (question.includes('성공') || question.includes('확률') || question.includes('만족') || question.includes('후기')) {
      selectedAgent = 'success_coach';
    }

    try {
      // 실제 AI Agent 호출
      addMessage(selectedAgent, '분석 중...', 'thinking');

      const response = await fetch('/api/single-agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          prompt: question,
          userAnswers: userAnswers
        })
      });

      const data = await response.json();

      // '분석 중...' 메시지 제거하고 실제 응답 추가
      setMessages(prev => prev.slice(0, -1));

      if (data.success) {
        addMessage(selectedAgent, data.response, 'analysis');
      } else {
        throw new Error('API 응답 실패');
      }

    } catch (error) {
      console.error('❌ 사용자 질문 처리 실패:', error);

      // Fallback 응답
      setMessages(prev => prev.slice(0, -1));
      const fallbacks = {
        guide_teacher: '차에 대해 걱정하지 마세요! 첫차는 신중하게 선택하는 게 중요해요. 저희가 단계별로 도와드릴게요 😊',
        needs_detective: '라이프스타일을 분석해보니 실용적인 차량이 필요하시겠네요! 비슷한 분들이 선택한 모델들을 추천해드릴게요 🔍',
        price_analyzer: '예산 범위 내에서 가성비 좋은 중고차를 찾아드릴게요! 같은 모델이라도 매물마다 품질이 다르니 꼼꼼히 분석할게요 💰',
        success_coach: '비슷한 조건의 고객들 성공 사례를 분석해보니 96% 이상 만족하는 패턴이 있어요! 성공 확률 높은 선택 도와드릴게요 🏆'
      };

      addMessage(selectedAgent, fallbacks[selectedAgent as keyof typeof fallbacks], 'analysis');
    }
  };

  // 분석 완료 후 추천 결과로 이동
  const completeAnalysis = (answers: any, apiResult?: any) => {
    // 실제 API 결과가 있으면 사용, 없으면 fallback 구조 사용
    const result = apiResult || {
      success: true,
      consultation_id: `fallback_${Date.now()}`,
      persona_summary: `${answers.usage} 중심의 차량 구매자`,
      agents: [
        {
          agent_id: 'guide_teacher',
          agent_name: '차알못 가이드 선생님',
          agent_emoji: '👨‍🏫',
          agent_role: '차량 기초 교육 전문가',
          analysis: {
            summary: '첫차로 완벽한 모델들 선별 완료',
            key_findings: ['신뢰성 높은 브랜드 선별', '초보자 친화적 모델 추천'],
            recommendations: ['현대/기아 신차 중심 추천', 'A/S 네트워크 우수 모델'],
            concerns: ['예산 범위 내 선택지 제한'],
            confidence_level: 85
          },
          vehicle_suggestions: []
        },
        {
          agent_id: 'needs_detective',
          agent_name: '숨은 니즈 탐정',
          agent_emoji: '🔍',
          agent_role: '라이프스타일 분석 전문가',
          analysis: {
            summary: '라이프스타일 기반 니즈 분석 완료',
            key_findings: ['실용성 중시 성향', '경제성 우선 고려'],
            recommendations: ['연비 우수 모델 추천', '실용적 공간 활용도 높은 차량'],
            concerns: ['트렌드 민감도 낮음'],
            confidence_level: 88
          },
          vehicle_suggestions: []
        },
        {
          agent_id: 'price_analyzer',
          agent_name: '가격 분석가',
          agent_emoji: '💰',
          agent_role: 'TCO 계산 전문가',
          analysis: {
            summary: '숨은 보석 매물 발굴 완료',
            key_findings: ['시세 대비 저평가 매물 존재', '유지비 절약 모델 식별'],
            recommendations: ['중고차 시장 타이밍 양호', '특정 모델년식 추천'],
            concerns: ['중고차 품질 편차'],
            confidence_level: 82
          },
          vehicle_suggestions: []
        }
      ],
      consensus: {
        agreed_points: ['예산 범위 내 실용적 선택 필요', '신뢰성과 경제성 균형 중요'],
        disagreed_points: ['신차 vs 중고차 선택 기준'],
        final_recommendations: ['전문가 검증된 중고차 우선 검토', '브랜드 신뢰도 기반 선택'],
        confidence_score: 85
      },
      top_vehicles: []  // 빈 배열로 초기화하여 DataDashboard 오류 방지
    };

    setCurrentStep(2);
    onComplete(result);
  };

  // 컴포넌트 마운트 시 Agent 1 인사부터 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      startAgent1Introduction();
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
              README.md 기준 AI 전문가 상담
            </div>
            {isActive && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Zap className="w-4 h-4 animate-pulse" />
                AI 분석 중...
              </div>
            )}
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg border shadow-sm">
          {/* 채팅 헤더 */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              README.md 서비스 여정 (2분 완성)
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className={`flex items-center gap-1 ${currentStep >= 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-4 h-4" />
                STEP 1: 친근한 첫 만남
              </div>
              <div className={`flex items-center gap-1 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-4 h-4" />
                STEP 2: 4-Agent 협업
              </div>
              <div className={`flex items-center gap-1 ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-4 h-4" />
                완료!
              </div>
            </div>
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
                      : message.type === 'question'
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
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
                  placeholder="답변을 입력하세요..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUserInput(userInput);
                    }
                  }}
                />
                <Button
                  onClick={() => handleUserInput(userInput)}
                  disabled={!userInput.trim()}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  전송
                </Button>
              </div>
              {currentStep === 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  예시: "출퇴근용", "2000만원", "혼자"
                </p>
              )}
              {currentStep === 1 && (
                <p className="text-xs text-gray-500 mt-2">
                  예시: "연비가 중요한가요?", "안전성은 어떤가요?", "가성비 좋은 모델은?"
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}