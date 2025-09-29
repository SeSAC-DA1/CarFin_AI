'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, RefreshCw, Star, Heart, Frown, Lightbulb } from 'lucide-react';

interface SatisfactionFeedbackProps {
  recommendations: any[];
  onFeedback: (feedback: FeedbackData) => void;
  onRecommendationRequest: (refinement: string) => void;
  isVisible: boolean;
}

interface FeedbackData {
  satisfaction: 'satisfied' | 'neutral' | 'dissatisfied';
  reasons: string[];
  suggestions: string;
  specificIssues: string[];
  preferredAdjustments: string[];
}

export default function SatisfactionFeedback({
  recommendations,
  onFeedback,
  onRecommendationRequest,
  isVisible
}: SatisfactionFeedbackProps) {
  const [currentStep, setCurrentStep] = useState<'initial' | 'dissatisfied_detail' | 'refinement' | 'completed'>('initial');
  const [selectedSatisfaction, setSelectedSatisfaction] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customSuggestion, setCustomSuggestion] = useState('');
  const [refinementRequests, setRefinementRequests] = useState<string[]>([]);

  const satisfactionOptions = [
    {
      id: 'satisfied',
      label: '만족해요!',
      icon: <Heart className="w-5 h-5" />,
      color: 'from-green-500 to-emerald-600',
      description: '추천해주신 차량들이 마음에 들어요',
      emoji: '😊'
    },
    {
      id: 'neutral',
      label: '괜찮은데...',
      icon: <Star className="w-5 h-5" />,
      color: 'from-yellow-500 to-orange-500',
      description: '나쁘지 않지만 더 좋은 옵션이 있을 것 같아요',
      emoji: '🤔'
    },
    {
      id: 'dissatisfied',
      label: '아쉬워요',
      icon: <Frown className="w-5 h-5" />,
      color: 'from-red-500 to-pink-600',
      description: '제 니즈와 조금 다른 것 같아요',
      emoji: '😅'
    }
  ];

  const dissatisfactionReasons = [
    { id: 'budget', label: '💰 예산이 맞지 않아요', detail: '추천 차량들이 예산보다 높거나 낮아요' },
    { id: 'brand', label: '🏷️ 브랜드 선호도', detail: '선호하는 브랜드가 다르거나 없어요' },
    { id: 'size', label: '📏 크기/공간', detail: '차량 크기가 제 용도에 맞지 않아요' },
    { id: 'fuel', label: '⛽ 연료/효율성', detail: '연비나 연료 타입이 고려되지 않았어요' },
    { id: 'age', label: '📅 연식/상태', detail: '너무 오래되었거나 주행거리가 많아요' },
    { id: 'features', label: '⚙️ 옵션/기능', detail: '필요한 기능이나 옵션이 부족해요' },
    { id: 'location', label: '📍 지역/접근성', detail: '차량 위치가 너무 멀거나 불편해요' },
    { id: 'variety', label: '🔄 다양성 부족', detail: '비슷한 차량들만 추천되었어요' }
  ];

  const refinementSuggestions = [
    '예산을 조금 더 유연하게 조정해서 추천해주세요',
    '다른 브랜드도 포함해서 폭넓게 찾아주세요',
    '더 큰(작은) 차량으로 옵션을 확장해주세요',
    '최신 연식 위주로 다시 찾아주세요',
    '연비가 더 좋은 차량들로 재검색해주세요',
    '프리미엄 옵션이 있는 차량들을 찾아주세요',
    '가까운 지역의 매물들로 다시 추천해주세요',
    '완전히 다른 관점에서 새롭게 추천해주세요'
  ];

  const handleSatisfactionSelect = (satisfaction: string) => {
    setSelectedSatisfaction(satisfaction);

    if (satisfaction === 'satisfied') {
      // 만족한 경우 바로 완료
      onFeedback({
        satisfaction: 'satisfied',
        reasons: [],
        suggestions: '',
        specificIssues: [],
        preferredAdjustments: []
      });
      setCurrentStep('completed');
    } else if (satisfaction === 'dissatisfied') {
      // 불만족한 경우 상세 이유 물어보기
      setCurrentStep('dissatisfied_detail');
    } else {
      // 중립적인 경우 바로 개선 제안
      setCurrentStep('refinement');
    }
  };

  const handleReasonToggle = (reasonId: string) => {
    setSelectedReasons(prev =>
      prev.includes(reasonId)
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId]
    );
  };

  const handleRefinementRequest = (suggestion: string) => {
    onRecommendationRequest(suggestion);
    setCurrentStep('completed');
  };

  const proceedToRefinement = () => {
    setCurrentStep('refinement');

    // 피드백 데이터 전송
    onFeedback({
      satisfaction: selectedSatisfaction as any,
      reasons: selectedReasons,
      suggestions: customSuggestion,
      specificIssues: selectedReasons,
      preferredAdjustments: refinementRequests
    });
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg mt-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl mb-4">
          <MessageCircle className="w-6 h-6" />
          <h3 className="text-lg font-bold">추천 만족도 조사</h3>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {currentStep === 'initial' && '추천받은 차량들이 마음에 드시나요? 솔직한 의견을 들려주세요!'}
          {currentStep === 'dissatisfied_detail' && '어떤 부분이 아쉬우셨는지 알려주시면, 더 나은 추천을 드릴게요.'}
          {currentStep === 'refinement' && '이런 방향으로 다시 추천해드릴까요?'}
          {currentStep === 'completed' && '소중한 피드백 감사합니다! 더 나은 추천을 위해 활용하겠습니다.'}
        </p>
      </div>

      {/* 초기 만족도 선택 */}
      {currentStep === 'initial' && (
        <div className="grid md:grid-cols-3 gap-4">
          {satisfactionOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSatisfactionSelect(option.id)}
              className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-300 text-left group"
            >
              <div className={`bg-gradient-to-r ${option.color} text-white p-3 rounded-lg mb-4 w-fit`}>
                {option.icon}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{option.emoji}</span>
                <h4 className="font-bold text-gray-800">{option.label}</h4>
              </div>
              <p className="text-sm text-gray-600">{option.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* 불만족 상세 이유 */}
      {currentStep === 'dissatisfied_detail' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-3">
            {dissatisfactionReasons.map((reason) => (
              <button
                key={reason.id}
                onClick={() => handleReasonToggle(reason.id)}
                className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                  selectedReasons.includes(reason.id)
                    ? 'border-red-300 bg-red-50 shadow-md'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm mb-1">{reason.label}</div>
                <div className="text-xs text-gray-600">{reason.detail}</div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              💬 추가로 하고 싶은 말씀이 있으시면 자유롭게 적어주세요
            </label>
            <textarea
              value={customSuggestion}
              onChange={(e) => setCustomSuggestion(e.target.value)}
              placeholder="예: 골프백이 들어가는 차량이면 좋겠어요, 아이들과 여행 다니기 편한 차량 추천해주세요..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 text-sm"
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={proceedToRefinement}
              disabled={selectedReasons.length === 0}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lightbulb className="w-5 h-5" />
              <span>개선된 추천 받기</span>
            </button>
          </div>
        </div>
      )}

      {/* 개선 제안 */}
      {currentStep === 'refinement' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            {refinementSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleRefinementRequest(suggestion)}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 text-left text-sm"
              >
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 mb-4">
              또는 직접 요청사항을 말씀해주세요
            </p>
            <button
              onClick={() => {
                const customRequest = prompt('어떤 방향으로 다시 추천해드릴까요?');
                if (customRequest) {
                  handleRefinementRequest(customRequest);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>직접 요청하기</span>
            </button>
          </div>
        </div>
      )}

      {/* 완료 상태 */}
      {currentStep === 'completed' && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-lg font-bold text-gray-800 mb-2">피드백 완료!</h4>
          <p className="text-gray-600 text-sm">
            {selectedSatisfaction === 'satisfied'
              ? '만족스러운 추천이었다니 정말 기뻐요! 🎉'
              : '더 나은 추천을 위해 새로운 분석을 시작하겠습니다! 🚀'
            }
          </p>
        </div>
      )}

      {/* N번째 질문 환영 메시지 */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-gray-500">
          <Star className="w-4 h-4" />
          <span>N번째 질문 환영! 완벽한 매칭까지 계속해서 도와드릴게요</span>
        </div>
      </div>
    </div>
  );
}