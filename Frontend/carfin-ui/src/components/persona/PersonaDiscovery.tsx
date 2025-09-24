'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  ArrowLeft,
  Users,
  Heart,
  Brain,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react';

// 페르소나 타입 정의
export type PersonaType =
  | 'cautious_pragmatist'      // 신중한 실용주의자
  | 'safety_family_focused'    // 안전 중심 가족형
  | 'prestige_oriented'        // 품격 추구형
  | 'economic_rationalist'     // 경제적 합리주의자
  | 'lifestyle_focused'        // 라이프스타일 중시형
  | 'performance_oriented'     // 성능 지향형
  | 'eco_conscious'            // 환경 의식형
  | 'comfort_seeking'          // 편의 추구형

// 페르소나 클러스터 정의
const personaClusters = {
  cautious_pragmatist: {
    name: '신중한 실용주의자',
    description: '꼼꼼히 비교하고 가성비를 중시하는 현실적 선택형',
    emoji: '🤔',
    traits: ['가성비 중시', '신중한 결정', '안정성 추구'],
    demographics: '30대 직장인 중심'
  },
  safety_family_focused: {
    name: '안전 중심 가족형',
    description: '가족의 안전과 안정이 최우선인 책임감 있는 선택형',
    emoji: '👨‍👩‍👧‍👦',
    traits: ['안전성 최우선', '가족 중심', '신뢰성 추구'],
    demographics: '30-40대 부모 중심'
  },
  prestige_oriented: {
    name: '품격 추구형',
    description: '브랜드 가치와 이미지를 중요시하는 프리미엄 지향형',
    emoji: '💼',
    traits: ['브랜드 중시', '이미지 추구', '품질 우선'],
    demographics: '40-50대 관리직 중심'
  },
  economic_rationalist: {
    name: '경제적 합리주의자',
    description: '경제성과 효율성을 최우선하는 실속형',
    emoji: '💰',
    traits: ['경제성 추구', '효율성 중시', '합리적 선택'],
    demographics: '20-30대 사회초년생 중심'
  },
  lifestyle_focused: {
    name: '라이프스타일 중시형',
    description: '개성과 스타일을 표현하는 감성적 선택형',
    emoji: '✨',
    traits: ['디자인 중시', '개성 표현', '트렌드 민감'],
    demographics: '30대 싱글/신혼 중심'
  },
  performance_oriented: {
    name: '성능 지향형',
    description: '주행 성능과 드라이빙의 즐거움을 추구하는 열정형',
    emoji: '🏎️',
    traits: ['성능 우선', '드라이빙 즐거움', '기술 관심'],
    demographics: '드라이빙 애호가'
  },
  eco_conscious: {
    name: '환경 의식형',
    description: '친환경과 최신 기술을 중시하는 미래 지향형',
    emoji: '🌱',
    traits: ['친환경 중시', '최신 기술', '지속가능성'],
    demographics: 'MZ세대 중심'
  },
  comfort_seeking: {
    name: '편의 추구형',
    description: '편안함과 서비스를 중요시하는 안락 지향형',
    emoji: '🛋️',
    traits: ['편안함 추구', '서비스 중시', '편의성 우선'],
    demographics: '50대+ 중심'
  }
};

interface PersonaQuestion {
  id: string;
  question: string;
  description: string;
  scenarios: {
    id: string;
    title: string;
    description: string;
    emoji: string;
    personaWeights: Partial<Record<PersonaType, number>>;
  }[];
}

