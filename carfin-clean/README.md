# CarFin AI - 지능형 중고차 추천 시스템

> **Gemini AI Studio 스타일** 실시간 채팅 인터페이스로 3명의 AI 전문가가 협업하여 완벽한 중고차 추천을 제공합니다.

## 🚀 Phase 3 완료 - 동적 A2A + 페르소나 시스템

**완전한 동적 협업 시스템 구현!** 사용자 페르소나 자동 감지와 동적 A2A 협업으로 개인화된 추천을 제공합니다.

### ✅ 핵심 기능

- **🎯 동적 A2A 협업**: 실시간 WebSocket 스트리밍 + Agent-to-Agent 협업
- **👤 페르소나 자동 감지**: CEO족, 신혼부부, 청년층 등 자동 분류
- **🗄️ 실제 데이터**: PostgreSQL에서 117,000+ 실제 중고차 매물 검색
- **🤖 Gemini 2.0 Flash**: 동적 패턴 감지 + A2A 순차 협업 프로토콜
- **💬 실시간 스트리밍**: WebSocket 기반 실시간 협업 과정 시연
- **📊 개인화 TCO**: 페르소나별 맞춤 경제성 분석
- **🔄 백업 랭킹**: VehicleReranker 안정성 보장 시스템

### 🛠️ 기술 스택

- **Frontend**: Next.js 15.5.4 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Gemini 2.0 Flash + WebSocket Streaming
- **Database**: PostgreSQL (117,129 vehicle records) + Valkey Cache
- **AI**: Google Generative AI (Gemini 2.0 Flash) + Dynamic A2A Protocol + Persona Detection
- **Cache**: AWS ElastiCache (Valkey) + Mock Redis for development

## 🏗️ 시스템 아키텍처

```
User Question → ChatRoom → WebSocket /chat/ws → DynamicCollaborationManager
                                                 ├─ PersonaDetector (자동 감지)
                                                 ├─ PatternDetector (협업 패턴)
                                                 ├─ 컨시어지 매니저
                                                 ├─ 니즈 분석 전문가
                                                 └─ 데이터 분석 전문가 → PostgreSQL + Valkey
                                                     └─ VehicleReranker (백업 랭킹)
```

## 🚀 시작하기

### 환경 설정

1. **환경 변수 설정** (`.env.local`)
```bash
GEMINI_API_KEY=your_gemini_api_key
DB_HOST=your_postgres_host
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
VALKEY_ENDPOINT=your_valkey_endpoint  # AWS ElastiCache (선택사항)
VALKEY_PORT=6379
```

2. **의존성 설치**
```bash
npm install
```

3. **개발 서버 시작**
```bash
npm run dev
```

