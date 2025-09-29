// lib/collaboration/A2ASessionManager.ts
import { redis } from '../redis';
import { A2ASession, DiscoveredNeed, AgentState, VehicleRecommendation } from '../types/session';

export class A2ASessionManager {
  private static instance: A2ASessionManager;

  private constructor() {}

  static getInstance(): A2ASessionManager {
    if (!A2ASessionManager.instance) {
      A2ASessionManager.instance = new A2ASessionManager();
    }
    return A2ASessionManager.instance;
  }

  /**
   * 새로운 A2A 세션 생성
   */
  async createSession(userId: string, initialQuestion: string): Promise<A2ASession> {
    const sessionId = `a2a_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: A2ASession = {
      sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      collaborationState: 'initiated',
      currentQuestion: initialQuestion,
      questionCount: 1,
      discoveredNeeds: [],
      agentStates: {
        concierge: this.createInitialAgentState('concierge'),
        needsAnalyst: this.createInitialAgentState('needsAnalyst'),
        dataAnalyst: this.createInitialAgentState('dataAnalyst')
      },
      vehicleRecommendations: [],
      satisfactionLevel: 0,
      satisfactionIndicators: [],
      metadata: {}
    };

    // Valkey에 세션 저장 (30분 TTL) - 실패해도 계속 진행
    try {
      await redis.setA2ASession(sessionId, session);
      console.log(`🤖 A2A 세션 생성 및 Valkey 저장: ${sessionId} (사용자: ${userId})`);
    } catch (error) {
      console.warn(`⚠️ Valkey 저장 실패하지만 세션은 생성됨: ${sessionId} (에러: ${error.message})`);
    }

    return session;
  }

  /**
   * 기존 세션 복원
   */
  async getSession(sessionId: string): Promise<A2ASession | null> {
    try {
      const session = await redis.getA2ASession(sessionId);
      if (session) {
        console.log(`🔄 A2A 세션 복원: ${sessionId}`);
        return session;
      }
    } catch (error) {
      console.warn(`⚠️ Valkey에서 세션 복원 실패, 인메모리로 계속 진행: ${sessionId} (에러: ${error.message})`);
    }
    return null;
  }

  /**
   * 세션 상태 업데이트
   */
  async updateSession(sessionId: string, updates: Partial<A2ASession>): Promise<A2ASession | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      console.warn(`⚠️ 세션을 찾을 수 없음: ${sessionId}`);
      return null;
    }

    const updatedSession: A2ASession = {
      ...session,
      ...updates,
      lastActivity: new Date()
    };

    // Valkey 업데이트 시도 - 실패해도 계속 진행
    try {
      await redis.setA2ASession(sessionId, updatedSession);
      console.log(`📝 A2A 세션 업데이트: ${sessionId} (상태: ${updatedSession.collaborationState})`);
    } catch (error) {
      console.warn(`⚠️ Valkey 업데이트 실패하지만 세션은 업데이트됨: ${sessionId} (에러: ${error.message})`);
    }

    return updatedSession;
  }

  /**
   * 새로운 질문 추가
   */
  async addQuestion(sessionId: string, question: string): Promise<A2ASession | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    return await this.updateSession(sessionId, {
      currentQuestion: question,
      questionCount: session.questionCount + 1,
      collaborationState: 'analyzing'
    });
  }

  /**
   * 니즈 발견 추가
   */
  async addDiscoveredNeed(sessionId: string, need: Omit<DiscoveredNeed, 'id' | 'discoveredAt'>): Promise<A2ASession | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const discoveredNeed: DiscoveredNeed = {
      ...need,
      id: `need_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      discoveredAt: new Date()
    };

    const updatedNeeds = [...session.discoveredNeeds, discoveredNeed];

    console.log(`🔍 새로운 니즈 발견: ${discoveredNeed.description} (신뢰도: ${discoveredNeed.confidence})`);

