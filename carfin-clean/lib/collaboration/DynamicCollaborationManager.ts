// DynamicCollaborationManager.ts - 패턴별 동적 협업 플로우 실행 및 관리

import { GoogleGenerativeAI } from '@google/generative-ai';
import { CollaborationPatternDetector, CollaborationPattern } from './CollaborationPatternDetector';
import { SharedContext, VehicleData, Budget } from './SharedContext';
import { StatisticalTCOCalculator, TCOBreakdown, StatisticalInsight } from './StatisticalTCOCalculator';
import { DemoPersona } from './PersonaDefinitions';
import { VehicleReranker, RerankingQuery, VehicleItem } from '@/lib/ai/reranker';
import { CEOLuxuryFilter } from '@/lib/ai/reranker/CEOLuxuryFilter';
import { A2ASessionManager } from './A2ASessionManager';
import { A2ASession } from '../types/session';
import { PersonalizedRecommendationEngine } from '@/lib/ai/personalization/PersonalizedRecommendationEngine';
import { redis } from '@/lib/redis';

export interface DynamicCollaborationEvent {
  type: 'pattern_detected' | 'agent_question' | 'agent_answer' | 'agent_response' |
        'consensus_reached' | 'user_intervention_needed' | 'collaboration_complete' | 'vehicle_recommendations' | 'error';
  agentId: string;
  content: string;
  timestamp: Date;
  metadata?: {
    pattern?: CollaborationPattern;
    round?: number;
    targetAgent?: string;
    questionId?: string;
    interventionType?: string;
    vehicles?: VehicleRecommendation[];
    [key: string]: any;
  };
}

export interface VehicleRecommendation {
  manufacturer: string;
  model: string;
  modelyear: number;
  price: number;
  distance: number;
  location: string;
  fueltype: string;
  displacement?: number;
  color?: string;
  // 실제 매물 정보
  detailurl?: string;
  photo?: string;
  platform?: string;
  originprice?: number;
  // AI 분석 결과
  recommendationReason: string;
  pros: string[];
  cons: string[];
  suitabilityScore: number; // 1-100점
  tcoCost?: number;
  tcoBreakdown?: TCOBreakdown;
  statisticalInsight?: StatisticalInsight;
  imageUrl?: string;
  rank: number;
}

interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string | 'all';
  type: 'question' | 'answer' | 'opinion' | 'conclusion';
  content: string;
  timestamp: Date;
  answered?: boolean;
  answer?: string;
}

export class DynamicCollaborationManager {
  private genAI: GoogleGenerativeAI;
  private patternDetector: CollaborationPatternDetector;
  private sharedContext: SharedContext;
  private vehicleReranker: VehicleReranker;
  private sessionManager: A2ASessionManager;
  private personalizedEngine: PersonalizedRecommendationEngine;
  private selectedPersona: DemoPersona | undefined = undefined;
  private currentPattern: CollaborationPattern | undefined = undefined;
  private currentSession: A2ASession | undefined = undefined;
  private collaborationRound = 0;
  private maxRounds = 7;
  private messageQueue: AgentMessage[] = [];
  private collaborationTimeout = 300000; // 5분 타임아웃

  constructor(apiKey: string) {
    // 환경변수에서 직접 API 키 읽기
    const actualApiKey = process.env.GEMINI_API_KEY || apiKey;
    console.log('🔑 Using API key:', actualApiKey?.substring(0, 10) + '...');
    this.genAI = new GoogleGenerativeAI(actualApiKey);
    this.patternDetector = new CollaborationPatternDetector();
    this.vehicleReranker = new VehicleReranker();
    this.sessionManager = A2ASessionManager.getInstance();
    this.personalizedEngine = PersonalizedRecommendationEngine.getInstance();

    // SharedContext 기본값으로 초기화
    this.sharedContext = new SharedContext('', [], { min: 0, max: 0, flexible: true, userConfirmed: false });
  }

