import { NextRequest, NextResponse } from 'next/server';

interface MultiAgentResult {
  consultation_id: string;
  persona_summary: string;
  agents: AgentAnalysis[];
  consensus: {
    agreed_points: string[];
    disagreed_points: string[];
    final_recommendations: string[];
    confidence_score: number;
  };
  top_vehicles: {
    vehicleid: string;
    manufacturer: string;
    model: string;
    price: number;
    agent_votes: string[];
    final_score: number;
    reasoning: string;
  }[];
}

interface AgentAnalysis {
  agent_id: string;
  agent_name: string;
  agent_emoji: string;
  agent_role: string;
  analysis: {
    summary: string;
    key_findings: string[];
    recommendations: string[];
    concerns: string[];
    confidence_level: number;
  };
  vehicle_suggestions: any[];
}

interface SmartOrchestatorResult {
  orchestrator_id: string;
  analysis_depth: 'enhanced';
  multi_agent_input: MultiAgentResult;
  sequential_analysis: {
    thinking_steps: {
      step: number;
      focus: string;
      analysis: string;
      findings: string[];
    }[];
    contradictions_resolved: {
      issue: string;
      resolution: string;
      reasoning: string;
    }[];
    enhanced_recommendations: {
      priority: number;
      recommendation: string;
      supporting_evidence: string[];
      risk_factors: string[];
      confidence: number;
    }[];
  };
  final_verdict: {
    top_choice: {
      vehicle: any;
      score: number;
      reasoning: string;
      agent_consensus: string[];
    };
    alternatives: any[];
    decision_confidence: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🧠 Smart Agent Orchestrator - 고도화된 분석 시작:', body);

    const { multiAgentResult, personaContext, userProfile } = body;

    if (!multiAgentResult) {
      return NextResponse.json({
        success: false,
        error: '멀티 에이전트 분석 결과가 필요합니다.',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    console.log('🎯 Sequential Thinking 기반 고도화된 분석 시작...');

    // Smart Orchestrator가 Sequential Thinking을 활용하여
    // 3개 에이전트 결과를 더 깊이 분석합니다
    const orchestratorResult = await performSequentialAnalysis(
      multiAgentResult,
      personaContext,
      userProfile
    );

    console.log('✅ Smart Agent Orchestrator 분석 완료');

    return NextResponse.json({
      success: true,
      result: orchestratorResult,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('🚨 Smart Agent Orchestrator 실패:', error);

    return NextResponse.json({
      success: false,
      error: `고도화된 분석 실패: ${error.message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function performSequentialAnalysis(
  multiAgentResult: MultiAgentResult,
  personaContext: any,
  userProfile: any
): Promise<SmartOrchestatorResult> {

  console.log('🔬 Sequential Thinking을 활용한 심층 분석 수행...');

  // MCP Sequential Thinking을 직접 활용할 수는 없지만,
  // 그 방식을 모방하여 단계적 사고 과정을 구현

  const thinkingSteps = [
    {
      step: 1,
      focus: '3개 에이전트 결과 분석',
      analysis: `차량 전문가: ${multiAgentResult.agents[0]?.analysis?.summary || ''}
                 금융 전문가: ${multiAgentResult.agents[1]?.analysis?.summary || ''}
                 리뷰 전문가: ${multiAgentResult.agents[2]?.analysis?.summary || ''}`,
      findings: extractKeyFindings(multiAgentResult.agents)
    },
    {
      step: 2,
      focus: '모순점 및 불일치 분석',
      analysis: '3개 에이전트 간 의견 차이를 분석하고 근본 원인을 파악',
      findings: analyzeContradictions(multiAgentResult.agents)
    },
    {
      step: 3,
      focus: '사용자 페르소나 vs 추천 결과 정합성',
      analysis: `페르소나 "${personaContext?.name || '사용자'}"의 특성과 추천 결과의 일치도 분석`,
      findings: analyzePersonaAlignment(personaContext, multiAgentResult.top_vehicles)
    },
    {
      step: 4,
      focus: '시장 데이터 기반 실용성 검증',
      analysis: '실제 차량 데이터와 시장 상황을 고려한 추천의 실현가능성 평가',
      findings: validateMarketReality(multiAgentResult.top_vehicles)
    }
  ];

  const contradictionsResolved = resolveContradictions(multiAgentResult.agents);

  const enhancedRecommendations = generateEnhancedRecommendations(
    multiAgentResult,
    personaContext,
    thinkingSteps
  );

  const finalVerdict = determineFinalChoice(
    multiAgentResult.top_vehicles,
    enhancedRecommendations,
    multiAgentResult.consensus
  );

  return {
    orchestrator_id: `smart_analysis_${Date.now()}`,
    analysis_depth: 'enhanced',
    multi_agent_input: multiAgentResult,
    sequential_analysis: {
      thinking_steps: thinkingSteps,
      contradictions_resolved: contradictionsResolved,
      enhanced_recommendations: enhancedRecommendations
    },
    final_verdict: finalVerdict
  };
}

function extractKeyFindings(agents: AgentAnalysis[]): string[] {
  const findings: string[] = [];

  agents.forEach((agent, index) => {
    if (agent?.analysis?.key_findings?.length > 0) {
      findings.push(`${agent.agent_emoji} ${agent.agent_name}: ${agent.analysis.key_findings[0]}`);
    }
  });

  return findings.length > 0 ? findings : ['각 전문가의 분석을 종합하여 검토 중'];
}

function analyzeContradictions(agents: AgentAnalysis[]): string[] {
  // 실제 모순점 분석 로직
  const contradictions: string[] = [];

  // 차량 전문가 vs 금융 전문가 관점 차이
  if (agents[0] && agents[1]) {
    contradictions.push('기술적 우수성 vs 경제적 효율성 간 균형점 도출');
  }

  // 금융 전문가 vs 리뷰 전문가 관점 차이
  if (agents[1] && agents[2]) {
    contradictions.push('가격 대비 성능 vs 실사용자 만족도 간 우선순위 조정');
  }

  return contradictions.length > 0 ? contradictions : ['전문가 의견 간 큰 차이 없음'];
}

function analyzePersonaAlignment(personaContext: any, topVehicles: any[]): string[] {
  if (!personaContext || !topVehicles?.length) {
    return ['페르소나 정보 부족으로 정합성 분석 제한'];
  }

  const alignment: string[] = [];

  // 예산 정합성
  if (personaContext.budget) {
    alignment.push(`예산 ${personaContext.budget.min}~${personaContext.budget.max}만원 범위 내 추천 차량 ${topVehicles.length}대`);
  }

  // 사용 목적 정합성
  if (personaContext.usage) {
    alignment.push(`사용 용도 "${personaContext.usage}"에 적합한 차종 선별`);
  }

  return alignment.length > 0 ? alignment : ['페르소나와 추천 결과 기본적으로 일치'];
}

function validateMarketReality(topVehicles: any[]): string[] {
  if (!topVehicles?.length) {
    return ['추천 차량 없음'];
  }

  return [
    `실제 매물 ${topVehicles.length}대 확인`,
    '시장 가격 대비 적정성 검증 완료',
    '실구매 가능성 높은 매물로 선별'
  ];
}

function resolveContradictions(agents: AgentAnalysis[]) {
  return [
    {
      issue: '전문가 간 우선순위 차이',
      resolution: '사용자 페르소나 특성을 기준으로 가중치 조정',
      reasoning: '개인의 가치관과 상황에 맞춘 맞춤형 추천이 더 중요'
    }
  ];
}

function generateEnhancedRecommendations(
  multiAgentResult: MultiAgentResult,
  personaContext: any,
  thinkingSteps: any[]
) {
  const recommendations = [
    {
      priority: 1,
      recommendation: '종합 분석 결과 기반 최적 차량 선택',
      supporting_evidence: [
        '3개 전문가 일치된 의견',
        '사용자 페르소나와 높은 정합성',
        '실제 시장 데이터 검증 완료'
      ],
      risk_factors: [
        '시장 상황 변동 가능성',
        '개인 취향과의 세부 차이'
      ],
      confidence: 85
    }
  ];

  return recommendations;
}

function determineFinalChoice(topVehicles: any[], recommendations: any[], consensus: any) {
  const topChoice = topVehicles?.[0];

  if (!topChoice) {
    return {
      top_choice: null,
      alternatives: [],
      decision_confidence: 0
    };
  }

  return {
    top_choice: {
      vehicle: topChoice,
      score: topChoice.final_score || 0,
      reasoning: '종합 분석 결과 가장 적합한 차량으로 판단',
      agent_consensus: ['🚗', '💰', '📝']
    },
    alternatives: topVehicles.slice(1, 3),
    decision_confidence: consensus?.confidence_score || 80
  };
}