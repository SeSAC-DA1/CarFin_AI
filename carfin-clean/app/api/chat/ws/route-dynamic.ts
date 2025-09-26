import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchVehicles } from '@/lib/database';
import { DynamicCollaborationManager } from '@/lib/collaboration/DynamicCollaborationManager';

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

// WebSocket connection handler with Dynamic Collaboration
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const question = searchParams.get('question');
  const context = searchParams.get('context') || 'real_ai_analysis';

  if (!question) {
    return new Response('Question is required', { status: 400 });
  }

  console.log(`🚀 Dynamic A2A Collaboration Started: "${question}" [${context}]`);

  // Server-Sent Events 설정
  const stream = new ReadableStream({
    start(controller) {
      (async () => {
        try {
          // 실제 차량 데이터 검색
          const budgetRange = extractBudget(question);
          const budget = {
            min: budgetRange.min,
            max: budgetRange.max,
            flexible: true,
            userConfirmed: false
          };
          const vehicles = await searchVehicles(budgetRange);

          console.log(`💰 Budget: ${budget.min}-${budget.max}만원`);
          console.log(`🚗 Found ${vehicles.length} real vehicles from PostgreSQL`);

          // 동적 협업 매니저 초기화
          const collaborationManager = new DynamicCollaborationManager(process.env.GEMINI_API_KEY!);

          // 메타데이터 전송
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'metadata',
              budget: budget,
              vehiclesFound: vehicles.length,
              timestamp: new Date().toISOString(),
              collaborationType: 'dynamic'
            })}\n\n`
          );

          console.log('🎯 동적 A2A 협업 시스템 시작');

          // 동적 협업 실행
          for await (const event of collaborationManager.startDynamicCollaboration(question, vehicles, budget)) {

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
                console.log(`🛑 User intervention needed: ${event.metadata?.interventionType}`);
                break;

              case 'collaboration_complete':
                console.log(`✅ Collaboration complete after ${event.metadata?.totalRounds} rounds`);
                break;

              case 'error':
                console.error(`❌ Collaboration error: ${event.content}`);
                break;
            }

            // 협업 완료 시 종료
            if (event.type === 'collaboration_complete') {
              break;
            }
          }

          console.log('🎉 Dynamic A2A 협업 완료!');

        } catch (error) {
          console.error('🚨 Dynamic Collaboration Error:', error);
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'error',
              agent: 'system',
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
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