'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  ArrowLeft,
  Heart,
  Brain,
  Sparkles,
  Star,
  Moon,
  Zap
} from 'lucide-react';

// 4개 핵심 감정적 페르소나 타입 정의 (8개→4개 간소화)
export type EmotionalPersonaType =
  | 'first_car_challenger'     // 첫차 도전형 - 메인 타겟 (차알못 친화적)
  | 'family_guardian'          // 가족 수호형 - 안전성 중시
  | 'budget_calculator'        // 알뜰 계산형 - 경제성 중시
  | 'brand_dreamer'            // 브랜드 로망형 - 품격/브랜드 중시

// MBTI 스타일 감정적 페르소나 클러스터
const emotionalPersonaClusters = {
  first_car_challenger: {
    name: '첫차 도전형',
    emoji: '🌟',
    subtitle: '새로운 시작을 꿈꾸는 용감한 마음',
    description: '드디어 내 차를 가질 수 있다는 설렘으로 가득한 당신',
    emotionalMessage: '당신은 새로운 도전을 두려워하지 않는 용감한 마음의 소유자군요!',
    deepInsight: '첫 번째 차는 단순한 이동수단이 아니라 성인이 된 증표이자 자유의 상징이에요',
    traits: ['도전정신', '성취욕구', '설렘충만', '미래지향'],
    carPreferences: ['신뢰성 있는 브랜드', '합리적 가격', '운전하기 쉬운', '연비 좋은'],
    worries: ['운전 실력', '보험료', '유지비', '주차'],
    motivationalMessage: '첫 걸음이 가장 용기가 필요해요. 당신은 이미 그 용기를 가지고 계시네요! ✨',
    color: 'from-yellow-400 to-orange-500'
  },

  family_guardian: {
    name: '가족 수호형',
    emoji: '👨‍👩‍👧‍👦',
    subtitle: '사랑하는 가족을 지키는 든든한 방패',
    description: '가족의 안전과 행복이 최우선인 따뜻한 당신',
    emotionalMessage: '당신은 가족을 향한 깊은 사랑으로 가득한 마음 따뜻한 수호자네요!',
    deepInsight: '진정한 부는 가족과 함께하는 안전한 시간이라는 걸 아시는군요',
    traits: ['책임감', '보호본능', '헌신적사랑', '안정추구'],
    carPreferences: ['안전성 최우선', '공간 넓은', '신뢰성 검증된', '가족친화적'],
    worries: ['사고 위험', '아이들 안전', '응급상황', '장거리 여행'],
    motivationalMessage: '가족을 사랑하는 마음만큼 든든한 안전장치는 없어요 💝',
    color: 'from-blue-400 to-blue-600'
  },


  budget_calculator: {
    name: '알뜰 계산형',
    emoji: '💰',
    subtitle: '1원까지 아끼는 현명한 절약의 달인',
    description: '경제적 효율성을 최우선으로 생각하는 현실적인 당신',
    emotionalMessage: '당신은 똑똑하고 현명한 판단력을 가진 절약의 달인이네요!',
    deepInsight: '진정한 부자는 돈을 아낄 줄 아는 사람이라는 철학을 가지고 계시네요',
    traits: ['절약정신', '합리적사고', '꼼꼼함', '효율추구'],
    carPreferences: ['가성비 최고', '연비 우수', '유지비 저렴', '실용성 중심'],
    worries: ['할부이자', '유지비용', '값 하락', '숨겨진 비용'],
    motivationalMessage: '현명한 소비가 미래의 풍요로움을 만들어요 🧠',
    color: 'from-green-400 to-emerald-500'
  },



  brand_dreamer: {
    name: '브랜드 로망형',
    emoji: '🏆',
    subtitle: '꿈꿔왔던 브랜드와 함께하는 성공의 증표',
    description: '특정 브랜드에 대한 로망과 꿈을 실현하고 싶은 당신',
    emotionalMessage: '당신은 꿈을 포기하지 않고 계속 도전하는 열정적인 드리머군요!',
    deepInsight: '브랜드는 단순한 로고가 아니라 자신의 가치관과 꿈의 표현이라고 생각하시네요',
    traits: ['꿈과로망', '브랜드사랑', '성취지향', '품질추구'],
    carPreferences: ['특정 브랜드', '프리미엄 라인', '품질 보장', '브랜드 가치'],
    worries: ['예산 초과', '사치스러움', '브랜드 실망', '사후 서비스'],
    motivationalMessage: '꿈은 이루어지라고 있는 거예요. 당신의 꿈을 응원해요! 🌟',
    color: 'from-amber-400 to-yellow-500'
  },

};

