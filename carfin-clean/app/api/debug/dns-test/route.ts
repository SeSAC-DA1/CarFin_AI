import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'dns/promises';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DNS 해결 테스트 시작...');

    const hostname = 'carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com';

    // 1. 기본 DNS 조회
    let defaultResult = null;
    try {
      defaultResult = await lookup(hostname);
      console.log('✅ 기본 DNS 성공:', defaultResult);
    } catch (error: any) {
      console.log('❌ 기본 DNS 실패:', error.message);
    }

    // 2. Google DNS 사용 시도
    let googleResult = null;
    try {
      // Google DNS (8.8.8.8)를 사용한 조회 시뮬레이션
      const { spawn } = require('child_process');
      googleResult = '구글 DNS 테스트 필요';
    } catch (error: any) {
      console.log('❌ Google DNS 실패:', error.message);
    }

    // 3. 환경변수 확인
    const envCheck = {
      DB_HOST: process.env.DB_HOST,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    };

    return NextResponse.json({
      success: true,
      hostname,
      defaultDns: defaultResult,
      googleDns: googleResult,
      environment: envCheck,
      recommendations: [
        'Vercel Function Region을 ap-northeast-2로 설정',
        'AWS RDS의 Public Access 확인',
        'Security Group에서 0.0.0.0/0 허용',
        'RDS Endpoint를 다시 확인'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ DNS 테스트 실패:', error.message);

    return NextResponse.json({
      success: false,
      error: 'DNS 테스트 실패',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}