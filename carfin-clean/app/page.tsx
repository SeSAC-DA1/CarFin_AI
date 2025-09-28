'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Database, CheckCircle } from 'lucide-react';
import ChatRoom from '@/components/chat/ChatRoom';
import PersonaDemoSelector from '@/components/demo/PersonaDemoSelector';
import A2AVisualization from '@/components/ui/A2AVisualization';
import { DemoPersona } from '@/lib/collaboration/PersonaDefinitions';

interface DatabaseStatus {
  isConnected: boolean;
  totalVehicles: number;
  availableVehicles: number;
}

export default function Home() {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChatRoom, setShowChatRoom] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState('');
  const [showPersonaDemo, setShowPersonaDemo] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<DemoPersona | null>(null);
  const [isA2AActive, setIsA2AActive] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    isConnected: false,
    totalVehicles: 0,
    availableVehicles: 0,
  });

  // 데이터베이스 상태 실시간 체크
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const response = await fetch('/api/database/status');
        const data = await response.json();
        setDbStatus(data);
      } catch (error) {
        console.error('DB 상태 체크 실패:', error);
      }
    };

    checkDatabase();
    const interval = setInterval(checkDatabase, 5000); // 5초마다 체크
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return;

    setInitialQuestion(question);
    setSelectedPersona(null);
    setShowChatRoom(true);
  };

  const handlePersonaSelect = (persona: DemoPersona, question: string) => {
    setSelectedPersona(persona);
    setInitialQuestion(question);
    setIsA2AActive(true);
    setShowChatRoom(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  const handleBack = useCallback(() => {
    setShowChatRoom(false);
    setSelectedPersona(null);
    setIsA2AActive(false);
  }, []);

  if (showChatRoom) {
    return (
      <ChatRoom
        initialQuestion={initialQuestion}
        onBack={handleBack}
        selectedPersona={selectedPersona}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* 데이터베이스 상태 표시 - 개선된 디자인 */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`px-6 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center space-x-3 ${
          dbStatus.isConnected
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="relative">
            <Database className="w-5 h-5" />
            {dbStatus.isConnected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
            )}
          </div>
          <div>
            {dbStatus.isConnected ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">LIVE DB</span>
                  <span className="text-green-600">•</span>
                  <span className="font-bold">{dbStatus.totalVehicles.toLocaleString()}대</span>
                </div>
                <div className="text-xs text-green-600">실시간 매물 연결됨</div>
              </>
            ) : (
              <span>❌ 연결 확인 중...</span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* 메인 헤더 */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="text-blue-600">니 취향만 말해,</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              나머지는 내가 다 해줄게
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            중고차 선택이 어렵나요? 😅 3명의 AI 전문가가 당신 대신 고민해드려요!
            <br />
            복잡한 비교는 그만, <strong>하고 싶은 말만 편하게 해주세요.</strong>
          </p>

          {/* 신뢰 지표 - 강화된 디자인 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-12 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-2xl font-bold text-green-700">
                    {dbStatus.totalVehicles.toLocaleString()}+
                  </span>
                </div>
                <p className="text-gray-600 font-medium">실제 매물 데이터</p>
                <p className="text-xs text-gray-500">PostgreSQL 실시간 연동</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-red-500" />
                  <span className="text-xl font-bold text-gray-700">0%</span>
                </div>
                <p className="text-gray-600 font-medium">Mock 데이터</p>
                <p className="text-xs text-gray-500">100% 실제 매물만 사용</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                  <span className="text-xl font-bold text-gray-700">100%</span>
                </div>
                <p className="text-gray-600 font-medium">완전 무료</p>
                <p className="text-xs text-gray-500">숨은 비용 없음</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-center text-sm text-gray-600">
                <span className="inline-flex items-center space-x-1">
                  <span>🔍</span>
                  <span className="font-medium">Gemini 2.5 Flash</span>
                  <span>+</span>
                  <span className="font-medium">A2A Protocol</span>
                  <span>+</span>
                  <span className="font-medium">실시간 DB</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 메인 질문 입력 */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                무엇을 도와드릴까요? 😊
              </h2>
              <p className="text-gray-600">
                마치 친구에게 말하듯 편하게 얘기해주세요. 사소한 걱정도 다 들어드려요!
              </p>
            </div>

            <div className="flex space-x-4">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder='예: "첫차 사는데 너무 무서워요... 뭘 살지 모르겠어요 ㅠㅠ"'
                className="flex-1 text-lg px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={isLoading}
                aria-label="차량 구매 상담 내용 입력"
                aria-describedby="input-help"
                role="textbox"
                aria-required="true"
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !question.trim()}
                className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 hover:scale-105 hover:shadow-lg active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200 flex items-center space-x-2 transform focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="AI 전문가팀에게 차량 분석 요청"
                type="submit"
              >
                <Send className="w-5 h-5" aria-hidden="true" />
                <span>분석 시작</span>
              </button>
            </div>

            {/* 접근성을 위한 숨겨진 도움말 */}
            <div id="input-help" className="sr-only">
              차량 구매에 대한 고민이나 질문을 자유롭게 입력해주세요. 3명의 AI 전문가가 도와드립니다.
            </div>

            {/* 페르소나별 시연 시스템 */}
            <div className="mt-8 mb-12">
              {!showPersonaDemo ? (
                <div className="text-center">
                  <button
                    onClick={() => setShowPersonaDemo(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🎭 6개 페르소나별 A2A 시연 보기
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    다양한 고객 유형별로 어떻게 다른 A2A 협업이 이루어지는지 확인해보세요
                  </p>
                </div>
              ) : (
                <div>
                  <PersonaDemoSelector onPersonaSelect={handlePersonaSelect} />
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setShowPersonaDemo(false)}
                      className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                    >
                      ← 간단한 질문하기로 돌아가기
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* A2A 시각화 데모 */}
            <div className="mt-8 mb-12">
              <A2AVisualization
                isActive={isA2AActive}
                currentPersona={selectedPersona?.name}
              />
            </div>

          </div>
        </div>

        {/* 3-Agent 소개 */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            🤖 3명의 AI 전문가가 함께 분석해요
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 컨시어지 매니저 */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🎯</div>
                <h4 className="text-xl font-bold text-blue-800">컨시어지 매니저</h4>
                <p className="text-blue-600 text-sm">전체 상담 프로세스 체계적 관리</p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "걱정마세요! 저는 <span className="font-bold text-blue-700">{dbStatus.totalVehicles.toLocaleString()}대</span>의 중고차 정보를 다 기억하고 있어요.
                당신만을 위한 완벽한 차량을 찾을 때까지 함께 해드릴게요 😊"
              </p>
            </div>

            {/* 니즈 분석 전문가 */}
            <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🔍</div>
                <h4 className="text-xl font-bold text-orange-800">니즈 분석 전문가</h4>
                <p className="text-orange-600 text-sm">CarFin AI 핵심 - 숨은 니즈 완벽 발굴</p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "말씀하신 것 외에도 숨어있는 니즈가 있을 거예요!
                당신의 진짜 라이프스타일을 파악해서 100% 만족할 차량을 찾아드릴게요 🔍"
              </p>
            </div>

            {/* 데이터 분석 전문가 */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">📊</div>
                <h4 className="text-xl font-bold text-green-800">데이터 분석 전문가</h4>
                <p className="text-green-600 text-sm">{dbStatus.totalVehicles.toLocaleString()}+ 매물 + TCO + 금융 분석 올인원</p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "모든 비용을 투명하게 계산해드려요! 보험료, 유지비까지 다 따져서
                진짜 가성비 좋은 '숨은 보석' 매물만 골라드릴게요 💎"
              </p>
            </div>
          </div>
        </div>

        {/* 하단 신뢰성 메시지 */}
        <div className="text-center mt-16 py-8 border-t border-gray-200">
          <p className="text-gray-600 text-lg">
            💝 <strong>딜러 영업 없이 100% 중립적</strong>으로 당신 편에서 도와드려요
          </p>
          <p className="text-gray-500 mt-2">
            걱정 끝! 완전 무료로 끝까지 함께 해드립니다 😊
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Gemini 2.5 Flash + A2A Protocol • 검증된 실제 데이터만 사용
          </p>
        </div>
      </div>
    </div>
  );
}

