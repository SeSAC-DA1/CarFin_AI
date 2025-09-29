"""
사용자 피드백 처리 및 추천 시스템 개선 도구
Real-time feedback processing and recommendation system improvement
"""

import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import sqlite3
import numpy as np
from dataclasses import dataclass, asdict

@dataclass
class UserFeedback:
    """사용자 피드백 데이터 구조"""
    id: str
    user_id: str
    vehicle_id: str
    feedback_type: str  # 'like', 'dislike', 'rating', 'comment'
    value: Any  # rating value or comment text
    timestamp: datetime
    source: str  # 'recommendation', 'search', 'browse'
    context: Optional[Dict[str, Any]] = None

@dataclass
class FeedbackInsights:
    """피드백 분석 결과"""
    overall_sentiment: float  # -1 to 1
    recommendation_accuracy: float  # 0 to 1
    user_satisfaction: float  # 0 to 1
    improvement_areas: List[str]
    action_items: List[str]
    trend_analysis: Dict[str, float]

class FeedbackProcessor:
    """피드백 처리 및 분석 엔진"""

    def __init__(self, db_path: str = "feedback.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """피드백 데이터베이스 초기화"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_feedback (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                vehicle_id TEXT NOT NULL,
                feedback_type TEXT NOT NULL,
                value TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                source TEXT NOT NULL,
                context TEXT,
                processed BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS feedback_insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_date DATE NOT NULL,
                overall_sentiment REAL NOT NULL,
                recommendation_accuracy REAL NOT NULL,
                user_satisfaction REAL NOT NULL,
                total_feedback_count INTEGER NOT NULL,
                insights_json TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_behavior_tracking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_data TEXT,
                timestamp DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        conn.commit()
        conn.close()

    async def process_feedback(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """피드백 데이터 처리 및 저장"""
        try:
            # 피드백 객체 생성
            feedback = UserFeedback(
                id=feedback_data.get('id'),
                user_id=feedback_data.get('userId'),
                vehicle_id=feedback_data.get('vehicleId'),
                feedback_type=feedback_data.get('feedbackType'),
                value=feedback_data.get('value'),
                timestamp=datetime.fromisoformat(feedback_data.get('timestamp', datetime.now().isoformat())),
                source=feedback_data.get('source', 'unknown'),
                context=feedback_data.get('context')
            )

            # 데이터베이스에 저장
            await self._store_feedback(feedback)

            # 실시간 분석
            insights = await self._analyze_feedback_realtime(feedback)

            # NCF 모델 업데이트 트리거
            model_update_result = await self._trigger_model_update(feedback)

            return {
                'success': True,
                'feedback_id': feedback.id,
                'insights': asdict(insights),
                'model_updated': model_update_result.get('success', False),
                'processed_at': datetime.now().isoformat()
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'processed_at': datetime.now().isoformat()
            }

    async def _store_feedback(self, feedback: UserFeedback):
        """피드백을 데이터베이스에 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO user_feedback
            (id, user_id, vehicle_id, feedback_type, value, timestamp, source, context)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            feedback.id,
            feedback.user_id,
            feedback.vehicle_id,
            feedback.feedback_type,
            str(feedback.value),
            feedback.timestamp.isoformat(),
            feedback.source,
            json.dumps(feedback.context) if feedback.context else None
        ))

        conn.commit()
        conn.close()

    async def _analyze_feedback_realtime(self, feedback: UserFeedback) -> FeedbackInsights:
        """실시간 피드백 분석"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 최근 24시간 피드백 조회
        yesterday = datetime.now() - timedelta(hours=24)
        cursor.execute('''
            SELECT feedback_type, value, timestamp FROM user_feedback
            WHERE timestamp >= ? AND user_id = ?
            ORDER BY timestamp DESC
        ''', (yesterday.isoformat(), feedback.user_id))

        recent_feedback = cursor.fetchall()
        conn.close()

        # 감정 분석
        sentiment_score = self._calculate_sentiment(recent_feedback)

        # 추천 정확도 계산
        accuracy = self._calculate_recommendation_accuracy(recent_feedback)

        # 사용자 만족도 계산
        satisfaction = self._calculate_user_satisfaction(recent_feedback)

        # 개선 영역 식별
        improvement_areas = self._identify_improvement_areas(recent_feedback)

        # 액션 아이템 생성
        action_items = self._generate_action_items(feedback, recent_feedback)

        # 트렌드 분석
        trend_analysis = await self._analyze_trends()

        return FeedbackInsights(
            overall_sentiment=sentiment_score,
            recommendation_accuracy=accuracy,
            user_satisfaction=satisfaction,
            improvement_areas=improvement_areas,
            action_items=action_items,
            trend_analysis=trend_analysis
        )

    def _calculate_sentiment(self, feedback_list: List[Tuple]) -> float:
        """감정 점수 계산 (-1 to 1)"""
        if not feedback_list:
            return 0.0

        sentiment_scores = []
        for feedback_type, value, _ in feedback_list:
            if feedback_type == 'like':
                sentiment_scores.append(1.0)
            elif feedback_type == 'dislike':
                sentiment_scores.append(-1.0)
            elif feedback_type == 'rating':
                # 1-5 scale을 -1 to 1로 변환
                rating = float(value)
                sentiment_scores.append((rating - 3) / 2)

        return np.mean(sentiment_scores) if sentiment_scores else 0.0

    def _calculate_recommendation_accuracy(self, feedback_list: List[Tuple]) -> float:
        """추천 정확도 계산"""
        if not feedback_list:
            return 0.0

        positive_feedback = 0
        total_feedback = len(feedback_list)

        for feedback_type, value, _ in feedback_list:
            if feedback_type == 'like':
                positive_feedback += 1
            elif feedback_type == 'rating' and float(value) >= 4:
                positive_feedback += 1

        return positive_feedback / total_feedback if total_feedback > 0 else 0.0

    def _calculate_user_satisfaction(self, feedback_list: List[Tuple]) -> float:
        """사용자 만족도 계산"""
        if not feedback_list:
            return 0.5  # 기본값

        satisfaction_scores = []
        for feedback_type, value, _ in feedback_list:
            if feedback_type == 'rating':
                # 1-5 scale을 0-1로 변환
                satisfaction_scores.append((float(value) - 1) / 4)
            elif feedback_type == 'like':
                satisfaction_scores.append(1.0)
            elif feedback_type == 'dislike':
                satisfaction_scores.append(0.0)

        return np.mean(satisfaction_scores) if satisfaction_scores else 0.5

    def _identify_improvement_areas(self, feedback_list: List[Tuple]) -> List[str]:
        """개선 영역 식별"""
        improvement_areas = []

        # 부정적 피드백 분석
        negative_count = sum(1 for feedback_type, value, _ in feedback_list
                           if feedback_type == 'dislike' or
                           (feedback_type == 'rating' and float(value) <= 2))

        if negative_count > len(feedback_list) * 0.3:  # 30% 이상 부정적
            improvement_areas.extend([
                "추천 알고리즘 정확도 개선",
                "사용자 프로필 분석 강화",
                "차량 매칭 로직 재검토"
            ])

        # 평점 분포 분석
        ratings = [float(value) for feedback_type, value, _ in feedback_list
                  if feedback_type == 'rating']

        if ratings:
            avg_rating = np.mean(ratings)
            if avg_rating < 3.5:
                improvement_areas.append("전반적 서비스 품질 개선")
            elif avg_rating < 4.0:
                improvement_areas.append("추천 정밀도 향상")

        return list(set(improvement_areas))  # 중복 제거

    def _generate_action_items(self, current_feedback: UserFeedback,
                             recent_feedback: List[Tuple]) -> List[str]:
        """액션 아이템 생성"""
        action_items = []

        # 현재 피드백 기반 액션
        if current_feedback.feedback_type == 'dislike':
            action_items.extend([
                f"차량 {current_feedback.vehicle_id} 추천 가중치 조정",
                "해당 차량 타입의 사용자 선호도 재분석"
            ])
        elif current_feedback.feedback_type == 'like':
            action_items.extend([
                f"차량 {current_feedback.vehicle_id} 유사 특성 차량 우선 추천",
                "긍정 피드백 패턴 학습 강화"
            ])
        elif current_feedback.feedback_type == 'rating':
            rating = float(current_feedback.value)
            if rating <= 2:
                action_items.append("즉시 추천 로직 검토 필요")
            elif rating >= 4:
                action_items.append("성공 패턴 분석 및 확산")

        # 트렌드 기반 액션
        if len(recent_feedback) >= 5:
            recent_ratings = [float(value) for feedback_type, value, _ in recent_feedback[-5:]
                            if feedback_type == 'rating']
            if recent_ratings and np.mean(recent_ratings) < 3.0:
                action_items.append("사용자별 맞춤화 알고리즘 긴급 점검")

        return action_items

    async def _analyze_trends(self) -> Dict[str, float]:
        """트렌드 분석"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 지난 7일간의 일별 만족도 트렌드
        week_ago = datetime.now() - timedelta(days=7)
        cursor.execute('''
            SELECT DATE(timestamp) as date,
                   AVG(CASE WHEN feedback_type = 'rating' THEN CAST(value as REAL)
                           WHEN feedback_type = 'like' THEN 5.0
                           WHEN feedback_type = 'dislike' THEN 1.0
                           ELSE 3.0 END) as avg_score
            FROM user_feedback
            WHERE timestamp >= ?
            GROUP BY DATE(timestamp)
            ORDER BY date
        ''', (week_ago.isoformat(),))

        daily_scores = cursor.fetchall()
        conn.close()

        trends = {}
        if len(daily_scores) >= 2:
            scores = [score[1] for score in daily_scores]
            trends['satisfaction_trend'] = (scores[-1] - scores[0]) / len(scores) * 100
            trends['volatility'] = float(np.std(scores))
            trends['momentum'] = float(np.mean(scores[-3:]) - np.mean(scores[:3])) if len(scores) >= 6 else 0.0

        return trends

    async def _trigger_model_update(self, feedback: UserFeedback) -> Dict[str, Any]:
        """NCF 모델 실시간 업데이트 트리거"""
        try:
            from .ncf_predict import NCFPredictor

            # 피드백을 평점으로 변환
            if feedback.feedback_type == 'rating':
                rating = float(feedback.value)
            elif feedback.feedback_type == 'like':
                rating = 5.0
            elif feedback.feedback_type == 'dislike':
                rating = 1.0
            else:
                return {'success': False, 'reason': 'Non-ratable feedback'}

            # NCF 모델 온라인 학습
            predictor = NCFPredictor()
            update_result = await predictor.online_learning_update(
                user_id=feedback.user_id,
                item_id=feedback.vehicle_id,
                rating=rating
            )

            return {
                'success': True,
                'model_updated': True,
                'update_result': update_result
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    async def get_analytics_metrics(self) -> Dict[str, Any]:
        """분석 메트릭 조회"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 전체 통계
        cursor.execute('SELECT COUNT(*) FROM user_feedback')
        total_feedback = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(DISTINCT user_id) FROM user_feedback')
        total_users = cursor.fetchone()[0]

        # 최근 24시간 메트릭
        yesterday = datetime.now() - timedelta(hours=24)
        cursor.execute('''
            SELECT feedback_type, value FROM user_feedback
            WHERE timestamp >= ?
        ''', (yesterday.isoformat(),))

        recent_feedback = cursor.fetchall()
        conn.close()

        # 메트릭 계산
        sentiment = self._calculate_sentiment(recent_feedback)
        accuracy = self._calculate_recommendation_accuracy(recent_feedback)
        satisfaction = self._calculate_user_satisfaction(recent_feedback)

        # 참여도 계산 (피드백 제출률)
        engagement = min(len(recent_feedback) / max(total_users, 1) * 100, 100)

        # 클릭률 및 전환율 시뮬레이션 (실제 환경에서는 실제 데이터 사용)
        ctr = 12.5 + sentiment * 5  # 감정에 따른 CTR 조정
        conversion_rate = 8.2 + satisfaction * 10  # 만족도에 따른 전환율

        # 시스템 건강도
        health_score = (accuracy + satisfaction + (sentiment + 1) / 2) / 3
        if health_score >= 0.9:
            system_health = 'excellent'
        elif health_score >= 0.8:
            system_health = 'good'
        elif health_score >= 0.7:
            system_health = 'warning'
        else:
            system_health = 'critical'

        return {
            'success': True,
            'metrics': {
                'recommendationAccuracy': accuracy * 100,
                'userEngagement': engagement,
                'clickThroughRate': max(ctr, 0),
                'conversionRate': max(conversion_rate, 0),
                'avgSessionTime': 15.7 + satisfaction * 10,  # 만족도에 따른 세션 시간
                'totalUsers': total_users,
                'totalFeedback': total_feedback,
                'systemHealth': system_health,
                'lastUpdated': datetime.now().isoformat(),
                'trends': await self._analyze_trends()
            }
        }

# 전역 피드백 프로세서 인스턴스
feedback_processor = FeedbackProcessor()

async def process_user_feedback(feedback_data: Dict[str, Any]) -> Dict[str, Any]:
    """사용자 피드백 처리 메인 함수"""
    return await feedback_processor.process_feedback(feedback_data)

async def get_system_metrics() -> Dict[str, Any]:
    """시스템 메트릭 조회 메인 함수"""
    return await feedback_processor.get_analytics_metrics()