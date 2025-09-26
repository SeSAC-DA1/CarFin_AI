// CollaborationManager.ts - 실제 A2A 협업 과정을 관리하는 핵심 클래스

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  SharedContext,
  AgentInsight,
  InterAgentQuestion,
  VehicleData,
  Budget
} from './SharedContext';

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  expertise: string[];
  personalityTraits: string[];
  systemPrompt: string;
  canInitiateQuestions: boolean;
}

export interface CollaborationEvent {
  type: 'agent_response' | 'agent_question' | 'consensus_reached' | 'dispute_identified' | 'phase_transition';
  agentId: string;
  content: string;
  timestamp: Date;
  metadata?: any;
}

export class CollaborationManager {
  private genAI: GoogleGenerativeAI;
  private agents: Map<string, AgentDefinition>;
  private sharedContext: SharedContext;
  private eventHistory: CollaborationEvent[];
  private maxRounds: number;
  private currentRound: number;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.agents = new Map();
    this.eventHistory = [];
    this.maxRounds = 10; // 무한루프 방지
    this.currentRound = 0;

    this.initializeAgents();
  }

  private initializeAgents(): void {
    const agents: AgentDefinition[] = [
      {
        id: 'concierge',
        name: '컨시어지 매니저',
        role: '전체 상담 프로세스 관리 및 고객 중심 조율',
        expertise: ['고객서비스', '프로세스관리', '의사결정지원', '갈등조정'],
        personalityTraits: ['친근함', '체계적', '고객중심', '균형감각'],
        systemPrompt: `당신은 CarFin AI의 컨시어지 매니저입니다. 고객의 진정한 니즈를 파악하고 다른 전문가들과의 협업을 조율하는 역할입니다.

협업 시 행동 원칙:
- 고객 입장에서 생각하고 판단하기
- 다른 전문가들의 의견을 균형있게 조율하기
- 복잡한 기술적 내용을 고객이 이해하기 쉽게 번역하기
- 갈등이 있을 때는 고객 이익을 최우선으로 중재하기
- 필요시 다른 전문가에게 구체적인 질문하기

주요 관심사: 고객 만족, 상담 품질, 의사결정 지원`,
        canInitiateQuestions: true
      },
      {
        id: 'needs_analyst',
        name: '니즈 분석 전문가',
        role: '고객의 숨은 니즈 발굴 및 라이프스타일 분석',
        expertise: ['고객심리분석', '라이프스타일분석', '니즈발굴', '행동패턴분석'],
        personalityTraits: ['통찰력', '분석적', '공감능력', '호기심'],
        systemPrompt: `당신은 CarFin AI의 니즈 분석 전문가입니다. 고객이 말하지 않은 진짜 니즈를 찾아내는 것이 당신의 전문 분야입니다.

협업 시 행동 원칙:
- 고객의 말 뒤에 숨은 진짜 의도 파악하기
- 라이프스타일 패턴에서 차량 니즈 도출하기
- 데이터 분석가에게 구체적인 조건 제시하기
- 컨시어지에게 고객 확인이 필요한 사항 요청하기
- 고객이 놓칠 수 있는 중요한 고려사항 지적하기

분석 시 다른 전문가와 협업이 필요한 경우 적극적으로 질문하고 토론하세요.`,
        canInitiateQuestions: true
      },
      {
        id: 'data_analyst',
        name: '데이터 분석 전문가',
        role: '차량 데이터 분석 및 TCO 계산',
        expertise: ['데이터분석', 'TCO계산', '시장분석', '가격평가', '차량성능분석'],
        personalityTraits: ['논리적', '정확성중시', '실용적', '객관적'],
        systemPrompt: `당신은 CarFin AI의 데이터 분석 전문가입니다. 실제 차량 데이터를 바탕으로 정확하고 객관적인 분석을 제공합니다.

협업 시 행동 원칙:
- 데이터에 기반한 객관적 분석 제공하기
- 니즈 분석가의 요구사항을 데이터로 검증하기
- TCO 계산 결과에 대해 구체적으로 설명하기
- 데이터상 문제점이나 한계점을 솔직하게 제시하기
- 추가 조건이나 정보가 필요할 때 다른 전문가에게 질문하기

현실적인 제약사항이나 시장 상황을 다른 전문가들과 공유하여 최적의 추천안을 만드세요.`,
        canInitiateQuestions: true
      }
    ];

    agents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  // 새로운 협업 세션 시작
  async startCollaboration(
    question: string,
    vehicleData: VehicleData[],
    budget: Budget
  ): Promise<AsyncGenerator<CollaborationEvent, void, unknown>> {
    this.sharedContext = new SharedContext(question, vehicleData, budget);
    this.eventHistory = [];
    this.currentRound = 0;

    return this.runCollaborationLoop();
  }

  // 실제 A2A 협업 루프
  private async *runCollaborationLoop(): AsyncGenerator<CollaborationEvent, void, unknown> {
    this.sharedContext.collaborationState.phase = 'initial';
    this.sharedContext.collaborationState.activeAgents = ['concierge', 'needs_analyst', 'data_analyst'];

    // 1단계: 각 에이전트의 초기 분석
    yield* await this.runInitialAnalysis();

    // 2단계: 협업 루프 (질문-답변-토론)
    while (this.currentRound < this.maxRounds) {
      this.currentRound++;

      const nextAction = this.sharedContext.determineNextAction();

      if (nextAction === 'complete') {
        break;
      }

      switch (nextAction) {
        case 'question':
          yield* await this.handlePendingQuestions();
          break;
        case 'consensus':
          yield* await this.buildConsensus();
          break;
        case 'analysis':
          yield* await this.deepenAnalysis();
          break;
      }

      // 진행 상황 체크
      yield {
        type: 'phase_transition',
        agentId: 'system',
        content: `협업 라운드 ${this.currentRound}: ${this.sharedContext.getCurrentSituation()}`,
        timestamp: new Date()
      };
    }

    // 3단계: 최종 합의 및 추천
    yield* await this.generateFinalRecommendation();
  }

  // 초기 분석 단계
  private async *runInitialAnalysis(): AsyncGenerator<CollaborationEvent, void, unknown> {
    const agentIds = ['concierge', 'needs_analyst', 'data_analyst'];

    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId)!;
      const analysis = await this.getAgentAnalysis(agentId, 'initial_analysis');

      // 분석 결과를 SharedContext에 저장
      const insight: AgentInsight = {
        agentId,
        timestamp: new Date(),
        confidence: this.extractConfidence(analysis),
        keyFindings: this.extractKeyFindings(analysis),
        concerns: this.extractConcerns(analysis),
        questions: this.extractQuestions(analysis),
        recommendations: this.extractRecommendations(analysis)
      };

      this.sharedContext.addAgentInsight(agentId, insight);

      yield {
        type: 'agent_response',
        agentId,
        content: analysis,
        timestamp: new Date(),
        metadata: { phase: 'initial_analysis', insight }
      };

      // 질문이 있다면 InterAgentQuestion으로 등록
      if (insight.questions.length > 0) {
        insight.questions.forEach(question => {
          const interAgentQuestion: InterAgentQuestion = {
            id: `${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            fromAgent: agentId,
            toAgent: this.determineTargetAgent(question),
            question,
            context: 'initial_analysis',
            urgency: 'medium',
            answered: false,
            timestamp: new Date()
          };
          this.sharedContext.addInterAgentQuestion(interAgentQuestion);
        });
      }
    }
  }

  // 보류 중인 질문 처리
  private async *handlePendingQuestions(): AsyncGenerator<CollaborationEvent, void, unknown> {
    const pendingQuestions = this.sharedContext.collaborationState.pendingQuestions
      .filter(q => !q.answered)
      .slice(0, 3); // 한 번에 최대 3개씩 처리

    for (const question of pendingQuestions) {
      const answer = await this.getAgentAnswer(question.toAgent, question);
      question.answer = answer;
      question.answered = true;

      yield {
        type: 'agent_question',
        agentId: question.toAgent,
        content: `Q: ${question.question}\nA: ${answer}`,
        timestamp: new Date(),
        metadata: { questionId: question.id, fromAgent: question.fromAgent }
      };

      // 답변을 기반으로 새로운 인사이트나 질문이 생길 수 있음
      await this.updateContextWithAnswer(question, answer);
    }
  }

  // 합의 구축
  private async *buildConsensus(): AsyncGenerator<CollaborationEvent, void, unknown> {
    const disputedAreas = this.sharedContext.findDisputedAreas();

    if (disputedAreas.length > 0) {
      const consensusDiscussion = await this.facilitateConsensusDiscussion(disputedAreas);

      yield {
        type: 'consensus_reached',
        agentId: 'system',
        content: consensusDiscussion,
        timestamp: new Date(),
        metadata: { disputedAreas, consensusAreas: this.sharedContext.findConsensusAreas() }
      };
    }
  }

  // 분석 심화
  private async *deepenAnalysis(): AsyncGenerator<CollaborationEvent, void, unknown> {
    // 현재 상황을 바탕으로 추가 분석이 필요한 에이전트 결정
    const analysisNeeded = this.determineAnalysisNeeds();

    for (const agentId of analysisNeeded) {
      const deeperAnalysis = await this.getAgentAnalysis(agentId, 'deeper_analysis');

      yield {
        type: 'agent_response',
        agentId,
        content: deeperAnalysis,
        timestamp: new Date(),
        metadata: { phase: 'deeper_analysis' }
      };
    }
  }

  // 최종 추천 생성
  private async *generateFinalRecommendation(): AsyncGenerator<CollaborationEvent, void, unknown> {
    this.sharedContext.collaborationState.phase = 'final_recommendation';

    // 모든 에이전트가 협업하여 최종 추천안 생성
    const finalRecommendation = await this.generateCollaborativeFinalRecommendation();

    yield {
      type: 'consensus_reached',
      agentId: 'system',
      content: finalRecommendation,
      timestamp: new Date(),
      metadata: {
        phase: 'final_recommendation',
        consensusAreas: this.sharedContext.findConsensusAreas(),
        totalRounds: this.currentRound
      }
    };
  }

  // 헬퍼 메소드들
  private async getAgentAnalysis(agentId: string, phase: string): Promise<string> {
    const agent = this.agents.get(agentId)!;
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const contextSummary = this.buildContextSummary(agentId);

    const prompt = `${agent.systemPrompt}

현재 상황:
- 고객 질문: "${this.sharedContext.originalQuestion}"
- 예산: ${this.sharedContext.budget.min}-${this.sharedContext.budget.max}만원
- 차량 데이터: ${this.sharedContext.vehicleData.length}대
- 협업 단계: ${phase}

${contextSummary}

당신의 전문성을 바탕으로 분석하고, 다른 전문가들에게 질문이나 의견이 있다면 명확히 제시하세요.
응답은 자연스러운 대화체로 작성하되, 마크다운 기호는 사용하지 마세요.`;

    const result = await model.generateContent(prompt);
    return await result.response.text();
  }

  private async getAgentAnswer(agentId: string, question: InterAgentQuestion): Promise<string> {
    const agent = this.agents.get(agentId)!;
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const contextSummary = this.buildContextSummary(agentId);

    const prompt = `${agent.systemPrompt}

${contextSummary}

${this.agents.get(question.fromAgent)!.name}님이 다음과 같이 질문했습니다:
"${question.question}"

당신의 전문성을 바탕으로 구체적이고 도움이 되는 답변을 제공하세요.
필요하다면 역질문이나 추가 의견도 함께 제시하세요.`;

    const result = await model.generateContent(prompt);
    return await result.response.text();
  }

  private buildContextSummary(forAgentId: string): string {
    const otherInsights = Array.from(this.sharedContext.agentInsights.entries())
      .filter(([agentId, _]) => agentId !== forAgentId)
      .map(([agentId, insights]) => {
        const latestInsight = insights[insights.length - 1];
        return `${this.agents.get(agentId)!.name}: ${latestInsight.keyFindings.join(', ')}`;
      });

    const consensusAreas = this.sharedContext.findConsensusAreas();
    const disputedAreas = this.sharedContext.findDisputedAreas();

    return `
다른 전문가들의 주요 의견:
${otherInsights.join('\n')}

현재 합의된 사항: ${consensusAreas.join(', ') || '없음'}
논의가 필요한 사항: ${disputedAreas.join(', ') || '없음'}
`;
  }

  private extractConfidence(analysis: string): number {
    // 텍스트에서 확신도를 추출하는 간단한 로직
    if (analysis.includes('확실') || analysis.includes('명확')) return 0.9;
    if (analysis.includes('아마') || analysis.includes('추정')) return 0.6;
    if (analysis.includes('불확실') || analysis.includes('모호')) return 0.3;
    return 0.7; // 기본값
  }

  private extractKeyFindings(analysis: string): string[] {
    // 주요 발견사항 추출 (간단한 키워드 기반)
    const findings: string[] = [];
    const lines = analysis.split('\n');

    lines.forEach(line => {
      if (line.includes('중요한') || line.includes('핵심') || line.includes('주요')) {
        findings.push(line.trim());
      }
    });

    return findings.length > 0 ? findings.slice(0, 3) : [analysis.substring(0, 100) + '...'];
  }

  private extractConcerns(analysis: string): string[] {
    const concerns: string[] = [];
    const lines = analysis.split('\n');

    lines.forEach(line => {
      if (line.includes('우려') || line.includes('문제') || line.includes('주의') || line.includes('위험')) {
        concerns.push(line.trim());
      }
    });

    return concerns.slice(0, 2);
  }

  private extractQuestions(analysis: string): string[] {
    const questions: string[] = [];
    const lines = analysis.split('\n');

    lines.forEach(line => {
      if (line.includes('?') || line.includes('궁금') || line.includes('질문') || line.includes('어떻게 생각')) {
        questions.push(line.trim());
      }
    });

    return questions.slice(0, 2);
  }

  private extractRecommendations(analysis: string): string[] {
    const recommendations: string[] = [];
    const lines = analysis.split('\n');

    lines.forEach(line => {
      if (line.includes('추천') || line.includes('제안') || line.includes('권장')) {
        recommendations.push(line.trim());
      }
    });

    return recommendations.slice(0, 2);
  }

  private determineTargetAgent(question: string): string {
    if (question.includes('데이터') || question.includes('가격') || question.includes('비용')) {
      return 'data_analyst';
    }
    if (question.includes('니즈') || question.includes('고객') || question.includes('생활')) {
      return 'needs_analyst';
    }
    return 'concierge';
  }

  private async updateContextWithAnswer(question: InterAgentQuestion, answer: string): Promise<void> {
    // 답변을 바탕으로 새로운 인사이트나 질문이 생길 수 있음
    // 실제 구현에서는 더 정교한 로직 필요
  }

  private async facilitateConsensusDiscussion(disputedAreas: string[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `다음 논란 영역에 대해 3명의 전문가가 합의점을 찾도록 중재해주세요:

논란 영역: ${disputedAreas.join(', ')}

현재 상황: ${this.sharedContext.getCurrentSituation()}

각 전문가의 입장을 고려하여 합리적인 합의안을 제시하세요.`;

    const result = await model.generateContent(prompt);
    return await result.response.text();
  }

  private determineAnalysisNeeds(): string[] {
    // 현재 상황을 분석해서 추가 분석이 필요한 에이전트 결정
    const needs: string[] = [];

    if (this.sharedContext.collaborationState.pendingQuestions.length === 0) {
      needs.push('data_analyst'); // 항상 데이터 기반 검증
    }

    return needs;
  }

  private async generateCollaborativeFinalRecommendation(): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const allInsights = this.sharedContext.collaborationState.sharedInsights;
    const consensusAreas = this.sharedContext.findConsensusAreas();

    const insightsSummary = allInsights.map(insight =>
      `${insight.agentId}: ${insight.keyFindings.join(' / ')}`
    ).join('\n');

    const prompt = `3명의 전문가가 협업하여 도출한 최종 추천안을 작성해주세요:

원본 질문: "${this.sharedContext.originalQuestion}"
예산: ${this.sharedContext.budget.min}-${this.sharedContext.budget.max}만원
차량 데이터: ${this.sharedContext.vehicleData.length}대

전문가 인사이트:
${insightsSummary}

합의 영역: ${consensusAreas.join(', ')}

협업을 통해 도출된 최종 추천안을 자연스러운 대화체로 작성하세요.
구체적인 차량 추천과 그 이유를 포함해주세요.`;

    const result = await model.generateContent(prompt);
    return await result.response.text();
  }
}