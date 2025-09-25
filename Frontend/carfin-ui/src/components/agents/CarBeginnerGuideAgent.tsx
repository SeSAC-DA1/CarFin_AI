'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface CarKnowledgeLevel {
  level: 'complete_beginner' | 'basic' | 'intermediate' | 'advanced';
  score: number;
  gaps: string[];
  strengths: string[];
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
  completed: boolean;
  topics: string[];
}

interface UserProgress {
  knowledgeLevel: CarKnowledgeLevel;
  completedModules: string[];
  currentModule?: string;
  totalLearningTime: number;
  personalizedTips: string[];
}

interface CarBeginnerGuideAgentProps {
  onComplete: (progress: UserProgress) => void;
  onBack?: () => void;
}

// Agent 1: 차알못 가이드 선생님 - Beginner-friendly car education system
export function CarBeginnerGuideAgent({ onComplete, onBack }: CarBeginnerGuideAgentProps) {
  const [currentStep, setCurrentStep] = useState<'assessment' | 'learning' | 'completion'>('assessment');
  const [knowledgeLevel, setKnowledgeLevel] = useState<CarKnowledgeLevel | null>(null);
  const [learningModules, setLearningModules] = useState<LearningModule[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<string[]>([]);

  // 차알못 평가 질문들 - 8가지 핵심 자동차 지식 영역
  const assessmentQuestions = [
    {
      id: 1,
      question: "연료 종류에 대해 얼마나 알고 계세요?",
      options: [
        "가솔린, 디젤의 차이를 전혀 모름",
        "가솔린, 디젤 정도만 알고 있음",
        "하이브리드, 전기차도 어느 정도 알고 있음",
        "연료별 장단점과 비용까지 잘 알고 있음"
      ],
      topic: "fuel_types"
    },
    {
      id: 2,
      question: "자동차 크기 구분에 대해 어느 정도 알고 계세요?",
      options: [
        "경차, 소형차, 대형차 구분을 전혀 모름",
        "기본적인 크기 구분은 알고 있음",
        "준중형, 중형, SUV 등 세부 분류를 알고 있음",
        "세그먼트별 특징과 용도를 잘 알고 있음"
      ],
      topic: "car_sizes"
    },
    {
      id: 3,
      question: "자동차 구매 방식에 대해 얼마나 알고 계세요?",
      options: [
        "현금으로 사는 것만 알고 있음",
        "할부가 있다는 정도만 알고 있음",
        "리스, 렌트와 할부의 차이를 어느 정도 알고 있음",
        "각 방식의 장단점과 금리 등을 잘 알고 있음"
      ],
      topic: "purchase_methods"
    },
    {
      id: 4,
      question: "중고차 구매 시 확인사항에 대해 알고 계세요?",
      options: [
        "뭘 봐야 하는지 전혀 모름",
        "연식, 주행거리 정도만 알고 있음",
        "사고이력, 정비이력도 확인해야 한다는 걸 알고 있음",
        "세부 점검 항목과 서류까지 잘 알고 있음"
      ],
      topic: "used_car_inspection"
    },
    {
      id: 5,
      question: "자동차 보험에 대해 얼마나 알고 계세요?",
      options: [
        "의무보험이 있다는 정도만 알고 있음",
        "자차보험과 대인보험의 차이 정도는 알고 있음",
        "보험 종류와 보장 범위를 어느 정도 알고 있음",
        "보험료 절약 방법까지 잘 알고 있음"
      ],
      topic: "car_insurance"
    },
    {
      id: 6,
      question: "자동차 유지비에 대해 얼마나 알고 계세요?",
      options: [
        "기름값 정도만 생각해봄",
        "보험료, 세금도 있다는 걸 알고 있음",
        "정비비, 소모품 교체비용도 알고 있음",
        "총 소유비용(TCO)을 계산해볼 수 있음"
      ],
      topic: "maintenance_costs"
    },
    {
      id: 7,
      question: "자동차 브랜드와 모델에 대해 얼마나 알고 계세요?",
      options: [
        "현대, 기아 정도만 알고 있음",
        "국산 브랜드들은 어느 정도 알고 있음",
        "수입차 브랜드들도 어느 정도 알고 있음",
        "브랜드별 특징과 인기 모델까지 잘 알고 있음"
      ],
      topic: "brands_models"
    },
    {
      id: 8,
      question: "자동차 성능 지표에 대해 얼마나 알고 계세요?",
      options: [
        "마력, 토크가 뭔지 전혀 모름",
        "연비 정도는 확인해본 적이 있음",
        "배기량, 마력, 연비의 의미를 알고 있음",
        "성능 지표를 비교 분석할 수 있음"
      ],
      topic: "performance_specs"
    }
  ];

  // 평가 결과 분석
  const analyzeKnowledgeLevel = (answers: string[]): CarKnowledgeLevel => {
    const totalScore = answers.reduce((sum, answer, index) => {
      const questionOptions = assessmentQuestions[index].options;
      const answerIndex = questionOptions.findIndex(option => option === answer);
      return sum + (answerIndex + 1) * 25; // 25, 50, 75, 100 점수
    }, 0);

    const averageScore = totalScore / answers.length;

    let level: CarKnowledgeLevel['level'];
    let gaps: string[] = [];
    let strengths: string[] = [];

    if (averageScore < 40) {
      level = 'complete_beginner';
      gaps = [
        "기본적인 자동차 용어 학습",
        "연료 종류와 특징 이해",
        "자동차 크기 분류 학습",
        "구매 방식 기초 이해"
      ];
      strengths = ["학습 의지가 강함", "기초부터 체계적으로 배울 수 있음"];
    } else if (averageScore < 60) {
      level = 'basic';
      gaps = [
        "중고차 점검 방법 학습",
        "보험과 금융 상품 이해",
        "유지비 계산 방법 학습"
      ];
      strengths = ["기본 개념은 이해하고 있음", "실무 지식 학습 준비됨"];
    } else if (averageScore < 80) {
      level = 'intermediate';
      gaps = [
        "전문적인 성능 지표 이해",
        "고급 구매 전략 학습",
        "브랜드별 특성 심화 학습"
      ];
      strengths = ["실용적인 지식을 갖추고 있음", "심화 학습 가능"];
    } else {
      level = 'advanced';
      gaps = ["실제 구매 경험을 통한 검증"];
      strengths = ["포괄적인 자동차 지식 보유", "독립적인 구매 판단 가능"];
    }

    return {
      level,
      score: averageScore,
      gaps,
      strengths
    };
  };

  // 맞춤형 학습 모듈 생성
  const generateLearningModules = (knowledgeLevel: CarKnowledgeLevel): LearningModule[] => {
    const allModules: LearningModule[] = [
      {
        id: 'fuel_basics',
        title: '🚗 연료 종류의 모든 것',
        description: '가솔린, 디젤, 하이브리드, 전기차의 특징과 장단점을 쉽게 배워보세요',
        difficulty: 'easy',
        estimatedMinutes: 15,
        completed: false,
        topics: ['가솔린 엔진', '디젤 엔진', '하이브리드', '전기차', '연료비 비교']
      },
      {
        id: 'car_sizes',
        title: '📏 자동차 크기 완벽 가이드',
        description: '경차부터 대형 SUV까지, 내게 맞는 크기를 찾아보세요',
        difficulty: 'easy',
        estimatedMinutes: 12,
        completed: false,
        topics: ['경차', '소형차', '준중형차', '중형차', 'SUV', '승합차']
      },
      {
        id: 'purchase_methods',
        title: '💳 똑똑한 자동차 구매 방법',
        description: '현금, 할부, 리스, 렌트의 차이점과 최적 선택법을 알아보세요',
        difficulty: 'medium',
        estimatedMinutes: 20,
        completed: false,
        topics: ['현금 구매', '할부 구매', '리스', '장기렌트', '금리 비교']
      },
      {
        id: 'used_car_guide',
        title: '🔍 중고차 구매 체크리스트',
        description: '중고차 살 때 반드시 확인해야 할 것들을 차근차근 배워보세요',
        difficulty: 'medium',
        estimatedMinutes: 25,
        completed: false,
        topics: ['외관 점검', '내부 점검', '시승 체크', '서류 확인', '가격 협상']
      },
      {
        id: 'insurance_guide',
        title: '🛡️ 자동차 보험 필수 가이드',
        description: '보험 종류부터 보험료 절약까지, 보험의 모든 것을 알아보세요',
        difficulty: 'medium',
        estimatedMinutes: 18,
        completed: false,
        topics: ['의무보험', '종합보험', '보장 범위', '보험료 계산', '할인 혜택']
      },
      {
        id: 'maintenance_costs',
        title: '💰 자동차 유지비 계산기',
        description: '연료비부터 정비비까지, 실제 유지비를 미리 계산해보세요',
        difficulty: 'medium',
        estimatedMinutes: 22,
        completed: false,
        topics: ['연료비', '보험료', '세금', '정비비', '소모품 교체', 'TCO 계산']
      },
      {
        id: 'brands_guide',
        title: '🏷️ 브랜드별 특징 가이드',
        description: '국산차부터 수입차까지, 각 브랜드의 특징과 인기 모델을 알아보세요',
        difficulty: 'medium',
        estimatedMinutes: 30,
        completed: false,
        topics: ['현대', '기아', '제네시스', '독일차', '일본차', '미국차']
      },
      {
        id: 'performance_guide',
        title: '⚡ 자동차 성능 이해하기',
        description: '배기량, 마력, 토크 등 성능 지표를 쉽게 이해해보세요',
        difficulty: 'hard',
        estimatedMinutes: 28,
        completed: false,
        topics: ['배기량', '마력', '토크', '연비', '가속 성능', '연비 측정']
      }
    ];

    // 지식 수준에 따라 필요한 모듈만 선별
    if (knowledgeLevel.level === 'complete_beginner') {
      return allModules.slice(0, 6); // 기초 모듈 6개
    } else if (knowledgeLevel.level === 'basic') {
      return allModules.slice(2, 8); // 중급 모듈 6개
    } else if (knowledgeLevel.level === 'intermediate') {
      return allModules.slice(4, 8); // 심화 모듈 4개
    } else {
      return allModules.slice(6, 8); // 전문 모듈 2개
    }
  };

  // 개인화된 학습 팁 생성
  const generatePersonalizedTips = (knowledgeLevel: CarKnowledgeLevel): string[] => {
    const baseTips = [
      "첫 차 구매는 중고차로 시작하는 것이 경제적입니다",
      "구매 전 반드시 실제 유지비를 계산해보세요",
      "여러 매물을 비교해보고 충분히 고민한 후 결정하세요"
    ];

    if (knowledgeLevel.level === 'complete_beginner') {
      return [
        ...baseTips,
        "차알못도 걱정마세요! 차근차근 배워나가면 됩니다",
        "온라인 강의보다는 실제 매물을 보며 학습하는 것이 효과적입니다",
        "주변 경험자들의 조언을 적극 활용하세요"
      ];
    } else if (knowledgeLevel.level === 'basic') {
      return [
        ...baseTips,
        "기본 지식은 있으니 실무 경험을 쌓아보세요",
        "중고차 매장을 직접 방문해서 다양한 차량을 둘러보세요",
        "온라인 커뮤니티에서 실제 구매 후기를 찾아보세요"
      ];
    } else {
      return [
        ...baseTips,
        "충분한 지식이 있으니 자신 있게 선택하세요",
        "복잡한 금융 상품도 비교 분석해보세요",
        "장기적인 관점에서 총 소유비용을 고려하세요"
      ];
    }
  };

  // 평가 단계 처리
  const handleAssessmentAnswer = (answer: string) => {
    const newAnswers = [...assessmentAnswers, answer];
    setAssessmentAnswers(newAnswers);

    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // 평가 완료 - 결과 분석
      const analyzedLevel = analyzeKnowledgeLevel(newAnswers);
      const modules = generateLearningModules(analyzedLevel);
      const tips = generatePersonalizedTips(analyzedLevel);

      setKnowledgeLevel(analyzedLevel);
      setLearningModules(modules);

      const progress: UserProgress = {
        knowledgeLevel: analyzedLevel,
        completedModules: [],
        totalLearningTime: 0,
        personalizedTips: tips
      };

      setUserProgress(progress);
      setCurrentStep('learning');
    }
  };

  // 학습 모듈 완료 처리
  const handleModuleComplete = (moduleId: string) => {
    const updatedModules = learningModules.map(module =>
      module.id === moduleId ? { ...module, completed: true } : module
    );
    setLearningModules(updatedModules);

    if (userProgress) {
      const newCompletedModules = [...userProgress.completedModules, moduleId];
      const module = learningModules.find(m => m.id === moduleId);
      const newTotalTime = userProgress.totalLearningTime + (module?.estimatedMinutes || 0);

      const updatedProgress: UserProgress = {
        ...userProgress,
        completedModules: newCompletedModules,
        totalLearningTime: newTotalTime
      };

      setUserProgress(updatedProgress);

      // 모든 모듈 완료 시
      if (newCompletedModules.length === learningModules.length) {
        setCurrentStep('completion');
      }
    }
  };

  // 학습 완료 처리
  const handleLearningComplete = () => {
    if (userProgress) {
      onComplete(userProgress);
    }
  };

  // 평가 단계 렌더링
  const renderAssessment = () => {
    const question = assessmentQuestions[currentQuestion];
    const progress = ((currentQuestion) / assessmentQuestions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">
            🎓 차알못 레벨 테스트
          </h1>
          <p className="text-lg text-slate-600">
            현재 자동차 지식 수준을 파악해서 맞춤형 학습 계획을 만들어드려요
          </p>
          <div className="mt-6">
            <Progress value={progress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-slate-500 mt-2">
              {currentQuestion + 1} / {assessmentQuestions.length}
            </p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">
              {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start p-4 h-auto"
                  onClick={() => handleAssessmentAnswer(option)}
                >
                  <span className="flex items-center">
                    <Badge variant="secondary" className="mr-3">
                      {index + 1}
                    </Badge>
                    {option}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // 학습 단계 렌더링
  const renderLearning = () => {
    if (!knowledgeLevel || !userProgress) return null;

    const completedCount = userProgress.completedModules.length;
    const totalCount = learningModules.length;
    const progressPercentage = (completedCount / totalCount) * 100;

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">
            🚗 맞춤형 자동차 학습
          </h1>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mb-6">
            <div className="flex items-center justify-center space-x-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {knowledgeLevel.level === 'complete_beginner' && '🌱 초보'}
                  {knowledgeLevel.level === 'basic' && '🌿 기초'}
                  {knowledgeLevel.level === 'intermediate' && '🌳 중급'}
                  {knowledgeLevel.level === 'advanced' && '🏆 고급'}
                </div>
                <div className="text-sm text-slate-600">현재 레벨</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(knowledgeLevel.score)}점
                </div>
                <div className="text-sm text-slate-600">지식 점수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {completedCount}/{totalCount}
                </div>
                <div className="text-sm text-slate-600">완료 모듈</div>
              </div>
            </div>
            <Progress value={progressPercentage} className="w-full max-w-md mx-auto" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {learningModules.map((module) => (
            <Card key={module.id} className={`${module.completed ? 'bg-green-50 border-green-200' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    {module.title}
                    {module.completed && (
                      <Badge variant="default" className="ml-2 bg-green-500">
                        완료
                      </Badge>
                    )}
                  </CardTitle>
                  <Badge variant={
                    module.difficulty === 'easy' ? 'secondary' :
                    module.difficulty === 'medium' ? 'default' : 'destructive'
                  }>
                    {module.difficulty === 'easy' && '쉬움'}
                    {module.difficulty === 'medium' && '보통'}
                    {module.difficulty === 'hard' && '어려움'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">{module.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-500">
                    ⏱️ 약 {module.estimatedMinutes}분
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {module.topics.map((topic, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
                {!module.completed ? (
                  <Button
                    onClick={() => handleModuleComplete(module.id)}
                    className="w-full"
                  >
                    학습 시작하기
                  </Button>
                ) : (
                  <Button disabled className="w-full bg-green-500">
                    ✓ 학습 완료
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {completedCount === totalCount && (
          <div className="text-center mt-8">
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-green-700 mb-4">
                  🎉 모든 학습을 완료하셨습니다!
                </h2>
                <p className="text-slate-600 mb-6">
                  이제 본격적인 차량 추천 서비스를 받으실 준비가 되셨어요
                </p>
                <Button
                  onClick={handleLearningComplete}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  차량 추천 받기 →
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 맞춤형 팁 */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">💡 맞춤형 구매 팁</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {userProgress.personalizedTips.map((tip, index) => (
              <Card key={index} className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-700">{tip}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-slate-800">
              Agent 1: 차알못 가이드 선생님
            </h1>
            <Badge variant="secondary">맞춤형 자동차 교육</Badge>
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              ← 이전
            </Button>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      {currentStep === 'assessment' && renderAssessment()}
      {currentStep === 'learning' && renderLearning()}
    </div>
  );
}