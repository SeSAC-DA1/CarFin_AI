// app/api/conversation/clear/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId가 필요합니다.' },
        { status: 400 }
      );
    }

    await redis.clearConversation(userId);

    return NextResponse.json({
      success: true,
      message: '대화 기록이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('대화 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '대화 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}