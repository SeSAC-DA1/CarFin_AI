'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Users } from 'lucide-react';
import A2AVisualization from '@/components/ui/A2AVisualization';
import HorizontalVehicleCard from '@/components/ui/HorizontalVehicleCard';
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

    // 짧은 지연 후 AI 분석 시작 (중복 연결 방지)
    const analysisTimer = setTimeout(() => {
      startRealAIAnalysis(initialQuestion);
    }, 100);

    // Cleanup function
    return () => {
      console.log('Cleaning up ChatRoom');
      clearTimeout(analysisTimer);
      initialized.current = false;
    };
  }, [initialQuestion]); // initialQuestion 의존성 유지하되 초기화 체크로 중복 방지

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
              console.log('🚗 Vehicle recommendations received');
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

      eventSource.onerror = (error) => {
        console.log('EventSource connection issue, retrying...');
        eventSource.close();
        setIsLoading(false);

        // 간단한 재시도 로직
        setTimeout(() => {
          if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
            console.log('Attempting to reconnect...');
          }
        }, 2000);
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 좌측 사이드바 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">CarFin AI</h2>
              <p className="text-sm text-gray-500">전문가팀 상담</p>
            </div>
          </div>
        </div>

        {/* 전문가 상태 패널 */}
        <div className="flex-1 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">참여 전문가</h3>

          <div className="space-y-3">
            {/* 컨시어지 매니저 */}
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-2xl">🎯</div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">컨시어지 매니저</p>
                <p className="text-xs text-gray-600">상담 프로세스 관리</p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>

            {/* 니즈 분석 전문가 */}
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="text-2xl">🔍</div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">니즈 분석 전문가</p>
                <p className="text-xs text-gray-600">숨은 니즈 발굴</p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>

            {/* 데이터 분석 전문가 */}
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="text-2xl">📊</div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">데이터 분석 전문가</p>
                <p className="text-xs text-gray-600">매물 + TCO 분석</p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>

          {/* 분석 상태 - 실시간 업데이트 */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">분석 진행상황</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs items-center">
                <span className="text-gray-600">질문 분석</span>
                <div className="flex items-center space-x-1">
                  {analysisStatus.questionAnalysis === 'completed' && <span className="text-green-600 font-medium">완료</span>}
                  {analysisStatus.questionAnalysis === 'in_progress' && (
                    <>
                      <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-600 font-medium">진행 중</span>
                    </>
                  )}
                  {analysisStatus.questionAnalysis === 'pending' && <span className="text-gray-400 font-medium">대기 중</span>}
                </div>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-gray-600">니즈 파악</span>
                <div className="flex items-center space-x-1">
                  {analysisStatus.needsAnalysis === 'completed' && <span className="text-green-600 font-medium">완료</span>}
                  {analysisStatus.needsAnalysis === 'in_progress' && (
                    <>
                      <div className="w-3 h-3 border border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-orange-600 font-medium">진행 중</span>
                    </>
                  )}
                  {analysisStatus.needsAnalysis === 'pending' && <span className="text-gray-400 font-medium">대기 중</span>}
                </div>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-gray-600">매물 검색</span>
                <div className="flex items-center space-x-1">
                  {analysisStatus.dataSearch === 'completed' && (
                    <>
                      <span className="text-green-600 font-medium">완료</span>
                      <span className="text-xs text-green-600">({dbStats.searchedVehicles}대 발견)</span>
                    </>
                  )}
                  {analysisStatus.dataSearch === 'in_progress' && (
                    <>
                      <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-green-600 font-medium">검색 중</span>
                    </>
                  )}
                  {analysisStatus.dataSearch === 'pending' && <span className="text-gray-400 font-medium">대기 중</span>}
                </div>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-gray-600">전문가 협업</span>
                <div className="flex items-center space-x-1">
                  {analysisStatus.collaboration === 'completed' && <span className="text-green-600 font-medium">완료</span>}
                  {analysisStatus.collaboration === 'in_progress' && (
                    <>
                      <div className="w-3 h-3 border border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-purple-600 font-medium">협업 중</span>
                    </>
                  )}
                  {analysisStatus.collaboration === 'pending' && <span className="text-gray-400 font-medium">대기 중</span>}
                </div>
              </div>
            </div>
          </div>

          {/* A2A 실시간 협업 시각화 */}
          {selectedPersona && (
            <div className="mt-4">
              <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 mb-3">
                <div className="text-center">
                  <div className="text-2xl mb-1">{selectedPersona.emoji}</div>
                  <div className="text-sm font-medium text-purple-800">{selectedPersona.name}님 맞춤 A2A</div>
                  <div className="text-xs text-purple-600">{selectedPersona.theme.description}</div>
                </div>
              </div>
              <A2AVisualization
                isActive={true}
                currentPersona={selectedPersona.name}
              />
            </div>
          )}

          {/* 실시간 DB 연결 상태 */}
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-green-800">실시간 DB 연결</h4>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 font-medium">연결됨</span>
              </div>
            </div>
            <div className="text-xs text-green-700">
              <div className="flex justify-between">
                <span>전체 매물:</span>
                <span className="font-bold">{dbStats.totalVehicles?.toLocaleString()}대</span>
              </div>
              {dbStats.searchedVehicles > 0 && (
                <div className="flex justify-between mt-1">
                  <span>검색 결과:</span>
                  <span className="font-bold">{dbStats.searchedVehicles?.toLocaleString()}대</span>
                </div>
              )}
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
          {messages.map((message) => {
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
                        <div className="space-y-4">
                          <div className="text-sm leading-relaxed text-gray-700 mb-4">
                            <span>{message.content}</span>
                            {message.isStreaming && (
                              <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse">|</span>
                            )}
                          </div>

                          {/* 세로형 순위 레이아웃 */}
                          <div className="space-y-4">
                            {(() => {
                              // 차량 추천 데이터를 상태에 저장
                              const vehicles = message.metadata.vehicles.sort((a: any, b: any) => a.rank - b.rank);
                              if (vehicles.length > 0) {
                                setLastVehicleRecommendations(vehicles);
                              }
                              return vehicles.map((vehicle: any, index: number) => (
                                <div key={`vehicle-${index}`} className="flex-1">
                                  <HorizontalVehicleCard
                                    vehicle={vehicle}
                                    personaName={message.metadata?.persona}
                                    rank={vehicle.rank}
                                  />
                                </div>
                              ));
                            })()}
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
                      ) : (
                        <div className="text-sm leading-relaxed">
                          <span>{message.content}</span>
                          {message.isStreaming && (
                            <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse">|</span>
                          )}
                        </div>
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
                      <span className="text-sm text-gray-600 font-medium">전문가팀이 분석 중입니다...</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      실시간 데이터를 기반으로 최적의 답변을 준비하고 있어요 😊
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