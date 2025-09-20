# 🚀 Vercel 직접 배포 가이드

## 방법 1: Vercel Dashboard에서 직접 연결 (권장)

### 단계별 설정:

1. **Vercel Dashboard 접속**
   ```
   https://vercel.com/dashboard
   ```

2. **New Project 클릭**
   - "Add New..." → "Project" 선택

3. **GitHub Repository 연결**
   - "Import Git Repository" 섹션에서
   - "SeSAC-DA1/CarFin_AI" 검색 및 선택
   - "Import" 클릭

4. **프로젝트 설정**
   ```
   Project Name: carfin-ai
   Framework Preset: Next.js
   Root Directory: Frontend/carfin-ui
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

5. **환경변수 설정**
   ```
   NODE_ENV: production
   NEXT_TELEMETRY_DISABLED: 1
   ```

6. **Deploy 버튼 클릭**

## 방법 2: Vercel CLI 직접 사용

### 설치 및 로그인:
```bash
npm install -g vercel
vercel login
```

### 프로젝트 배포:
```bash
cd Frontend/carfin-ui
vercel
# 첫 설정 후
vercel --prod
```

## 방법 3: GitHub Actions 문제 해결

현재 GitHub Actions에서 Node.js 캐시 오류가 발생하는 경우:

1. **Actions 탭에서 캐시 삭제**
   - Repository → Actions → Caches → "Delete all caches"

2. **새로운 워크플로우 실행**
   - 수동으로 "workflow_dispatch" 트리거

## 예상 결과

성공 시 다음과 같은 URL을 받게 됩니다:
- **Production URL**: `https://carfin-ai-[hash].vercel.app`
- **Custom Domain**: `https://carfin-ai.vercel.app` (설정 시)

## 문제 해결

### 빌드 오류 시:
```bash
# Frontend 디렉토리에서 로컬 테스트
cd Frontend/carfin-ui
npm install
npm run build
```

### 환경변수 확인:
```bash
# Vercel Dashboard → Project → Settings → Environment Variables
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

---
**📍 가장 쉬운 방법은 Vercel Dashboard에서 직접 GitHub 연결하는 것입니다!**