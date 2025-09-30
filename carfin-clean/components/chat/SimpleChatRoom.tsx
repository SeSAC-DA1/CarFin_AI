'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, RotateCcw } from 'lucide-react';
import VehicleRecommendationCard from '@/components/ui/VehicleRecommendationCard';
import CEOVehicleCard from '@/components/ceo/CEOVehicleCard';
import { DemoPersona } from '@/lib/collaboration/PersonaDefinitions';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'vehicles';
  content: string;
  timestamp: Date;
  vehicles?: any[];
  metadata?: any;
}

interface SimpleChatRoomProps {
  initialQuestion: string;
  onBack: () => void;
  selectedPersona?: DemoPersona | null;
}

export default function SimpleChatRoom({ initialQuestion, onBack, selectedPersona }: SimpleChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 초기 질문 처리
  useEffect(() => {
    if (initialQuestion) {
      handleSendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  // AI 응답 처리 함수
  const handleSendMessage = async (messageText?: string) => {
    const question = messageText || inputValue.trim();
    if (!question || isLoading) return;

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 🚀 핵심문서 철학: "니 취향만 말해, 나머지는 내가 다 해줄게"
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          questionCount,
          selectedPersona: selectedPersona?.id
        })
      });

      if (!response.ok) {
        throw new Error('API 요청 실패');
      }

      const data = await response.json();

      // N번째 질문 환영 메시지 (핵심 차별화)
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        type: 'ai',
        content: getWelcomeMessage(questionCount, selectedPersona),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, welcomeMessage]);

      // AI 분석 진행 메시지
      const processingMessage: Message = {
        id: `processing-${Date.now()}`,
        type: 'ai',
        content: `${data.response || '완벽한 추천을 위해 분석 중입니다...'}\n\n🔍 ${data.metadata?.vehiclesFound || 0}대 매물에서 최적의 차량을 찾고 있어요!`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, processingMessage]);

      // 차량 추천 결과 (있는 경우)
      if (data.vehicles && data.vehicles.length > 0) {
        const vehicleMessage: Message = {
          id: `vehicles-${Date.now()}`,
          type: 'vehicles',
          content: `🎯 ${selectedPersona?.name || '고객님'}을 위한 맞춤 추천 완료!`,
          timestamp: new Date(),
          vehicles: data.vehicles.slice(0, 3), // 상위 3대만 표시
          metadata: data.metadata
        };

        setTimeout(() => {
          setMessages(prev => [...prev, vehicleMessage]);
        }, 1500); // 1.5초 후 결과 표시
      }

      setQuestionCount(prev => prev + 1);

    } catch (error) {
      console.error('메시지 전송 오류:', error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // N번째 질문 환영 메시지 생성
  const getWelcomeMessage = (count: number, persona?: DemoPersona | null): string => {
    const personaName = persona?.name || '고객님';

    const messages = [
      `안녕하세요 ${personaName}! 😊`,
      `${count}번째 질문이네요! 더 정확한 추천을 위해 계속 물어보세요 🎯`,
      `${count === 2 ? '2번째 질문까지! 이제 취향이 보이기 시작해요 ✨' : ''}${count === 3 ? '3번째 질문까지! 이제 정말 당신만의 맞춤 분석이 가능해요 🔥' : ''}${count >= 4 ? '계속 질문해주세요! 완전 만족할 때까지 도와드릴게요 💝' : ''}`,
      `${persona ? `${persona.situation}을 고려해서` : ''} 최적의 차량을 찾아드릴게요!`
    ];

    return messages.filter(msg => msg.length > 0).join('\n');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // CEO 모드 테마 적용
  const isCEOMode = selectedPersona?.id === 'ceo_executive' || selectedPersona?.name === '김정훈';
  const bgTheme = isCEOMode
    ? "min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"
    : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50";

  return (
    <div className={bgTheme}>
      {/* 헤더 */}
      <div className={isCEOMode
        ? "bg-slate-800/90 backdrop-blur-md shadow-sm border-b border-slate-700 p-4"
        : "bg-white shadow-sm border-b p-4"
      }>
        <div className="container mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className={`flex items-center space-x-2 ${
              isCEOMode
                ? "text-blue-300 hover:text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>뒤로가기</span>
          </button>

          <div className="text-center">
            <h1 className={`text-xl font-bold ${
              isCEOMode ? "text-white" : "text-gray-800"
            }`}>
              {isCEOMode ? "CEO 맞춤 분석" : "CarFin AI 상담"}
            </h1>
            <p className={`text-sm ${
              isCEOMode ? "text-blue-200" : "text-gray-600"
            }`}>
              {isCEOMode ? "프리미엄 차량 전문 컨설팅 💎" : "니 취향만 말해, 나머지는 내가 다 해줄게 💪"}
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className={`flex items-center space-x-2 ${
              isCEOMode
                ? "text-blue-300 hover:text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <RotateCcw className="w-5 h-5" />
            <span>새로시작</span>
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="container mx-auto p-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type === 'user' ? (
                // 사용자 메시지
                <div className="max-w-xs lg:max-w-md bg-blue-600 text-white rounded-3xl px-6 py-3">
                  <p>{message.content}</p>
                </div>
              ) : message.type === 'vehicles' ? (
                // 차량 추천 결과
                <div className="w-full">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      {message.content}
                    </h3>

                    <div className="space-y-4">
                      {message.vehicles?.map((vehicle, index) => {
                        // CEO 페르소나인 경우 CEO 전용 카드 사용
                        const isCEOPersona = selectedPersona?.id === 'ceo_executive' ||
                                           selectedPersona?.name === '김정훈';

                        return isCEOPersona ? (
                          <CEOVehicleCard
                            key={vehicle.vehicleid}
                            vehicle={vehicle}
                            rank={index + 1}
                            isTopChoice={index === 0}
                          />
                        ) : (
                          <VehicleRecommendationCard
                            key={vehicle.vehicleid}
                            vehicle={vehicle}
                            rank={index + 1}
                            personaName={selectedPersona?.name}
                          />
                        );
                      })}
                    </div>

                    {message.metadata && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          💡 {message.metadata.vehiclesFound}대 매물 중에서
                          {message.metadata.personaDetected ? ` ${message.metadata.personaDetected} 맞춤으로` : ''}
                          선별했어요!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // AI 메시지
                <div className="max-w-2xl bg-white rounded-3xl px-6 py-4 shadow-md border">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      AI
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-3xl px-6 py-4 shadow-md border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    AI
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="추가로 궁금한 것이 있으면 언제든 물어보세요... (N번째 질문 환영!)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-2 text-center">
            <p className="text-sm text-gray-500">
              💡 질문할수록 더 정확해져요! 완전히 만족할 때까지 계속 물어보세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}