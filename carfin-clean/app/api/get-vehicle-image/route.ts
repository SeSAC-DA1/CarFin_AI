import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailUrl = searchParams.get('detailUrl');

  if (!detailUrl) {
    return NextResponse.json({ error: 'detailUrl is required' }, { status: 400 });
  }

  try {
    console.log('🔍 Fetching vehicle page:', detailUrl);

    // 엔카 매물 페이지 HTML 가져오기
    const response = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.encar.com/',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.log('❌ Failed to fetch page:', response.status);
      return NextResponse.json({ error: 'Failed to fetch page' }, { status: response.status });
    }

    const html = await response.text();
    console.log('✅ Page fetched, length:', html.length);

    // 이미지 URL 추출을 위한 정규식 패턴들
    const imagePatterns = [
      // 엔카 carpicture 패턴 (가장 우선)
      /https:\/\/img1\.encar\.com\/carpicture[^"'\s]+\.jpg/gi,
      /https:\/\/img2\.encar\.com\/carpicture[^"'\s]+\.jpg/gi,
      /https:\/\/img3\.encar\.com\/carpicture[^"'\s]+\.jpg/gi,
      /https:\/\/img4\.encar\.com\/carpicture[^"'\s]+\.jpg/gi,
      /https:\/\/img\.encar\.com\/carpicture[^"'\s]+\.jpg/gi,
      // 기타 엔카 이미지 패턴
      /https:\/\/img1\.encar\.com\/[^"'\s]+\.jpg/gi,
      /https:\/\/img2\.encar\.com\/[^"'\s]+\.jpg/gi,
      /https:\/\/img3\.encar\.com\/[^"'\s]+\.jpg/gi,
      /https:\/\/img4\.encar\.com\/[^"'\s]+\.jpg/gi,
      // src 속성에서 직접 추출
      /src=["']([^"']*carpicture[^"']*\.jpg)["']/gi,
      /src=["']([^"']*img\d*\.encar\.com[^"']*\.jpg)["']/gi,
      // 일반적인 이미지 패턴
      /"(https:\/\/[^"]*carpicture[^"]*\.jpg)"/gi,
      /'(https:\/\/[^']*carpicture[^']*\.jpg)'/gi,
    ];

    const imageUrls: string[] = [];

    // 모든 패턴으로 이미지 URL 추출
    for (const pattern of imagePatterns) {
      const matches = html.match(pattern);
      if (matches) {
        imageUrls.push(...matches.map(url => url.replace(/['"]/g, '')));
      }
    }

    // 중복 제거 및 필터링
    const uniqueImages = [...new Set(imageUrls)]
      .filter(url => {
        // 차량 이미지일 가능성이 높은 URL만 선택 (우선순위 기준)
        if (url.includes('carpicture')) return true; // 가장 높은 우선순위
        if (url.includes('logo') || url.includes('brand_logo')) return false; // 로고 제외
        if (url.includes('icon') || url.includes('button')) return false; // 아이콘 제외
        if (url.includes('banner') || url.includes('popup')) return false; // 배너 제외
        if (url.includes('encar') && url.includes('.jpg')) return true; // 엔카 이미지
        return false;
      })
      .sort((a, b) => {
        // carpicture가 포함된 이미지를 우선순위로 정렬
        if (a.includes('carpicture') && !b.includes('carpicture')) return -1;
        if (!a.includes('carpicture') && b.includes('carpicture')) return 1;
        return 0;
      })
      .slice(0, 10); // 최대 10개만

    console.log('🖼️ Found images:', uniqueImages.length);
    uniqueImages.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });

    if (uniqueImages.length === 0) {
      // 이미지를 찾지 못한 경우 HTML에서 다른 패턴 시도
      console.log('🔍 Trying alternative patterns...');

      // 모든 이미지 URL 추출해서 분석
      const allImageMatches = html.match(/src=["']([^"']*\.jpg[^"']*)["']/gi);
      if (allImageMatches) {
        console.log('📸 All found image sources:');
        allImageMatches.slice(0, 20).forEach((match, index) => {
          const url = match.replace(/src=["']|["']/g, '');
          console.log(`  ${index + 1}. ${url}`);
        });

        const srcImages = allImageMatches
          .map(match => match.replace(/src=["']|["']/g, ''))
          .filter(url => url.startsWith('http') && !url.includes('logo') && !url.includes('icon'))
          .slice(0, 5);
        uniqueImages.push(...srcImages);
      }

      // 추가로 백그라운드 이미지도 검색
      const bgImageMatches = html.match(/background-image:\s*url\(["']?([^"']*\.jpg[^"']*)["']?\)/gi);
      if (bgImageMatches) {
        console.log('🎨 Background images found:');
        bgImageMatches.forEach((match, index) => {
          console.log(`  ${index + 1}. ${match}`);
        });
      }
    }

    return NextResponse.json({
      success: true,
      detailUrl,
      images: uniqueImages,
      count: uniqueImages.length,
      primaryImage: uniqueImages[0] || null,
    });

  } catch (error) {
    console.error('🚨 Error fetching vehicle image:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      detailUrl,
    }, { status: 500 });
  }
}