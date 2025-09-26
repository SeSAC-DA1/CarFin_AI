# CarFin AI - 지능형 중고차 추천 시스템

> **Gemini AI Studio 스타일** 실시간 채팅 인터페이스로 3명의 AI 전문가가 협업하여 완벽한 중고차 추천을 제공합니다.

## 🚀 Phase 2 완료 - 실제 A2A 멀티에이전트 시스템

**Mock 데이터 100% 제거 완료!** 실제 Gemini 2.0 Flash와 PostgreSQL 데이터만 사용하는 완전한 A2A 시스템입니다.

### ✅ 핵심 기능

- **🎯 3-Agent 협업**: 컨시어지 매니저 → 니즈 분석 전문가 → 데이터 분석 전문가
- **🗄️ 실제 데이터**: PostgreSQL에서 117,000+ 실제 중고차 매물 검색
- **🤖 Gemini 2.0 Flash**: Agent-to-Agent 순차 협업 프로토콜
- **💬 실시간 채팅**: Gemini AI Studio 스타일 UI
- **📊 TCO 분석**: 구매가격 + 유지비 + 감가상각 + 보험료

### 🛠️ 기술 스택

- **Frontend**: Next.js 15.5.4 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Gemini 2.0 Flash
- **Database**: PostgreSQL (117,129 vehicle records)
- **AI**: Google Generative AI (Gemini 2.0 Flash) + A2A Protocol

## 🏗️ 시스템 아키텍처

```
User Question → ChatRoom → API /chat → A2A MultiAgentSystem
                                         ├─ 컨시어지 매니저
                                         ├─ 니즈 분석 전문가
                                         └─ 데이터 분석 전문가 → PostgreSQL
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

### 예시 질문
- "첫차로 뭐가 좋을까요? 출퇴근용이고 예산은 2500만원 정도예요"
- "SUV 추천해주세요. 가족용으로 안전한 차 찾고 있어요"
- "연비 좋은 소형차 중에서 추천 부탁드려요"

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
│   │   ├── chat/route.ts           # A2A 멀티에이전트 API
│   │   └── database/status/route.ts # DB 상태 확인
│   └── page.tsx                    # 메인 랜딩 페이지
├── components/
│   └── chat/
│       └── ChatRoom.tsx            # Gemini Studio 스타일 채팅
├── lib/
│   └── database.ts                 # PostgreSQL 연동
└── README.md
```

## 🔄 개발 진행상황

- ✅ **Phase 1**: KakaoTalk → Gemini AI Studio UI 전환
- ✅ **Phase 2**: Mock 데이터 완전 제거 + 실제 A2A 시스템 구현
- 🔄 **Phase 3**: WebSocket 실시간 스트리밍 구현 (진행 예정)
- 🔄 **Phase 4**: 추가 최적화 및 고도화 (진행 예정)

## 🚨 중요 특징

- **Zero Mock Data**: 모든 데이터가 실제 PostgreSQL과 Gemini API에서 제공
- **Real A2A Protocol**: 에이전트 간 실제 협업 및 정보 전달
- **Production Ready**: 실제 서비스 가능한 수준의 완성도
- **Scalable**: 에이전트 추가 및 기능 확장 용이

## 🔧 개발 환경

- Node.js 18+
- PostgreSQL 13+
- Google Cloud (Gemini API)
- Next.js 15.5.4+

---

**🚗 CarFin AI로 완벽한 중고차를 찾아보세요!**

*"니 취향만 말해, 나머지는 내가 다 해줄게"*