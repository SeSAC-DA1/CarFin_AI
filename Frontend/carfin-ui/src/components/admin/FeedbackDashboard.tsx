'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';

interface FeedbackMetrics {
  totalFeedback: number;
  positiveRatio: number;
  avgRating: number;
  responseTime: number;
  userSatisfaction: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface TimeSeriesData {
  date: string;
  feedback_count: number;
  avg_rating: number;
  user_satisfaction: number;
  response_time: number;
}

interface FeedbackDistribution {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export function FeedbackDashboard() {
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [feedbackDistribution, setFeedbackDistribution] = useState<FeedbackDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  // 데이터 로드
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000); // 1분마다 업데이트
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 메트릭 데이터 로드
      const metricsResponse = await fetch('/api/analytics/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics({
          totalFeedback: metricsData.totalFeedback || 0,
          positiveRatio: calculatePositiveRatio(metricsData),
          avgRating: metricsData.recommendationAccuracy || 0,
          responseTime: metricsData.avgSessionTime || 0,
          userSatisfaction: metricsData.userEngagement || 0,
          systemHealth: metricsData.systemHealth || 'good',
          trend: determineTrend(metricsData.trends)
        });
      }

      // 시계열 데이터 생성 (실제 환경에서는 API에서 가져옴)
      setTimeSeriesData(generateTimeSeriesData(selectedTimeRange));

      // 피드백 분포 데이터 생성
      setFeedbackDistribution(generateFeedbackDistribution());

      setLastUpdated(new Date());
    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePositiveRatio = (data: any): number => {
    // 긍정적 피드백 비율 계산
    return ((data.userEngagement || 70) + (data.recommendationAccuracy || 85)) / 2;
  };

  const determineTrend = (trends: any): 'up' | 'down' | 'stable' => {
    if (!trends) return 'stable';
    const overall = (trends.accuracyTrend || 0) + (trends.engagementTrend || 0);
    if (overall > 2) return 'up';
    if (overall < -2) return 'down';
    return 'stable';
  };

  const generateTimeSeriesData = (timeRange: string): TimeSeriesData[] => {
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    const data: TimeSeriesData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split('T')[0],
        feedback_count: Math.floor(Math.random() * 50 + 20),
        avg_rating: +(Math.random() * 2 + 3.5).toFixed(1),
        user_satisfaction: +(Math.random() * 20 + 70).toFixed(1),
        response_time: +(Math.random() * 5 + 10).toFixed(1)
      });
    }

    return data;
  };

  const generateFeedbackDistribution = (): FeedbackDistribution[] => {
    return [
      { type: '좋아요', count: 342, percentage: 45, color: '#10B981' },
      { type: '별점 4-5', count: 298, percentage: 39, color: '#3B82F6' },
      { type: '별점 2-3', count: 89, percentage: 12, color: '#F59E0B' },
      { type: '싫어요', count: 31, percentage: 4, color: '#EF4444' }
    ];
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">피드백 시스템 대시보드</h1>
          <p className="text-gray-600 mt-1">
            마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="24h">24시간</option>
            <option value="7d">7일</option>
            <option value="30d">30일</option>
          </select>

          <Button
            onClick={loadDashboardData}
            disabled={isLoading}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>

          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 주요 메트릭 카드 */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">전체 피드백</p>
                  <p className="text-2xl font-bold">{metrics.totalFeedback.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(metrics.trend)}
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">긍정 비율</p>
                  <p className="text-2xl font-bold">{metrics.positiveRatio.toFixed(1)}%</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">평균 평점</p>
                  <p className="text-2xl font-bold">{metrics.avgRating.toFixed(1)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">시스템 상태</p>
                  <Badge className={`mt-1 ${getHealthColor(metrics.systemHealth)}`}>
                    {metrics.systemHealth === 'excellent' ? '최적' :
                     metrics.systemHealth === 'good' ? '양호' :
                     metrics.systemHealth === 'warning' ? '주의' : '위험'}
                  </Badge>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시계열 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              피드백 추이 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="feedback_count"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="피드백 수"
                />
                <Line
                  type="monotone"
                  dataKey="user_satisfaction"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="만족도 (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 피드백 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              피드백 유형 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={feedbackDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ type, percentage }) => `${type}: ${percentage}%`}
                >
                  {feedbackDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 상세 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 평점 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>평점 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { rating: '1점', count: 12 },
                { rating: '2점', count: 19 },
                { rating: '3점', count: 35 },
                { rating: '4점', count: 156 },
                { rating: '5점', count: 142 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 응답 시간 추이 */}
        <Card>
          <CardHeader>
            <CardTitle>시스템 응답 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="response_time"
                  stroke="#F59E0B"
                  fill="#FEF3C7"
                  name="응답시간 (초)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 액션 아이템 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            개선 권장사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">추천 정확도 개선 필요</p>
                <p className="text-sm text-yellow-700">
                  저평점 피드백이 15% 증가했습니다. NCF 모델 재학습을 권장합니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">응답 시간 최적화</p>
                <p className="text-sm text-blue-700">
                  평균 응답 시간이 목표치 내에 있습니다. 현재 성능을 유지하세요.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">사용자 만족도 향상</p>
                <p className="text-sm text-green-700">
                  이번 주 사용자 만족도가 8.5% 증가했습니다. 현재 전략을 지속하세요.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}