// PersonaDemoSelector.tsx - 5개 페르소나별 시연 선택 컴포넌트

import React, { useState } from 'react';
import { DEMO_PERSONAS, PERSONA_MESSAGES, DemoPersona } from '@/lib/collaboration/PersonaDefinitions';

interface PersonaDemoSelectorProps {
  onPersonaSelect: (persona: DemoPersona, question: string) => void;
}

export default function PersonaDemoSelector({ onPersonaSelect }: PersonaDemoSelectorProps) {
  const [selectedPersona, setSelectedPersona] = useState<DemoPersona | null>(null);

  const handlePersonaClick = (persona: DemoPersona) => {
    setSelectedPersona(persona);
  };

  const handleQuestionSelect = (question: string) => {
    if (selectedPersona) {
      onPersonaSelect(selectedPersona, question);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          🎭 다양한 고객 페르소나별 A2A 시연
        </h2>
        <p className="text-slate-600">
          5가지 서로 다른 고객 유형별로 맞춤형 A2A 협업을 경험해보세요
        </p>
      </div>

      {/* 페르소나 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_PERSONAS.map((persona) => (
          <div
            key={persona.id}
            onClick={() => handlePersonaClick(persona)}
            className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
              selectedPersona?.id === persona.id
                ? `${persona.theme.borderColor} ${persona.theme.bgColor} shadow-lg`
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{persona.emoji}</div>
              <h3 className="font-bold text-lg text-slate-800">{persona.name}</h3>
              <div className="text-sm text-slate-600">{persona.occupation}</div>
              <div className="text-xs text-slate-500 mt-1">
                {persona.age}세 • 예산 {persona.budget.min}-{persona.budget.max}만원
              </div>
            </div>

            <div className="text-sm text-slate-700 mb-4 line-clamp-3">
              {persona.situation}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">주요 관심사:</div>
              <div className="flex flex-wrap gap-1">
                {persona.priorities.slice(0, 3).map((priority, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-2 py-1 rounded-full ${persona.theme.bgColor} text-slate-700`}
                  >
                    {priority}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 text-center">
              <div className="text-xs text-slate-500">
                {persona.theme.icon} {persona.theme.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 선택된 페르소나의 상세 정보 */}
      {selectedPersona && (
        <div className={`p-6 rounded-xl ${selectedPersona.theme.bgColor} border-2 ${selectedPersona.theme.borderColor}`}>
          <div className="flex items-start gap-4 mb-6">
            <div className="text-6xl">{selectedPersona.emoji}</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {selectedPersona.name}님의 상황
              </h3>
              <p className="text-slate-700 mb-4">{selectedPersona.personalStory}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">💭 실제 고민들:</h4>
                  <ul className="text-sm text-slate-700 space-y-1">
                    {selectedPersona.realConcerns.slice(0, 3).map((concern, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">🎯 우선순위:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPersona.priorities.map((priority, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-white rounded-full border border-slate-200"
                      >
                        {priority}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 예상 A2A 플로우 */}
          <div className="mb-6">
            <h4 className="font-semibold text-slate-800 mb-3">
              🚀 예상 A2A 협업 플로우 ({selectedPersona.expectedPattern})
            </h4>
            <div className="flex items-center gap-2 text-sm">
              {selectedPersona.collaborationFlow.map((agent, idx) => (
                <React.Fragment key={agent}>
                  <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 font-medium">
                    {agent === 'concierge' ? '👨‍💼 컨시어지' :
                     agent === 'needs_analyst' ? '🧠 니즈분석' : '📊 데이터분석'}
                  </div>
                  {idx < selectedPersona.collaborationFlow.length - 1 && (
                    <div className="text-slate-400">→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 샘플 질문들 */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-3">
              💬 {selectedPersona.name}님이 할 법한 질문들 (클릭해서 A2A 시연 시작!)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedPersona.sampleQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuestionSelect(question)}
                  className="p-4 bg-white rounded-lg border-2 border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="text-sm text-slate-700 group-hover:text-blue-700">
                    "{question}"
                  </div>
                  <div className="text-xs text-slate-500 mt-2 group-hover:text-blue-500">
                    클릭해서 A2A 협업 시작 →
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 하단 안내 */}
      <div className="text-center text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
        <div className="font-medium mb-2">🎯 페르소나별 맞춤 A2A 협업의 차이점</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
          <div>😨 <strong>첫차 불안</strong><br />안전성 중심 협업</div>
          <div>👩‍💼 <strong>워킹맘</strong><br />가족 우선 협업</div>
          <div>📱 <strong>MZ감성</strong><br />스타일 중심 협업</div>
          <div>🏕️ <strong>캠핑족</strong><br />실용성 중심 협업</div>
          <div>👨‍👩‍👧‍👦‍👶 <strong>대가족</strong><br />효율성 중심 협업</div>
        </div>
      </div>
    </div>
  );
}