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

  // 에이전트별 개성있는 핵심 인사이트 추출 함수 - 멘토링 피드백 반영
  const extractSummary = (content: string, agent: string) => {
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10);

    const getAgentCoreInsight = (text: string, agentType: string) => {
      switch (agentType) {
        case 'needs_analyst':
          // 핵심 니즈만 요약 (긴 추론과정 → 핵심 인사이트만)
          if (text.includes('CEO') || text.includes('사장') || text.includes('법인차')) {
            return '🔍 CEO 페르소나 감지: 골프백 수납, 비즈니스 품격, 절세 효과를 우선 고려';
          }
          if (text.includes('가족') || text.includes('아이') || text.includes('워킹맘')) {
            return '🔍 가족 중심 라이프스타일: 안전성과 편의성이 최우선';
          }
          if (text.includes('MZ') || text.includes('젊은') || text.includes('직장')) {
            return '🔍 MZ세대 감지: 디자인, 연비, 스타일을 중시하는 패턴';
          }
          if (text.includes('캠핑') || text.includes('레저') || text.includes('활동')) {
            return '🔍 액티브 라이프스타일: 공간 활용과 내구성 중심 니즈';
          }
          if (text.includes('첫차') || text.includes('초보') || text.includes('불안')) {
            return '🔍 첫차 구매 불안감: 안전성과 신뢰성이 핵심 관심사';
          }

          // 일반적인 핵심 니즈 추출
          const keyNeedsPattern = /(?:가장|특히|중요한|우선|핵심)\s*(.{10,50})/gi;
          const match = text.match(keyNeedsPattern);
          if (match && match[0]) {
            return `🔍 핵심 니즈: ${match[0].replace(/^(가장|특히|중요한|우선|핵심)\s*/, '').slice(0, 40)}`;
          }

          return '🔍 고객님의 라이프스타일과 우선순위를 파악했습니다';

        case 'data_analyst':
          // TCO와 매물 분석 핵심만 요약
          const priceMatch = text.match(/(\d{1,4}(?:,\d{3})*)\s*만원/);
          const vehicleMatch = text.match(/(\d+)\s*대/);

          if (priceMatch && vehicleMatch) {
            return `📊 매물 분석: ${vehicleMatch[1]}대 검토, 평균 ${priceMatch[1]}만원대 추천`;
          }
          if (text.includes('TCO') || text.includes('총소유비용')) {
            return '📊 TCO 분석: 구매가격 + 유지비 + 감가상각 종합 고려';
          }
          if (text.includes('가성비') || text.includes('경제성')) {
            return '📊 가성비 최적화: 예산 대비 최고 효율 차량 선별';
          }
          if (text.includes('감가') || text.includes('잔가')) {
            return '📊 감가율 분석: 향후 3년 가치 보존력 평가';
          }

          // 구체적 수치가 있으면 표시
          const specificData = text.match(/(\d+(?:,\d+)*(?:\s*만원|\s*대|\s*%|\s*년))/g);
          if (specificData && specificData.length > 0) {
            return `📊 데이터 분석: ${specificData.slice(0, 2).join(', ')} 기준 최적화`;
          }

          return '📊 실제 매물 데이터로 최적 조건을 선별했습니다';

        case 'concierge':
          // 친근한 결론과 다음 단계 안내
          if (text.includes('환영') || text.includes('시작')) {
            return '🎯 CarFin AI 컨시어지가 맞춤 상담을 시작합니다';
          }
          if (text.includes('완료') || text.includes('분석')) {
            return '🎯 전문가팀 협업 완료: 고객님께 최적 매칭 차량을 준비했습니다';
          }
          if (text.includes('3명') || text.includes('협업') || text.includes('전문가')) {
            return '🎯 3명의 전문가가 머리를 맞대고 최고의 답변을 준비했습니다';
          }
          if (text.includes('질문') || text.includes('궁금')) {
            return '🎯 추가 궁금한 점이 있으시면 언제든 말씀해 주세요';
          }

          // 첫 문장에서 핵심 메시지 추출
          const firstSentence = sentences[0]?.trim();
          if (firstSentence && firstSentence.length > 15) {
            return `🎯 ${firstSentence.slice(0, 50)}${firstSentence.length > 50 ? '...' : ''}`;
          }

          return '🎯 고객님만을 위한 맞춤 상담을 진행하겠습니다';

        default:
          const defaultFirstSentence = sentences[0];
          if (defaultFirstSentence && defaultFirstSentence.length > 10) {
            return defaultFirstSentence.length > 80 ? defaultFirstSentence.slice(0, 77) + '...' : defaultFirstSentence;
          }
          return text.slice(0, 50) + '...';
      }
    };

    return getAgentCoreInsight(content, agent);
  };

  const agentInfo = getAgentInfo(agent);

  // 핵심 키워드 추출 (카드 우상단 배지용)
  const extractKeyInsight = (content: string, agent: string) => {
    switch (agent) {
      case 'needs_analyst':
        if (content.includes('CEO') || content.includes('사장') || content.includes('법인차')) return 'CEO급';
        if (content.includes('가족') || content.includes('아이')) return '가족형';
        if (content.includes('MZ') || content.includes('젊은')) return 'MZ세대';
        if (content.includes('캠핑') || content.includes('레저')) return '레저형';
        return '분석완료';

      case 'data_analyst':
        if (content.includes('TCO') || content.includes('총소유비용')) return 'TCO분석';
        if (content.includes('가성비') || content.includes('경제성')) return '가성비';
        if (content.includes('감가') || content.includes('잔가')) return '감가분석';
        if (content.includes('추천') || content.includes('매물')) return '매물분석';
        return '데이터완료';

      case 'concierge':
        if (content.includes('환영') || content.includes('시작')) return '상담시작';
        if (content.includes('완료') || content.includes('준비')) return '준비완료';
        if (content.includes('매칭') || content.includes('추천')) return '매칭완료';
        return '진행중';

      default:
        return '완료';
    }
  };

  const keyInsight = extractKeyInsight(content, agent);

  return (
    <div
      className={`${agentInfo.bgClass} p-5 rounded-2xl border ${agentInfo.borderClass} mb-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-in slide-in-from-left-4 fade-in-0 relative overflow-hidden backdrop-blur-sm`}
      role="article"
      aria-label={`${agentInfo.name} 전문가 인사이트`}
    >
      {/* 강화된 배경 효과 */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/60 to-transparent rounded-full -mr-12 -mt-12"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/30 to-transparent rounded-full -ml-8 -mb-8"></div>

      {/* 분석 완료 진행률 표시 */}
      <div className="absolute top-2 left-2">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg border-2 border-white" title="분석 완료"></div>
      </div>

      {/* 핵심 인사이트 배지 - 강화된 디자인 */}
      <div className="absolute top-3 right-3">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
          agent === 'needs_analyst' ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300' :
          agent === 'data_analyst' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300' :
          'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300'
        }`}>
          ✅ {keyInsight}
        </span>
      </div>

      <div className="flex items-start gap-3 pr-16">
        <div className="text-2xl flex-shrink-0 hover:scale-110 transition-transform duration-200" aria-hidden="true">{agentInfo.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-gray-900 text-base flex items-center gap-2" id={`agent-${agent}-title`}>
              <span className="bg-white/60 rounded-lg px-2 py-1 text-sm">
                {agentInfo.name} 전문가
              </span>
              <span className="text-xs text-gray-500 bg-white/40 rounded-full px-2 py-0.5">
                분석 완료
              </span>
            </div>
          </div>

          {/* 핵심 인사이트 표시 - 카드 중심 디자인 */}
          <div className="mb-4">
            <div className="text-sm text-gray-800 leading-relaxed font-semibold bg-white/80 rounded-lg p-3 border border-gray-100 shadow-sm">
              {agentInfo.summary}
            </div>
          </div>

          {/* 에이전트별 맞춤 액션 버튼 */}
          {agent === 'needs_analyst' && (
            <div className="mb-3 flex flex-wrap gap-2">
              <button className="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors border border-orange-200">
                🎯 니즈 상세
              </button>
              <button className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors border border-purple-200">
                👤 페르소나 확인
              </button>
            </div>
          )}

          {agent === 'data_analyst' && (
            <div className="mb-3 flex flex-wrap gap-2">
              <button className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors border border-green-200">
                💰 TCO 상세
              </button>
              <button className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors border border-blue-200">
                📊 매물 분석
              </button>
            </div>
          )}

          {agent === 'concierge' && (
            <div className="mb-3 flex flex-wrap gap-2">
              <button className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors border border-blue-200">
                🤝 상담 진행
              </button>
              <button className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors border border-indigo-200">
                ❓ 추가 질문
              </button>
            </div>
          )}

          {/* 상세 내용 토글 - 개선된 디자인 */}
          {content.length > 150 && (
            <details className="group">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 transition-colors list-none flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="group-open:rotate-90 transition-transform text-blue-500">▶</span>
                <span className="group-open:hidden">🔍 상세한 분석 과정 보기</span>
                <span className="hidden group-open:block">📄 분석 과정 접기</span>
                <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                  {Math.ceil(content.length / 50)}줄
                </span>
              </summary>
              <div className="mt-3 p-4 bg-white rounded-lg text-xs text-gray-600 leading-relaxed border border-gray-200 shadow-sm">
                <div className="mb-2 text-xs text-gray-500 font-medium flex items-center gap-1">
                  <span>{agentInfo.emoji}</span>
                  <span>{agentInfo.name} 전문가의 상세 분석</span>
                </div>
                <div className="border-l-2 border-gray-200 pl-3">
                  {content}
                </div>
              </div>
            </details>
          )}

          {/* 데이터 분석가용 TCO 요약 정보 - 개선된 버전 */}
          {agent === 'data_analyst' && tcoSummary && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 font-medium mb-3 flex items-center gap-1">
                <span>📊</span>
                <span>경제성 분석 요약</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-blue-50 p-2.5 rounded-lg text-center border border-blue-100">
                  <div className="font-bold text-blue-800 text-sm">{tcoSummary.averageTCO.toLocaleString()}만원</div>
                  <div className="text-blue-600 text-xs mt-0.5">평균 3년 TCO</div>
                </div>
                <div className="bg-green-50 p-2.5 rounded-lg text-center border border-green-100">
                  <div className="font-bold text-green-800 text-sm truncate">{tcoSummary.bestValueVehicle}</div>
                  <div className="text-green-600 text-xs mt-0.5">최고 가성비</div>
                </div>
                <div className="bg-orange-50 p-2.5 rounded-lg text-center border border-orange-100">
                  <div className="font-bold text-orange-800 text-sm">{tcoSummary.costRange}</div>
                  <div className="text-orange-600 text-xs mt-0.5">비용 범위</div>
                </div>
              </div>
            </div>
          )}

          {/* CEO 페르소나 특별 표시 */}
          {(content.includes('CEO') || content.includes('사장') || content.includes('법인차') || content.includes('골프')) && (
            <div className="mt-3 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
              <div className="text-xs text-purple-700 font-medium flex items-center gap-1">
                <span>👔</span>
                <span>CEO 페르소나 맞춤 분석</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}