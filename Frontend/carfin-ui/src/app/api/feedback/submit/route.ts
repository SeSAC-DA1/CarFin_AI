import { NextRequest, NextResponse } from 'next/server';

export interface UserFeedback {
  id: string;
  userId: string;
  vehicleId: string;
  feedbackType: 'like' | 'dislike' | 'rating' | 'comment';
  value: number | string;
  timestamp: Date;
  source: 'recommendation' | 'search' | 'browse';
  context?: {
    searchQuery?: string;
    userProfile?: any;
    sessionId?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const feedbackData: UserFeedback = await request.json();

    console.log('📊 사용자 피드백 수집:', {
      feedbackType: feedbackData.feedbackType,
      value: feedbackData.value,
      vehicleId: feedbackData.vehicleId,
      userId: feedbackData.userId,
      timestamp: new Date().toISOString()
    });

    // 백엔드 MCP 서버로 피드백 데이터 전송
    const backendURL = process.env.NEXT_PUBLIC_API_URL || 'https://carfin-mcp-983974250633.asia-northeast1.run.app';

    try {
      const response = await fetch(`${backendURL}/mcp/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          feedback: feedbackData,
          request_type: 'user_feedback',
          timestamp: new Date().toISOString()
        }),
        cache: 'no-store'
      });

      if (response.ok) {
        const mcpResponse = await response.json();
        console.log('✅ 백엔드 피드백 처리 성공:', {
          success: mcpResponse.success,
          processed_at: mcpResponse.timestamp,
          feedback_id: feedbackData.id
        });

        // 실시간 추천 시스템 개선 트리거
        if (feedbackData.feedbackType === 'rating' || feedbackData.feedbackType === 'like' || feedbackData.feedbackType === 'dislike') {
          await triggerModelUpdate(feedbackData);
        }

        return NextResponse.json({
          success: true,
          message: '피드백이 성공적으로 저장되었습니다',
          feedbackId: feedbackData.id,
          timestamp: new Date().toISOString(),
          modelUpdate: feedbackData.feedbackType !== 'comment'
        });
      }
    } catch (error) {
      console.error('❌ 백엔드 피드백 전송 실패:', error);
    }

    // 백엔드 실패 시 로컬 처리
    const localResponse = await processLocalFeedback(feedbackData);
    return NextResponse.json(localResponse);

  } catch (error) {
    console.error('❌ 피드백 처리 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '피드백 처리 중 오류가 발생했습니다',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// NCF 모델 업데이트 트리거
async function triggerModelUpdate(feedback: UserFeedback) {
  try {
    const backendURL = process.env.NEXT_PUBLIC_API_URL || 'https://carfin-mcp-983974250633.asia-northeast1.run.app';

    const modelUpdateData = {
      userId: feedback.userId,
      vehicleId: feedback.vehicleId,
      rating: feedback.feedbackType === 'rating' ? Number(feedback.value) :
              feedback.feedbackType === 'like' ? 5 : 1,
      timestamp: feedback.timestamp,
      feedbackSource: feedback.source
    };

    const response = await fetch(`${backendURL}/mcp/model/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        interaction: modelUpdateData,
        request_type: 'model_update',
        online_learning: true
      })
    });

    if (response.ok) {
      console.log('🧠 NCF 모델 실시간 업데이트 완료');
    }
  } catch (error) {
    console.error('❌ 모델 업데이트 실패:', error);
  }
}

// 로컬 피드백 처리 (백엔드 실패 시 폴백)
async function processLocalFeedback(feedback: UserFeedback) {
  // 메모리 내 피드백 저장 (실제 환경에서는 데이터베이스 사용)
  const processedFeedback = {
    ...feedback,
    processedAt: new Date().toISOString(),
    source: 'local_processing'
  };

  // 피드백 분석 및 인사이트 생성
  const insights = await generateFeedbackInsights(feedback);

  return {
    success: true,
    message: '피드백이 로컬에서 처리되었습니다',
    feedbackId: feedback.id,
    insights,
    timestamp: new Date().toISOString(),
    source: 'local_fallback'
  };
}

// 피드백 인사이트 생성
async function generateFeedbackInsights(feedback: UserFeedback) {
  const insights = {
    feedbackType: feedback.feedbackType,
    sentiment: feedback.feedbackType === 'like' || (feedback.feedbackType === 'rating' && Number(feedback.value) >= 4) ? 'positive' : 'negative',
    actionRequired: false,
    recommendations: [] as string[]
  };

  // 피드백 타입별 인사이트
  switch (feedback.feedbackType) {
    case 'rating':
      const rating = Number(feedback.value);
      if (rating <= 2) {
        insights.actionRequired = true;
        insights.recommendations.push('추천 알고리즘 개선 필요');
        insights.recommendations.push('사용자 프로필 분석 강화');
      } else if (rating >= 4) {
        insights.recommendations.push('유사한 차량 추천 강화');
      }
      break;

    case 'dislike':
      insights.actionRequired = true;
      insights.recommendations.push('해당 차량 타입 가중치 조정');
      insights.recommendations.push('사용자 선호도 재분석');
      break;

    case 'like':
      insights.recommendations.push('유사 특성 차량 우선 추천');
      insights.recommendations.push('사용자 선호 패턴 학습');
      break;

    case 'comment':
      insights.recommendations.push('텍스트 분석을 통한 개선점 도출');
      break;
  }

  return insights;
}