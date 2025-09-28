import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchVehicles } from '@/lib/database';
import { DynamicCollaborationManager } from '@/lib/collaboration/DynamicCollaborationManager';
import { PersonaDetector } from '@/lib/collaboration/PersonaDefinitions';

// 리스 의도 감지 함수
function detectLeaseIntent(question: string): boolean {
  const leaseKeywords = [
    '리스', 'lease', '렌트', '렌탈', '장기렌트', '월납', '월기렌트',
    '리스 계약', '리스 차량', '리스 상품', '월지불', '월결제',
    '리스료', '렌트료', '월기 렌트', '할부', '리스비'
  ];

  const normalizedQuestion = question.toLowerCase().replace(/\s/g, '');

  return leaseKeywords.some(keyword =>
    normalizedQuestion.includes(keyword.toLowerCase().replace(/\s/g, ''))
  );
}

// 예산 추출 함수 (기존 코드 유지)
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

        // 천만원 단위 처리
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

// WebSocket connection handler with Dynamic Collaboration
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const question = searchParams.get('question');
  const context = searchParams.get('context') || 'real_ai_analysis';
  const previousVehiclesParam = searchParams.get('previousVehicles');

  if (!question) {
    return new Response('Question is required', { status: 400 });
  }

  // 이전 추천 차량 데이터 파싱
  let previousVehicles: any[] = [];
  if (previousVehiclesParam) {
    try {
      previousVehicles = JSON.parse(decodeURIComponent(previousVehiclesParam));
      console.log(`🔄 Previous vehicles found: ${previousVehicles.length} vehicles`);
    } catch (error) {
      console.log('⚠️ Failed to parse previous vehicles, proceeding without them');
    }
  }

  console.log(`🤖 Dynamic A2A Collaboration Started: "${question}" [${context}]`);

  // Server-Sent Events 설정
  const stream = new ReadableStream({
    start(controller) {
      (async () => {
        let streamClosed = false;
        try {
          // 실제 차량 데이터 검색
          const budgetRange = extractBudget(question);
          const budget = {
            min: budgetRange.min,
            max: budgetRange.max,
            flexible: true,
            userConfirmed: false
          };

          // 페르소나 감지
          const detectedPersona = PersonaDetector.detectPersona(question, budgetRange);

          // 리스 의도 감지
          const includeLeaseProducts = detectLeaseIntent(question);

          const vehicles = await searchVehicles(budgetRange, question, undefined, detectedPersona, includeLeaseProducts);

          console.log(`💰 Budget: ${budget.min}-${budget.max}만원`);
          console.log(`🚗 Found ${vehicles.length} real vehicles from PostgreSQL`);
          console.log(`👤 Detected Persona: ${detectedPersona ? `${detectedPersona.name} (${detectedPersona.id})` : 'None'}`);
          console.log(`📋 Lease Products: ${includeLeaseProducts ? 'INCLUDED' : 'EXCLUDED (only regular sales)'}`);

          // 동적 협업 매니저 초기화
          const collaborationManager = new DynamicCollaborationManager(process.env.GEMINI_API_KEY!);

          // 메타데이터 전송
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'metadata',
              budget: budget,
              vehiclesFound: vehicles.length,
              detectedPersona: detectedPersona ? {
                id: detectedPersona.id,
                name: detectedPersona.name,
                emoji: detectedPersona.emoji,
                priorities: detectedPersona.priorities
              } : null,
              timestamp: new Date().toISOString(),
              collaborationType: 'dynamic'
            })}\n\n`
          );

          console.log('🚀 동적 A2A 협업 세션 시작');

          // 동적 협업 실행 (페르소나 정보 포함)
          for await (const event of collaborationManager.startDynamicCollaboration(question, vehicles, budget, previousVehicles, detectedPersona)) {

            // 스트림이 이미 닫혔으면 중단
            if (streamClosed) {
              console.log('⚠️ Stream already closed, skipping event');
              break;
            }

            try {
              // 협업 이벤트를 WebSocket 메시지로 변환
              const message = {
                type: event.type,
                agent: event.agentId,
                content: event.content,
                timestamp: event.timestamp.toISOString(),
                metadata: event.metadata
              };

              console.log(`📡 Event: ${event.type} from ${event.agentId}`);

              controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);

              // 특별한 이벤트 타입들 처리
              switch (event.type) {
                case 'pattern_detected':
                  console.log(`🎯 Pattern detected: ${event.metadata?.pattern?.type}`);
                  break;

                case 'agent_question':
                  console.log(`❓ Question from ${event.agentId} to ${event.metadata?.targetAgent}`);
                  break;

                case 'agent_answer':
                  console.log(`💬 Answer from ${event.agentId}`);
                  break;

                case 'user_intervention_needed':
                  console.log(`🙋 User intervention needed: ${event.metadata?.interventionType}`);
                  break;

                case 'vehicle_recommendations':
                  console.log(`🚗 Vehicle recommendations sent with ${event.metadata?.vehicles?.length || 0} vehicles`);
                  break;

                case 'collaboration_complete':
                  console.log(`✅ Collaboration complete after ${event.metadata?.totalRounds} rounds`);
                  // 협업 완료 이벤트 전송 후 스트림 종료 준비로 설정
                  streamClosed = true;
                  break;

                case 'error':
                  console.error(`❌ Collaboration error: ${event.content}`);
                  streamClosed = true; // 오류 시에도 스트림 종료
                  break;
              }

              // 협업 완료 시 종료 (이벤트 전송 후)
              if (event.type === 'collaboration_complete') {
                console.log('🏁 Collaboration completed, ending stream');
                break;
              }
            } catch (controllerError) {
              console.error('💥 Controller Error:', controllerError);
              streamClosed = true;
              break;
            }
          }

          // 모든 이벤트 처리 완료 후 스트림 종료
          if (!streamClosed) {
            console.log('🎉 All events processed, closing stream gracefully');
            streamClosed = true;
          }

          console.log('✨ Dynamic A2A 협업 완료!');

        } catch (error) {
          console.error('💥 Dynamic Collaboration Error:', error);
          streamClosed = true;
          try {
            controller.enqueue(
              `data: ${JSON.stringify({
                type: 'error',
                agent: 'system',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
              })}\n\n`
            );
          } catch (enqueueError) {
            console.error('💥 Error sending error message:', enqueueError);
          }
        } finally {
          try {
            if (!streamClosed) {
              console.log('⚠️ Finally block - closing controller gracefully');
              controller.close();
            } else {
              console.log('✅ Stream already properly closed');
            }
          } catch (closeError) {
            // Controller might already be closed, which is expected
            console.log('ℹ️ Controller already closed (expected):', closeError.message);
          }
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