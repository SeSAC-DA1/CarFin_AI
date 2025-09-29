'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Users, RotateCcw } from 'lucide-react';
import A2AVisualization from '@/components/ui/A2AVisualization';
import HorizontalVehicleCard from '@/components/ui/HorizontalVehicleCard';
import AgentInsightCard from '@/components/ui/AgentInsightCard';
import VehicleRecommendationSummary from '@/components/ui/VehicleRecommendationSummary';
import NthQuestionWelcomeBanner from '@/components/welcome/NthQuestionWelcomeBanner';
import QuestionProgressBar from '@/components/welcome/QuestionProgressBar';
import CarFinWaitingUI from '@/components/ui/CarFinWaitingUI';
import { DemoPersona } from '@/lib/collaboration/PersonaDefinitions';

interface Message {
  id: string;
  agent: 'user' | 'concierge' | 'needs_analyst' | 'data_analyst' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  messageType?: 'response' | 'question' | 'answer' | 'pattern_detected' | 'user_intervention' | 'system_info' | 'vehicle_recommendations';
  metadata?: {
    pattern?: any;
    targetAgent?: string;
    questionId?: string;
    interventionType?: string;
    vehicles?: any[];
    persona?: string;
    [key: string]: any;
  };
  isStreaming?: boolean;
  streamedContent?: string;
}

interface AnalysisStatus {
  questionAnalysis: 'pending' | 'in_progress' | 'completed';
  needsAnalysis: 'pending' | 'in_progress' | 'completed';
  dataSearch: 'pending' | 'in_progress' | 'completed';
  collaboration: 'pending' | 'in_progress' | 'completed';
}

interface ChatRoomProps {
  initialQuestion: string;
  onBack: () => void;
  selectedPersona?: DemoPersona | null;
}

