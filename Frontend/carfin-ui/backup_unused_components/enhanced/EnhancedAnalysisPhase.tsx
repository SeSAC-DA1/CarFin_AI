'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Calculator, BookOpen, Users, Brain, TrendingUp } from 'lucide-react';

interface UserData {
  category?: 'economy' | 'family' | 'hobby';
  usage?: string;
  budget?: string;
  priority?: string;
  lifestyle?: {
    commute?: { from: string; to: string; distance: number };
    family?: { members: number; children: boolean; ages?: number[] };
    parking?: 'apartment' | 'house' | 'street' | 'office';
    driving_experience?: number;
  };
}

interface EnhancedAnalysisResults {
  transparency_scorecard?: any[];
  personalized_cost_simulation?: any;
  tutor_explanations?: any;
  similar_buyer_analysis?: any;
  multi_agent_analysis?: any;
  recommendations?: any[];
}

interface Props {
  userData: UserData;
  onAnalysisComplete: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isTossStyleMatching?: boolean;
}

export function EnhancedAnalysisPhase({
  userData,
  onAnalysisComplete,
  isLoading,
  setIsLoading,
  isTossStyleMatching = false
}: Props) {
  const [currentStage, setCurrentStage] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<EnhancedAnalysisResults>({});
  const [progress, setProgress] = useState(0);

  const analysisStages = [
    {
      name: '투명성 검증',
      icon: Shield,
      description: 'RDS 데이터 기반 사고이력 및 신뢰도 분석',
      duration: 3000
    },
    {
      name: '개인화 비용 계산',
      icon: Calculator,
      description: '당신의 라이프스타일 맞춤 총 비용 시뮬레이션',
      duration: 2500
    },
    {
      name: 'AI 튜터 준비',
      icon: BookOpen,
      description: '차알못 친화적 용어 및 설명 생성',
      duration: 2000
    },
    {
      name: '유사 구매자 분석',
      icon: Users,
      description: '같은 처지 구매자들의 실제 선택과 후기 분석',
      duration: 2500
    },
    {
      name: 'Gemini AI 협업',
      icon: Brain,
      description: '3명의 전문가 AI가 종합 분석 및 협의',
      duration: 3000
    }
  ];

  useEffect(() => {
    if (isLoading) {
      startEnhancedAnalysis();
    }
  }, [isLoading]);

  const startEnhancedAnalysis = async () => {
    try {
      setProgress(0);
      setCurrentStage(0);

      // 단계별 분석 시뮬레이션
      for (let i = 0; i < analysisStages.length; i++) {
        setCurrentStage(i);

        // 단계별 진행률 업데이트
        const stageProgress = (i / analysisStages.length) * 100;
        setProgress(stageProgress);

        // 실제 API 호출은 마지막 단계에서만
        if (i === analysisStages.length - 1) {
          const response = await fetch('/api/gemini-enhanced', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: `enhanced_consultation_${Date.now()}`,
              userProfile: {
                usage: userData.usage,
                budget: userData.budget,
                priority: userData.priority,
                age: 30, // 임시값
                lifestyle: userData.lifestyle || {
                  commute: { from: '강남', to: '분당', distance: 20 },
                  family: { members: 2, children: userData.category === 'family' },
                  parking: 'apartment',
                  driving_experience: 3
                }
              },
              analysisType: 'enhanced_gemini_multi_agent'
            })
          });

          if (response.ok) {
            const data = await response.json();
            setAnalysisResults(data);
          }
        }

        await new Promise(resolve => setTimeout(resolve, analysisStages[i].duration));
      }

      setProgress(100);
      setIsLoading(false);
      onAnalysisComplete();

    } catch (error) {
      console.error('Enhanced 분석 오류:', error);
      setIsLoading(false);
    }
  };

  if (!isLoading && Object.keys(analysisResults).length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">

        {/* 분석 진행 중 화면 */}
        {isLoading && (
          <div className="space-y-8">
            {/* 전체 진행률 */}
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-center">
                  🚀 Enhanced CarFin AI 분석 진행 중
                </CardTitle>
                <div className="text-center text-purple-200">
                  기존 플랫폼과 차별화된 4가지 핵심 분석을 수행합니다
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} className="h-3 bg-slate-700" />
                <div className="text-center text-purple-300">
                  {Math.round(progress)}% 완료
                </div>
              </CardContent>
            </Card>

            {/* 단계별 진행 상황 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisStages.map((stage, index) => {
                const StageIcon = stage.icon;
                const isActive = index === currentStage;
                const isCompleted = index < currentStage;

                return (
                  <Card
                    key={index}
                    className={`transition-all duration-500 ${
                      isActive
                        ? 'bg-gradient-to-br from-purple-600/30 to-blue-600/30 border-purple-400/50 scale-105'
                        : isCompleted
                        ? 'bg-green-600/20 border-green-400/30'
                        : 'bg-black/20 border-slate-600/30'
                    }`}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                        isActive ? 'bg-purple-500' : isCompleted ? 'bg-green-500' : 'bg-slate-600'
                      }`}>
                        <StageIcon className="w-6 h-6 text-white" />
                      </div>

                      <h3 className="text-white font-bold mb-2">{stage.name}</h3>
                      <p className="text-slate-300 text-sm mb-3">{stage.description}</p>

                      {isActive && (
                        <Badge variant="secondary" className="bg-purple-500 text-white">
                          진행 중...
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge variant="secondary" className="bg-green-500 text-white">
                          완료 ✓
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 실시간 인사이트 미리보기 */}
            {currentStage >= 2 && (
              <Card className="bg-black/40 border-yellow-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-yellow-400 font-bold mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    실시간 분석 인사이트
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-white">
                    <div>
                      <div className="text-sm text-slate-300">투명성 스코어</div>
                      <div className="text-2xl font-bold text-green-400">94/100</div>
                      <div className="text-xs text-slate-400">사고이력 없는 차량 8대 발견</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-300">예상 월 절약액</div>
                      <div className="text-2xl font-bold text-blue-400">15만원</div>
                      <div className="text-xs text-slate-400">기존 차량 대비 연료비 절약</div>
                    </div>
                    {currentStage >= 3 && (
                      <div>
                        <div className="text-sm text-slate-300">유사 구매자</div>
                        <div className="text-2xl font-bold text-purple-400">128명</div>
                        <div className="text-xs text-slate-400">같은 조건 구매자 분석 완료</div>
                      </div>
                    )}
                    {currentStage >= 4 && (
                      <div>
                        <div className="text-sm text-slate-300">AI 협업 상태</div>
                        <div className="text-2xl font-bold text-orange-400">진행 중</div>
                        <div className="text-xs text-slate-400">3명 전문가 의견 수렴 중</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 분석 완료 후 결과 미리보기 */}
        {!isLoading && analysisResults && (
          <Card className="bg-black/40 border-green-500/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-green-400 text-center">
                ✅ Enhanced 분석 완료!
              </CardTitle>
              <div className="text-center text-green-200">
                기존 중고차 플랫폼에서는 볼 수 없는 4가지 차별화 인사이트를 확인하세요
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <div className="bg-purple-600/20 p-4 rounded-lg">
                  <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-white font-bold">투명성 보장</div>
                  <div className="text-sm text-purple-200">완전 공개</div>
                </div>
                <div className="bg-blue-600/20 p-4 rounded-lg">
                  <Calculator className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-white font-bold">맞춤 비용 계산</div>
                  <div className="text-sm text-blue-200">월 15만원 절약</div>
                </div>
                <div className="bg-green-600/20 p-4 rounded-lg">
                  <BookOpen className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-white font-bold">차알못 친화</div>
                  <div className="text-sm text-green-200">쉬운 설명</div>
                </div>
                <div className="bg-orange-600/20 p-4 rounded-lg">
                  <Users className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <div className="text-white font-bold">실제 후기</div>
                  <div className="text-sm text-orange-200">128명 분석</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}