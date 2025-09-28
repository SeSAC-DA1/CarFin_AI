'use client';

import { useState } from 'react';

interface AgentInsightCardProps {
  agent: string;
  content: string;
  tcoSummary?: {
    averageTCO: number;
    bestValueVehicle: string;
    costRange: string;
  };
}

export default function AgentInsightCard({ agent, content, tcoSummary }: AgentInsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getAgentInfo = (agent: string) => {
    switch (agent) {
      case 'needs_analyst':
        return {
          emoji: '🔍',
          name: '니즈 분석',
          color: 'orange',
          bgClass: 'bg-gradient-to-r from-orange-50 to-orange-100',
          borderClass: 'border-orange-200',
          summary: extractSummary(content, agent)
        };
      case 'data_analyst':
        return {
          emoji: '📊',
          name: '데이터 분석',
          color: 'green',
          bgClass: 'bg-gradient-to-r from-green-50 to-green-100',
          borderClass: 'border-green-200',
          summary: extractSummary(content, agent)
        };
      case 'concierge':
        return {
          emoji: '🎯',
          name: '컨시어지',
          color: 'blue',
          bgClass: 'bg-gradient-to-r from-blue-50 to-blue-100',
          borderClass: 'border-blue-200',
          summary: extractSummary(content, agent)
        };
      default:
        return {
          emoji: '🤖',
          name: '전문가',
          color: 'gray',
          bgClass: 'bg-gradient-to-r from-gray-50 to-gray-100',
          borderClass: 'border-gray-200',
          summary: extractSummary(content, agent)
        };
    }
  };

  // 에이전트별 개성있는 요약 추출 함수
  const extractSummary = (content: string, agent: string) => {
    // 에이전트별 특성에 맞는 키워드 추출
    const getAgentKeywords = (text: string, agentType: string) => {
      switch (agentType) {
        case 'needs_analyst':
          // 니즈 관련 키워드 찾기
          const needsKeywords = ['라이프스타일', '니즈', '요구사항', '취미', '용도', '목적', '필요'];
          const foundNeed = needsKeywords.find(keyword => text.includes(keyword));
          if (foundNeed) {
            const sentences = text.split(/[.!?]/);
            const relevantSentence = sentences.find(sentence => sentence.includes(foundNeed));
            if (relevantSentence) {
              return `🔍 ${relevantSentence.trim().slice(0, 45)}...`;
            }
          }
          return '🔍 숨은 니즈를 파악했어요!';

        case 'data_analyst':
          // 데이터/숫자 관련 키워드 찾기
          const dataKeywords = ['분석', '데이터', '가성비', '매물', '가격', '비용', 'TCO'];
          const foundData = dataKeywords.find(keyword => text.includes(keyword));
          if (foundData) {
            const sentences = text.split(/[.!?]/);
            const relevantSentence = sentences.find(sentence => sentence.includes(foundData));
            if (relevantSentence) {
              return `📊 ${relevantSentence.trim().slice(0, 45)}...`;
            }
          }
          return '📊 데이터로 최적해를 찾았어요!';

        case 'concierge':
          // 서비스/솔루션 관련 키워드 찾기
          const serviceKeywords = ['추천', '차량', '매칭', '솔루션', '서비스', '도와', '찾아'];
          const foundService = serviceKeywords.find(keyword => text.includes(keyword));
          if (foundService) {
            const sentences = text.split(/[.!?]/);
            const relevantSentence = sentences.find(sentence => sentence.includes(foundService));
            if (relevantSentence) {
              return `🎯 ${relevantSentence.trim().slice(0, 45)}...`;
            }
          }
          return '🎯 완벽한 매칭을 준비했어요!';

        default:
          return text.slice(0, 50) + '...';
      }
    };

    return getAgentKeywords(content, agent);
  };

  const agentInfo = getAgentInfo(agent);

  return (
    <div
      className={`${agentInfo.bgClass} p-4 rounded-lg border ${agentInfo.borderClass} mb-3 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-in slide-in-from-left-4 fade-in-0`}
      role="article"
      aria-label={`${agentInfo.name} 전문가 인사이트`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0 hover:scale-110 transition-transform duration-200" aria-hidden="true">{agentInfo.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-800 text-sm" id={`agent-${agent}-title`}>
              {agentInfo.name} 전문가
            </div>
            {content.length > 60 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs px-4 py-1 bg-white rounded-full hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 border border-gray-200 font-medium flex-shrink-0 ml-3 shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-expanded={isExpanded}
                aria-controls={`agent-${agent}-content`}
                aria-label={`${agentInfo.name} 전문가 상세 내용 ${isExpanded ? '접기' : '펼치기'}`}
              >
                {isExpanded ? '접기' : '자세히'}
              </button>
            )}
          </div>
          <div
            className={`text-sm text-gray-700 leading-relaxed transition-all duration-300 ${isExpanded ? 'animate-in slide-in-from-top-2 fade-in-0' : ''}`}
            id={`agent-${agent}-content`}
            aria-labelledby={`agent-${agent}-title`}
          >
            {isExpanded ? content : agentInfo.summary}
          </div>

          {/* 데이터 분석가용 TCO 요약 정보 */}
          {agent === 'data_analyst' && tcoSummary && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 font-medium mb-2">📊 비용 분석 요약</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="font-bold text-blue-800">{tcoSummary.averageTCO.toLocaleString()}만원</div>
                  <div className="text-blue-600">평균 3년 TCO</div>
                </div>
                <div className="bg-green-50 p-2 rounded text-center">
                  <div className="font-bold text-green-800 truncate">{tcoSummary.bestValueVehicle}</div>
                  <div className="text-green-600">최고 가성비</div>
                </div>
                <div className="bg-orange-50 p-2 rounded text-center">
                  <div className="font-bold text-orange-800">{tcoSummary.costRange}</div>
                  <div className="text-orange-600">비용 범위</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}