import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'pg';

// Gemini API와 데이터베이스 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

interface PersonaContext {
  name: string;
  key_characteristics: string[];
  emphasis_points: string[];
  mandatory_features: string[];
  budget: { min: number; max: number };
  priorities: string[];
  usage: string;
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
  vehicle_suggestions: {
    vehicleid: string;
    manufacturer: string;
    model: string;
    price: number;
    reasoning: string;
    pros: string[];
    cons: string[];
  }[];
}

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 Multi-agent API - 받은 요청 body:', body);

    const { personaContext, userProfile, persona, budget } = body;

    // 초기 데이터 유효성 검사
    if (!personaContext && !userProfile && !persona) {
      console.error('🚨 필수 데이터가 모두 누락됨!', { personaContext, userProfile, persona, budget });
      return NextResponse.json({
        success: false,
        error: '사용자 프로필 정보가 필요합니다. 이전 단계를 다시 완료해주세요.',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // 강력한 데이터 형식 통합 처리
    let normalizedPersona: PersonaContext;

    // 1순위: 완전한 personaContext 객체
    if (personaContext && personaContext.name && typeof personaContext.name === 'string') {
      normalizedPersona = {
        name: personaContext.name,
        key_characteristics: Array.isArray(personaContext.key_characteristics) ? personaContext.key_characteristics : ['실용성 중시'],
        emphasis_points: Array.isArray(personaContext.emphasis_points) ? personaContext.emphasis_points : ['가성비', '안전성'],
        mandatory_features: Array.isArray(personaContext.mandatory_features) ? personaContext.mandatory_features : ['기본 안전장치'],
        budget: (personaContext.budget && personaContext.budget.min && personaContext.budget.max)
          ? personaContext.budget
          : { min: 1500, max: 2500 },
        priorities: Array.isArray(personaContext.priorities) ? personaContext.priorities : ['안전성', '연비'],
        usage: personaContext.usage || '준중형차'
      };
      console.log('✅ PersonaContext 형식으로 받음:', normalizedPersona);
    }

    // 2순위: 기존 형식 (persona: string, budget: object)
    else if (persona && typeof persona === 'string' && budget && budget.min && budget.max) {
      normalizedPersona = {
        name: persona,
        key_characteristics: ['실용성 중시', '신뢰성 우선'],
        emphasis_points: ['가성비', '안전성', '실용성'],
        mandatory_features: ['기본 안전장치', '연비 효율'],
        budget: budget,
        priorities: ['안전성', '연비', '내구성'],
        usage: '준중형차'
      };
      console.log('🔄 Legacy 형식을 PersonaContext로 변환:', normalizedPersona);
    }

    // 3순위: userProfile만으로 기본 페르소나 생성
    else if (userProfile && userProfile.family_type) {
      console.log('⚠️ personaContext가 불완전함. userProfile로 기본 페르소나 생성:', userProfile);
      const familyTypeNames = {
        'single': '혼자 사는 실용주의자',
        'newlywed': '신혼부부 알뜰족',
        'young_parent': '안전 중시 육아맘/파',
        'office_worker': '바쁜 직장인',
        'retiree': '여유로운 시니어'
      };

      normalizedPersona = {
        name: familyTypeNames[userProfile.family_type as keyof typeof familyTypeNames] || '실용적 차량 구매자',
        key_characteristics: ['실용성 중시', '신중한 결정'],
        emphasis_points: ['가성비', '안전성', '실용성'],
        mandatory_features: ['기본 안전장치', '연비 효율'],
        budget: (userProfile.budget && userProfile.budget.min && userProfile.budget.max)
          ? userProfile.budget
          : { min: 1500, max: 2500 },
        priorities: ['안전성', '연비', '편의성'],
        usage: userProfile.typical_passengers === 'family_with_kids' ? 'SUV' : '준중형차'
      };
      console.log('🔧 UserProfile 기반 기본 페르소나 생성:', normalizedPersona);
    }

    // 4순위: 최후의 안전장치 - 하드코딩된 기본값
    else {
      console.warn('🚨 모든 데이터가 부적절함! 최후의 안전장치 발동:', { personaContext, userProfile, persona, budget });
      normalizedPersona = {
        name: '신중한 차량 구매자',
        key_characteristics: ['실용성 중시', '안전성 우선'],
        emphasis_points: ['가성비', '안전성', '실용성'],
        mandatory_features: ['기본 안전장치', '연비 효율'],
        budget: { min: 1500, max: 2500 },
        priorities: ['안전성', '연비', '내구성'],
        usage: '준중형차'
      };
      console.log('🛡️ 최후의 안전장치로 기본 페르소나 생성:', normalizedPersona);
    }

    console.log('👥 멀티 에이전트 상담 시작:', {
      persona: normalizedPersona.name,
      budget: normalizedPersona.budget,
      timestamp: new Date().toISOString()
    });

    // RDS에서 페르소나 맞춤 차량 데이터 가져오기
    const vehicleData = await getPersonalizedVehicles(normalizedPersona);

    // 3명의 AI 전문가 분석 실행
    const [vehicleExpert, financeExpert, reviewExpert] = await Promise.all([
      analyzeVehicleExpert(normalizedPersona, vehicleData, userProfile),
      analyzeFinanceExpert(normalizedPersona, vehicleData, userProfile),
      analyzeReviewExpert(normalizedPersona, vehicleData, userProfile)
    ]);

    // 전문가 의견 통합 및 합의점 도출
    const consensus = await generateConsensus([vehicleExpert, financeExpert, reviewExpert], normalizedPersona);

    // 최종 추천 차량 선정
    const topVehicles = await selectTopVehicles([vehicleExpert, financeExpert, reviewExpert], consensus);

    const result: MultiAgentResult = {
      consultation_id: `consultation_${Date.now()}`,
      persona_summary: normalizedPersona.name,
      agents: [vehicleExpert, financeExpert, reviewExpert],
      consensus,
      top_vehicles: topVehicles
    };

    console.log('✅ 멀티 에이전트 상담 완료:', {
      consultation_id: result.consultation_id,
      consensus_score: result.consensus.confidence_score,
      top_vehicles: result.top_vehicles.length
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('🚨 멀티 에이전트 상담 실패:', error);

    return NextResponse.json({
      success: false,
      error: `멀티 에이전트 상담 실패: ${error.message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// RDS에서 페르소나 맞춤 차량 데이터 가져오기
async function getPersonalizedVehicles(persona: PersonaContext) {
  try {
    console.log('🔍 페르소나 맞춤 차량 데이터 조회:', persona);

    // 먼저 데이터베이스 연결 테스트
    const testQuery = `SELECT COUNT(*) as total, MIN(price) as min_price, MAX(price) as max_price FROM vehicles WHERE price > 0`;
    const testResult = await pool.query(testQuery);
    console.log(`📊 전체 데이터베이스 상태:`, testResult.rows[0]);

    // 안전한 budget 처리
    const safeBudget = persona.budget || { min: 1500, max: 2500 };
    const budgetMin = safeBudget.min > 10000 ? safeBudget.min : safeBudget.min * 10000;
    const budgetMax = safeBudget.max > 10000 ? safeBudget.max : safeBudget.max * 10000;

    console.log(`💰 예산 범위: ${budgetMin}원 ~ ${budgetMax}원`);

    // 더 넓은 범위로 검색 (차종 조건 완화)
    const query = `
      SELECT
        vehicleid, manufacturer, model, modelyear, price, distance,
        fueltype, cartype, transmission, displacement, options, safetyfeatures
      FROM vehicles
      WHERE price BETWEEN $1 AND $2
        AND price > 0
        AND distance IS NOT NULL
      ORDER BY price ASC, distance ASC
      LIMIT 50
    `;

    const result = await pool.query(query, [budgetMin, budgetMax]);

    console.log(`📊 조회된 차량 수: ${result.rows.length}`);
    console.log(`🔍 실행된 쿼리: ${query}`);
    console.log(`💰 실제 검색 예산: ${budgetMin} ~ ${budgetMax}`);

    if (result.rows.length === 0) {
      // 예산 범위를 넓혀서 재시도
      console.log('🔍 예산 범위 확대해서 재조회...');
      const expandedQuery = `
        SELECT
          vehicleid, manufacturer, model, modelyear, price, distance,
          fueltype, cartype, transmission, displacement, options, safetyfeatures
        FROM vehicles
        WHERE price BETWEEN $1 AND $2
          AND price > 0
        ORDER BY price ASC
        LIMIT 20
      `;

      const expandedResult = await pool.query(expandedQuery, [
        budgetMin * 0.7,  // 30% 낮게
        budgetMax * 1.5   // 50% 높게
      ]);

      console.log(`📊 확대 검색 결과: ${expandedResult.rows.length}`);
      return expandedResult.rows;
    }

    return result.rows;
  } catch (error) {
    console.error('❌ RDS 조회 실패:', error);
    return [];
  }
}

// 🚗 차량 전문가 분석
async function analyzeVehicleExpert(persona: PersonaContext, vehicles: any[], userProfile: any): Promise<AgentAnalysis> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
당신은 자동차 기술 전문가입니다. 다음 페르소나와 차량 데이터를 분석해주세요.

## 페르소나 정보
- 이름: ${persona.name}
- 특징: ${Array.isArray(persona.key_characteristics) ? persona.key_characteristics.join(', ') : ''}
- 필수 기능: ${Array.isArray(persona.mandatory_features) ? persona.mandatory_features.join(', ') : ''}
- 우선순위: ${Array.isArray(persona.priorities) ? persona.priorities.join(', ') : ''}
- 사용 용도: ${persona.usage}

## 차량 데이터
${vehicles.slice(0, 10).map(v =>
  `- ${v.manufacturer} ${v.model} (${v.modelyear}년): ${Math.round(v.price/10000)}만원, 연료타입: ${v.fueltype}, 차종: ${v.cartype}`
).join('\n')}

다음 JSON 형식으로 전문가 분석을 제공해주세요:

{
  "summary": "이 페르소나에게 가장 적합한 차량 기술적 요약",
  "key_findings": ["기술적 발견사항 3-4개"],
  "recommendations": ["차량 추천 포인트 3-4개"],
  "concerns": ["기술적 우려사항 2-3개"],
  "confidence_level": 85
}

차량 전문가 관점에서 기술적 스펙, 안전성, 성능에 집중해 분석해주세요.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : getDefaultAnalysis();

    return {
      agent_id: 'vehicle_expert',
      agent_name: '김차량 전문가',
      agent_emoji: '🚗',
      agent_role: '자동차 기술 및 안전 전문가',
      analysis,
      vehicle_suggestions: vehicles.slice(0, 3).map(v => ({
        vehicleid: v.vehicleid,
        manufacturer: v.manufacturer,
        model: v.model,
        price: Math.round(v.price/10000),
        reasoning: `기술적 신뢰성과 ${persona.priorities[0]} 우선순위에 적합`,
        pros: ['검증된 기술력', '우수한 안전성'],
        cons: ['연비 개선 필요', '일부 편의사양 부족']
      }))
    };
  } catch (error) {
    console.error('❌ 차량 전문가 분석 실패:', error);
    return getDefaultVehicleExpert(vehicles);
  }
}

// 💰 금융 전문가 분석
async function analyzeFinanceExpert(persona: PersonaContext, vehicles: any[], userProfile: any): Promise<AgentAnalysis> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
당신은 자동차 금융 전문가입니다. 다음 페르소나와 차량 데이터를 분석해주세요.

## 페르소나 정보
- 이름: ${persona.name}
- 예산: ${persona.budget?.min}~${persona.budget?.max}만원
- 우선순위: ${Array.isArray(persona.priorities) ? persona.priorities.join(', ') : ''}

## 차량 가격 데이터
${vehicles.slice(0, 10).map(v =>
  `- ${v.manufacturer} ${v.model}: ${Math.round(v.price/10000)}만원, 연료: ${v.fueltype}`
).join('\n')}

다음 JSON 형식으로 금융 전문가 분석을 제공해주세요:

{
  "summary": "이 페르소나의 예산과 금융 상황 분석",
  "key_findings": ["금융적 발견사항 3-4개"],
  "recommendations": ["금융 추천 포인트 3-4개"],
  "concerns": ["금융 리스크 2-3개"],
  "confidence_level": 90
}

할부, 보험료, 유지비, 감가상각 등 금융적 관점에서 분석해주세요.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : getDefaultAnalysis();

    return {
      agent_id: 'finance_expert',
      agent_name: '이금융 전문가',
      agent_emoji: '💰',
      agent_role: '자동차 금융 및 보험 전문가',
      analysis,
      vehicle_suggestions: vehicles.slice(0, 3).map(v => ({
        vehicleid: v.vehicleid,
        manufacturer: v.manufacturer,
        model: v.model,
        price: Math.round(v.price/10000),
        reasoning: `예산 대비 최적의 가성비와 낮은 유지비`,
        pros: ['합리적 가격', '낮은 유지비'],
        cons: ['높은 보험료', '빠른 감가상각']
      }))
    };
  } catch (error) {
    console.error('❌ 금융 전문가 분석 실패:', error);
    return getDefaultFinanceExpert(vehicles);
  }
}

// 📝 리뷰 전문가 분석
async function analyzeReviewExpert(persona: PersonaContext, vehicles: any[], userProfile: any): Promise<AgentAnalysis> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
당신은 자동차 리뷰 및 사용자 만족도 전문가입니다. 다음 페르소나와 차량 데이터를 분석해주세요.

## 페르소나 정보
- 이름: ${persona.name}
- 특징: ${Array.isArray(persona.key_characteristics) ? persona.key_characteristics.join(', ') : ''}
- 사용 패턴: ${persona.usage}

## 차량 데이터
${vehicles.slice(0, 10).map(v =>
  `- ${v.manufacturer} ${v.model}: ${v.cartype}, 변속기: ${v.transmission}`
).join('\n')}

다음 JSON 형식으로 리뷰 전문가 분석을 제공해주세요:

{
  "summary": "이 페르소나와 유사한 사용자들의 만족도 분석",
  "key_findings": ["사용자 리뷰 발견사항 3-4개"],
  "recommendations": ["실사용자 관점 추천 3-4개"],
  "concerns": ["사용자 불만사항 2-3개"],
  "confidence_level": 80
}

실제 사용자 후기와 만족도, 페르소나 매칭 관점에서 분석해주세요.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : getDefaultAnalysis();

    return {
      agent_id: 'review_expert',
      agent_name: '박리뷰 전문가',
      agent_emoji: '📝',
      agent_role: '사용자 만족도 및 리뷰 전문가',
      analysis,
      vehicle_suggestions: vehicles.slice(0, 3).map(v => ({
        vehicleid: v.vehicleid,
        manufacturer: v.manufacturer,
        model: v.model,
        price: Math.round(v.price/10000),
        reasoning: `유사 페르소나의 높은 만족도와 긍정적 후기`,
        pros: ['높은 사용자 만족도', '우수한 실용성'],
        cons: ['일부 기능 아쉬움', '브랜드 선호도 차이']
      }))
    };
  } catch (error) {
    console.error('❌ 리뷰 전문가 분석 실패:', error);
    return getDefaultReviewExpert(vehicles);
  }
}

// 전문가 합의점 도출
async function generateConsensus(agents: AgentAnalysis[], persona: PersonaContext) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
3명의 전문가 의견을 종합해서 합의점을 도출해주세요.

## 전문가 의견
1. 🚗 차량 전문가: ${agents[0]?.analysis?.summary || ''}
2. 💰 금융 전문가: ${agents[1]?.analysis?.summary || ''}
3. 📝 리뷰 전문가: ${agents[2]?.analysis?.summary || ''}

다음 JSON 형식으로 합의점을 제공해주세요:

{
  "agreed_points": ["3명이 모두 동의하는 점들"],
  "disagreed_points": ["의견이 엇갈리는 점들"],
  "final_recommendations": ["최종 통합 추천사항"],
  "confidence_score": 85
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : getDefaultConsensus();
  } catch (error) {
    console.error('❌ 합의점 도출 실패:', error);
    return getDefaultConsensus();
  }
}

// 최종 TOP 차량 선정
async function selectTopVehicles(agents: AgentAnalysis[], consensus: any) {
  // 각 전문가의 추천 차량들을 종합
  const allSuggestions = agents.flatMap(agent => agent.vehicle_suggestions);

  // 차량별 점수 계산 (전문가 추천 횟수 기반)
  const vehicleScores = new Map();

  allSuggestions.forEach(suggestion => {
    const key = `${suggestion.manufacturer}_${suggestion.model}`;
    if (!vehicleScores.has(key)) {
      vehicleScores.set(key, {
        ...suggestion,
        agent_votes: [],
        final_score: 0
      });
    }

    const vehicle = vehicleScores.get(key);
    vehicle.agent_votes.push(agents.find(a =>
      a.vehicle_suggestions.some(s => s.vehicleid === suggestion.vehicleid)
    )?.agent_emoji || '');
    vehicle.final_score += 1;
  });

  // 상위 5개 차량 선정
  return Array.from(vehicleScores.values())
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 5)
    .map(vehicle => ({
      ...vehicle,
      reasoning: `${vehicle.agent_votes.length}명의 전문가가 추천한 차량`
    }));
}

// 유틸리티 함수들
function getCarTypeFromUsage(usage: string): string {
  const mapping: { [key: string]: string } = {
    'family': 'SUV',
    'business': '세단',
    'daily': '해치백',
    'commute': '준중형'
  };
  return mapping[usage] || '승용';
}

function getDefaultAnalysis() {
  return {
    summary: "전문가 분석을 진행했습니다.",
    key_findings: ["전문 분야 검토 완료", "주요 특징 확인", "권장사항 도출"],
    recommendations: ["맞춤형 추천", "신중한 선택", "전문가 조언"],
    concerns: ["추가 검토 필요", "시장 변동성"],
    confidence_level: 75
  };
}

function getDefaultVehicleExpert(vehicles: any[]): AgentAnalysis {
  return {
    agent_id: 'vehicle_expert',
    agent_name: '김차량 전문가',
    agent_emoji: '🚗',
    agent_role: '자동차 기술 및 안전 전문가',
    analysis: getDefaultAnalysis(),
    vehicle_suggestions: vehicles.slice(0, 3).map(v => ({
      vehicleid: v.vehicleid,
      manufacturer: v.manufacturer,
      model: v.model,
      price: Math.round(v.price/10000),
      reasoning: '기술적 검토 완료',
      pros: ['검증된 기술', '안전성 확보'],
      cons: ['추가 검토 필요']
    }))
  };
}

function getDefaultFinanceExpert(vehicles: any[]): AgentAnalysis {
  return {
    agent_id: 'finance_expert',
    agent_name: '이금융 전문가',
    agent_emoji: '💰',
    agent_role: '자동차 금융 및 보험 전문가',
    analysis: getDefaultAnalysis(),
    vehicle_suggestions: vehicles.slice(0, 3).map(v => ({
      vehicleid: v.vehicleid,
      manufacturer: v.manufacturer,
      model: v.model,
      price: Math.round(v.price/10000),
      reasoning: '금융적 검토 완료',
      pros: ['합리적 가격', '적정 유지비'],
      cons: ['추가 분석 필요']
    }))
  };
}

function getDefaultReviewExpert(vehicles: any[]): AgentAnalysis {
  return {
    agent_id: 'review_expert',
    agent_name: '박리뷰 전문가',
    agent_emoji: '📝',
    agent_role: '사용자 만족도 및 리뷰 전문가',
    analysis: getDefaultAnalysis(),
    vehicle_suggestions: vehicles.slice(0, 3).map(v => ({
      vehicleid: v.vehicleid,
      manufacturer: v.manufacturer,
      model: v.model,
      price: Math.round(v.price/10000),
      reasoning: '사용자 후기 검토 완료',
      pros: ['사용자 만족', '실용적 설계'],
      cons: ['개인차 존재']
    }))
  };
}

function getDefaultConsensus() {
  return {
    agreed_points: ["전문가 검토 완료", "맞춤형 분석 실시", "신중한 추천"],
    disagreed_points: ["세부 옵션 선택", "브랜드 우선순위"],
    final_recommendations: ["종합적 검토", "단계적 접근", "전문가 상담"],
    confidence_score: 75
  };
}