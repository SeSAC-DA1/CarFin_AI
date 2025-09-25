# CarFin AI 기술 아키텍처 - 3-Agent 최적화 시스템 설계

## 🏗️ 전체 시스템 아키텍처 ("니 취향만 말해, 나머지는 내가 다 해줄게")

```
┌─────────────────────────────────────────────────────────────────┐
│                     CarFin AI Platform                          │
├─────────────────┬─────────────────┬─────────────────┬──────────┤
│   Frontend      │   3-Agent AI    │   Data Layer    │ External │
│   (Next.js)     │   (Optimized)   │   (PostgreSQL)  │   APIs   │
│                 │                 │   111,842+ 매물  │          │
└─────────────────┴─────────────────┴─────────────────┴──────────┘

           🎯 컨시어지 매니저 (상담 프로세스 관리)
           🔍 니즈 분석 전문가 (숨은 니즈 발굴)
           📊 데이터 분석 전문가 (매물+TCO+금융분석)
```

### 핵심 컴포넌트 구성

```typescript
// 시스템 아키텍처 타입 정의
interface CarFinArchitecture {
  frontend: {
    framework: "Next.js 15.5.3 + React 19",
    ui_library: "Tailwind CSS + shadcn/ui",
    state_management: "Context API + React Hooks",
    routing: "App Router"
  },
  ai_engine: {
    llm_provider: "Google Gemini 1.5 Flash",
    agent_system: "4-Agent Multi-Agent",
    conversation_analysis: "NLP + Sentiment Analysis",
    recommendation_algorithm: "Collaborative Filtering + Rule-based"
  },
  data_layer: {
    primary_db: "PostgreSQL (AWS RDS)",
    vehicle_records: "111,842+ entries",
    caching: "Redis (planned)",
    search: "Full-text search + indexing"
  },
  external_apis: {
    insurance: "보험사 API 연동",
    finance: "금융상품 비교 API",
    market_data: "실시간 시세 API"
  }
}
```

## 🤖 4-Agent AI 시스템 상세 설계

### Agent 아키텍처

```typescript
interface AgentSystem {
  agents: {
    guide_teacher: GuidedLearningAgent,
    needs_detective: NeedsDiscoveryAgent,
    price_analyzer: TCOAnalysisAgent,
    success_coach: PurchaseOptimizationAgent
  },
  coordination: MultiAgentOrchestrator,
  memory: ConversationContext,
  learning: FeedbackLoop
}

class MultiAgentOrchestrator {
  async processUserQuery(query: string, context: UserContext): Promise<AgentResponse[]> {
    // 1. 쿼리 분석 및 적절한 에이전트 선택
    const relevantAgents = this.selectAgents(query, context);

    // 2. 병렬 처리로 각 에이전트 실행
    const responses = await Promise.all(
      relevantAgents.map(agent => agent.process(query, context))
    );

    // 3. 응답 통합 및 일관성 검증
    return this.synthesizeResponses(responses);
  }

  private selectAgents(query: string, context: UserContext): Agent[] {
    const intent = this.analyzeIntent(query);

    // 의도별 에이전트 조합
    switch(intent.category) {
      case 'initial_consultation':
        return [this.agents.guide_teacher, this.agents.needs_detective];
      case 'price_inquiry':
        return [this.agents.price_analyzer, this.agents.success_coach];
      case 'comprehensive_analysis':
        return Object.values(this.agents); // 모든 에이전트
      default:
        return [this.agents.guide_teacher]; // 기본
    }
  }
}
```

### 개별 Agent 상세 구현

#### 1. 가이드 선생님 (Guide Teacher)

```typescript
class GuidedLearningAgent {
  private expertise = {
    vehicle_basics: "차량 기초 지식",
    first_car_guidance: "첫차 구매 가이드",
    safety_education: "중고차 주의사항"
  };

  async process(query: string, context: UserContext): Promise<AgentResponse> {
    const knowledgeGap = this.assessKnowledgeLevel(query, context);

    if (knowledgeGap.level === 'beginner') {
      return this.generateEducationalResponse(query, knowledgeGap.topics);
    }

    return this.generateStandardResponse(query);
  }

  private generateEducationalResponse(query: string, topics: string[]): AgentResponse {
    return {
      agent: 'guide_teacher',
      response: this.buildEducationalContent(topics),
      next_questions: this.suggestLearningPath(topics),
      confidence: 0.9
    };
  }
}
```

