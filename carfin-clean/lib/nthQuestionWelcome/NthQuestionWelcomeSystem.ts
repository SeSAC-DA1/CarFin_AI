// lib/nthQuestionWelcome/NthQuestionWelcomeSystem.ts

import { UserTracker, UserSession, SearchHistory, PersonalizedInsights } from './UserIdentification';
import { WelcomeMessageGenerator, WelcomeMessage } from './WelcomeMessageGenerator';

interface WelcomeSystemConfig {
  enablePersonalization: boolean;
  enableMilestoneTracking: boolean;
  enableAnalytics: boolean;
  debugMode: boolean;
}

interface QuestionEvent {
  userId: string;
  sessionId: string;
  questionCount: number;
  question: string;
  detectedPersona?: string;
  budget: { min: number; max: number };
  timestamp: Date;
}

export class NthQuestionWelcomeSystem {
  private userTracker: UserTracker;
  private messageGenerator: WelcomeMessageGenerator;
  private config: WelcomeSystemConfig;

  constructor(config: Partial<WelcomeSystemConfig> = {}) {
    this.userTracker = new UserTracker();
    this.messageGenerator = new WelcomeMessageGenerator();
    this.config = {
      enablePersonalization: true,
      enableMilestoneTracking: true,
      enableAnalytics: true,
      debugMode: false,
      ...config
    };
  }

  // 메인 환영 시스템 진입점
  async processQuestion(
    question: string,
    detectedPersona?: string,
    budget?: { min: number; max: number }
  ): Promise<{
    welcomeMessage: WelcomeMessage;
    userSession: UserSession;
    questionEvent: QuestionEvent;
    progressInfo: any;
  }> {
    try {
      // 1. 사용자 세션 가져오기 또는 생성
      const userSession = this.userTracker.getOrCreateUserSession();

      // 2. 질문 카운트 증가
      const newQuestionCount = this.userTracker.incrementQuestionCount(userSession.userId);

      // 3. 개인화 인사이트 생성 (설정이 활성화된 경우)
      let personalizedInsights: PersonalizedInsights | undefined;
      if (this.config.enablePersonalization) {
        personalizedInsights = this.userTracker.generatePersonalizedInsights(userSession.userId);
      }

      // 4. 환영 메시지 생성
      let welcomeMessage: WelcomeMessage;
      if (this.config.enablePersonalization && personalizedInsights) {
        welcomeMessage = this.messageGenerator.generateContextualWelcome(
          newQuestionCount,
          userSession,
          personalizedInsights
        );
      } else {
        welcomeMessage = this.messageGenerator.generateWelcomeMessage(
          newQuestionCount,
          userSession
        );
      }

      // 5. 검색 히스토리에 추가
      if (budget) {
        const searchHistory: SearchHistory = {
          timestamp: new Date(),
          query: question,
          detectedPersona,
          budget,
          recommendations: [] // 나중에 추천 결과로 업데이트
        };

        this.userTracker.addSearchToHistory(userSession.userId, searchHistory);
      }

      // 6. 질문 이벤트 생성
      const questionEvent: QuestionEvent = {
        userId: userSession.userId,
        sessionId: userSession.sessionId,
        questionCount: newQuestionCount,
        question,
        detectedPersona,
        budget: budget || { min: 1000, max: 10000 },
        timestamp: new Date()
      };

      // 7. 진행률 정보 생성
      const progressInfo = this.messageGenerator.getProgressToNextMilestone(newQuestionCount);

      // 8. 마일스톤 달성 추적 (설정이 활성화된 경우)
      if (this.config.enableMilestoneTracking) {
        this.trackMilestoneAchievement(questionEvent);
      }

      // 9. 디버그 로깅
      if (this.config.debugMode) {
        console.log('🎯 N번째 질문 환영 시스템:', {
          questionCount: newQuestionCount,
          persona: detectedPersona,
          milestone: welcomeMessage.milestone,
          progressInfo
        });
      }

      return {
        welcomeMessage,
        userSession: { ...userSession, questionCount: newQuestionCount },
        questionEvent,
        progressInfo
      };

    } catch (error) {
      console.error('🚨 N번째 질문 환영 시스템 오류:', error);

      // 기본 환영 메시지 반환
      return this.getFailsafeWelcome(question, detectedPersona, budget);
    }
  }

  // 추천 결과를 히스토리에 업데이트
  updateSearchResults(
    userId: string,
    recommendations: string[],
    userFeedback?: 'satisfied' | 'unsatisfied' | 'neutral'
  ): void {
    try {
      const history = this.userTracker.getSearchHistory(userId);
      if (history.length > 0) {
        // 가장 최근 검색 결과 업데이트
        const latestSearch = history[history.length - 1];
        latestSearch.recommendations = recommendations;
        if (userFeedback) {
          latestSearch.userFeedback = userFeedback;
        }

        // 업데이트된 히스토리 저장
        this.saveUpdatedHistory(userId, history);
      }
    } catch (error) {
      console.error('🚨 검색 결과 업데이트 오류:', error);
    }
  }

