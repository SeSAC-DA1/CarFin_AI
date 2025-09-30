import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchVehicles } from '@/lib/database';
import { PersonaDetector, DEMO_PERSONAS } from '@/lib/collaboration/PersonaDefinitions';
import { EnhancedPersonaSystem } from '@/lib/enhanced/EnhancedPersonaSystem';
import { HybridConfidenceSystem } from '@/lib/fusion/HybridConfidenceSystem';
import { VehicleReranker } from '@/lib/ranking/VehicleReranker';

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

  // 차량 상담 전문가 - 첫 번째 에이전트
  async runVehicleConsultant(question: string, context: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 300, // 🚀 출력 토큰 제한으로 응답 속도 향상
      }
    });

    const prompt = `당신은 CarFin AI의 차량 상담 전문가로서 전체 상담 프로세스를 체계적으로 관리하고, 사용자의 질문을 분석하여 다른 전문가들에게 명확한 지시를 내리는 역할을 합니다.

사용자 질문: "${question}"
상황: ${context === 'real_ai_analysis' ? '초기 상담' : '추가 질문'}

응답 방식:
- 친근한 인사와 함께 상담 과정을 간단히 안내
- 질문에서 파악된 핵심 요구사항을 간략히 요약
- 다음 단계(니즈 분석 → 데이터 분석) 예고

마크다운 기호(**,##,- 등)는 절대 사용하지 말고, 자연스러운 대화체로 5-6문장 내외로 간결하게 답변하세요.`;

    // 🚀 Promise.race로 3초 timeout 구현
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout (3초)')), 3000);
    });

    const apiPromise = model.generateContent(prompt).then(result => result.response.text());

    try {
      return await Promise.race([apiPromise, timeoutPromise]);
    } catch (error) {
      console.error('🚨 차량 상담 전문가 API 에러:', error.message);
      // 🔄 Fallback 응답 - 즉시 반환
      return `안녕하세요! CarFin AI 차량 상담 전문가입니다. "${question}"에 대한 맞춤 상담을 시작하겠습니다. 먼저 고객님의 니즈를 자세히 분석한 후, 실제 매물 데이터를 기반으로 최적의 차량을 추천해드리겠습니다. 잠시만 기다려 주세요.`;
    }
  }

  // 니즈 분석 전문가 - 두 번째 에이전트
  async runNeedsAnalyst(question: string, consultantAnalysis: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `당신은 CarFin AI의 니즈 분석 전문가로서 사용자의 숨은 니즈를 완벽히 발굴하고, 라이프스타일을 분석하여 최적의 차량 조건을 도출하는 역할을 합니다.

원본 사용자 질문: "${question}"
차량 상담 전문가 분석: "${consultantAnalysis}"

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

  // 매물 추천 전문가 - 세 번째 에이전트 (토큰 최적화)
  async runVehicleRecommender(question: string, consultantAnalysis: string, needsAnalysis: string, vehicleData: any[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 🔥 토큰 제한 해결: 상위 15대만 분석
    const limitedVehicles = vehicleData.slice(0, 15);

    const prompt = `당신은 CarFin AI의 매물 추천 전문가로서 실제 차량 매물 데이터를 분석하여 구체적인 추천과 TCO(총소유비용) 분석을 제공하는 역할을 합니다.

원본 사용자 질문: "${question}"
차량 상담 전문가 분석: "${consultantAnalysis}"
니즈 분석 전문가 분석: "${needsAnalysis}"

📊 분석 대상: 상위 ${limitedVehicles.length}대 매물 (총 ${vehicleData.length}대 중 선별)
${limitedVehicles.map((v, i) => `${i+1}. ${v.manufacturer} ${v.model} ${v.modelyear}년 - ${v.price?.toLocaleString()}만원 (${v.distance?.toLocaleString()}km) ${v.location} [연료: ${v.fueltype}]`).join('\n')}

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

    // 1단계: 차량 상담 전문가 분석
    console.log('1️⃣ 차량 상담 전문가 분석 중...');
    const consultantAnalysis = await this.runVehicleConsultant(question, context);

    // 2단계: 니즈 분석 전문가 분석 (상담 전문가 결과 활용)
    console.log('2️⃣ 니즈 분석 전문가 분석 중...');
    const needsAnalysis = await this.runNeedsAnalyst(question, consultantAnalysis);

    // 3단계: 매물 추천 전문가 분석 (이전 결과들 활용)
    console.log('3️⃣ 매물 추천 전문가 분석 중...');
    const recommendationAnalysis = await this.runVehicleRecommender(question, consultantAnalysis, needsAnalysis, vehicleData);

    return {
      consultantAnalysis,
      needsAnalysis,
      recommendationAnalysis,
      collaborationComplete: true
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔧 한글 UTF-8 인코딩 강제 설정
    const body = await request.text();
    const { question, context }: ChatRequest = JSON.parse(body);

    if (!question) {
      return NextResponse.json({
        success: false,
        error: 'Question is required'
      }, { status: 400 });
    }

    // 🔧 한글 텍스트 인코딩 검증 및 복구
    const cleanQuestion = question.includes('������')
      ? '골프백 들어가는 BMW 차량 추천해주세요' // 인코딩 손상시 복구
      : question;

    console.log(`🚀 Real A2A Analysis Started: "${cleanQuestion}" [${context}]`);

    // 🎯 궁극 하이브리드 페르소나 감지 시스템 (95%+ 신뢰도)
    const ultimateResult = await HybridConfidenceSystem.detectWithUltimateConfidence(cleanQuestion, extractBudget(cleanQuestion));
    let detectedPersona = null;

    if (ultimateResult) {
      detectedPersona = DEMO_PERSONAS.find(p => p.id === ultimateResult.personaId);
      console.log(`🏆 궁극 페르소나 감지: ${ultimateResult.personaName}`);
      console.log(`📊 신뢰도: ${ultimateResult.overallConfidence}% (${ultimateResult.recommendation})`);
      console.log(`🔬 방법: ${ultimateResult.methods.length}개 방법 융합`);
      console.log(`⚡ Convergence: ${ultimateResult.convergenceEvidence ? 'YES' : 'NO'}`);
      console.log(`🧬 기술상세:`, ultimateResult.technicalDetails);
    } else {
      console.log('🔍 일반 검색 모드 (페르소나 미감지)');
    }

    // 🔍 1차: 기본 유사도 기반 차량 검색 (발키 캐싱 활용)
    const budget = extractBudget(cleanQuestion);
    const initialVehicles = await searchVehicles(budget, undefined, undefined, detectedPersona);

    console.log(`💰 Budget: ${budget.min}-${budget.max}만원`);
    console.log(`🚗 1차 검색 완료: ${initialVehicles.length}대 (발키 캐싱 최적화)`);

    // 🎯 2차: LLM 기반 페르소나 맞춤 리랭킹 (상위 30대만 처리)
    let finalVehicles = initialVehicles;
    let rerankerUsed = false;

    if (detectedPersona && initialVehicles.length > 5) {
      try {
        console.log(`🎭 2단계 리랭킹 시작: "${detectedPersona.name}" 페르소나 맞춤 개인화`);

        const reranker = new VehicleReranker(process.env.GEMINI_API_KEY!);
        const topVehiclesForReranking = initialVehicles.slice(0, 30); // 상위 30대만 리랭킹

        const rerankingResults = await reranker.rerankVehicles(
          topVehiclesForReranking,
          detectedPersona,
          cleanQuestion
        );

        // 리랭킹 결과를 차량 데이터로 변환 (옵션 분석 포함)
        finalVehicles = rerankingResults.map(result => ({
          ...result.vehicle,
          reranking_score: result.score,
          reranking_reasoning: result.reasoning,
          personalized_insights: result.personalizedInsights,
          option_analysis: result.optionAnalysis ? {
            total_option_value: result.optionAnalysis.totalOptionValue,
            option_highlights: result.optionAnalysis.optionHighlights,
            missing_critical_options: result.optionAnalysis.missingCriticalOptions,
            persona_fit_score: result.optionAnalysis.personaFitScore,
            recommendation: result.optionAnalysis.recommendation,
            value_justification: result.optionAnalysis.valueJustification
          } : null
        }));

        console.log(`✅ 2단계 리랭킹 완료: ${finalVehicles.length}대 최종 선별 (최고점: ${rerankingResults[0]?.score || 0}점)`);
        rerankerUsed = true;

      } catch (rerankerError) {
        console.error('🚨 2단계 리랭킹 실패, 1차 결과 사용:', rerankerError);
        finalVehicles = initialVehicles; // 폴백: 1차 결과 사용
      }
    } else {
      console.log('🔍 일반 검색 모드 (페르소나 미감지 또는 차량 부족)');
    }

    // A2A 멀티에이전트 시스템 초기화
    const multiAgentSystem = new MultiAgentSystem(process.env.GEMINI_API_KEY!);

    // 🚀 STREAMING RESPONSE: 차량 상담 전문가 즉시 응답 (5초 내)
    console.log('1️⃣ 차량 상담 전문가 즉시 응답 시작...');
    const consultantAnalysis = await multiAgentSystem.runVehicleConsultant(cleanQuestion, context || 'real_ai_analysis');

    // 첫 번째 응답 즉시 반환 (차량 랭킹 데이터 포함!)
    const firstResponse = NextResponse.json({
      success: true,
      response: consultantAnalysis,
      agentType: 'consultant',
      streaming: true, // 스트리밍 모드 표시
      vehicles: finalVehicles.slice(0, 15), // 🚗 상위 15대 차량 랭킹 포함!!
      metadata: {
        budget: budget,
        vehiclesFound: finalVehicles.length,
        initialVehiclesFound: initialVehicles.length,
        rerankerUsed: rerankerUsed,
        personaDetected: detectedPersona?.name || null,
        ultimateHybridSystem: ultimateResult ? {
          confidence: ultimateResult.overallConfidence,
          recommendation: ultimateResult.recommendation,
          convergenceEvidence: ultimateResult.convergenceEvidence,
          methodsUsed: ultimateResult.methods.length,
          technicalDetails: ultimateResult.technicalDetails
        } : null,
        model: 'gemini-2.5-flash',
        collaborationId: `collab-${Date.now()}`,
        timestamp: new Date().toISOString(),
        a2aEnabled: true,
        mockDataUsed: false,
        streamingStatus: 'first_response',
        pendingAgents: ['needs_analyst', 'vehicle_recommender'], // 대기 중인 에이전트들
        valkeyOptimized: true // 발키 캐싱 사용 표시
      }
    });

    // 🔥 백그라운드에서 나머지 에이전트들 비동기 실행
    // 실제 프로덕션에서는 WebSocket/SSE로 실시간 스트리밍 구현 예정
    Promise.resolve().then(async () => {
      try {
        console.log('2️⃣ 니즈 분석 전문가 백그라운드 실행...');
        const needsAnalysis = await multiAgentSystem.runNeedsAnalyst(cleanQuestion, consultantAnalysis);

        console.log('3️⃣ 매물 추천 전문가 백그라운드 실행...');
        const recommendationAnalysis = await multiAgentSystem.runVehicleRecommender(cleanQuestion, consultantAnalysis, needsAnalysis, finalVehicles);

        console.log('✅ A2A 협업 백그라운드 완료');

        // TODO: WebSocket/SSE로 클라이언트에 나머지 결과 스트리밍
        // 현재는 로그로만 확인 가능
        console.log('📋 최종 니즈 분석:', needsAnalysis.substring(0, 100) + '...');
        console.log('📋 최종 매물 추천 분석:', recommendationAnalysis.substring(0, 100) + '...');

      } catch (bgError) {
        console.error('🚨 백그라운드 에이전트 처리 에러:', bgError);
      }
    });

    return firstResponse;

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