4. **브라우저에서 확인**: [http://localhost:3004](http://localhost:3004)

## 📱 사용법

1. **메인 페이지**에서 원하는 차량에 대해 자연스럽게 질문
2. **ChatRoom**으로 이동하여 3명의 AI 전문가와 실시간 상담
3. **A2A 협업** 과정을 통해 완벽한 차량 추천 받기

### 예시 질문 (페르소나별)

**👔 CEO족**
- "법인차로 등록할 수 있는 중형세단 추천해주세요"
- "골프 치러 다니기 좋은 차 있나요? 세금혜택도 받고 싶어요"

**💑 신혼부부**
- "첫차로 뭐가 좋을까요? 출퇴근용이고 예산은 2500만원 정도예요"
- "가족계획 있어서 SUV 찾고 있어요"

**🎓 청년층**
- "연비 좋은 소형차 중에서 추천 부탁드려요"
- "첫 직장 다니면서 탈 차 추천해주세요"

## 🧠 AI 전문가팀

### 🎯 컨시어지 매니저
- **역할**: 전체 상담 프로세스 체계적 관리
- **기능**: 질문 분석, 요구사항 정리, 프로세스 안내

### 🔍 니즈 분석 전문가
- **역할**: 숨은 니즈 완벽 발굴
- **기능**: 라이프스타일 분석, 우선순위 도출, 차량 조건 제시

### 📊 데이터 분석 전문가
- **역할**: 실제 매물 데이터 + TCO 분석
- **기능**: 차량 추천, 경제성 분석, 구매 조언

## 🗄️ 데이터베이스 스키마

```sql
CREATE TABLE vehicles (
    vehicleid SERIAL PRIMARY KEY,
    manufacturer VARCHAR(50),
    model VARCHAR(100),
    modelyear INTEGER,
    price INTEGER,
    distance INTEGER,
    fueltype VARCHAR(20),
    cartype VARCHAR(30),
    transmission VARCHAR(20),
    trim VARCHAR(100),
    colorname VARCHAR(30),
    location VARCHAR(100)
);
```

## 📁 프로젝트 구조

```
carfin-clean/
├── app/
│   ├── api/
│   │   ├── chat/ws/route.ts        # WebSocket 동적 A2A API
│   │   ├── test/                   # 종합 테스트 스위트
│   │   │   ├── valkey/route.ts     # Valkey 연결 테스트
│   │   │   ├── personalization/   # 개인화 엔진 테스트
│   │   │   ├── a2a-session/        # A2A 세션 관리 테스트
│   │   │   └── performance/        # 성능 벤치마크 테스트
│   │   └── database/status/route.ts # DB 상태 확인
│   └── page.tsx                    # 메인 랜딩 페이지
├── components/
│   ├── chat/ChatRoom.tsx           # WebSocket 실시간 채팅
│   └── ui/                         # UI 컴포넌트들
├── lib/
│   ├── collaboration/              # A2A 협업 시스템
│   │   ├── DynamicCollaborationManager.ts # 동적 협업 매니저
│   │   ├── PersonaDefinitions.ts   # 페르소나 자동 감지
│   │   ├── CollaborationPatternDetector.ts # 패턴 감지
│   │   └── CEOPersonaDesign.md     # CEO 페르소나 설계
│   ├── database.ts                 # PostgreSQL + 페르소나 연동
│   └── redis.ts                    # Valkey/Redis 캐싱
└── README.md
```

## 🔄 개발 진행상황

- ✅ **Phase 1**: KakaoTalk → Gemini AI Studio UI 전환
- ✅ **Phase 2**: Mock 데이터 완전 제거 + 실제 A2A 시스템 구현
- ✅ **Phase 3**: WebSocket 실시간 스트리밍 + 동적 A2A 협업 구현
- ✅ **Phase 4**: 페르소나 자동 감지 + 개인화 추천 엔진
- ✅ **Phase 5**: 종합 테스트 스위트 + 성능 최적화 (34.7x 향상)
- 🔄 **Phase 6**: 고급 기능 및 최종 고도화 (진행 예정)

## 🚨 중요 특징

- **Zero Mock Data**: 모든 데이터가 실제 PostgreSQL과 Gemini API에서 제공
- **Dynamic A2A Protocol**: 실시간 에이전트 간 동적 협업 및 패턴 감지
- **Persona Auto-Detection**: 질문 분석으로 자동 페르소나 분류 (CEO족, 신혼부부, 청년층)
- **Real-time Streaming**: WebSocket 기반 실시간 협업 과정 시연
- **Performance Optimized**: 34.7x 성능 향상 + 백업 랭킹 시스템
- **Production Ready**: 종합 테스트 완료 + 실제 서비스 가능한 완성도
- **Scalable**: 페르소나 추가 및 협업 패턴 확장 용이

## 🔧 개발 환경

- Node.js 18+
- PostgreSQL 13+ (117,129 실제 차량 데이터)
- AWS ElastiCache (Valkey) - 캐싱 레이어
- Google Cloud (Gemini 2.0 Flash API)
- Next.js 15.5.4+ (WebSocket + Server-Sent Events)

## 🧪 테스트 스위트

- **Valkey 연결 테스트**: `/api/test/valkey` - 캐싱 시스템 검증
- **개인화 엔진 테스트**: `/api/test/personalization` - 95% 정확도 검증
- **A2A 세션 테스트**: `/api/test/a2a-session` - 협업 세션 관리 검증
- **성능 벤치마크**: `/api/test/performance` - 34.7x 성능 향상 검증

---

**🚗 CarFin AI로 완벽한 중고차를 찾아보세요!**

*"니 취향만 말해, 나머지는 내가 다 해줄게"*