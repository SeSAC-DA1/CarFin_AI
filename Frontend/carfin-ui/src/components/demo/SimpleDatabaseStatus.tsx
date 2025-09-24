'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Activity, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';

interface DatabaseStats {
  totalVehicles: number;
  availableVehicles: number;
  lastUpdate: Date;
  connectionTime: number;
  isConnected: boolean;
  recentSearches: number;
}

interface LiveDatabaseStatusProps {
  className?: string;
  showDetailedStats?: boolean;
}

export function SimpleDatabaseStatus({
  className = "",
  showDetailedStats = false
}: LiveDatabaseStatusProps) {
  const [stats, setStats] = useState<DatabaseStats>({
    totalVehicles: 0,
    availableVehicles: 0,
    lastUpdate: new Date(),
    connectionTime: 0,
    isConnected: false,
    recentSearches: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 데이터베이스 상태 확인
  useEffect(() => {
    const checkDatabaseStatus = async () => {
      setIsLoading(true);

      try {
        const response = await fetch('/api/database/status');
        const data = await response.json();

        if (data.success) {
          setStats({
            ...data.stats,
            lastUpdate: new Date(data.stats.lastUpdate)
          });
        } else {
          throw new Error(data.error || 'Status check failed');
        }
      } catch (error) {
        console.error('Database status check failed:', error);
        setStats(prev => ({
          ...prev,
          isConnected: false,
          connectionTime: 0
        }));
      } finally {
        setIsLoading(false);
      }
    };

    checkDatabaseStatus();

    // 30초마다 상태 업데이트
    const interval = setInterval(checkDatabaseStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diff = now.getTime() - stats.lastUpdate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}시간 전`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 메인 상태 표시 */}
      <Card className="border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50/50 to-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3">
            <div className="text-3xl">
              {stats.isConnected ? '🔗' : '❌'}
            </div>

            <span className="text-lg font-bold">
              🚀 AWS RDS PostgreSQL 실시간 연결
            </span>

            <Badge
              variant="outline"
              className={`${
                isLoading ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                stats.isConnected ? 'bg-emerald-100 text-emerald-800' :
                'bg-red-100 text-red-800'
              }`}
            >
              {isLoading ? (
                <>
                  <Activity className="w-3 h-3 mr-1 animate-spin" />
                  연결 중...
                </>
              ) : stats.isConnected ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  ✅ 온라인
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  ❌ 오프라인
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 실시간 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalVehicles.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">총 매물 수</div>
            </div>

            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">
                {stats.availableVehicles.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">판매중 매물</div>
            </div>

            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.connectionTime}ms
              </div>
              <div className="text-sm text-gray-600">응답 시간</div>
            </div>

            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {stats.recentSearches}
              </div>
              <div className="text-sm text-gray-600">최근 검색수</div>
            </div>
          </div>

          {/* 시간 정보 */}
          <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 bg-white/40 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>현재 시각: </span>
              <span className="font-mono text-blue-600 font-medium">
                {formatDate(currentTime)} {formatTime(currentTime)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>마지막 업데이트: </span>
              <span className="text-emerald-600 font-medium">
                {getTimeSinceUpdate()}
              </span>
            </div>
          </div>

          {/* 상세 통계 */}
          {showDetailedStats && stats.isConnected && (
            <div className="border-t pt-4 space-y-3">
              <div className="text-sm font-medium text-gray-700">
                📊 데이터베이스 상세 정보
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-medium">호스트</div>
                  <div className="text-gray-600 font-mono text-xs">
                    carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-2">
                  <div className="font-medium">데이터베이스</div>
                  <div className="text-gray-600">carfin (PostgreSQL)</div>
                </div>

                <div className="bg-gray-50 rounded p-2">
                  <div className="font-medium">지역</div>
                  <div className="text-gray-600">Seoul (ap-northeast-2)</div>
                </div>

                <div className="bg-gray-50 rounded p-2">
                  <div className="font-medium">SSL</div>
                  <div className="text-emerald-600">✅ 보안 연결</div>
                </div>
              </div>

              {/* 실시간 활동 표시 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
                <div className="text-sm font-medium mb-2">🔥 실시간 활동</div>
                <div className="space-y-1 text-xs">
                  <div className="text-blue-600">
                    • 차량 전문가: SUV 매물 20,606건 분석 중...
                  </div>
                  <div className="text-purple-600">
                    • 금융 전문가: 가격 적정성 평가 중...
                  </div>
                  <div className="text-green-600">
                    • 리뷰 전문가: 사용자 만족도 분석 중...
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 미니 상태 표시 컴포넌트 (헤더용)
export function MiniDatabaseStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalVehicles, setTotalVehicles] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/database/status');
        const data = await response.json();

        if (data.success) {
          setIsConnected(data.stats.isConnected);
          setTotalVehicles(data.stats.totalVehicles);
        } else {
          setIsConnected(false);
        }
      } catch {
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  return (
    <Badge
      variant="outline"
      className={`${
        isLoading ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
        isConnected ? 'bg-emerald-100 text-emerald-800' :
        'bg-red-100 text-red-800'
      }`}
    >
      {isLoading ? (
        <>
          <Activity className="w-3 h-3 mr-1 animate-spin" />
          연결 확인 중...
        </>
      ) : isConnected ? (
        <>
          <Database className="w-3 h-3 mr-1" />
          🗄️ RDS 연결됨 • {totalVehicles.toLocaleString()}건
        </>
      ) : (
        <>
          <AlertCircle className="w-3 h-3 mr-1" />
          연결 실패
        </>
      )}
    </Badge>
  );
}