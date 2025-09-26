// SharedContext.ts - 에이전트들이 공유하는 협업 데이터 구조

export interface VehicleData {
  manufacturer: string;
  model: string;
  modelyear: number;
  price: number;
  distance: number;
  location: string;
  fueltype: string;
  [key: string]: any;
}

export interface Budget {
  min: number;
  max: number;
  flexible: boolean;
  userConfirmed: boolean;
}

export interface UserNeeds {
  primary: string[];      // "가족용", "출퇴근용", "안전성"
  secondary: string[];    // "연비", "디자인", "브랜드"
  constraints: string[];  // "주차공간 제약", "유지비 중요"
  lifestyle: string;      // 분석된 라이프스타일
  priorities: { [key: string]: number }; // 우선순위 점수
}

export interface AgentInsight {
  agentId: string;
  timestamp: Date;
  confidence: number;     // 0-1 사이의 확신도
  keyFindings: string[];
  concerns: string[];     // 우려사항
  questions: string[];    // 다른 에이전트에게 묻고 싶은 질문
  recommendations: string[];
}

export interface CollaborationState {
  phase: 'initial' | 'needs_analysis' | 'data_analysis' | 'consensus_building' | 'final_recommendation';
  activeAgents: string[];
  pendingQuestions: InterAgentQuestion[];
  sharedInsights: AgentInsight[];
  consensusAreas: string[];
  disputedAreas: string[];
}

export interface InterAgentQuestion {
  id: string;
  fromAgent: string;
  toAgent: string | 'all';
  question: string;
  context: string;
  urgency: 'low' | 'medium' | 'high';
  answered: boolean;
  answer?: string;
  timestamp: Date;
}

export class SharedContext {
  public originalQuestion: string;
  public budget: Budget;
  public vehicleData: VehicleData[];
  public userNeeds: UserNeeds;
  public agentInsights: Map<string, AgentInsight[]>;
  public collaborationState: CollaborationState;
  public conversationHistory: any[];

  constructor(question: string, vehicleData: VehicleData[], budget: Budget) {
    this.originalQuestion = question;
    this.vehicleData = vehicleData;
    this.budget = budget;
    this.userNeeds = {
      primary: [],
      secondary: [],
      constraints: [],
      lifestyle: '',
      priorities: {}
    };
    this.agentInsights = new Map();
    this.collaborationState = {
      phase: 'initial',
      activeAgents: [],
      pendingQuestions: [],
      sharedInsights: [],
      consensusAreas: [],
      disputedAreas: []
    };
    this.conversationHistory = [];
  }

  // 에이전트 인사이트 추가
  addAgentInsight(agentId: string, insight: AgentInsight): void {
    if (!this.agentInsights.has(agentId)) {
      this.agentInsights.set(agentId, []);
    }
    this.agentInsights.get(agentId)!.push(insight);
    this.collaborationState.sharedInsights.push(insight);
  }

  // 에이전트 간 질문 추가
  addInterAgentQuestion(question: InterAgentQuestion): void {
    this.collaborationState.pendingQuestions.push(question);
  }

  // 합의 영역 확인
  findConsensusAreas(): string[] {
    const insights = this.collaborationState.sharedInsights;
    const consensusMap = new Map<string, number>();

    // 모든 인사이트에서 공통 키워드 찾기
    insights.forEach(insight => {
      insight.keyFindings.forEach(finding => {
        const key = finding.toLowerCase();
        consensusMap.set(key, (consensusMap.get(key) || 0) + 1);
      });
    });

    // 2명 이상의 에이전트가 동의하는 사항
    return Array.from(consensusMap.entries())
      .filter(([_, count]) => count >= 2)
      .map(([key, _]) => key);
  }

  // 논란 영역 확인
  findDisputedAreas(): string[] {
    const insights = this.collaborationState.sharedInsights;
    const disputes: string[] = [];

    // 에이전트들이 서로 다른 의견을 가진 영역 찾기
    insights.forEach(insight => {
      insight.concerns.forEach(concern => {
        const conflictExists = insights.some(otherInsight =>
          otherInsight.agentId !== insight.agentId &&
          otherInsight.keyFindings.some(finding =>
            finding.toLowerCase().includes(concern.toLowerCase().split(' ')[0])
          )
        );
        if (conflictExists) {
          disputes.push(concern);
        }
      });
    });

    return [...new Set(disputes)];
  }

  // 현재 상황 요약
  getCurrentSituation(): string {
    const activeAgentCount = this.collaborationState.activeAgents.length;
    const pendingQuestionCount = this.collaborationState.pendingQuestions.filter(q => !q.answered).length;
    const consensusCount = this.findConsensusAreas().length;

    return `Phase: ${this.collaborationState.phase} | Active Agents: ${activeAgentCount} | Pending Questions: ${pendingQuestionCount} | Consensus Areas: ${consensusCount}`;
  }

  // 다음 액션 결정
  determineNextAction(): 'question' | 'consensus' | 'analysis' | 'complete' {
    const pendingQuestions = this.collaborationState.pendingQuestions.filter(q => !q.answered);

    if (pendingQuestions.length > 0) return 'question';
    if (this.collaborationState.disputedAreas.length > 0) return 'consensus';
    if (this.collaborationState.phase !== 'final_recommendation') return 'analysis';

    return 'complete';
  }
}