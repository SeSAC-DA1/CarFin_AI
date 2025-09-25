import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '@/lib/database/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 예산 파싱 유틸리티
const parseBudget = (budgetText: string) => {
  try {
    if (!budgetText || budgetText === '미제공') return { min: 1000, max: 5000 };

    const numbers = budgetText.match(/\d+/g);
    if (numbers && numbers.length >= 1) {
      const amount = parseInt(numbers[0]);
      return {
        min: Math.max(500, amount - 500),  // 최소 500만원, ±500만원 범위
        max: amount + 500
      };
    }
  } catch (error) {
    console.log('예산 파싱 실패, 기본값 사용');
  }
  return { min: 1000, max: 5000 };
};

// 차량 데이터베이스 검색 함수
const searchVehicles = async (budget: {min: number, max: number}, usage?: string, familyType?: string) => {
  try {
    const vehicleQuery = `
      SELECT
        vehicleid, manufacturer, model, modelyear, price, distance,
        fueltype, cartype, transmission, trim, colorname, location
      FROM vehicles
      WHERE price BETWEEN $1 AND $2
        AND price > 0
        AND distance IS NOT NULL
        AND distance < 150000
        AND modelyear IS NOT NULL
        AND modelyear >= 2015
        AND cartype IN ('준중형', '중형', '소형', 'SUV', '경차')
        AND manufacturer NOT IN ('기타 제조사', '기타')
      ORDER BY
        CASE
          WHEN cartype = '준중형' THEN 1
          WHEN cartype = '소형' THEN 2
          WHEN cartype = 'SUV' THEN 3
          ELSE 4
        END,
        price ASC
      LIMIT 10
    `;

    const result = await query(vehicleQuery, [budget.min, budget.max]);
    return result.rows;

  } catch (error) {
    console.error('차량 검색 오류:', error);
    return [];
  }
};

// README.md 기준 4-Agent 시스템 프롬프트
const AGENT_PROMPTS = {
  guide_teacher: `당신은 차량에 대해 전혀 모르는 사용자를 위한 친절한 가이드 선생님입니다.

핵심 역할:
- 차량 기초 용어를 쉽게 설명 ("준중형이 뭐에요?" 같은 질문에 친절하게 답변)
- 첫차로 적합한 모델 추천 (신뢰성, A/S, 보험료 고려)
- 중고차 구매 시 주의사항 안내
- 차알못도 이해할 수 있는 단계별 학습 가이드 제공

말하는 방식:
- 친근하고 인내심 많은 선생님 스타일
- "괜찮아요! 차 모르는 게 당연해요. 차근차근 설명해드릴게요 😊"
- 중고차 특성을 강조: "중고차는 같은 모델이라도 관리 상태가 다르니까 더 신중해야 해요!"

응답은 한국어로 하되, 100자 이내로 간결하게 작성하세요.`,

  needs_detective: `당신은 사용자의 라이프스타일을 분석해서 본인도 모르는 진짜 니즈를 발굴하는 예리한 탐정입니다.

핵심 역할:
- 사용자 라이프스타일 분석으로 숨은 니즈 발굴
- 골프족, 차박족, 대가족 등 니치 특성 파악
- 협업 필터링 활용: "비슷한 분들이 실제로 선택한 모델들"
- "당신도 몰랐던 진짜 필요한 기능" 제안

협업 필터링 활용 예시:
- "47세 골프 좋아하시는 분들이 실제로 많이 선택한 모델들이에요!"
- "비슷한 분들 데이터를 보니 이런 차들을 선호하시더라고요 🔍"

말하는 방식:
- 예리하고 통찰력 있는 탐정 스타일
- 구체적인 데이터와 근거 제시

응답은 한국어로 하되, 120자 이내로 간결하게 작성하세요.`,

  price_analyzer: `당신은 가격 분석과 중고차 개별 품질 진단을 담당하는 꼼꼼한 회계사입니다.

핵심 역할:
- TCO (총 소유비용) 상세 계산
- 중고차 개별 매물 품질 점수 산출
- 시세 대비 가성비 분석
- 3년 후 잔가 예측으로 실제 부담액 계산
- "숨은 보석" 매물 발굴

중고차 특화 분석 예시:
- "같은 2019년 아반떼라도 이 매물은 특별해요!"
- "무사고에 정기점검도 충실하고, 시세보다 300만원 저렴한 숨은 보석이에요 💎"

말하는 방식:
- 꼼꼼하고 정확한 회계사 스타일
- 구체적인 숫자와 계산 근거 제시

응답은 한국어로 하되, 120자 이내로 간결하게 작성하세요.`,

  success_coach: `당신은 구매 성공률을 최대화하고 실전 지원을 담당하는 열정적인 코치입니다.

핵심 역할:
- 유사 고객 구매 성공 사례 분석
- 구매 확률 기반 최종 추천
- 중고차 현장 체크리스트 제공
- 딜러 협상 전략 및 사후 관리

실전 지원 예시:
- "비슷한 또래 첫차 구매자 847명 중 812명이 이런 매물로 성공했어요!"
- "중고차니까 현장에서 이것들만 체크하시면 완벽해요 📋"

말하는 방식:
- 열정적이고 결과 중심적인 코치 스타일
- 성공률, 만족도 등 구체적 수치 제시

응답은 한국어로 하되, 120자 이내로 간결하게 작성하세요.`
};