#### 2. 니즈 탐정 (Needs Detective)

```typescript
class NeedsDiscoveryAgent {
  private inference_engine: InferenceEngine;
  private lifestyle_analyzer: LifestyleAnalyzer;

  async process(query: string, context: UserContext): Promise<AgentResponse> {
    // 1. 명시적 니즈 추출
    const explicitNeeds = this.extractExplicitNeeds(query);

    // 2. 숨은 니즈 추론
    const hiddenNeeds = await this.inference_engine.inferHiddenNeeds(
      query,
      context.conversation_history,
      context.user_profile
    );

    // 3. 라이프스타일 패턴 분석
    const lifestyleInsights = this.lifestyle_analyzer.analyze(context);

    return {
      agent: 'needs_detective',
      explicit_needs: explicitNeeds,
      hidden_needs: hiddenNeeds,
      lifestyle_insights: lifestyleInsights,
      confidence: this.calculateConfidence(hiddenNeeds)
    };
  }
}

class InferenceEngine {
  private rules: InferenceRule[] = [
    {
      pattern: /골프|라운딩|스크린골프/i,
      inferences: [
        { need: 'trunk_space', weight: 0.9, reason: '골프백 적재 공간 필요' },
        { need: 'image_conscious', weight: 0.7, reason: '골프장 이미지 고려' }
      ]
    },
    {
      pattern: /강남|서초|역삼|논현/i,
      inferences: [
        { need: 'parking_convenience', weight: 0.95, reason: '좁은 주차공간 빈번' },
        { need: 'brand_image', weight: 0.8, reason: '지역 특성상 이미지 중시' }
      ]
    },
    {
      pattern: /아이|자녀|학원|픽업/i,
      inferences: [
        { need: 'safety_priority', weight: 0.95, reason: '자녀 안전 최우선' },
        { need: 'space_requirement', weight: 0.85, reason: '가족 공간 필요' }
      ]
    }
  ];

  async inferHiddenNeeds(query: string, history: ConversationHistory, profile: UserProfile): Promise<HiddenNeed[]> {
    const inferences: HiddenNeed[] = [];

    // 규칙 기반 추론
    for (const rule of this.rules) {
      if (rule.pattern.test(query)) {
        inferences.push(...rule.inferences);
      }
    }

    // 협업 필터링 추론
    const collaborativeInferences = await this.collaborativeInference(profile);
    inferences.push(...collaborativeInferences);

    // NLP 기반 감정 분석
    const sentimentInferences = await this.sentimentInference(query, history);
    inferences.push(...sentimentInferences);

    return this.consolidateInferences(inferences);
  }
}
```

#### 3. 가격 분석가 (Price Analyzer)

```typescript
class TCOAnalysisAgent {
  private market_data: MarketDataService;
  private tco_calculator: TCOCalculator;

  async process(query: string, context: UserContext): Promise<AgentResponse> {
    const vehicles = context.recommended_vehicles;
    const tcoAnalyses = await Promise.all(
      vehicles.map(vehicle => this.analyzeTCO(vehicle, context.user_profile))
    );

    return {
      agent: 'price_analyzer',
      tco_analyses: tcoAnalyses,
      market_insights: await this.generateMarketInsights(vehicles),
      hidden_costs: this.identifyHiddenCosts(vehicles),
      value_recommendations: this.rankByValue(tcoAnalyses)
    };
  }

  private async analyzeTCO(vehicle: Vehicle, profile: UserProfile): Promise<TCOAnalysis> {
    return {
      vehicle_id: vehicle.id,
      purchase_cost: vehicle.price,
      depreciation: await this.calculateDepreciation(vehicle),
      maintenance_cost: await this.estimateMaintenanceCost(vehicle, profile),
      insurance_cost: await this.getInsuranceQuote(vehicle, profile),
      fuel_cost: this.calculateFuelCost(vehicle, profile.driving_pattern),
      total_3year_cost: 0, // 위 항목들의 합계
      monthly_equivalent: 0,
      value_score: 0
    };
  }
}

class TCOCalculator {
  calculateDepreciation(vehicle: Vehicle, years: number): number {
    // 브랜드별, 모델별, 연식별 감가상각률 데이터 기반
    const depreciationRate = this.getDepreciationRate(vehicle);
    return vehicle.price * depreciationRate * years;
  }

  async estimateMaintenanceCost(vehicle: Vehicle, profile: UserProfile): Promise<number> {
    // 차종별 정비비 데이터 + 사용자 주행패턴 고려
    const baseCost = this.getBaseMaintenanceCost(vehicle);
    const usageMultiplier = this.getUsageMultiplier(profile.annual_mileage);
    return baseCost * usageMultiplier;
  }
}
```

