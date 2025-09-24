'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Brain, TrendingUp, Target, Activity, Eye, Heart,
  BarChart3, Zap, Clock, Users, Star, Info, Settings
} from 'lucide-react';
import { usePersonalizedLearning } from '@/hooks/usePersonalizedLearning';
import { userBehaviorTracker } from '@/lib/user-behavior-tracker';

interface AILearningMonitorProps {
  userId?: string;
}

export const AILearningMonitor: React.FC<AILearningMonitorProps> = ({ userId = 'guest' }) => {
  const { metrics, getLearningInsights } = usePersonalizedLearning(userId);
  const [insights, setInsights] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const updateInsights = () => {
      try {
        const learningInsights = getLearningInsights();
        const behaviorInsights = userBehaviorTracker.generateInsights(userId);
        setInsights({ ...learningInsights, behavior: behaviorInsights });
      } catch (error) {
        console.warn('Failed to get insights:', error);
      }
    };

    updateInsights();
    const interval = setInterval(updateInsights, 5000); // 5초마다 업데이트
    return () => clearInterval(interval);
  }, [userId, getLearningInsights]);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'text-green-400';
    if (accuracy >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-emerald-400';
    if (confidence >= 0.4) return 'text-orange-400';
    return 'text-gray-400';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 간단한 상태 표시 */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-white">AI 학습 상태</span>
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-6 h-6 p-0 text-gray-400 hover:text-white"
              >
                <Info className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-6 h-6 p-0 text-gray-400 hover:text-white"
              >
                <Settings className="w-3 h-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* 기본 메트릭 */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400">정확도</span>
                  <span className={`font-bold ${getAccuracyColor(metrics.accuracy)}`}>
                    {Math.round(metrics.accuracy * 100)}%
                  </span>
                </div>
                <Progress value={metrics.accuracy * 100} className="h-1" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400">신뢰도</span>
                  <span className={`font-bold ${getConfidenceColor(metrics.confidence)}`}>
                    {Math.round(metrics.confidence * 100)}%
                  </span>
                </div>
                <Progress value={metrics.confidence * 100} className="h-1" />
              </div>
            </div>

            {insights && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>상호작용: {insights.sessionStats?.interactionCount || 0}회</span>
                <span>차량 조회: {insights.sessionStats?.viewedCount || 0}대</span>
              </div>
            )}
          </div>

          {/* 설명 패널 */}
          {showExplanation && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                <Target className="w-3 h-3 mr-1 text-purple-400" />
                AI 학습 시스템 설명
              </h4>

              <div className="space-y-2 text-xs text-gray-300">
                <div>
                  <strong className="text-green-400">정확도 (Accuracy):</strong>
                  <p>최근 10개 추천에 대한 사용자의 긍정적 반응 비율</p>
                  <p>• 좋아요/관심 → 정확도 상승</p>
                  <p>• 싫어요/건너뛰기 → 정확도 하락</p>
                </div>

                <div>
                  <strong className="text-blue-400">신뢰도 (Confidence):</strong>
                  <p>시스템이 사용자 취향을 얼마나 잘 파악했는지</p>
                  <p>• 상호작용 횟수가 많을수록 증가</p>
                  <p>• 일관된 패턴 발견 시 증가</p>
                </div>

                <div>
                  <strong className="text-yellow-400">학습 방식:</strong>
                  <p>🔄 실시간 하이브리드 AI</p>
                  <p>• 규칙 기반 + 패턴 학습</p>
                  <p>• 행동 추적 + 선호도 분석</p>
                  <p>• 브라우저 로컬 저장 (개인정보 보호)</p>
                </div>
              </div>
            </div>
          )}

          {/* 상세 분석 패널 */}
          {isExpanded && insights && (
            <div className="mt-4 space-y-3">
              {/* 선호 브랜드 */}
              {insights.preferences?.preferredBrands?.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-300 mb-1">선호 브랜드</h5>
                  <div className="flex flex-wrap gap-1">
                    {insights.preferences.preferredBrands.slice(0, 3).map((brand: string) => (
                      <Badge key={brand} variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500">
                        {brand}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 가격 범위 */}
              {insights.preferences?.priceRange && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-300 mb-1">학습된 예산 범위</h5>
                  <p className="text-xs text-green-400">
                    {Math.round(insights.preferences.priceRange[0]/10000)}만원 - {Math.round(insights.preferences.priceRange[1]/10000)}만원
                  </p>
                </div>
              )}

              {/* 실시간 활동 */}
              <div>
                <h5 className="text-xs font-semibold text-gray-300 mb-1">실시간 활동</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3 text-blue-400" />
                    <span className="text-gray-400">조회: {insights.sessionStats?.viewedCount || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3 text-red-400" />
                    <span className="text-gray-400">관심: {insights.sessionStats?.interactionCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* 학습 진행률 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">학습 진행률</span>
                  <span className="text-xs text-green-400">
                    {insights.behavior?.insights?.learningProgress || 0}%
                  </span>
                </div>
                <Progress
                  value={insights.behavior?.insights?.learningProgress || 0}
                  className="h-1"
                />
              </div>

              {/* AI 인사이트 */}
              {insights.behavior?.insights?.recommendations?.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-300 mb-1">AI 인사이트</h5>
                  <div className="space-y-1">
                    {insights.behavior.insights.recommendations.slice(0, 2).map((rec: string, idx: number) => (
                      <p key={idx} className="text-xs text-blue-300 italic">
                        💡 {rec}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* 시스템 상태 */}
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">시스템 상태</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400">실시간 학습 중</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 알림 토스트 (새로운 학습 발생 시) */}
      {metrics.confidence > 0.5 && insights?.sessionStats?.interactionCount > 0 && (
        <div className="mt-2 animate-pulse">
          <Card className="bg-green-900/80 border-green-600">
            <CardContent className="p-2">
              <div className="flex items-center space-x-2 text-xs">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-green-300">AI가 당신의 취향을 학습하고 있습니다!</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AILearningMonitor;