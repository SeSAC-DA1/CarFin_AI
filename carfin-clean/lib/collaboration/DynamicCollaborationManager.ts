// DynamicCollaborationManager.ts - 패턴별 동적 협업 플로우 실행 및 관리

import { GoogleGenerativeAI } from '@google/generative-ai';
import { CollaborationPatternDetector, CollaborationPattern } from './CollaborationPatternDetector';
import { SharedContext, VehicleData, Budget } from './SharedContext';

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
  private currentPattern: CollaborationPattern | undefined = undefined;
  private collaborationRound = 0;
  private maxRounds = 7;
  private messageQueue: AgentMessage[] = [];
  private collaborationTimeout = 300000; // 5분 타임아웃

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.patternDetector = new CollaborationPatternDetector();

    // SharedContext 기본값으로 초기화
    this.sharedContext = new SharedContext('', [], { min: 0, max: 0, flexible: true, userConfirmed: false });
  }

  /**
   * 동적 협업 시작
   */
  async *startDynamicCollaboration(
    question: string,
    vehicleData: VehicleData[],
    budget: Budget,
    previousVehicles?: any[] // 이전 추천 차량들 (재랭킹용)
  ): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {

    // 재랭킹 요청 감지
    const isRerankingRequest = this.detectRerankingRequest(question, previousVehicles);

    if (isRerankingRequest && previousVehicles && previousVehicles.length > 0) {
      // 재랭킹 플로우 실행
      yield* await this.executeRerankingFlow(question, previousVehicles, vehicleData, budget);
      return;
    }

    // 1. 상황 분석 및 패턴 감지 (기존 플로우)
    const pattern = this.patternDetector.detectPattern({
      userQuestion: question,
      budget,
      vehicleCount: vehicleData.length,
      vehicleData
    });

    this.currentPattern = pattern;
    this.sharedContext = new SharedContext(question, vehicleData, budget);
    this.collaborationRound = 0;

    yield {
      type: 'pattern_detected',
      agentId: 'system',
      content: `${pattern.type} 패턴 감지: ${pattern.description}`,
      timestamp: new Date(),
      metadata: { pattern }
    };

    // 2. 패턴별 동적 협업 실행
    yield* await this.executePatternBasedCollaboration(pattern);
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

      default:
        yield* await this.executeStandardFlow();
        break;
    }
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
    const persona = pattern.persona!;

    // 1라운드: 컨시어지가 불안감 공감 및 안심시키기
    const conciergeComfort = await this.getAgentResponse(
      'concierge',
      `${persona.name}님의 첫차 구매 불안감을 이해하고 공감해주세요. "${persona.personalStory}"라는 상황에서 안전하고 신뢰할 수 있는 차량 선택 방향을 제시해주세요.`,
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
    const needsAnalysis = await this.getAgentResponse(
      'needs_analyst',
      `첫차 구매자 ${persona.name}님의 핵심 고민사항들을 분석해보세요: ${persona.realConcerns.join(', ')}. 초보운전자에게 가장 중요한 우선순위를 제시해주세요.`,
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

    yield {
      type: 'collaboration_complete',
      agentId: 'system',
      content: '첫차 구매 불안 맞춤 협업 완료',
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, totalRounds: this.collaborationRound, persona: persona.name }
    };
  }

  /**
   * 워킹맘 가족 우선 패턴 협업 플로우 (이소영 페르소나)
   */
  private async *executeFamilyPriorityFlow(pattern: CollaborationPattern): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;
    const persona = pattern.persona!;

    // 1라운드: 니즈 분석가가 워킹맘의 현실적 니즈 분석
    const workingMomNeeds = await this.getAgentResponse(
      'needs_analyst',
      `워킹맘 ${persona.name}님의 현실적 고민을 깊이 분석해보세요. "${persona.personalStory}"와 함께 실제 고민사항들: ${persona.realConcerns.join(', ')}을 고려해 가족용 차량의 핵심 요구사항을 도출해주세요.`,
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
      `워킹맘 ${persona.name}님을 위한 최종 추천을 정리해주세요. 니즈 분석: "${workingMomNeeds}" 데이터 분석: "${familySafetyAnalysis}" 이를 바탕으로 가족 모두가 만족할 수 있는 현실적 해결책을 제시해주세요.`,
      'family_coordination'
    );

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: familyCoordination,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    yield {
      type: 'collaboration_complete',
      agentId: 'system',
      content: '워킹맘 가족 우선 맞춤 협업 완료',
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, totalRounds: this.collaborationRound, persona: persona.name }
    };
  }

  /**
   * MZ세대 라이프스타일 패턴 협업 플로우 (박준혁 페르소나)
   */
  private async *executeMZLifestyleFlow(pattern: CollaborationPattern): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;
    const persona = pattern.persona!;

    // 1라운드: 컨시어지가 MZ세대 감성 이해 및 브랜드 이미지 중요성 인식
    const mzSensitivity = await this.getAgentResponse(
      'concierge',
      `MZ세대 직장인 ${persona.name}님의 라이프스타일을 이해해주세요. "${persona.personalStory}"라는 상황에서 인스타 감성과 동기들과의 관계, 데이트 등 사회적 이미지를 고려한 차량 선택 방향을 제시해주세요.`,
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
      `MZ세대 ${persona.name}님의 솔직한 고민들을 분석해보세요: ${persona.realConcerns.join(', ')}. 허세와 실용성, 브랜드 이미지와 경제성 사이에서 최적의 균형점을 찾아주세요.`,
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

    yield {
      type: 'collaboration_complete',
      agentId: 'system',
      content: 'MZ세대 라이프스타일 맞춤 협업 완료',
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, totalRounds: this.collaborationRound, persona: persona.name }
    };
  }

  /**
   * 캠핑 라이프스타일 패턴 협업 플로우 (최민준 페르소나)
   */
  private async *executeCampingLifestyleFlow(pattern: CollaborationPattern): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;
    const persona = pattern.persona!;

    // 1라운드: 니즈 분석가가 캠핑족의 전문적 요구사항 분석
    const campingNeeds = await this.getAgentResponse(
      'needs_analyst',
      `캠핑 전문가 ${persona.name}님의 깊이있는 캠핑 라이프스타일을 분석해보세요. "${persona.personalStory}"와 함께 실제 고민사항들: ${persona.realConcerns.join(', ')}을 바탕으로 진정한 캠핑카의 조건들을 도출해주세요.`,
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
      `캠핑 전문가 ${persona.name}님을 위한 완벽한 캠핑카를 최종 정리해주세요. 니즈 분석: "${campingNeeds}" 데이터 분석: "${campingVehicleAnalysis}" 이를 바탕으로 진정한 자유를 느낄 수 있는 캠핑 라이프의 동반자를 제시해주세요.`,
      'camping_coordination'
    );

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: campingCoordination,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    // 4라운드: AI가 최종 차량 추천 결과 생성
    const vehicleRecommendations = await this.generateVehicleRecommendations(persona, 'camping');

    yield {
      type: 'vehicle_recommendations',
      agentId: 'system',
      content: `${persona.name}님을 위한 최적의 캠핑 차량 추천을 완료했습니다!`,
      timestamp: new Date(),
      metadata: {
        pattern: this.currentPattern,
        vehicles: vehicleRecommendations,
        persona: persona.name
      }
    };

    yield {
      type: 'collaboration_complete',
      agentId: 'system',
      content: '캠핑 라이프스타일 맞춤 협업 완료',
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, totalRounds: this.collaborationRound, persona: persona.name }
    };
  }

  /**
   * 대가족 가장 패턴 협업 플로우 (이경수 페르소나)
   */
  private async *executeLargeFamilyFlow(pattern: CollaborationPattern): AsyncGenerator<DynamicCollaborationEvent, void, unknown> {
    this.collaborationRound++;
    const persona = pattern.persona!;

    // 1라운드: 데이터 분석가가 다인용차 경제성 분석 (가장 우선)
    const largeFamilyAnalysis = await this.getAgentResponse(
      'data_analyst',
      `대가족 가장 ${persona.name}님을 위한 다인용차 경제성 분석을 해주세요. "${persona.personalStory}"라는 상황에서 ${persona.budget.min}-${persona.budget.max}만원 예산으로 7명 대가족이 모두 편안한 차량을 데이터 기반으로 분석해주세요. 9인승 승합차 vs 대형 SUV 비교도 포함해서요.`,
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
      `대가족 가장 ${persona.name}님의 현실적 고민들을 분석해보세요: ${persona.realConcerns.join(', ')}. 7명 대가족의 실질적 필요와 부모님 승하차 편의성, 아이들 안전성을 종합 고려한 니즈 분석을 해주세요.`,
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
      `대가족의 기둥 ${persona.name}님을 위한 최적 선택을 종합해주세요. 다인용차 분석: "${largeFamilyAnalysis}" 대가족 니즈 분석: "${largeFamilyNeeds}" 이를 바탕으로 7명 가족이 10년간 편안하게 탈 수 있는 차량을 추천해주세요.`,
      'large_family_recommendation'
    );

    yield {
      type: 'agent_response',
      agentId: 'concierge',
      content: largeFamilyRecommendation,
      timestamp: new Date(),
      metadata: { round: this.collaborationRound }
    };

    yield {
      type: 'collaboration_complete',
      agentId: 'system',
      content: '대가족 맞춤 협업 완료',
      timestamp: new Date(),
      metadata: { pattern: this.currentPattern, totalRounds: this.collaborationRound, persona: persona.name }
    };
  }

  /**
   * 차량 추천 결과 생성
   */
  private async generateVehicleRecommendations(
    persona: any,
    category: string
  ): Promise<VehicleRecommendation[]> {
    // 실제 차량 데이터에서 상위 3개 선택
    const topVehicles = this.sharedContext?.vehicleData.slice(0, 3) || [];

    const recommendations: VehicleRecommendation[] = [];

    for (let i = 0; i < Math.min(3, topVehicles.length); i++) {
      const vehicle = topVehicles[i];
      const rank = i + 1;

      // AI로 추천 이유, 장단점 생성
      const analysis = await this.generateVehicleAnalysis(vehicle, persona, category, rank);

      recommendations.push({
        ...vehicle,
        rank,
        recommendationReason: analysis.reason,
        pros: analysis.pros,
        cons: analysis.cons,
        suitabilityScore: analysis.score,
        tcoCost: analysis.tcoCost,
        imageUrl: this.generateVehicleImageUrl(vehicle)
      });
    }

    return recommendations;
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
  }> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `${persona.name}님(${category} 라이프스타일)을 위한 차량 분석을 해주세요.

차량 정보: ${vehicle.manufacturer} ${vehicle.model} ${vehicle.modelyear}년 - ${vehicle.price}만원 (${vehicle.distance}km)

페르소나 특징:
- 상황: ${persona.personalStory}
- 고민사항: ${persona.realConcerns.join(', ')}
- 우선순위: ${persona.priorities.join(', ')}
- 예산: ${persona.budget.min}-${persona.budget.max}만원

다음 형식으로 JSON 응답해주세요:
{
  "reason": "이 차량을 추천하는 핵심 이유 (2-3문장)",
  "pros": ["장점1", "장점2", "장점3"],
  "cons": ["고려사항1", "고려사항2"],
  "score": 적합도점수(1-100),
  "tcoCost": 3년총소유비용추정(만원)
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
          tcoCost: vehicle.price * 1.3
        };
      }

      return {
        reason: analysis.reason || '최적의 선택입니다.',
        pros: analysis.pros || ['경제적 선택', '실용적 디자인', '안정적 성능'],
        cons: analysis.cons || ['주행거리 고려', '연식 확인 필요'],
        score: analysis.score || 80 + rank * 5,
        tcoCost: analysis.tcoCost || vehicle.price * 1.3
      };
    } catch (error) {
      console.error('Vehicle analysis error:', error);

      // 기본값 반환
      return {
        reason: `${persona.name}님의 ${category} 라이프스타일에 적합한 선택입니다.`,
        pros: ['경제적 가격', '실용적 크기', '신뢰할 수 있는 브랜드'],
        cons: ['주행거리 확인 필요', '연식 고려사항'],
        score: 85 - rank * 5,
        tcoCost: vehicle.price * 1.3
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
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const agentPrompts = {
      concierge: `당신은 CarFin AI의 컨시어지 매니저입니다. 실제 차량 데이터 ${this.sharedContext?.vehicleData.length || 0}대를 기반으로 고객을 친근하게 도와드립니다.