#### 4. 성공 코치 (Success Coach)

```typescript
class PurchaseOptimizationAgent {
  private success_patterns: SuccessPatternAnalyzer;
  private negotiation_advisor: NegotiationAdvisor;

  async process(query: string, context: UserContext): Promise<AgentResponse> {
    const successProbability = await this.calculateSuccessProbability(context);
    const actionPlan = this.generateActionPlan(context);

    return {
      agent: 'success_coach',
      success_probability: successProbability,
      action_plan: actionPlan,
      negotiation_strategy: await this.generateNegotiationStrategy(context),
      similar_success_cases: await this.findSimilarSuccessCases(context.user_profile)
    };
  }

  private async calculateSuccessProbability(context: UserContext): Promise<SuccessProbability> {
    const factors = {
      budget_alignment: this.assessBudgetAlignment(context),
      needs_clarity: this.assessNeedsClarity(context),
      market_timing: await this.assessMarketTiming(context),
      vehicle_availability: await this.assessVehicleAvailability(context)
    };

    return {
      overall_score: this.weightedAverage(factors),
      risk_factors: this.identifyRiskFactors(factors),
      optimization_opportunities: this.identifyOptimizations(factors)
    };
  }
}
```

## 🔍 검색 및 매칭 엔진

### 지능형 검색 시스템

```typescript
class IntelligentSearchEngine {
  async searchVehicles(criteria: SearchCriteria, userNeeds: UserNeeds): Promise<Vehicle[]> {
    // 1. 기본 필터링 (예산, 차종, 연식 등)
    let candidates = await this.basicFiltering(criteria);

    // 2. 니즈 기반 고급 매칭
    candidates = await this.advancedMatching(candidates, userNeeds);

    // 3. 숨은 보석 발굴 (시장 가격 대비 가치 높은 매물)
    const hiddenGems = await this.findHiddenGems(candidates);

    // 4. 개인화 스코어링
    const scoredVehicles = await this.personalizedScoring(candidates, userNeeds);

    return this.rankAndSelect(scoredVehicles, hiddenGems);
  }

  private async advancedMatching(vehicles: Vehicle[], needs: UserNeeds): Promise<Vehicle[]> {
    return vehicles.filter(vehicle => {
      let matchScore = 0;

      // 숨은 니즈 매칭
      if (needs.trunk_space && vehicle.trunk_capacity >= needs.trunk_space.min_value) {
        matchScore += needs.trunk_space.weight;
      }

      if (needs.parking_convenience && vehicle.length <= 4500) { // 주차 편의성
        matchScore += needs.parking_convenience.weight;
      }

      if (needs.tech_features) {
        const techScore = this.calculateTechScore(vehicle, needs.tech_features);
        matchScore += techScore;
      }

      return matchScore >= 0.7; // 70% 이상 매칭
    });
  }

  private async findHiddenGems(vehicles: Vehicle[]): Promise<Vehicle[]> {
    const gems = [];

    for (const vehicle of vehicles) {
      const marketValue = await this.getMarketValue(vehicle);
      const actualValue = await this.calculateActualValue(vehicle);

      // 시장가보다 실제 가치가 20% 이상 높으면 숨은 보석
      if (actualValue / marketValue >= 1.2) {
        gems.push({
          ...vehicle,
          hidden_gem_score: actualValue / marketValue,
          gem_reasons: this.identifyGemReasons(vehicle, marketValue, actualValue)
        });
      }
    }

    return gems;
  }
}
```

## 📊 데이터베이스 아키텍처

### 차량 데이터 모델