// 감정적 질문 정의 (MBTI 스타일)
interface EmotionalQuestion {
  id: string;
  question: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  options: {
    id: string;
    text: string;
    subtext: string;
    emoji: string;
    emotionalWeights: Partial<Record<EmotionalPersonaType, number>>;
    bgColor: string;
  }[];
}

const emotionalQuestions: EmotionalQuestion[] = [
  {
    id: 'inner_fear_dream',
    question: '밤에 잠들기 전 차에 대해 생각할 때, 가장 먼저 떠오르는 감정은?',
    subtitle: '내면의 두려움과 꿈',
    description: '당신의 무의식 속 진짜 마음을 알아보는 질문입니다',
    icon: <Moon className="w-6 h-6" />,
    options: [
      {
        id: 'excitement',
        text: '드디어 내 차를 가질 수 있다니... 설레!',
        subtext: '새로운 시작에 대한 설렘과 기대감',
        emoji: '🌟',
        emotionalWeights: { first_car_challenger: 4, brand_dreamer: 2 },
        bgColor: 'from-yellow-100 to-orange-100'
      },
      {
        id: 'worry',
        text: '사고 나면 어쩌지... 가족들 걱정돼',
        subtext: '안전에 대한 걱정과 보호 본능',
        emoji: '😰',
        emotionalWeights: { first_car_challenger: 4, family_guardian: 3 },
        bgColor: 'from-blue-100 to-slate-100'
      },
      {
        id: 'social_concern',
        text: '사람들이 뭐라고 생각할까...',
        subtext: '타인의 시선과 사회적 평가에 대한 의식',
        emoji: '😌',
        emotionalWeights: { brand_dreamer: 4, brand_dreamer: 1 },
        bgColor: 'from-purple-100 to-pink-100'
      },
      {
        id: 'financial_stress',
        text: '돈이 너무 많이 들겠다... 계산해봐야지',
        subtext: '경제적 부담과 합리적 계산',
        emoji: '💰',
        emotionalWeights: { budget_calculator: 4, budget_calculator: 1 },
        bgColor: 'from-green-100 to-emerald-100'
      }
    ]
  },

  {
    id: 'stress_response',
    question: '복잡한 교차로에서 길을 잘못 들었을 때, 당신의 첫 반응은?',
    subtitle: '스트레스 상황에서의 반응',
    description: '위기 상황에서 드러나는 당신의 진짜 성격',
    icon: <Zap className="w-6 h-6" />,
    options: [
      {
        id: 'action_oriented',
        text: '아, 진짜 짜증나! 빨리 돌아가자',
        subtext: '적극적이고 문제 해결 지향적',
        emoji: '🏔️',
        emotionalWeights: { family_guardian: 3, first_car_challenger: 2 },
        bgColor: 'from-teal-100 to-cyan-100'
      },
      {
        id: 'cautious_response',
        text: '천천히... 안전하게... 당황하지 말자',
        subtext: '신중하고 안전을 최우선으로 생각',
        emoji: '😰',
        emotionalWeights: { first_car_challenger: 4, family_guardian: 2 },
        bgColor: 'from-gray-100 to-slate-100'
      },
      {
        id: 'relaxed_attitude',
        text: '에이, 뭐 어때? 구경이나 하자',
        subtext: '여유롭고 스트레스를 잘 받지 않음',
        emoji: '😌',
        emotionalWeights: { budget_calculator: 3, family_guardian: 2 },
        bgColor: 'from-indigo-100 to-purple-100'
      },
      {
        id: 'systematic_approach',
        text: 'GPS 다시 설정하고 정확한 길 찾아야지',
        subtext: '체계적이고 완벽주의적 성향',
        emoji: '💰',
        emotionalWeights: { budget_calculator: 3, brand_dreamer: 2 },
        bgColor: 'from-green-100 to-emerald-100'
      }
    ]
  },

  {
    id: 'social_validation',
    question: '친구들과 차 얘기할 때, 어떤 말을 들으면 가장 기분이 좋나요?',
    subtitle: '사회적 정체성과 소속감',
    description: '타인과의 관계에서 중요하게 생각하는 가치',
    icon: <Heart className="w-6 h-6" />,
    options: [
      {
        id: 'admiration',
        text: '와, 진짜 멋있다! 나도 저런 차 타고 싶어',
        subtext: '동경과 우월감을 주는 평가',
        emoji: '🏆',
        emotionalWeights: { brand_dreamer: 4, brand_dreamer: 2 },
        bgColor: 'from-amber-100 to-yellow-100'
      },
      {
        id: 'family_approval',
        text: '정말 안전해 보이고 가족차로 딱이네',
        subtext: '실용성과 가족 중심 가치 인정',
        emoji: '👨‍👩‍👧‍👦',
        emotionalWeights: { family_guardian: 4, budget_calculator: 1 },
        bgColor: 'from-blue-100 to-sky-100'
      },
      {
        id: 'smart_choice',
        text: '완전 가성비 좋네! 똑똑한 선택이야',
        subtext: '경제적 현명함에 대한 인정',
        emoji: '💰',
        emotionalWeights: { budget_calculator: 4, first_car_challenger: 1 },
        bgColor: 'from-green-100 to-emerald-100'
      },
      {
        id: 'freedom_expression',
        text: '어디든 갈 수 있을 것 같아! 자유롭겠다',
        subtext: '자유로움과 모험 정신 인정',
        emoji: '🏔️',
        emotionalWeights: { family_guardian: 4, first_car_challenger: 2 },
        bgColor: 'from-teal-100 to-cyan-100'
      }
    ]
  },

  {
    id: 'past_hurt',
    question: '이전에 차와 관련해서 가장 속상했던 기억은?',
    subtitle: '과거 상처와 현재 욕구',
    description: '과거 경험이 현재 선택에 미치는 영향',
    icon: <Brain className="w-6 h-6" />,
    options: [
      {
        id: 'missed_opportunities',
        text: '차가 없어서 놓친 기회들이 너무 많았어',
        subtext: '결핍감과 성취 욕구',
        emoji: '🌟',
        emotionalWeights: { first_car_challenger: 4, family_guardian: 2 },
        bgColor: 'from-yellow-100 to-orange-100'
      },
      {
        id: 'dignity_hurt',
        text: '아버지 차 빌려달라고 말하기 부끄러웠어',
        subtext: '자존감 상처와 독립 욕구',
        emoji: '😌',
        emotionalWeights: { brand_dreamer: 4, brand_dreamer: 2 },
        bgColor: 'from-purple-100 to-pink-100'
      },
      {
        id: 'envy_feelings',
        text: '비싼 차 보고 부러워만 했던 과거가 싫어',
        subtext: '열등감과 성공 증명 욕구',
        emoji: '🏆',
        emotionalWeights: { brand_dreamer: 4, budget_calculator: 1 },
        bgColor: 'from-amber-100 to-yellow-100'
      },
      {
        id: 'inconvenience',
        text: '대중교통 타면서 불편했던 게 너무 많았어',
        subtext: '편의성 추구와 실용적 필요',
        emoji: '😌',
        emotionalWeights: { budget_calculator: 3, family_guardian: 2 },
        bgColor: 'from-indigo-100 to-purple-100'
      }
    ]
  },

  {
    id: 'future_vision',
    question: '5년 후, 당신이 차를 타고 있는 모습을 상상해보세요. 어떤 기분일까요?',
    subtitle: '미래에 대한 상상과 로망',
    description: '미래 자아에 대한 상상과 기대',
    icon: <Star className="w-6 h-6" />,
    options: [
      {
        id: 'family_happiness',
        text: '가족들과 함께 안전하고 행복하게 여행하고 있을 것 같아',
        subtext: '가족 중심 가치관과 안정성 추구',
        emoji: '👨‍👩‍👧‍👦',
        emotionalWeights: { family_guardian: 4, budget_calculator: 2 },
        bgColor: 'from-blue-100 to-sky-100'
      },
      {
        id: 'pride_success',
        text: '친구들한테 자랑할 수 있는 멋진 차 주인이 되어있을 거야',
        subtext: '사회적 성공과 인정 욕구',
        emoji: '🏆',
        emotionalWeights: { brand_dreamer: 4, brand_dreamer: 2 },
        bgColor: 'from-amber-100 to-yellow-100'
      },
      {
        id: 'adventure_freedom',
        text: '어디든 자유롭게 떠날 수 있는 모험가가 되어있을 거야',
        subtext: '자유 추구와 경험 중심 라이프스타일',
        emoji: '🏔️',
        emotionalWeights: { family_guardian: 4, first_car_challenger: 1 },
        bgColor: 'from-teal-100 to-cyan-100'
      },
      {
        id: 'peaceful_driving',
        text: '편안하고 스트레스 없이 운전하고 있을 것 같아',
        subtext: '평온함과 단순한 행복 추구',
        emoji: '😌',
        emotionalWeights: { budget_calculator: 3, first_car_challenger: 2 },
        bgColor: 'from-indigo-100 to-purple-100'
      }
    ]
  }
];

