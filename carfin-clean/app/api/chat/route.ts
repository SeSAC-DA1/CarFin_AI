import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchVehicles } from '@/lib/database';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ChatRequest {
  question: string;
  context?: string;
}

// 예산 추출 함수
function extractBudget(question: string): { min: number; max: number } {
  const budgetPatterns = [
    /(\d+(?:,\d+)*)\s*만원/g,
    /(\d+(?:,\d+)*)\s*천만원/g,
    /(\d+(?:,\d+)*)\s*억/g,
    /예산.*?(\d+(?:,\d+)*)/g,
    /(\d+(?:,\d+)*)\s*정도/g
  ];

  let budgetAmount = 2500; // 기본값 2500만원

  for (const pattern of budgetPatterns) {
    const matches = question.match(pattern);
    if (matches) {
      const numbers = matches.map(match => {
        const num = match.replace(/[^\d]/g, '');
        return parseInt(num);
      });

      if (numbers.length > 0) {
        budgetAmount = Math.max(...numbers);

        // 천만원, 억 단위 처리
        if (question.includes('천만원')) {
          budgetAmount = budgetAmount * 1000;
        } else if (question.includes('억')) {
          budgetAmount = budgetAmount * 10000;
        }
        break;
      }
    }
  }

  // 범위 설정 (±20%)
  const min = Math.max(budgetAmount * 0.8, 1000);
  const max = budgetAmount * 1.2;

  return { min, max };
}

// A2A (Agent-to-Agent) 멀티에이전트 시스템
class MultiAgentSystem {
  private genAI: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // 컨시어지 매니저 - 첫 번째 에이전트
  async runConciergeManager(question: string, context: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `당신은 CarFin AI의 컨시어지 매니저로서 전체 상담 프로세스를 체계적으로 관리하고, 사용자의 질문을 분석하여 다른 전문가들에게 명확한 지시를 내리는 역할을 합니다.

사용자 질문: "${question}"
상황: ${context === 'real_ai_analysis' ? '초기 상담' : '추가 질문'}

응답 방식:
- 친근한 인사와 함께 상담 과정을 간단히 안내
- 질문에서 파악된 핵심 요구사항을 간략히 요약
- 다음 단계(니즈 분석 → 데이터 분석) 예고

마크다운 기호(**,##,- 등)는 절대 사용하지 말고, 자연스러운 대화체로 5-6문장 내외로 간결하게 답변하세요.`;

    const result = await model.generateContent(prompt);
    return await result.response.text();
  }

  // 니즈 분석 전문가 - 두 번째 에이전트
  async runNeedsAnalyst(question: string, conciergeAnalysis: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `당신은 CarFin AI의 니즈 분석 전문가로서 사용자의 숨은 니즈를 완벽히 발굴하고, 라이프스타일을 분석하여 최적의 차량 조건을 도출하는 역할을 합니다.

원본 사용자 질문: "${question}"
컨시어지 매니저 분석: "${conciergeAnalysis}"

분석 영역:
- 사용자가 명시하지 않은 숨은 니즈 발굴
- 라이프스타일 패턴 분석 (통근, 가족, 취미, 경제상황 등)
- 우선순위 도출 (안전성, 경제성, 편의성, 성능 등)

응답 내용:
- 발굴된 주요 니즈들과 그 근거를 간략히 설명
- 추천하는 차량 타입과 핵심 조건들

마크다운 기호(**,##,- 등)는 절대 사용하지 말고, 자연스러운 대화체로 7-8문장 내외로 답변하세요.`;

    const result = await model.generateContent(prompt);
    return await result.response.text();
  }

