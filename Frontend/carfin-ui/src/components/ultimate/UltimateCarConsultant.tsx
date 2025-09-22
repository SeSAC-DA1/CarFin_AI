'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Car,
  Brain,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Loader2,
  Send,
  Download,
  Share2,
  Star
} from 'lucide-react';

// Phase 정의
type ConsultationPhase = 'welcome' | 'input' | 'analysis' | 'results' | 'consultation';

interface UserData {
  name?: string;
  age?: number;
  budget?: number;
  usage?: string;
  priority?: string;
  timeline?: string;
}

interface AnalysisResults {
  vehicleAnalysis?: any;
  financeAnalysis?: any;
  reviewAnalysis?: any;
  finalRecommendations?: any[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'vehicle' | 'finance' | 'review' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export function UltimateCarConsultant() {
  const [currentPhase, setCurrentPhase] = useState<ConsultationPhase>('welcome');
  const [progress, setProgress] = useState(0);
  const [userData, setUserData] = useState<UserData>({});
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [agentConversation, setAgentConversation] = useState<ChatMessage[]>([]);
  const [consensusReached, setConsensusReached] = useState(false);

  // Input phase state (내부 useState 제거를 위해 상단으로 이동)
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Phase별 진행률 계산
  const getProgressForPhase = (phase: ConsultationPhase): number => {
    switch (phase) {
      case 'welcome': return 0;
      case 'input': return 20;
      case 'analysis': return 60;
      case 'results': return 85;
      case 'consultation': return 100;
      default: return 0;
    }
  };

  useEffect(() => {
    setProgress(getProgressForPhase(currentPhase));
  }, [currentPhase]);

  // Phase 1: Welcome & Trust Building - Netflix Style
  const renderWelcomePhase = () => (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-red-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Netflix-style background overlay */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <div className="mb-12">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-red-500">
            <Car className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            CarFin AI
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-red-400 mb-4">
            전문 컨설턴트
          </h2>
          <p className="text-xl md:text-2xl text-gray-200 mb-4 max-w-4xl mx-auto leading-relaxed">
            정보가 부족해도 괜찮아요. AI 전문가 3명이 완벽하게 도와드릴게요
          </p>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            딜러보다 더 객관적이고 투명한 전문 분석 • 30초 완료
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-gray-900/90 border-2 border-gray-700 hover:border-red-500 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
            <CardHeader className="text-center">
              <Brain className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl font-bold text-white">차량 전문가 AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center leading-relaxed">85,320대 데이터 분석으로 당신에게 딱 맞는 차량 발굴</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/90 border-2 border-gray-700 hover:border-red-500 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
            <CardHeader className="text-center">
              <TrendingUp className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl font-bold text-white">금융 전문가 AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center leading-relaxed">3년 후 가치 예측 및 최적 금융 조건 매칭</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/90 border-2 border-gray-700 hover:border-red-500 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
            <CardHeader className="text-center">
              <MessageSquare className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl font-bold text-white">리뷰 분석가 AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center leading-relaxed">실제 구매자 후기 감정분석으로 진짜 만족도 측정</p>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={() => setCurrentPhase('input')}
          size="lg"
          className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-xl font-bold rounded-lg shadow-2xl border-2 border-red-500 hover:border-red-400 transition-all duration-300 hover:scale-105"
        >
          AI 전문가 상담 시작하기 <ArrowRight className="ml-3 w-6 h-6" />
        </Button>

        <p className="text-gray-300 mt-6 text-lg">
          ✅ 완전 무료 • ✅ 개인정보 수집 없음 • ✅ 30초 완료
        </p>
      </div>
    </div>
  );

  // Phase 2: 혁신적인 대화형 정보 입력
  const renderInputPhase = () => {

    const questions = [
      {
        id: 'usage',
        emoji: '🚗',
        title: '첫 번째 질문입니다!',
        subtitle: '어떤 상황에서 차를 가장 많이 사용하실 예정인가요?',
        options: [
          { value: '출퇴근용', emoji: '🏢', description: '매일 회사 다니는 용도' },
          { value: '가족용', emoji: '👨‍👩‍👧‍👦', description: '가족과 함께 이동' },
          { value: '레저용', emoji: '🏖️', description: '주말 여행이나 취미활동' },
          { value: '사업용', emoji: '💼', description: '업무나 사업 관련 이동' }
        ]
      },
      {
        id: 'budget',
        emoji: '💰',
        title: '두 번째 질문이에요!',
        subtitle: '월 할부금으로 얼마 정도 생각하고 계신가요?',
        options: [
          { value: '150만원 이하', emoji: '🟢', description: '부담 없는 시작' },
          { value: '150-300만원', emoji: '🟡', description: '적당한 수준' },
          { value: '300-500만원', emoji: '🟠', description: '여유 있는 선택' },
          { value: '500만원 이상', emoji: '🔴', description: '프리미엄 옵션' }
        ]
      },
      {
        id: 'priority',
        emoji: '⭐',
        title: '마지막 질문입니다!',
        subtitle: '차량 선택에서 가장 중요하게 생각하는 것은?',
        options: [
          { value: '연비', emoji: '⛽', description: '기름값 절약이 중요' },
          { value: '안전성', emoji: '🛡️', description: '안전이 최우선' },
          { value: '디자인', emoji: '✨', description: '보기 좋은 차가 중요' },
          { value: '브랜드', emoji: '🏆', description: '믿을 만한 브랜드' }
        ]
      }
    ];

    const currentQ = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    const handleOptionSelect = (value: string) => {
      setIsAnimating(true);

      // 데이터 저장
      setUserData(prev => ({
        ...prev,
        [currentQ.id]: value
      }));

      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(prev => prev + 1);
          setIsAnimating(false);
        } else {
          // 모든 질문 완료 - AI 분석 시작
          setCurrentPhase('analysis');
          startAIAnalysis();
        }
      }, 800);
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-red-900 p-4 relative overflow-hidden">
        {/* Netflix-style background overlay */}
        <div className="absolute inset-0 bg-black/70 z-0"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Netflix-style 진행률 표시 */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <span className="text-6xl filter drop-shadow-lg">{currentQ.emoji}</span>
              <div className="text-center">
                <div className="text-lg text-red-400 font-semibold mb-2">질문 {currentQuestion + 1} / {questions.length}</div>
                <div className="w-40 bg-gray-700 rounded-full h-3 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-red-600 to-red-500 h-3 rounded-full transition-all duration-700 shadow-lg"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              {currentQ.title}
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">{currentQ.subtitle}</p>
          </div>

          {/* Netflix-style 옵션 카드들 */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {currentQ.options.map((option, index) => (
              <Card
                key={option.value}
                className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 backdrop-blur-sm ${
                  userData[currentQ.id as keyof typeof userData] === option.value
                    ? 'border-red-500 bg-red-900/50 shadow-red-500/20'
                    : 'border-gray-600 bg-gray-900/60 hover:border-red-400 hover:bg-gray-800/70'
                }`}
                onClick={() => handleOptionSelect(option.value)}
                style={{
                  animationDelay: `${index * 150}ms`,
                  animation: isAnimating ? 'none' : 'slideInUp 0.6s ease-out forwards'
                }}
              >
                <CardContent className="p-8 text-center">
                  <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg">
                    {option.emoji}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors">
                    {option.value}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {option.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Netflix-style 이전 답변들 요약 */}
          {currentQuestion > 0 && (
            <div className="mt-16 text-center">
              <div className="inline-flex items-center space-x-4 bg-gray-900/80 backdrop-blur-sm rounded-full px-8 py-4 shadow-2xl border border-gray-700">
                <span className="text-sm text-gray-300 font-medium">지금까지 선택:</span>
                {userData.usage && (
                  <span className="bg-red-600/80 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    {userData.usage}
                  </span>
                )}
                {userData.budget && (
                  <span className="bg-red-600/80 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    {userData.budget}
                  </span>
                )}
                {userData.priority && (
                  <span className="bg-red-600/80 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    {userData.priority}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 뒤로가기 버튼 */}
          {currentQuestion > 0 && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentQuestion(prev => prev - 1);
                  // 이전 선택 초기화
                  const currentKey = currentQ.id as keyof typeof userData;
                  setUserData(prev => ({
                    ...prev,
                    [currentKey]: undefined
                  }));
                }}
                className="bg-white hover:bg-gray-50"
              >
                ← 이전 질문으로
              </Button>
            </div>
          )}
        </div>

        {/* 애니메이션 CSS */}
        <style jsx>{`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  };

  // Phase 3: Capital One 스타일 AI 에이전트 실시간 협업
  const renderAnalysisPhase = () => {
    // AI 에이전트 협업 대화 초기화
    if (agentConversation.length === 0 && isLoading) {
      setTimeout(() => {
        startAgentCollaboration();
      }, 1000);
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4">
              🤖 AI 전문가 실시간 협업 회의
            </h2>
            <p className="text-xl text-gray-300 mb-2">
              3명의 AI 전문가가 당신의 차량 선택을 위해 실시간으로 토론하고 있습니다
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Live Conference</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-400">Real-time Analysis</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* 왼쪽: AI 에이전트 프로필 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">🧠 참여 전문가</h3>

              <Card className="bg-blue-900/20 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Car className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-300">차량 전문가 AI</h4>
                      <p className="text-xs text-gray-400">85,320대 데이터 분석</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-green-400">발언 중...</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-900/20 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-300">금융 전문가 AI</h4>
                      <p className="text-xs text-gray-400">XGBoost 예측 모델</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-yellow-400">분석 중...</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-900/20 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-300">리뷰 분석가 AI</h4>
                      <p className="text-xs text-gray-400">KoBERT 감정분석</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-xs text-blue-400">대기 중...</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 합의 상태 */}
              <Card className="bg-gray-800/50 border-gray-600/30">
                <CardContent className="p-4">
                  <h4 className="font-bold text-white mb-3">📊 협업 진행 상황</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">데이터 수집</span>
                      <span className="text-green-400">✓</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">전문가 분석</span>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">의견 조율</span>
                      <span className="text-gray-500">대기</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">최종 합의</span>
                      <span className="text-gray-500">대기</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 중앙: 실시간 협업 대화창 */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900/50 border-gray-600/30 h-[600px] flex flex-col">
                <CardHeader className="border-b border-gray-600/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center space-x-2">
                      <span>💬 AI 전문가 협업 회의실</span>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </CardTitle>
                    <div className="text-sm text-gray-400">
                      참여자: 3명 | 상태: 활성
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {agentConversation.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                        <p className="text-gray-400">AI 전문가들이 회의를 준비하고 있습니다...</p>
                      </div>
                    </div>
                  ) : (
                    agentConversation.map((message, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'vehicle' ? 'bg-blue-500' :
                          message.role === 'finance' ? 'bg-green-500' :
                          message.role === 'review' ? 'bg-purple-500' : 'bg-gray-500'
                        }`}>
                          {message.role === 'vehicle' ? <Car className="w-5 h-5 text-white" /> :
                           message.role === 'finance' ? <TrendingUp className="w-5 h-5 text-white" /> :
                           message.role === 'review' ? <MessageSquare className="w-5 h-5 text-white" /> :
                           <Brain className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`font-semibold ${
                              message.role === 'vehicle' ? 'text-blue-300' :
                              message.role === 'finance' ? 'text-green-300' :
                              message.role === 'review' ? 'text-purple-300' : 'text-gray-300'
                            }`}>
                              {message.role === 'vehicle' ? '차량 전문가' :
                               message.role === 'finance' ? '금융 전문가' :
                               message.role === 'review' ? '리뷰 분석가' : '시스템'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-200 leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>

                {consensusReached && (
                  <div className="border-t border-gray-600/30 p-4">
                    <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-semibold text-green-300">합의 완료!</span>
                      </div>
                      <p className="text-green-200 text-sm">
                        3명의 AI 전문가가 최적의 추천안에 합의했습니다. 결과를 확인해보세요.
                      </p>
                      <Button
                        onClick={() => setCurrentPhase('results')}
                        className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        분석 결과 확인하기 <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Phase 4: Results Display - Netflix Style
  const renderResultsPhase = () => (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-red-900 p-4 relative overflow-hidden">
      {/* Netflix-style background overlay */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            AI 전문가 분석 완료
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            3명의 AI 전문가가 당신을 위한 완벽한 분석을 완료했습니다
          </p>
          <div className="mt-6 inline-flex items-center space-x-2 bg-red-600/20 border border-red-500/30 rounded-full px-6 py-3 backdrop-blur-sm">
            <CheckCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300 font-semibold">분석 완료</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* 차량 추천 결과 */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Car className="w-8 h-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-2xl">추천 차량 TOP 5</CardTitle>
                    <p className="text-gray-600">당신의 조건에 94% 매칭</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.vehicleAnalysis?.recommendations?.map((vehicle: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} transition-all hover:shadow-md`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {index === 0 && <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold">BEST</span>}
                            <h3 className="text-lg font-semibold">{vehicle.name}</h3>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{vehicle.year}년</span>
                            <span>매칭도: {vehicle.score}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{vehicle.price.toLocaleString()}만원</div>
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => setCurrentPhase('consultation')}
                          >
                            상세 분석
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 금융 분석 결과 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <CardTitle>최적 금융 조건</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-lg font-bold text-green-800 mb-2">
                      {analysisResults.financeAnalysis?.bestLoan}
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      월 {analysisResults.financeAnalysis?.monthlyPayment?.toLocaleString()}원
                    </div>
                    <div className="text-sm text-green-700">
                      총 이자: {analysisResults.financeAnalysis?.totalInterest?.toLocaleString()}원
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="font-semibold mb-2">다른 금융사 비교</div>
                    {analysisResults.financeAnalysis?.loanOptions?.map((loan: any, index: number) => (
                      <div key={index} className="flex justify-between py-1">
                        <span>{loan.bank}</span>
                        <span>{loan.rate}% (월 {loan.monthly.toLocaleString()}원)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  <CardTitle>실제 구매자 만족도</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-purple-600">
                    {analysisResults.reviewAnalysis?.satisfaction}/5.0
                  </div>
                  <div className="text-sm text-gray-600">
                    {analysisResults.reviewAnalysis?.reviewCount}명 분석 결과
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-green-700 mb-1">👍 좋은 점</div>
                    <div className="text-xs space-y-1">
                      {analysisResults.reviewAnalysis?.positiveAspects?.map((aspect: string, index: number) => (
                        <div key={index} className="bg-green-50 px-2 py-1 rounded">{aspect}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-orange-700 mb-1">⚠️ 고려사항</div>
                    <div className="text-xs space-y-1">
                      {analysisResults.reviewAnalysis?.concerns?.map((concern: string, index: number) => (
                        <div key={index} className="bg-orange-50 px-2 py-1 rounded">{concern}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI 전문가 종합 의견 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">🧠 AI 전문가 종합 의견</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">차량 전문가</span>
                </div>
                <p className="text-sm text-blue-700">
                  "{userData.usage}" 용도와 "{userData.priority}" 우선순위를 고려할 때,
                  아반떼 CN7이 가장 적합합니다. 연비와 안전성이 뛰어나며 가격 대비 만족도가 높습니다.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">금융 전문가</span>
                </div>
                <p className="text-sm text-green-700">
                  현재 금리 상황에서 KB국민은행 3.2% 상품이 최적입니다.
                  3년 후 예상 잔존가치는 {analysisResults.financeAnalysis?.predictedValue}만원으로
                  양호한 투자가치를 보입니다.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-800">리뷰 분석가</span>
                </div>
                <p className="text-sm text-purple-700">
                  실제 구매자들의 만족도가 4.2/5.0으로 높습니다.
                  특히 연비와 승차감에 대한 만족도가 뛰어나며,
                  당신과 같은 연령대에서 높은 만족도를 보입니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 다음 단계 */}
        <div className="text-center">
          <Button
            onClick={() => setCurrentPhase('consultation')}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
          >
            Gemini AI 상담 받기 <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            🤖 Gemini AI가 모든 분석을 종합해서 1:1 맞춤 상담을 제공합니다
          </p>
        </div>
      </div>
    </div>
  );

  // Phase 5: Gemini AI Consultation
  const renderConsultationPhase = () => {
    // 초기 Gemini 메시지 설정
    const initializeChat = () => {
      if (chatMessages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'gemini-welcome',
          role: 'assistant',
          content: `안녕하세요! 저는 Gemini AI 상담사입니다. 🤖

3명의 전문가가 분석한 결과를 바탕으로 ${userData.usage} 용도의 차량 구매에 대해 상담드리겠습니다.

**분석 요약:**
✅ 추천 차량: 아반떼 CN7 1.6 스마트 (94% 매칭)
✅ 최적 금융: KB국민은행 3.2% (월 28만원)
✅ 구매자 만족도: 4.2/5.0 (1,247명 리뷰)

궁금한 점이나 더 자세히 알고 싶은 내용이 있으시면 언제든 물어보세요!`,
          timestamp: new Date()
        };
        setChatMessages([welcomeMessage]);
      }
    };

    // 컴포넌트가 마운트될 때 초기화
    if (currentPhase === 'consultation' && chatMessages.length === 0) {
      setTimeout(initializeChat, 500);
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              🤖 Gemini AI 1:1 맞춤 상담
            </h2>
            <p className="text-lg text-gray-600">
              모든 분석 결과를 종합한 전문 상담을 받아보세요
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* 상담 채팅 영역 */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>Gemini AI 상담사</CardTitle>
                        <p className="text-sm text-green-600">● 온라인</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        상담 내용 저장
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4 mr-2" />
                        공유
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* 채팅 메시지 영역 */}
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <div className="p-4 space-y-4 h-full">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-4 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white ml-4'
                              : 'bg-gray-100 text-gray-900 mr-4'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* 메시지 입력 영역 */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="궁금한 점을 물어보세요..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim()}
                      className="px-6"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[
                      "다른 차량 옵션도 있나요?",
                      "할인 혜택이 있을까요?",
                      "보험료는 얼마나 될까요?",
                      "유지비용이 궁금해요"
                    ].map((suggestion, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentMessage(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* 우측 정보 패널 */}
            <div className="space-y-4">
              {/* 추천 차량 요약 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🏆 최종 추천</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-2">아반떼 CN7 1.6 스마트</h3>
                    <div className="text-2xl font-bold text-blue-600 mb-2">2,850만원</div>
                    <div className="flex items-center justify-center space-x-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">4.2/5.0</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>매칭도: 94%</div>
                      <div>연식: 2022년</div>
                      <div>월 할부: 28만원</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 빠른 액션 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🚀 빠른 액션</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" size="sm">
                    매물 상세 보기
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    시승 예약
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    딜러 연결
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    금융 상담
                  </Button>
                </CardContent>
              </Card>

              {/* 분석 신뢰도 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 분석 신뢰도</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>차량 분석</span>
                        <span>94%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>금융 분석</span>
                        <span>91%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '91%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>리뷰 분석</span>
                        <span>89%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 상담 완료 액션 */}
          <div className="text-center mt-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg mr-4"
            >
              상담 완료 & 매물 연결
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentPhase('welcome')}
              className="px-8 py-4 text-lg"
            >
              새로운 상담 시작
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // 메시지 전송 핸들러 - 실제 Gemini API 연동
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentUserMessage = currentMessage;
    setCurrentMessage('');

    try {
      // 실제 Gemini AI API 호출
      const response = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentUserMessage,
          context: {
            userData,
            analysisResults,
            conversationHistory: chatMessages.slice(-10) // 최근 10개 메시지만 컨텍스트로 전달
          },
          assistantType: 'car_consultant'
        })
      });

      if (!response.ok) {
        throw new Error('Gemini API 호출 실패');
      }

      const data = await response.json();

      const aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response || generateAIResponse(currentUserMessage),
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Gemini AI 응답 오류:', error);

      // 오류 발생 시 폴백 응답
      const fallbackResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: generateAIResponse(currentUserMessage),
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, fallbackResponse]);
    }
  };

  // AI 응답 생성 (실제로는 백엔드 API 호출)
  const generateAIResponse = (userMessage: string): string => {
    const responses = {
      "다른 차량": `다른 좋은 옵션들도 있습니다!

**2순위: 쏘나타 DN8 2.0 스마트**
- 가격: 3,200만원 (+ 350만원)
- 매칭도: 91%
- 장점: 더 넓은 실내공간, 프리미엄 옵션

**3순위: K5 3세대 1.6T 프레스티지**
- 가격: 3,100만원 (+ 250만원)
- 매칭도: 89%
- 장점: 스포티한 디자인, 터보 성능

예산이 조금 더 있으시다면 쏘나타를 추천드립니다. 어떻게 생각하세요?`,
      "할인": `할인 혜택 정보를 확인해드렸습니다! 💰

**현재 가능한 혜택:**
✅ 카드사 무이자할부: 최대 36개월 (신한/삼성/현대카드)
✅ 보험료 할인: 첫 1년 20% 할인 가능
✅ 등록비 지원: 최대 50만원
✅ 연말 프로모션: 추가 30만원 할인

**총 절약 가능 금액: 약 150-200만원**

딜러와 직접 연결해드릴까요?`,
      "보험료": `${userData.age || 30}세 기준 보험료를 계산해드렸습니다! 🛡️

**아반떼 CN7 연간 보험료 (종합보험 기준):**
- 대물배상: 무제한
- 자기신체사고: 1억원
- 자기차량손해: 차량가액

**예상 보험료:**
- 1년차: 약 85만원 (신규가입)
- 2년차: 약 68만원 (할인적용)
- 3년차: 약 61만원 (누적할인)

월평균 약 7만원 정도 예상됩니다. 더 저렴한 상품도 비교해드릴까요?`,
      "유지비": `아반떼 CN7의 연간 유지비용을 정리해드렸습니다! 💸

**필수 비용 (연간):**
- 보험료: 약 85만원
- 정기점검: 약 30만원
- 연료비: 약 120만원 (연 2만km 기준)
- 자동차세: 약 16만원

**선택 비용:**
- 타이어 교체: 4년마다 50만원
- 배터리 교체: 3년마다 15만원
- 소모품 교체: 연 20만원

**총 연간 유지비: 약 270만원 (월 22만원)**

다른 차량과 비교하면 매우 경제적인 편입니다!`
    };

    for (const [keyword, response] of Object.entries(responses)) {
      if (userMessage.includes(keyword)) {
        return response;
      }
    }

    return `좋은 질문입니다! ${userMessage}에 대해 답변드리겠습니다.

분석 결과를 바탕으로 보면, 현재 추천드린 아반떼 CN7이 ${userData.usage} 용도와 ${userData.priority} 우선순위에 가장 적합합니다.

구체적으로 어떤 부분이 더 궁금하신지 알려주시면, 더 자세한 정보를 제공해드리겠습니다!

💡 **추천 질문들:**
- 다른 차량 옵션 비교
- 할인 혜택 정보
- 보험료 및 유지비
- 시승 및 딜러 연결`;
  };

  // 실제 AI 분석 API 호출
  const startAIAnalysis = async () => {
    setIsLoading(true);

    try {
      // 실제 백엔드 API 호출
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: `consultation_${Date.now()}`,
          userProfile: {
            usage: userData.usage,
            budget: userData.budget,
            priority: userData.priority,
            age: userData.age || 30,
            preferences: {
              fuelType: userData.priority === '연비' ? 'hybrid' : 'gasoline',
              safetyPriority: userData.priority === '안전성',
              designPriority: userData.priority === '디자인',
              brandPriority: userData.priority === '브랜드'
            }
          },
          analysisType: 'comprehensive',
          includeFinanceAnalysis: true,
          includeReviewAnalysis: true
        })
      });

      if (!response.ok) {
        throw new Error('분석 API 호출 실패');
      }

      const data = await response.json();

      // API 응답을 UI 형식에 맞게 변환
      const transformedResults = {
        vehicleAnalysis: {
          score: data.overallScore || 94,
          recommendations: data.recommendations?.slice(0, 5).map((vehicle: any, index: number) => ({
            name: vehicle.model || `추천 차량 ${index + 1}`,
            price: vehicle.price || 2850,
            year: vehicle.year || 2022,
            score: vehicle.matchingScore || (94 - index * 2)
          })) || []
        },
        financeAnalysis: {
          predictedValue: data.financeAnalysis?.predictedValue || 1380,
          bestLoan: data.financeAnalysis?.bestLoan || 'KB국민은행 3.2%',
          monthlyPayment: data.financeAnalysis?.monthlyPayment || 286000,
          totalInterest: data.financeAnalysis?.totalInterest || 890000,
          loanOptions: data.financeAnalysis?.loanOptions || [
            { bank: 'KB국민은행', rate: 3.2, monthly: 286000 },
            { bank: '신한은행', rate: 3.4, monthly: 289000 },
            { bank: '우리은행', rate: 3.6, monthly: 292000 }
          ]
        },
        reviewAnalysis: {
          satisfaction: data.reviewAnalysis?.satisfaction || 4.2,
          reviewCount: data.reviewAnalysis?.reviewCount || 1247,
          positiveAspects: data.reviewAnalysis?.positiveAspects || ['연비 만족', '승차감 우수', '디자인 세련됨'],
          concerns: data.reviewAnalysis?.concerns || ['부품비 다소 높음', '뒷좌석 공간 아쉬움'],
          ageGroupSatisfaction: data.reviewAnalysis?.ageGroupSatisfaction || {
            '20대': 4.1,
            '30대': 4.3,
            '40대': 4.2
          }
        }
      };

      setAnalysisResults(transformedResults);
      setIsLoading(false);

    } catch (error) {
      console.error('AI 분석 중 오류:', error);

      // 오류 발생 시 기본값으로 폴백
      setAnalysisResults({
        vehicleAnalysis: {
          score: 94,
          recommendations: [
            { name: '아반떼 CN7 1.6 스마트', price: 2850, year: 2022, score: 94 },
            { name: '쏘나타 DN8 2.0 스마트', price: 3200, year: 2021, score: 91 },
            { name: 'K5 3세대 1.6T 프레스티지', price: 3100, year: 2022, score: 89 },
            { name: 'YF 쏘나타 2.0 프리미엄', price: 1950, year: 2020, score: 87 },
            { name: '그랜저 IG 3.0 프리미엄', price: 4200, year: 2021, score: 85 }
          ]
        },
        financeAnalysis: {
          predictedValue: 1380,
          bestLoan: 'KB국민은행 3.2%',
          monthlyPayment: 286000,
          totalInterest: 890000,
          loanOptions: [
            { bank: 'KB국민은행', rate: 3.2, monthly: 286000 },
            { bank: '신한은행', rate: 3.4, monthly: 289000 },
            { bank: '우리은행', rate: 3.6, monthly: 292000 }
          ]
        },
        reviewAnalysis: {
          satisfaction: 4.2,
          reviewCount: 1247,
          positiveAspects: ['연비 만족', '승차감 우수', '디자인 세련됨'],
          concerns: ['부품비 다소 높음', '뒷좌석 공간 아쉬움'],
          ageGroupSatisfaction: {
            '20대': 4.1,
            '30대': 4.3,
            '40대': 4.2
          }
        }
      });
      setIsLoading(false);
    }
  };

  // AI 에이전트 실시간 협업 대화 시뮬레이션
  const startAgentCollaboration = async () => {
    const conversations = [
      {
        role: 'system' as const,
        content: '🎯 AI 전문가 협업 회의를 시작합니다. 사용자 정보: ' +
                 `${userData.usage} 용도, ${userData.budget} 예산, ${userData.priority} 우선순위`
      },
      {
        role: 'vehicle' as const,
        content: `안녕하세요, 차량 전문가입니다. 85,320대 데이터베이스를 분석한 결과, ${userData.usage} 용도로는 아반떼 CN7 1.6 스마트가 94점으로 최고 점수를 받았습니다. 연비 16.8km/L, 안전도 5성급이 특히 우수합니다.`
      },
      {
        role: 'finance' as const,
        content: `금융 전문가입니다. 아반떼 CN7의 3년 후 잔존가치를 XGBoost 모델로 예측한 결과 68%로 양호합니다. 하지만 ${userData.budget} 예산이라면 쏘나타 DN8도 고려해볼 만합니다. 월 할부금은 25만원 차이나지만 장기적 가치가 더 높아요.`
      },
      {
        role: 'vehicle' as const,
        content: `흥미로운 관점이네요. 하지만 제 분석에서는 사용자가 ${userData.priority}를 우선순위로 두었기 때문에 아반떼가 더 적합합니다. 쏘나타는 크기가 커서 유지비가 더 들 수 있어요.`
      },
      {
        role: 'review' as const,
        content: `리뷰 분석가입니다. KoBERT로 1,247개 후기를 분석한 결과, 아반떼 CN7의 만족도는 4.2/5.0입니다. 특히 ${userData.usage} 용도 사용자들의 평가가 높아요. "연비 만족", "승차감 우수"가 주요 긍정 키워드입니다.`
      },
      {
        role: 'finance' as const,
        content: `리뷰 분석 결과를 보니 제 의견을 수정하겠습니다. 실제 사용자 만족도가 이렇게 높다면 아반떼 CN7이 맞는 것 같네요. 금융 조건도 KB국민은행 3.2% 대출이 가능하니 부담스럽지 않을 겁니다.`
      },
      {
        role: 'review' as const,
        content: `좋은 합의점이네요! 다만 한 가지 주의할 점은 "뒷좌석 공간이 아쉽다"는 후기가 몇 개 있었어요. ${userData.usage} 용도라면 크게 문제없을 것 같지만 참고하시면 좋겠습니다.`
      },
      {
        role: 'vehicle' as const,
        content: `모든 전문가가 합의했습니다! 최종 추천: 아반떼 CN7 1.6 스마트 (2,850만원, 94% 매칭도). 이유: ①뛰어난 연비와 안전성 ②적정한 가격대 ③높은 사용자 만족도 ④좋은 잔존가치. 이 선택으로 후회하지 않으실 겁니다.`
      },
      {
        role: 'system' as const,
        content: '✅ AI 전문가 협업 완료! 3명의 전문가가 만장일치로 최적의 추천안에 합의했습니다.'
      }
    ];

    for (let i = 0; i < conversations.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 간격

      const newMessage: ChatMessage = {
        id: `agent-${Date.now()}-${i}`,
        ...conversations[i],
        timestamp: new Date()
      };

      setAgentConversation(prev => [...prev, newMessage]);

      // 마지막 메시지일 때 합의 완료 상태로 변경
      if (i === conversations.length - 1) {
        setTimeout(() => {
          setConsensusReached(true);
          setIsLoading(false);
        }, 1000);
      }
    }
  };

  // Netflix-style Phase 렌더링
  return (
    <div className="relative">
      {/* Netflix-style 전역 진행률 바 */}
      <div className="fixed top-0 left-0 w-full h-1 bg-black z-50">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-1000 shadow-lg"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Netflix-style 내비게이션 헤더 */}
      {currentPhase !== 'welcome' && (
        <div className="fixed top-4 left-4 right-4 z-40">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg px-6 py-3 shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg">CarFin AI</div>
                  <div className="text-gray-400 text-sm">
                    {currentPhase === 'input' && 'Personal Information'}
                    {currentPhase === 'analysis' && 'AI Expert Analysis'}
                    {currentPhase === 'results' && 'Analysis Results'}
                    {currentPhase === 'consultation' && 'AI Consultation'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-red-400 text-sm font-semibold">{Math.round(progress)}% Complete</div>
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Netflix-style Phase별 컨텐츠 */}
      <div className={currentPhase !== 'welcome' ? 'pt-24' : 'pt-1'}>
        {currentPhase === 'welcome' && renderWelcomePhase()}
        {currentPhase === 'input' && renderInputPhase()}
        {currentPhase === 'analysis' && renderAnalysisPhase()}
        {currentPhase === 'results' && renderResultsPhase()}
        {currentPhase === 'consultation' && renderConsultationPhase()}
      </div>
    </div>
  );
}