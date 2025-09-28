// app/api/conversation/get/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId가 필요합니다.' },
        { status: 400 }
      );
    }

    const messages = await redis.getConversation(userId);

    return NextResponse.json(messages || []);

  } catch (error) {
    console.error('대화 조회 중 오류:', error);
    return NextResponse.json(
      { error: '대화 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}