const personaQuestions: PersonaQuestion[] = [
  {
    id: 'lifestyle',
    question: '어떤 하루가 가장 일상적인가요?',
    description: '평소 생활 패턴을 통해 당신의 라이프스타일을 파악해보세요',
    scenarios: [
      {
        id: 'routine_work',
        title: '규칙적인 직장인',
        description: '집-회사-집 패턴, 주말엔 가족과 시간을 보내거나 집에서 휴식',
        emoji: '🏢',
        personaWeights: {
          cautious_pragmatist: 3,
          safety_family_focused: 2,
          comfort_seeking: 1
        }
      },
      {
        id: 'business_social',
        title: '활발한 사회생활',
        description: '업무 미팅, 지인들과의 모임, 네트워킹 활동이 많은 편',
        emoji: '🤝',
        personaWeights: {
          prestige_oriented: 3,
          lifestyle_focused: 2,
          performance_oriented: 1
        }
      },
      {
        id: 'family_centered',
        title: '육아 중심 생활',
        description: '아이 등하원, 학원 픽업, 가족 중심의 스케줄',
        emoji: '👶',
        personaWeights: {
          safety_family_focused: 4,
          cautious_pragmatist: 1
        }
      },
      {
        id: 'flexible_lifestyle',
        title: '자유로운 라이프스타일',
        description: '여가활동, 취미, 개인시간을 중시하는 유연한 생활',
        emoji: '🎨',
        personaWeights: {
          lifestyle_focused: 3,
          eco_conscious: 2,
          performance_oriented: 1
        }
      }
    ]
  },
  {
    id: 'decision_style',
    question: '중요한 구매 결정을 내릴 때 어떤 스타일인가요?',
    description: '구매 의사결정 과정에서 당신의 성향을 알아보세요',
    scenarios: [
      {
        id: 'thorough_research',
        title: '꼼꼼한 분석형',
        description: '여러 옵션을 비교분석하고 리뷰를 꼼꼼히 읽어본 후 결정',
        emoji: '📊',
        personaWeights: {
          cautious_pragmatist: 4,
          economic_rationalist: 2
        }
      },
      {
        id: 'brand_reputation',
        title: '브랜드 신뢰형',
        description: '유명 브랜드와 평판을 우선적으로 고려하여 결정',
        emoji: '🏆',
        personaWeights: {
          prestige_oriented: 4,
          safety_family_focused: 1
        }
      },
      {
        id: 'safety_first',
        title: '안전성 우선형',
        description: '안전성과 신뢰성이 검증된 제품을 우선적으로 선택',
        emoji: '🛡️',
        personaWeights: {
          safety_family_focused: 4,
          cautious_pragmatist: 1
        }
      },
      {
        id: 'intuitive_emotional',
        title: '감성적 직감형',
        description: '첫인상과 감정적 끌림을 중요시하여 빠르게 결정',
        emoji: '💝',
        personaWeights: {
          lifestyle_focused: 3,
          performance_oriented: 2
        }
      }
    ]
  },
  {
    id: 'values_priority',
    question: '다음 중 가장 중요하게 생각하는 가치는?',
    description: '인생에서 우선순위를 두는 가치관을 선택해보세요',
    scenarios: [
      {
        id: 'stability_security',
        title: '안정성과 보안',
        description: '예측 가능하고 안전한 것을 선호하며 리스크를 최소화',
        emoji: '🔒',
        personaWeights: {
          cautious_pragmatist: 3,
          safety_family_focused: 3,
          comfort_seeking: 1
        }
      },
      {
        id: 'efficiency_productivity',
        title: '효율성과 생산성',
        description: '시간과 비용을 절약하고 최대 효과를 추구',
        emoji: '⚡',
        personaWeights: {
          economic_rationalist: 4,
          cautious_pragmatist: 1
        }
      },
      {
        id: 'quality_excellence',
        title: '품질과 완성도',
        description: '최고의 품질과 완벽함을 추구하며 타협하지 않음',
        emoji: '💎',
        personaWeights: {
          prestige_oriented: 4,
          performance_oriented: 1
        }
      },
      {
        id: 'creativity_individuality',
        title: '창의성과 개성',
        description: '남다른 개성과 독창적인 것을 추구하며 자기표현 중시',
        emoji: '🎭',
        personaWeights: {
          lifestyle_focused: 4,
          eco_conscious: 1
        }
      }
    ]
  },
  {
    id: 'economic_mindset',
    question: '경제적 마인드는 어떤 스타일인가요?',
    description: '돈과 소비에 대한 당신의 기본 철학을 확인해보세요',
    scenarios: [
      {
        id: 'value_for_money',
        title: '가성비 추구형',
        description: '같은 돈으로 최대 만족을 얻을 수 있는 선택을 추구',
        emoji: '⚖️',
        personaWeights: {
          cautious_pragmatist: 3,
          economic_rationalist: 3
        }
      },
      {
        id: 'premium_investment',
        title: '프리미엄 투자형',
        description: '비싸더라도 좋은 것에 투자하는 것이 결국 경제적',
        emoji: '💰',
        personaWeights: {
          prestige_oriented: 4,
          performance_oriented: 1
        }
      },
      {
        id: 'eco_sustainable',
        title: '지속가능 소비형',
        description: '환경과 사회적 책임을 고려한 의식적 소비를 추구',
        emoji: '🌍',
        personaWeights: {
          eco_conscious: 4,
          lifestyle_focused: 1
        }
      }
    ]
  },
  {
    id: 'car_motivation',
    question: '차량이 가장 필요한 이유는?',
    description: '차량 구매의 핵심 동기를 파악해보세요',
    scenarios: [
      {
        id: 'daily_necessity',
        title: '생활 필수품',
        description: '출퇴근, 생활용무 등 일상적인 이동 수단으로 필요',
        emoji: '🚗',
        personaWeights: {
          cautious_pragmatist: 3,
          economic_rationalist: 2,
          comfort_seeking: 1
        }
      },
      {
        id: 'family_safety',
        title: '가족 안전',
        description: '가족의 안전한 이동과 편의를 위해 필요',
        emoji: '👨‍👩‍👧‍👦',
        personaWeights: {
          safety_family_focused: 4
        }
      },
      {
        id: 'lifestyle_expression',
        title: '라이프스타일 표현',
        description: '나의 취향과 스타일을 표현하는 수단으로 필요',
        emoji: '✨',
        personaWeights: {
          lifestyle_focused: 3,
          prestige_oriented: 2,
          performance_oriented: 1
        }
      }
    ]
  }
];

