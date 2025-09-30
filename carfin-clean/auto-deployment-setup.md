# 🚀 자동 배포 설정 가이드 - CarFin AI

**목표**: Git Push만으로 자동 배포되는 CI/CD 파이프라인 구축

---

## 📋 설정 단계

### **1단계: Vercel 프로젝트 생성 및 GitHub 연동**

#### Vercel 대시보드에서 설정:
1. https://vercel.com/dashboard 접속
2. "New Project" 클릭
3. "Import Git Repository" 선택
4. GitHub 저장소 `SeSAC-DA1/CarFin_AI` 선택
5. 프로젝트 설정:
   - **Project Name**: `carfin-ai`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `carfin-clean`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### **2단계: GitHub Secrets 설정**

GitHub 저장소 Settings → Secrets and variables → Actions에서 다음 시크릿들 추가:

#### **Vercel 관련 시크릿**
```
VERCEL_TOKEN = [Vercel 계정의 토큰]
VERCEL_ORG_ID = [Vercel 조직 ID]
VERCEL_PROJECT_ID = [프로젝트 ID]
```

#### **데이터베이스 시크릿**
```
DB_HOST = carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com
DB_PORT = 5432
DB_NAME = carfin
DB_USER = carfin_admin
DB_PASSWORD = carfin_secure_password_2025
```

#### **AI API 시크릿**
```
GEMINI_API_KEY = AIzaSyArwWj3_TDhSuCVXYoDzVGM2MW26-5UqbU
```

### **3단계: Vercel 토큰 및 ID 확인**

#### Vercel 토큰 생성:
1. Vercel 대시보드 → Settings → Tokens
2. "Create Token" 클릭
3. 토큰 이름: `github-actions`
4. 생성된 토큰을 `VERCEL_TOKEN`으로 저장

#### 조직 ID 및 프로젝트 ID 확인:
```bash
# Vercel CLI로 확인
vercel login
cd carfin-clean
vercel link  # 프로젝트 연결
cat .vercel/project.json
```

---

## 🔄 자동 배포 워크플로우

### **트리거 조건**
- **Production 배포**: `main` 브랜치에 Push
- **Preview 배포**: Pull Request 생성/업데이트
- **Health Check**: Production 배포 후 자동 실행

### **배포 단계**
1. **🔨 Build & Test**
   - 코드 체크아웃
   - Node.js 20 설정
   - 의존성 설치
   - TypeScript 검사
   - 프로덕션 빌드

2. **🚀 Deploy**
   - Vercel CLI 설치
   - 환경 정보 pull
   - 프로젝트 빌드
   - Vercel 배포

3. **🏥 Health Check**
   - 메인 페이지 응답 확인
   - Database API 상태 확인
   - Vehicle Analysis API 테스트

4. **📢 Notification**
   - 배포 성공/실패 알림
   - 서비스 URL 및 상태 정보

---

## 🎯 사용법

### **자동 배포 실행**
```bash
# 개발 완료 후
git add .
git commit -m "✨ 새로운 기능 추가"
git push origin main
```

### **Preview 배포 (PR용)**
```bash
# 새 브랜치 생성
git checkout -b feature/new-feature

# 개발 및 커밋
git add .
git commit -m "🚧 새 기능 개발 중"
git push origin feature/new-feature

# GitHub에서 Pull Request 생성 → 자동으로 Preview 배포
```

---

## 📊 배포 모니터링

### **GitHub Actions 확인**
- GitHub 저장소 → Actions 탭
- 워크플로우 실행 상태 실시간 확인
- 로그 및 에러 메시지 확인

### **Vercel 대시보드 확인**
- https://vercel.com/dashboard
- 배포 히스토리 및 성능 메트릭
- 실시간 로그 및 함수 실행 상태

### **자동 Health Check**
배포 완료 후 자동으로 다음 엔드포인트들 검사:
- ✅ `https://carfin-ai.vercel.app/` (메인 페이지)
- ✅ `https://carfin-ai.vercel.app/api/database/status` (DB 상태)
- ✅ `https://carfin-ai.vercel.app/api/vehicle/analysis/319258` (차량 분석)

---

## 🔧 고급 설정

### **환경별 배포**
- **Production**: `main` 브랜치 → `carfin-ai.vercel.app`
- **Preview**: PR 브랜치 → `carfin-ai-git-[브랜치명].vercel.app`

### **롤백 설정**
```bash
# 이전 배포로 롤백
vercel rollback [deployment-url]
```

### **커스텀 도메인**
Vercel 대시보드 → Project → Settings → Domains
- 원하는 도메인 추가 가능
- 자동 HTTPS 설정

---

## 🚨 트러블슈팅

### **일반적인 문제들**

#### 1. GitHub Secrets 누락
```
Error: Missing required secrets
→ GitHub 저장소 Settings에서 모든 시크릿 확인
```

#### 2. Vercel 토큰 만료
```
Error: Invalid token
→ Vercel에서 새 토큰 생성 후 VERCEL_TOKEN 업데이트
```

#### 3. 빌드 실패
```
Build failed in GitHub Actions
→ 로컬에서 'npm run build' 성공 확인
→ 환경변수 누락 여부 확인
```

#### 4. Health Check 실패
```
Health check failed
→ API 엔드포인트 응답 시간 확인
→ 데이터베이스 연결 상태 확인
```

---

## 📈 성능 최적화

### **빌드 시간 단축**
- npm 캐시 활용 (설정 완료)
- 병렬 작업 실행
- 불필요한 의존성 제거

### **배포 속도 향상**
- Vercel 서울 리전 사용 (`icn1`)
- 정적 파일 최적화
- API 응답 캐싱

---

## ✅ 설정 완료 체크리스트

- [ ] **Vercel 프로젝트 생성** (carfin-ai)
- [ ] **GitHub 저장소 연동**
- [ ] **GitHub Secrets 설정** (9개 시크릿)
- [ ] **Vercel 토큰 생성 및 설정**
- [ ] **워크플로우 파일 커밋** (.github/workflows/deploy.yml)
- [ ] **첫 배포 테스트** (main 브랜치 push)
- [ ] **Health Check 확인**

---

## 🎉 완료 후 결과

설정 완료 후 다음과 같은 자동화된 배포 파이프라인이 구축됩니다:

1. **코드 푸시** → **자동 빌드** → **자동 배포** → **Health Check**
2. **실시간 알림** → **배포 상태 확인** → **서비스 모니터링**
3. **롤백 가능** → **Preview 배포** → **프로덕션 안정성**

**🚀 이제 `git push`만으로 전 세계에 CarFin AI가 배포됩니다!**