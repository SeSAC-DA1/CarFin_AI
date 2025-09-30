# CarFin AI - 기술 명세서

## 🏗️ 시스템 아키텍처

### 전체 구조도
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                │
├─────────────────────┬───────────────────────────────────┤
│   React Components  │        API Routes                 │
│   - ChatRoom        │        - /api/chat                │
│   - PersonaCards    │        - /api/database/*          │
│   - VehicleCards    │        - /api/test/*              │
└─────────────────────┴───────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────┐
│              A2A Collaboration Engine                   │
├─────────────────────────────────────────────────────────┤
│  🎯 상담 총괄     🔍 니즈 분석     📊 차량 추천         │
│  - 질문 파싱      - 페르소나 감지   - 매물 검색         │
│  - 흐름 관리      - 라이프스타일    - TCO 계산          │
│  - 응답 조율      - 니즈 발굴       - 랭킹 생성         │
└─────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────┐
│                Data Layer & Cache                       │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL (170K+ 매물)  │  Vercel Cache (하이브리드)   │
│  - vehicle_listings       │  - Memory Cache            │
│  - real-time prices       │  - File Cache              │
│  - 17 data fields         │  - KV Store                │
└─────────────────────────────────────────────────────────┘
```

## ⚙️ 핵심 기술 스택

### Frontend Technologies
```typescript
// Package.json 주요 의존성
{
  "next": "15.5.4",           // 최신 App Router
  "react": "19.1.0",          // React 19 최신 기능
  "typescript": "^5",         // 완전한 타입 안전성
  "tailwindcss": "^3.4.1",   // 유틸리티 우선 CSS
  "lucide-react": "^0.344.0" // 아이콘 시스템
}
```

### Backend & AI
```typescript
// AI Integration
{
  "@google/generative-ai": "^0.21.0", // Gemini 2.5 Flash
  "pg": "^8.11.3",                    // PostgreSQL 연결
  "pg-pool": "^3.6.2",                // 연결 풀링
  "@vercel/kv": "^2.0.0"              // Vercel KV Store
}
```

## 🤖 A2A 에이전트 시스템

### 에이전트 정의
```typescript
interface Agent {
  id: 'concierge' | 'needs_analyst' | 'data_analyst';
  name: string;
  role: string;
  capabilities: string[];
  systemPrompt: string;
}

const AGENTS = {
  concierge: {
    name: 'CarFin 상담 총괄 에이전트',
    role: '질문 분석 및 협업 흐름 관리',
    capabilities: ['질문파싱', '페르소나감지', '응답조율']
  },
  needs_analyst: {
    name: 'CarFin 니즈 분석 에이전트',
    role: '라이프스타일 및 숨은 니즈 발굴',
    capabilities: ['페르소나분석', '라이프스타일매칭', '우선순위설정']
  },
  data_analyst: {
    name: 'CarFin 차량 추천 에이전트',
    role: '매물 분석 및 TCO 기반 추천',
    capabilities: ['매물검색', 'TCO계산', '랭킹생성']
  }
};
```

### 협업 플로우
```typescript
async function a2aCollaboration(question: string, budget: Budget) {
  // 1단계: 상담 총괄 에이전트
  const initialAnalysis = await agents.concierge.analyze(question);
  const detectedPersona = await personalAnalyzer.detect(question, budget);

  // 2단계: 니즈 분석 에이전트 (백그라운드)
  const needsAnalysis = agents.needs_analyst.analyzeNeeds({
    question,
    persona: detectedPersona,
    budget
  });

  // 3단계: 차량 추천 에이전트 (백그라운드)
  const dataAnalysis = agents.data_analyst.recommendVehicles({
    question,
    persona: detectedPersona,
    budget,
    needsInsights: await needsAnalysis
  });

  // 결과 통합
  return await agents.concierge.synthesize({
    needsAnalysis: await needsAnalysis,
    dataAnalysis: await dataAnalysis
  });
}
```

## 🎭 페르소나 감지 시스템

### 하이브리드 감지 알고리즘
```typescript
interface PersonaDetectionResult {
  personaId: string;
  confidence: number; // 0-100
  method: 'keyword' | 'vector' | 'convergence';
  details: DetectionDetails;
}

class PersonaDetector {
  async detectPersona(question: string, budget: Budget) {
    const results: PersonaDetectionResult[] = [];

    // 1. 키워드 매칭 (빠른 감지)
    const keywordResult = this.keywordMatching(question);
    if (keywordResult.confidence >= 80) {
      return keywordResult; // 즉시 반환
    }

    // 2. 벡터 유사도 (의미론적 분석)
    const vectorResult = await this.vectorSimilarity(question);
    results.push(vectorResult);

    // 3. 컨버전스 보너스 (다중 방법 일치)
    if (this.isConvergent(keywordResult, vectorResult)) {
      return this.applyConvergenceBonus(results);
    }

    return this.selectBestResult(results);
  }
}
```

### 페르소나별 키워드 패턴
```typescript
const PERSONA_KEYWORDS = {
  ceo_executive: {
    primary: ['BMW', '골프', '프리미엄', '럭셔리'],
    secondary: ['고급', '브랜드', '품격', '임원'],
    excludes: ['저렴', '중고', '실용']
  },
  newlywed: {
    primary: ['신혼', '결혼', '신차', '안전'],
    secondary: ['경제적', '가족', '계획', '미래'],
    budget_preference: [2000, 3500] // 만원 단위
  },
  camping_lifestyle: {
    primary: ['캠핑', 'SUV', '적재', '아웃도어'],
    secondary: ['여행', '캠퍼', '짐', '공간'],
    vehicle_types: ['SUV', '픽업', '밴']
  }
};
```

## 🗄️ 데이터베이스 스키마

### 차량 매물 테이블
```sql
CREATE TABLE vehicle_listings (
    vehicleid SERIAL PRIMARY KEY,
    manufacturer VARCHAR(50) NOT NULL,      -- 제조사
    model VARCHAR(100) NOT NULL,            -- 모델명
    modelyear INTEGER,                      -- 연식
    price INTEGER,                          -- 가격 (만원)
    distance INTEGER,                       -- 주행거리 (km)
    fueltype VARCHAR(20),                   -- 연료타입
    transmission VARCHAR(20),               -- 변속기
    displacement DECIMAL(3,1),              -- 배기량
    region VARCHAR(50),                     -- 지역
    dealer_type VARCHAR(20),                -- 딜러타입
    accident_history VARCHAR(10),           -- 사고이력
    maintenance_records TEXT,               -- 정비기록
    inspection_grade VARCHAR(5),            -- 성능점검
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 최적화
CREATE INDEX idx_vehicle_price_range ON vehicle_listings(price);
CREATE INDEX idx_vehicle_manufacturer ON vehicle_listings(manufacturer);
CREATE INDEX idx_vehicle_model ON vehicle_listings(model);
CREATE INDEX idx_vehicle_year ON vehicle_listings(modelyear);
```

### 성능 최적화 쿼리
```sql
-- 페르소나별 매물 검색 (예: CEO)
SELECT vehicleid, manufacturer, model, modelyear, price, distance
FROM vehicle_listings
WHERE price BETWEEN 2000 AND 8000
  AND manufacturer IN ('BMW', 'Mercedes-Benz', 'Audi', 'Lexus')
  AND modelyear >= 2018
  AND accident_history = 'None'
ORDER BY
  CASE
    WHEN manufacturer = 'BMW' THEN 1
    WHEN manufacturer = 'Mercedes-Benz' THEN 2
    ELSE 3
  END,
  price DESC
LIMIT 30;
```

## ⚡ 캐시 시스템

### 하이브리드 캐시 아키텍처
```typescript
class VercelCache {
  private memoryCache = new Map<string, CacheItem>();
  private fileCache = new FileCache('./cache');
  private kvStore = new KVStore(); // Vercel KV

  async get<T>(key: string): Promise<T | null> {
    // 1순위: 메모리 캐시 (가장 빠름)
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && !this.isExpired(memoryResult)) {
      return memoryResult.data;
    }

    // 2순위: 파일 캐시 (중간 속도)
    const fileResult = await this.fileCache.get(key);
    if (fileResult) {
      this.memoryCache.set(key, fileResult); // 메모리에 승격
      return fileResult.data;
    }

    // 3순위: KV Store (네트워크 필요)
    const kvResult = await this.kvStore.get(key);
    if (kvResult) {
      this.memoryCache.set(key, kvResult);
      await this.fileCache.set(key, kvResult);
      return kvResult.data;
    }

    return null;
  }
}
```

### 캐시 전략
```typescript
const CACHE_STRATEGIES = {
  vehicleSearch: {
    ttl: 600, // 10분
    storage: 'file', // 큰 데이터는 파일 캐시
    key: (budget: string, persona: string) => `search:${budget}_${persona}`
  },
  personaDetection: {
    ttl: 3600, // 1시간
    storage: 'memory', // 빠른 접근 필요
    key: (question: string) => `persona:${hashQuestion(question)}`
  },
  tcoCalculation: {
    ttl: 1800, // 30분
    storage: 'kv', // 영구 보관 필요
    key: (vehicleId: string) => `tco:${vehicleId}`
  }
};
```

## 📊 실시간 스트리밍

### Server-Sent Events 구현
```typescript
// API Route: /api/chat
export async function POST(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = (data: any) => {
        const formatted = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(formatted));
      };

      // A2A 협업 실행
      a2aCollaboration(question, budget, {
        onConciergeStart: () => sendUpdate({
          agent: 'concierge',
          status: 'started',
          message: '상담 총괄 에이전트가 질문을 분석하고 있습니다...'
        }),
        onNeedsAnalysis: (result) => sendUpdate({
          agent: 'needs_analyst',
          status: 'analyzing',
          data: result
        }),
        onDataAnalysis: (result) => sendUpdate({
          agent: 'data_analyst',
          status: 'searching',
          data: result
        }),
        onComplete: (finalResult) => {
          sendUpdate({ status: 'completed', data: finalResult });
          controller.close();
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

## 🔧 배포 & 운영

### Vercel 배포 설정
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "env": {
    "DATABASE_URL": "@database_url",
    "GEMINI_API_KEY": "@gemini_api_key",
    "KV_URL": "@kv_url"
  }
}
```

### 환경 변수 관리
```bash
# .env.local (개발환경)
DATABASE_URL="postgresql://..."
GEMINI_API_KEY="AIza..."
KV_URL="redis://..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Vercel 환경변수 (프로덕션)
DATABASE_URL=@database_url
GEMINI_API_KEY=@gemini_api_key
KV_URL=@kv_url
NEXT_PUBLIC_APP_URL="https://carfin-clean-...vercel.app"
```

## 📈 성능 모니터링

### 핵심 지표
```typescript
interface PerformanceMetrics {
  responseTime: {
    personaDetection: number;    // ~1초
    vehicleSearch: number;       // ~3초
    a2aCollaboration: number;    // ~30-45초
    totalFlow: number;           // ~50초
  };

  cacheEfficiency: {
    hitRate: number;             // 목표: 85%+
    speedImprovement: number;    // 18배 향상
  };

  userSatisfaction: {
    completionRate: number;      // 목표: 90%+
    reAnalysisRate: number;      // 목표: <15%
  };
}
```

---

**최종 업데이트**: 2025-09-30
**기술 스택 확정**: Next.js 15 + React 19 + Gemini 2.5 Flash + PostgreSQL
**에이전트 시스템**: 상담 총괄 + 니즈 분석 + 차량 추천 (3-Agent A2A)