  // 데이터 분석 전문가 - 세 번째 에이전트
  async runDataAnalyst(question: string, conciergeAnalysis: string, needsAnalysis: string, vehicleData: any[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `당신은 CarFin AI의 데이터 분석 전문가로서 실제 차량 매물 데이터를 분석하여 구체적인 추천과 TCO(총소유비용) 분석을 제공하는 역할을 합니다.

원본 사용자 질문: "${question}"
컨시어지 매니저 분석: "${conciergeAnalysis}"
니즈 분석 전문가 분석: "${needsAnalysis}"

실제 차량 데이터 (총 ${vehicleData.length}대):
${vehicleData.map((v, i) => `${i+1}. ${v.manufacturer} ${v.model} ${v.modelyear}년 - ${v.price?.toLocaleString()}만원 (${v.distance?.toLocaleString()}km) ${v.location} [연료: ${v.fueltype}]`).join('\n')}

분석 영역:
- 위 실제 매물 중에서 최적 추천 차량 선별
- TCO 분석 (구매가격 + 유지비 + 감가상각 + 보험료 등)
- 각 추천 차량의 장단점 비교 분석
- 구매 후 예상되는 실제 비용과 만족도 예측

응답 내용:
- 추천 차량 2-3대와 구체적 선정 이유
- 각 차량의 예상 TCO와 경제성 분석을 간단히
- 실용적인 구매 조언

마크다운 기호(**,##,- 등)는 절대 사용하지 말고, 자연스러운 대화체로 8-10문장 내외로 답변하세요.`;

    const result = await model.generateContent(prompt);
    return await result.response.text();
  }

  // A2A 협업 실행 - 3명 에이전트 순차 협업
  async executeA2ACollaboration(question: string, context: string, vehicleData: any[]): Promise<any> {
    console.log('🚀 A2A 멀티에이전트 협업 시작');

    // 1단계: 컨시어지 매니저 분석
    console.log('1️⃣ 컨시어지 매니저 분석 중...');
    const conciergeAnalysis = await this.runConciergeManager(question, context);

    // 2단계: 니즈 분석 전문가 분석 (컨시어지 결과 활용)
    console.log('2️⃣ 니즈 분석 전문가 분석 중...');
    const needsAnalysis = await this.runNeedsAnalyst(question, conciergeAnalysis);

    // 3단계: 데이터 분석 전문가 분석 (이전 결과들 활용)
    console.log('3️⃣ 데이터 분석 전문가 분석 중...');
    const dataAnalysis = await this.runDataAnalyst(question, conciergeAnalysis, needsAnalysis, vehicleData);

    return {
      conciergeAnalysis,
      needsAnalysis,
      dataAnalysis,
      collaborationComplete: true
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { question, context }: ChatRequest = await request.json();

    if (!question) {
      return NextResponse.json({
        success: false,
        error: 'Question is required'
      }, { status: 400 });
    }

    console.log(`🚀 Real A2A Analysis Started: "${question}" [${context}]`);

    // 실제 차량 데이터 검색
    const budget = extractBudget(question);
    const vehicles = await searchVehicles(budget);

    console.log(`💰 Budget: ${budget.min}-${budget.max}만원`);
    console.log(`🚗 Found ${vehicles.length} real vehicles from PostgreSQL`);

    // A2A 멀티에이전트 시스템 초기화
    const multiAgentSystem = new MultiAgentSystem(process.env.GEMINI_API_KEY!);

    // 실제 3-Agent 협업 실행 (Mock 없음!)
    const collaboration = await multiAgentSystem.executeA2ACollaboration(question, context || 'real_ai_analysis', vehicles);

    console.log('✅ A2A 협업 완료');

    // 첫 번째 응답으로는 컨시어지 매니저 결과 반환
    // TODO: 나중에 WebSocket으로 각 에이전트 결과를 실시간 스트리밍
    return NextResponse.json({
      success: true,
      response: collaboration.conciergeAnalysis, // 첫 응답은 컨시어지 매니저
      agentType: 'concierge',
      metadata: {
        budget: budget,
        vehiclesFound: vehicles.length,
        model: 'gemini-2.5-flash',
        collaborationId: `collab-${Date.now()}`,
        timestamp: new Date().toISOString(),
        a2aEnabled: true,
        mockDataUsed: false, // 중요: Mock 데이터 사용 안함
        // 나머지 에이전트 결과들 (나중에 WebSocket으로 스트리밍 예정)
        pendingAgents: {
          needsAnalysis: collaboration.needsAnalysis,
          dataAnalysis: collaboration.dataAnalysis
        }
      }
    });

  } catch (error) {
    console.error('🚨 Real AI Analysis Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Real AI analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      mockDataUsed: false
    }, { status: 500 });
  }
}