  // 사용자 통계 조회
  getUserStats(userId?: string): {
    totalQuestions: number;
    visitCount: number;
    favoritePersona: string | null;
    currentBadge: string;
    nextMilestone: number;
    memberSince: Date | null;
  } {
    try {
      const userSession = userId
        ? this.getUserSession(userId)
        : this.userTracker.getOrCreateUserSession();

      const insights = this.config.enablePersonalization
        ? this.userTracker.generatePersonalizedInsights(userSession.userId)
        : null;

      const progressInfo = this.messageGenerator.getProgressToNextMilestone(userSession.questionCount);
      const welcomeMessage = this.messageGenerator.generateWelcomeMessage(userSession.questionCount);

      return {
        totalQuestions: userSession.questionCount,
        visitCount: userSession.visitCount,
        favoritePersona: insights?.favoritePersona || null,
        currentBadge: welcomeMessage.badge || '👋 Welcome',
        nextMilestone: progressInfo.nextMilestone,
        memberSince: userSession.firstVisit
      };
    } catch (error) {
      console.error('🚨 사용자 통계 조회 오류:', error);
      return this.getDefaultStats();
    }
  }

  // 관리자용 전체 통계
  getSystemStats(): {
    totalUsers: number;
    totalQuestions: number;
    milestoneDistribution: { [milestone: string]: number };
    averageQuestionsPerUser: number;
  } {
    try {
      // localStorage에서 전체 사용자 데이터 수집
      if (typeof window === 'undefined') {
        return this.getDefaultSystemStats();
      }

      const users: UserSession[] = [];
      const questions: number[] = [];

      // localStorage에서 모든 사용자 세션 수집
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('carfin_user_')) {
          try {
            const userSession = JSON.parse(localStorage.getItem(key)!);
            users.push(userSession);
            questions.push(userSession.questionCount);
          } catch (error) {
            // 무시
          }
        }
      }

      const totalQuestions = questions.reduce((sum, count) => sum + count, 0);
      const milestoneDistribution = this.calculateMilestoneDistribution(questions);

      return {
        totalUsers: users.length,
        totalQuestions,
        milestoneDistribution,
        averageQuestionsPerUser: users.length > 0 ? totalQuestions / users.length : 0
      };
    } catch (error) {
      console.error('🚨 시스템 통계 조회 오류:', error);
      return this.getDefaultSystemStats();
    }
  }

  private getUserSession(userId: string): UserSession {
    if (typeof window === 'undefined') {
      return this.userTracker.getOrCreateUserSession();
    }

    const storageKey = `carfin_user_${userId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to get user session');
      }
    }

    return this.userTracker.getOrCreateUserSession();
  }

  private saveUpdatedHistory(userId: string, history: SearchHistory[]): void {
    if (typeof window !== 'undefined') {
      const historyKey = `carfin_history_${userId}`;
      localStorage.setItem(historyKey, JSON.stringify(history));
    }
  }

  private trackMilestoneAchievement(questionEvent: QuestionEvent): void {
    const milestones = [1, 2, 3, 5, 10, 25, 50, 100];

    if (milestones.includes(questionEvent.questionCount)) {
      // 마일스톤 달성 이벤트 트래킹
      this.logMilestoneAchievement(questionEvent);
    }
  }

  private logMilestoneAchievement(questionEvent: QuestionEvent): void {
    if (this.config.debugMode) {
      console.log(`🎉 마일스톤 달성! ${questionEvent.userId}님이 ${questionEvent.questionCount}번째 질문 달성`);
    }

    // 실제 구현에서는 Google Analytics나 다른 분석 도구로 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'milestone_achievement', {
        event_category: 'user_engagement',
        event_label: `${questionEvent.questionCount}th_question`,
        value: questionEvent.questionCount,
        custom_parameter_user_id: questionEvent.userId
      });
    }
  }

  private calculateMilestoneDistribution(questionCounts: number[]): { [milestone: string]: number } {
    const distribution: { [milestone: string]: number } = {
      '1+': 0,
      '5+': 0,
      '10+': 0,
      '25+': 0,
      '50+': 0
    };

    questionCounts.forEach(count => {
      if (count >= 50) distribution['50+']++;
      else if (count >= 25) distribution['25+']++;
      else if (count >= 10) distribution['10+']++;
      else if (count >= 5) distribution['5+']++;
      else if (count >= 1) distribution['1+']++;
    });

    return distribution;
  }

  private getFailsafeWelcome(
    question: string,
    detectedPersona?: string,
    budget?: { min: number; max: number }
  ) {
    const defaultMessage: WelcomeMessage = {
      message: "CarFin AI에 오신 것을 환영합니다! 완벽한 중고차를 찾아드릴게요.",
      badge: "👋 Welcome",
      emoji: "👋"
    };

    const defaultSession: UserSession = {
      userId: 'failsafe_user',
      sessionId: 'failsafe_session',
      visitCount: 1,
      questionCount: 1,
      firstVisit: new Date(),
      lastVisit: new Date()
    };

    const defaultEvent: QuestionEvent = {
      userId: 'failsafe_user',
      sessionId: 'failsafe_session',
      questionCount: 1,
      question,
      detectedPersona,
      budget: budget || { min: 1000, max: 10000 },
      timestamp: new Date()
    };

    return {
      welcomeMessage: defaultMessage,
      userSession: defaultSession,
      questionEvent: defaultEvent,
      progressInfo: { nextMilestone: 2, progress: 50, remaining: 1 }
    };
  }

  private getDefaultStats() {
    return {
      totalQuestions: 0,
      visitCount: 0,
      favoritePersona: null,
      currentBadge: '👋 Welcome',
      nextMilestone: 1,
      memberSince: new Date()
    };
  }

  private getDefaultSystemStats() {
    return {
      totalUsers: 0,
      totalQuestions: 0,
      milestoneDistribution: { '1+': 0, '5+': 0, '10+': 0, '25+': 0, '50+': 0 },
      averageQuestionsPerUser: 0
    };
  }
}

export type { QuestionEvent, WelcomeSystemConfig };
export type { UserSession };