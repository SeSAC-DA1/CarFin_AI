'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Users,
  Heart,
  Filter
} from 'lucide-react';

interface UserFeedback {
  id: string;
  userId: string;
  vehicleId: string;
  feedbackType: 'like' | 'dislike' | 'rating' | 'comment';
  value: number | string;
  timestamp: Date;
  source: 'recommendation' | 'search' | 'browse';
  context?: {
    searchQuery?: string;
    userProfile?: any;
    sessionId?: string;
  };
}

interface SystemMetrics {
  recommendationAccuracy: number;
  userEngagement: number;
  clickThroughRate: number;
  conversionRate: number;
  avgSessionTime: number;
  totalUsers: number;
  totalFeedback: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

interface FeedbackSystemProps {
  vehicleId?: string;
  userId?: string;
  onFeedbackSubmit?: (feedback: UserFeedback) => void;
  showMetrics?: boolean;
}

export function FeedbackSystem({
  vehicleId,
  userId,
  onFeedbackSubmit,
  showMetrics = false
}: FeedbackSystemProps) {
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [userComment, setUserComment] = useState<string>('');
  const [showCommentForm, setShowCommentForm] = useState(false);

  // 실시간 메트릭 수집
  useEffect(() => {
    const collectMetrics = async () => {
      try {
        const response = await fetch('/api/analytics/metrics', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const metricsData = await response.json();
          setMetrics(metricsData);
        }
      } catch (error) {
        console.error('메트릭 수집 오류:', error);
      }
    };

    if (showMetrics) {
      collectMetrics();
      const interval = setInterval(collectMetrics, 30000); // 30초마다 업데이트
      return () => clearInterval(interval);
    }
  }, [showMetrics]);

  // 피드백 제출
  const submitFeedback = async (type: 'like' | 'dislike' | 'rating' | 'comment', value: number | string) => {
    if (!userId || !vehicleId) return;

    setIsSubmitting(true);

    const feedbackData: UserFeedback = {
      id: `feedback_${Date.now()}`,
      userId,
      vehicleId,
      feedbackType: type,
      value,
      timestamp: new Date(),
      source: 'recommendation',
      context: {
        sessionId: `session_${Date.now()}`,
        userProfile: { timestamp: new Date().toISOString() }
      }
    };

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        setFeedback(prev => [...prev, feedbackData]);
        if (onFeedbackSubmit) {
          onFeedbackSubmit(feedbackData);
        }

        // 성공 시 폼 리셋
        if (type === 'rating') setUserRating(0);
        if (type === 'comment') {
          setUserComment('');
          setShowCommentForm(false);
        }
      }
    } catch (error) {
      console.error('피드백 제출 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 별점 렌더링
  const renderStarRating = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => {
            setUserRating(star);
            submitFeedback('rating', star);
          }}
          disabled={isSubmitting}
          className={`p-1 rounded transition-colors ${
            star <= userRating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
          }`}
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      ))}
    </div>
  );

  // 시스템 건강도 색상
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 퍼센테이지 색상
  const getPercentageColor = (value: number) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 70) return 'text-blue-600';
    if (value >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 사용자 피드백 섹션 */}
      {vehicleId && userId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              이 차량 추천이 도움이 되었나요?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 좋아요/싫어요 버튼 */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => submitFeedback('like', 1)}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                도움됨
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => submitFeedback('dislike', 1)}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                별로임
              </Button>
            </div>

            {/* 별점 평가 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">추천 정확도를 평가해주세요:</p>
              {renderStarRating()}
            </div>

            {/* 코멘트 작성 */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                상세 의견 남기기
              </Button>

              {showCommentForm && (
                <div className="space-y-2">
                  <textarea
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="추천 시스템 개선을 위한 의견을 남겨주세요..."
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                  />
                  <Button
                    size="sm"
                    onClick={() => submitFeedback('comment', userComment)}
                    disabled={!userComment.trim() || isSubmitting}
                  >
                    의견 제출
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 시스템 메트릭 대시보드 */}
      {showMetrics && metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              시스템 성능 모니터링
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* 시스템 상태 */}
              <div className="text-center">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(metrics.systemHealth)}`}>
                  <CheckCircle className="w-3 h-3" />
                  {metrics.systemHealth === 'excellent' ? '최적' :
                   metrics.systemHealth === 'good' ? '양호' :
                   metrics.systemHealth === 'warning' ? '주의' : '위험'}
                </div>
                <p className="text-xs text-gray-600 mt-1">시스템 상태</p>
              </div>

              {/* 사용자 수 */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-lg font-bold">{metrics.totalUsers.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-600">전체 사용자</p>
              </div>

              {/* 피드백 수 */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  <span className="text-lg font-bold">{metrics.totalFeedback.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-600">수집된 피드백</p>
              </div>

              {/* 평균 세션 시간 */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-lg font-bold">{Math.round(metrics.avgSessionTime)}분</span>
                </div>
                <p className="text-xs text-gray-600">평균 세션</p>
              </div>
            </div>

            {/* 성능 지표 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">추천 성능</h4>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">추천 정확도</span>
                  <span className={`font-medium ${getPercentageColor(metrics.recommendationAccuracy)}`}>
                    {metrics.recommendationAccuracy.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">클릭률</span>
                  <span className={`font-medium ${getPercentageColor(metrics.clickThroughRate)}`}>
                    {metrics.clickThroughRate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">전환율</span>
                  <span className={`font-medium ${getPercentageColor(metrics.conversionRate)}`}>
                    {metrics.conversionRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">사용자 참여</h4>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">참여도</span>
                  <span className={`font-medium ${getPercentageColor(metrics.userEngagement)}`}>
                    {metrics.userEngagement.toFixed(1)}%
                  </span>
                </div>

                {/* 개선 동향 */}
                <div className="flex items-center gap-2 mt-4 p-2 bg-green-50 rounded">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    지난 주 대비 추천 정확도 +5.2% 개선
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 최근 피드백 요약 */}
      {feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-500" />
              최근 피드백 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {feedback.slice(-3).map((fb) => (
                <div key={fb.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {fb.feedbackType === 'like' && <ThumbsUp className="w-4 h-4 text-green-600" />}
                    {fb.feedbackType === 'dislike' && <ThumbsDown className="w-4 h-4 text-red-600" />}
                    {fb.feedbackType === 'rating' && <Star className="w-4 h-4 text-yellow-600" />}
                    {fb.feedbackType === 'comment' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                    <span className="text-sm">
                      {fb.feedbackType === 'rating' ? `${fb.value}점 평가` :
                       fb.feedbackType === 'comment' ? '상세 의견' :
                       fb.feedbackType === 'like' ? '도움됨' : '별로임'}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(fb.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}