'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicVehicleScanning } from '@/components/toss-style/DynamicVehicleScanning';
import {
  Car,
  Brain,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface UserData {
  category?: 'economy' | 'family' | 'hobby';
  usage?: string;
  budget?: string;
  priority?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'vehicle' | 'finance' | 'review' | 'system';
  content: string;
  timestamp: Date;
}

interface AnalysisPhaseProps {
  userData: UserData;
  onAnalysisComplete: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isTossStyleMatching?: boolean;
}

export function AnalysisPhase({
  userData,
  onAnalysisComplete,
  isLoading,
  setIsLoading,
  isTossStyleMatching = false
}: AnalysisPhaseProps) {
  const [agentConversation, setAgentConversation] = useState<ChatMessage[]>([]);
  const [consensusReached, setConsensusReached] = useState(false);

  // AI 에이전트 협업 대화 초기화
  useEffect(() => {
    if (agentConversation.length === 0 && isLoading) {
      setTimeout(() => {
        startAgentCollaboration();
      }, 1000);
    }
  }, [agentConversation.length, isLoading]);

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

  // 토스 스타일 역동적 스캐닝 화면
  if (isTossStyleMatching && userData.category) {
    return (
      <DynamicVehicleScanning
        category={userData.category}
        onScanComplete={() => {
          setIsLoading(false);
          onAnalysisComplete();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 text-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">
            🤖 AI 전문가 실시간 협업 분석
          </h2>
          <p className="text-xl text-gray-700 mb-2">
            3명의 AI 전문가가 당신의 차량 선택을 위해 실시간으로 분석하고 있습니다
          </p>
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">실시간 분석</span>
            </div>
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-700 font-medium">전문가 협업</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 왼쪽: AI 에이전트 프로필 */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🧠 참여 전문가</h3>

            <Card className="bg-blue-50/80 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-700">차량 전문가 AI</h4>
                    <p className="text-xs text-gray-600">85,000+ 매물 데이터 분석</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">분석 중</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50/80 border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-700">금융 전문가 AI</h4>
                    <p className="text-xs text-gray-600">LSTM+XGBoost 예측 모델</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-600 font-medium">계산 중</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50/80 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-700">리뷰 분석가 AI</h4>
                    <p className="text-xs text-gray-600">KoBERT 한국어 감정분석</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-xs text-orange-600 font-medium">대기 중</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 합의 상태 */}
            <Card className="bg-white/90 border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-bold text-gray-900 mb-3">📊 분석 진행 상황</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">데이터 수집</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">전문가 분석</span>
                    {consensusReached ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">의견 조율</span>
                    {consensusReached ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">대기</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">최종 합의</span>
                    {consensusReached ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">대기</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 중앙: 실시간 협업 대화창 */}
          <div className="lg:col-span-2">
            <Card className="bg-white/95 border-gray-200 h-[600px] flex flex-col shadow-lg">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 flex items-center space-x-2">
                    <span>💬 AI 전문가 분석 진행 상황</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </CardTitle>
                  <div className="text-sm text-gray-600">
                    참여자: 3명 | 상태: 분석 중
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
                            message.role === 'vehicle' ? 'text-blue-700' :
                            message.role === 'finance' ? 'text-green-700' :
                            message.role === 'review' ? 'text-purple-700' : 'text-gray-700'
                          }`}>
                            {message.role === 'vehicle' ? '차량 전문가' :
                             message.role === 'finance' ? '금융 전문가' :
                             message.role === 'review' ? '리뷰 분석가' : '시스템'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>

              {consensusReached && (
                <div className="border-t border-gray-200 p-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-700">합의 완료!</span>
                    </div>
                    <p className="text-green-600 text-sm">
                      3명의 AI 전문가가 최적의 추천안에 합의했습니다. 결과를 확인해보세요.
                    </p>
                    <Button
                      onClick={onAnalysisComplete}
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
}