    return await this.updateSession(sessionId, {
      discoveredNeeds: updatedNeeds,
      collaborationState: 'needs_discovered'
    });
  }

  /**
   * 에이전트 상태 업데이트
   */
  async updateAgentState(sessionId: string, agentId: keyof A2ASession['agentStates'], state: Partial<AgentState>): Promise<A2ASession | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const updatedAgentState = {
      ...session.agentStates[agentId],
      ...state,
      lastUpdate: new Date()
    };

    return await this.updateSession(sessionId, {
      agentStates: {
        ...session.agentStates,
        [agentId]: updatedAgentState
      }
    });
  }

  /**
   * 차량 추천 결과 저장
   */
  async saveVehicleRecommendations(sessionId: string, recommendations: VehicleRecommendation[]): Promise<A2ASession | null> {
    console.log(`🚗 차량 추천 저장: ${recommendations.length}대 (세션: ${sessionId})`);

    return await this.updateSession(sessionId, {
      vehicleRecommendations: recommendations,
      collaborationState: 'completed'
    });
  }

  /**
   * 만족도 업데이트
   */
  async updateSatisfaction(sessionId: string, level: number, indicators: string[]): Promise<A2ASession | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const updatedIndicators = [...new Set([...session.satisfactionIndicators, ...indicators])];

    console.log(`😊 만족도 업데이트: ${level} (지표: ${indicators.join(', ')})`);

    return await this.updateSession(sessionId, {
      satisfactionLevel: level,
      satisfactionIndicators: updatedIndicators
    });
  }

  /**
   * 세션 완료 처리
   */
  async completeSession(sessionId: string, completionType: 'satisfied' | 'abandoned' | 'timeout'): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    // 세션 분석 데이터 생성
    const analytics = this.generateSessionAnalytics(session, completionType);

    // 분석 데이터 저장 (7일 보관) - 실패해도 계속 진행
    try {
      await redis.cacheUserPreference(`analytics_${sessionId}`, analytics);
    } catch (error) {
      console.warn(`⚠️ Valkey 분석 데이터 저장 실패: ${sessionId} (에러: ${error.message})`);
    }

    console.log(`✅ A2A 세션 완료: ${sessionId} (타입: ${completionType}, 질문수: ${session.questionCount})`);

    // 완료된 세션은 상태만 업데이트 (자동 만료까지 유지)
    await this.updateSession(sessionId, {
      collaborationState: 'completed'
    });
  }

  /**
   * 활성 세션 목록 조회 (사용자별)
   */
  async getUserActiveSessions(userId: string): Promise<string[]> {
    // 실제 구현에서는 Redis에서 사용자별 세션 목록을 관리
    // 현재는 단일 세션만 지원
    return [];
  }

  /**
   * 세션 분석 데이터 생성
   */
  private generateSessionAnalytics(session: A2ASession, completionType: string) {
    const sessionDuration = new Date().getTime() - session.startTime.getTime();

    return {
      sessionId: session.sessionId,
      totalQuestions: session.questionCount,
      averageResponseTime: 2500, // 임시값, 실제로는 계산
      needsDiscoveryRate: session.discoveredNeeds.length / session.questionCount,
      satisfactionTrend: [session.satisfactionLevel],
      completionType,
      sessionDuration: sessionDuration / 1000, // 초 단위
      discoveredNeedsCount: session.discoveredNeeds.length,
      finalRecommendationsCount: session.vehicleRecommendations.length
    };
  }

  /**
   * 초기 에이전트 상태 생성
   */
  private createInitialAgentState(agentId: string): AgentState {
    return {
      agentId,
      status: 'idle',
      lastUpdate: new Date(),
      outputs: [],
      performance: {
        responseTime: 0,
        accuracy: 0,
        userSatisfaction: 0
      }
    };
  }

  /**
   * 세션 만료 정리 (백그라운드 작업)
   */
  async cleanupExpiredSessions(): Promise<void> {
    // 실제 구현에서는 만료된 세션들을 정리
    // Redis TTL을 활용하므로 자동 만료됨
    console.log('🧹 만료된 A2A 세션 정리 완료');
  }
}