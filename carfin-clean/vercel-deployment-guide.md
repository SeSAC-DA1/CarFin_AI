# 🚀 Vercel 배포 가이드 - CarFin AI

**프로젝트**: CarFin AI - 지능형 중고차 추천 시스템
**배포 준비도**: 100% ✅

---

## 📋 배포 전 체크리스트

### ✅ **완료된 준비사항**
- [x] 프로덕션 빌드 성공 (4.8초 컴파일)
- [x] 모든 API 엔드포인트 정상 작동
- [x] 데이터베이스 연결 안정화
- [x] TypeScript 컴파일 에러 없음
- [x] Vercel 설정 파일 (`vercel.json`) 준비 완료

### 📦 **빌드 결과**
```
Route (app)                                 Size  First Load JS
┌ ○ /                                    50.8 kB         153 kB
├ ƒ /api/database/status                   162 B         102 kB
├ ƒ /api/vehicle/analysis/[vehicleId]      162 B         102 kB
└ 총 19개 API 엔드포인트 준비 완료
```

---

## 🔧 Vercel 배포 단계별 가이드

### **Step 1: Vercel 로그인**
```bash
cd carfin-clean
vercel login
```
- 브라우저에서 GitHub/Google 계정으로 로그인
- 터미널에서 인증 완료 확인

### **Step 2: 환경 변수 설정**
Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

#### 필수 환경 변수:
```env
# 데이터베이스 설정
DB_HOST=carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=carfin
DB_USER=carfin_admin
DB_PASSWORD=carfin_secure_password_2025

# AI API 설정
GEMINI_API_KEY=AIzaSyArwWj3_TDhSuCVXYoDzVGM2MW26-5UqbU

# 프로덕션 설정
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Valkey/Redis 설정 (선택사항)
REDIS_HOST=clustercfg.carfin-valkey.uvxud5.apn2.cache.amazonaws.com
REDIS_PORT=6379

# CarFin 설정
CARFIN_VERSION=2.0_CLEAN
CARFIN_SLOGAN="니 취향만 말해, 나머지는 내가 다 해줄게"
AI_DEMO_MODE=false
```

### **Step 3: 첫 번째 배포**
```bash
vercel
```
- 프로젝트 설정 질문에 답변:
  - **Set up and deploy?** → Yes
  - **Which scope?** → 본인 계정 선택
  - **Link to existing project?** → No (새 프로젝트)
  - **What's your project's name?** → `carfin-ai`
  - **In which directory?** → `./` (현재 디렉토리)
  - **Override settings?** → No (vercel.json 사용)

### **Step 4: 환경 변수 추가**
```bash
# 환경 변수 일괄 추가
vercel env add DB_HOST
vercel env add DB_PORT
vercel env add DB_NAME
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add GEMINI_API_KEY
```

### **Step 5: 프로덕션 배포**
```bash
vercel --prod
```

---

## 🌐 배포 후 확인사항

### **1. 도메인 확인**
- 기본 도메인: `https://carfin-ai.vercel.app`
- 사용자 지정 도메인 설정 가능

### **2. API 엔드포인트 테스트**
```bash
# 데이터베이스 상태 확인
curl https://carfin-ai.vercel.app/api/database/status

# 차량 분석 API 확인
curl https://carfin-ai.vercel.app/api/vehicle/analysis/319258
```

### **3. 성능 모니터링**
- Vercel Analytics에서 성능 지표 확인
- 에러 로그 모니터링
- 함수 실행 시간 확인 (최대 300초 설정됨)

---

## ⚙️ Vercel 설정 최적화

### **현재 vercel.json 설정**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["icn1"],  // 서울 리전
  "public": true,
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 300  // 5분 최대 실행 시간
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### **추천 최적화 설정**
1. **리전 설정**: `icn1` (서울) - 한국 사용자 최적화
2. **함수 타임아웃**: 300초 - 복잡한 분석 작업 대응
3. **빌드 최적화**: Next.js 자동 최적화 활성화

---

## 🚨 주의사항

### **보안**
- 환경 변수에 민감한 정보 포함 (DB 비밀번호, API 키)
- Vercel 환경 변수는 암호화되어 저장됨
- GitHub 등 공개 저장소에 `.env` 파일 커밋 금지

### **성능**
- 데이터베이스 연결 풀링 자동 관리
- API 응답 시간 모니터링 권장
- 필요시 캐싱 전략 강화

### **비용**
- Vercel Hobby 플랜: 무료 (월 100GB 대역폭)
- Pro 플랜 필요시: $20/월
- 함수 실행 시간에 따른 과금 확인

---

## 🎯 배포 성공 시나리오

### **예상 결과**
1. **배포 URL**: `https://carfin-ai.vercel.app`
2. **빌드 시간**: 약 1-2분
3. **첫 로딩**: 3-5초 (Next.js 최적화)
4. **API 응답**: 0.5초 이내

### **시연 준비**
배포 완료 후 다음 URL들로 즉시 시연 가능:
- 메인 페이지: `https://carfin-ai.vercel.app`
- DB 상태: `https://carfin-ai.vercel.app/api/database/status`
- 차량 분석: `https://carfin-ai.vercel.app/api/vehicle/analysis/319258`

---

## 🔧 트러블슈팅

### **일반적인 문제들**

#### 1. 환경 변수 누락
```
Error: Database connection failed
→ Vercel 대시보드에서 DB_* 환경 변수 확인
```

#### 2. 함수 타임아웃
```
Error: Function timeout
→ vercel.json의 maxDuration 설정 확인 (현재 300초)
```

#### 3. 빌드 실패
```
Build failed
→ 로컬에서 'npm run build' 성공 확인 필요
```

---

## 🚀 **배포 명령어 요약**

```bash
# 1. 로그인
vercel login

# 2. 첫 배포 (프리뷰)
vercel

# 3. 환경 변수 설정 (Vercel 대시보드에서)

# 4. 프로덕션 배포
vercel --prod

# 5. 도메인 확인
vercel domains ls
```

---

**✨ 배포 준비 100% 완료! 위 가이드를 따라 진행하시면 됩니다.**