export default function ChatRoom({ initialQuestion, onBack, selectedPersona }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    questionAnalysis: 'pending',
    needsAnalysis: 'pending',
    dataSearch: 'pending',
    collaboration: 'pending'
  });
  const [dbStats, setDbStats] = useState({ totalVehicles: 0, searchedVehicles: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [autoScroll, setAutoScroll] = useState(true); // 자동 스크롤 제어
  const [lastVehicleRecommendations, setLastVehicleRecommendations] = useState<any[]>([]); // 이전 추천 차량들
  const [showThinkingProcess, setShowThinkingProcess] = useState(false); // GPT Thinking Toggle
  const [analysisComplete, setAnalysisComplete] = useState(false); // 분석 완료 상태
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false); // 상세 분석 표시
  // 로딩 메시지 다양화 함수
  const getLoadingMessages = () => {
    const mainMessages = [
      "전문가들이 머리를 맞대고 있어요... 🤝",
      "117,564대 매물을 꼼꼼히 분석 중... 🔍",
      "니즈 분석가가 열심히 고민하고 있어요... 💭",
      "데이터 분석가가 계산기를 두드리고 있어요... 📊",
      "컨시어지가 완벽한 답을 준비 중... 🎯",
      "AI 전문가팀이 총력 분석 중... 🚀",
      "최적의 매물을 찾기 위해 노력 중... 💎"
    ];

    const subMessages = [
      "실시간 데이터를 기반으로 최적의 답변을 준비하고 있어요 😊",
      "당신만을 위한 특별한 추천을 준비하고 있어요 ✨",
      "숨겨진 보석 같은 매물을 찾고 있어요 💎",
      "완벽한 매칭을 위해 세심하게 분석 중이에요 🎯",
      "최고의 가성비 차량을 선별하고 있어요 🏆",
      "전문가들이 당신의 니즈를 완벽히 파악 중... 🔬",
      "117,564대 중에서 최고만 골라드릴게요 🌟"
    ];

    const randomMain = mainMessages[Math.floor(Math.random() * mainMessages.length)];
    const randomSub = subMessages[Math.floor(Math.random() * subMessages.length)];

    return { main: randomMain, sub: randomSub };
  };

  const [questionCount, setQuestionCount] = useState(0);
  const [loadingMessages] = useState(() => getLoadingMessages()); // 로딩 메시지 고정
  const [welcomeSystemInitialized, setWelcomeSystemInitialized] = useState(false);
  const [detectedPersonaForWelcome, setDetectedPersonaForWelcome] = useState<string | undefined>();
  const [budgetForWelcome, setBudgetForWelcome] = useState<{ min: number; max: number } | undefined>();

  // 🔄 A2A 세션 관리 상태
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [sessionStats, setSessionStats] = useState<any>(null);

  // 🔧 사용자 ID 초기화 및 이전 대화 복원
  useEffect(() => {
    const initializeUserSession = async () => {
      let storedUserId = sessionStorage.getItem('carfin_userId');

      if (!storedUserId) {
        storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('carfin_userId', storedUserId);
      }

      setUserId(storedUserId);

      // 기존 세션 ID 확인
      const storedSessionId = sessionStorage.getItem('carfin_sessionId');
      if (storedSessionId) {
        setCurrentSessionId(storedSessionId);
        // 이전 대화 복원 시도
        await restoreConversationHistory(storedUserId);
      }
    };

    initializeUserSession();
  }, []);

  // 📝 대화 저장 함수
  const saveConversation = async (newMessages: Message[]) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/conversation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, messages: newMessages })
      });

      if (response.ok) {
        console.log(`💾 대화 저장 완료: ${newMessages.length}개 메시지`);
      }
    } catch (error) {
      console.error('❌ 대화 저장 실패:', error);
    }
  };

  // 🔄 이전 대화 복원 함수
  const restoreConversationHistory = async (userIdToRestore: string) => {
    try {
      const response = await fetch(`/api/conversation/get?userId=${userIdToRestore}`);

      if (response.ok) {
        const savedMessages = await response.json();
        if (savedMessages && savedMessages.length > 0) {
          setConversationHistory(savedMessages);
          console.log(`🔄 이전 대화 복원: ${savedMessages.length}개 메시지`);

          // 질문 수 계산
          const userQuestions = savedMessages.filter((msg: Message) => msg.agent === 'user').length;
          setQuestionCount(userQuestions);
        }
      }
    } catch (error) {
      console.error('❌ 대화 복원 실패:', error);
    }
  };

  // 🗑️ 대화 기록 삭제 함수
  const clearConversationHistory = async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/conversation/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        setConversationHistory([]);
        setMessages([]);
        setQuestionCount(0);
        setCurrentSessionId(null);
        sessionStorage.removeItem('carfin_sessionId');
        console.log('🗑️ 대화 기록 삭제 완료');
      }
    } catch (error) {
      console.error('❌ 대화 기록 삭제 실패:', error);
    }
  };

  // 📝 메시지 업데이트 시 자동 저장
  useEffect(() => {
    if (messages.length > 0 && userId) {
      saveConversation(messages);
    }
  }, [messages, userId]);

  // 🆔 세션 ID 저장
  useEffect(() => {
    if (currentSessionId) {
      sessionStorage.setItem('carfin_sessionId', currentSessionId);
    }
  }, [currentSessionId]);

  // 분석 완료 상태 감지
  useEffect(() => {
    const hasVehicleRecommendations = messages.some(msg => msg.messageType === 'vehicle_recommendations');
    if (hasVehicleRecommendations && !analysisComplete) {
      setAnalysisComplete(true);
    }
  }, [messages, analysisComplete]);

  // N번째 질문 환영 메시지 함수
  const getWelcomeMessage = (count: number) => {
    const messages = [
      "🎉 첫 질문이네요! 편하게 말씀해주세요",
      "🤔 더 궁금한 게 있으시군요! 좋아요",
      "😊 꼼꼼하시네요! 정확한 분석 가능해요",
      "👏 정말 신중하십니다! 완벽한 매칭 예상",
      "🌟 VIP 고객님이시네요! 프리미엄 서비스",
      "💎 전문가다운 접근! 최고 품질 분석",
      "🎯 완벽주의자시네요! 100% 만족 보장",
      "🚀 탐구정신 대단! 숨은 보석 찾아드릴게요",
      "🔥 열정적이시네요! 특별 매물 준비 중",
      "⭐ 레전드 고객! 모든 전문가 총동원"
    ];

    if (count <= messages.length) {
      return messages[count - 1];
    }
    return `🎊 ${count}번째 질문! 당신은 진정한 자동차 전문가!`;
  }; // N번째 질문 카운터

  // 스마트 자동 스크롤 (사용자가 위로 스크롤했으면 자동 스크롤 중지)
  const scrollToBottom = () => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 스크롤 위치 감지
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px 여유
      setAutoScroll(isNearBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, autoScroll]);

  // 초기 메시지 설정 및 실제 AI 분석 시작
  useEffect(() => {
    if (initialized.current) {
      console.log('ChatRoom already initialized, skipping...');
      return;
    }
    initialized.current = true;

    console.log('Starting real AI analysis with question:', initialQuestion);

    // 사용자의 첫 질문 추가
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      agent: 'user',
      content: initialQuestion,
      timestamp: new Date(),
    };

    setMessages([userMessage]);
    setQuestionCount(1); // 첫 번째 질문

    // AI 분석 즉시 시작
    startRealAIAnalysis(initialQuestion);

    // Cleanup function
    return () => {
      console.log('Cleaning up ChatRoom');
    };
  }, []); // 빈 의존성 배열로 변경하여 마운트 시에만 실행

  // 자연스러운 타이핑 효과를 위한 스트림 메시지 추가 함수
  const addStreamingMessage = (messageData: any, delay: number = 0) => {
    setTimeout(() => {
      const message: Message = {
        id: `${messageData.agent}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agent: messageData.agent,
        content: '',
        timestamp: new Date(messageData.timestamp),
        messageType: messageData.messageType,
        metadata: messageData.metadata,
        isStreaming: true,
        streamedContent: messageData.content
      };

      setMessages(prev => [...prev, message]);

      // 타이핑 효과로 메시지 내용 점진적 표시
      const content = messageData.content;
      let currentIndex = 0;

      const typeInterval = setInterval(() => {
        if (currentIndex <= content.length) {
          setMessages(prev => prev.map(msg =>
            msg.id === message.id
              ? { ...msg, content: content.substring(0, currentIndex), isStreaming: currentIndex < content.length }
              : msg
          ));
          currentIndex += Math.random() > 0.7 ? 2 : 1; // 가끔 빠르게
        } else {
          clearInterval(typeInterval);
        }
      }, Math.random() * 50 + 30); // 30-80ms 간격으로 자연스럽게
    }, delay);
  };

  // WebSocket 실시간 스트리밍 AI 분석
  const startRealAIAnalysis = async (question: string) => {
    // 이미 로딩 중이면 중복 실행 방지
    if (isLoading) {
      console.log('⚠️ Analysis already in progress, skipping...');
      return;
    }

    setIsLoading(true);
    setAnalysisStatus(prev => ({ ...prev, questionAnalysis: 'in_progress' }));
    setAnalysisComplete(false); // 새로운 분석 시작 시 완료 상태 리셋

    try {
      console.log('🚀 Starting WebSocket streaming analysis...');

      // 고유 세션 ID로 중복 방지
      const sessionId = Date.now().toString();

      // 이전 추천 차량 데이터를 URL 파라미터에 포함
      const previousVehiclesParam = lastVehicleRecommendations.length > 0
        ? `&previousVehicles=${encodeURIComponent(JSON.stringify(lastVehicleRecommendations))}`
        : '';

      const eventSource = new EventSource(
        `/api/chat/ws?question=${encodeURIComponent(question)}&context=real_ai_analysis&session=${sessionId}${previousVehiclesParam}`
      );

      let currentAgentMessages: { [key: string]: Message } = {};
      let messageDelay = 0;
      let messageCounter = 0; // 중복 방지용 카운터
      const processedEvents = new Set(); // 중복 이벤트 방지

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 중복 이벤트 방지 (동일한 타임스탬프 + 타입 + agentId)
          const eventKey = `${data.type}-${data.agent}-${data.timestamp}`;
          if (processedEvents.has(eventKey)) {
            console.log(`⚠️ Duplicate event blocked: ${eventKey}`);
            return;
          }
          processedEvents.add(eventKey);

          switch (data.type) {
            case 'metadata':
              console.log(`💰 Budget: ${data.budget.min}-${data.budget.max}만원`);
              console.log(`🚗 Found ${data.vehiclesFound} vehicles`);
              setDbStats({ totalVehicles: data.vehiclesFound, searchedVehicles: data.vehiclesFound });
              setAnalysisStatus(prev => ({ ...prev, questionAnalysis: 'completed', dataSearch: 'in_progress' }));

              // 🆔 A2A 세션 ID 추출 및 저장
              if (data.metadata?.sessionId && !currentSessionId) {
                setCurrentSessionId(data.metadata.sessionId);
                console.log(`🤖 A2A 세션 ID 설정: ${data.metadata.sessionId}`);
              }

              // 환영 시스템을 위한 정보 설정
              if (!welcomeSystemInitialized) {
                setBudgetForWelcome(data.budget);
                if (data.detectedPersona?.id) {
                  setDetectedPersonaForWelcome(data.detectedPersona.id);
                }
                setWelcomeSystemInitialized(true);
              }

              if (data.collaborationType === 'dynamic') {
                console.log('🎯 동적 협업 모드 활성화');
              }
              break;

            case 'pattern_detected':
              console.log(`🎯 Pattern: ${data.metadata?.pattern?.type}`);
              const naturalMessage = getPatternMessage(data.metadata?.pattern?.type, data.metadata?.pattern?.persona);
              setAnalysisStatus(prev => ({ ...prev, needsAnalysis: 'in_progress' }));
              addStreamingMessage({
                agent: 'system',
                content: naturalMessage,
                timestamp: data.timestamp,
                messageType: 'pattern_detected',
                metadata: data.metadata
              }, messageCounter * 1500); // 순서대로 간격 조정
              messageCounter++;
              break;

            case 'agent_response':
              setAnalysisStatus(prev => ({ ...prev, collaboration: 'in_progress' }));
              addStreamingMessage({
                agent: data.agent,
                content: data.content,
                timestamp: data.timestamp,
                messageType: 'response',
                metadata: data.metadata
              }, messageCounter * 2000); // 순서대로 2초 간격
              messageCounter++;
              break;

            case 'agent_question':
              console.log(`❓ Question from ${data.agent} to ${data.metadata?.targetAgent}`);
              addStreamingMessage({
                agent: data.agent,
                content: `${data.agent === 'concierge' ? '🎯' : data.agent === 'needs_analyst' ? '🔍' : '📊'} ${data.content}`,
                timestamp: data.timestamp,
                messageType: 'question',
                metadata: data.metadata
              }, messageCounter * 1500); // 순서대로 1.5초 간격
              messageCounter++;
              break;

            case 'agent_answer':
              console.log(`💬 Answer from ${data.agent}`);
              addStreamingMessage({
                agent: data.agent,
                content: data.content,
                timestamp: data.timestamp,
                messageType: 'answer',
                metadata: data.metadata
              }, messageCounter * 1800); // 순서대로 1.8초 간격
              messageCounter++;
              break;

            case 'user_intervention_needed':
              console.log(`🛑 User intervention needed: ${data.metadata?.interventionType}`);
              const interventionMessage: Message = {
                id: `intervention-${Date.now()}`,
                agent: 'system',
                content: `⚠️ ${data.content}`,
                timestamp: new Date(data.timestamp),
                messageType: 'user_intervention',
                metadata: data.metadata
              };
              setMessages(prev => [...prev, interventionMessage]);
              break;

            case 'consensus_reached':
              console.log('🤝 Consensus reached');
              const consensusMessage: Message = {
                id: `consensus-${Date.now()}`,
                agent: 'system',
                content: `✅ ${data.content}`,
                timestamp: new Date(data.timestamp),
                messageType: 'system_info',
                metadata: data.metadata
              };
              setMessages(prev => [...prev, consensusMessage]);
              break;

            case 'vehicle_recommendations':
              console.log('🚗 Vehicle recommendations received', data);
              console.log('🚗 Metadata:', data.metadata);
              console.log('🚗 Vehicles:', data.metadata?.vehicles);

              // 차량 추천 데이터를 상태에 저장
              if (data.metadata?.vehicles && Array.isArray(data.metadata.vehicles)) {
                setLastVehicleRecommendations(data.metadata.vehicles);
                console.log('✅ Vehicle recommendations set to state:', data.metadata.vehicles.length, 'vehicles');
              }

              addStreamingMessage({
                agent: data.agent,
                content: data.content,
                timestamp: data.timestamp,
                messageType: 'vehicle_recommendations',
                metadata: data.metadata
              }, messageCounter * 2000); // 순서대로 배치
              messageCounter++;
              break;

            case 'collaboration_complete':
              console.log('🎉 Dynamic A2A 협업 완료!');
              const completeContent = data.metadata?.persona ?
                `🎉 ${data.metadata.persona}님 상황에 맞는 전문가 협업이 완료되었습니다! 위 분석 결과를 참고해보세요.` :
                `🎉 3명의 전문가 협업 분석이 완료되었습니다! 위 분석 결과를 참고해보세요.`;

              setAnalysisStatus({
                questionAnalysis: 'completed',
                needsAnalysis: 'completed',
                dataSearch: 'completed',
                collaboration: 'completed'
              });

              // 분석 완료 상태로 설정하여 차량 추천 UI 표시
              setAnalysisComplete(true);

              addStreamingMessage({
                agent: 'system',
                content: completeContent,
                timestamp: data.timestamp,
                messageType: 'system_info',
                metadata: data.metadata
              }, messageCounter * 2000); // 순서대로 배치

              setTimeout(() => {
                eventSource.close();
                setIsLoading(false);
              }, (messageCounter + 1) * 2000 + 1000); // 마지막 메시지 후 1초 대기
              break;

            case 'error':
              console.error('❌ Dynamic Collaboration error:', data.error);
              const errorMessage: Message = {
                id: `error-${Date.now()}`,
                agent: 'system',
                content: `❌ 오류: ${data.error || data.content}`,
                timestamp: new Date(data.timestamp),
                messageType: 'system_info'
              };
              setMessages(prev => [...prev, errorMessage]);
              eventSource.close();
              setIsLoading(false);
              break;
          }
        } catch (err) {
          console.error('Failed to parse SSE data:', err);
        }
      };

      let retryCount = 0;
      const maxRetries = 2; // 최대 2회만 재시도

      eventSource.onerror = (error) => {
        console.log(`📡 SSE 연결 오류 발생 (재시도 ${retryCount}/${maxRetries})`);
        eventSource.close();

        // 🔄 제한된 재연결 로직
        if (retryCount < maxRetries && isLoading) {
          retryCount++;
          setTimeout(() => {
            if (isLoading) { // 아직 로딩 중이면 재시도
              console.log(`🔁 SSE 재연결 시도 ${retryCount}/${maxRetries}...`);
              try {
                // 새 EventSource 생성 (무한 재귀 방지)
                const retryEventSource = new EventSource(
                  `/api/chat/ws?question=${encodeURIComponent(question)}&context=real_ai_analysis&session=${sessionId}${previousVehiclesParam}`
                );
                // 기존 이벤트 핸들러 재설정하지 않음 - 간단한 재시도만
              } catch (retryError) {
                console.error('❌ SSE 재연결 실패:', retryError);
                setIsLoading(false);
              }
            }
          }, 2000 * retryCount); // 지수 백오프: 2초, 4초
        } else {
          console.log('⏹️ 최대 재시도 횟수 도달 또는 로딩 완료, SSE 재시도 중단');
          setIsLoading(false);
        }
      };

      // 컴포넌트 언마운트 시 연결 종료
      return () => {
        eventSource.close();
      };

    } catch (error) {
      console.error('WebSocket streaming error:', error);
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agent: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const question = inputValue;
    setInputValue('');
    setQuestionCount(prev => prev + 1); // 질문 카운터 증가

    // 추가 질문도 WebSocket 스트리밍으로 처리
    startRealAIAnalysis(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAgentInfo = (agent: Message['agent']) => {
    switch (agent) {
      case 'user':
        return { name: '나', color: 'bg-blue-500', emoji: '👤' };
      case 'concierge':
        return { name: '컨시어지 매니저', color: 'bg-blue-600', emoji: '🎯' };
      case 'needs_analyst':
        return { name: '니즈 분석 전문가', color: 'bg-orange-600', emoji: '🔍' };
      case 'data_analyst':
        return { name: '데이터 분석 전문가', color: 'bg-green-600', emoji: '📊' };
      case 'system':
        return { name: 'CarFin AI', color: 'bg-gray-600', emoji: '🤖' };
    }
  };

  // 패턴 감지를 자연스러운 메시지로 변환
  const getPatternMessage = (patternType: string, persona?: any): string => {
    const patternMessages: { [key: string]: string } = {
      'FIRST_CAR_ANXIETY': '🚗 첫차 구매에 대한 불안감을 느끼고 계시는군요! 초보운전자를 위한 안전한 차량 분석을 시작하겠습니다.',
      'FAMILY_PRIORITY': '👨‍👩‍👧 아이와 함께하는 안전한 드라이빙을 고민하고 계시네요! 가족용 차량 맞춤 분석을 진행하겠습니다.',
      'MZ_LIFESTYLE': '✨ 스타일리시하면서도 실용적인 차량을 찾고 계시는군요! MZ세대 맞춤 분석을 시작하겠습니다.',
      'CAMPING_LIFESTYLE': '🏕️ 자유로운 캠핑 라이프를 위한 완벽한 동반자를 찾고 계시네요! 캠핑 전용 차량 분석을 진행하겠습니다.',
      'PRACTICAL_FAMILY': '🏠 가족을 위한 현명하고 경제적인 선택을 고민하고 계시는군요! 실용적 가장 맞춤 분석을 시작하겠습니다.',
      'BUDGET_CONSTRAINT': '💰 예산 범위에서 최적의 선택지를 찾고 계시는군요! 경제적 분석을 진행하겠습니다.',
      'CONFLICTING_REQUIREMENTS': '⚖️ 여러 조건들 사이에서 균형점을 찾고 계시는군요! 우선순위 기반 분석을 시작하겠습니다.',
      'INFORMATION_GAP': '🔍 더 구체적인 정보가 필요한 상황이네요! 맞춤형 질문을 통해 완벽한 분석을 준비하겠습니다.',
      'STANDARD_FLOW': '🤖 고객님의 요구사항을 종합적으로 분석하겠습니다! 3명의 전문가가 협업하여 최적의 답변을 드리겠습니다.'
    };

    return patternMessages[patternType] || `🎯 ${patternType} 패턴을 감지했습니다. 맞춤형 분석을 시작하겠습니다.`;
  };

  const getMessageStyle = (messageType?: string) => {
    switch (messageType) {
      case 'pattern_detected':
        return 'border-l-4 border-purple-500 bg-purple-50';
      case 'question':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'answer':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'user_intervention':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'system_info':
        return 'border-l-4 border-gray-500 bg-gray-50';
      default:
        return '';
    }
  };

  // 메시지 필터링: 분석 과정 vs 최종 결과
  const isThinkingMessage = (message: Message) => {
    // 진짜 상세한 분석 과정만 필터링 (agent_question, agent_answer는 핵심 인사이트이므로 보여줌)
    return ['detailed_analysis', 'internal_process'].includes(message.messageType || '');
  };

  const isFinalResult = (message: Message) => {
    return ['vehicle_recommendations', 'system_info'].includes(message.messageType || '') ||
           (message.messageType === 'system_info' && message.content.includes('분석이 완료'));
  };

  const isCoreInsight = (message: Message) => {
    // AI 에이전트들의 핵심 인사이트는 항상 표시
    return ['agent_response', 'pattern_detected'].includes(message.messageType || '') ||
           ['needs_analyst', 'data_analyst', 'concierge'].includes(message.agent);
  };

  const displayMessages = showThinkingProcess
    ? messages
    : messages.filter(msg =>
        msg.agent === 'user' ||
        isFinalResult(msg) ||
        isCoreInsight(msg) ||
        (!isThinkingMessage(msg) && !isFinalResult(msg))
      );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 좌측 사이드바 - 데스크톱에서만 표시, 너비 축소 */}
      <div className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-gray-200 flex-col">
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="메인으로 돌아가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">CarFin AI</h2>
              <p className="text-sm text-gray-500">전문가팀 상담</p>
            </div>
            <button
              onClick={clearConversationHistory}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
              title="대화 기록 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CarFin 친근한 사이드바 */}
        <div className="flex-1 p-4 space-y-4">
          {/* 안심 메시지 */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <div className="text-center">
              <div className="text-3xl mb-2">😊</div>
              <h3 className="font-bold text-slate-800 mb-2">걱정 끝!</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                3명의 전문가가 {selectedPersona?.name || '고객님'}만을 위해
                최고의 차량을 찾고 있어요
              </p>
            </div>
          </div>

          {/* 신뢰 지표 */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="text-center space-y-3">
              <div>
                <div className="text-xl font-bold text-green-700">117,564+</div>
                <div className="text-xs text-gray-600">실제 매물에서 검색</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-700">100%</div>
                <div className="text-xs text-gray-600">무료 상담</div>
              </div>
              <div>
                <div className="text-xl font-bold text-purple-700">0%</div>
                <div className="text-xs text-gray-600">딜러 영업</div>
              </div>
            </div>
          </div>

          {/* 📊 세션 통계 (조건부 표시) */}
          {(currentSessionId || questionCount > 0) && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
              <div className="text-center space-y-2">
                <div className="text-lg font-bold text-indigo-700">
                  {questionCount}번째 질문
                </div>
                <div className="text-xs text-indigo-600">N번째 질문 환영 시스템</div>
                {currentSessionId && (
                  <div className="text-xs text-gray-500 font-mono bg-white/50 rounded px-2 py-1 mt-2">
                    {currentSessionId.slice(-8)}
                  </div>
                )}
                {conversationHistory.length > 0 && (
                  <div className="text-xs text-indigo-600">
                    저장된 대화: {conversationHistory.length}개
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 기다리는 동안 팁 */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-100">
            <div className="text-center">
              <div className="text-2xl mb-2">💡</div>
              <h4 className="font-medium text-orange-800 mb-2">잠깐! 알고 계셨나요?</h4>
              <p className="text-sm text-orange-700 leading-relaxed">
                중고차 구매시 가장 중요한 건 숨겨진 비용까지
                꼼꼼히 따져보는 거예요. 저희가 다 계산해드릴게요!
              </p>
            </div>
          </div>

          {/* 격려 메시지 */}
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💝</div>
              <div>
                <h4 className="font-medium text-green-800 mb-1">CarFin 약속</h4>
                <p className="text-sm text-green-700 leading-relaxed">
                  딜러 영업 없이 100% 중립적으로
                  당신 편에서 도와드려요
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 중앙 대화창 */}
      <div className="flex-1 flex flex-col">
        {/* 대화창 헤더 */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI 전문가팀과의 상담</h1>
              <p className="text-sm text-gray-600">3명의 전문가가 협업하여 분석해드립니다</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">상담 진행 중</span>
            </div>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-white"
        >
          {/* N번째 질문 환경 배너 */}
          {welcomeSystemInitialized && (
            <NthQuestionWelcomeBanner
              question={initialQuestion}
              detectedPersona={detectedPersonaForWelcome}
              budget={budgetForWelcome}
              className="mb-6"
            />
          )}

          {/* CarFin 대기 UI - 친근하고 간단한 버전 */}
          <CarFinWaitingUI
            isVisible={showThinkingProcess}
            currentMessage={initialQuestion}
            isProcessing={isLoading}
            selectedPersona={selectedPersona}
          />

          {/* GPT Thinking Toggle 버튼 - 개선된 스타일 */}
          <div className="text-center mb-4">
            <button
              onClick={() => setShowThinkingProcess(!showThinkingProcess)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {showThinkingProcess ? (
                <>
                  <span>🧠</span>
                  <span>분석 과정 숨기기</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>전문가들이 어떻게 도와주는지 보기</span>
                </>
              )}
            </button>
            <div className="text-xs text-gray-500 mt-2">
              {showThinkingProcess
                ? "분석 과정이 숨겨집니다"
                : "3명의 전문가가 어떻게 도와주는지 확인해보세요! 😊"}
            </div>
          </div>

          {/* 기존 레거시 토글 버튼 (조건부 표시 제거) */}
          {false && messages.some(msg => isThinkingMessage(msg)) && (
            <div className="text-center mb-4">
              <button
                onClick={() => setShowThinkingProcess(!showThinkingProcess)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors font-medium text-sm shadow-md"
              >
                {showThinkingProcess ? (
                  <>
                    <span>🔼</span>
                    <span>분석 과정 접기</span>
                  </>
                ) : (
                  <>
                    <span>🔽</span>
                    <span>전문가들이 어떻게 도와주는지 보기</span>
                  </>
                )}
              </button>
              <div className="text-xs text-gray-500 mt-1">
                {showThinkingProcess
                  ? "버튼을 눌러 상세 분석 과정을 숨김니다"
                  : "에이전트들이 어떻게 협업하는지 궁금하다면 클릭!"}
              </div>
            </div>
          )}

          {displayMessages.map((message) => {
            const agentInfo = getAgentInfo(message.agent);
            const isUser = message.agent === 'user';

            return (
              <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl ${isUser ? '' : 'flex space-x-3'}`}>
                  {/* AI 전문가 아바타 */}
                  {!isUser && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {agentInfo.emoji}
                      </div>
                    </div>
                  )}

                  <div className="flex-1">
                    {/* 전문가 이름 */}
                    {!isUser && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">{agentInfo.name}</span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}

                    {/* 메시지 내용 */}
                    <div className={`p-4 rounded-2xl ${
                      isUser
                        ? 'bg-blue-500 text-white ml-12'
                        : `bg-gray-100 text-gray-900 ${getMessageStyle(message.messageType)}`
                    }`}>
                      {/* 메시지 타입별 특별 표시 */}
                      {message.messageType && !isUser && (
                        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                          {message.messageType === 'pattern_detected' && '🎯 상황 분석 완료'}
                          {message.messageType === 'question' && '❓ 전문가 질문'}
                          {message.messageType === 'answer' && '💬 전문가 답변'}
                          {message.messageType === 'user_intervention' && '⚠️ 사용자 확인 필요'}
                          {message.messageType === 'system_info' && '🤖 시스템 알림'}
                          {message.messageType === 'vehicle_recommendations' && '🚗 차량 추천 완료'}
                        </div>
                      )}

                      {/* 차량 추천 카드 렌더링 */}
                      {message.messageType === 'vehicle_recommendations' && message.metadata?.vehicles ? (
                        <div data-vehicle-recommendations>
                          <VehicleRecommendationsDisplay
                            message={message}
                            onVehiclesUpdate={setLastVehicleRecommendations}
                          />
                        </div>
                      ) : (
                        <AgentMessageWithToggle
                          message={message}
                          isStreaming={message.isStreaming}
                        />
                      )}
                      {/* 메타데이터 표시 */}
                      {message.metadata?.targetAgent && (
                        <div className="text-xs text-gray-500 mt-2">
                          → {message.metadata.targetAgent}에게 질문
                        </div>
                      )}
                      {message.metadata?.interventionType && (
                        <div className="text-xs text-red-600 mt-2 font-medium">
                          유형: {message.metadata.interventionType}
                        </div>
                      )}
                      {isUser && (
                        <div className="text-xs text-blue-100 mt-1">
                          {message.timestamp.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 분석 완료 후 차량 추천 요약 */}
          {analysisComplete && lastVehicleRecommendations.length > 0 && (
            <VehicleRecommendationSummary
              analysisComplete={true}
              vehicleCount={lastVehicleRecommendations.length}
              expertCount={3}
              analysisTime={2.5}
              onViewRecommendations={() => {
                // 차량 추천 카드로 스크롤
                const vehicleCard = document.querySelector('[data-vehicle-recommendations]');
                if (vehicleCard) {
                  vehicleCard.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              onViewAnalysisProcess={() => {
                setShowDetailedAnalysis(!showDetailedAnalysis);
              }}
            />
          )}

          {/* 분석 진행 중 상태 표시 */}
          {!analysisComplete && !isLoading && messages.some(msg => ['needs_analyst', 'data_analyst', 'concierge'].includes(msg.agent)) && (
            <VehicleRecommendationSummary
              analysisComplete={false}
              onViewRecommendations={() => {}}
              onViewAnalysisProcess={() => {}}
            />
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
                  <div className="text-white text-xs">🤖</div>
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-2xl border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">{loadingMessages.main}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {loadingMessages.sub}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="추가 질문이나 요청사항을 입력하세요..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 차량 추천 표시 컴포넌트 (무한 렌더링 방지)
function VehicleRecommendationsDisplay({
  message,
  onVehiclesUpdate
}: {
  message: Message;
  onVehiclesUpdate: (vehicles: any[]) => void;
}) {
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    if (message.metadata?.vehicles) {
      const sortedVehicles = [...message.metadata.vehicles].sort((a: any, b: any) => a.rank - b.rank);
      setVehicles(sortedVehicles);
      onVehiclesUpdate(sortedVehicles);
    }
  }, [message.metadata?.vehicles, onVehiclesUpdate]);

  return (
    <div className="space-y-4">
      <div className="text-sm leading-relaxed text-gray-700 mb-4">
        <span>{message.content}</span>
        {message.isStreaming && (
          <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse">|</span>
        )}
      </div>

      {/* 강력한 수평 레이아웃 - 데스크톱에서 완전히 가로 배치 */}
      <div className="flex flex-col lg:flex-row lg:space-x-4 lg:space-y-0 space-y-4 w-full">
        {vehicles.map((vehicle: any, index: number) => (
          <div key={`vehicle-${vehicle.rank || index}`} className="flex-1 lg:max-w-none">
            <HorizontalVehicleCard
              vehicle={vehicle}
              personaName={message.metadata?.persona}
              rank={vehicle.rank}
            />
          </div>
        ))}
      </div>

      {/* 순위 비교 안내 */}
      <div className="text-center text-sm text-gray-500 mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-lg">📋</span>
          <span className="font-medium">순위별 추천 차량</span>
        </div>
        <p className="text-xs">
          "{message.metadata?.persona || '고객'}님"의 라이프스타일에 맞춘 1순위부터 3순위까지의 차량 추천입니다
        </p>
      </div>
    </div>
  );
}

// AI 에이전트 메시지를 축약해서 표시하는 컴포넌트
function AgentMessageWithToggle({
  message,
  isStreaming
}: {
  message: Message;
  isStreaming?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // AI 전문가 메시지만 축약 처리
  const isExpertMessage = message.agent && ['needs_analyst', 'data_analyst', 'concierge'].includes(message.agent);

  if (!isExpertMessage) {
    // AI 전문가가 아닌 경우 기존 방식으로 표시
    return (
      <div className="text-sm leading-relaxed">
        <span>{message.content}</span>
        {isStreaming && (
          <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse">|</span>
        )}
      </div>
    );
  }

  // 메시지를 첫 문장(핵심)과 나머지(상세)로 분리
  const content = message.content || '';
  const sentences = content.split(/[.!?]\s+/).filter(s => s.trim());
  const summary = sentences[0] + (sentences[0] && !sentences[0].match(/[.!?]$/) ? '.' : '');
  const details = sentences.slice(1).join('. ') + (sentences.length > 1 ? '.' : '');

  const hasDetails = details.trim().length > 0;

  return (
    <div className="text-sm leading-relaxed">
      {/* 핵심 요약 */}
      <div className="mb-2">
        <span>{summary}</span>
        {isStreaming && (
          <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse">|</span>
        )}
      </div>

      {/* 토글 버튼 (상세 내용이 있을 때만) */}
      {hasDetails && !isStreaming && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors mb-2 flex items-center space-x-1"
        >
          <span>{isExpanded ? '📖 상세 내용 숨기기' : '📋 상세 분석 보기'}</span>
          <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      )}

      {/* 상세 내용 */}
      {hasDetails && isExpanded && (
        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-200">
          <span>{details}</span>
        </div>
      )}
    </div>
  );
}