'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  User,
  Target,
  DollarSign,
  Settings,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Car,
  Zap
} from 'lucide-react';

interface PersonaAnalysisResult {
  persona_profile: {
    name: string;
    description: string;
    key_characteristics: string[];
    decision_style: string;
  };
  vehicle_requirements: {
    mandatory_features: string[];
    preferred_features: string[];
    size_category: string;
    fuel_type_preference: string;
    brand_considerations: string[];
  };
  recommendation_strategy: {
    emphasis_points: string[];
    avoidance_factors: string[];
    communication_style: string;
    trust_building_elements: string[];
  };
  budget_analysis: {
    realistic_range: { min: number; max: number; };
    value_priorities: string[];
    compromise_suggestions: string[];
  };
}

interface Props {
  analysisResult: {
    success: boolean;
    userProfile: any;
    personaAnalysis: PersonaAnalysisResult;
    mappedProfile: any;
    error?: string;
    fallbackUsed?: boolean;
  };
  onStartRecommendation: (mappedProfile: any) => void;
}

export function PersonaAnalysisResult({ analysisResult, onStartRecommendation }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  if (!analysisResult.success) {
    return (
      <Card className="glass-card border-red-500/50">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="text-heading-lg text-red-300">분석 중 오류가 발생했습니다</h3>
            <p className="text-red-200">{analysisResult.error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="cyber-button"
            >
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { personaAnalysis, mappedProfile } = analysisResult;

  const handleStartRecommendation = async () => {
    setIsLoading(true);
    try {
      onStartRecommendation(mappedProfile);
    } catch (error) {
      console.error('추천 시작 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}억`;
    } else {
      return `${price.toLocaleString()}만원`;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto mode-persona">
      {/* 헤더 */}
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Brain className="w-8 h-8 text-green-400" />
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <h2 className="text-display-md text-white">AI 맞춤 분석 완료!</h2>
            <p className="text-subtitle">
              AI가 분석한 당신만의 맞춤형 차량 프로필이 완성되었어요
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 페르소나 프로필 */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <User className="w-6 h-6 text-green-400" />
            <span>당신의 성향</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <h3 className="text-heading-lg text-green-300">{personaAnalysis.persona_profile.name}</h3>
            <p className="text-body-lg text-gray-300">{personaAnalysis.persona_profile.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-heading-md text-white mb-3">주요 특징</h4>
              <div className="space-y-2">
                {personaAnalysis.persona_profile.key_characteristics.map((characteristic, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">{characteristic}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-heading-md text-white mb-3">선택하는 방식</h4>
              <p className="text-gray-300 bg-slate-800/50 rounded-lg p-3">
                {personaAnalysis.persona_profile.decision_style}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 차량 요구사항 */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Car className="w-6 h-6 text-green-400" />
            <span>추천 차량 조건</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-heading-md text-white mb-3">꼭 필요한 것</h4>
              <div className="flex flex-wrap gap-2">
                {personaAnalysis.vehicle_requirements.mandatory_features.map((feature, index) => (
                  <Badge
                    key={index}
                    className="bg-red-600/20 text-red-300 border-red-500/50"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-heading-md text-white mb-3">있으면 좋은 것</h4>
              <div className="flex flex-wrap gap-2">
                {personaAnalysis.vehicle_requirements.preferred_features.map((feature, index) => (
                  <Badge
                    key={index}
                    className="bg-green-600/20 text-green-300 border-green-500/50"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center bg-slate-800/50 rounded-lg p-4">
              <h5 className="text-body-sm text-gray-400 mb-1">딱 맞는 크기</h5>
              <p className="text-heading-md text-white">{personaAnalysis.vehicle_requirements.size_category}</p>
            </div>

            <div className="text-center bg-slate-800/50 rounded-lg p-4">
              <h5 className="text-body-sm text-gray-400 mb-1">추천 연료</h5>
              <p className="text-heading-md text-white">{personaAnalysis.vehicle_requirements.fuel_type_preference}</p>
            </div>

            <div className="text-center bg-slate-800/50 rounded-lg p-4">
              <h5 className="text-body-sm text-gray-400 mb-1">브랜드 선호</h5>
              <p className="text-heading-md text-white">{personaAnalysis.vehicle_requirements.brand_considerations[0] || '제한 없음'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 예산 분석 */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <DollarSign className="w-6 h-6 text-green-400" />
            <span>가격대 분석</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <h4 className="text-heading-md text-white">딱 맞는 가격대</h4>
            <p className="text-display-sm text-green-300">
              {formatPrice(personaAnalysis.budget_analysis.realistic_range.min)} ~ {formatPrice(personaAnalysis.budget_analysis.realistic_range.max)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-heading-sm text-white mb-3">중요하게 생각하는 것</h5>
              <div className="space-y-2">
                {personaAnalysis.budget_analysis.value_priorities.map((priority, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">{priority}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-heading-sm text-white mb-3">절약할 수 있는 부분</h5>
              <div className="space-y-2">
                {personaAnalysis.budget_analysis.compromise_suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 추천 전략 */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Target className="w-6 h-6 text-green-400" />
            <span>추천 방법</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-heading-sm text-white mb-3">중점사항</h5>
              <div className="flex flex-wrap gap-2">
                {personaAnalysis.recommendation_strategy.emphasis_points.map((point, index) => (
                  <Badge
                    key={index}
                    className="bg-green-600/20 text-green-300 border-green-500/50"
                  >
                    {point}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-heading-sm text-white mb-3">피해야 할 것</h5>
              <div className="flex flex-wrap gap-2">
                {personaAnalysis.recommendation_strategy.avoidance_factors.map((factor, index) => (
                  <Badge
                    key={index}
                    className="bg-green-600/20 text-green-300 border-green-500/50"
                  >
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <h5 className="text-heading-sm text-white mb-2">설명 방식</h5>
            <p className="text-gray-300">{personaAnalysis.recommendation_strategy.communication_style}</p>
          </div>
        </CardContent>
      </Card>

      {/* 차량 추천 시작 버튼 */}
      <Card className="glass-card border-green-500/50">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <h3 className="text-heading-lg text-white">🎯 분석 완료!</h3>
            <p className="text-gray-300">
              이제 AI 추천 시스템이 110,000개 실제 매물에서 당신에게 딱 맞는 차를 찾아드릴게요
            </p>

            <Button
              onClick={handleStartRecommendation}
              disabled={isLoading}
              className="liquid-button text-lg px-8 py-3"
            >
              {isLoading ? (
                <>
                  <Zap className="w-5 h-5 mr-2 animate-spin" />
                  차량 검색 중...
                </>
              ) : (
                <>
                  <Car className="w-5 h-5 mr-2" />
                  맞춤 차량 추천 받기
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-gray-400">
              📊 110,000+ 실제 차량 매물에서 검색합니다
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 디버그 정보 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="glass-card border-gray-600/30">
          <CardHeader>
            <CardTitle className="text-gray-400 text-sm">🔧 개발자 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 font-mono">
              <p>정리된 정보: {JSON.stringify(mappedProfile, null, 2)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}