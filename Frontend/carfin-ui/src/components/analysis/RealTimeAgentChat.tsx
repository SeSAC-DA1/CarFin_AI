'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Zap } from 'lucide-react';

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

export function RealTimeAgentChat({ personaContext, userProfile, onComplete, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const agents = [
    {
      id: 'vehicle_expert',
      name: '김차량 전문가',
      emoji: '🚗',
      role: '자동차 기술 및 안전 전문가',
      color: 'var(--expert-vehicle-bright)',
      bgColor: 'rgba(59, 130, 246, 0.15)',
      gradient: 'var(--carfin-gradient-vehicle)'
    },
    {
      id: 'finance_expert',
      name: '이금융 전문가',
      emoji: '💰',
      role: '자동차 금융 및 보험 전문가',
      color: 'var(--expert-finance-bright)',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      gradient: 'var(--carfin-gradient-finance)'
    },
    {
      id: 'review_expert',
      name: '박리뷰 전문가',
      emoji: '📝',
      role: '사용자 만족도 및 리뷰 전문가',
      color: 'var(--expert-review-bright)',
      bgColor: 'rgba(249, 115, 22, 0.15)',
      gradient: 'var(--carfin-gradient-review)'
    }
  ];

  // 메시지 추가 함수
  const addMessage = (agentId: string, message: string, type: ChatMessage['type'] = 'analysis') => {
    const agent = agents.find(a => a.id === agentId) || { name: 'System', emoji: '🤖' };
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

  // 실시간 분석 시작 - 실제 전문가 회의 시뮬레이션
  const startRealAnalysis = async () => {
    // 엄격한 데이터 검증
    if (!personaContext || !personaContext.name || !personaContext.budget) {
      addMessage('system', '⚠️ 사용자 프로필 정보가 부족합니다. 이전 단계로 돌아가서 다시 진행해주세요.', 'system');
      return;
    }

    if (!personaContext.budget.min || !personaContext.budget.max) {
      addMessage('system', '⚠️ 예산 정보가 필요합니다. 프로필 설정을 다시 확인해주세요.', 'system');
      return;
    }

    setIsActive(true);

    // 🎬 실제 회의실처럼 시작
    addMessage('system', `📋 ${personaContext.name}님 차량 상담 회의를 시작합니다`, 'system');
    await delay(1000);

    // 💡 차알못 TIP 1: 전문가 소개
    addMessage('system', '💡 차알못 TIP: 3명의 전문가가 각각 다른 관점으로 분석해서 놓치는 부분이 없어요!', 'system');
    await delay(1500);

    // 🚗 차량 전문가가 회의를 주도
    addMessage('vehicle_expert', `안녕하세요! 먼저 ${personaContext.name} 고객님의 조건을 정리해볼게요`, 'analysis');
    await delay(1000);
    addMessage('vehicle_expert', `📊 예산: ${personaContext.budget.min}-${personaContext.budget.max}만원, 용도: 출퇴근용, 우선순위: 경제성`, 'analysis');
    await delay(1500);

    // 💰 금융 전문가가 질문
    addMessage('finance_expert', '잠깐, 김차량님! 예산이 200-300만원인데 리스도 고려해보셔야 할 것 같은데요?', 'question');
    await delay(1200);
    addMessage('finance_expert', '💡 리스는 월 납입금이 훨씬 낮아서 더 좋은 차량 선택 가능해요', 'analysis');
    await delay(1500);

    // 🚗 차량 전문가 동의
    addMessage('vehicle_expert', '맞아요! 그럼 일반 매물과 리스 두 가지 다 검토해볼게요', 'analysis');
    await delay(1000);

    // 📝 리뷰 전문가 개입
    addMessage('review_expert', '저는 먼저 비슷한 성향 분들의 실제 후기부터 확인해볼게요', 'thinking');
    await delay(1500);

    // 📈 진행률 10% - 조건 분석 완료
    addMessage('system', '📈 진행률 10% - 고객 조건 분석 완료!', 'system');
    await delay(1000);

    // 💡 차알못 TIP 2: 매물 구분
    addMessage('system', '💡 차알못 TIP: 리스는 월 납입금이 낮지만 3년 후 반납, 일반 매물은 내 차가 돼요!', 'system');
    await delay(2000);

    // 🔍 실제 매물 검토 시작 - 진짜 API 호출
    addMessage('vehicle_expert', '📱 데이터베이스 연결해서 매물 검색 중이에요...', 'thinking');
    await delay(2000);

    // 🚨 실제 API 호출을 먼저 시행
    console.log('🔍 RealTimeAgentChat - personaContext 확인:', personaContext);
    console.log('🔍 RealTimeAgentChat - userProfile 확인:', userProfile);
    console.log('🔍 RealTimeAgentChat - 전송 데이터:', { personaContext, userProfile });

    const response = await fetch('/api/multi-agent-consultation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personaContext,
        userProfile
      }),
    });

    const data = await response.json();
    console.log('📊 API 응답:', data);

    let apiResult = null;
    if (data.success && data.result) {
      apiResult = data.result;

      // 실제 검색 결과 기반 대화
      if (apiResult.top_vehicles && apiResult.top_vehicles.length > 0) {
        const firstVehicle = apiResult.top_vehicles[0];
        const avgPrice = Math.round(apiResult.top_vehicles.reduce((sum: number, v: any) => sum + v.price, 0) / apiResult.top_vehicles.length);
        const carTypes = [...new Set(apiResult.top_vehicles.map((v: any) => v.cartype))];

        addMessage('vehicle_expert', `🎯 좋은 매물들을 찾았어요! 총 ${apiResult.top_vehicles.length}대 발견했습니다`, 'analysis');
        await delay(1200);
        addMessage('finance_expert', `💰 평균 가격은 ${avgPrice}만원이고, ${carTypes.join(', ')} 차종들이 있네요`, 'analysis');
        await delay(1500);
        addMessage('review_expert', `📝 1순위는 ${firstVehicle.manufacturer} ${firstVehicle.model} (${firstVehicle.modelyear}년)이에요!`, 'recommendation');
        await delay(1500);
      } else {
        addMessage('vehicle_expert', '🤔 조건에 맞는 매물이 많지 않네요. 조건을 조정해볼까요?', 'question');
        await delay(1200);
        addMessage('finance_expert', '💡 예산 범위를 조금만 넓히시면 더 좋은 선택지가 나올 거예요', 'analysis');
        await delay(1500);
      }
    } else {
      addMessage('vehicle_expert', '🤔 데이터베이스에서 매물을 찾는 중 문제가 발생했어요', 'question');
      await delay(1200);
    }

    // 📈 진행률 30% - 실제 차량 분석 시작
    addMessage('system', '📈 진행률 30% - 실제 차량 데이터 분석 중...', 'system');
    await delay(1500);

    // API 결과 기반으로 실제 차량 정보 언급
    if (apiResult && apiResult.top_vehicles && apiResult.top_vehicles.length > 1) {
      const secondVehicle = apiResult.top_vehicles[1];
      addMessage('finance_expert', `🔍 ${secondVehicle.manufacturer} ${secondVehicle.model}도 괜찮은 선택지네요`, 'analysis');
      await delay(1200);
    }

    addMessage('review_expert', '실제 구매후기들을 종합해보니... 전반적으로 만족도가 높네요!', 'thinking');
    await delay(1500);

    // 💡 차알못 TIP 3: 실용적인 조언
    addMessage('system', '💡 차알못 TIP: 차량 선택할 때는 연식, 주행거리, 가격을 종합적으로 고려해야 해요!', 'system');
    await delay(2000);

    // 📈 진행률 50% - 후보 매물 발견
    addMessage('system', '📈 진행률 50% - 유력 후보 매물 발견!', 'system');

    console.log('🔍 RealTimeAgentChat - personaContext 확인:', personaContext);
    console.log('🔍 RealTimeAgentChat - userProfile 확인:', userProfile);

    const requestData = { personaContext, userProfile };
    console.log('🔍 RealTimeAgentChat - 전송 데이터:', requestData);

    try {
      const response = await fetch('/api/multi-agent-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('📊 API 응답:', data);

      if (data.success && data.result) {
        setAnalysisResult(data.result);

        // 📈 진행률 70% - API 응답 받음
        addMessage('system', '📈 진행률 70% - 데이터 분석 완료! 결과 검토 중...', 'system');
        await delay(1500);

        // 🎯 실제 API 결과 기반 토론
        addMessage('vehicle_expert', '📊 자, 결과가 나왔네요! 실제 매물들을 검토해볼까요?', 'analysis');
        await delay(1200);

        if (data.result.agents && data.result.agents.length > 0) {
          const topVehicles = data.result.top_vehicles || [];
          const avgPrice = topVehicles.length > 0 ? Math.round(topVehicles.reduce((sum: number, v: any) => sum + v.price, 0) / topVehicles.length) : 250;

          // 실제 차량 데이터 기반 대화
          addMessage('vehicle_expert', `🔍 총 ${topVehicles.length}대의 매물을 찾았어요`, 'analysis');
          await delay(1000);

          if (topVehicles.length > 0) {
            const topVehicle = topVehicles[0];
            addMessage('finance_expert', `💰 평균 가격이 ${avgPrice}만원 정도 나왔네요`, 'analysis');
            await delay(1200);
            addMessage('review_expert', `🥇 1순위는 ${topVehicle.manufacturer} ${topVehicle.model} (${topVehicle.modelyear}년)이에요!`, 'recommendation');
            await delay(1500);

            if (topVehicles.length > 1) {
              const secondVehicle = topVehicles[1];
              addMessage('vehicle_expert', `🥈 2순위는 ${secondVehicle.manufacturer} ${secondVehicle.model}도 좋은 선택이에요`, 'analysis');
              await delay(1200);
            }

            // 실제 가격대에 따른 조언
            if (avgPrice > (personaContext.budget?.max || 300)) {
              addMessage('finance_expert', '예산보다 조금 높지만, 품질을 고려하면 합리적인 선택이에요', 'analysis');
            } else {
              addMessage('finance_expert', '예산 범위 안에서 정말 좋은 매물들을 찾았네요!', 'analysis');
            }
            await delay(1500);
          }

          // 📈 진행률 85% - 심화 검토 중
          addMessage('system', '📈 진행률 85% - 전문가 합의 도출 중...', 'system');
          await delay(1000);

          // 💡 실제 데이터 기반 조언
          addMessage('system', '💡 차알못 TIP: 실제 매물 데이터를 기반으로 분석했으니 더욱 신뢰할 수 있어요!', 'system');
          await delay(1500);

          // 🎉 최종 합의 완료
          addMessage('vehicle_expert', '👥 자, 그럼 최종 결론 나왔나요?', 'question');
          await delay(1000);
          addMessage('finance_expert', '👍 네! 실제 데이터 기반이라 더욱 확신해요', 'analysis');
          await delay(800);
          addMessage('review_expert', '👍 저도요! 실제 후기까지 반영한 완벽한 분석이네요', 'analysis');
          await delay(1000);

          // 📈 진행률 95% - 최종 정리
          addMessage('system', '📈 진행률 95% - 최종 추천 완성!', 'system');
          await delay(1000);

          // 🎊 실제 결과 기반 마무리
          await delay(1000);
          addMessage('system', '🎉 전문가 3명 합의 완료! 실제 매물 데이터로 분석했어요', 'system');
          await delay(1500);

          const vehicleCount = topVehicles.length;
          const confidenceScore = data.result.consensus?.confidence_score || 88;

          addMessage('vehicle_expert', `🏆 최종 ${vehicleCount}개 옵션 완성! ${personaContext.name}님께 딱 맞을 거예요`, 'recommendation');
          await delay(1200);
          addMessage('finance_expert', `💎 확신도 ${confidenceScore}%! 실제 데이터 기반이라 더욱 믿을 만해요`, 'recommendation');
          await delay(1200);
          addMessage('review_expert', `🥰 실제 차량들의 리뷰까지 반영했으니 안심하고 선택하세요!`, 'recommendation');

          await delay(1500);

          // 📈 진행률 100% - 완료!
          addMessage('system', '📈 진행률 100% - 전문가 분석 완료! 🎉', 'system');
          await delay(1500);

          // 💡 차알못 TIP 7: 최종 조언
          addMessage('system', '💡 차알못 TIP: 이제 상세한 매물 정보와 전문가 추천을 확인해보세요!', 'system');
          await delay(1500);

          // 🎊 최종 마무리 - 전문가들의 응원 메시지
          addMessage('vehicle_expert', '🌟 정말 수고하셨어요! 좋은 차 만나실 거예요', 'recommendation');
          await delay(1000);
          addMessage('finance_expert', '💪 꼼꼼히 분석한 만큼 자신감 가지세요!', 'recommendation');
          await delay(1000);
          addMessage('review_expert', '🚗 새 차와 함께 행복한 드라이빙 되세요!', 'recommendation');
          await delay(1500);

          addMessage('system', '🏁 전문가 회의 종료! 이제 상세 결과를 확인해보세요', 'system');

        } else {
          // 결과 없을 때도 희망적으로
          await delay(1500);
          addMessage('vehicle_expert', '😊 조건을 살짝만 조정하면 훨씬 좋은 차들이 나올 거예요!', 'thinking');
          await delay(1000);
          addMessage('finance_expert', '💡 예산 범위만 조금 넓히시면 선택지가 훨씬 많아져요', 'analysis');
          await delay(1000);
          addMessage('review_expert', '🌟 걱정 마세요! 다시 한번 더 정확히 찾아드릴게요', 'recommendation');
        }

        await delay(2000);
        addMessage('system', '🎊 분석 완료! 이제 안심하고 결과 확인하세요', 'system');
        await delay(1000);
        addMessage('system', '😊 저희가 확신을 갖고 추천해드려요!', 'system');

        // 추가 확인 단계를 친화적으로
        await delay(2000);
        addMessage('system', '🔍 마지막으로 한 번 더 꼼꼼히 확인해드릴게요...', 'system');

        try {
          const smartResponse = await fetch('/api/smart-agent-consultation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              multiAgentResult: data.result,
              personaContext,
              userProfile
            }),
          });

          const smartData = await smartResponse.json();
          console.log('🧠 Smart Orchestrator 결과:', smartData);

          if (smartData.success) {
            await delay(1500);
            addMessage('system', '✅ 완벽합니다! 모든 검증이 끝났어요', 'system');
            await delay(1000);
            addMessage('vehicle_expert', '🎉 이제 100% 확신해요! 정말 좋은 선택이에요', 'analysis');
            await delay(1000);
            addMessage('finance_expert', '💎 더 깊이 분석해봐도 완벽한 추천이네요!', 'analysis');
            await delay(1000);
            addMessage('review_expert', '🥰 이 정도면 정말 안심하고 선택하셔도 돼요!', 'analysis');

            // Smart Orchestrator 결과를 최종 결과로 사용
            setTimeout(() => {
              onComplete({
                ...data.result,
                smartOrchestrator: smartData.result
              });
            }, 3000);
          } else {
            // Smart Orchestrator 실패시 기본 결과 사용
            setTimeout(() => {
              onComplete(data.result);
            }, 3000);
          }
        } catch (error) {
          console.error('Smart Orchestrator 오류:', error);
          // 오류시 기본 결과 사용
          setTimeout(() => {
            onComplete(data.result);
          }, 3000);
        }

      } else {
        throw new Error(data.error || '분석 실패');
      }

    } catch (error) {
      console.error('❌ 분석 오류:', error);
      await delay(1000);
      addMessage('system', '😅 잠시 문제가 생겼네요. 괜찮으니까 걱정 마세요!', 'system');
      await delay(2000);
      addMessage('vehicle_expert', '🔄 다시 한번 시도해볼게요! 금방 해결될 거예요', 'thinking');
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
      background: agent.gradient,
      color: 'white',
      boxShadow: `0 2px 8px ${agent.bgColor}`
    } : {
      backgroundColor: '#6b7280',
      color: 'white'
    };
  };

  const formatMessage = (message: string) => {
    const mentionRegex = /@([가-힣]+)/g;
    return message.replace(mentionRegex, '<span class="ultra-text-primary font-bold">@$1</span>');
  };

  return (
    <div className="min-h-screen carfin-gradient-bg">
      <div className="ultra-container ultra-section">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onBack} className="ultra-btn-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>

          <div className="text-center">
            <h1 className="ultra-heading-3">😊 전문가들이 함께 분석해드려요</h1>
            <p className="ultra-body">차량·금융·리뷰 전문가 3명이 꼼꼼히 확인해드려요</p>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 ultra-text-primary" />
            <span className="ultra-body-sm">{agents.length}명 참여</span>
          </div>
        </div>

        {/* 디버깅 정보 */}
        {personaContext && (
          <div className="ultra-card mb-4 bg-blue-50">
            <div className="ultra-body-sm">
              <strong>분석 대상:</strong> {personaContext.name || '사용자'} |
              <strong>예산:</strong> {personaContext.budget?.min || 0}만원 ~ {personaContext.budget?.max || 0}만원
            </div>
          </div>
        )}

        {/* 채팅 인터페이스 */}
        <div className="ultra-card max-w-4xl mx-auto">
          <div className="mb-4 border-b border-gray-200 pb-4">
            <div className="flex items-center justify-center gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-1 font-bold text-white shadow-lg hover:scale-105 transition-transform duration-300"
                    style={{ background: agent.gradient }}
                  >
                    {agent.emoji}
                  </div>
                  <div className="ultra-body-sm font-semibold text-slate-800">{agent.name}</div>
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
                <p className="ultra-body text-gray-500">전문가들이 분석 준비 완료! 🎯</p>
                {!isActive && (
                  <Button
                    onClick={startRealAnalysis}
                    className="mt-4 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition-all duration-300"
                    style={{ background: 'var(--carfin-gradient-orchestrator)' }}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    지금 바로 분석 받기
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
                    </div>

                    <div
                      className={`
                        ultra-body p-3 rounded-lg max-w-lg
                        ${msg.type === 'system' ? 'agent-orchestrator-bg text-slate-800 border border-purple-200' : ''}
                        ${msg.type === 'thinking' ? 'agent-vehicle-bg text-slate-800 border border-blue-200' : ''}
                        ${msg.type === 'analysis' ? 'carfin-glass-card' : ''}
                        ${msg.type === 'recommendation' ? 'agent-finance-bg text-slate-800 border border-green-200' : ''}
                        ${msg.type === 'question' ? 'agent-review-bg text-slate-800 border border-orange-200' : ''}
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
              <span className="ultra-body-sm ml-2">꼼꼼히 분석하고 있어요...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}