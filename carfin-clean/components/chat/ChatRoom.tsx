'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Users, RotateCcw } from 'lucide-react';
import A2AVisualization from '@/components/ui/A2AVisualization';
import HorizontalVehicleCard from '@/components/ui/HorizontalVehicleCard';
import CompactVehicleCard from '@/components/ui/CompactVehicleCard';
import SimpleVehicleCard from '@/components/ui/SimpleVehicleCard';
import VehicleDetailModal from '@/components/ui/VehicleDetailModal';
import AgentInsightCard from '@/components/ui/AgentInsightCard';
import VehicleRecommendationSummary from '@/components/ui/VehicleRecommendationSummary';
import NthQuestionWelcomeBanner from '@/components/welcome/NthQuestionWelcomeBanner';
import QuestionProgressBar from '@/components/welcome/QuestionProgressBar';
import CarFinWaitingUI from '@/components/ui/CarFinWaitingUI';
import CEODemoScenario from '@/components/demo/CEODemoScenario';
import SatisfactionFeedback from '@/components/feedback/SatisfactionFeedback';
import RealTimeStatusPanel from '@/components/ui/RealTimeStatusPanel';
import { DemoPersona } from '@/lib/collaboration/PersonaDefinitions';
import { ConversationFilterExtractor } from '@/lib/search/ConversationFilterExtractor';

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
    const vehicleCount = dbStats.totalVehicles > 0 ? `${Math.round(dbStats.totalVehicles / 1000)}K+` : '실제';
    const mainMessages = [
      "전문가들이 머리를 맞대고 있어요... 🤝",
      `${vehicleCount} 매물을 꼼꼼히 분석 중... 🔍`,
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
      `${vehicleCount} 매물 중에서 최고만 골라드릴게요 🌟`
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

  // 만족도 피드백 관련 상태
  const [showSatisfactionFeedback, setShowSatisfactionFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);

  // 🎯 실시간 상황표 상태
  interface FilterCondition {
    type: 'carType' | 'priceRange' | 'fuelEfficiency' | 'brand' | 'features' | 'year' | 'mileage';
    label: string;
    value: string;
    priority: number;
    impact: number;
  }

  const [totalVehicles, setTotalVehicles] = useState(0);
  const [currentMatches, setCurrentMatches] = useState(0);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [isProcessingFilters, setIsProcessingFilters] = useState(false);
  const filterExtractor = new ConversationFilterExtractor();

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

  // 🎯 실시간 필터 업데이트 함수
  const updateRealTimeFilters = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    setIsProcessingFilters(true);

    try {
      // 1. AI로 대화에서 조건 추출
      const conversationContext = messages
        .filter(msg => msg.agent === 'user')
        .map(msg => msg.content);

      const extracted = await filterExtractor.extractFilters(
        userMessage,
        conversationContext
      );

      console.log('✅ 추출된 필터 조건:', extracted);

      if (extracted.conditions.length > 0) {
        // 2. 새로운 필터 조건들을 추가/업데이트
        const updatedFilters = [...activeFilters];

        extracted.conditions.forEach(newCondition => {
          // 기존에 같은 타입의 필터가 있으면 교체, 없으면 추가
          const existingIndex = updatedFilters.findIndex(f => f.type === newCondition.type);

          const filterWithImpact = {
            ...newCondition,
            impact: 0 // 임시값, 서버에서 계산됨
          };

          if (existingIndex >= 0) {
            updatedFilters[existingIndex] = filterWithImpact;
          } else {
            updatedFilters.push(filterWithImpact);
          }
        });

        // 3. 서버에서 실시간 카운트 요청
        const countResponse = await fetch('/api/search/count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters: updatedFilters })
        });

        if (countResponse.ok) {
          const countData = await countResponse.json();

          // 4. UI 업데이트
          setCurrentMatches(countData.currentMatches);
          setTotalVehicles(countData.totalVehicles);

          // 5. 필터 임팩트 정보 업데이트
          const filtersWithImpact = updatedFilters.map(filter => {
            const impact = countData.filterImpacts.find((fi: any) =>
              fi.filter.type === filter.type
            );
            return {
              ...filter,
              impact: impact?.impact || 0
            };
          });

          setActiveFilters(filtersWithImpact);

          console.log(`🎯 필터 업데이트 완료: ${countData.currentMatches.toLocaleString()}대 매칭`);
        }
      }

    } catch (error) {
      console.error('❌ 실시간 필터 업데이트 실패:', error);
    } finally {
      setIsProcessingFilters(false);
    }
  };

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

  // 📝 메시지 업데이트 시 자동 저장 (Debounced - 2초마다만 저장)
  useEffect(() => {
    if (messages.length === 0 || !userId) return;

    const saveTimer = setTimeout(() => {
      saveConversation(messages);
    }, 2000); // ⚡ 2초 debounce로 과도한 저장 방지

    return () => clearTimeout(saveTimer);
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
      // 차량 추천 완료 시 피드백 시스템 활성화 (3초 후)
      setTimeout(() => {
        setShowSatisfactionFeedback(true);
      }, 3000);
    }
  }, [messages, analysisComplete]);

  // 피드백 처리 함수
  const handleFeedback = (feedback: any) => {
    setFeedbackData(feedback);
    console.log('💬 사용자 피드백 수집:', feedback);

    // 만족한 경우 피드백 숨기기
    if (feedback.satisfaction === 'satisfied') {
      setTimeout(() => {
        setShowSatisfactionFeedback(false);
      }, 2000);
    }
  };

  // 재추천 요청 처리 함수 - 지능적 재랭킹
  const handleRecommendationRequest = async (refinement: string) => {
    console.log('🔄 재추천 요청:', refinement);
    console.log('📊 이전 추천 데이터:', lastVehicleRecommendations.length, '대');

    // 기존 추천 데이터 컨텍스트 생성
    const previousContext = lastVehicleRecommendations.length > 0
      ? `\n\n🔍 이전 추천 분석:\n` +
        `- 추천받은 차량: ${lastVehicleRecommendations.length}대\n` +
        `- 최고 점수: ${Math.max(...lastVehicleRecommendations.map(v => v.reranking_score || 0))}점\n` +
        `- 주요 브랜드: ${[...new Set(lastVehicleRecommendations.slice(0,3).map(v => v.manufacturer))].join(', ')}\n` +
        `- 가격대: ${Math.min(...lastVehicleRecommendations.map(v => v.price))}~${Math.max(...lastVehicleRecommendations.map(v => v.price))}만원`
      : '';

    // 지능적 재질문 생성
    const refinedQuestion = `${refinement}${previousContext}

🎯 개선 요청: 위 피드백을 반영해서 완전히 새로운 관점으로 차량을 재분석하고 다시 추천해주세요.
${feedbackData?.suggestions ? `\n💬 추가 요청사항: ${feedbackData.suggestions}` : ''}

🔄 재랭킹 모드: 이전 추천과는 다른 새로운 차량들을 우선적으로 고려해주세요.`;

    // 재랭킹 상태 초기화
    setShowSatisfactionFeedback(false);
    setQuestionCount(prev => prev + 1);
    setAnalysisComplete(false);
    setLastVehicleRecommendations([]); // 이전 추천 초기화

    // 재랭킹 시스템 메시지 추가
    const reRankingMessage: Message = {
      id: Date.now().toString(),
      agent: 'system',
      content: `🔄 재랭킹 시스템 활성화: ${refinement}`,
      timestamp: new Date(),
      messageType: 'system_info',
      metadata: {
        reranking: true,
        previousCount: lastVehicleRecommendations.length,
        refinementType: refinement
      }
    };

    setMessages(prev => [...prev, reRankingMessage]);

    // 자동으로 재추천 요청 전송
    console.log('🚀 지능적 재랭킹 요청 전송');
    await handleSend(refinedQuestion);
  };

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

    // 🎯 첫 번째 질문에서도 실시간 필터 업데이트
    updateRealTimeFilters(initialQuestion);

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

  const handleSend = async (customQuestion?: string) => {
    const messageContent = customQuestion || inputValue;
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agent: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const question = messageContent;
    if (!customQuestion) {
      setInputValue('');
    }
    setQuestionCount(prev => prev + 1); // 질문 카운터 증가

    // 🎯 실시간 필터 업데이트 (병렬 처리)
    updateRealTimeFilters(messageContent);

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
        return { name: '고객님', color: 'bg-blue-500', emoji: '👤' };
      case 'concierge':
        return { name: 'CarFin 상담 총괄 에이전트', color: 'bg-blue-600', emoji: '🎯' };
      case 'needs_analyst':
        return { name: 'CarFin 니즈 분석 에이전트', color: 'bg-orange-600', emoji: '🔍' };
      case 'data_analyst':
        return { name: 'CarFin 차량 추천 에이전트', color: 'bg-green-600', emoji: '📊' };
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 좌측 사이드바 - 실시간 동적 정보 표시 */}
      <div className="hidden lg:flex w-80 xl:w-96 bg-white border-r border-gray-200 flex-col overflow-hidden">
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
              <p className="text-sm text-gray-700">전문가팀 상담</p>
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

        {/* CarFin 실시간 동적 사이드바 */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">

          {/* 🎯 실시간 상황표 - 최상단 */}
          <RealTimeStatusPanel
            totalVehicles={totalVehicles}
            currentMatches={currentMatches}
            activeFilters={activeFilters}
            isProcessing={isProcessingFilters}
            lastUpdate={new Date()}
          />

          {/* CEO 전용 안심 메시지 또는 일반 안심 메시지 */}
          {selectedPersona?.id === 'ceo_executive' ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <div className="text-center">
                <div className="text-3xl mb-2">👔</div>
                <h3 className="font-bold text-slate-800 mb-2">프리미엄 개인화 상담</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  골프, 비즈니스, 절세 효과까지<br />
                  고객님의 모든 니즈를 고려한<br />
                  맞춤 상담이 진행됩니다
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <div className="text-center">
                <div className="text-3xl mb-2">😊</div>
                <h3 className="font-bold text-slate-800 mb-2">개인화 AI 상담</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A2A 협업 시스템으로 {selectedPersona?.name || '고객님'}만을 위한
                  최적의 차량을 분석하고 있습니다
                </p>
              </div>
            </div>
          )}

          {/* 🚀 실시간 분석 상태 대시보드 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-3 text-sm">📊 실시간 분석 현황</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-600">데이터 조회</span>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${analysisStatus.dataSearch === 'completed' ? 'bg-green-400' : analysisStatus.dataSearch === 'in_progress' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-xs font-mono text-gray-800">{dbStats.totalVehicles.toLocaleString()}대</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-600">AI 협업</span>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${analysisStatus.collaboration === 'completed' ? 'bg-green-400' : analysisStatus.collaboration === 'in_progress' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-800">{currentSessionId ? 'A2A' : '대기'}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-600">랭킹 분석</span>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${lastVehicleRecommendations.length > 0 ? 'bg-green-400' : isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-xs font-mono text-gray-800">{lastVehicleRecommendations.length > 0 ? `${lastVehicleRecommendations.length}대` : '대기'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CEO 전용 신뢰 지표 또는 일반 신뢰 지표 */}
          {selectedPersona?.id === 'ceo_executive' ? (
            <div className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
              <h3 className="font-bold text-amber-800 mb-3 text-sm">💎 CEO 맞춤 서비스</h3>
              <div className="text-center space-y-3">
                <div>
                  <div className="text-lg font-bold text-amber-700">4,500~7,000만원</div>
                  <div className="text-xs text-gray-700">프리미엄 예산대</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-700">골프백 수납</div>
                  <div className="text-xs text-gray-700">비즈니스 특화</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-700">법인차 절세</div>
                  <div className="text-xs text-gray-700">세금 혜택 가능</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">🎯 CarFin 신뢰지표</h3>
              <div className="text-center space-y-3">
                <div>
                  <div className="text-lg font-bold text-green-700">{dbStats.totalVehicles > 0 ? dbStats.totalVehicles.toLocaleString() : '0'}+</div>
                  <div className="text-xs text-gray-700">실제 매물에서 검색</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-700">100%</div>
                  <div className="text-xs text-gray-700">무료 상담</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-700">0%</div>
                  <div className="text-xs text-gray-700">딜러 영업</div>
                </div>
              </div>
            </div>
          )}

          {/* 📊 세션 통계 (조건부 표시) */}
          {(currentSessionId || questionCount > 0) && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
              <div className="text-center space-y-2">
                <div className="text-lg font-bold text-indigo-700">
                  {questionCount}번째 질문
                </div>
                <div className="text-xs text-indigo-600">N번째 질문 환영 시스템</div>
                {currentSessionId && (
                  <div className="text-xs text-gray-700 font-mono bg-white/50 rounded px-2 py-1 mt-2">
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

          {/* 🏆 실시간 Top 차량 미니 대시보드 */}
          {lastVehicleRecommendations.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-green-800 text-sm flex items-center space-x-1">
                  <span>🏆</span>
                  <span>TOP 추천</span>
                </h3>
                <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  {lastVehicleRecommendations.length}대 분석
                </div>
              </div>
              <div className="space-y-3">
                {lastVehicleRecommendations.slice(0, 3).map((vehicle, index) => {
                  const rankConfig = {
                    1: { icon: '🥇', color: 'from-yellow-100 to-orange-100', border: 'border-yellow-300', text: 'text-yellow-800' },
                    2: { icon: '🥈', color: 'from-gray-100 to-gray-200', border: 'border-gray-300', text: 'text-gray-800' },
                    3: { icon: '🥉', color: 'from-orange-100 to-red-100', border: 'border-orange-300', text: 'text-orange-800' }
                  }[index + 1] || { icon: '⭐', color: 'from-blue-100 to-blue-200', border: 'border-blue-300', text: 'text-blue-800' };

                  return (
                    <div key={vehicle.vehicleid} className={`bg-gradient-to-r ${rankConfig.color} rounded-lg p-3 border ${rankConfig.border} hover:shadow-md transition-shadow cursor-pointer`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{rankConfig.icon}</span>
                          <div>
                            <div className={`text-xs font-bold ${rankConfig.text}`}>
                              {index + 1}순위 추천
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${rankConfig.text}`}>
                            {vehicle.reranking_score || 90}점
                          </div>
                          <div className="text-xs text-gray-700">적합도</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-900 mb-1 leading-tight">
                        {vehicle.manufacturer} {vehicle.model}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-700">
                        <span>{vehicle.modelyear}년식</span>
                        <span className="font-medium text-blue-700">{vehicle.price?.toLocaleString()}만원</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-700 mt-1">
                        <span>{vehicle.distance?.toLocaleString()}km</span>
                        <span>{vehicle.location}</span>
                      </div>
                      {vehicle.recommendationReason && (
                        <div className="mt-2 text-xs text-gray-700 bg-white/60 rounded px-2 py-1 leading-relaxed">
                          {vehicle.recommendationReason.slice(0, 45)}...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 추가 정보 및 액션 */}
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1 text-green-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span>실시간 업데이트</span>
                  </div>
                  <div className="text-green-600 font-medium">
                    총 {lastVehicleRecommendations.length}대 랭킹
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 간단한 시스템 상태 */}
          {dbStats.totalVehicles > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="text-center">
                <div className="text-2xl mb-2">🚀</div>
                <h4 className="font-medium text-blue-800 mb-2">실시간 연결</h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  {dbStats.totalVehicles.toLocaleString()}대 실제 매물과 연결됨
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 중앙 대화창 */}
      <div className="flex-1 flex flex-col">
        {/* 대화창 헤더 */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">CarFin AI 전문가팀 상담</h1>
              <p className="text-sm text-gray-800">CEO부터 신혼부부까지 맞춤 A2A 협업 분석</p>
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
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-white pb-6"
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

          {/* CEO 데모 시나리오 - 초기 화면 또는 CEO 페르소나 선택 시 */}
          {(!welcomeSystemInitialized && selectedPersona?.id === 'ceo_executive') && (
            <CEODemoScenario
              isVisible={true}
              onStartDemo={(demoQuestion) => {
                setInputValue(demoQuestion);
                // 자동으로 질문 전송
                setTimeout(() => {
                  handleSend(demoQuestion);
                }, 1000);
              }}
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
            <div className="text-xs text-gray-800 mt-2">
              {showThinkingProcess
                ? "분석 과정이 숨겨집니다"
                : "3명의 전문가가 어떻게 도와주는지 확인해보세요! 😊"}
            </div>
          </div>

          {/* GPT Thinking UI - 에이전트 협업 과정 접기/펴기 */}
          {messages.some(msg => isThinkingMessage(msg)) && (
            <div className="text-center mb-4">
              <button
                onClick={() => setShowThinkingProcess(!showThinkingProcess)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors font-medium text-sm shadow-md"
              >
                {showThinkingProcess ? (
                  <>
                    <span>🔼</span>
                    <span>추론 과정 접기 (핵심만 보기)</span>
                  </>
                ) : (
                  <>
                    <span>🧠</span>
                    <span>에이전트 협업 과정 자세히 보기</span>
                  </>
                )}
              </button>
              <div className="text-xs text-gray-800 mt-1">
                {showThinkingProcess
                  ? "💡 결론만 보고 싶다면 접기를 누르세요"
                  : "🤔 3명의 AI 전문가가 어떻게 생각하는지 궁금하다면?"}
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
                        <span className="text-xs text-gray-700">
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
                        <div className="text-xs text-gray-800 mb-2 uppercase tracking-wide font-medium">
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
                        // 에이전트별 인사이트 카드 또는 일반 메시지 표시
                        ['concierge', 'needs_analyst', 'data_analyst'].includes(message.agent) ? (
                          <AgentInsightCard
                            agent={message.agent}
                            content={message.content}
                            tcoSummary={message.metadata?.tcoSummary}
                          />
                        ) : (
                          <AgentMessageWithToggle
                            message={message}
                            isStreaming={message.isStreaming}
                          />
                        )
                      )}
                      {/* 메타데이터 표시 */}
                      {message.metadata?.targetAgent && (
                        <div className="text-xs text-gray-800 mt-2">
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

          {/* 만족도 피드백 시스템 - N번째 질문 환영 철학 구현 */}
          <SatisfactionFeedback
            recommendations={lastVehicleRecommendations}
            onFeedback={handleFeedback}
            onRecommendationRequest={handleRecommendationRequest}
            isVisible={showSatisfactionFeedback && analysisComplete && lastVehicleRecommendations.length > 0}
          />

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
                      <span className="text-sm text-gray-800 font-medium">{loadingMessages.main}</span>
                    </div>
                    <div className="text-xs text-gray-700">
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

// 차량 추천 표시 컴포넌트 (가로 스크롤 + 모달)
function VehicleRecommendationsDisplay({
  message,
  onVehiclesUpdate
}: {
  message: Message;
  onVehiclesUpdate: (vehicles: any[]) => void;
}) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log('🚗 VehicleRecommendationsDisplay - message.metadata:', message.metadata);
    console.log('🚗 VehicleRecommendationsDisplay - vehicles:', message.metadata?.vehicles);
    if (message.metadata?.vehicles) {
      const sortedVehicles = [...message.metadata.vehicles].sort((a: any, b: any) => a.rank - b.rank);
      console.log('🚗 Sorted vehicles:', sortedVehicles);
      setVehicles(sortedVehicles);
      onVehiclesUpdate(sortedVehicles);
    } else {
      console.log('⚠️ No vehicles found in message.metadata');
    }
  }, [message.metadata?.vehicles, onVehiclesUpdate]);

  const handleDetailClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm leading-relaxed text-gray-700 mb-4">
        <span>{message.content}</span>
        {message.isStreaming && (
          <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse">|</span>
        )}
      </div>

      {/* 가로 스크롤 레이아웃 */}
      {vehicles.length > 0 ? (
        <div className="relative">
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-200">
            {vehicles.map((vehicle: any, index: number) => {
              console.log(`🚗 Rendering vehicle ${index}:`, vehicle);
              return (
                <SimpleVehicleCard
                  key={`vehicle-${vehicle.rank || index}`}
                  vehicle={vehicle}
                  rank={vehicle.rank}
                  onDetailClick={() => handleDetailClick(vehicle)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ 차량 데이터를 불러오는 중입니다... (vehicles.length: {vehicles.length})
          </p>
        </div>
      )}

      {/* 상세 정보 모달 */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        personaName={message.metadata?.persona}
      />

      {/* 순위 비교 안내 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <span className="text-2xl">🏆</span>
            <span className="text-lg font-bold text-blue-800">차량 순위별 비교</span>
          </div>
          <p className="text-sm text-blue-700 mb-4">
            "{message.metadata?.persona || '고객'}님"의 니즈와 라이프스타일을 분석하여 맞춤 순위를 제공합니다
          </p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-lg mb-1">🥇</div>
              <div className="font-bold text-yellow-800">1순위</div>
              <div className="text-yellow-700">최적 매치</div>
            </div>
            <div className="text-center p-2 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-lg mb-1">🥈</div>
              <div className="font-bold text-gray-800">2순위</div>
              <div className="text-gray-700">대안 추천</div>
            </div>
            <div className="text-center p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-lg mb-1">🥉</div>
              <div className="font-bold text-orange-800">3순위</div>
              <div className="text-orange-700">고려 옵션</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600">
            💡 각 차량의 장단점과 통계를 비교하여 최선의 선택을 하세요
          </div>
        </div>
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
        <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-200">
          <span>{details}</span>
        </div>
      )}
    </div>
  );
}