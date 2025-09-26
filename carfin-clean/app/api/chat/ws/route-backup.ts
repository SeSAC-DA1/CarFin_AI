import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchVehicles } from '@/lib/database';
import { DynamicCollaborationManager } from '@/lib/collaboration/DynamicCollaborationManager';

// 예산 추출 함수 (route.ts에서 복사)
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// A2A 멀티에이전트 시스템 (WebSocket 버전)
class StreamingMultiAgentSystem {
  private genAI: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // 컨시어지 매니저 스트리밍
  async *streamConciergeManager(question: string, context: string) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `당신은 CarFin AI의 컨시어지 매니저로서 전체 상담 프로세스를 체계적으로 관리하고, 사용자의 질문을 분석하여 다른 전문가들에게 명확한 지시를 내리는 역할을 합니다.

사용자 질문: "${question}"
상황: ${context === 'real_ai_analysis' ? '초기 상담' : '추가 질문'}

응답 방식:
- 친근한 인사와 함께 상담 과정을 간단히 안내
- 질문에서 파악된 핵심 요구사항을 간략히 요약
- 다음 단계(니즈 분석 → 데이터 분석) 예고

마크다운 기호(**,##,- 등)는 절대 사용하지 말고, 자연스러운 대화체로 5-6문장 내외로 간결하게 답변하세요.`;

    try {
      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield {
            agent: 'concierge',
            chunk: chunkText,
            complete: false
          };
        }
      }

      yield {
        agent: 'concierge',
        chunk: '',
        complete: true
      };

      const finalResult = await result.response;
      return await finalResult.text();
    } catch (error) {
      console.error('Concierge streaming error:', error);
      throw error;
    }
  }

  // 니즈 분석 전문가 스트리밍
  async *streamNeedsAnalyst(question: string, conciergeAnalysis: string) {
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

    try {
      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield {
            agent: 'needs_analyst',
            chunk: chunkText,
            complete: false
          };
        }
      }

      yield {
        agent: 'needs_analyst',
        chunk: '',
        complete: true
      };

      const finalResult = await result.response;
      return await finalResult.text();
    } catch (error) {
      console.error('Needs analyst streaming error:', error);
      throw error;
    }
  }

  // 데이터 분석 전문가 스트리밍
  async *streamDataAnalyst(question: string, conciergeAnalysis: string, needsAnalysis: string, vehicleData: any[]) {
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

    try {
      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield {
            agent: 'data_analyst',
            chunk: chunkText,
            complete: false
          };
        }
      }

      yield {
        agent: 'data_analyst',
        chunk: '',
        complete: true
      };

      const finalResult = await result.response;
      return await finalResult.text();
    } catch (error) {
      console.error('Data analyst streaming error:', error);
      throw error;
    }
  }
}

// WebSocket connection handler
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const question = searchParams.get('question');
  const context = searchParams.get('context') || 'real_ai_analysis';

  if (!question) {
    return new Response('Question is required', { status: 400 });
  }

  console.log(`🚀 WebSocket A2A Analysis Started: "${question}" [${context}]`);

  // Server-Sent Events 설정
  const stream = new ReadableStream({
    start(controller) {
      (async () => {
        try {
          // 실제 차량 데이터 검색
          const budget = extractBudget(question);
          const vehicles = await searchVehicles(budget);

          console.log(`💰 Budget: ${budget.min}-${budget.max}만원`);
          console.log(`🚗 Found ${vehicles.length} real vehicles from PostgreSQL`);

          // A2A 멀티에이전트 시스템 초기화
          const multiAgentSystem = new StreamingMultiAgentSystem(process.env.GEMINI_API_KEY!);

          // 메타데이터 전송
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'metadata',
              budget: budget,
              vehiclesFound: vehicles.length,
              timestamp: new Date().toISOString()
            })}\n\n`
          );

          console.log('🚀 A2A 멀티에이전트 스트리밍 협업 시작');

          // 1단계: 컨시어지 매니저 스트리밍
          console.log('1️⃣ 컨시어지 매니저 스트리밍 중...');
          let conciergeAnalysis = '';
          for await (const chunk of multiAgentSystem.streamConciergeManager(question, context)) {
            if (chunk.chunk) {
              conciergeAnalysis += chunk.chunk;
            }
            controller.enqueue(
              `data: ${JSON.stringify({
                type: 'agent_stream',
                agent: 'concierge',
                chunk: chunk.chunk,
                complete: chunk.complete
              })}\n\n`
            );
          }

          // 2단계: 니즈 분석 전문가 스트리밍
          console.log('2️⃣ 니즈 분석 전문가 스트리밍 중...');
          let needsAnalysis = '';
          for await (const chunk of multiAgentSystem.streamNeedsAnalyst(question, conciergeAnalysis)) {
            if (chunk.chunk) {
              needsAnalysis += chunk.chunk;
            }
            controller.enqueue(
              `data: ${JSON.stringify({
                type: 'agent_stream',
                agent: 'needs_analyst',
                chunk: chunk.chunk,
                complete: chunk.complete
              })}\n\n`
            );
          }

          // 3단계: 데이터 분석 전문가 스트리밍
          console.log('3️⃣ 데이터 분석 전문가 스트리밍 중...');
          for await (const chunk of multiAgentSystem.streamDataAnalyst(question, conciergeAnalysis, needsAnalysis, vehicles)) {
            controller.enqueue(
              `data: ${JSON.stringify({
                type: 'agent_stream',
                agent: 'data_analyst',
                chunk: chunk.chunk,
                complete: chunk.complete
              })}\n\n`
            );
          }

          console.log('✅ A2A 스트리밍 협업 완료');

          // 완료 신호
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'collaboration_complete',
              timestamp: new Date().toISOString()
            })}\n\n`
          );

        } catch (error) {
          console.error('🚨 WebSocket A2A Analysis Error:', error);
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            })}\n\n`
          );
        } finally {
          controller.close();
        }
      })();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}