interface Props {
  onComplete: (personaResult: PersonaAnalysisResult) => void;
  onBack: () => void;
}

export interface PersonaAnalysisResult {
  primaryPersona: PersonaType;
  secondaryPersona?: PersonaType;
  matchScore: number;
  personaScores: Record<PersonaType, number>;
  answers: Record<string, string>;
  insights: string[];
}

export function PersonaDiscovery({ onComplete, onBack }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [personaAnalysis, setPersonaAnalysis] = useState<PersonaAnalysisResult | null>(null);

  const progress = ((currentQuestion + 1) / personaQuestions.length) * 100;

  const handleAnswer = (questionId: string, scenarioId: string) => {
    const newAnswers = { ...answers, [questionId]: scenarioId };
    setAnswers(newAnswers);

    if (currentQuestion < personaQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // 모든 질문 완료 - 페르소나 분석 실행
      analyzePersona(newAnswers);
    }
  };

  const analyzePersona = (finalAnswers: Record<string, string>) => {
    // 페르소나 점수 계산
    const personaScores: Record<PersonaType, number> = {
      cautious_pragmatist: 0,
      safety_family_focused: 0,
      prestige_oriented: 0,
      economic_rationalist: 0,
      lifestyle_focused: 0,
      performance_oriented: 0,
      eco_conscious: 0,
      comfort_seeking: 0
    };

    // 각 답변에 따른 점수 누적
    Object.entries(finalAnswers).forEach(([questionId, scenarioId]) => {
      const question = personaQuestions.find(q => q.id === questionId);
      const scenario = question?.scenarios.find(s => s.id === scenarioId);

      if (scenario?.personaWeights) {
        Object.entries(scenario.personaWeights).forEach(([persona, weight]) => {
          personaScores[persona as PersonaType] += weight || 0;
        });
      }
    });

    // 최고점과 차순점 페르소나 찾기
    const sortedPersonas = Object.entries(personaScores)
      .sort(([,a], [,b]) => b - a);

    const primaryPersona = sortedPersonas[0][0] as PersonaType;
    const secondaryPersona = sortedPersonas[1][0] as PersonaType;
    const maxScore = sortedPersonas[0][1];
    const totalPossibleScore = personaQuestions.length * 4; // 최대 점수
    const matchScore = Math.round((maxScore / totalPossibleScore) * 100);

    // 인사이트 생성
    const insights = generateInsights(primaryPersona, secondaryPersona, matchScore);

    const result: PersonaAnalysisResult = {
      primaryPersona,
      secondaryPersona: sortedPersonas[1][1] > 0 ? secondaryPersona : undefined,
      matchScore,
      personaScores,
      answers: finalAnswers,
      insights
    };

    setPersonaAnalysis(result);
    setShowResults(true);
  };

  const generateInsights = (primary: PersonaType, secondary: PersonaType, score: number): string[] => {
    const primaryInfo = personaClusters[primary];
    const insights = [
      `당신은 ${primaryInfo.name} 성향이 강합니다`,
      `${primaryInfo.traits.join(', ')}을 중요시합니다`,
      `${primaryInfo.demographics}에서 많이 발견되는 특성입니다`
    ];

    if (score >= 80) {
      insights.push('매우 명확한 성향을 가지고 계시네요!');
    } else if (score >= 60) {
      insights.push('균형잡힌 성향을 보이시는군요');
    }

    return insights;
  };

  const handleNext = () => {
    if (personaAnalysis) {
      onComplete(personaAnalysis);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      onBack();
    }
  };

  if (showResults && personaAnalysis) {
    const primaryCluster = personaClusters[personaAnalysis.primaryPersona];
    const secondaryCluster = personaAnalysis.secondaryPersona
      ? personaClusters[personaAnalysis.secondaryPersona]
      : null;

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto py-8 space-y-8">
          {/* 헤더 */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 bg-green-100 rounded-full px-6 py-3 mb-4">
              <Sparkles className="w-6 h-6 text-green-600" />
              <span className="font-bold text-green-800">페르소나 분석 완료!</span>
            </div>

            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              🎯 당신의 차량 구매 페르소나
            </h1>
            <p className="text-xl text-slate-600">
              5가지 질문을 통해 분석한 당신만의 특성입니다
            </p>
          </div>

          {/* 주요 페르소나 */}
          <Card className="carfin-glass-card border-2 border-green-200 bg-green-50">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4">{primaryCluster.emoji}</div>

                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">
                    {primaryCluster.name}
                  </h2>
                  <p className="text-lg text-slate-600 mb-4">
                    {primaryCluster.description}
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="bg-green-500 text-white rounded-full px-6 py-3">
                    <span className="text-2xl font-bold">{personaAnalysis.matchScore}% 일치</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {primaryCluster.traits.map((trait, index) => (
                    <Badge key={index} className="bg-green-600 text-white py-2 px-4">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 보조 페르소나 */}
          {secondaryCluster && (
            <Card className="carfin-glass-card border border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{secondaryCluster.emoji}</div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      보조 성향: {secondaryCluster.name}
                    </h3>
                    <p className="text-slate-600">{secondaryCluster.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 인사이트 */}
          <Card className="carfin-glass-card">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                💡 당신에 대한 인사이트
              </h3>
              <div className="space-y-3">
                {personaAnalysis.insights.map((insight, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-slate-700">{insight}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 다음 단계 */}
          <div className="text-center space-y-4">
            <p className="text-lg text-slate-600">
              🚗 이제 당신과 비슷한 <span className="font-bold text-green-600">{primaryCluster.name}</span> 유형의 사람들이 선택한 차량을 확인해보세요!
            </p>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                다시 분석하기
              </Button>

              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-3 px-8 font-semibold rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                맞춤 추천 받기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 질문 진행 화면
  const question = personaQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        {/* 진행률 */}
        <Card className="carfin-glass-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-heading-lg text-slate-800">🎯 페르소나 분석</h2>
                <span className="text-body-sm text-green-700">{currentQuestion + 1}/{personaQuestions.length}</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-slate-500 text-center">
                간단한 질문으로 당신의 차량 구매 성향을 분석합니다
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 질문 카드 */}
        <Card className="carfin-glass-card">
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* 질문 */}
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-slate-800">
                  {question.question}
                </h1>
                <p className="text-lg text-slate-600">
                  {question.description}
                </p>
              </div>

              {/* 선택지 */}
              <div className="grid md:grid-cols-2 gap-6">
                {question.scenarios.map((scenario) => (
                  <Card
                    key={scenario.id}
                    className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-green-400"
                    onClick={() => handleAnswer(question.id, scenario.id)}
                  >
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="text-4xl">{scenario.emoji}</div>
                      <h3 className="text-xl font-bold text-slate-800">
                        {scenario.title}
                      </h3>
                      <p className="text-slate-600">
                        {scenario.description}
                      </p>
                      <div className="pt-2">
                        <div className="inline-flex items-center text-green-600">
                          <ArrowRight className="w-4 h-4 mr-2" />
                          선택하기
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 네비게이션 */}
        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            variant="outline"
            className="border-slate-300 text-slate-800 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentQuestion === 0 ? '시작 화면으로' : '이전 질문'}
          </Button>

          <div className="text-sm text-slate-500 flex items-center gap-2">
            <Users className="w-4 h-4" />
            더 정확한 분석을 위해 솔직하게 답해주세요
          </div>
        </div>
      </div>
    </div>
  );
}