```sql
-- 차량 기본 정보 테이블
CREATE TABLE vehicles (
    vehicleid SERIAL PRIMARY KEY,
    manufacturer VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    modelyear INTEGER NOT NULL,
    price INTEGER NOT NULL, -- 만원 단위
    distance INTEGER, -- km
    fueltype VARCHAR(20),
    cartype VARCHAR(20),
    transmission VARCHAR(20),
    trim VARCHAR(100),
    colorname VARCHAR(30),
    location VARCHAR(50),

    -- 상세 정보
    engine_displacement INTEGER, -- cc
    fuel_efficiency DECIMAL(4,2), -- km/L
    trunk_capacity INTEGER, -- L
    seating_capacity INTEGER,

    -- 옵션 정보 (JSON 형태)
    options JSONB,
    safety_features JSONB,
    convenience_features JSONB,

    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- 인덱스
    INDEX idx_price_range (price),
    INDEX idx_location (location),
    INDEX idx_cartype_year (cartype, modelyear),
    INDEX idx_manufacturer_model (manufacturer, model)
);

-- 사용자 프로필 테이블
CREATE TABLE user_profiles (
    user_id SERIAL PRIMARY KEY,
    age_range VARCHAR(20),
    occupation VARCHAR(50),
    location VARCHAR(50),
    family_type VARCHAR(30),
    lifestyle_tags JSONB, -- ['골프', '드라이브', '가족'] 등
    preferences JSONB, -- 선호도 정보
    conversation_history JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 추천 기록 테이블 (학습용)
CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_profiles(user_id),
    vehicle_id INTEGER REFERENCES vehicles(vehicleid),
    recommendation_score DECIMAL(3,2),
    reasons JSONB,
    user_feedback INTEGER, -- 1-10 만족도
    actual_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 캐싱 전략

```typescript
class CachingStrategy {
  private redis: RedisClient;

  // 검색 결과 캐싱 (5분)
  async cacheSearchResults(criteria: string, results: Vehicle[]): Promise<void> {
    await this.redis.setex(`search:${criteria}`, 300, JSON.stringify(results));
  }

  // 시장 데이터 캐싱 (1시간)
  async cacheMarketData(key: string, data: MarketData): Promise<void> {
    await this.redis.setex(`market:${key}`, 3600, JSON.stringify(data));
  }

  // 사용자 세션 캐싱 (24시간)
  async cacheUserSession(sessionId: string, context: UserContext): Promise<void> {
    await this.redis.setex(`session:${sessionId}`, 86400, JSON.stringify(context));
  }
}
```

## 🔄 실시간 학습 시스템

### 피드백 루프 구현

```typescript
class FeedbackLearningSystem {
  private ml_model: RecommendationModel;

  async updateFromUserFeedback(feedback: UserFeedback): Promise<void> {
    // 1. 추천 성공/실패 패턴 분석
    const patterns = await this.analyzeRecommendationPatterns(feedback);

    // 2. 모델 가중치 조정
    await this.adjustModelWeights(patterns);

    // 3. 유사 사용자 그룹 업데이트
    await this.updateCollaborativeFilters(feedback);

    // 4. 에이전트 응답 품질 개선
    await this.improveAgentResponses(feedback);
  }

  private async analyzeRecommendationPatterns(feedback: UserFeedback): Promise<Pattern[]> {
    // 성공한 추천의 공통점 분석
    const successfulRecommendations = await this.getSuccessfulRecommendations(feedback.user_profile);

    return this.extractPatterns(successfulRecommendations);
  }
}
```

## 🚀 배포 및 운영 아키텍처

### 인프라 구성

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/carfin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=carfin
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 모니터링 시스템

```typescript
class MonitoringSystem {
  private metrics: MetricsCollector;

  // 응답 시간 모니터링
  async trackResponseTime(endpoint: string, duration: number): Promise<void> {
    await this.metrics.gauge('response_time', duration, { endpoint });
  }

  // 추천 정확도 모니터링
  async trackRecommendationAccuracy(accuracy: number): Promise<void> {
    await this.metrics.gauge('recommendation_accuracy', accuracy);
  }

  // 사용자 만족도 모니터링
  async trackUserSatisfaction(satisfaction: number): Promise<void> {
    await this.metrics.histogram('user_satisfaction', satisfaction);
  }
}
```

이 기술 아키텍처는 CarFin AI의 핵심 가치인 "귀찮은 걸 다 대신해주는" 서비스를 실현하기 위한 견고하고 확장 가능한 기술 기반을 제공합니다.