// lib/types/session.ts
export interface A2ASession {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  collaborationState: 'initiated' | 'analyzing' | 'needs_discovered' | 'reranking' | 'completed';
  currentQuestion: string;
  questionCount: number;

  // 발견된 니즈
  discoveredNeeds: DiscoveredNeed[];

  // 3-Agent 상태
  agentStates: {
    concierge: AgentState;
    needsAnalyst: AgentState;
    dataAnalyst: AgentState;
  };

  // 추천 결과
  vehicleRecommendations: VehicleRecommendation[];

  // 사용자 만족도
  satisfactionLevel: number;
  satisfactionIndicators: string[];

  // 세션 메타데이터
  metadata: {
    personaDetected?: string;
    budgetRange?: { min: number; max: number };
    leasePreference?: boolean;
    primaryUseCase?: string;
  };
}

export interface DiscoveredNeed {
  id: string;
  type: 'explicit' | 'implicit' | 'latent';
  description: string;
  priority: number;
  discoveredAt: Date;
  source: 'user_statement' | 'conversation_analysis' | 'pattern_detection';
  confidence: number;
}

export interface AgentState {
  agentId: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  currentTask?: string;
  lastUpdate: Date;
  outputs: AgentOutput[];
  performance: {
    responseTime: number;
    accuracy: number;
    userSatisfaction: number;
  };
}

export interface AgentOutput {
  id: string;
  type: 'analysis' | 'recommendation' | 'insight' | 'question';
  content: any;
  timestamp: Date;
  confidence: number;
}

export interface VehicleRecommendation {
  vehicleId: string;
  rank: number;
  score: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  matchedNeeds: string[];
  timestamp: Date;
}

export interface SessionAnalytics {
  sessionId: string;
  totalQuestions: number;
  averageResponseTime: number;
  needsDiscoveryRate: number;
  satisfactionTrend: number[];
  completionType: 'satisfied' | 'abandoned' | 'timeout';
  sessionDuration: number;
}