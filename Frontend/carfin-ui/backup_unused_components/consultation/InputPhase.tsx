'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SmartText } from '@/components/ui/car-term-tooltip';

interface UserData {
  usage?: string;
  budget?: string;
  priority?: string;
}

interface InputPhaseProps {
  onDataCollected: (data: UserData) => void;
  onPrevious?: () => void;
}

interface QuestionOption {
  value: string;
  emoji: string;
  description: string;
  detail: string;
}

interface Question {
  id: keyof UserData;
  emoji: string;
  title: string;
  subtitle: string;
  helpText: string;
  options: QuestionOption[];
}

export function InputPhase({ onDataCollected, onPrevious }: InputPhaseProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userData, setUserData] = useState<UserData>({});

  const questions: Question[] = [
    {
      id: 'usage',
      emoji: '🚗',
      title: '차량 사용 목적을 알려주세요',
      subtitle: '어떤 용도로 차량을 가장 많이 사용하실 예정인가요?',
      helpText: '사용 목적에 따라 최적의 차종과 옵션이 달라집니다',
      options: [
        { value: '출퇴근용', emoji: '🏢', description: '매일 회사 출퇴근', detail: '연비와 승차감이 중요해요' },
        { value: '가족용', emoji: '👨‍👩‍👧‍👦', description: '가족과 함께 이동', detail: '안전성과 공간이 우선이에요' },
        { value: '레저용', emoji: '🏖️', description: '주말 여행이나 취미', detail: '짐 공간과 주행성능이 필요해요' },
        { value: '사업용', emoji: '💼', description: '업무나 사업 관련', detail: '브랜드 이미지와 실용성이 중요해요' }
      ]
    },
    {
      id: 'budget',
      emoji: '💰',
      title: '월 할부 예산을 선택해주세요',
      subtitle: '무리 없이 지불 가능한 월 할부금은 얼마인가요?',
      helpText: '보험료, 유지비 등을 제외한 순수 할부금만 고려해주세요',
      options: [
        { value: '150만원 이하', emoji: '💚', description: '부담 없는 경제적 선택', detail: '연봉 3,000만원 기준 적정 수준' },
        { value: '150-300만원', emoji: '💙', description: '적당한 수준의 선택', detail: '연봉 4,000-6,000만원 기준' },
        { value: '300-500만원', emoji: '🧡', description: '여유 있는 선택', detail: '연봉 7,000만원 이상 권장' },
        { value: '500만원 이상', emoji: '💜', description: '프리미엄 옵션', detail: '고급 브랜드와 최신 옵션 가능' }
      ]
    },
    {
      id: 'priority',
      emoji: '⭐',
      title: '가장 중요한 우선순위를 선택해주세요',
      subtitle: '차량을 선택할 때 가장 중요하게 생각하는 요소는 무엇인가요?',
      helpText: '선택한 우선순위에 맞춰 AI가 최적의 차량을 추천해드려요',
      options: [
        { value: '연비', emoji: '⛽', description: '경제적인 연료비', detail: '하이브리드나 경차 위주로 추천' },
        { value: '안전성', emoji: '🛡️', description: '가족의 안전이 최우선', detail: '안전도 5성급 차량 위주로 추천' },
        { value: '디자인', emoji: '✨', description: '보기 좋은 외관과 내장', detail: '스타일리시한 디자인 위주로 추천' },
        { value: '브랜드', emoji: '🏆', description: '믿을 수 있는 브랜드', detail: '프리미엄 브랜드 위주로 추천' }
      ]
    }
  ];

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleOptionSelect = (value: string) => {
    setIsAnimating(true);

    // 데이터 저장
    const newUserData = {
      ...userData,
      [currentQ.id]: value
    };
    setUserData(newUserData);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setIsAnimating(false);
      } else {
        // 모든 질문 완료 - 상위 컴포넌트에 데이터 전달
        onDataCollected(newUserData);
      }
    }, 800);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      // 이전 선택 초기화
      const currentKey = currentQ.id;
      setUserData(prev => ({
        ...prev,
        [currentKey]: undefined
      }));
    } else if (onPrevious) {
      onPrevious();
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 relative overflow-hidden">
      {/* Professional background overlay */}
      <div className="absolute inset-0 bg-white/30 z-0"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* 전문적인 진행률 표시 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-6 mb-8">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center shadow-lg border border-border">
              <span className="text-4xl">{currentQ.emoji}</span>
            </div>
            <div className="text-left">
              <div className="text-lg text-primary font-semibold mb-2">단계 {currentQuestion + 1} / {questions.length}</div>
              <div className="w-48 bg-secondary rounded-full h-4 shadow-inner border border-border">
                <div
                  className="bg-primary h-4 rounded-full transition-all duration-700 shadow-lg"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{Math.round(progress)}% 완료</div>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            <SmartText>{currentQ.title}</SmartText>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto mb-2">
            <SmartText>{currentQ.subtitle}</SmartText>
          </p>
          {currentQ.helpText && (
            <p className="text-sm text-primary max-w-3xl mx-auto bg-secondary px-4 py-2 rounded-lg inline-block">
              💡 <SmartText>{currentQ.helpText}</SmartText>
            </p>
          )}
        </div>

        {/* 전문적인 옵션 카드들 */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          {currentQ.options.map((option, index) => (
            <Card
              key={option.value}
              className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 backdrop-blur-sm ${
                userData[currentQ.id] === option.value
                  ? 'border-primary bg-secondary shadow-primary/20'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/50'
              }`}
              onClick={() => handleOptionSelect(option.value)}
              style={{
                animationDelay: `${index * 150}ms`,
                animation: isAnimating ? 'none' : 'slideInUp 0.6s ease-out forwards'
              }}
            >
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {option.emoji}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {option.value}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                  {option.description}
                </p>
                {option.detail && (
                  <p className="text-xs text-primary bg-secondary px-3 py-2 rounded-lg">
                    {option.detail}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 전문적인 이전 답변들 요약 */}
        {currentQuestion > 0 && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-4 bg-card backdrop-blur-sm rounded-full px-8 py-4 shadow-lg border border-border">
              <span className="text-sm text-foreground font-medium">선택하신 내용:</span>
              {userData.usage && (
                <span className="bg-secondary text-primary px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                  {userData.usage}
                </span>
              )}
              {userData.budget && (
                <span className="bg-secondary text-[var(--toss-success)] px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                  {userData.budget}
                </span>
              )}
              {userData.priority && (
                <span className="bg-secondary text-[var(--toss-warning)] px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                  {userData.priority}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 뒤로가기 버튼 */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="bg-card hover:bg-secondary border-border text-primary hover:border-primary/50"
          >
            ← 이전 단계로 돌아가기
          </Button>
        </div>
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
}