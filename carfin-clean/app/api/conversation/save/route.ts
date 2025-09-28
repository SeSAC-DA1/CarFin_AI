// app/api/conversation/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { userId, messages } = await request.json();

    if (!userId || !messages) {
      return NextResponse.json(
        { error: 'userId와 messages가 필요합니다.' },
        { status: 400 }
      );
    }

    await redis.saveConversation(userId, messages);

    return NextResponse.json({
      success: true,
      message: '대화가 성공적으로 저장되었습니다.'
    });

  } catch (error) {
    console.error('대화 저장 중 오류:', error);
    return NextResponse.json(
      { error: '대화 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}