interface Props {
  onComplete: (personaResult: EmotionalPersonaAnalysisResult) => void;
  onBack: () => void;
}

export interface EmotionalPersonaAnalysisResult {
  primaryPersona: EmotionalPersonaType;
  secondaryPersona?: EmotionalPersonaType;
  matchScore: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  personalizedMessage: string;
  emotionalInsights: string[];
  personaScores: Record<EmotionalPersonaType, number>;
  answers: Record<string, string>;
  psychologicalProfile: {
    dominantTraits: string[];
    emotionalTriggers: string[];
    carBuyingMotivation: string;
  };
}

export function PersonaDiscovery({ onComplete, onBack }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [personaAnalysis, setPersonaAnalysis] = useState<EmotionalPersonaAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const progress = ((currentQuestion + 1) / emotionalQuestions.length) * 100;

  const handleAnswer = (questionId: string, optionId: string) => {
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);

    if (currentQuestion < emotionalQuestions.length - 1) {
      // 자연스러운 진행을 위해 약간의 지연
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
      }, 300);
    } else {
      // 모든 질문 완료 - 감정적 페르소나 분석 실행
      setIsAnalyzing(true);
      setTimeout(() => {
        analyzeEmotionalPersona(newAnswers);
      }, 1500); // 분석하는 느낌을 위한 지연
    }
  };

  const analyzeEmotionalPersona = (finalAnswers: Record<string, string>) => {
    // 페르소나 점수 계산
    const personaScores: Record<EmotionalPersonaType, number> = {
      first_car_challenger: 0,
      family_guardian: 0,
      brand_dreamer: 0,
      budget_calculator: 0,
      family_guardian: 0,
      first_car_challenger: 0,
      brand_dreamer: 0,
      budget_calculator: 0
    };

    // 각 답변에 따른 감정적 가중치 계산
    Object.entries(finalAnswers).forEach(([questionId, optionId]) => {
      const question = emotionalQuestions.find(q => q.id === questionId);
      const option = question?.options.find(o => o.id === optionId);

      if (option?.emotionalWeights) {
        Object.entries(option.emotionalWeights).forEach(([persona, weight]) => {
          personaScores[persona as EmotionalPersonaType] += weight || 0;
        });
      }
    });

    // 감정적 일관성 보너스 계산
    const consistencyBonus = calculateEmotionalConsistency(finalAnswers);
    Object.entries(consistencyBonus).forEach(([persona, bonus]) => {
      personaScores[persona as EmotionalPersonaType] += bonus;
    });

    // 최고점과 차순점 페르소나 찾기
    const sortedPersonas = Object.entries(personaScores)
      .sort(([,a], [,b]) => b - a);

    const primaryPersona = sortedPersonas[0][0] as EmotionalPersonaType;
    const secondaryPersona = sortedPersonas[1][0] as EmotionalPersonaType;
    const primaryScore = sortedPersonas[0][1];
    const secondaryScore = sortedPersonas[1][1];

    // 매치 점수 계산
    const matchScore = Math.min(Math.round((primaryScore / 30) * 100), 100);

    // 신뢰도 계산
    const scoreDifference = primaryScore - secondaryScore;
    const confidenceLevel = scoreDifference >= 5 ? 'HIGH' : scoreDifference >= 2 ? 'MEDIUM' : 'LOW';

    // 개인화된 메시지 생성
    const personalizedMessage = generateDynamicMessage(primaryPersona, matchScore);

    // 감정적 인사이트 생성
    const emotionalInsights = generateEmotionalInsights(primaryPersona, secondaryPersona, matchScore);

    // 심리적 프로필 생성
    const psychologicalProfile = generatePsychologicalProfile(primaryPersona, finalAnswers);

    const result: EmotionalPersonaAnalysisResult = {
      primaryPersona,
      secondaryPersona: scoreDifference >= 2 ? secondaryPersona : undefined,
      matchScore,
      confidenceLevel,
      personalizedMessage,
      emotionalInsights,
      personaScores,
      answers: finalAnswers,
      psychologicalProfile
    };

    setPersonaAnalysis(result);
    setIsAnalyzing(false);
    setShowResults(true);
  };

  // 감정적 일관성 계산
  const calculateEmotionalConsistency = (answers: Record<string, string>): Record<EmotionalPersonaType, number> => {
    const consistencyBonus: Record<EmotionalPersonaType, number> = {
      first_car_challenger: 0,
      family_guardian: 0,
      brand_dreamer: 0,
      budget_calculator: 0,
      family_guardian: 0,
      first_car_challenger: 0,
      brand_dreamer: 0,
      budget_calculator: 0
    };

    // 연속된 질문에서 같은 페르소나 선택 시 보너스
    const answerKeys = Object.keys(answers);
    for (let i = 0; i < answerKeys.length - 1; i++) {
      const currentPersona = getDominantPersonaFromAnswer(answers[answerKeys[i]], answerKeys[i]);
      const nextPersona = getDominantPersonaFromAnswer(answers[answerKeys[i + 1]], answerKeys[i + 1]);

      if (currentPersona === nextPersona) {
        consistencyBonus[currentPersona] += 2;
      }
    }

    return consistencyBonus;
  };

  const getDominantPersonaFromAnswer = (optionId: string, questionId: string): EmotionalPersonaType => {
    const question = emotionalQuestions.find(q => q.id === questionId);
    const option = question?.options.find(o => o.id === optionId);

    if (option?.emotionalWeights) {
      const maxWeight = Math.max(...Object.values(option.emotionalWeights));
      const dominantPersona = Object.entries(option.emotionalWeights)
        .find(([, weight]) => weight === maxWeight)?.[0];
      return dominantPersona as EmotionalPersonaType;
    }

    return 'first_car_challenger'; // 기본값
  };

  const generateDynamicMessage = (persona: EmotionalPersonaType, score: number): string => {
    const cluster = emotionalPersonaClusters[persona];
    const baseMessage = cluster.emotionalMessage;

    if (score >= 90) {
      return `와... 정말 놀라워요! ${baseMessage} 정말 명확한 성향을 보여주시네요! 마치 오랫동안 알고 지낸 친구의 마음을 본 것 같아요 ✨`;
    } else if (score >= 70) {
      return `${baseMessage} 균형잡힌 성향을 보이시는군요. 이런 점이 당신만의 특별한 매력이에요 💫`;
    } else {
      return `${baseMessage} 다양한 면을 가진 당신이 멋져요. 그 복합적인 성격이 정말 흥미로워요 🌈`;
    }
  };

  const generateEmotionalInsights = (primary: EmotionalPersonaType, secondary?: EmotionalPersonaType, score: number): string[] => {
    const primaryCluster = emotionalPersonaClusters[primary];
    const insights = [
      `당신의 ${primaryCluster.traits[0]}과 ${primaryCluster.traits[1]} 성향이 강해요`,
      primaryCluster.deepInsight,
      primaryCluster.motivationalMessage
    ];

    if (secondary && secondary !== primary) {
      const secondaryCluster = emotionalPersonaClusters[secondary];
      insights.push(`${secondaryCluster.name}의 면모도 보이시네요. 이런 복합적인 성격이 당신만의 독특함이에요!`);
    }

    if (score >= 85) {
      insights.push('정말 명확하고 일관된 성향을 가지고 계시네요! 자신의 마음을 잘 알고 계신 분 같아요 🎯');
    }

    return insights;
  };

  const generatePsychologicalProfile = (persona: EmotionalPersonaType, answers: Record<string, string>) => {
    const cluster = emotionalPersonaClusters[persona];

    return {
      dominantTraits: cluster.traits.slice(0, 3),
      emotionalTriggers: cluster.worries.slice(0, 2),
      carBuyingMotivation: cluster.description
    };
  };

  const handleNext = () => {
    if (personaAnalysis) {
      onComplete(personaAnalysis);
    }
  };

  const handlePrevious = () => {
    if (showResults) {
      setShowResults(false);
      setPersonaAnalysis(null);
      setCurrentQuestion(emotionalQuestions.length - 1);
    } else if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      onBack();
    }
  };

  // 분석 중 화면
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="animate-spin text-6xl">🧠</div>
            <h1 className="text-3xl font-bold text-slate-800">
              당신의 마음을 분석하고 있어요...
            </h1>
            <p className="text-lg text-slate-600">
              5가지 질문에서 드러난 감정적 패턴을 해석 중입니다
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="animate-pulse bg-gradient-to-r from-blue-400 to-purple-500 h-2 w-64 rounded-full"></div>
            </div>
            <p className="text-sm text-slate-500">
              MBTI 스타일 심층 분석 진행 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 결과 화면
  if (showResults && personaAnalysis) {
    const primaryCluster = emotionalPersonaClusters[personaAnalysis.primaryPersona];
    const secondaryCluster = personaAnalysis.secondaryPersona
      ? emotionalPersonaClusters[personaAnalysis.secondaryPersona]
      : null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto py-8 space-y-8">
          {/* 헤더 */}
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-2xl">
                <Sparkles className="w-8 h-8 text-purple-500" />
                <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  와! 정말 당신의 마음을 읽었네요
                </span>
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-lg text-slate-600">
                {personaAnalysis.personalizedMessage}
              </p>
            </div>

            <h1 className="text-5xl font-bold text-slate-800 mb-2">
              {primaryCluster.emoji} {primaryCluster.name}
            </h1>
            <p className="text-xl text-slate-600 font-medium">
              {primaryCluster.subtitle}
            </p>
          </div>

          {/* 주요 페르소나 카드 */}
          <Card className={`bg-gradient-to-br ${primaryCluster.color} border-0 shadow-xl`}>
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="text-7xl mb-4">{primaryCluster.emoji}</div>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-3">
                    {primaryCluster.name}
                  </h2>
                  <p className="text-lg text-white/90 mb-6">
                    {primaryCluster.description}
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white/20 backdrop-blur-sm text-white rounded-full px-8 py-4">
                    <span className="text-3xl font-bold">{personaAnalysis.matchScore}% 일치</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-3 mt-8">
                  {primaryCluster.traits.map((trait, index) => (
                    <Badge key={index} className="bg-white/20 text-white py-3 px-4 text-sm backdrop-blur-sm">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 보조 페르소나 */}
          {secondaryCluster && (
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{secondaryCluster.emoji}</div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      보조 성향: {secondaryCluster.name}
                    </h3>
                    <p className="text-slate-600">{secondaryCluster.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 감정적 인사이트 */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Heart className="w-6 h-6 text-pink-500" />
                💭 당신의 마음 깊숙한 곳
              </h3>
              <div className="space-y-4">
                {personaAnalysis.emotionalInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white/50 rounded-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-700 leading-relaxed">{insight}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 신뢰도 표시 */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">분석 신뢰도</h4>
                  <p className="text-sm text-slate-600">당신의 응답 일관성을 바탕으로 계산</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                    personaAnalysis.confidenceLevel === 'HIGH'
                      ? 'bg-green-100 text-green-800'
                      : personaAnalysis.confidenceLevel === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {personaAnalysis.confidenceLevel === 'HIGH' && '매우 높음 🎯'}
                    {personaAnalysis.confidenceLevel === 'MEDIUM' && '높음 ✅'}
                    {personaAnalysis.confidenceLevel === 'LOW' && '보통 📊'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 다음 단계 */}
          <div className="text-center space-y-6">
            <p className="text-xl text-slate-700">
              🚗 이제 <span className="font-bold text-purple-600">{primaryCluster.name}</span> 유형에게
              <br />딱 맞는 차량 추천을 받아보세요!
            </p>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-100 px-6 py-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                다시 분석하기
              </Button>

              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-8 font-semibold rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="w-4 h-4 mr-2" />
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
  const question = emotionalQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        {/* 진행률 */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {question.icon}
                  <h2 className="text-xl font-bold text-slate-800">
                    {question.subtitle}
                  </h2>
                </div>
                <span className="text-sm font-medium text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                  {currentQuestion + 1}/{emotionalQuestions.length}
                </span>
              </div>
              <Progress
                value={progress}
                className="h-3 bg-white/50"
              />
              <p className="text-sm text-slate-500 text-center">
                {question.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 질문 카드 */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* 질문 */}
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-slate-800 leading-tight">
                  {question.question}
                </h1>
              </div>

              {/* 선택지 */}
              <div className="grid md:grid-cols-2 gap-6">
                {question.options.map((option) => (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-purple-400 bg-gradient-to-br ${option.bgColor} backdrop-blur-sm`}
                    onClick={() => handleAnswer(question.id, option.id)}
                  >
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="text-5xl">{option.emoji}</div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {option.text}
                      </h3>
                      <p className="text-slate-600 text-sm">
                        {option.subtext}
                      </p>
                      <div className="pt-2">
                        <div className="inline-flex items-center text-purple-600 font-medium">
                          <Heart className="w-4 h-4 mr-2" />
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
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePrevious}
            variant="outline"
            className="border-slate-300 text-slate-800 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentQuestion === 0 ? '시작 화면으로' : '이전 질문'}
          </Button>

          <div className="text-sm text-slate-500 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            솔직한 마음으로 답해주세요. 더 정확한 분석이 가능해요
          </div>
        </div>
      </div>
    </div>
  );
}