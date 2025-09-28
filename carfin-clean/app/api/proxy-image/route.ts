import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing image URL', { status: 400 });
  }

  // 기본 차량 이미지 생성 함수
  const getPlaceholderImage = () => {
    const svg = `
      <svg width="320" height="240" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="240" fill="#f3f4f6"/>
        <g transform="translate(160,120)">
          <!-- 차량 실루엣 -->
          <path d="M-50,-30 C-55,-35 -45,-35 -40,-30 L40,-30 C45,-35 55,-35 50,-30 L50,20 C50,25 45,30 40,30 L35,30 C30,30 25,25 25,20 L25,10 L-25,10 L-25,20 C-25,25 -30,30 -35,30 L-40,30 C-45,30 -50,25 -50,20 Z" fill="#6b7280"/>
          <!-- 바퀴 -->
          <circle cx="-25" cy="25" r="8" fill="#374151"/>
          <circle cx="25" cy="25" r="8" fill="#374151"/>
          <!-- 창문 -->
          <rect x="-35" y="-25" width="25" height="15" rx="2" fill="#e5e7eb"/>
          <rect x="10" y="-25" width="25" height="15" rx="2" fill="#e5e7eb"/>
        </g>
        <text x="160" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">차량 이미지</text>
      </svg>
    `;
    return Buffer.from(svg);
  };

  try {
    // 다중 엔카 서버 시도
    const imageUrls = [
      imageUrl,
      // 다른 이미지 서버들로 대체 시도
      imageUrl.replace(/img[1-9]\.encar\.com/, 'img.encar.com'),
      imageUrl.replace(/img[1-9]\.encar\.com/, 'pic.encar.com')
    ].filter((url, index, self) => self.indexOf(url) === index); // 중복 제거

    let lastError;

    for (const url of imageUrls) {
      try {
        console.log(`Attempting to fetch: ${url}`);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.encar.com/',
            'Accept': 'image/webp,image/avif,image/*,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(5000), // 5초 타임아웃
        });

        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          const contentType = response.headers.get('content-type') || 'image/jpeg';

          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=3600', // 1시간 캐시
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } catch (error) {
        lastError = error;
        console.log(`Failed to fetch ${url}:`, error.message);
        continue;
      }
    }

    // 모든 시도 실패 시 placeholder 이미지 반환
    console.log('All image URLs failed, returning placeholder');
    const placeholderBuffer = getPlaceholderImage();

    return new NextResponse(placeholderBuffer, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Image proxy error:', error);

    // 에러 발생 시에도 placeholder 반환
    const placeholderBuffer = getPlaceholderImage();

    return new NextResponse(placeholderBuffer, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // 5분 캐시
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}