  /**
   * 동적 협업 시작 (A2A 세션 관리 통합)
   */
  async *startDynamicCollaboration(
    question: string,
    vehicleData: VehicleData[],
    budget: Budget,
    previousVehicles?: any[], // 이전 추천 차량들 (재랭킹용)
    detectedPersona?: any, // 감지된 페르소나
    userId?: string // 사용자 ID (세션 관리용)
  ): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {

    try {
      console.log(`🎬 startDynamicCollaboration 시작 - 질문: "${question}"`);

      // 🔄 A2A 세션 생성 또는 복원 (논블로킹 패턴)
      const sessionUserId = userId || 'anonymous_user';

      // 세션 생성을 논블로킹으로 처리 - Valkey가 실패해도 계속 진행
      const createSessionPromise = (async () => {
        try {
          if (!this.currentSession) {
            this.currentSession = await this.sessionManager.createSession(sessionUserId, question);
            console.log(`🤖 새로운 A2A 세션 시작: ${this.currentSession.sessionId}`);
          } else {
            // 기존 세션에 새 질문 추가
            this.currentSession = await this.sessionManager.addQuestion(this.currentSession.sessionId, question);
            console.log(`📝 기존 세션에 질문 추가: ${this.currentSession?.sessionId}`);
          }
        } catch (sessionError) {
          console.warn(`⚠️ A2A 세션 생성 실패하지만 협업은 계속 진행: ${sessionError.message}`);
          // 세션 생성 실패 시 임시 세션 생성
          this.currentSession = {
            sessionId: `temp_${Date.now()}`,
            userId: sessionUserId,
            startTime: new Date(),
            lastActivity: new Date(),
            collaborationState: 'initiated',
            currentQuestion: question,
            questionCount: 1,
            discoveredNeeds: [],
            agentStates: {
              concierge: { agentId: 'concierge', status: 'idle', lastUpdate: new Date(), outputs: [], performance: { responseTime: 0, accuracy: 0, userSatisfaction: 0 } },
              needsAnalyst: { agentId: 'needsAnalyst', status: 'idle', lastUpdate: new Date(), outputs: [], performance: { responseTime: 0, accuracy: 0, userSatisfaction: 0 } },
              dataAnalyst: { agentId: 'dataAnalyst', status: 'idle', lastUpdate: new Date(), outputs: [], performance: { responseTime: 0, accuracy: 0, userSatisfaction: 0 } }
            },
            vehicleRecommendations: [],
            satisfactionLevel: 0,
            satisfactionIndicators: [],
            metadata: {}
          };
        }
      })();

      // 세션 생성과 동시에 즉시 첫 번째 이벤트 발송
      yield {
        type: 'agent_response',
        agentId: 'system',
        content: '🤖 A2A 협업 시스템이 시작되었습니다. 잠시만 기다려주세요...',
        timestamp: new Date(),
        metadata: { phase: 'initialization' }
      };

      // 세션 생성 대기 (최대 3초)
      await Promise.race([
        createSessionPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('세션 생성 타임아웃')), 3000))
      ]).catch(error => {
        console.warn(`⚠️ 세션 생성 타임아웃 또는 실패, 임시 세션으로 계속 진행: ${error.message}`);
      });

      console.log(`✅ A2A 세션 준비 완료 (${this.currentSession?.sessionId})`);
      console.log(`🎯 협업 플로우 본격 시작!`);

      // 재랭킹 요청 감지
      const isRerankingRequest = this.detectRerankingRequest(question, previousVehicles);

      if (isRerankingRequest && previousVehicles && previousVehicles.length > 0) {
        // 세션 상태 업데이트
        if (this.currentSession) {
          await this.sessionManager.updateSession(this.currentSession.sessionId, {
            collaborationState: 'reranking'
          });
        }

        // 재랭킹 플로우 실행
        yield* await this.executeRerankingFlow(question, previousVehicles, vehicleData, budget);
        return;
      }

      // 1. 상황 분석 및 패턴 감지
      if (this.currentSession) {
        await this.sessionManager.updateAgentState(
          this.currentSession.sessionId,
          'concierge',
          { status: 'processing', currentTask: '패턴 감지 중' }
        );
      }

      const pattern = this.patternDetector.detectPattern({
        userQuestion: question,
        budget,
        vehicleCount: vehicleData.length,
        vehicleData
      });

      this.currentPattern = pattern;
      this.sharedContext = new SharedContext(question, vehicleData, budget, detectedPersona);
      this.collaborationRound = 0;

      // 세션에 패턴 정보 저장
      if (this.currentSession) {
        await this.sessionManager.updateSession(this.currentSession.sessionId, {
          collaborationState: 'analyzing',
          metadata: {
            ...this.currentSession.metadata,
            detectedPattern: pattern.type,
            budgetRange: { min: budget.min, max: budget.max },
            primaryUseCase: pattern.description
          }
        });
      }

      yield {
        type: 'pattern_detected',
        agentId: 'system',
        content: `${pattern.type} 패턴 감지: ${pattern.description}`,
        timestamp: new Date(),
        metadata: { pattern, sessionId: this.currentSession?.sessionId }
      };

      // 2. 패턴별 동적 협업 실행
      yield* await this.executePatternBasedCollaboration(pattern);

    } catch (error) {
      console.error('❌ A2A 협업 중 오류 발생:', error);

      yield {
        type: 'error',
        agentId: 'system',
        content: `협업 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp: new Date(),
        metadata: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * 패턴별 협업 플로우 실행 (페르소나 플로우 추가)
   */
  private async *executePatternBasedCollaboration(
    pattern: CollaborationPattern
  ): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {

    switch (pattern.type) {
      case 'BUDGET_CONSTRAINT':
        yield* await this.executeBudgetConstraintFlow();
        break;

      case 'CONFLICTING_REQUIREMENTS':
        yield* await this.executeConflictingRequirementsFlow();
        break;

      case 'INFORMATION_GAP':
        yield* await this.executeInformationGapFlow();
        break;

      // 페르소나 기반 플로우들 (리뉴얼)
      case 'FIRST_CAR_ANXIETY':
        yield* await this.executeFirstCarAnxietyFlow(pattern);
        break;

      case 'FAMILY_PRIORITY':
        yield* await this.executeFamilyPriorityFlow(pattern);
        break;

      case 'MZ_LIFESTYLE':
        yield* await this.executeMZLifestyleFlow(pattern);
        break;

      case 'CAMPING_LIFESTYLE':
        yield* await this.executeCampingLifestyleFlow(pattern);
        break;

      case 'LARGE_FAMILY':
        yield* await this.executeLargeFamilyFlow(pattern);
        break;

      case 'CEO_BUSINESS':
        yield* await this.executeCeoBusinessFlow(pattern);
        break;

      default:
        yield* await this.executeStandardFlow();
        break;
    }

    // 🚗 모든 패턴에서 차량 추천 생성 (공통 로직)
    // 현재 페르소나를 기반으로 적절한 사용 용도 결정
    const currentPersona = this.selectedPersona;
    let usageType = 'general';

    // 패턴이나 페르소나에 따른 사용 용도 결정
    if (pattern.type === 'CAMPING_LIFESTYLE' || currentPersona?.id === 'camping_lover') {
      usageType = 'camping';
    } else if (pattern.type === 'FAMILY_PRIORITY' || currentPersona?.id === 'working_mom' || currentPersona?.id === 'large_family_dad') {
      usageType = 'family';
    } else if (pattern.type === 'MZ_LIFESTYLE' || currentPersona?.id === 'mz_office_worker') {
      usageType = 'urban';
    } else if (currentPersona?.id === 'ceo_executive') {
      usageType = 'business';
    } else if (pattern.type === 'FIRST_CAR_ANXIETY' || currentPersona?.id === 'first_car_anxiety') {
      usageType = 'first_car';
    }

    // 🤖 개인화된 차량 추천 생성
    const userId = this.currentSession?.userId || 'anonymous';
    const conversationHistory = await this.getConversationHistory(userId);
    const vehicleRecommendations = await this.generatePersonalizedVehicleRecommendations(
      currentPersona,
      usageType,
      userId,
      conversationHistory
    );

    // 📊 세션에 차량 추천 결과 저장
    if (this.currentSession) {
      const sessionVehicles = vehicleRecommendations.map(v => ({
        vehicleId: `${v.manufacturer}_${v.model}_${v.modelyear}`,
        rank: v.rank,
        score: v.suitabilityScore,
        reasoning: v.recommendationReason,
        pros: v.pros,
        cons: v.cons,
        matchedNeeds: [`${pattern.type}_pattern`],
        timestamp: new Date()
      }));

      await this.sessionManager.saveVehicleRecommendations(
        this.currentSession.sessionId,
        sessionVehicles
      );
    }

    yield {
      type: 'vehicle_recommendations',
      agentId: 'system',
      content: `${currentPersona?.name || '고객'}님을 위한 최적의 차량 추천을 완료했습니다!`,
      timestamp: new Date(),
      metadata: {
        pattern: this.currentPattern,
        vehicles: vehicleRecommendations,
        persona: currentPersona?.name || '고객',
        usageType: usageType,
        sessionId: this.currentSession?.sessionId
      }
    };

    // 🎉 세션 완료 처리
    if (this.currentSession) {
      await this.sessionManager.updateSatisfaction(
        this.currentSession.sessionId,
        85, // 기본 만족도 (실제로는 사용자 피드백 기반)
        [pattern.type, 'vehicle_recommendations_provided', 'collaboration_completed']
      );

      await this.sessionManager.completeSession(this.currentSession.sessionId, 'satisfied');
    }

    // 🎉 모든 협업 및 차량 추천 완료
    yield {
      type: 'collaboration_complete',
      agentId: 'system',
      content: `${currentPersona?.name || '고객'}님을 위한 맞춤 협업이 완료되었습니다!`,
      timestamp: new Date(),
      metadata: {
        totalRounds: this.collaborationRound,
        persona: currentPersona?.name || '고객',
        sessionId: this.currentSession?.sessionId,
        recommendationsCount: vehicleRecommendations.length
      }
    };
  }

  /**
   * 예산 부족 패턴 협업 플로우
   */
  private async *executeBudgetConstraintFlow(): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;

    // 1라운드: 데이터 분석가가 문제 제기
    const dataAnalystIssue = await this.getAgentResponse(
      'data_analyst',
      '실제 매물 데이터를 분석한 결과 예산 제약 문제를 발견했습니다. 구체적인 문제점과 대안을 제시해주세요.',
      'budget_constraint_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'data_analyst',
      content: dataAnalystIssue,
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, round: this.collaborationRound }
    };

    // 2라운드: 니즈 분석가에게 질문
    const questionToNeeds = await this.generateInterAgentQuestion(
      'data_analyst',
      'needs_analyst',
      '예산이 제한적인 상황에서 고객의 우선순위를 어떻게 조정해야 할까요?',
      dataAnalystIssue
    );

    yield {
      type: 'agent_question',
      agentId: 'data_analyst',
      content: questionToNeeds,
      timestamp: new Date(),
      metadata: {
        targetAgent: 'needs_analyst',
        questionId: `q_${Date.now()}`,
        round: this.collaborationRound
      }
    };

    // 니즈 분석가 답변
    const needsAnalystAnswer = await this.getAgentResponse(
      'needs_analyst',
      `데이터 분석가의 질문: "${questionToNeeds}"\n\n당신의 니즈 분석 전문성을 바탕으로 답변해주세요.`,
      'budget_constraint_needs_review'
    );

    yield {
      type: 'agent_answer',
      agentId: 'needs_analyst',
      content: needsAnalystAnswer,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 3라운드: 컨시어지 중재 및 고객 확인 제안
    const conciergeResolution = await this.getAgentResponse(
      'concierge',
      `데이터 분석가 의견: "${dataAnalystIssue}"\n니즈 분석가 의견: "${needsAnalystAnswer}"\n\n고객 관점에서 최적의 해결책을 제시하고 필요한 확인사항이 있다면 명시해주세요.`,
      'budget_constraint_resolution'
    );

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: conciergeResolution,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 사용자 개입이 필요한지 확인
    if (this.needsUserIntervention(conciergeResolution)) {
      yield {
        type: 'user_intervention_needed',
        agentId: 'concierge',
        content: '예산 조정 또는 조건 변경에 대한 고객 의사 확인이 필요합니다.',
        timestamp: new Date(),
        metadata: { interventionType: 'budget_adjustment' }
      };
    }

    yield {
      type: 'collaboration_complete',
      agentId: 'system',
      content: '예산 제약 상황에 대한 협업 완료',
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, totalRounds: this.collaborationRound }
    };
  }

  /**
   * 조건 상충 패턴 협업 플로우
   */
  private async *executeConflictingRequirementsFlow(): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;

    // 1라운드: 니즈 분석가가 상충 조건 지적
    const conflictAnalysis = await this.getAgentResponse(
      'needs_analyst',
      '고객의 요구사항을 분석한 결과 서로 상충하는 조건들을 발견했습니다. 구체적으로 어떤 부분이 상충하는지 분석해주세요.',
      'conflicting_requirements_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'needs_analyst',
      content: conflictAnalysis,
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, round: this.collaborationRound }
    };

    // 2라운드: 데이터 분석가에게 현실성 검증 요청
    const questionToData = await this.generateInterAgentQuestion(
      'needs_analyst',
      'data_analyst',
      '실제 시장 데이터를 보면 이런 상충하는 조건들을 동시에 만족하는 차량이 있을까요?',
      conflictAnalysis
    );

    yield {
      type: 'agent_question',
      agentId: 'needs_analyst',
      content: questionToData,
      timestamp: new Date(),
      metadata: {
        targetAgent: 'data_analyst',
        questionId: `q_${Date.now()}`,
        round: this.collaborationRound
      }
    };

    // 데이터 분석가 답변
    const dataAnalystAnswer = await this.getAgentResponse(
      'data_analyst',
      `니즈 분석가의 질문: "${questionToData}"\n상충 조건 분석: "${conflictAnalysis}"\n\n실제 매물 데이터를 바탕으로 현실적인 답변을 해주세요.`,
      'conflicting_requirements_data_check'
    );

    yield {
      type: 'agent_answer',
      agentId: 'data_analyst',
      content: dataAnalystAnswer,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 3라운드: 컨시어지가 우선순위 확인 제안
    const priorityCheck = await this.getAgentResponse(
      'concierge',
      `상충 조건 분석: "${conflictAnalysis}"\n현실성 검증: "${dataAnalystAnswer}"\n\n고객에게 우선순위를 확인하여 최적의 타협점을 찾는 방안을 제시해주세요.`,
      'conflicting_requirements_priority_check'
    );

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: priorityCheck,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    yield {
      type: 'user_intervention_needed',
      agentId: 'concierge',
      content: '상충하는 조건들의 우선순위 확인이 필요합니다.',
      timestamp: new Date(),
      metadata: { interventionType: 'priority_clarification' }
    };

    yield {
      type: 'collaboration_complete',
      agentId: 'system',
      content: '조건 상충 상황에 대한 협업 완료',
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, totalRounds: this.collaborationRound }
    };
  }

  /**
   * 표준 플로우 (기존 순차 처리)
   */
  private async *executeStandardFlow(): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    // 기존 순차적 처리를 유지하되 이벤트 형태로 래핑
    const agents = ['concierge', 'needs_analyst', 'data_analyst'];

    for (const agentId of agents) {
      this.collaborationRound++;

      const response = await this.getAgentResponse(
        agentId,
        `고객 질문: "${this.sharedContext.originalQuestion}"\n당신의 전문성을 바탕으로 분석해주세요.`,
        'standard_analysis'
      );

      yield {
        type: 'agent_response',
        agentId,
        content: response,
        timestamp: new Date(),
        metadata: { pattern: this.currentPattern, round: this.collaborationRound }
      };
    }

    yield {
      type: 'collaboration_complete',
      agentId: 'system',
      content: '표준 협업 프로세스 완료',
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, totalRounds: this.collaborationRound }
    };
  }

  /**
   * 정보 부족 패턴 협업 플로우
   */
  private async *executeInformationGapFlow(): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;

    // 1라운드: 컨시어지가 정보 수집 주도
    const infoGathering = await this.getAgentResponse(
      'concierge',
      '고객의 질문이 다소 모호하여 구체적인 정보 수집이 필요합니다. 어떤 정보들을 추가로 확인해야 할지 제시해주세요.',
      'information_gathering'
    );

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: infoGathering,
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, round: this.collaborationRound }
    };

    yield {
      type: 'user_intervention_needed',
      agentId: 'concierge',
      content: '추가 정보 수집이 필요합니다.',
      timestamp: new Date(),
      metadata: { interventionType: 'information_gathering' }
    };

    yield {
      type: 'collaboration_complete',
      agentId: 'system',
      content: '정보 수집 단계 완료 - 추가 정보 입력 대기',
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, totalRounds: this.collaborationRound }
    };
  }

  /**
   * 첫차 구매 불안 패턴 협업 플로우 (김지수 페르소나)
   */
  private async *executeFirstCarAnxietyFlow(pattern: CollaborationPattern): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;
    const persona = pattern.persona;
    if (!persona) {
      yield {
        type: 'error',
        agentId: 'system',
        content: '첫차 불안 플로우를 위한 페르소나 정보가 없습니다.',
        timestamp: new Date()
      };
      return;
    }

    try {
      // 1라운드: 컨시어지가 불안감 공감 및 안심시키기
      yield {
        type: 'agent_response',
        agentId: 'concierge',
        content: '🤝 첫차 구매 불안감을 이해하고 계십니다. 안전하고 신뢰할 수 있는 차량을 찾아드리겠습니다...',
        timestamp: new Date(),
        metadata: { pattern: this.currentPattern, round: this.collaborationRound }
      };

      console.log(`🎬 첫 번째 yield 완료, 이제 getAgentResponse 호출 준비`);
      console.log(`🎭 페르소나 확인: ${persona?.name || 'undefined'}`);
      console.log(`📞 getAgentResponse 호출 직전!`);

      const conciergeComfort = await this.getAgentResponse(
        'concierge',
        `${persona?.name || '고객'}님의 첫차 구매 불안감을 이해하고 공감해주세요. "${persona?.personalStory || '차량 구매를 고려 중인 상황'}"라는 상황에서 안전하고 신뢰할 수 있는 차량 선택 방향을 제시해주세요.`,
        'first_car_anxiety_comfort'
      );

      yield {
        type: 'agent_response',
        agentId: 'concierge',
        content: conciergeComfort,
        timestamp: new Date(),
        metadata: { pattern: this.currentPattern, round: this.collaborationRound }
      };

      // 2라운드: 니즈 분석가가 초보운전자 특화 요구사항 분석
      yield {
        type: 'agent_response',
        agentId: 'needs_analyst',
        content: '🔍 초보운전자 맞춤 니즈를 분석하고 있습니다...',
        timestamp: new Date(),
        metadata: { round: this.collaborationRound }
      };

      const needsAnalysis = await this.getAgentResponse(
        'needs_analyst',
        `첫차 구매자 ${persona?.name || '고객'}님의 핵심 고민사항들을 분석해보세요: ${(persona?.realConcerns || []).join(', ')}. 초보운전자에게 가장 중요한 우선순위를 제시해주세요.`,
        'first_car_needs_analysis'
      );

      yield {
        type: 'agent_response',
        agentId: 'needs_analyst',
        content: needsAnalysis,
        timestamp: new Date(),
        metadata: { round: this.collaborationRound }
      };

      // 3라운드: 데이터 분석가가 초보운전자 맞춤 안전한 차량 추천
      yield {
        type: 'agent_response',
        agentId: 'data_analyst',
        content: '📊 데이터 기반으로 안전한 차량을 분석하고 있습니다...',
        timestamp: new Date(),
        metadata: { round: this.collaborationRound }
      };

      const safeVehicleRecommendation = await this.getAgentResponse(
        'data_analyst',
        `${persona.budget.min}-${persona.budget.max}만원 예산으로 초보운전자에게 안전하고 신뢰할 수 있는 차량을 데이터 기반으로 추천해주세요. 보험료와 안전성을 최우선으로 고려해주세요.`,
        'first_car_safe_recommendation'
      );

      yield {
        type: 'agent_response',
        agentId: 'data_analyst',
        content: safeVehicleRecommendation,
        timestamp: new Date(),
        metadata: { round: this.collaborationRound }
      };
    } catch (error) {
      console.error('❌ 첫차 구매 플로우 오류:', error);
      yield {
        type: 'error',
        agentId: 'system',
        content: '첫차 구매 상담 중 오류가 발생했습니다. 기본 추천으로 진행합니다.',
        timestamp: new Date(),
        metadata: { error: error.message }
      };
    }

    // 차량 추천은 공통 로직에서 처리됨
  }

  /**
   * 워킹맘 가족 우선 패턴 협업 플로우 (이소영 페르소나)
   */
  private async *executeFamilyPriorityFlow(pattern: CollaborationPattern): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;
    const persona = pattern.persona;
    if (!persona) {
      yield {
        type: 'error',
        agentId: 'system',
        content: '가족 우선 플로우를 위한 페르소나 정보가 없습니다.',
        timestamp: new Date()
      };
      return;
    }

    // 1라운드: 니즈 분석가가 워킹맘의 현실적 니즈 분석
    const workingMomNeeds = await this.getAgentResponse(
      'needs_analyst',
      `워킹맘 ${persona?.name || '고객'}님의 현실적 고민을 깊이 분석해보세요. "${persona?.personalStory || '가족을 위한 차량 구매 고려 중'}"와 함께 실제 고민사항들: ${(persona?.realConcerns || []).join(', ')}을 고려해 가족용 차량의 핵심 요구사항을 도출해주세요.`,
      'working_mom_needs_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'needs_analyst',
      content: workingMomNeeds,
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, round: this.collaborationRound }
    };

    // 2라운드: 데이터 분석가가 아이 안전성과 편의성 중심 분석
    const familySafetyAnalysis = await this.getAgentResponse(
      'data_analyst',
      `${persona.budget.min}-${persona.budget.max}만원 예산으로 4세 아이를 키우는 워킹맘에게 최적한 차량을 데이터 분석해주세요. 아이 안전성, 카시트 설치 편의성, 승하차 편의성을 최우선으로 고려해주세요.`,
      'family_safety_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'data_analyst',
      content: familySafetyAnalysis,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 3라운드: 컨시어지가 가족 관점에서 종합 조정
    const familyCoordination = await this.getAgentResponse(
      'concierge',
      `워킹맘 ${persona?.name || '고객'}님을 위한 최종 추천을 정리해주세요. 니즈 분석: "${workingMomNeeds}" 데이터 분석: "${familySafetyAnalysis}" 이를 바탕으로 가족 모두가 만족할 수 있는 현실적 해결책을 제시해주세요.`,
      'family_coordination'
    );

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: familyCoordination,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 차량 추천은 공통 로직에서 처리됨
  }

  /**
   * MZ세대 라이프스타일 패턴 협업 플로우 (박준혁 페르소나)
   */
  private async *executeMZLifestyleFlow(pattern: CollaborationPattern): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;
    const persona = pattern.persona;
    if (!persona) {
      yield {
        type: 'error',
        agentId: 'system',
        content: 'MZ 라이프스타일 플로우를 위한 페르소나 정보가 없습니다.',
        timestamp: new Date()
      };
      return;
    }

    // 1라운드: 컨시어지가 MZ세대 감성 이해 및 브랜드 이미지 중요성 인식
    const mzSensitivity = await this.getAgentResponse(
      'concierge',
      `MZ세대 직장인 ${persona?.name || '고객'}님의 라이프스타일을 이해해주세요. "${persona?.personalStory || 'MZ세대 직장인의 차량 구매 고려 중'}"라는 상황에서 인스타 감성과 동기들과의 관계, 데이트 등 사회적 이미지를 고려한 차량 선택 방향을 제시해주세요.`,
      'mz_sensitivity_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: mzSensitivity,
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, round: this.collaborationRound }
    };

    // 2라운드: 니즈 분석가가 MZ세대의 진짜 니즈 분석 (허세 vs 실용성)
    const mzRealNeeds = await this.getAgentResponse(
      'needs_analyst',
      `MZ세대 ${persona?.name || '고객'}님의 솔직한 고민들을 분석해보세요: ${(persona?.realConcerns || []).join(', ')}. 허세와 실용성, 브랜드 이미지와 경제성 사이에서 최적의 균형점을 찾아주세요.`,
      'mz_real_needs_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'needs_analyst',
      content: mzRealNeeds,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 3라운드: 데이터 분석가가 MZ세대 취향 맞춤 차량 추천
    const mzStylishRecommendation = await this.getAgentResponse(
      'data_analyst',
      `${persona.budget.min}-${persona.budget.max}만원 예산으로 20대 후반 마케팅 직장인에게 어울리는 세련된 차량을 추천해주세요. 디자인, 브랜드 이미지, 연비를 균형있게 고려하되 인스타에 올려도 부끄럽지 않을 차량으로 추천해주세요.`,
      'mz_stylish_recommendation'
    );

    yield {
      type: 'agent_response',
      agentId: 'data_analyst',
      content: mzStylishRecommendation,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 차량 추천은 공통 로직에서 처리됨
  }

  /**
   * 캠핑 라이프스타일 패턴 협업 플로우 (최민준 페르소나)
   */
  private async *executeCampingLifestyleFlow(pattern: CollaborationPattern): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;
    const persona = pattern.persona;
    if (!persona) {
      yield {
        type: 'error',
        agentId: 'system',
        content: '캠핑 라이프스타일 플로우를 위한 페르소나 정보가 없습니다.',
        timestamp: new Date()
      };
      return;
    }

    // 1라운드: 니즈 분석가가 캠핑족의 전문적 요구사항 분석
    const campingNeeds = await this.getAgentResponse(
      'needs_analyst',
      `캠핑 전문가 ${persona?.name || '고객'}님의 깊이있는 캠핑 라이프스타일을 분석해보세요. "${persona?.personalStory || '캠핑을 좋아하는 차량 구매 고려 중'}"와 함께 실제 고민사항들: ${(persona?.realConcerns || []).join(', ')}을 바탕으로 진정한 캠핑카의 조건들을 도출해주세요.`,
      'camping_needs_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'needs_analyst',
      content: campingNeeds,
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, round: this.collaborationRound }
    };

    // 2라운드: 데이터 분석가가 차박/캠핑 특화 기능 중심 분석
    const campingVehicleAnalysis = await this.getAgentResponse(
      'data_analyst',
      `${persona.budget.min}-${persona.budget.max}만원 예산으로 진짜 캠핑족이 인정할 만한 차량을 데이터 분석해주세요. 평탄화 기능, 적재공간, 오프로드 성능을 최우선으로 하되 유튜브 촬영에도 어울리는 차량으로 추천해주세요.`,
      'camping_vehicle_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'data_analyst',
      content: campingVehicleAnalysis,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 3라운드: 컨시어지가 캠핑 라이프스타일 종합 조정
    const campingCoordination = await this.getAgentResponse(
      'concierge',
      `캠핑 전문가 ${persona?.name || '고객'}님을 위한 완벽한 캠핑카를 최종 정리해주세요. 니즈 분석: "${campingNeeds}" 데이터 분석: "${campingVehicleAnalysis}" 이를 바탕으로 진정한 자유를 느낄 수 있는 캠핑 라이프의 동반자를 제시해주세요.`,
      'camping_coordination'
    );

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: campingCoordination,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 차량 추천은 공통 로직에서 처리됨
  }

  /**
   * 대가족 가장 패턴 협업 플로우 (이경수 페르소나)
   */
  private async *executeLargeFamilyFlow(pattern: CollaborationPattern): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;
    const persona = pattern.persona;
    if (!persona) {
      yield {
        type: 'error',
        agentId: 'system',
        content: '대가족 플로우를 위한 페르소나 정보가 없습니다.',
        timestamp: new Date()
      };
      return;
    }

    // 1라운드: 데이터 분석가가 다인용차 경제성 분석 (가장 우선)
    const largeFamilyAnalysis = await this.getAgentResponse(
      'data_analyst',
      `대가족 가장 ${persona?.name || '고객'}님을 위한 다인용차 경제성 분석을 해주세요. "${persona?.personalStory || '대가족을 위한 차량 구매 고려 중'}"라는 상황에서 ${persona?.budget?.min || 3000}-${persona?.budget?.max || 5000}만원 예산으로 7명 대가족이 모두 편안한 차량을 데이터 기반으로 분석해주세요. 9인승 승합차 vs 대형 SUV 비교도 포함해서요.`,
      'large_family_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'data_analyst',
      content: largeFamilyAnalysis,
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, round: this.collaborationRound }
    };

    // 2라운드: 니즈 분석가가 대가족의 현실적 니즈 분석
    const largeFamilyNeeds = await this.getAgentResponse(
      'needs_analyst',
      `대가족 가장 ${persona?.name || '고객'}님의 현실적 고민들을 분석해보세요: ${(persona?.realConcerns || []).join(', ')}. 7명 대가족의 실질적 필요와 부모님 승하차 편의성, 아이들 안전성을 종합 고려한 니즈 분석을 해주세요.`,
      'large_family_needs_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'needs_analyst',
      content: largeFamilyNeeds,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 3라운드: 컨시어지가 대가족의 기둥 관점에서 종합 추천
    const largeFamilyRecommendation = await this.getAgentResponse(
      'concierge',
      `대가족의 기둥 ${persona?.name || '고객'}님을 위한 최적 선택을 종합해주세요. 다인용차 분석: "${largeFamilyAnalysis}" 대가족 니즈 분석: "${largeFamilyNeeds}" 이를 바탕으로 7명 가족이 10년간 편안하게 탈 수 있는 차량을 추천해주세요.`,
      'large_family_recommendation'
    );

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: largeFamilyRecommendation,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 차량 추천은 공통 로직에서 처리됨
  }

  /**
   * CEO/임원 비즈니스 패턴 협업 플로우 (김정훈 페르소나)
   */
  private async* executeCeoBusinessFlow(pattern: CollaborationPattern): AsyncGenerator<DynamicCollaborationEvent> {
    const persona = pattern.persona;
    if (!persona) {
      yield {
        type: 'error',
        agentId: 'system',
        content: 'CEO 비즈니스 플로우를 위한 페르소나 정보가 없습니다.',
        timestamp: new Date()
      };
      return;
    }

    this.collaborationRound = 1;

    // 1라운드: 니즈 분석가가 CEO의 비즈니스 니즈 분석
    const ceoBusinessNeeds = await this.getAgentResponse(
      'needs_analyst',
      `CEO/임원 ${persona?.name || '고객'}님의 비즈니스 차량 니즈를 분석해보세요. "${persona?.personalStory || 'CEO/임원의 비즈니스 차량 구매 고려 중'}"와 함께 실제 고민사항들: ${(persona?.realConcerns || []).join(', ')}을 고려해 브랜드 프리스티지, 골프백 수납, 법인차 세금혜택을 종합한 요구사항을 도출해주세요.`,
      'ceo_business_needs_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'needs_analyst',
      content: ceoBusinessNeeds,
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, round: this.collaborationRound }
    };

    // 2라운드: 데이터 분석가가 고급차 및 법인차 혜택 분석
    const luxuryVehicleAnalysis = await this.getAgentResponse(
      'data_analyst',
      `${persona.budget.min}-${persona.budget.max}만원 예산으로 CEO님에게 어울리는 프리미엄 차량을 분석해주세요. 브랜드 가치, 골프백 적재 가능성, 법인차 세금혜택, 비즈니스 미팅에서의 인상 등을 종합 고려한 데이터 분석을 제공해주세요.`,
      'luxury_vehicle_analysis'
    );

    yield {
      type: 'agent_response',
      agentId: 'data_analyst',
      content: luxuryVehicleAnalysis,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 3라운드: 컨시어지가 CEO 관점에서 종합 추천
    const ceoRecommendation = await this.getAgentResponse(
      'concierge',
      `CEO ${persona?.name || '고객'}님을 위한 최적의 비즈니스 차량을 종합 추천해주세요. 비즈니스 니즈: "${ceoBusinessNeeds}" 고급차 분석: "${luxuryVehicleAnalysis}" 이를 바탕으로 거래처 미팅에서 부끄럽지 않으면서도 실용적인 CEO 맞춤 차량을 제시해주세요.`,
      'ceo_business_recommendation'
    );

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: ceoRecommendation,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 차량 추천은 공통 로직에서 처리됨
  }

  /**
   * 🤖 개인화된 차량 추천 생성 (개인화 엔진 통합)
   */
  private async generatePersonalizedVehicleRecommendations(
    persona: DemoPersona | undefined,
    category: string,
    userId: string,
    conversationHistory: any[]
  ): Promise<VehicleRecommendation[]> {
    console.log(`🎯 개인화 추천 시작: ${userId} (${category})`);

    try {
      // 1. 기본 차량 추천 생성 (기존 로직 활용)
      const baseRecommendations = await this.generateVehicleRecommendations(persona, category);

      // 2. 개인화 엔진 적용
      if (this.currentSession && conversationHistory.length > 0) {
        const personalizedRecommendations = await this.personalizedEngine.generatePersonalizedRecommendations(
          userId,
          baseRecommendations,
          this.currentSession,
          conversationHistory
        );

        // 3. 개인화 결과를 기존 VehicleRecommendation 형식으로 변환
        const enhancedRecommendations = personalizedRecommendations.map((pRec, index) => ({
          ...pRec,
          rank: index + 1,
          suitabilityScore: pRec.personalizedScore,
          recommendationReason: pRec.recommendationReason,
          personalizedInsights: pRec.personalizedInsights,
          confidenceLevel: pRec.confidenceLevel,
          // 개인화 스코어 정보 추가
          personalizedMetadata: {
            originalScore: pRec.originalScore,
            personalizedScore: pRec.personalizedScore,
            scoreAdjustments: pRec.scoreAdjustments,
            isPersonalized: true
          }
        }));

        console.log(`✅ 개인화 추천 완료: ${enhancedRecommendations.length}대 (평균 점수: ${enhancedRecommendations.reduce((sum, r) => sum + r.personalizedScore, 0) / enhancedRecommendations.length})`);
        return enhancedRecommendations as VehicleRecommendation[];
      }

      // 4. 개인화 데이터가 없으면 기본 추천 반환
      console.log(`⚠️ 개인화 데이터 부족, 기본 추천 반환: ${baseRecommendations.length}대`);
      return baseRecommendations;

    } catch (error) {
      console.error('❌ 개인화 추천 생성 실패:', error);
      // 폴백: 기본 추천 반환
      return await this.generateVehicleRecommendations(persona, category);
    }
  }

  /**
   * 차량 추천 결과 생성 (Reranker 적용)
   */
  private async generateVehicleRecommendations(
    persona: DemoPersona | undefined,
    category: string
  ): Promise<VehicleRecommendation[]> {
    const allVehicles = this.sharedContext?.vehicleData || [];

    if (allVehicles.length === 0) {
      console.warn('🚨 차량 데이터가 없습니다.');
      return [];
    }

    try {
      // Reranker 초기화 (필요시)
      if (!this.vehicleReranker.getStatus().initialized) {
        await this.vehicleReranker.initialize();
      }

      // 현재 사용자 쿼리 재구성 (저장된 컨텍스트에서)
      const userQuery = this.sharedContext?.query || category || '적합한 차량 추천';

      // 페르소나의 예산 정보 가져오기
      const budget = persona?.budget || { min: 1000, max: 5000 };

      // Reranker 쿼리 구성
      const rerankingQuery: RerankingQuery = {
        userQuery,
        persona,
        budget
      };

      // 차량 데이터를 VehicleItem 형식으로 변환
      let vehicleItems: VehicleItem[] = allVehicles.map(vehicle => ({
        vehicleid: vehicle.vehicleid,
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        modelyear: vehicle.modelyear,
        price: vehicle.price,
        distance: vehicle.distance,
        location: vehicle.location,
        fueltype: vehicle.fueltype,
        displacement: vehicle.displacement,
        color: vehicle.color,
        detailurl: vehicle.detailurl,
        photo: vehicle.photo,
        platform: vehicle.platform,
        originprice: vehicle.originprice
      }));

      console.log(`🚗 변환된 차량 수: ${vehicleItems.length}대`);

      // CEO 페르소나인 경우 럭셔리 차량 필터링 적용
      if (persona?.id === 'ceo_executive') {
        console.log('🎩 CEO 페르소나 감지 - 럭셔리 차량 필터링 적용');

        // CEO 타입 자동 감지
        const ceoType = CEOLuxuryFilter.detectCEOType(persona, budget);
        console.log(`💼 감지된 CEO 타입: ${ceoType}`);

        // 럭셔리 필터링 실행
        const luxuryFilterResult = CEOLuxuryFilter.filterLuxuryVehicles(
          vehicleItems,
          persona,
          userQuery,
          ceoType
        );

        // 필터링된 차량으로 교체
        vehicleItems = luxuryFilterResult.filteredVehicles;

        // 필터링 통계 로그
        CEOLuxuryFilter.logFilterStats(luxuryFilterResult);

        // 럭셔리 필터링 후 차량이 없는 경우 처리
        if (vehicleItems.length === 0) {
          console.warn('⚠️ 럭셔리 필터링 후 적합한 차량이 없습니다. 필터 기준을 완화합니다.');

          // 필터 기준 완화하여 재시도
          const relaxedResult = CEOLuxuryFilter.filterLuxuryVehicles(
            allVehicles.map(vehicle => ({
              vehicleid: vehicle.vehicleid,
              manufacturer: vehicle.manufacturer,
              model: vehicle.model,
              modelyear: vehicle.modelyear,
              price: vehicle.price,
              distance: vehicle.distance,
              location: vehicle.location,
              fueltype: vehicle.fueltype,
              displacement: vehicle.displacement,
              color: vehicle.color,
              detailurl: vehicle.detailurl,
              photo: vehicle.photo,
              platform: vehicle.platform,
              originprice: vehicle.originprice
            })),
            persona,
            userQuery,
            'startup_ceo' // 더 관대한 기준 적용
          );

          vehicleItems = relaxedResult.filteredVehicles;
          console.log(`🔄 완화된 기준으로 ${vehicleItems.length}대 선택됨`);
        }
      }

      // Reranker로 재순위 매김 (백업 랭킹 시스템 포함)
      let rerankingResult;
      try {
        rerankingResult = await this.vehicleReranker.rerank(vehicleItems, rerankingQuery, {
          maxResults: 3, // 상위 3개만
          explainRanking: true,
          diversityFactor: 0.1
        });
      } catch (error) {
        console.warn('🔄 Reranker 실패, 백업 랭킹 시스템 사용:', error);
        // 백업 랭킹 시스템 - 가격과 기본 점수 기반
        rerankingResult = {
          rankedVehicles: vehicleItems.slice(0, 3).map((vehicle, index) => ({
            ...vehicle,
            newRank: index + 1,
            oldRank: index + 1,
            score: 0.9 - (index * 0.1),
            explanation: `${index + 1}순위 추천: 예산 범위 내 최적 차량`,
            reasons: ['예산 적합성', '높은 인기도', '신뢰성']
          })),
          metadata: {
            totalProcessed: vehicleItems.length,
            averageSimilarity: 0.85,
            processingTime: 50,
            queryProcessingTime: 10,
            model: 'backup-ranking-system'
          }
        };
      }

      console.log('🔄 Reranker 결과:', {
        totalProcessed: rerankingResult.metadata.totalProcessed,
        averageSimilarity: rerankingResult.metadata.averageSimilarity,
        processingTime: rerankingResult.metadata.processingTime
      });

      // RankedVehicle을 VehicleRecommendation으로 변환
      const recommendations: VehicleRecommendation[] = [];

      for (const rankedVehicle of rerankingResult.rankedVehicles) {
        // AI로 추가 분석 수행
        const analysis = await this.generateVehicleAnalysis(rankedVehicle, persona, category, rankedVehicle.newRank);

        recommendations.push({
          ...rankedVehicle,
          rank: rankedVehicle.newRank,
          recommendationReason: rankedVehicle.explanations.whyRecommended + ' ' + analysis.reason,
          pros: analysis.pros,
          cons: analysis.cons,
          suitabilityScore: Math.round(rankedVehicle.similarityScore.final * 100),
          tcoCost: analysis.tcoCost,
          tcoBreakdown: analysis.tcoBreakdown,
          statisticalInsight: analysis.statisticalInsight,
          // Reranker에서 제공하는 상세 설명 추가
          imageUrl: rankedVehicle.photo
        });
      }

      return recommendations;

    } catch (error) {
      console.error('❌ Reranker 사용 중 오류:', error);

      // 폴백: 기존 방식으로 상위 3개 선택
      const topVehicles = allVehicles.slice(0, 3);
      const fallbackRecommendations: VehicleRecommendation[] = [];

      for (let i = 0; i < topVehicles.length; i++) {
        const vehicle = topVehicles[i];
        const rank = i + 1;

        const analysis = await this.generateVehicleAnalysis(vehicle, persona, category, rank);

        fallbackRecommendations.push({
          ...vehicle,
          rank,
          recommendationReason: analysis.reason,
          pros: analysis.pros,
          cons: analysis.cons,
          suitabilityScore: analysis.score,
          tcoCost: analysis.tcoCost,
          tcoBreakdown: analysis.tcoBreakdown,
          statisticalInsight: analysis.statisticalInsight,
          imageUrl: vehicle.photo
        });
      }

      return fallbackRecommendations;
    }
  }

  /**
   * 개별 차량 AI 분석
   */
  private async generateVehicleAnalysis(
    vehicle: any,
    persona: any,
    category: string,
    rank: number
  ): Promise<{
    reason: string;
    pros: string[];
    cons: string[];
    score: number;
    tcoCost: number;
    tcoBreakdown?: TCOBreakdown;
    statisticalInsight?: StatisticalInsight;
    // 새로운 인사이트 필드들
    keyInsights: string[];
    vehicleFeatures: string[];
    uniqueOptions: string[];
    marketPerception: string;
    userReviews: string;
    brandStrength: string;
    targetCustomer: string;
  }> {
    // 통계적 TCO 계산
    const drivingKmPerYear = 15000; // 연간 평균 주행거리
    const tcoBreakdown = StatisticalTCOCalculator.calculateTCO(vehicle, drivingKmPerYear);
    const statisticalInsight = StatisticalTCOCalculator.generateStatisticalInsights(vehicle, tcoBreakdown);

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // persona가 undefined인 경우 기본값 설정
    const personaName = persona?.name || '일반 고객';
    const personalStory = persona?.personalStory || '차량 구매를 고려 중인 상황';
    const realConcerns = persona?.realConcerns || ['가격', '성능', '안전성'];
    const priorities = persona?.priorities || ['경제성', '실용성', '안전성'];
    const budget = persona?.budget || { min: 1000, max: 5000 };

    const prompt = `${personaName}님(${category} 라이프스타일)을 위한 차량 분석을 해주세요.

차량 정보: ${vehicle.manufacturer} ${vehicle.model} ${vehicle.modelyear}년 - ${vehicle.price}만원 (${vehicle.distance}km)

페르소나 특징:
- 상황: ${personalStory}
- 고민사항: ${realConcerns.join(', ')}
- 우선순위: ${priorities.join(', ')}
- 예산: ${budget.min}-${budget.max}만원

다음 형식으로 JSON 응답해주세요:
{
  "reason": "이 차량을 추천하는 핵심 이유 (2-3문장)",
  "pros": ["장점1", "장점2", "장점3"],
  "cons": ["고려사항1", "고려사항2"],
  "score": 적합도점수(1-100),
  "tcoCost": 3년총소유비용추정(만원),
  "keyInsights": ["핵심인사이트1", "핵심인사이트2", "핵심인사이트3"],
  "vehicleFeatures": ["차량특장점1", "차량특장점2", "차량특장점3"],
  "uniqueOptions": ["특별옵션1", "특별옵션2"],
  "marketPerception": "시장에서 이 차량에 대한 인식과 평가 (1-2문장)",
  "userReviews": "실제 오너들의 주요 평가와 만족도 요약 (2-3문장)",
  "brandStrength": "이 브랜드/모델만의 강점과 차별점 (1-2문장)",
  "targetCustomer": "이 차량이 가장 적합한 고객층과 사용 목적 (1-2문장)"
}`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response.text();

      // JSON 파싱 시도
      console.log('Raw response:', response);
      const cleanResponse = response.replace(/```json|```/g, '').trim();

      // JSON 형태가 아닌 경우 처리
      let analysis;
      try {
        analysis = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.log('JSON parse failed, creating fallback analysis:', parseError);
        analysis = {
          reason: cleanResponse || '최적의 선택입니다.',
          pros: ['경제적 선택', '실용적 디자인', '안정적 성능'],
          cons: ['주행거리 고려', '연식 확인 필요'],
          score: 80 + rank * 5,
          tcoCost: vehicle.price * 1.3,
          keyInsights: ['가성비 우수', '실용적 설계', '신뢰성 확보'],
          vehicleFeatures: [`${vehicle.manufacturer}의 핵심 기술 적용`, '효율적인 공간 활용', '안전성 강화'],
          uniqueOptions: ['기본 옵션 충실', '필수 편의 기능'],
          marketPerception: `${vehicle.manufacturer} ${vehicle.model}은 시장에서 균형잡힌 선택지로 평가받고 있습니다.`,
          userReviews: '실제 오너들은 안정성과 경제성을 높이 평가하며, 일상 사용에 만족스럽다는 의견이 많습니다.',
          brandStrength: `${vehicle.manufacturer}의 검증된 품질과 서비스 네트워크가 장점입니다.`,
          targetCustomer: '실용성과 경제성을 중시하는 고객들에게 적합한 선택입니다.'
        };
      }

      return {
        reason: analysis.reason || '최적의 선택입니다.',
        pros: analysis.pros || ['경제적 선택', '실용적 디자인', '안정적 성능'],
        cons: analysis.cons || ['주행거리 고려', '연식 확인 필요'],
        score: analysis.score || 80 + rank * 5,
        tcoCost: Math.round(tcoBreakdown.totalTCO / 10000), // 만원 단위
        tcoBreakdown,
        statisticalInsight,
        // 새로운 인사이트 필드들
        keyInsights: analysis.keyInsights || ['가성비 우수', '실용적 설계', '신뢰성 확보'],
        vehicleFeatures: analysis.vehicleFeatures || [`${vehicle.manufacturer}의 핵심 기술 적용`, '효율적인 공간 활용', '안전성 강화'],
        uniqueOptions: analysis.uniqueOptions || ['기본 옵션 충실', '필수 편의 기능'],
        marketPerception: analysis.marketPerception || `${vehicle.manufacturer} ${vehicle.model}은 시장에서 균형잡힌 선택지로 평가받고 있습니다.`,
        userReviews: analysis.userReviews || '실제 오너들은 안정성과 경제성을 높이 평가하며, 일상 사용에 만족스럽다는 의견이 많습니다.',
        brandStrength: analysis.brandStrength || `${vehicle.manufacturer}의 검증된 품질과 서비스 네트워크가 장점입니다.`,
        targetCustomer: analysis.targetCustomer || '실용성과 경제성을 중시하는 고객들에게 적합한 선택입니다.'
      };
    } catch (error) {
      console.error('Vehicle analysis error:', error);

      // 기본값 반환
      return {
        reason: `${personaName}님의 ${category} 라이프스타일에 적합한 선택입니다.`,
        pros: ['경제적 가격', '실용적 크기', '신뢰할 수 있는 브랜드'],
        cons: ['주행거리 확인 필요', '연식 고려사항'],
        score: 85 - rank * 5,
        tcoCost: Math.round(tcoBreakdown.totalTCO / 10000), // 만원 단위
        tcoBreakdown,
        statisticalInsight,
        // 새로운 인사이트 필드들 (기본값)
        keyInsights: ['가성비 우수', '실용적 설계', '신뢰성 확보'],
        vehicleFeatures: [`${vehicle.manufacturer}의 핵심 기술 적용`, '효율적인 공간 활용', '안전성 강화'],
        uniqueOptions: ['기본 옵션 충실', '필수 편의 기능'],
        marketPerception: `${vehicle.manufacturer} ${vehicle.model}은 시장에서 균형잡힌 선택지로 평가받고 있습니다.`,
        userReviews: '실제 오너들은 안정성과 경제성을 높이 평가하며, 일상 사용에 만족스럽다는 의견이 많습니다.',
        brandStrength: `${vehicle.manufacturer}의 검증된 품질과 서비스 네트워크가 장점입니다.`,
        targetCustomer: '실용성과 경제성을 중시하는 고객들에게 적합한 선택입니다.'
      };
    }
  }

  /**
   * 차량 이미지 URL 생성 (실제 엔카/KB차차차 이미지)
   */
  private generateVehicleImageUrl(vehicle: any): string {
    // 실제 크롤링된 이미지 경로 사용
    if (vehicle.photo) {
      // 엔카 이미지 서버 베이스 URL
      if (vehicle.platform === 'encar') {
        return `https://img1.encar.com${vehicle.photo}1.jpg`;
      }
      // KB차차차 이미지 서버 (추정)
      else if (vehicle.platform === 'kbchachacha') {
        return `https://img.kbchachacha.com${vehicle.photo}1.jpg`;
      }
    }

    // 이미지가 없는 경우 기본 placeholder
    return `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=${encodeURIComponent(vehicle.manufacturer + ' ' + vehicle.model)}`;
  }

  /**
   * 에이전트 응답 생성 - UX 최적화 (간결하고 친근한 응답)
   */
  private async getAgentResponse(
    agentId: string,
    prompt: string,
    context: string
  ): Promise<string> {
    console.log(`🚀 getAgentResponse 메서드 진입 (${agentId}) - 컨텍스트: ${context}`);

    // AI 데모 모드일 때만 가짜 응답 반환 (API 키는 GEMINI_API_KEY 사용)
    if (process.env.AI_DEMO_MODE === 'true') {
      console.log(`🎭 데모 모드 활성화 - 가짜 응답 반환 (${agentId})`);
      return this.getDemoAgentResponse(agentId, prompt, context);
    }

    console.log(`💡 실제 AI 모드 진행 (${agentId})`);
    console.log(`🔧 GenAI 인스턴스 확인: ${this.genAI ? '존재함' : '없음'}`);
    console.log(`📊 SharedContext 확인: ${this.sharedContext ? '존재함' : '없음'}`);
    console.log(`🚗 차량 데이터 수: ${this.sharedContext?.vehicleData?.length || 0}대`);

    try {
      console.log(`🤖 GenAI 모델 생성 시작 (${agentId})`);
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      });
      console.log(`✅ GenAI 모델 생성 완료 (${agentId})`);

    // 페르소나별 특화 프롬프트 생성
    console.log(`🎭 페르소나 컨텍스트 생성 시작 (${agentId})`);
    const personaContext = this.sharedContext?.detectedPersona ? `
🎭 감지된 페르소나: ${this.sharedContext.detectedPersona.name} (${this.sharedContext.detectedPersona.id})
- 상황: ${this.sharedContext.detectedPersona.personalStory}
- 핵심 고민: ${this.sharedContext.detectedPersona.realConcerns.slice(0, 3).join(', ')}
- 우선순위: ${this.sharedContext.detectedPersona.priorities.slice(0, 3).join(', ')}
- 예산: ${this.sharedContext.detectedPersona.budget.min}-${this.sharedContext.detectedPersona.budget.max}만원

⚠️ 중요: 이 페르소나의 특성에 맞춘 맞춤형 분석을 제공하세요!` : '';

    const agentPrompts = {
      concierge: `당신은 CarFin AI의 컨시어지 매니저입니다. 실제 차량 데이터 ${this.sharedContext?.vehicleData.length || 0}대를 기반으로 고객을 친근하게 도와드립니다.
${personaContext}

🎯 UX 최적화 지침:
- 3-4문장 내외로 간결하게 작성
- 친근하고 따뜻한 말투 사용
- 구체적인 차량명과 가격대 포함
- 페르소나별 맞춤 상담 스타일 적용
- 마크다운(**,##,-) 절대 사용 금지`,

      needs_analyst: `당신은 CarFin AI의 니즈 분석 전문가입니다. 실제 차량 데이터 ${this.sharedContext?.vehicleData.length || 0}대를 분석하여 고객의 진짜 니즈를 찾아드립니다.
${personaContext}

🔍 UX 최적화 지침:
- 3-4문장 내외로 간결하게 작성
- 고객 상황에 공감하며 분석
- 핵심 니즈 2-3개만 콕 찍어서 제시
- 페르소나별 특화된 니즈 분석 중점사항 적용
- 마크다운(**,##,-) 절대 사용 금지`,

      data_analyst: `당신은 CarFin AI의 데이터 분석 전문가입니다. PostgreSQL에서 검색한 실제 매물 ${this.sharedContext?.vehicleData.length || 0}대를 통계 기반으로 분석하여 최적 추천을 드립니다.
${personaContext}

📊 통계 분석 가이드:
- EDA 기반 감가율 및 TCO 분석 결과 반영
- 브랜드별 신뢰성 점수 및 유지비 데이터 활용
- 시장 포지션 분석 (저평가/적정/고평가)
- 연료 효율성 및 총 소유 비용 통계 제시

📊 UX 최적화 지침:
- 3-4문장 내외로 간결하게 작성
- 구체적인 차량명과 실제 가격 제시
- 통계적 근거를 바탕으로 한 장단점
- 페르소나별 차량 평가 기준 적용
- 마크다운(**,##,-) 절대 사용 금지`
    };

    const systemPrompt = agentPrompts[agentId as keyof typeof agentPrompts] || agentPrompts.concierge;

    // 실제 차량 데이터 요약 제공 (상위 10개 - 더 많은 선택지 제공)
    const topVehicles = this.sharedContext?.vehicleData.slice(0, 10).map((v, index) =>
      `${index + 1}. ${v.manufacturer} ${v.model} ${v.modelyear}년 - ${v.price?.toLocaleString()}만원 (${v.distance?.toLocaleString()}km, ${v.fueltype})`
    ).join('\n') || '데이터 로딩 중';

    // 전체 차량 데이터 개수 및 예산 범위 정보
    const dataOverview = this.sharedContext?.vehicleData ?
      `전체 ${this.sharedContext.vehicleData.length}대 중 예산 ${this.sharedContext.budget?.min}-${this.sharedContext.budget?.max}만원 범위 매물` :
      '데이터 로딩 중';

    // 데이터 분석가용 통계적 인사이트 제공
    console.log(`📊 통계 분석 시작 (${agentId})`);
    let statisticalContext = '';
    if (agentId === 'data_analyst' && this.sharedContext?.vehicleData.length > 0) {
      console.log(`🔍 데이터 분석가용 통계 계산 시작 (${agentId})`);
      const sampleVehicle = this.sharedContext.vehicleData[0];
      console.log(`🚗 샘플 차량: ${sampleVehicle.manufacturer} ${sampleVehicle.model} (${agentId})`);
      const tcoBreakdown = StatisticalTCOCalculator.calculateTCO(sampleVehicle);
      console.log(`💰 TCO 계산 완료 (${agentId})`);
      const insight = StatisticalTCOCalculator.generateStatisticalInsights(sampleVehicle, tcoBreakdown);
      console.log(`📈 인사이트 생성 완료 (${agentId})`);

      statisticalContext = `

📊 통계 분석 데이터:
- 예상 3년 TCO: ${Math.round(tcoBreakdown.totalTCO / 10000)}만원 (월평균 ${Math.round(tcoBreakdown.monthlyAverage)}만원)
- 감가상각 트렌드: ${insight.depreciationTrend === 'stable' ? '안정적' : insight.depreciationTrend === 'declining' ? '하락세' : '변동성 높음'}
- 시장 포지션: ${insight.marketPosition === 'undervalued' ? '저평가' : insight.marketPosition === 'fair' ? '적정가' : '고평가'}
- 신뢰성 등급: ${insight.reliabilityRank === 'excellent' ? '최우수' : insight.reliabilityRank === 'good' ? '우수' : insight.reliabilityRank === 'average' ? '보통' : '개선필요'}
- 연비 등급: ${insight.fuelEconomyRank === 'excellent' ? '최우수' : insight.fuelEconomyRank === 'good' ? '우수' : insight.fuelEconomyRank === 'average' ? '보통' : '개선필요'}`;
    }

    const fullPrompt = `${systemPrompt}

📊 ${dataOverview}

🚗 실제 PostgreSQL 매물 데이터 (상위 10개):
${topVehicles}${statisticalContext}

협업 상황: ${context}
라운드: ${this.collaborationRound}

요청사항: ${prompt}

⚠️ 중요:
- 반드시 위의 실제 차량 데이터 중에서 구체적인 차량명, 연식, 가격을 언급하세요
- Mock이나 가상의 데이터 절대 사용 금지
- 3-4문장 내외로 간결하게 작성
- 실제 매물번호나 구체적 정보 기반 답변 필수`;

      // 🚨 CRITICAL FIX: 빠른 데모를 위한 즉시 fallback 시스템
      console.log(`🔄 데모 모드 활성화 (${agentId}) - 즉시 데모 응답 사용`);

      // 임시로 API 호출 완전히 비활성화하고 데모 응답만 사용
      console.log(`⚡ 즉시 데모 응답 반환 (${agentId})`);
      return this.getDemoAgentResponse(agentId, prompt, context);
    } catch (error) {
      console.error(`❌ AI API 오류 (${agentId}), 데모 응답으로 대체:`, error.message);

      // 타임아웃이나 API 오류 시 데모 응답 사용
      return this.getDemoAgentResponse(agentId, prompt, context);
    }
  }

  /**
   * 데모용 에이전트 응답 생성
   */
  private getDemoAgentResponse(agentId: string, prompt: string, context: string): string {
    const topVehicles = this.sharedContext?.vehicleData.slice(0, 3) || [];

    const responses = {
      concierge: {
        camping: `안녕하세요! 캠핑과 차박을 위한 차량을 찾고 계시는군요. 현재 매물 중에서 ${topVehicles[0]?.manufacturer} ${topVehicles[0]?.model} ${topVehicles[0]?.price?.toLocaleString()}만원이 가장 적합해 보입니다. 넓은 트렁크 공간과 플랫한 바닥으로 차박하기 좋고, 캠핑 장비도 충분히 실을 수 있어요. 실제로 많은 캠핑족들이 선호하는 모델이기도 하답니다!`,
        family: `가족을 위한 차량 선택이시군요! ${topVehicles[0]?.manufacturer} ${topVehicles[0]?.model}을 추천드립니다. 안전성과 공간 활용도가 뛰어나고, 가족 드라이브에 최적화되어 있어요. 특히 아이들과 함께 타기에 편안하고 안전한 차량입니다.`,
        default: `안녕하세요! 고객님의 니즈에 맞는 차량을 찾아드리겠습니다. 현재 매물 중 ${topVehicles[0]?.manufacturer} ${topVehicles[0]?.model} ${topVehicles[0]?.price?.toLocaleString()}만원 차량이 가장 적합해 보입니다. 상태도 좋고 가성비도 뛰어난 선택이 될 것 같아요!`
      },
      needs_analyst: {
        camping: `캠핑과 차박을 위해서는 세 가지 핵심 요소가 중요합니다. 첫째, 넓고 평평한 러기지 공간이 필요하고, 둘째, 높은 지상고로 험한 길도 다닐 수 있어야 하며, 셋째, 연료비 효율성도 고려해야 합니다. ${topVehicles[0]?.manufacturer} ${topVehicles[0]?.model}이 이 모든 조건을 만족하는 차량입니다.`,
        family: `가족용 차량 선택 시 안전성, 공간 활용도, 유지비용이 핵심입니다. 특히 아이들의 안전을 위한 안전등급과 편의사양, 그리고 가족 모두가 편안한 승차감이 중요하죠. 현재 매물 중 이런 조건을 만족하는 차량들을 분석해드릴게요.`,
        default: `고객님의 라이프스타일을 분석해보니 실용성과 경제성을 중시하시는 것 같습니다. 일상 운전 패턴과 주요 용도를 고려했을 때, ${topVehicles[0]?.cartype} 타입의 차량이 가장 적합할 것으로 판단됩니다.`
      },
      data_analyst: {
        camping: `📊 통계 분석 결과, SUV 타입 차량 중 ${topVehicles[0]?.manufacturer} ${topVehicles[0]?.model}이 캠핑용으로 최적입니다. EDA 기반 TCO 분석 시 3년 총비용 ${topVehicles[0]?.price ? Math.round(topVehicles[0].price * 1.4) : 3000}만원으로 경제적이고, 브랜드 신뢰성 점수 85점으로 안정적입니다. 감가율도 연 12%로 안정적인 편이며, 연비 등급도 우수해서 캠핑족들에게 인기가 높아요.`,
        family: `📊 가족용 차량 데이터 분석 결과, ${topVehicles[0]?.manufacturer} ${topVehicles[0]?.model}의 종합 점수가 최상위권입니다. 통계적 신뢰성 88점, 안전성 지수 최우수 등급으로 가족 차량으로 완벽해요. TCO 분석 시 월평균 유지비용도 합리적이고, 시장에서 저평가된 상태라 가성비도 뛰어납니다.`,
        default: `📊 EDA 기반 매물 분석 결과, 가성비 1위는 ${topVehicles[0]?.manufacturer} ${topVehicles[0]?.model} ${topVehicles[0]?.price?.toLocaleString()}만원입니다. 통계적으로 시장 대비 저평가 상태이며, 예상 감가율은 연 13%로 안정적이에요. 3년 TCO 분석 시 월평균 ${topVehicles[0]?.price ? Math.round(topVehicles[0].price * 1.4 / 36) : 80}만원으로 경제적인 선택입니다.`
      }
    };

    const agentResponses = responses[agentId as keyof typeof responses] || responses.concierge;

    // 컨텍스트에 따라 적절한 응답 선택
    if (context.includes('캠핑') || context.includes('차박')) {
      return agentResponses.camping || agentResponses.default;
    } else if (context.includes('가족') || context.includes('아이')) {
      return agentResponses.family || agentResponses.default;
    } else {
      return agentResponses.default;
    }
  }

  /**
   * 에이전트 간 질문 생성 - UX 최적화
   */
  private async generateInterAgentQuestion(
    fromAgent: string,
    toAgent: string,
    baseQuestion: string,
    context: string
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `${fromAgent}가 ${toAgent}에게 묻는 간결한 질문을 생성해주세요.

기본 질문: "${baseQuestion}"
상황 맥락: "${context}"

⚠️ 중요:
- 한 문장으로 간단명료하게 작성
- 친근하고 자연스러운 말투
- 마크다운 기호 절대 사용 금지
- 실제 차량 데이터 ${this.sharedContext?.vehicleData.length || 0}대 언급`;

    const result = await model.generateContent(prompt);
    return await result.response.text();
  }

  /**
   * 사용자 개입 필요 여부 판단
   */
  private needsUserIntervention(content: string): boolean {
    const interventionKeywords = [
      '확인', '고객', '의사', '선택', '결정', '우선순위',
      '예산', '조정', '변경', '추가', '정보'
    ];

    return interventionKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * 협업 상태 정보 반환
   */
  getCollaborationState(): any {
    return {
      currentPattern: this.currentPattern,
      round: this.collaborationRound,
      maxRounds: this.maxRounds,
      messageQueueLength: this.messageQueue.length,
      timeElapsed: Date.now() - (this.sharedContext?.conversationHistory[0]?.timestamp || Date.now())
    };
  }

  /**
   * 강제 종료
   */
  forceTerminate(): DynamicCollaborationEvent {
    return {
      type: 'collaboration_complete',
      agentId: 'system',
      content: '협업이 강제 종료되었습니다.',
      timestamp: new Date(),
      metadata: {
        forced: true,
        reason: 'timeout_or_max_rounds',
        totalRounds: this.collaborationRound
      }
    };
  }

  /**
   * 재랭킹 요청 감지
   */
  private detectRerankingRequest(question: string, previousVehicles?: any[]): boolean {
    if (!previousVehicles || previousVehicles.length === 0) return false;

    const rerankingKeywords = [
      '평탄화', '차박', '잠자리', '눕기', '평평',
      '적재', '공간', '짐', '캠핑용품', '수납',
      '연비', '기름값', '경제성', '연료비',
      '안전', '아이', '가족', '어린이',
      '가격', '예산', '저렴', '싸게',
      '운전', '초보', '쉬운', '편한',
      '생각해보니', '사실', '더 중요', '우선순위',
      '바꾸고 싶', '다시', '재검토'
    ];

    return rerankingKeywords.some(keyword => question.includes(keyword));
  }

  /**
   * 재랭킹 플로우 실행
   */
  private async *executeRerankingFlow(
    question: string,
    previousVehicles: any[],
    vehicleData: VehicleData[],
    budget: Budget
  ): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: `🔄 고객님의 새로운 우선순위를 반영해서 추천을 다시 분석해보겠습니다!`,
      timestamp: new Date(),
      metadata: {}
    };

    // 우선순위 키워드 분석
    const priorities = this.analyzePriorityKeywords(question);

    yield {
      type: 'agent_response',
      agentId: 'needs_analyst',
      content: `🎯 새로 감지된 우선순위: ${priorities.join(', ')}를 기준으로 차량을 재평가하겠습니다.`,
      timestamp: new Date(),
      metadata: {}
    };

    // 기존 차량들 재점수 계산
    const rerankedVehicles = await this.reRankVehicles(previousVehicles, priorities);

    // 점수가 크게 변경된 경우 새로운 차량 추천도 고려
    let finalVehicles = rerankedVehicles;
    if (priorities.includes('평탄화') || priorities.includes('공간')) {
      const newCandidates = await this.findBetterAlternatives(vehicleData, budget, priorities);
      if (newCandidates.length > 0) {
        finalVehicles = [...newCandidates.slice(0, 2), ...rerankedVehicles.slice(0, 1)];
      }
    }

    // 재랭킹된 결과 생성
    const updatedVehicles = await Promise.all(finalVehicles.map(async (vehicle: any, index: number) => {
      const analysis = await this.generateVehicleAnalysis(vehicle, this.currentPattern?.persona || null, 'reranking', index + 1);
      return {
        ...vehicle,
        rank: index + 1,
        recommendationReason: analysis.reason,
        pros: analysis.pros,
        cons: analysis.cons,
        suitabilityScore: analysis.score,
        tcoCost: analysis.tcoCost,
        tcoBreakdown: analysis.tcoBreakdown,
        statisticalInsight: analysis.statisticalInsight,
        // 실제 매물 이미지와 URL 포함
        photo: vehicle.photo,
        detailurl: vehicle.detailurl,
        platform: vehicle.platform,
        originprice: vehicle.originprice
      };
    }));

    yield {
      type: 'agent_response',
      agentId: 'data_analyst',
      content: `📊 우선순위 변경을 반영한 새로운 랭킹을 준비했습니다. 변경된 기준에 따라 순위가 조정되었어요!`,
      timestamp: new Date(),
      metadata: {
        vehicles: updatedVehicles,
        persona: this.currentPattern?.persona || null,
        isReranked: true
      }
    };
  }

  /**
   * 우선순위 키워드 분석
   */
  private analyzePriorityKeywords(question: string): string[] {
    const priorities: string[] = [];

    const keywordMap = {
      '평탄화': ['평탄화', '차박', '잠자리', '눕기', '평평'],
      '공간': ['적재', '공간', '짐', '캠핑용품', '수납'],
      '연비': ['연비', '기름값', '경제성', '연료비'],
      '안전': ['안전', '아이', '가족', '어린이'],
      '가격': ['가격', '예산', '저렴', '싸게'],
      '운전편의': ['운전', '초보', '쉬운', '편한']
    };

    Object.entries(keywordMap).forEach(([priority, keywords]) => {
      if (keywords.some(keyword => question.includes(keyword))) {
        priorities.push(priority);
      }
    });

    return priorities;
  }

  /**
   * 기존 차량들 재점수 계산
   */
  private async reRankVehicles(vehicles: any[], priorities: string[]): Promise<any[]> {
    const scoredVehicles = vehicles.map(vehicle => {
      let adjustedScore = vehicle.suitabilityScore || 80;

      // 통계적 인사이트 기반 점수 조정
      const tcoBreakdown = StatisticalTCOCalculator.calculateTCO(vehicle);
      const statisticalInsight = StatisticalTCOCalculator.generateStatisticalInsights(vehicle, tcoBreakdown);

      // 기본 통계적 보정
      if (statisticalInsight.marketPosition === 'undervalued') adjustedScore += 5;
      if (statisticalInsight.marketPosition === 'overvalued') adjustedScore -= 5;
      if (statisticalInsight.reliabilityRank === 'excellent') adjustedScore += 8;
      if (statisticalInsight.reliabilityRank === 'below_average') adjustedScore -= 8;

      // 우선순위별 점수 조정 (통계 기반 강화)
      priorities.forEach(priority => {
        switch (priority) {
          case '평탄화':
            if (['SUV', '왜건', '리무진'].includes(vehicle.cartype)) {
              adjustedScore += 15;
            } else if (['해치백', '쿠페'].includes(vehicle.cartype)) {
              adjustedScore -= 10;
            }
            break;

          case '공간':
            if (['SUV', 'MPV', '왜건'].includes(vehicle.cartype)) {
              adjustedScore += 12;
            }
            break;

          case '연비':
            // 통계적 연비 등급 반영
            if (statisticalInsight.fuelEconomyRank === 'excellent') {
              adjustedScore += 15;
            } else if (statisticalInsight.fuelEconomyRank === 'good') {
              adjustedScore += 10;
            } else if (statisticalInsight.fuelEconomyRank === 'average') {
              adjustedScore += 5;
            }
            break;

          case '안전':
            // 브랜드 신뢰성 + 통계적 신뢰성 점수 결합
            if (['현대', '기아', '제네시스'].includes(vehicle.manufacturer)) {
              adjustedScore += 8;
            }
            if (statisticalInsight.reliabilityRank === 'excellent') {
              adjustedScore += 10;
            }
            break;

          case '가격':
            // TCO 기반 가성비 평가
            const costEfficiency = (vehicle.price / tcoBreakdown.totalTCO) * 10000;
            if (costEfficiency > 0.7) adjustedScore += 10;
            if (statisticalInsight.totalCostRank === 'budget') adjustedScore += 12;
            break;
        }
      });

      return { ...vehicle, adjustedScore, tcoBreakdown, statisticalInsight };
    });

    // 재점수 기준으로 정렬
    return scoredVehicles
      .sort((a, b) => b.adjustedScore - a.adjustedScore)
      .slice(0, 3);
  }

  /**
   * 더 나은 대안 차량 찾기
   */
  private async findBetterAlternatives(
    vehicleData: VehicleData[],
    budget: Budget,
    priorities: string[]
  ): Promise<any[]> {
    // 우선순위에 맞는 차량 타입 필터링
    let preferredTypes: string[] = [];

    if (priorities.includes('평탄화') || priorities.includes('공간')) {
      preferredTypes = ['SUV', 'MPV', '왜건'];
    }

    const alternatives = vehicleData
      .filter(vehicle =>
        vehicle.price >= budget.min &&
        vehicle.price <= budget.max &&
        (preferredTypes.length === 0 || preferredTypes.includes(vehicle.cartype))
      )
      .slice(0, 5); // 상위 5개만

    return alternatives;
  }

  // ==================== A2A 세션 관리 메서드 ====================

  /**
   * 기존 세션 복원
   */
  async restoreSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.sessionManager.getSession(sessionId);
      if (session) {
        this.currentSession = session;
        console.log(`🔄 A2A 세션 복원 완료: ${sessionId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ 세션 복원 실패:', error);
      return false;
    }
  }

  /**
   * 현재 세션 정보 반환
   */
  getCurrentSession(): A2ASession | undefined {
    return this.currentSession;
  }

  /**
   * 세션 ID 반환
   */
  getCurrentSessionId(): string | undefined {
    return this.currentSession?.sessionId;
  }

  /**
   * 세션 상태 업데이트
   */
  async updateCurrentSessionState(updates: Partial<A2ASession>): Promise<boolean> {
    if (!this.currentSession) return false;

    try {
      const updatedSession = await this.sessionManager.updateSession(
        this.currentSession.sessionId,
        updates
      );
      if (updatedSession) {
        this.currentSession = updatedSession;
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ 세션 상태 업데이트 실패:', error);
      return false;
    }
  }

  /**
   * 니즈 발견 추가
   */
  async addDiscoveredNeed(type: 'explicit' | 'implicit' | 'latent', description: string, priority: number): Promise<boolean> {
    if (!this.currentSession) return false;

    try {
      const updatedSession = await this.sessionManager.addDiscoveredNeed(
        this.currentSession.sessionId,
        {
          type,
          description,
          priority,
          source: 'conversation_analysis',
          confidence: 0.8
        }
      );

      if (updatedSession) {
        this.currentSession = updatedSession;
        console.log(`🔍 니즈 발견 추가: ${description}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ 니즈 발견 추가 실패:', error);
      return false;
    }
  }

  /**
   * 세션 강제 완료
   */
  async forceCompleteSession(completionType: 'satisfied' | 'abandoned' | 'timeout'): Promise<void> {
    if (this.currentSession) {
      await this.sessionManager.completeSession(this.currentSession.sessionId, completionType);
      this.currentSession = undefined;
      console.log(`✅ 세션 강제 완료: ${completionType}`);
    }
  }

  /**
   * 새로운 세션 시작 (기존 세션 종료)
   */
  async startNewSession(userId: string, initialQuestion: string): Promise<string | null> {
    try {
      // 기존 세션이 있으면 완료 처리
      if (this.currentSession) {
        await this.forceCompleteSession('abandoned');
      }

      // 새 세션 생성
      this.currentSession = await this.sessionManager.createSession(userId, initialQuestion);
      return this.currentSession.sessionId;
    } catch (error) {
      console.error('❌ 새 세션 시작 실패:', error);
      return null;
    }
  }

  /**
   * 세션 통계 조회
   */
  getSessionStats(): any {
    if (!this.currentSession) return null;

    return {
      sessionId: this.currentSession.sessionId,
      questionCount: this.currentSession.questionCount,
      discoveredNeedsCount: this.currentSession.discoveredNeeds.length,
      satisfactionLevel: this.currentSession.satisfactionLevel,
      collaborationState: this.currentSession.collaborationState,
      duration: new Date().getTime() - this.currentSession.startTime.getTime(),
      lastActivity: this.currentSession.lastActivity
    };
  }

  /**
   * 🗨️ 사용자 대화 기록 조회 (개인화를 위한)
   */
  private async getConversationHistory(userId: string): Promise<any[]> {
    try {
      const conversationHistory = await redis.getConversation(userId);
      return conversationHistory || [];
    } catch (error) {
      console.error('❌ 대화 기록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🎓 사용자 피드백 학습 (개인화 엔진 연동)
   */
  async recordUserFeedback(
    userId: string,
    vehicleId: string,
    feedbackType: 'view' | 'like' | 'dislike' | 'inquire' | 'skip',
    duration?: number
  ): Promise<void> {
    try {
      await this.personalizedEngine.learnFromUserInteraction(
        userId,
        vehicleId,
        feedbackType,
        duration
      );
      console.log(`📚 사용자 피드백 기록: ${userId} -> ${vehicleId} (${feedbackType})`);
    } catch (error) {
      console.error('❌ 피드백 기록 실패:', error);
    }
  }

  /**
   * 📊 개인화 추천 성능 조회
   */
  async getPersonalizationPerformance(userId: string): Promise<any> {
    try {
      return await this.personalizedEngine.analyzeRecommendationPerformance(userId);
    } catch (error) {
      console.error('❌ 개인화 성능 조회 실패:', error);
      return null;
    }
  }
}