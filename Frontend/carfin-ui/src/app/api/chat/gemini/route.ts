// Gemini AI Chat API Route for CarFin AI Consultant
import { NextRequest, NextResponse } from 'next/server';

interface ChatRequest {
  message: string;
  context: {
    userData: any;
    analysisResults: any;
    conversationHistory: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
  };
  assistantType: 'car_consultant';
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    console.log('🤖 Gemini AI 상담 요청:', {
      message: body.message.substring(0, 100),
      userData: body.context.userData,
      historyLength: body.context.conversationHistory.length
    });

    // 사용자 컨텍스트 분석
    const userContext = analyzeUserContext(body.context);

    // Gemini AI 응답 생성 (실제 환경에서는 Gemini API 호출)
    const geminiResponse = await generateGeminiResponse(body.message, userContext);

    return NextResponse.json({
      success: true,
      response: geminiResponse,
      metadata: {
        responseTime: new Date().toISOString(),
        contextUsed: userContext.contextSummary
      }
    });

  } catch (error) {
    console.error('❌ Gemini AI API 오류:', error);

    return NextResponse.json(
      {
        error: 'Gemini AI 응답 생성 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// 사용자 컨텍스트 분석
function analyzeUserContext(context: any) {
  const { userData, analysisResults, conversationHistory } = context;

  const contextSummary = {
    // 사용자 프로필
    userProfile: {
      usage: userData.usage || '일반용',
      budget: userData.budget || '예산 미정',
      priority: userData.priority || '종합 고려',
      carExperience: '초보자' // 타겟층에 맞춘 설정
    },

    // 분석 결과 요약
    recommendations: {
      topVehicle: analysisResults.vehicleAnalysis?.recommendations?.[0],
      matchingScore: analysisResults.vehicleAnalysis?.score,
      financialOption: analysisResults.financeAnalysis?.bestLoan,
      satisfaction: analysisResults.reviewAnalysis?.satisfaction
    },

    // 대화 흐름
    conversationPattern: analyzeConversationPattern(conversationHistory),

    // 컨텍스트 요약
    contextSummary: `${userData.usage} 용도, ${userData.budget} 예산, ${userData.priority} 우선순위를 가진 첫차 구매자`
  };

  return contextSummary;
}

// 대화 패턴 분석
function analyzeConversationPattern(history: any[]) {
  if (!history || history.length === 0) {
    return { stage: 'initial', interests: [], concerns: [] };
  }

  const userMessages = history.filter(msg => msg.role === 'user').map(msg => msg.content);

  // 관심사 추출
  const interests = [];
  const concerns = [];

  userMessages.forEach(message => {
    if (message.includes('차량') || message.includes('옵션')) interests.push('vehicle_options');
    if (message.includes('할인') || message.includes('가격')) interests.push('pricing');
    if (message.includes('보험') || message.includes('유지비')) interests.push('maintenance');
    if (message.includes('금융') || message.includes('할부')) interests.push('financing');

    if (message.includes('걱정') || message.includes('문제')) concerns.push('general_concern');
    if (message.includes('비싸') || message.includes('비용')) concerns.push('cost_concern');
  });

  return {
    stage: history.length > 5 ? 'detailed' : 'exploratory',
    interests: [...new Set(interests)],
    concerns: [...new Set(concerns)]
  };
}

// Gemini AI 응답 생성 (시뮬레이션)
async function generateGeminiResponse(userMessage: string, context: any): Promise<string> {
  // 실제 환경에서는 여기서 Gemini API를 호출
  // const geminiApiResponse = await callGeminiAPI(userMessage, context);

  // 현재는 고도화된 응답 생성 로직으로 시뮬레이션
  const response = generateContextualResponse(userMessage, context);

  return response;
}

// 컨텍스트 기반 응답 생성
function generateContextualResponse(message: string, context: any): string {
  const { userProfile, recommendations, conversationPattern } = context;

  // 키워드 기반 응답 매칭
  const messageKeywords = message.toLowerCase();

  // 차량 관련 질문
  if (messageKeywords.includes('다른') && messageKeywords.includes('차')) {
    return generateVehicleAlternativeResponse(recommendations, userProfile);
  }

  // 가격/할인 관련 질문
  if (messageKeywords.includes('할인') || messageKeywords.includes('가격') || messageKeywords.includes('저렴')) {
    return generatePricingResponse(recommendations, userProfile);
  }

  // 보험/유지비 관련 질문
  if (messageKeywords.includes('보험') || messageKeywords.includes('유지비') || messageKeywords.includes('비용')) {
    return generateMaintenanceResponse(recommendations, userProfile);
  }

  // 금융 관련 질문
  if (messageKeywords.includes('금융') || messageKeywords.includes('할부') || messageKeywords.includes('대출')) {
    return generateFinanceResponse(recommendations, userProfile);
  }

  // 시승/구매 관련 질문
  if (messageKeywords.includes('시승') || messageKeywords.includes('구매') || messageKeywords.includes('딜러')) {
    return generatePurchaseProcessResponse(recommendations, userProfile);
  }

  // 일반적인 질문에 대한 개인화된 응답
  return generatePersonalizedResponse(message, recommendations, userProfile, conversationPattern);
}

// 차량 대안 추천 응답
function generateVehicleAlternativeResponse(recommendations: any, userProfile: any): string {
  return `다른 좋은 차량 옵션들도 준비되어 있습니다! 😊

**${userProfile.usage} 용도에 적합한 대안들:**

🥈 **2순위: 쏘나타 DN8 2.0 스마트**
- 가격: 3,200만원 (추천차량 대비 +350만원)
- 매칭도: 91%
- 장점: 더 넓은 실내공간, 프리미엄 옵션
- ${userProfile.priority === '안전성' ? '안전성 등급 1등급 획득' : userProfile.priority === '연비' ? '복합연비 14.1km/L' : '세련된 디자인과 고급 인테리어'}

🥉 **3순위: K5 3세대 1.6T 프레스티지**
- 가격: 3,100만원 (추천차량 대비 +250만원)
- 매칭도: 89%
- 장점: 스포티한 디자인, 터보 성능
- 특히 ${userProfile.priority === '디자인' ? '젊고 역동적인 디자인이 돋보임' : '가성비가 뛰어남'}

**🤔 선택 가이드:**
- 예산에 여유가 있다면: 쏘나타 (공간과 편의성 우수)
- 스타일을 중시한다면: K5 (스포티한 감성)
- 가성비를 원한다면: 기존 추천 차량 유지

어떤 차량이 더 관심이 있으신가요?`;
}

// 가격/할인 응답
function generatePricingResponse(recommendations: any, userProfile: any): string {
  return `💰 **현재 적용 가능한 혜택들을 확인해드렸습니다!**

**즉시 적용 가능 혜택:**
✅ 카드사 무이자할부: 최대 36개월
   - 신한/삼성/현대카드 협약 혜택

✅ 보험료 할인: 첫 1년 최대 20% 할인
   - 다이렉트 보험 가입 시

✅ 등록비 지원: 최대 50만원
   - 딜러 협상을 통한 지원

**${userProfile.budget} 예산 기준 추가 혜택:**
🎁 연말 프로모션: 추가 30-50만원 할인
🎁 신차 출시 연계: 중고차 하향 조정 가능성
🎁 대량 구매 업체 연결: 추가 2-3% 할인 가능

**💡 절약 팁:**
- 총 절약 가능 금액: 약 **150-250만원**
- 최적 구매 타이밍: 월말/분기말
- 현금 구매 시 추가 할인 가능

딜러와 직접 연결해서 정확한 견적을 받아보실까요?`;
}

// 유지비 응답
function generateMaintenanceResponse(recommendations: any, userProfile: any): string {
  const topVehicle = recommendations.topVehicle?.name || '추천 차량';

  return `🚗 **${topVehicle} 연간 유지비 상세 분석**

**📊 첫차 구매자 맞춤 가이드:**

**필수 비용 (연간):**
- 🛡️ 자동차보험: 약 85만원
  (신규 가입자 기준, 2년차부터 할인)
- ⛽ 연료비: 약 120만원
  (연 1.5만km, ${userProfile.priority === '연비' ? '하이브리드 고려 시 30% 절약' : '일반 연비 기준'})
- 🔧 정기점검: 약 30만원
  (6개월마다 기본 점검)
- 💳 자동차세: 약 16만원

**선택 비용 (수년간 분할):**
- 🚙 타이어 교체: 4년마다 40-60만원
- 🔋 배터리 교체: 3-4년마다 12-18만원
- 🛠️ 소모품: 연간 15-25만원

**💰 월 평균 유지비: 약 22만원**
(연 270만원 ÷ 12개월)

**🎯 ${userProfile.usage} 용도 특화 팁:**
${userProfile.usage === '출퇴근용' ?
  '- 장거리 출퇴근 시 연료비 절약을 위한 하이브리드 고려\n- 주차비 별도 고려 필요' :
  userProfile.usage === '가족용' ?
  '- 가족 보험 특약 고려\n- 어린이 보호 용품 추가 비용' :
  '- 일반적인 유지비 수준으로 경제적'}

다른 차량과 비교 분석도 해드릴까요?`;
}

// 금융 응답
function generateFinanceResponse(recommendations: any, userProfile: any): string {
  return `💳 **${userProfile.budget} 예산 맞춤 금융 솔루션**

**🏆 최적 추천: KB국민은행 3.2%**
- 월 할부금: 286,000원 (60개월 기준)
- 총 이자비용: 약 890만원
- 중도상환 수수료: 면제
- ${userProfile.carExperience === '초보자' ? '초보 운전자 우대 금리 적용' : '일반 금리'}

**🏦 다른 금융사 비교:**

**신한은행 (3.4%)**
- 월 할부금: 289,000원 (+3,000원)
- 특장점: 카드 연계 혜택, 주유 할인

**우리은행 (3.6%)**
- 월 할부금: 292,000원 (+6,000원)
- 특장점: 스마트뱅킹 연계, 보험료 할인

**💡 첫차 구매자 특별 혜택:**
✅ 신용등급 상관없이 우대금리 적용
✅ 보증인 없이 대출 가능 (소득 확인 시)
✅ 대출 한도: 차량가격의 90%까지
✅ 거치기간: 최대 12개월 설정 가능

**🎯 ${userProfile.budget} 예산 기준 추천:**
${userProfile.budget.includes('150') ?
  '예산 범위 내에서 무리 없는 할부 조건' :
  userProfile.budget.includes('300') ?
  '여유있는 할부로 안정적인 상환 가능' :
  '맞춤형 할부 조건 협의 가능'}

금융 상담을 위해 전문가와 연결해드릴까요?`;
}

// 구매 프로세스 응답
function generatePurchaseProcessResponse(recommendations: any, userProfile: any): string {
  return `🚗 **첫차 구매 완벽 가이드**

**📋 구매 프로세스 (총 소요기간: 1-2주)**

**1단계: 실차 확인 및 시승 (2-3일)**
✅ 차량 상태 점검 (외관, 내부, 엔진)
✅ 시승을 통한 주행감 확인
✅ 차량 이력 조회 (사고/침수 여부)
✅ 정비 기록 확인

**2단계: 금융 및 보험 준비 (3-5일)**
✅ 대출 승인 신청
✅ 보험 견적 비교
✅ 필요 서류 준비 (신분증, 소득증명 등)

**3단계: 계약 및 등록 (3-5일)**
✅ 매매 계약서 작성
✅ 소유권 이전 등록
✅ 번호판 발급
✅ 차량 인도

**🎯 ${userProfile.carExperience} 맞춤 체크리스트:**

**꼭 확인해야 할 것들:**
- 📱 차량 번호로 사고 이력 조회
- 🔧 엔진오일, 브레이크 상태 점검
- 📋 정기 점검 기록부 확인
- 💰 추가 비용 (등록비, 보험료) 예산 확보

**💡 첫차 구매자 꿀팁:**
- 시승 시 다양한 도로 조건에서 테스트
- 딜러 말만 믿지 말고 직접 확인
- 계약서 세부 조건 꼼꼼히 검토
- 인도 전 최종 점검 필수

**🤝 전문가 지원 서비스:**
- 동행 점검 서비스 (옵션)
- 계약서 검토 지원
- 보험 가입 컨설팅

어느 단계부터 도움이 필요하신가요?`;
}

// 개인화된 응답
function generatePersonalizedResponse(message: string, recommendations: any, userProfile: any, conversationPattern: any): string {
  const stage = conversationPattern.stage;
  const topVehicle = recommendations.topVehicle?.name || '추천 차량';

  if (stage === 'initial') {
    return `안녕하세요! ${message}에 대해 답변드리겠습니다. 😊

분석 결과를 바탕으로 보면, **${topVehicle}**이 ${userProfile.usage} 용도와 ${userProfile.priority} 우선순위에 가장 적합합니다.

**현재 상황 요약:**
- 🎯 매칭도: ${recommendations.matchingScore || 94}%
- 💰 금융 조건: ${recommendations.financialOption || 'KB국민은행 3.2%'}
- ⭐ 만족도: ${recommendations.satisfaction || 4.2}/5.0

**🤔 더 궁금하신 점이 있다면:**
- "다른 차량 옵션도 보여주세요"
- "할인 혜택이 있을까요?"
- "보험료는 얼마나 될까요?"
- "시승 예약하고 싶어요"

구체적으로 어떤 부분이 더 궁금하신지 알려주세요!`;
  }

  return `좋은 질문입니다! "${message}"에 대해 답변드리겠습니다.

현재 추천드린 **${topVehicle}**이 ${userProfile.usage} 용도와 ${userProfile.priority} 우선순위를 종합적으로 고려했을 때 최적의 선택입니다.

**🔍 추가로 고려해볼 점:**
- ${userProfile.priority === '연비' ? '연비 성능이 뛰어나 장기적으로 경제적' : ''}
- ${userProfile.priority === '안전성' ? '최신 안전 기술이 적용되어 믿을 만함' : ''}
- ${userProfile.priority === '디자인' ? '세련된 외관과 실용적인 내부 공간' : ''}

**💡 맞춤 제안:**
${conversationPattern.interests.includes('pricing') ? '가격 협상 포인트도 안내해드릴 수 있습니다.' : ''}
${conversationPattern.interests.includes('financing') ? '금융 조건 최적화 방안도 함께 검토해보세요.' : ''}

더 구체적인 정보가 필요하시면 언제든 말씀해주세요!`;
}