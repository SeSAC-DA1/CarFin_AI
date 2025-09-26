// A2AVisualization.tsx - 실시간 Agent-to-Agent 협업 시각화 컴포넌트

import React, { useState, useEffect } from 'react';

interface A2AEvent {
  type: 'agent_question' | 'agent_answer' | 'agent_response' | 'pattern_detected' | 'collaboration_complete';
  agentId: string;
  content: string;
  timestamp: Date;
  metadata?: {
    targetAgent?: string;
    pattern?: { type: string };
    persona?: string;
    round?: number;
  };
}

interface A2AVisualizationProps {
  isActive: boolean;
  currentPersona?: string;
}

const agentInfo = {
  concierge: {
    name: '컨시어지 매니저',
    emoji: '👨‍💼',
    color: 'blue',
    role: '전체 상담 관리'
  },
  needs_analyst: {
    name: '니즈 분석 전문가',
    emoji: '🧠',
    color: 'purple',
    role: '숨은 니즈 발굴'
  },
  data_analyst: {
    name: '데이터 분석 전문가',
    emoji: '📊',
    color: 'green',
    role: '최적 차량 검색'
  }
};

export default function A2AVisualization({ isActive, currentPersona }: A2AVisualizationProps) {
  const [collaborationEvents, setCollaborationEvents] = useState<A2AEvent[]>([]);
  const [activeConnections, setActiveConnections] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState(0);

  // 실시간 A2A 이벤트 시뮬레이션
  useEffect(() => {
    if (!isActive) return;

    const simulateA2AEvents = () => {
      const events: A2AEvent[] = [
        {
          type: 'pattern_detected',
          agentId: 'system',
          content: currentPersona ? `${currentPersona} 페르소나 패턴 감지됨` : '고객 패턴 분석 완료',
          timestamp: new Date(),
          metadata: { pattern: { type: currentPersona || 'general' } }
        },
        {
          type: 'agent_question',
          agentId: 'concierge',
          content: '고객님 상황 분석 완료. 니즈 분석 의뢰드립니다',
          timestamp: new Date(),
          metadata: { targetAgent: 'needs_analyst', round: 1 }
        },
        {
          type: 'agent_answer',
          agentId: 'needs_analyst',
          content: '숨은 니즈 파악 완료. 데이터 분석 의뢰합니다',
          timestamp: new Date(),
          metadata: { round: 1 }
        },
        {
          type: 'agent_response',
          agentId: 'data_analyst',
          content: '117,129대 매물 스캔 및 최적 차량 선별 완료',
          timestamp: new Date(),
          metadata: { round: 2 }
        }
      ];

      events.forEach((event, index) => {
        setTimeout(() => {
          setCollaborationEvents(prev => [...prev, event]);
          setCurrentRound(prev => Math.max(prev, event.metadata?.round || 0));

          // 연결 상태 업데이트
          if (event.type === 'agent_question' && event.metadata?.targetAgent) {
            setActiveConnections(prev => [...prev, `${event.agentId} → ${event.metadata!.targetAgent}`]);
          }
        }, index * 2000);
      });
    };

    simulateA2AEvents();
  }, [isActive, currentPersona]);

  if (!isActive) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            🚀 실시간 A2A 협업 진행 중
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </h3>
          <p className="text-sm text-slate-600">3명의 AI 전문가가 실시간으로 협업하고 있습니다</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">현재 라운드</div>
          <div className="text-2xl font-bold text-blue-600">{currentRound}</div>
        </div>
      </div>

      {/* 에이전트 네트워크 시각화 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(agentInfo).map(([id, info]) => (
          <div
            key={id}
            className={`bg-white rounded-lg p-4 border-2 transition-all duration-300 ${
              activeConnections.some(conn => conn.includes(id))
                ? `border-${info.color}-400 shadow-lg scale-105`
                : 'border-slate-200'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{info.emoji}</div>
              <div className="font-medium text-sm text-slate-700">{info.name}</div>
              <div className="text-xs text-slate-500">{info.role}</div>
              {activeConnections.some(conn => conn.includes(id)) && (
                <div className="mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto animate-ping"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 실시간 협업 로그 */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        <div className="text-sm font-medium text-slate-700 mb-2">💬 실시간 협업 메시지</div>
        {collaborationEvents.map((event, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 animate-fade-in"
          >
            <div className="text-lg">
              {event.agentId === 'system' ? '⚡' : agentInfo[event.agentId as keyof typeof agentInfo]?.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-medium">
                  {event.agentId === 'system' ? 'System' : agentInfo[event.agentId as keyof typeof agentInfo]?.name}
                </span>
                {event.metadata?.targetAgent && (
                  <span>→ {agentInfo[event.metadata.targetAgent as keyof typeof agentInfo]?.name}</span>
                )}
                <span>{event.timestamp.toLocaleTimeString()}</span>
              </div>
              <div className="text-sm text-slate-700">{event.content}</div>
              {event.metadata?.round && (
                <div className="text-xs text-blue-600 mt-1">Round {event.metadata.round}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 기술 설명 */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-600 text-center">
          ⚡ 이것이 바로 <span className="font-semibold text-blue-600">멀티 에이전트 A2A 프로토콜</span>입니다
          <br />
          각 전문가가 서로 질문하고 답변하며 최적의 결과를 도출합니다
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}