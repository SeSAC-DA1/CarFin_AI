'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  Lightbulb,
  Target,
  ArrowRight,
  Heart,
  Brain,
  Shield,
  Sparkles
} from 'lucide-react';

interface Props {
  onSelectEntry: (entryType: 'beginner' | 'confused' | 'confident', questions: string[]) => void;
  onBack: () => void;
}

interface EntryOption {
  id: 'beginner' | 'confused' | 'confident';
  emoji: string;
  title: string;
  description: string;
  thoughts: string[];
  questions: string[];
  color: string;
  icon: any;
}

const entryOptions: EntryOption[] = [
  {
    id: 'beginner',
    emoji: '🚗',
    title: '차알못이에요',
    description: '차에 대해 전혀 몰라서 어디서 시작해야 할지 모르겠어요',
    thoughts: [
      '사회초년생인데 뭘 봐야 할지 모르겠어요',
      '딜러가 말하는 용어들이 다 어려워요',
      '사고차나 침수차 사면 어떡하죠?',
      '바가지 쓸까 봐 무서워요'
    ],
    questions: [
      '평소에 차를 얼마나 자주 타실 예정인가요?',
      '주로 몇 명이 함께 탈 예정인가요?',
      '어떤 용도로 주로 사용하실 건가요?'
    ],
    color: 'simple-card',
    icon: HelpCircle
  },
  {
    id: 'confused',
    emoji: '🤔',
    title: '선택이 어려워요',
    description: '여러 차를 봤는데 너무 많아서 결정하기 어려워요',
    thoughts: [
      '브랜드가 너무 많아서 복잡해요',
      '엔카 사이트가 너무 복잡해요',
      '친구들 말이 다 달라서 더 헷갈려요',
      '첫 아이가 생겨서 가족차가 필요해요'
    ],
    questions: [
      '지금까지 어떤 차들을 고려해보셨나요?',
      '가장 중요하게 생각하시는 건 뭔가요?',
      '예산 범위는 어느 정도 생각하고 계신가요?'
    ],
    color: 'simple-card',
    icon: Lightbulb
  },
  {
    id: 'confident',
    emoji: '💼',
    title: '빠르게 확인하고 싶어요',
    description: '바빠서 딜러 상담 받을 시간이 없고, 빠르게 확인하고 싶어요',
    thoughts: [
      '전문직이라 시간이 부족해요',
      '대략적인 조건은 정해져 있어요',
      '실제 매물이 있는지 확인하고 싶어요',
      'AI 분석으로 검증받고 싶어요'
    ],
    questions: [
      '어떤 종류의 차를 원하시나요?',
      '특별히 원하는 브랜드가 있나요?',
      '꼭 필요한 기능이나 옵션이 있나요?'
    ],
    color: 'simple-card',
    icon: Target
  }
];

export function EmpatheticEntry({ onSelectEntry, onBack }: Props) {
  const [selectedOption, setSelectedOption] = useState<EntryOption | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);

  const handleOptionSelect = (option: EntryOption) => {
    setSelectedOption(option);
    setShowQuestions(true);
  };

  const handleConfirm = () => {
    if (selectedOption) {
      onSelectEntry(selectedOption.id, selectedOption.questions);
    }
  };

  const handleBack = () => {
    if (showQuestions) {
      setShowQuestions(false);
      setSelectedOption(null);
    } else {
      onBack();
    }
  };

  if (showQuestions && selectedOption) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto py-8 space-y-8">
          {/* 헤더 */}
          <div className="text-center space-y-6">
            <Button
              onClick={handleBack}
              variant="outline"
              className="btn-secondary mb-4"
            >
              ← 뒤로가기
            </Button>

            <h1 className="hero-title">
              {selectedOption.emoji} {selectedOption.title} 선택!
            </h1>
            <p className="text-large text-muted-foreground">
              간단한 질문들을 준비했어요. 편하게 답해주세요 🤗
            </p>
          </div>

          {/* 질문 미리보기 */}
          <Card className="simple-card">
            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                  <h3 className="section-title">
                    이런 것들을 물어볼게요
                  </h3>
                </div>

                <div className="space-y-4">
                  {selectedOption.questions.map((question, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ background: 'var(--primary)' }}>
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <p className="text-regular">{question}</p>
                    </div>
                  ))}
                </div>

                {/* 안심 메시지 */}
                <div className="simple-card p-6 bg-muted/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                    <h4 className="card-title">안심하세요!</h4>
                  </div>
                  <div className="space-y-2 text-regular text-muted-foreground">
                    <p>✓ 정답이 없어요. 편한 대로 답하시면 됩니다</p>
                    <p>✓ 모르는 건 '잘 모르겠어요'라고 해도 괜찮아요</p>
                    <p>✓ 언제든 뒤로 가서 다시 선택할 수 있어요</p>
                    <p>✓ AI가 부족한 부분은 알아서 채워드려요</p>
                  </div>
                </div>

                {/* 시작 버튼 */}
                <div className="text-center mt-8">
                  <button
                    onClick={handleConfirm}
                    className="btn-primary"
                  >
                    <Sparkles className="w-5 h-5" />
                    네, 시작할게요!
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <p className="text-small text-muted-foreground mt-4">
                    💡 전문가 수준의 맞춤 분석을 시작합니다
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto py-8 space-y-12">
        {/* 헤더 */}
        <div className="text-center space-y-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="btn-secondary mb-6"
          >
            ← 뒤로가기
          </Button>

          <h1 className="hero-title">
            어떤 상황이신가요?
          </h1>
          <p className="text-large text-muted-foreground max-w-3xl mx-auto">
            솔직하게 선택해주세요. 상황에 맞는 맞춤형 질문을 준비해드려요
          </p>

          <div className="simple-card max-w-2xl mx-auto p-4">
            <p className="text-regular" style={{ color: 'var(--primary)' }}>
              💡 어떤 선택을 하셔도 괜찮습니다. AI가 알아서 맞춰드려요
            </p>
          </div>
        </div>

        {/* 선택지들 */}
        <div className="grid md:grid-cols-3 gap-6">
          {entryOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-200 simple-card hover:scale-105 ${
                  selectedOption?.id === option.id
                    ? 'border-primary shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleOptionSelect(option)}
              >
                <CardContent className="p-6 text-center space-y-6">
                  {/* 아이콘과 제목 */}
                  <div className="space-y-4">
                    <div className="text-5xl">{option.emoji}</div>
                    <div className="flex items-center justify-center gap-2">
                      <Icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                      <h3 className="card-title">{option.title}</h3>
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-regular text-muted-foreground">{option.description}</p>

                  {/* 마음의 소리들 */}
                  <div className="space-y-3">
                    <h4 className="text-small font-semibold">이런 생각 해본 적 있으시죠?</h4>
                    <div className="space-y-2">
                      {option.thoughts.map((thought, index) => (
                        <div key={index} className="text-small bg-muted rounded-lg p-3 text-left">
                          <Heart className="w-3 h-3 inline mr-2" style={{ color: 'var(--primary)' }} />
                          "{thought}"
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 선택 인디케이터 */}
                  <div className="pt-2">
                    <div className="text-small" style={{ color: 'var(--primary)' }}>
                      클릭해서 선택하기 →
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 하단 안내 */}
        <div className="text-center space-y-3">
          <p className="text-regular font-medium">
            💡 걱정하지 마세요! 어떤 선택을 해도 AI가 알아서 맞춰드려요
          </p>
          <p className="text-small text-muted-foreground">
            선택하시면 상황에 맞는 질문을 준비해드립니다
          </p>
        </div>
      </div>
    </div>
  );
}