🎯 UX 최적화 지침:
- 3-4문장 내외로 간결하게 작성
- 친근하고 따뜻한 말투 사용
- 구체적인 차량명과 가격대 포함
- 마크다운(**,##,-) 절대 사용 금지`,

      needs_analyst: `당신은 CarFin AI의 니즈 분석 전문가입니다. 실제 차량 데이터 ${this.sharedContext?.vehicleData.length || 0}대를 분석하여 고객의 진짜 니즈를 찾아드립니다.

🔍 UX 최적화 지침:
- 3-4문장 내외로 간결하게 작성
- 고객 상황에 공감하며 분석
- 핵심 니즈 2-3개만 콕 찍어서 제시
- 마크다운(**,##,-) 절대 사용 금지`,

      data_analyst: `당신은 CarFin AI의 데이터 분석 전문가입니다. PostgreSQL에서 검색한 실제 매물 ${this.sharedContext?.vehicleData.length || 0}대를 분석하여 최적 추천을 드립니다.

📊 UX 최적화 지침:
- 3-4문장 내외로 간결하게 작성
- 구체적인 차량명과 실제 가격 제시
- 간단한 장단점만 핵심적으로
- 마크다운(**,##,-) 절대 사용 금지`
    };

    const systemPrompt = agentPrompts[agentId as keyof typeof agentPrompts] || agentPrompts.concierge;

    // 실제 차량 데이터 요약 제공 (상위 3개)
    const topVehicles = this.sharedContext?.vehicleData.slice(0, 3).map(v =>
      `${v.manufacturer} ${v.model} ${v.modelyear}년 - ${v.price?.toLocaleString()}만원 (${v.distance?.toLocaleString()}km)`
    ).join(', ') || '데이터 로딩 중';

    const fullPrompt = `${systemPrompt}

실제 매물 상위 3개: ${topVehicles}
협업 상황: ${context}
라운드: ${this.collaborationRound}

요청사항: ${prompt}

⚠️ 중요: 반드시 3-4문장 내외로 간결하게 작성하고, 실제 차량 데이터를 활용하여 구체적으로 답변하세요.`;

    const result = await model.generateContent(fullPrompt);
    return await result.response.text();
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
        imageUrl: this.generateVehicleImageUrl(vehicle)
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

      // 우선순위별 점수 조정
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
            if (vehicle.fueltype?.includes('하이브리드') || vehicle.fueltype?.includes('전기')) {
              adjustedScore += 10;
            }
            break;

          case '안전':
            if (['현대', '기아', '제네시스'].includes(vehicle.manufacturer)) {
              adjustedScore += 8;
            }
            break;

          case '가격':
            adjustedScore += Math.max(0, (3000 - vehicle.price) / 100);
            break;
        }
      });

      return { ...vehicle, adjustedScore };
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
}