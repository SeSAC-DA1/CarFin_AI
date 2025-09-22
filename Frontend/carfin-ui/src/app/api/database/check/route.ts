// RDS 데이터베이스 상태 확인 API
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 백엔드 MCP 서버에 데이터 품질 체크 요청
    const response = await fetch('http://localhost:8000/database/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query_type: 'data_quality_check',
        parameters: [],
        use_cache: false
      })
    });

    if (!response.ok) {
      throw new Error('Backend MCP server connection failed');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      database_status: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 데이터베이스 상태 확인 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '데이터베이스 상태 확인 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}