export async function POST(request: Request) {
  try {
    const { agentId, prompt, userAnswers } = await request.json();

    console.log('🤖 Single Agent 채팅 API 호출:', { agentId, prompt: prompt.substring(0, 50) });

    // 사용자 예산 파싱 및 차량 검색
    const budget = parseBudget(userAnswers?.budget || '');
    const vehicles = await searchVehicles(budget, userAnswers?.usage, userAnswers?.familyType);

    console.log('🔍 차량 검색 결과:', {
      budget,
      vehicleCount: vehicles.length,
      samples: vehicles.slice(0, 2).map(v => `${v.manufacturer} ${v.model} ${v.price}만원`)
    });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = AGENT_PROMPTS[agentId as keyof typeof AGENT_PROMPTS];
    if (!systemPrompt) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    // 차량 데이터를 포함한 향상된 프롬프트
    const vehicleData = vehicles.length > 0
      ? `\n\n실제 추천 가능한 중고차 매물들:\n${vehicles.map((v, idx) =>
          `${idx + 1}. ${v.manufacturer} ${v.model} (${v.modelyear}년) - ${v.price}만원\n   └ ${v.distance ? Math.round(v.distance/10000) + '만km' : 'N/A'}, ${v.fueltype || 'N/A'}, ${v.cartype || 'N/A'}, ${v.location || 'N/A'}`
        ).join('\n')}`
      : '\n\n현재 예산 범위에서 조회된 매물이 없습니다.';

    const fullPrompt = `${systemPrompt}

사용자 정보:
- 용도: ${userAnswers?.usage || '미제공'}
- 예산: ${userAnswers?.budget || '미제공'} (검색 범위: ${budget.min}-${budget.max}만원)
- 가족구성: ${userAnswers?.familyType || '미제공'}

${vehicleData}

사용자 질문: "${prompt}"

위 역할과 실제 매물 정보를 바탕으로 구체적이고 전문가다운 답변을 해주세요. 구체적인 차량을 추천할 때는 위의 실제 매물 정보를 활용하세요.`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const aiResponse = response.text();

    console.log('✅ Agent', agentId, '응답 생성 완료 (차량 데이터 포함)');

    return NextResponse.json({
      success: true,
      agentId,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Single Agent 채팅 API 오류:', error);

    // Fallback 응답
    const fallbackResponses = {
      guide_teacher: '차에 대해 걱정하지 마세요! 첫차는 신중하게 선택하는 게 중요해요. 저희가 단계별로 도와드릴게요 😊',
      needs_detective: '라이프스타일을 분석해보니 실용적인 차량이 필요하시겠네요! 비슷한 분들이 선택한 모델들을 추천해드릴게요 🔍',
      price_analyzer: '예산 범위 내에서 가성비 좋은 중고차를 찾아드릴게요! 같은 모델이라도 매물마다 품질이 다르니 꼼꼼히 분석할게요 💰',
      success_coach: '비슷한 조건의 고객들 성공 사례를 분석해보니 96% 이상 만족하는 패턴이 있어요! 성공 확률 높은 선택 도와드릴게요 🏆'
    };

    const agentId = request.url?.includes('agentId') ? 'guide_teacher' : 'guide_teacher';

    return NextResponse.json({
      success: false,
      agentId,
      response: fallbackResponses[agentId as keyof typeof fallbackResponses] || '잠시 후 다시 시도해주세요.',
      error: 'AI 응답 생성 실패',
      timestamp: new Date().toISOString()
    });
  }
}