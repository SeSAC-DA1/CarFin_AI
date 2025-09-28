// app/api/test/valkey/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  console.log('🧪 Valkey 연결 테스트 시작...');

  try {
    // 1. 기본 연결 테스트
    const isConnected = await redis.testConnection();
    console.log(`📡 Valkey 연결 상태: ${isConnected ? '✅ 성공' : '❌ 실패'}`);

    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Valkey 연결 실패',
        details: 'Redis 서버에 연결할 수 없습니다.'
      }, { status: 500 });
    }

    // 2. 기본 SET/GET 테스트
    const testKey = `test:${Date.now()}`;
    const testValue = { message: 'Hello Valkey!', timestamp: new Date() };

    await redis.cacheUserPreference(testKey, testValue);
    console.log(`💾 테스트 데이터 저장: ${testKey}`);

    const retrievedValue = await redis.getUserPreference(testKey);
    console.log(`📥 테스트 데이터 조회: ${JSON.stringify(retrievedValue)}`);

    // 3. 대화 저장/조회 테스트
    const testUserId = 'test_user_' + Date.now();
    const testMessages = [
      { id: '1', agent: 'user', content: '안녕하세요', timestamp: new Date() },
      { id: '2', agent: 'system', content: '안녕하세요! 무엇을 도와드릴까요?', timestamp: new Date() }
    ];

    await redis.saveConversation(testUserId, testMessages);
    console.log(`💬 테스트 대화 저장: ${testUserId}`);

    const retrievedMessages = await redis.getConversation(testUserId);
    console.log(`💭 테스트 대화 조회: ${retrievedMessages?.length}개 메시지`);

    // 4. A2A 세션 테스트
    const testSessionData = {
      sessionId: `test_session_${Date.now()}`,
      userId: testUserId,
      startTime: new Date(),
      lastActivity: new Date(),
      collaborationState: 'initiated',
      currentQuestion: '테스트 질문',
      questionCount: 1,
      discoveredNeeds: [],
      agentStates: {
        concierge: { agentId: 'concierge', status: 'idle', lastUpdate: new Date(), outputs: [], performance: { responseTime: 0, accuracy: 0, userSatisfaction: 0 } },
        needsAnalyst: { agentId: 'needsAnalyst', status: 'idle', lastUpdate: new Date(), outputs: [], performance: { responseTime: 0, accuracy: 0, userSatisfaction: 0 } },
        dataAnalyst: { agentId: 'dataAnalyst', status: 'idle', lastUpdate: new Date(), outputs: [], performance: { responseTime: 0, accuracy: 0, userSatisfaction: 0 } }
      },
      vehicleRecommendations: [],
      satisfactionLevel: 0,
      satisfactionIndicators: [],
      metadata: {}
    };

    await redis.setA2ASession(testSessionData.sessionId, testSessionData);
    console.log(`🤖 테스트 A2A 세션 저장: ${testSessionData.sessionId}`);

    const retrievedSession = await redis.getA2ASession(testSessionData.sessionId);
    console.log(`🔄 테스트 A2A 세션 조회: ${retrievedSession?.sessionId}`);

    // 5. 성능 테스트
    const startTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await redis.cacheUserPreference(`perf_test_${i}`, { iteration: i, data: 'performance test' });
    }
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / 10;
    console.log(`⚡ 성능 테스트: 평균 ${avgTime}ms/operation`);

    // 6. 정리
    await redis.clearConversation(testUserId);
    console.log(`🧹 테스트 데이터 정리 완료`);

    return NextResponse.json({
      success: true,
      message: 'Valkey 테스트 완료! 모든 기능이 정상 작동합니다.',
      results: {
        connection: isConnected,
        basicOperations: retrievedValue?.message === 'Hello Valkey!',
        conversationStorage: retrievedMessages?.length === 2,
        sessionManagement: retrievedSession?.sessionId === testSessionData.sessionId,
        averagePerformance: `${avgTime}ms`,
        performanceGrade: avgTime < 50 ? 'A+ (Excellent)' : avgTime < 100 ? 'A (Good)' : 'B (Acceptable)'
      },
      details: {
        testKey,
        testUserId,
        sessionId: testSessionData.sessionId,
        messagesStored: testMessages.length,
        messagesRetrieved: retrievedMessages?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Valkey 테스트 실패:', error);
    return NextResponse.json({
      success: false,
      error: 'Valkey 테스트 중 오류 발생',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}