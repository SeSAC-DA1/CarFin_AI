# 🚗 CarFin AI

**AI 멀티에이전트가 해결하는 중고차 구매의 복잡함**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-🚀%20Try%20Now-success)](https://carfin-clean-9up264omd-nimowa03s-projects.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 🎯 프로젝트 개요

CarFin AI는 **3명의 AI 전문가가 실시간으로 협업**하여 중고차 구매의 복잡함을 해결하는 혁신적인 상담 플랫폼입니다.

### ✨ 핵심 기능

- 🤖 **A2A 멀티에이전트 협업**: 3명의 AI 전문가가 실시간 협업
- 🎭 **페르소나 자동 감지**: CEO부터 신혼부부까지 라이프스타일 맞춤 분석
- 🗄️ **실제 데이터 연동**: 170K+ 실제 중고차 매물 분석
- 🏆 **1,2,3위 랭킹 시스템**: 명확한 시각적 비교 제공
- 💰 **TCO 분석**: 숨겨진 비용까지 투명하게 계산

## 🤖 3명의 AI 전문가

```
🎯 CarFin 상담 총괄 에이전트
   └── 질문 분석 및 협업 흐름 관리

🔍 CarFin 니즈 분석 에이전트
   └── 페르소나 감지 및 라이프스타일 분석

📊 CarFin 차량 추천 에이전트
   └── 매물 분석 및 TCO 기반 추천
```

## 🚀 빠른 시작

### 라이브 데모 체험
👉 **[https://carfin-clean-9up264omd-nimowa03s-projects.vercel.app/](https://carfin-clean-9up264omd-nimowa03s-projects.vercel.app/)**

### 로컬 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/SeSAC-DA1/CarFin_AI.git
cd CarFin_AI/carfin-clean

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# 필요한 API 키들을 .env.local에 설정

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 확인하세요.

## 📚 프로젝트 문서

### 핵심 문서
- 📋 **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - 프로젝트 전체 개요 및 시스템 구조
- 🔧 **[TECHNICAL_SPECIFICATION.md](./TECHNICAL_SPECIFICATION.md)** - 기술 명세서 및 구현 세부사항
- 🎯 **[final_demo_readiness_assessment.md](./final_demo_readiness_assessment.md)** - 데모 준비도 평가 보고서

### 발표 자료
- 🎤 **[CARFIN_PRESENTATION.md](./CARFIN_PRESENTATION.md)** - PPT 발표 자료 및 데모 가이드

## 🏗️ 기술 스택

### Frontend
- **Next.js 15.5.4** - React 프레임워크 (App Router)
- **React 19.1.0** - 최신 React 기능 활용
- **TypeScript** - 완전한 타입 안전성
- **Tailwind CSS** - 유틸리티 우선 스타일링
- **Lucide React** - 아이콘 시스템

### Backend & AI
- **Google Gemini 2.5 Flash** - AI 엔진
- **PostgreSQL** - 170K+ 매물 데이터베이스
- **Vercel Serverless** - API 및 배포
- **Vercel KV** - 하이브리드 캐시 시스템

### 핵심 특징
- ⚡ **Server-Sent Events** - 실시간 A2A 협업 스트리밍
- 🔄 **하이브리드 캐시** - 메모리 + 파일 + KV (18배 속도 향상)
- 🎭 **페르소나 감지** - 키워드 + 벡터 유사도 하이브리드 알고리즘
- 📊 **TCO 계산** - 총소유비용 실시간 분석

## 🎭 데모 시나리오

### CEO 페르소나 케이스
```
질문: "골프백 들어가는 BMW 차량 추천해주세요"

결과:
✅ 페르소나 감지: CEO (80% 신뢰도)
✅ 매물 분석: 6,713대 실시간 처리
✅ 최종 추천: BMW X1 (97점 최고 스코어)
```

### 신혼부부 페르소나 케이스
```
질문: "결혼 준비 중인데 안전하고 경제적인 차량 추천해주세요"

결과:
✅ 페르소나 감지: 신혼부부 (85% 신뢰도)
✅ 안전성 + 경제성 중심 분석
✅ 가족 계획까지 고려한 맞춤 추천
```

## 📈 성능 지표

- 🚀 **페르소나 감지**: 1초 이내
- ⚡ **A2A 협업**: 30-45초 완료
- 🗄️ **매물 검색**: 170K+ 데이터 3초 이내
- 📦 **캐시 효율**: 18배 속도 향상

## 🎯 경쟁 우위

| 기존 플랫폼 | CarFin AI |
|------------|-----------|
| 단순 필터링 | **전문가 협업 분석** |
| 광고성 정보 | **실제 데이터 기반** |
| 일반적 추천 | **페르소나 맞춤 분석** |
| 숨겨진 수수료 | **완전 투명 공개** |

## 🚀 배포 정보

- **Production URL**: [https://carfin-clean-9up264omd-nimowa03s-projects.vercel.app/](https://carfin-clean-9up264omd-nimowa03s-projects.vercel.app/)
- **자동 배포**: GitHub Push → Vercel Deploy
- **모니터링**: Vercel Analytics + Error Tracking

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

- 📧 Email: [프로젝트 이메일]
- 🌐 Demo: [https://carfin-clean-9up264omd-nimowa03s-projects.vercel.app/](https://carfin-clean-9up264omd-nimowa03s-projects.vercel.app/)

---

**Made with ❤️ by CarFin AI Team**

*"AI 멀티에이전트로 중고차 구매의 복잡함을 해결합니다"*